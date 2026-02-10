// src/services/calendarService.js
import { supabase, TABLES, EVENT_STATUS } from '../lib/supabase';

const createEvent = async (eventData) => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Auth error:', userError);
      throw new Error('Authentication error. Please log in again.');
    }
    
    if (!user) {
      throw new Error('You must be logged in to create events');
    }

    // Prepare event data
    const eventWithUser = {
      ...eventData,
      user_id: user.id,
      status: eventData.status || EVENT_STATUS.SCHEDULED,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Log for debugging
    console.log('Creating event with data:', {
      ...eventWithUser,
      user_id: `${user.id.substring(0, 8)}...` // Mask full user ID for logs
    });

    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .insert([eventWithUser])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      
      // Provide more specific error messages
      if (error.code === '23502') {
        throw new Error('Missing required field: ' + (error.message.includes('user_id') ? 'User not found' : 'Please fill all required fields'));
      }
      if (error.code === '23505') {
        throw new Error('Event already exists with these details');
      }
      if (error.code === '42501') {
        throw new Error('Permission denied. Please check your access rights.');
      }
      
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating event:', error);
    return { 
      data: null, 
      error: error.message || 'Failed to create event. Please try again.' 
    };
  }
};

const getEvents = async () => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Auth error:', userError);
      return { data: [], error: 'Authentication error' };
    }
    
    if (!user) {
      console.log('No user found, returning empty events');
      return { data: [], error: null };
    }

    console.log('Fetching events for user:', user.id.substring(0, 8) + '...');

    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .select('*')
      .eq('user_id', user.id)
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Supabase fetch error:', error);
      throw error;
    }

    console.log('Fetched events:', data?.length || 0);
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching events:', error);
    return { 
      data: [], 
      error: error.message || 'Failed to fetch events' 
    };
  }
};

const checkConflicts = async (date, startTime, endTime, excludeEventId = null) => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { conflicts: [], hasConflicts: false, error: null };
    }

    let query = supabase
      .from(TABLES.EVENTS)
      .select('*')
      .eq('event_date', date)
      .eq('user_id', user.id)
      .eq('status', EVENT_STATUS.SCHEDULED);

    if (excludeEventId) {
      query = query.neq('id', excludeEventId);
    }

    const { data: events, error } = await query;
    
    if (error) {
      console.error('Conflict check error:', error);
      throw error;
    }

    // Convert times to minutes for easier comparison
    const toMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const newStart = toMinutes(startTime);
    const newEnd = toMinutes(endTime);

    const conflicts = (events || []).filter((event) => {
      const eventStart = toMinutes(event.start_time);
      const eventEnd = toMinutes(event.end_time);
      
      return (
        (newStart >= eventStart && newStart < eventEnd) ||
        (newEnd > eventStart && newEnd <= eventEnd) ||
        (newStart <= eventStart && newEnd >= eventEnd)
      );
    });

    return { 
      conflicts, 
      hasConflicts: conflicts.length > 0, 
      error: null 
    };
  } catch (error) {
    console.error('Error checking conflicts:', error);
    return { 
      conflicts: [], 
      hasConflicts: false, 
      error: error.message || 'Failed to check conflicts' 
    };
  }
};

const updateEvent = async (eventId, eventData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('You must be logged in to update events');
    }

    const updateData = {
      ...eventData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .update(updateData)
      .eq('id', eventId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating event:', error);
    return { 
      data: null, 
      error: error.message || 'Failed to update event' 
    };
  }
};

const deleteEvent = async (eventId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('You must be logged in to delete events');
    }

    const { error } = await supabase
      .from(TABLES.EVENTS)
      .delete()
      .eq('id', eventId)
      .eq('user_id', user.id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting event:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to delete event' 
    };
  }
};

const getEventById = async (eventId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('You must be logged in to view events');
    }

    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .select('*')
      .eq('id', eventId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: 'Event not found or access denied' };
      }
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching event:', error);
    return { 
      data: null, 
      error: error.message || 'Failed to fetch event' 
    };
  }
};

const calendarService = {
  createEvent,
  getEvents,
  checkConflicts,
  updateEvent,
  deleteEvent,
  getEventById,
};

export default calendarService;