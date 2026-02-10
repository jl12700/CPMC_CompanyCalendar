import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

import MonthView from '../components/calendar/MonthView';
import DateUtils from '../utils/dateUtils';
import { useEvents } from '../hooks/useEvents';
import MainLayout from '../components/layout/MainLayout';
import { EVENT_STATUS, getStatusStyles, formatStatus } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, MapPin, User, X, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); 
  const [successMessage, setSuccessMessage] = useState('');
  const [successType, setSuccessType] = useState('success');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [userName, setUserName] = useState('');
  
  
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 3;

  const { 
    events, 
    loading, 
    deleteEvent, 
    updateEvent,
    getScheduledEvents,
    getPostponedEvents,
    getCancelledEvents,
    getUpcomingScheduledEvents,
    getCalendarEvents,
    getEventCounts
  } = useEvents();
  
  const location = useLocation();
  const pickerRef = useRef(null);

  
  useEffect(() => {
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata.full_name || 'Unknown');
      }
    };
    getUser();

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
      if (event.key === 'Escape') {
        if (pendingAction) {
          setPendingAction(null);
        } else if (selectedEvent) {
          handleCloseModal();
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [selectedEvent, pendingAction]);

  /* ================= DATA ================= */
  const scheduledEvents = getScheduledEvents();
  const postponedEvents = getPostponedEvents();
  const cancelledEvents = getCancelledEvents();
  const eventCounts = getEventCounts();
  
  const calendarEvents = getCalendarEvents().map(event => ({
    ...event,
    start: new Date(`${event.event_date}T${event.start_time}`),
    end: new Date(`${event.event_date}T${event.end_time}`),
    id: event.id
  }));

  const upcomingEvents = getUpcomingScheduledEvents(20); 
  
  
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = upcomingEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(upcomingEvents.length / eventsPerPage);

  
  const handleNext = useCallback(() => {
    setCurrentDate(DateUtils.navigateMonth(currentDate, 'next'));
  }, [currentDate]);

  const handlePrev = useCallback(() => {
    setCurrentDate(DateUtils.navigateMonth(currentDate, 'prev'));
  }, [currentDate]);

  const handleEventClick = useCallback((event) => {
    setSelectedEvent(event);
  }, []);

  const handleDeleteEvent = useCallback(async () => {
    if (!selectedEvent) return;
   
    setPendingAction({
      type: 'delete',
      title: 'Delete Event',
      message: `Are you sure you want to permanently delete "${selectedEvent.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      confirmColor: 'red'
    });
  }, [selectedEvent]);

  const executeDeleteEvent = useCallback(async () => {
    if (!selectedEvent) return;
    
    setIsDeleting(true);
    try {
      const { success, error } = await deleteEvent(selectedEvent.id);
      if (success) {
        setSelectedEvent(null);
        setPendingAction(null);
        setSuccessMessage(`"${selectedEvent.title}" has been permanently deleted.`);
        setSuccessType('success');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        console.error('Failed to delete event:', error);
        setSuccessMessage(`Failed to delete event: ${error}`);
        setSuccessType('error');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      setSuccessMessage(`An error occurred: ${error.message}`);
      setSuccessType('error');
      setTimeout(() => setSuccessMessage(''), 3000);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedEvent, deleteEvent]);

  const handleUpdateStatus = useCallback(async (newStatus) => {
    if (!selectedEvent) return;
    
    const actionText = newStatus === EVENT_STATUS.CANCELLED ? 'cancel' : 
                      newStatus === EVENT_STATUS.POSTPONED ? 'postpone' : 
                      newStatus === EVENT_STATUS.SCHEDULED ? 'reactivate' : 
                      'update';
    
    const confirmMessages = {
      [EVENT_STATUS.CANCELLED]: `Cancel "${selectedEvent.title}"? This will mark the event as cancelled and remove it from the calendar.`,
      [EVENT_STATUS.POSTPONED]: `Postpone "${selectedEvent.title}"? This will mark the event as postponed. You can reschedule it later.`,
      [EVENT_STATUS.SCHEDULED]: `Reactivate "${selectedEvent.title}"? This will mark the event as scheduled and add it back to the calendar.`
    };
    
    const confirmMsg = confirmMessages[newStatus] || `Change status of "${selectedEvent.title}"?`;
    
    
    setPendingAction({
      type: 'status',
      status: newStatus,
      title: newStatus === EVENT_STATUS.CANCELLED ? 'Cancel Event' : 
             newStatus === EVENT_STATUS.POSTPONED ? 'Postpone Event' : 
             'Reactivate Event',
      message: confirmMsg,
      confirmText: newStatus === EVENT_STATUS.CANCELLED ? 'Cancel Event' : 
                   newStatus === EVENT_STATUS.POSTPONED ? 'Postpone Event' : 
                   'Reactivate',
      confirmColor: newStatus === EVENT_STATUS.CANCELLED ? 'red' : 
                    newStatus === EVENT_STATUS.POSTPONED ? 'yellow' : 
                    'green'
    });
  }, [selectedEvent]);

  const executeStatusUpdate = useCallback(async (newStatus) => {
    if (!selectedEvent) return;
    
    setIsUpdatingStatus(true);
    try {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
    
      if (newStatus === EVENT_STATUS.SCHEDULED && 
          (selectedEvent.status === EVENT_STATUS.CANCELLED || selectedEvent.status === EVENT_STATUS.POSTPONED)) {
        if (selectedEvent.original_date) {
          updateData.event_date = selectedEvent.original_date;
        } else {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          updateData.event_date = tomorrow.toISOString().split('T')[0];
        }
        
        if (!selectedEvent.start_time) updateData.start_time = '09:00';
        if (!selectedEvent.end_time) updateData.end_time = '10:00';
      }
      
      const { success, error } = await updateEvent(selectedEvent.id, updateData);
      
      if (success) {
        setSelectedEvent(null);
        setPendingAction(null);
        const messages = {
          [EVENT_STATUS.CANCELLED]: `"${selectedEvent.title}" has been cancelled.`,
          [EVENT_STATUS.POSTPONED]: `"${selectedEvent.title}" has been postponed.`,
          [EVENT_STATUS.SCHEDULED]: `"${selectedEvent.title}" has been reactivated and scheduled.`
        };
        setSuccessMessage(messages[newStatus] || 'Event status updated.');
        setSuccessType('success');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setSuccessMessage(`Failed to update event: ${error}`);
        setSuccessType('error');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error(`Error updating event:`, error);
      setSuccessMessage(`An error occurred: ${error.message}`);
      setSuccessType('error');
      setTimeout(() => setSuccessMessage(''), 3000);
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [selectedEvent, updateEvent]);

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

  const handleReschedule = useCallback(() => {
    if (selectedEvent) {
      handleCloseModal();
      window.location.href = `/edit-event/${selectedEvent.id}`;
    }
  }, [selectedEvent, handleCloseModal]);

  
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
    <MainLayout>
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-1 py-1 space-y-4 text-left">
        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Calendar
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your upcoming schedule
            </p>
          </div>

          <Link
            to="/create-event"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span className="mr-2">+</span> New Event
          </Link>
        </div>

        {/* Success/Error Message */}
        {successMessage && (
          <div className={`p-4 rounded-lg text-sm font-medium animate-fade-in flex items-start gap-3 ${
            successType === 'error' 
              ? 'bg-red-50 border border-red-200 text-red-700' 
              : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
          }`}>
            {successType === 'error' ? (
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            )}
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
              {/* Event Status Overview */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Event Overview
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg text-center border border-blue-100">
                    <span className="block text-2xl font-bold text-blue-600">
                      {eventCounts.scheduled}
                    </span>
                    <span className="text-xs text-blue-600 font-medium">
                      Scheduled
                    </span>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg text-center border border-yellow-100">
                    <span className="block text-2xl font-bold text-yellow-600">
                      {eventCounts.postponed}
                    </span>
                    <span className="text-xs text-yellow-600 font-medium">
                      Postponed
                    </span>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg text-center border border-red-100">
                    <span className="block text-2xl font-bold text-red-600">
                      {eventCounts.cancelled}
                    </span>
                    <span className="text-xs text-red-600 font-medium">
                      Cancelled
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center border border-gray-100">
                    <span className="block text-2xl font-bold text-gray-600">
                      {eventCounts.total}
                    </span>
                    <span className="text-xs text-gray-600 font-medium">
                      Total
                    </span>
                  </div>
                </div>
              </div>

              {/* Upcoming Events with Pagination */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Coming Up
                  </h3>
                  <span className="text-xs text-slate-500">
                    {upcomingEvents.length} total events
                  </span>
                </div>

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
                          <div className="flex justify-between items-start">
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
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Calendar className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-slate-400 text-sm mb-2">
                      No upcoming events scheduled
                    </p>
                    <Link
                      to="/create-event"
                      className="text-blue-600 text-sm font-medium hover:text-blue-700 hover:underline"
                    >
                      Create your first event
                    </Link>
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
                    Showing {indexOfFirstEvent + 1}-{Math.min(indexOfLastEvent, upcomingEvents.length)} of {upcomingEvents.length} events
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= EVENT MODAL ================= */}
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
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(selectedEvent.status).badge}`}>
                        {formatStatus(selectedEvent.status)}
                      </span>
                      {selectedEvent.original_date && selectedEvent.status === EVENT_STATUS.POSTPONED && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Originally: {DateUtils.formatDate(new Date(selectedEvent.original_date), 'MMM d')}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 pr-4">
                      {selectedEvent.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Created by: {selectedEvent.created_by || userName || 'Unknown'}
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
                        <p className="text-sm font-medium text-slate-500 mb-2">Description</p>
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
                      This event has been cancelled. You can reactivate it below or delete it permanently.
                    </p>
                  </div>
                )}

                {/* Quick Status Actions */}
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Quick Actions</h4>
                  
                  {selectedEvent.status === EVENT_STATUS.SCHEDULED ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleUpdateStatus(EVENT_STATUS.POSTPONED)}
                        disabled={isUpdatingStatus}
                        className="px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        Postpone
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(EVENT_STATUS.CANCELLED)}
                        disabled={isUpdatingStatus}
                        className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : selectedEvent.status === EVENT_STATUS.POSTPONED ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleReschedule}
                        className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(EVENT_STATUS.CANCELLED)}
                        disabled={isUpdatingStatus}
                        className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : selectedEvent.status === EVENT_STATUS.CANCELLED ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleUpdateStatus(EVENT_STATUS.SCHEDULED)}
                        disabled={isUpdatingStatus}
                        className="px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        Re-activate
                      </button>
                      <button
                        onClick={handleReschedule}
                        className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                      >
                        Edit & Reschedule
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Modal Actions */}
                <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-100">
                  <Link
                    to={`/edit-event/${selectedEvent.id}`}
                    onClick={handleCloseModal}
                    className="flex justify-center items-center px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    Edit Details
                  </Link>
                  <button
                    onClick={handleDeleteEvent}
                    disabled={isDeleting || isUpdatingStatus}
                    className="flex justify-center items-center px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= CONFIRMATION MODAL ================= */}
        {pendingAction && (
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in"
            onClick={() => setPendingAction(null)}
          >
            <div 
              className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-slate-900">
                    {pendingAction.title}
                  </h3>
                  <button
                    onClick={() => setPendingAction(null)}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Confirmation Message */}
                <div className="mb-6">
                  <p className="text-slate-700">
                    {pendingAction.message}
                  </p>
                  {selectedEvent && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                      <p className="font-medium text-slate-900">{selectedEvent.title}</p>
                      {selectedEvent.event_date && (
                        <p className="text-sm text-slate-500 mt-1">
                          {DateUtils.formatDate(new Date(selectedEvent.event_date), 'MMM d, yyyy')} • {DateUtils.formatTime(selectedEvent.start_time)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Confirmation Actions */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setPendingAction(null)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    disabled={isDeleting || isUpdatingStatus}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (pendingAction.type === 'delete') {
                        executeDeleteEvent();
                      } else if (pendingAction.type === 'status') {
                        executeStatusUpdate(pendingAction.status);
                      }
                    }}
                    disabled={isDeleting || isUpdatingStatus}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 ${
                      pendingAction.confirmColor === 'red' ? 'bg-red-600 hover:bg-red-700' :
                      pendingAction.confirmColor === 'yellow' ? 'bg-yellow-600 hover:bg-yellow-700' :
                      pendingAction.confirmColor === 'green' ? 'bg-green-600 hover:bg-green-700' :
                      'bg-blue-600 hover:bg-blue-700'
                    } disabled:opacity-70 disabled:cursor-not-allowed`}
                  >
                    {isDeleting || isUpdatingStatus ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Processing...
                      </>
                    ) : (
                      pendingAction.confirmText
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add CSS animations */}
      <style jsx>{`
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
    </MainLayout>
  );
}