// src/hooks/useEvents.js
import { useState, useEffect } from 'react';
import calendarService from '../services/calendarService';

export const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const getEvents = async () => {
    setLoading(true);
    const { data, error } = await calendarService.getEvents();
    if (!error) setEvents(data);
    else console.error(error);
    setLoading(false);
  };

  const createEvent = async (eventData) => {
    setLoading(true);
    const { data, error } = await calendarService.createEvent(eventData);
    setLoading(false);
    return { success: !error, data, error };
  };

  const checkConflicts = async (date, startTime, endTime, excludeEventId) => {
    return calendarService.checkConflicts(date, startTime, endTime, excludeEventId);
  };

  return {
    events,
    loading,
    getEvents,
    createEvent,
    checkConflicts,
  };
};
