// src/pages/SchedulePage.js
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
  Eye,
  ArrowUpDown
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

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: 'created_at',
    direction: 'desc'
  });

  const today = format(new Date(), 'yyyy-MM-dd');

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
    
    // Try created_by_name first
    if (event.created_by_name) {
      return event.created_by_name;
    }
    
    // Fallback to created_by if it looks like a name
    if (event.created_by && !event.created_by.includes('-') && event.created_by.length < 50) {
      return event.created_by;
    }
    
    return 'Unknown User';
  };

  // Filter Logic
  const filteredEvents = events.filter(event => {
    switch (filter) {
      case 'today':
        return event.event_date === today;
      case 'upcoming': 
        return event.event_date > today && event.status === EVENT_STATUS.SCHEDULED;
      case 'past': 
        return event.event_date < today;
      case 'postponed': 
        return event.status === EVENT_STATUS.POSTPONED;
      case 'cancelled': 
        return event.status === EVENT_STATUS.CANCELLED;
      case 'all':
      default: 
        return true;
    }
  });

  // Sort Logic
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    let aValue, bValue;

    switch (sortConfig.key) {
      case 'date_time':
        aValue = new Date(`${a.event_date}T${a.start_time || '00:00'}`);
        bValue = new Date(`${b.event_date}T${b.start_time || '00:00'}`);
        break;
      case 'created_at':
        aValue = a.created_at ? new Date(a.created_at) : new Date(0);
        bValue = b.created_at ? new Date(b.created_at) : new Date(0);
        break;
      case 'title':
        aValue = a.title?.toLowerCase() || '';
        bValue = b.title?.toLowerCase() || '';
        break;
      default:
        aValue = a[sortConfig.key];
        bValue = b[sortConfig.key];
    }

    if (aValue === undefined || aValue === null) aValue = '';
    if (bValue === undefined || bValue === null) bValue = '';

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
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

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  const nextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
  const handlePageClick = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => { setCurrentPage(1); }, [filter]);

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
  const todaysEventsCount = events.filter(e => e.event_date === today).length;
  const postponedCount = events.filter(e => e.status === EVENT_STATUS.POSTPONED).length;
  const cancelledCount = events.filter(e => e.status === EVENT_STATUS.CANCELLED).length;
  const totalCount = events.length;

  const getSortIndicator = (key) => sortConfig.key !== key ? null : sortConfig.direction === 'asc' ? '↑' : '↓';

  return (
    <MainLayout>
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Event Schedule</h1>
            <p className="text-sm text-gray-500 mt-1">View and manage all your events in one place.</p>
          </div>
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
              <option value="today">Today's Events</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past Events</option>
              <option value="postponed">Postponed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="relative">
          <div className="flex flex-row gap-4 overflow-x-auto pb-2">
            {/* Today's Events */}
            <div className="flex-1 min-w-[200px] bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-sm font-medium opacity-90 mb-2">Today's Events</div>
                <div className="text-4xl font-bold mb-1">{todaysEventsCount}</div>
              </div>
              <div className="absolute bottom-4 right-4 opacity-20"><Calendar className="w-16 h-16" /></div>
            </div>
            {/* Postponed */}
            <div className="flex-1 min-w-[200px] bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-sm font-medium opacity-90 mb-2">Postponed</div>
                <div className="text-4xl font-bold mb-1">{postponedCount}</div>
              </div>
              <div className="absolute bottom-4 right-4 opacity-20"><Clock className="w-16 h-16" /></div>
            </div>
            {/* Cancelled */}
            <div className="flex-1 min-w-[200px] bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-sm font-medium opacity-90 mb-2">Cancelled</div>
                <div className="text-4xl font-bold mb-1">{cancelledCount}</div>
              </div>
              <div className="absolute bottom-4 right-4 opacity-20"><AlertCircle className="w-16 h-16" /></div>
            </div>
            {/* Total */}
            <div className="flex-1 min-w-[200px] bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-sm font-medium opacity-90 mb-2">Total Events</div>
                <div className="text-4xl font-bold mb-1">{totalCount}</div>
              </div>
              <div className="absolute bottom-4 right-4 opacity-20"><CheckCircle className="w-16 h-16" /></div>
            </div>
          </div>
          <div className="mt-4 h-1 bg-gradient-to-r from-blue-500 via-yellow-400 via-red-500 to-green-500 rounded-full opacity-30"></div>
        </div>

        {/* Table Section */}
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
              icon="" 
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('date_time')} className="flex items-center gap-1 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1">
                      Date & Time {getSortIndicator('date_time') && <span className="text-xs font-bold">{getSortIndicator('date_time')}</span>}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Agenda</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Facilitator</th>
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
                            <span className="text-sm font-bold text-gray-900">{format(eventDate, 'MMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Clock className="w-3 h-3 mr-1" /> {formatTimeDisplay(event.start_time, event.end_time)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          <div className="text-sm font-medium text-gray-900">{event.title}</div>
                          {event.description && <div className="text-xs text-gray-500 mt-1 truncate">{event.description}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 truncate max-w-[150px]">{event.location || 'No location'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 truncate max-w-[120px]">{getFacilitatorDisplayName(event)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${styles.badge}`}>{formatStatus(event.status)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => handleViewDetails(event)} className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 hover:border-gray-400 transition-all" title="View Details">
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {indexOfFirstEvent + 1} to {Math.min(indexOfLastEvent, sortedEvents.length)} of {sortedEvents.length} events
                    {sortConfig.key === 'date_time' && <span className="ml-2 text-gray-400">• Sorted by date/time {sortConfig.direction === 'desc' ? '(latest first)' : '(oldest first)'}</span>}
                    {sortConfig.key === 'created_at' && <span className="ml-2 text-gray-400">• Sorted by creation date {sortConfig.direction === 'desc' ? '(newest first)' : '(oldest first)'}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={prevPage} disabled={currentPage === 1} className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}><ChevronLeft className="w-5 h-5" /></button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (currentPage <= 3) pageNum = i + 1;
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = currentPage - 2 + i;
                        return (
                          <button key={pageNum} onClick={() => handlePageClick(pageNum)} className={`w-8 h-8 flex items-center justify-center text-sm rounded-md ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{pageNum}</button>
                        );
                      })}
                    </div>
                    <button onClick={nextPage} disabled={currentPage === totalPages} className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}><ChevronRight className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* View Details Modal */}
        {isViewModalOpen && selectedEvent && (
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
            onClick={() => { setIsViewModalOpen(false); setSelectedEvent(null); }}
          >
            <div 
              className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 animate-scale-in overflow-hidden max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Agenda Details</h2>
                  <p className="text-sm text-slate-500">View complete event information</p>
                </div>
                <button onClick={() => { setIsViewModalOpen(false); setSelectedEvent(null); }} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-200">
                  <AlertCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="mb-6">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusStyles(selectedEvent.status).badge}`}>{formatStatus(selectedEvent.status)}</span>
                  {selectedEvent.original_date && selectedEvent.status === EVENT_STATUS.POSTPONED && (
                    <p className="text-xs text-gray-500 mt-2">Originally scheduled for: {format(parseISO(selectedEvent.original_date), 'MMMM d, yyyy')}</p>
                  )}
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900">{selectedEvent.title}</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg"><Calendar className="w-5 h-5 text-blue-600" /></div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Date</p>
                        <p className="text-slate-900">{selectedEvent.event_date ? format(parseISO(selectedEvent.event_date), 'EEEE, MMMM d, yyyy') : 'Not set'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-50 rounded-lg"><Clock className="w-5 h-5 text-green-600" /></div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Time</p>
                        <p className="text-slate-900">{formatTimeDisplay(selectedEvent.start_time, selectedEvent.end_time)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-50 rounded-lg"><MapPin className="w-5 h-5 text-orange-600" /></div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Location</p>
                      <p className="text-slate-900">{selectedEvent.location || 'No location specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg"><User className="w-5 h-5 text-purple-600" /></div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Facilitator</p>
                      <p className="text-slate-900">{getFacilitatorDisplayName(selectedEvent)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg"><User className="w-5 h-5 text-gray-600" /></div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Created by</p>
                      <p className="text-slate-900 text-sm">{getCreatedByDisplayName(selectedEvent)}</p>
                    </div>
                  </div>
                  {selectedEvent.description && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <p className="text-sm font-medium text-slate-500 mb-3">Required Attendees</p>
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <p className="text-slate-700 whitespace-pre-line">{selectedEvent.description}</p>
                      </div>
                    </div>
                  )}
                  {selectedEvent.postponed_reason && selectedEvent.status === EVENT_STATUS.POSTPONED && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <p className="text-sm font-medium text-yellow-600 mb-3">Reason for Postponement</p>
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                        <p className="text-slate-700 whitespace-pre-line">{selectedEvent.postponed_reason}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                <div className="flex justify-end">
                  <button onClick={() => { setIsViewModalOpen(false); setSelectedEvent(null); }} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Close</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>
    </MainLayout>
  );
};

export default SchedulePage;