// src/services/calendarService.js
import { supabase, TABLES, EVENT_STATUS } from '../lib/supabase';

/**
 * SHARED EVENT SYSTEM
 * - All users can see all events (SELECT policy: true)
 * - Only event creators can modify/delete their events (UPDATE/DELETE policy: auth.uid() = user_id)
 * - RLS enforces these rules at the database level
 */

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

    // Prepare event data with ownership fields
    const eventWithUser = {
      ...eventData,
      user_id: user.id,
      created_by: user.id, // Explicit ownership
      status: eventData.status || EVENT_STATUS.SCHEDULED,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Creating event with data:', {
      ...eventWithUser,
      user_id: `${user.id.substring(0, 8)}...`,
      created_by: `${user.id.substring(0, 8)}...`
    });

    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .insert([eventWithUser])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      
      // Provide specific error messages
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

/**
 * Get all events (shared calendar)
 * RLS policy allows all authenticated users to see all events
 */
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

    console.log('Fetching all shared events for user:', user.id.substring(0, 8) + '...');

    // CRITICAL CHANGE: Remove user_id filter to fetch ALL events
    // RLS will ensure user can only see what they're allowed to see
    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .select('*')
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Supabase fetch error:', error);
      throw error;
    }

    console.log('Fetched shared events:', data?.length || 0);
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching events:', error);
    return { 
      data: [], 
      error: error.message || 'Failed to fetch events' 
    };
  }
};

/**
 * Check for scheduling conflicts across all events
 * Conflicts should be checked against ALL scheduled events, not just user's own
 */
const checkConflicts = async (date, startTime, endTime, excludeEventId = null) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { conflicts: [], hasConflicts: false, error: null };
    }

    // Check against ALL scheduled events, not just user's events
    let query = supabase
      .from(TABLES.EVENTS)
      .select('*')
      .eq('event_date', date)
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

/**
 * Update event - RLS ensures only creator can update
 */
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

    // RLS will automatically prevent update if user is not the creator
    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      // Check if it's a permission error
      if (error.code === '42501' || error.message.includes('policy')) {
        throw new Error('You can only modify events you created');
      }
      throw error;
    }

    // If no data returned, the update was blocked by RLS
    if (!data) {
      throw new Error('You can only modify events you created');
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating event:', error);
    return { 
      data: null, 
      error: error.message || 'Failed to update event' 
    };
  }
};

/**
 * Delete event - RLS ensures only creator can delete
 */
const deleteEvent = async (eventId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('You must be logged in to delete events');
    }

    // RLS will automatically prevent deletion if user is not the creator
    const { error, count } = await supabase
      .from(TABLES.EVENTS)
      .delete({ count: 'exact' })
      .eq('id', eventId);

    if (error) {
      // Check if it's a permission error
      if (error.code === '42501' || error.message.includes('policy')) {
        throw new Error('You can only delete events you created');
      }
      throw error;
    }

    // If count is 0, the delete was blocked by RLS
    if (count === 0) {
      throw new Error('You can only delete events you created');
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting event:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to delete event' 
    };
  }
};

/**
 * Get event by ID - all users can view, but context determines what actions are available
 */
const getEventById = async (eventId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('You must be logged in to view events');
    }

    // RLS allows viewing all events, no user_id filter needed
    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: 'Event not found' };
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

/**
 * Check if current user is the owner of an event
 */
const isEventOwner = async (eventId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .select('created_by, user_id')
      .eq('id', eventId)
      .single();

    if (error || !data) {
      return false;
    }

    // Check both created_by and user_id for backwards compatibility
    return data.created_by === user.id || data.user_id === user.id;
  } catch (error) {
    console.error('Error checking event ownership:', error);
    return false;
  }
};

/**
 * Get current user ID
 */
const getCurrentUserId = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

const calendarService = {
  createEvent,
  getEvents,
  checkConflicts,
  updateEvent,
  deleteEvent,
  getEventById,
  isEventOwner,
  getCurrentUserId,
};

export default calendarService;