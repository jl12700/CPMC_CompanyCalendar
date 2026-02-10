import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { EventCard } from '../components/calendar/EventCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { useEvents } from '../hooks/useEvents';
import { format } from 'date-fns';

const DashboardPage = () => {
  const { events, loading, deleteEvent } = useEvents();
  const [stats, setStats] = useState({ total: 0, upcoming: 0, today: 0, thisWeek: 0 });

  useEffect(() => {
    if (events.length > 0) {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const weekFromNowStr = format(weekFromNow, 'yyyy-MM-dd');

      setStats({
        total: events.length,
        upcoming: events.filter(e => e.event_date >= todayStr && e.status === 'scheduled').length,
        today: events.filter(e => e.event_date === todayStr && e.status === 'scheduled').length,
        thisWeek: events.filter(e => e.event_date >= todayStr && e.event_date <= weekFromNowStr && e.status === 'scheduled').length,
      });
    }
  }, [events]);

  const upcomingEvents = events
    .filter(e => e.event_date >= format(new Date(), 'yyyy-MM-dd') && e.status === 'scheduled')
    .slice(0, 5);

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
        </div>
        <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>{icon}</div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Overview of your schedule and events</p>
          </div>
          <Link to="/create-event" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">+ New Event</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading dashboard..." />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Events" value={stats.total} color="primary" icon={<svg className="w-6 h-6 text-primary-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>} />
              <StatCard title="Today's Events" value={stats.today} color="green" icon={<svg className="w-6 h-6 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>} />
              <StatCard title="This Week" value={stats.thisWeek} color="purple" icon={<svg className="w-6 h-6 text-purple-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>} />
              <StatCard title="Upcoming" value={stats.upcoming} color="orange" icon={<svg className="w-6 h-6 text-orange-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>} />
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Upcoming Events</h2>
                <Link to="/calendar" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View All →</Link>
              </div>
              {upcomingEvents.length === 0 ? (
                <EmptyState title="No upcoming events" description="Create your first event to get started with scheduling." action actionLabel="Create Event" onAction={() => window.location.href = '/create-event'} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map(event => (
                    <EventCard key={event.id} event={event} onDelete={deleteEvent} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
