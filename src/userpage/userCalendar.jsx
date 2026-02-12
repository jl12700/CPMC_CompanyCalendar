// src/pages/user/UserCalendar.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

import MonthView from '../components/calendar/MonthView';
import DateUtils from '../utils/dateUtils';
import { useEvents } from '../hooks/useEvents';
import UserLayout from '../components/layout/UserLayout';
import { EVENT_STATUS, getStatusStyles, formatStatus } from '../lib/supabase';
import { Calendar, Clock, MapPin, User, X, AlertCircle, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

export default function UserCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [successType, setSuccessType] = useState('success');
  const [pickerOpen, setPickerOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 3;

  const { 
    events, 
    loading, 
    getCalendarEvents,
    getUpcomingScheduledEvents,
  } = useEvents();
  
  const location = useLocation();
  const pickerRef = useRef(null);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setSuccessType(location.state.type || 'success');
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setSuccessType('success');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Helper function to get facilitator display name
  const getFacilitatorDisplayName = (event) => {
    if (!event) return 'Unknown';
    
    // Check for facilitator field first
    if (event.facilitator) {
      return event.facilitator;
    }
    
    // Fallback to created_by if facilitator not set
    if (event.created_by && !event.created_by.includes('-') && event.created_by.length < 50) {
      return event.created_by;
    }
    
    return 'Not assigned';
  };

  // Helper function to get created by display name
  const getCreatedByDisplayName = (event) => {
    if (!event) return 'Unknown';
    
    if (event.created_by_name) {
      return event.created_by_name;
    }
    
    if (event.created_by && !event.created_by.includes('-') && event.created_by.length < 50) {
      return event.created_by;
    }
    
    return 'Unknown User';
  };

  // Helper function to check if event is in the past
  const isEventPast = (event) => {
    if (!event.event_date) return false;
    const eventDate = new Date(event.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today;
  };

  // Helper function to get events for current month only
  const getMonthlyEvents = (allEvents) => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    monthStart.setHours(0, 0, 0, 0);
    monthEnd.setHours(23, 59, 59, 999);

    return allEvents.filter(event => {
      if (!event.event_date) return false;
      const eventDate = new Date(event.event_date);
      return eventDate >= monthStart && eventDate <= monthEnd;
    });
  };

  // Helper function to get monthly event counts
  const getMonthlyEventCounts = () => {
    const monthlyEvents = getMonthlyEvents(events);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingEvents = monthlyEvents.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate >= today;
    });

    const scheduled = upcomingEvents.filter(e => e.status === EVENT_STATUS.SCHEDULED).length;
    const postponed = upcomingEvents.filter(e => e.status === EVENT_STATUS.POSTPONED).length;
    const cancelled = upcomingEvents.filter(e => e.status === EVENT_STATUS.CANCELLED).length;

    return {
      upcoming: scheduled,
      postponed,
      cancelled,
      total: monthlyEvents.length,
    };
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setPickerOpen(false);
      }
    };

    if (pickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pickerOpen]);

  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && selectedEvent) {
        handleCloseModal();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [selectedEvent]);

  // Reset page to 1 when month changes
  useEffect(() => {
    setCurrentPage(1);
  }, [currentDate]);

  /* ================= DATA ================= */
  const monthlyEventCounts = getMonthlyEventCounts();
  
  const calendarEvents = getCalendarEvents().map(event => ({
    ...event,
    start: new Date(`${event.event_date}T${event.start_time}`),
    end: new Date(`${event.event_date}T${event.end_time}`),
    id: event.id,
    isPast: isEventPast(event)
  }));

  // Get upcoming events for current month only
  const monthlyUpcomingEvents = getMonthlyEvents(getUpcomingScheduledEvents(1000))
    .filter(event => !isEventPast(event))
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
  
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = monthlyUpcomingEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(monthlyUpcomingEvents.length / eventsPerPage);

  const handleNext = useCallback(() => {
    setCurrentDate(DateUtils.navigateMonth(currentDate, 'next'));
  }, [currentDate]);

  const handlePrev = useCallback(() => {
    setCurrentDate(DateUtils.navigateMonth(currentDate, 'prev'));
  }, [currentDate]);

  const handleEventClick = useCallback((event) => {
    setSelectedEvent(event);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  const handleTodayClick = useCallback(() => {
    setCurrentDate(new Date());
    setPickerOpen(false);
  }, []);

  const handleMonthSelect = useCallback((month) => {
    setCurrentDate(month);
    setPickerOpen(false);
  }, []);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  /* ================= RENDER ================= */
  return (
    <UserLayout>
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-1 py-1 space-y-4 text-left">
        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Team Calendar
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              View all the Events in Calendar
            </p>
          </div>
        </div>

        {/* Success/Error Message */}
        {successMessage && (
          <div className={`p-4 rounded-lg text-sm font-medium animate-fade-in flex items-start gap-3 ${
            successType === 'error' 
              ? 'bg-red-50 border border-red-200 text-red-700' 
              : 'bg-blue-50 border border-blue-200 text-blue-700'
          }`}>
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>{successMessage}</div>
          </div>
        )}

        {/* ================= TOOLBAR ================= */}
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 relative" ref={pickerRef}>
              <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                <button
                  onClick={handlePrev}
                  aria-label="Previous month"
                  className="px-3 py-2 hover:bg-gray-50 active:bg-gray-100 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  ‹
                </button>

                <button
                  onClick={handleTodayClick}
                  className="px-4 py-2 text-sm font-semibold border-x border-slate-200 hover:bg-gray-50 active:bg-gray-100 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  Today
                </button>

                <button
                  onClick={handleNext}
                  aria-label="Next month"
                  className="px-3 py-2 hover:bg-gray-50 active:bg-gray-100 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  ›
                </button>
              </div>

              <button
                onClick={() => setPickerOpen(!pickerOpen)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg bg-white shadow-sm text-sm font-semibold hover:bg-gray-50 active:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {format(currentDate, 'MMMM yyyy')}
                <span className="text-slate-400">▾</span>
              </button>

              {pickerOpen && (
                <div className="absolute top-12 left-0 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-30">
                  <DayPicker
                    mode="single"
                    captionLayout="dropdown"
                    month={currentDate}
                    onMonthChange={handleMonthSelect}
                    className="text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= MAIN CONTENT ================= */}
        {loading && !events.length ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Calendar */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px]">
              <MonthView
                currentDate={currentDate}
                events={calendarEvents}
                onEventClick={handleEventClick}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Event Status Overview - Monthly */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Event Overview
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  {format(currentDate, 'MMMM yyyy')}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg text-center border border-blue-100">
                    <span className="block text-2xl font-bold text-blue-600">
                      {monthlyEventCounts.upcoming}
                    </span>
                    <span className="text-xs text-blue-600 font-medium">
                      Upcoming
                    </span>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg text-center border border-yellow-100">
                    <span className="block text-2xl font-bold text-yellow-600">
                      {monthlyEventCounts.postponed}
                    </span>
                    <span className="text-xs text-yellow-600 font-medium">
                      Postponed
                    </span>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg text-center border border-red-100">
                    <span className="block text-2xl font-bold text-red-600">
                      {monthlyEventCounts.cancelled}
                    </span>
                    <span className="text-xs text-red-600 font-medium">
                      Cancelled
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center border border-gray-100">
                    <span className="block text-2xl font-bold text-gray-600">
                      {monthlyEventCounts.total}
                    </span>
                    <span className="text-xs text-gray-600 font-medium">
                      Total
                    </span>
                  </div>
                </div>
              </div>

              {/* Upcoming Events with Pagination - Monthly */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Coming Up
                  </h3>
                  <span className="text-xs text-slate-500">
                    {monthlyUpcomingEvents.length} events
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  {format(currentDate, 'MMMM yyyy')}
                </p>

                {currentEvents.length ? (
                  <div className="space-y-3 mb-4">
                    {currentEvents.map(event => {
                      const styles = getStatusStyles(event.status);
                      
                      return (
                        <button
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className={`w-full text-left p-3 border rounded-lg cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${styles.border} ${styles.bg}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <h4 className={`font-semibold text-sm truncate ${styles.text}`}>
                              {event.title}
                            </h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${styles.badge}`}>
                              {formatStatus(event.status)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <p className="text-xs text-slate-500">
                              {DateUtils.formatDate(new Date(event.event_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <p className="text-xs text-slate-500">
                              {DateUtils.formatTime(event.start_time)} - {DateUtils.formatTime(event.end_time)}
                            </p>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2 mt-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <p className="text-xs text-slate-500 truncate">
                                {event.location}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <p className="text-xs text-slate-500 truncate">
                              Facilitator: {getFacilitatorDisplayName(event)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                            <User className="w-3 h-3" />
                            <p className="truncate">
                              Created by: {getCreatedByDisplayName(event)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Calendar className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-slate-400 text-sm">
                      No upcoming events in {format(currentDate, 'MMMM yyyy')}
                    </p>
                  </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className={`flex items-center gap-1 px-3 py-1 text-sm rounded-md ${
                        currentPage === 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => handlePageClick(page)}
                          className={`w-8 h-8 flex items-center justify-center text-sm rounded-md ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className={`flex items-center gap-1 px-3 py-1 text-sm rounded-md ${
                        currentPage === totalPages
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                      }`}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {/* Page Info */}
                {totalPages > 0 && (
                  <div className="text-center text-xs text-slate-500 mt-2">
                    Showing {indexOfFirstEvent + 1}-{Math.min(indexOfLastEvent, monthlyUpcomingEvents.length)} of {monthlyUpcomingEvents.length} events
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW-ONLY EVENT MODAL ================= */}
        {selectedEvent && (
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
            onClick={handleCloseModal}
          >
            <div 
              className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(selectedEvent.status).badge}`}>
                        {formatStatus(selectedEvent.status)}
                      </span>
                      {selectedEvent.original_date && selectedEvent.status === EVENT_STATUS.POSTPONED && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Originally: {DateUtils.formatDate(new Date(selectedEvent.original_date), 'MMM d')}
                        </span>
                      )}
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        <Eye className="w-3 h-3 mr-1" />
                        View Only
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 pr-4">
                      {selectedEvent.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Facilitator: {getFacilitatorDisplayName(selectedEvent)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Created by: {getCreatedByDisplayName(selectedEvent)}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 ml-2"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Event Details */}
                {(selectedEvent.status === EVENT_STATUS.SCHEDULED || selectedEvent.status === EVENT_STATUS.POSTPONED) && (
                  <div className="space-y-4 mt-4">
                    {selectedEvent.event_date && (
                      <div className="flex items-start">
                        <div className="w-6 mr-3 mt-0.5">
                          <Calendar className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500">Date</p>
                          <p className="text-slate-900">
                            {DateUtils.formatDate(new Date(selectedEvent.event_date), 'EEEE, MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedEvent.start_time && selectedEvent.end_time && (
                      <div className="flex items-start">
                        <div className="w-6 mr-3 mt-0.5">
                          <Clock className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500">Time</p>
                          <p className="text-slate-900">
                            {DateUtils.formatTime(selectedEvent.start_time)} - {DateUtils.formatTime(selectedEvent.end_time)}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedEvent.location && (
                      <div className="flex items-start">
                        <div className="w-6 mr-3 mt-0.5">
                          <MapPin className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500">Location</p>
                          <p className="text-slate-900">
                            {selectedEvent.location}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedEvent.description && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-sm font-medium text-slate-500 mb-2">Required Attendees</p>
                        <p className="text-slate-700 text-sm bg-slate-50 p-3 rounded-lg">
                          {selectedEvent.description}
                        </p>
                      </div>
                    )}

                    {selectedEvent.postponed_reason && selectedEvent.status === EVENT_STATUS.POSTPONED && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-sm font-medium text-yellow-600 mb-2">Reason for Postponement</p>
                        <p className="text-slate-700 text-sm bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                          {selectedEvent.postponed_reason}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedEvent.status === EVENT_STATUS.CANCELLED && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">
                      This event has been cancelled.
                    </p>
                  </div>
                )}

                {/* View-only notice */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-700 text-sm flex items-start gap-2">
                    <Eye className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>You have read-only access. Contact your administrator to create or modify events.</span>
                  </p>
                </div>

                {/* Close button only */}
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <button
                    onClick={handleCloseModal}
                    className="w-full flex justify-center items-center px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add CSS animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scale-in {
          from { 
            opacity: 0;
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </UserLayout>
  );
}