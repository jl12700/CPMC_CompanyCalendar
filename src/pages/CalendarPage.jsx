// src/pages/CalendarPage.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import MonthView from '../components/calendar/MonthView';
import WeekView from '../components/calendar/WeekView';
import DateUtils from '../utils/dateUtils';
import { useEvents } from '../hooks/useEvents';
import MainLayout from '../components/layout/MainLayout';
import { EVENT_STATUS } from '../lib/supabase';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const { events, loading, error, refreshEvents, deleteEvent } = useEvents();
  const location = useLocation();

  // Check for success message from navigation
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Filter only scheduled events
  const scheduledEvents = events.filter(event => 
    event.status === EVENT_STATUS.SCHEDULED
  );

  const handleNext = () => {
    const newDate =
      viewMode === 'month'
        ? DateUtils.navigateMonth(currentDate, 'next')
        : DateUtils.navigateWeek(currentDate, 'next');
    setCurrentDate(newDate);
  };

  const handlePrev = () => {
    const newDate =
      viewMode === 'month'
        ? DateUtils.navigateMonth(currentDate, 'prev')
        : DateUtils.navigateWeek(currentDate, 'prev');
    setCurrentDate(newDate);
  };

  const handleDateClick = (date) => {
    console.log('Date clicked:', date);
    // Optional: Navigate to create event with pre-filled date
    // navigate(`/create-event?date=${date.toISOString().split('T')[0]}`);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    if (window.confirm(`Are you sure you want to delete "${selectedEvent.title}"?`)) {
      const { success } = await deleteEvent(selectedEvent.id);
      if (success) {
        setSelectedEvent(null);
        refreshEvents();
      }
    }
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  // Format events for calendar views
  const formatEventsForCalendar = (events) => {
    return events.map(event => ({
      ...event,
      start: new Date(`${event.event_date}T${event.start_time}`),
      end: new Date(`${event.event_date}T${event.end_time}`),
    }));
  };

  const calendarEvents = formatEventsForCalendar(scheduledEvents);

  // Calculate upcoming events
  const upcomingEvents = scheduledEvents
    .filter(event => new Date(event.event_date) >= new Date())
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
    .slice(0, 5);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Calendar</h1>
              <p className="text-gray-600 mt-1">
                Manage your schedule and upcoming events
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/create-event"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                New Event
              </Link>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800 font-medium">{successMessage}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-800 font-medium">Error: {error}</span>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handlePrev}
                  className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                </button>
                
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 min-w-[200px] text-center">
                  {viewMode === 'month' 
                    ? DateUtils.formatDate(currentDate, 'MMMM yyyy')
                    : DateUtils.formatWeekRange(currentDate)}
                </h2>
                
                <button
                  onClick={handleNext}
                  className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
                
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  Today
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                    viewMode === 'month'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                  disabled={loading}
                >
                  Month
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                    viewMode === 'week'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                  disabled={loading}
                >
                  Week
                </button>
                <button
                  onClick={refreshEvents}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                  title="Refresh events"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && !events.length ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading events...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar View */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {viewMode === 'month' ? (
                  <MonthView
                    currentDate={currentDate}
                    events={calendarEvents}
                    onDateClick={handleDateClick}
                    onEventClick={handleEventClick}
                  />
                ) : (
                  <WeekView
                    currentDate={currentDate}
                    events={calendarEvents}
                    onEventClick={handleEventClick}
                  />
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Events */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-4">Upcoming Events</h3>
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingEvents.map((event) => (
                      <div 
                        key={event.id}
                        className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer transition"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {DateUtils.formatTime(event.start_time)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {DateUtils.formatDate(new Date(event.event_date), 'EEE, MMM d')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No upcoming events scheduled</p>
                )}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link
                    to="/create-event"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Schedule New Event
                  </Link>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-4">Calendar Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Events</span>
                    <span className="font-medium text-gray-900">{scheduledEvents.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Upcoming</span>
                    <span className="font-medium text-gray-900">{upcomingEvents.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Today</span>
                    <span className="font-medium text-gray-900">
                      {scheduledEvents.filter(e => e.event_date === new Date().toISOString().split('T')[0]).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Event Details Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{selectedEvent.title}</h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">
                      {DateUtils.formatDate(new Date(selectedEvent.event_date), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Start Time</p>
                      <p className="font-medium">{DateUtils.formatTime(selectedEvent.start_time)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">End Time</p>
                      <p className="font-medium">{DateUtils.formatTime(selectedEvent.end_time)}</p>
                    </div>
                  </div>
                  
                  {selectedEvent.description && (
                    <div>
                      <p className="text-sm text-gray-500">Description</p>
                      <p className="mt-1 text-gray-700 whitespace-pre-wrap">{selectedEvent.description}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedEvent.status === EVENT_STATUS.SCHEDULED
                        ? 'bg-green-100 text-green-800'
                        : selectedEvent.status === EVENT_STATUS.CANCELLED
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <Link
                    to={`/edit-event/${selectedEvent.id}`}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={handleDeleteEvent}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}