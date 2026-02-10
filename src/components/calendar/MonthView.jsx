import { format } from 'date-fns';
import DateUtils from '../../utils/dateUtils';

const MonthView = ({ currentDate, events, onDateClick, onEventClick }) => {
  const calendarDays = DateUtils.getCalendarDays(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Week Day Headers */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {weekDays.map((day) => (
          <div key={day} className="px-2 py-3 text-center text-sm font-semibold text-gray-700">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((date, index) => {
          const dayEvents = DateUtils.getEventsForDate(events, date);
          const isCurrentMonth = DateUtils.isSameMonth(date, currentDate);
          const isToday = DateUtils.isToday(date);

          return (
            <div
              key={index}
              onClick={() => onDateClick(date)}
              className={`min-h-[120px] border-b border-r border-gray-200 p-2 cursor-pointer transition-colors ${
                isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'
              } ${index % 7 === 6 ? 'border-r-0' : ''}`}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full ${
                    isToday ? 'bg-primary-600 text-white' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {format(date, 'd')}
                </span>
                {dayEvents.length > 0 && <span className="text-xs text-gray-500 font-medium">{dayEvents.length}</span>}
              </div>

              {/* Events */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className="w-full text-left px-2 py-1 rounded text-xs font-medium truncate transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: event.color + '20',
                      color: event.color,
                      borderLeft: `3px solid ${event.color}`,
                    }}
                    title={event.title}
                  >
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 3 && <div className="text-xs text-gray-500 px-2">+{dayEvents.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;
