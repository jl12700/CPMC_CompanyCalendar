import { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns';
import { EVENT_STATUS } from '../../lib/supabase';

export default function MonthView({ currentDate, events, onEventClick }) {
  const [showMoreModal, setShowMoreModal] = useState(null);
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const rows = [];
  let days = [];
  let day = startDate;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Helper to check if event is past
  const isEventPast = (event) => {
    if (!event.event_date) return false;
    const eventDate = new Date(event.event_date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate < today;
  };

  // Get events for a specific day
  const getEventsForDay = (day) => {
    return events.filter(event => {
      if (!event.event_date) return false;
      const eventDate = new Date(event.event_date);
      return isSameDay(eventDate, day) && event.status === EVENT_STATUS.SCHEDULED;
    }).sort((a, b) => {
      // Sort by time
      const timeA = a.start_time || '00:00';
      const timeB = b.start_time || '00:00';
      return timeA.localeCompare(timeB);
    });
  };

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      days.push(day);
      day = addDays(day, 1);
    }
    rows.push(days);
    days = [];
  }

  const handleMoreClick = (e, day, dayEvents) => {
    e.stopPropagation();
    setShowMoreModal({ day, events: dayEvents });
  };

  const closeMoreModal = () => {
    setShowMoreModal(null);
  };

  const handleEventClickInModal = (event) => {
    closeMoreModal();
    onEventClick(event);
  };

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
          <h2 className="text-lg font-bold text-slate-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-slate-600 py-2 uppercase tracking-wide"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 overflow-auto">
          {rows.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 border-b border-slate-200 last:border-b-0" style={{ minHeight: '120px' }}>
              {week.map((day, dayIdx) => {
                const dayEvents = getEventsForDay(day);
                const maxVisible = 2;
                const visibleEvents = dayEvents.slice(0, maxVisible);
                const remainingCount = dayEvents.length - maxVisible;
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isTodayDate = isToday(day);
                const isPast = day < today;

                return (
                  <div
                    key={dayIdx}
                    className={`border-r border-slate-200 last:border-r-0 p-2 ${
                      !isCurrentMonth ? 'bg-slate-50' : 'bg-white'
                    } ${isTodayDate ? 'bg-blue-50' : ''}`}
                  >
                    {/* Day number */}
                    <div className="flex justify-between items-start mb-1">
                      <span
                        className={`text-sm font-semibold ${
                          !isCurrentMonth
                            ? 'text-slate-400'
                            : isTodayDate
                            ? 'bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full'
                            : 'text-slate-700'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>

                    {/* Events */}
                    <div className="space-y-1">
                      {visibleEvents.map(event => {
                        const isPastEvent = isEventPast(event);
                        return (
                          <button
                            key={event.id}
                            onClick={() => onEventClick(event)}
                            className={`w-full text-left px-2 py-1 rounded text-xs font-medium truncate transition-all ${
                              isPastEvent
                                ? 'bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300'
                                : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
                            }`}
                            title={`${event.title} - ${event.start_time || ''}`}
                          >
                            {event.start_time && (
                              <span className="font-semibold mr-1">
                                {format(new Date(`2000-01-01T${event.start_time}`), 'h:mm a')}
                              </span>
                            )}
                            {event.title}
                          </button>
                        );
                      })}

                      {/* Show more button */}
                      {remainingCount > 0 && (
                        <button
                          onClick={(e) => handleMoreClick(e, day, dayEvents)}
                          className="w-full text-left px-2 py-1 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded transition-colors"
                        >
                          +{remainingCount} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Show More Modal */}
      {showMoreModal && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={closeMoreModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {format(showMoreModal.day, 'MMMM d, yyyy')}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {showMoreModal.events.length} event{showMoreModal.events.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={closeMoreModal}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Events List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {showMoreModal.events.map(event => {
                  const isPastEvent = isEventPast(event);
                  return (
                    <button
                      key={event.id}
                      onClick={() => handleEventClickInModal(event)}
                      className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md ${
                        isPastEvent
                          ? 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={`font-semibold text-sm ${
                          isPastEvent ? 'text-gray-700' : 'text-blue-900'
                        }`}>
                          {event.title}
                        </h4>
                        {isPastEvent && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-200 text-gray-600">
                            Past
                          </span>
                        )}
                      </div>
                      {event.start_time && event.end_time && (
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {format(new Date(`2000-01-01T${event.start_time}`), 'h:mm a')} - {format(new Date(`2000-01-01T${event.end_time}`), 'h:mm a')}
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-slate-200">
                <button
                  onClick={closeMoreModal}
                  className="w-full px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}