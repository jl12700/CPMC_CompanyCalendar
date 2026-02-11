import { useState, useEffect, useCallback, useRef } from 'react';
import calendarService from '../services/calendarService';
import { EVENT_STATUS, isEventActive } from '../lib/supabase';

export const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const isFetchingRef = useRef(false);

  // Get current user ID on mount
  useEffect(() => {
    const fetchUserId = async () => {
      const userId = await calendarService.getCurrentUserId();
      setCurrentUserId(userId);
    };
    fetchUserId();
  }, []);

  const fetchEvents = useCallback(async (showLoading = true) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (showLoading) setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await calendarService.getEvents();

      if (fetchError) {
        setError(fetchError);
        setEvents([]);
      } else {
        setEvents(data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch events');
      setEvents([]);
    } finally {
      if (showLoading) setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // CRUD Actions
  const createEvent = async (eventData) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: createError } = await calendarService.createEvent(eventData);

      if (createError) {
        setError(createError);
        return { success: false, data: null, error: createError };
      }

      setEvents(prev =>
        [...prev, data].sort((a, b) => {
          if (a.event_date === b.event_date) {
            return a.start_time.localeCompare(b.start_time);
          }
          return new Date(a.event_date) - new Date(b.event_date);
        })
      );

      return { success: true, data, error: null };
    } catch (err) {
      const msg = err.message || 'Failed to create event';
      setError(msg);
      return { success: false, data: null, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (eventId, eventData) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await calendarService.updateEvent(eventId, eventData);

      if (updateError) {
        setError(updateError);
        return { success: false, data: null, error: updateError };
      }

      setEvents(prev =>
        prev.map(event =>
          event.id === eventId ? { ...event, ...data } : event
        )
      );

      return { success: true, data, error: null };
    } catch (err) {
      const msg = err.message || 'Failed to update event';
      setError(msg);
      return { success: false, data: null, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId) => {
    setLoading(true);
    setError(null);

    try {
      const { success, error: deleteError } = await calendarService.deleteEvent(eventId);

      if (!success || deleteError) {
        setError(deleteError);
        return { success: false, error: deleteError };
      }

      setEvents(prev => prev.filter(event => event.id !== eventId));

      return { success: true, error: null };
    } catch (err) {
      const msg = err.message || 'Failed to delete event';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // Utilities
  const checkConflicts = async (date, startTime, endTime, excludeEventId) => {
    try {
      return await calendarService.checkConflicts(
        date,
        startTime,
        endTime,
        excludeEventId
      );
    } catch (err) {
      return {
        conflicts: [],
        hasConflicts: false,
        error: err.message || 'Failed to check conflicts'
      };
    }
  };

  const getEventById = async (eventId) => {
    setLoading(true);
    setError(null);

    try {
      return await calendarService.getEventById(eventId);
    } catch (err) {
      const msg = err.message || 'Failed to fetch event';
      setError(msg);
      return { data: null, error: msg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if current user owns an event
   */
  const isOwner = (event) => {
    if (!currentUserId || !event) return false;
    // Check both created_by and user_id for backwards compatibility
    return event.created_by === currentUserId || event.user_id === currentUserId;
  };

  /**
   * Check if current user can modify an event
   */
  const canModify = (event) => {
    return isOwner(event);
  };

  // Status-specific helpers
  const getActiveEvents = () => {
    return events.filter(event => isEventActive(event.status));
  };

  const getScheduledEvents = () => {
    return events.filter(event => event.status === EVENT_STATUS.SCHEDULED);
  };

  const getPostponedEvents = () => {
    return events.filter(event => event.status === EVENT_STATUS.POSTPONED);
  };

  const getCancelledEvents = () => {
    return events.filter(event => event.status === EVENT_STATUS.CANCELLED);
  };

  const getUpcomingScheduledEvents = (limit = 5) => {
    const today = new Date().toISOString().split('T')[0];
    return events
      .filter(event => 
        event.status === EVENT_STATUS.SCHEDULED && 
        event.event_date >= today
      )
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
      .slice(0, limit);
  };

  const getCalendarEvents = () => {
    return events.filter(event => 
      event.status === EVENT_STATUS.SCHEDULED || 
      event.status === EVENT_STATUS.POSTPONED
    );
  };

  /**
   * Get events created by the current user
   */
  const getMyEvents = () => {
    if (!currentUserId) return [];
    return events.filter(event => isOwner(event));
  };

  /**
   * Get events created by other users
   */
  const getOthersEvents = () => {
    if (!currentUserId) return [];
    return events.filter(event => !isOwner(event));
  };

  // Event counts by status
  const getEventCounts = () => {
    const scheduled = events.filter(e => e.status === EVENT_STATUS.SCHEDULED).length;
    const postponed = events.filter(e => e.status === EVENT_STATUS.POSTPONED).length;
    const cancelled = events.filter(e => e.status === EVENT_STATUS.CANCELLED).length;
    
    return {
      scheduled,
      postponed,
      cancelled,
      total: events.length,
      active: scheduled + postponed,
      myEvents: getMyEvents().length,
      othersEvents: getOthersEvents().length,
    };
  };

  const refreshEvents = () => {
    fetchEvents(false);
  };

  const getTodaysEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(event => event.event_date === today);
  };

  const getUpcomingEvents = (days = 7) => {
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + days);

    return events.filter(event => {
      const d = new Date(event.event_date);
      return d >= today && d <= future;
    });
  };

  return {
    // State
    events,
    loading,
    error,
    currentUserId,

    // Actions
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents,
    fetchEvents: refreshEvents,
    checkConflicts,
    getEventById,

    // Ownership checks
    isOwner,
    canModify,
    getMyEvents,
    getOthersEvents,

    // Status-specific helpers
    getActiveEvents,
    getScheduledEvents,
    getPostponedEvents,
    getCancelledEvents,
    getUpcomingScheduledEvents,
    getCalendarEvents,
    getEventCounts,

    // Original helpers
    getTodaysEvents,
    getUpcomingEvents
  };
};