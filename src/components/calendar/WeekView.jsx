import { format } from 'date-fns';
import DateUtils from '../../utils/dateUtils';

const WeekView = ({ currentDate, events, onEventClick }) => {
  const weekDays = DateUtils.getWeekDays(currentDate);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Week Header */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {weekDays.map((date) => {
          const isToday = DateUtils.isToday(date);
          return (
            <div key={date.toISOString()} className={`py-3 px-2 text-center ${isToday ? 'bg-primary-50' : ''}`}>
              <div className="text-xs text-gray-600 font-medium">{format(date, 'EEE')}</div>
              <div className={`text-lg font-semibold mt-1 ${isToday ? 'text-primary-600' : 'text-gray-900'}`}>
                {format(date, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Week Events */}
      <div className="grid grid-cols-7 divide-x divide-gray-200">
        {weekDays.map((date) => {
          const dayEvents = DateUtils.sortEventsByTime(DateUtils.getEventsForDate(events, date));
          const isToday = DateUtils.isToday(date);

          return (
            <div key={date.toISOString()} className={`min-h-[400px] p-2 space-y-1 ${isToday ? 'bg-primary-50 bg-opacity-30' : ''}`}>
              {dayEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="w-full text-left p-2 rounded-lg transition-all hover:shadow-md group"
                  style={{
                    backgroundColor: event.color + '15',
                    borderLeft: `4px solid ${event.color}`,
                  }}
                >
                  <div className="text-xs font-semibold mb-1" style={{ color: event.color }}>
                    {DateUtils.formatTime(event.start_time)}
                  </div>
                  <div className="text-sm font-medium text-gray-900 line-clamp-2">{event.title}</div>
                  {event.description && (
                    <div className="text-xs text-gray-600 line-clamp-1 mt-1">{event.description}</div>
                  )}
                </button>
              ))}

              {dayEvents.length === 0 && <div className="text-center py-8 text-sm text-gray-400">No events</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekView;
