// src/pages/DashboardPage.js
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { useEvents } from '../hooks/useEvents';
import { format, parseISO } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  CalendarClock,
  CalendarDays,
  User
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  switch (status) {
    case 'scheduled':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">Scheduled</span>;
    case 'postponed':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">Postponed</span>;
    case 'cancelled':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">Cancelled</span>;
    default:
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unknown</span>;
  }
};

const DashboardPage = () => {
  const { events, loading } = useEvents();
  const [stats, setStats] = useState({ upcoming: 0, today: 0, thisWeek: 0 });

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

  useEffect(() => {
    if (events.length > 0) {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const tomorrowDate = new Date();
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowStr = format(tomorrowDate, 'yyyy-MM-dd');
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      const weekFromNowStr = format(weekFromNow, 'yyyy-MM-dd');

      setStats({
        upcoming: events.filter(e => e.event_date > todayStr && e.status === 'scheduled').length,
        today: events.filter(e => e.event_date === todayStr && e.status === 'scheduled').length,
        thisWeek: events.filter(e => e.event_date >= todayStr && e.event_date <= weekFromNowStr && e.status === 'scheduled').length,
      });
    }
  }, [events]);

  const upcomingEvents = events
    .filter(e => e.event_date > format(new Date(), 'yyyy-MM-dd') && e.status === 'scheduled')
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
    .slice(0, 5);

  const recentEvents = events
    .filter(e => e.event_date < format(new Date(), 'yyyy-MM-dd'))
    .sort((a, b) => b.event_date.localeCompare(a.event_date))
    .slice(0, 3);

  const todayEvents = events
    .filter(e => e.event_date === format(new Date(), 'yyyy-MM-dd') && e.status === 'scheduled')
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full border-b border-gray-200 pb-5">
          <div className="flex flex-col items-start text-left">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Overview of your event schedule and statistics</p>
          </div>
          <div className="flex gap-2">
            <Link 
              to="/create-event" 
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Create Event
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" text="Loading dashboard..." />
          </div>
        ) : (
          <div className="space-y-6">

            {/* Stats Cards */}
            <div className="relative">
              <div className="flex flex-row gap-4 overflow-x-auto pb-2">
                
                <div className="flex-1 min-w-[200px] bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="text-sm font-medium opacity-90 mb-2">Today</div>
                    <div className="text-4xl font-bold mb-1">{stats.today}</div>
                    <div className="text-xs opacity-75">Events Today</div>
                  </div>
                  <div className="absolute bottom-4 right-4 opacity-20">
                    <Clock className="w-16 h-16" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-[200px] bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="text-sm font-medium opacity-90 mb-2">This Week</div>
                    <div className="text-4xl font-bold mb-1">{stats.thisWeek}</div>
                    <div className="text-xs opacity-75">Next 7 Days</div>
                  </div>
                  <div className="absolute bottom-4 right-4 opacity-20">
                    <CalendarDays className="w-16 h-16" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-[200px] bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="text-sm font-medium opacity-90 mb-2">Upcoming</div>
                    <div className="text-4xl font-bold mb-1">{stats.upcoming}</div>
                    <div className="text-xs opacity-75">Future Events</div>
                  </div>
                  <div className="absolute bottom-4 right-4 opacity-20">
                    <TrendingUp className="w-16 h-16" />
                  </div>
                </div>
              </div>
              
              {/* Connecting Line Under Cards */}
              <div className="mt-4 h-1 bg-gradient-to-r from-green-500 via-purple-500 to-orange-500 rounded-full opacity-30"></div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Today's Schedule */}
              {todayEvents.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="w-5 h-5 text-green-600" />
                      <h2 className="font-semibold text-slate-800">Today's Schedule</h2>
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      {todayEvents.length} {todayEvents.length === 1 ? 'Event' : 'Events'}
                    </span>
                  </div>

                  <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                    {todayEvents.map(event => {
                      const [hours, minutes] = event.start_time.split(':');
                      const timeDate = new Date();
                      timeDate.setHours(hours, minutes);
                      const formattedTime = format(timeDate, 'h:mm a');

                      return (
                        <div key={event.id} className="p-4 border-l-4 border-green-500 rounded-lg bg-green-50/50 hover:bg-green-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1.5">
                              <span className="text-sm font-bold text-gray-900">{event.title}</span>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{formattedTime}</span>
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <User className="w-3.5 h-3.5" />
                                <span>Facilitator: {getFacilitatorDisplayName(event)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <User className="w-3.5 h-3.5" />
                                <span>Created by: {getCreatedByDisplayName(event)}</span>
                              </div>
                            </div>
                            <StatusBadge status={event.status} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upcoming Events */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h2 className="font-semibold text-slate-800">Upcoming Events</h2>
                  </div>
                  <Link to="/schedule" className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider hover:underline">
                    View All
                  </Link>
                </div>

                <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                  {upcomingEvents.length === 0 ? (
                    <div className="py-8">
                      <EmptyState 
                        title="No upcoming events" 
                        description="You don't have any scheduled events coming up." 
                        action
                        actionLabel="Create Event"
                        onAction={() => window.location.href = '/create-event'}
                      />
                    </div>
                  ) : (
                    upcomingEvents.map(event => {
                      const eventDate = parseISO(event.event_date);
                      const formattedDate = format(eventDate, 'MMM d, yyyy');
                      const [hours, minutes] = event.start_time.split(':');
                      const timeDate = new Date();
                      timeDate.setHours(hours, minutes);
                      const formattedTime = format(timeDate, 'h:mm a');

                      return (
                        <div key={event.id} className="p-4 border rounded-lg bg-white hover:bg-blue-50/30 transition-colors border-slate-200 hover:border-blue-200">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1.5">
                              <span className="text-sm font-bold text-gray-900">{event.title}</span>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{formattedDate}</span>
                                <span className="text-gray-400">•</span>
                                <Clock className="w-3.5 h-3.5" />
                                <span>{formattedTime}</span>
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span className="truncate max-w-[250px]">{event.location}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <User className="w-3.5 h-3.5" />
                                <span>Facilitator: {getFacilitatorDisplayName(event)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <User className="w-3.5 h-3.5" />
                                <span>Created by: {getCreatedByDisplayName(event)}</span>
                              </div>
                            </div>
                            <StatusBadge status={event.status} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Recent Past Events */}
            {recentEvents.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-slate-50">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-gray-600" />
                    <h2 className="font-semibold text-slate-800">Recent Past Events</h2>
                  </div>
                  <Link to="/schedule" className="text-xs font-bold text-gray-600 hover:text-gray-700 uppercase tracking-wider hover:underline">
                    View All
                  </Link>
                </div>

                <div className="p-4">
                  <div className="grid gap-2">
                    {recentEvents.map(event => {
                      const eventDate = parseISO(event.event_date);
                      const formattedDate = format(eventDate, 'MMM d, yyyy');
                      const [hours, minutes] = event.start_time.split(':');
                      const timeDate = new Date();
                      timeDate.setHours(hours, minutes);
                      const formattedTime = format(timeDate, 'h:mm a');

                      return (
                        <div key={event.id} className="p-3 border rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors border-gray-200">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-bold text-gray-700">{event.title}</span>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{formattedDate}</span>
                                <span>•</span>
                                <Clock className="w-3.5 h-3.5" />
                                <span>{formattedTime}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <User className="w-3.5 h-3.5" />
                                <span>Facilitator: {getFacilitatorDisplayName(event)}</span>
                              </div>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300">
                              Completed
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link 
                to="/create-event" 
                className="group p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Create New Event</h3>
                    <p className="text-xs text-slate-600">Schedule a new event</p>
                  </div>
                </div>
              </Link>

              <Link 
                to="/schedule" 
                className="group p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border-2 border-purple-200 hover:border-purple-400 transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <CalendarDays className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">View Schedule</h3>
                    <p className="text-xs text-slate-600">See all your events</p>
                  </div>
                </div>
              </Link>

              <Link 
                to="/calendar" 
                className="group p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 hover:border-green-400 transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <CalendarClock className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Calendar View</h3>
                    <p className="text-xs text-slate-600">View in calendar format</p>
                  </div>
                </div>
              </Link>
            </div>

          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default DashboardPage;