// src/hooks/useEvents.js
import { useState, useEffect, useCallback } from 'react';
import calendarService from '../services/calendarService';

export const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await calendarService.getEvents();
      
      if (fetchError) {
        setError(fetchError);
        setEvents([]);
      } else {
        setEvents(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch events');
      setEvents([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (eventData) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: createError } = await calendarService.createEvent(eventData);
      
      if (createError) {
        setError(createError);
        return { success: false, data: null, error: createError };
      }
      
      // Add to local state
      setEvents(prev => {
        const newEvents = [...prev, data];
        // Sort by date then time
        return newEvents.sort((a, b) => {
          if (a.event_date === b.event_date) {
            return a.start_time.localeCompare(b.start_time);
          }
          return new Date(a.event_date) - new Date(b.event_date);
        });
      });
      
      return { success: true, data, error: null };
    } catch (err) {
      const errorMsg = err.message || 'Failed to create event';
      setError(errorMsg);
      return { success: false, data: null, error: errorMsg };
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
      
      // Update in local state
      setEvents(prev => 
        prev.map(event => 
          event.id === eventId ? { ...event, ...data } : event
        )
      );
      
      return { success: true, data, error: null };
    } catch (err) {
      const errorMsg = err.message || 'Failed to update event';
      setError(errorMsg);
      return { success: false, data: null, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId) => {
    setLoading(true);
    setError(null);
    
    try {
      const { success, error: deleteError } = await calendarService.deleteEvent(eventId);
      
      if (deleteError) {
        setError(deleteError);
        return { success: false, error: deleteError };
      }
      
      // Remove from local state
      setEvents(prev => prev.filter(event => event.id !== eventId));
      
      return { success: true, error: null };
    } catch (err) {
      const errorMsg = err.message || 'Failed to delete event';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const checkConflicts = async (date, startTime, endTime, excludeEventId) => {
    try {
      return await calendarService.checkConflicts(date, startTime, endTime, excludeEventId);
    } catch (err) {
      console.error('Conflict check failed:', err);
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
      const errorMsg = err.message || 'Failed to fetch event';
      setError(errorMsg);
      return { data: null, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const refreshEvents = () => {
    fetchEvents(false); // Don't show loading indicator for refresh
  };

  // Helper to get today's events
  const getTodaysEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(event => event.event_date === today);
  };

  // Helper to get upcoming events
  const getUpcomingEvents = (days = 7) => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    return events.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate >= today && eventDate <= futureDate;
    });
  };

  return {
    // State
    events,
    loading,
    error,
    
    // Actions
    createEvent,
    updateEvent,
    deleteEvent,
    checkConflicts,
    getEventById,
    refreshEvents,
    
    // Helpers
    getTodaysEvents,
    getUpcomingEvents,
    
    // Alias
    fetchEvents: refreshEvents,
  };
};