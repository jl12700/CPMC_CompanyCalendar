import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  MapPin,
  User,
  AlertCircle,
  CheckCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { useEvents } from '../hooks/useEvents';
import { EVENT_STATUS, getStatusStyles, formatStatus } from '../lib/supabase';

const SchedulePage = () => {
  const { events, loading } = useEvents();
  const [filter, setFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 10;

  const today = format(new Date(), 'yyyy-MM-dd');

  // Filter Logic
  const filteredEvents = events.filter(event => {
    switch (filter) {
      case 'upcoming': 
        return event.event_date >= today && event.status === EVENT_STATUS.SCHEDULED;
      case 'past': 
        return event.event_date < today;
      case 'scheduled': 
        return event.status === EVENT_STATUS.SCHEDULED;
      case 'postponed': 
        return event.status === EVENT_STATUS.POSTPONED;
      case 'cancelled': 
        return event.status === EVENT_STATUS.CANCELLED;
      case 'all':
      default: 
        return true;
    }
  });

  // Sort Logic (newest first)
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const dateA = new Date(`${a.event_date}T${a.start_time}`);
    const dateB = new Date(`${b.event_date}T${b.start_time}`);
    return dateB - dateA;
  });

  // Pagination calculations
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = sortedEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(sortedEvents.length / eventsPerPage);

  // Handlers
  const handleViewDetails = (event) => { 
    setSelectedEvent(event); 
    setIsViewModalOpen(true); 
  };

  // Pagination handlers
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

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // Format time for display
  const formatTimeDisplay = (startTime, endTime) => {
    if (!startTime) return 'No time set';
    
    const formatTimeString = (timeStr) => {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, 'h:mm a');
    };
    
    const startFormatted = formatTimeString(startTime);
    if (!endTime) return startFormatted;
    
    const endFormatted = formatTimeString(endTime);
    return `${startFormatted} - ${endFormatted}`;
  };

  // Calculate stats
  const scheduledCount = events.filter(e => e.status === EVENT_STATUS.SCHEDULED).length;
  const postponedCount = events.filter(e => e.status === EVENT_STATUS.POSTPONED).length;
  const cancelledCount = events.filter(e => e.status === EVENT_STATUS.CANCELLED).length;
  const totalCount = events.length;

  return (
    <MainLayout>
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Event Schedule</h1>
            <p className="text-sm text-gray-500 mt-1">View and manage all your events in one place.</p>
          </div>
          
          {/* Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg border shadow-sm cursor-pointer bg-white hover:bg-gray-50 transition-colors"
            >
              <option value="all">All Events</option>
              <option value="scheduled">Scheduled</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past Events</option>
              <option value="postponed">Postponed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Stats Summary - HORIZONTAL LAYOUT WITH CONNECTING LINE */}
        <div className="relative">
          {/* Stats Cards Container - Force horizontal layout */}
          <div className="flex flex-row gap-4 overflow-x-auto pb-2">
            {/* Scheduled Card */}
            <div className="flex-1 min-w-[200px] bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-sm font-medium opacity-90 mb-2">Scheduled</div>
                <div className="text-4xl font-bold mb-1">{scheduledCount}</div>
              </div>
              <div className="absolute bottom-4 right-4 opacity-20">
                <Calendar className="w-16 h-16" />
              </div>
            </div>
            
            {/* Postponed Card */}
            <div className="flex-1 min-w-[200px] bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-sm font-medium opacity-90 mb-2">Postponed</div>
                <div className="text-4xl font-bold mb-1">{postponedCount}</div>
              </div>
              <div className="absolute bottom-4 right-4 opacity-20">
                <Clock className="w-16 h-16" />
              </div>
            </div>
            
            {/* Cancelled Card */}
            <div className="flex-1 min-w-[200px] bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-sm font-medium opacity-90 mb-2">Cancelled</div>
                <div className="text-4xl font-bold mb-1">{cancelledCount}</div>
              </div>
              <div className="absolute bottom-4 right-4 opacity-20">
                <AlertCircle className="w-16 h-16" />
              </div>
            </div>
            
            {/* Total Events Card */}
            <div className="flex-1 min-w-[200px] bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-sm font-medium opacity-90 mb-2">Total Events</div>
                <div className="text-4xl font-bold mb-1">{totalCount}</div>
              </div>
              <div className="absolute bottom-4 right-4 opacity-20">
                <CheckCircle className="w-16 h-16" />
              </div>
            </div>
          </div>
          
          {/* Connecting Line Under Cards */}
          <div className="mt-4 h-1 bg-gradient-to-r from-blue-500 via-yellow-400 via-red-500 to-green-500 rounded-full opacity-30"></div>
        </div>

        {/* --- Table Section --- */}
        {loading ? (
          <div className="flex justify-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
            <LoadingSpinner size="lg" text="Loading schedule..." />
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <EmptyState 
              title="No events found" 
              description={filter === 'all' ? "You haven't created any events yet." : `No events match the '${filter}' filter.`} 
              action 
              actionLabel="Create Event" 
              onAction={() => (window.location.href = '/create-event')} 
              icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Event Details</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created By</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">View</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentEvents.map((event) => {
                    const eventDate = parseISO(event.event_date);
                    const styles = getStatusStyles(event.status);

                    return (
                      <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-bold text-gray-900">
                                {format(eventDate, 'MMM d, yyyy')}
                              </span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <Clock className="w-3 h-3 mr-1" /> 
                              {formatTimeDisplay(event.start_time, event.end_time)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-md">
                            <div className="text-sm font-medium text-gray-900">{event.title}</div>
                            {event.description && (
                              <div className="text-xs text-gray-500 mt-1 truncate">{event.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-700 truncate max-w-[150px]">
                              {event.location || 'No location'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-700 truncate max-w-[120px]">
                              {event.created_by || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${styles.badge}`}>
                            {formatStatus(event.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleViewDetails(event)}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 hover:border-gray-400 transition-all"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {indexOfFirstEvent + 1} to {Math.min(indexOfLastEvent, sortedEvents.length)} of {sortedEvents.length} events
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-md ${
                        currentPage === 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageClick(pageNum)}
                            className={`w-8 h-8 flex items-center justify-center text-sm rounded-md ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-md ${
                        currentPage === totalPages
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- View Details Modal --- */}
        {isViewModalOpen && selectedEvent && (
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
            onClick={() => {
              setIsViewModalOpen(false);
              setSelectedEvent(null);
            }}
          >
            <div 
              className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 animate-scale-in overflow-hidden max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Event Details</h2>
                  <p className="text-sm text-slate-500">View complete event information</p>
                </div>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedEvent(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-200"
                >
                  <AlertCircle className="w-5 h-5" />
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Status Badge */}
                <div className="mb-6">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusStyles(selectedEvent.status).badge}`}>
                    {formatStatus(selectedEvent.status)}
                  </span>
                  {selectedEvent.original_date && selectedEvent.status === EVENT_STATUS.POSTPONED && (
                    <p className="text-xs text-gray-500 mt-2">
                      Originally scheduled for: {format(parseISO(selectedEvent.original_date), 'MMMM d, yyyy')}
                    </p>
                  )}
                </div>
                
                {/* Event Title */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900">{selectedEvent.title}</h3>
                </div>
                
                {/* Event Details Grid */}
                <div className="space-y-4">
                  {/* Date & Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Date</p>
                        <p className="text-slate-900">
                          {selectedEvent.event_date ? format(parseISO(selectedEvent.event_date), 'EEEE, MMMM d, yyyy') : 'Not set'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <Clock className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Time</p>
                        <p className="text-slate-900">
                          {formatTimeDisplay(selectedEvent.start_time, selectedEvent.end_time)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Location */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Location</p>
                      <p className="text-slate-900">
                        {selectedEvent.location || 'No location specified'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Created By */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <User className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Created By</p>
                      <p className="text-slate-900">
                        {selectedEvent.created_by || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Description */}
                  {selectedEvent.description && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <p className="text-sm font-medium text-slate-500 mb-3">Description</p>
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <p className="text-slate-700 whitespace-pre-line">
                          {selectedEvent.description}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Postponed Reason */}
                  {selectedEvent.postponed_reason && selectedEvent.status === EVENT_STATUS.POSTPONED && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <p className="text-sm font-medium text-yellow-600 mb-3">Reason for Postponement</p>
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                        <p className="text-slate-700 whitespace-pre-line">
                          {selectedEvent.postponed_reason}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      setSelectedEvent(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default SchedulePage;