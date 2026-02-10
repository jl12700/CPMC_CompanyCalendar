// src/services/calendarService.js
import { supabase, TABLES, EVENT_STATUS } from '../lib/supabase';

const createEvent = async (eventData) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .insert([
        {
          ...eventData,
          status: eventData.status || EVENT_STATUS.SCHEDULED,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating event:', error);
    return { data: null, error };
  }
};

const getEvents = async () => {
  try {
    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .select('*')
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching events:', error);
    return { data: null, error };
  }
};

const checkConflicts = async (date, startTime, endTime, excludeEventId = null) => {
  try {
    let query = supabase
      .from(TABLES.EVENTS)
      .select('*')
      .eq('event_date', date)
      .eq('status', EVENT_STATUS.SCHEDULED);

    if (excludeEventId) query = query.neq('id', excludeEventId);

    const { data: events, error } = await query;
    if (error) throw error;

    const conflicts = events.filter((event) => {
      return (
        (startTime >= event.start_time && startTime < event.end_time) ||
        (endTime > event.start_time && endTime <= event.end_time) ||
        (startTime <= event.start_time && endTime >= event.end_time)
      );
    });

    return { conflicts, hasConflicts: conflicts.length > 0, error: null };
  } catch (error) {
    console.error('Error checking conflicts:', error);
    return { conflicts: [], hasConflicts: false, error };
  }
};

const calendarService = {
  createEvent,
  getEvents,
  checkConflicts,
};

export default calendarService;
