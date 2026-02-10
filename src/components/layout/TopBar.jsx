import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../hooks/useEvents';
import { format, parseISO, differenceInDays } from 'date-fns';
import { LogOut, User, Calendar, Bell, Search, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TopBar() {
  const { user, signOut } = useAuth();
  const { events } = useEvents();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Generate notifications from events
  const getNotifications = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const notifications = [];

    // Today's events
    const todayEvents = events.filter(e => e.event_date === today && e.status === 'scheduled');
    todayEvents.forEach(event => {
      notifications.push({
        id: `today-${event.id}`,
        type: 'today',
        title: 'Event Today',
        message: event.title,
        time: event.start_time,
        date: event.event_date,
        icon: Clock,
        color: 'green'
      });
    });

    // Tomorrow's events
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
    const tomorrowEvents = events.filter(e => e.event_date === tomorrowStr && e.status === 'scheduled');
    tomorrowEvents.forEach(event => {
      notifications.push({
        id: `tomorrow-${event.id}`,
        type: 'tomorrow',
        title: 'Event Tomorrow',
        message: event.title,
        time: event.start_time,
        date: event.event_date,
        icon: Calendar,
        color: 'blue'
      });
    });

    // Upcoming events (next 7 days, excluding today and tomorrow)
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const weekFromNowStr = format(weekFromNow, 'yyyy-MM-dd');
    const upcomingEvents = events.filter(e => 
      e.event_date > tomorrowStr && 
      e.event_date <= weekFromNowStr && 
      e.status === 'scheduled'
    );
    upcomingEvents.slice(0, 3).forEach(event => {
      const daysUntil = differenceInDays(parseISO(event.event_date), new Date());
      notifications.push({
        id: `upcoming-${event.id}`,
        type: 'upcoming',
        title: `Event in ${daysUntil} days`,
        message: event.title,
        time: event.start_time,
        date: event.event_date,
        icon: Calendar,
        color: 'purple'
      });
    });

    // Postponed events
    const postponedEvents = events.filter(e => e.status === 'postponed').slice(0, 2);
    postponedEvents.forEach(event => {
      notifications.push({
        id: `postponed-${event.id}`,
        type: 'postponed',
        title: 'Event Postponed',
        message: event.title,
        time: event.start_time,
        date: event.event_date,
        icon: AlertCircle,
        color: 'yellow'
      });
    });

    return notifications;
  };

  const notifications = getNotifications();
  const unreadCount = notifications.length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
  };

  const userName = user?.user_metadata?.full_name || 'User';
  const userEmail = user?.email || 'user@example.com';

  const getNotificationColor = (color) => {
    const colors = {
      green: 'bg-green-100 text-green-600',
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      yellow: 'bg-yellow-100 text-yellow-600'
    };
    return colors[color] || 'bg-gray-100 text-gray-600';
  };

  const formatEventTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 shadow-sm z-40 backdrop-blur-sm bg-opacity-95">
      <div className="h-full px-6 flex items-center justify-between">
        
        {/* Left Section - Date */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
            <div className="p-1.5 bg-blue-100 rounded-md">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-blue-600">Today</span>
              <span className="text-xs font-semibold text-gray-800">{format(new Date(), 'MMM d, yyyy')}</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg border border-gray-200 w-64">
            <Search className="w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search events..." 
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
            />
          </div>
        </div>

        {/* Right Section - Notifications & User Profile */}
        <div className="flex items-center gap-4">
          
          {/* Notifications Dropdown */}
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <Bell className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full border-2 border-white text-white text-xs font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-2 animate-fade-in z-50 max-h-[500px] overflow-hidden flex flex-col">
                
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                      {unreadCount} new
                    </span>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No notifications</p>
                    </div>
                  ) : (
                    <div className="py-1">
                      {notifications.map(notification => {
                        const Icon = notification.icon;
                        return (
                          <div 
                            key={notification.id}
                            className="px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${getNotificationColor(notification.color)}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-900">{notification.title}</p>
                                <p className="text-sm text-gray-700 truncate mt-0.5">{notification.message}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-500">
                                    {format(parseISO(notification.date), 'MMM d')} • {formatEventTime(notification.time)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-100">
                    <Link 
                      to="/schedule" 
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 block text-center"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      View all events
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)} 
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all duration-200 border border-transparent hover:border-gray-200"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md text-sm">
                {getInitials(userName)}
              </div>
              
              <div className="hidden md:block text-left">
                <div className="text-sm font-semibold text-gray-900 leading-tight">
                  {userName}
                </div>
                <div className="text-xs text-gray-500 truncate max-w-[160px]">
                  {userEmail}
                </div>
              </div>

              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 animate-fade-in z-50 overflow-hidden">
                
                <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                      {getInitials(userName)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-gray-900">
                        {userName}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {userEmail}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-3 transition-colors group"
                  >
                    <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">My Profile</div>
                      <div className="text-xs text-gray-500">View and edit profile</div>
                    </div>
                  </Link>
                </div>

                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button 
                    onClick={handleLogout} 
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors group"
                  >
                    <div className="p-1.5 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                      <LogOut className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <div className="font-medium">Logout</div>
                      <div className="text-xs text-red-500">Sign out of your account</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </header>
  );
}