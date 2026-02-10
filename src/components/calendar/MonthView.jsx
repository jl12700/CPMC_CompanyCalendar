// src/components/calendar/MonthView.jsx
import DateUtils from '../../utils/dateUtils';

const MonthView = ({ currentDate, events, onDateClick, onEventClick }) => {
  const daysInMonth = DateUtils.getDaysInMonth(currentDate);
  const firstDayOfMonth = DateUtils.getFirstDayOfMonth(currentDate);
  const today = new Date();
  
  // Generate days array
  const days = [];
  
  // Previous month's days
  const prevMonth = new Date(currentDate);
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const daysInPrevMonth = DateUtils.getDaysInMonth(prevMonth);
  
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), daysInPrevMonth - i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: DateUtils.isToday(date)
    });
  }
  
  // Current month's days
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
    days.push({
      date,
      isCurrentMonth: true,
      isToday: DateUtils.isToday(date)
    });
  }
  
  // Next month's days
  const totalCells = 42; // 6 weeks * 7 days
  const nextMonth = new Date(currentDate);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  for (let i = 1; days.length < totalCells; i++) {
    const date = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: DateUtils.isToday(date)
    });
  }
  
  // Group days into weeks
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  
  // Get events for a specific date
  const getEventsForDate = (date) => {
    const dateStr = DateUtils.formatDate(date, 'yyyy-MM-dd');
    return events.filter(event => 
      event.event_date === dateStr
    ).sort((a, b) => 
      a.start_time.localeCompare(b.start_time)
    );
  };

  // Day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-4">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200">
        {dayNames.map((day, index) => (
          <div key={index} className="bg-gray-50 p-3 text-center">
            <span className="text-sm font-medium text-gray-700">{day}</span>
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 border-t-0">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="contents">
            {week.map((day, dayIndex) => {
              const dayEvents = getEventsForDate(day.date);
              
              return (
                <div
                  key={dayIndex}
                  className={`min-h-[120px] bg-white p-2 ${
                    !day.isCurrentMonth ? 'bg-gray-50' : ''
                  } ${day.isToday ? 'bg-blue-50' : ''} hover:bg-gray-50 transition-colors cursor-pointer`}
                  onClick={() => onDateClick(day.date)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm font-medium ${
                      !day.isCurrentMonth 
                        ? 'text-gray-400' 
                        : day.isToday 
                          ? 'text-blue-600' 
                          : 'text-gray-900'
                    }`}>
                      {day.date.getDate()}
                    </span>
                    {day.isToday && (
                      <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                  </div>
                  
                  {/* Events for this day */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={`px-2 py-1 text-xs rounded truncate cursor-pointer ${
                          event.status === 'cancelled'
                            ? 'bg-red-100 text-red-800 line-through hover:bg-red-200'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        title={`${event.title} (${DateUtils.formatTime(event.start_time)} - ${DateUtils.formatTime(event.end_time)})`}
                      >
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mr-1 flex-shrink-0"></div>
                          <span className="truncate">{event.title}</span>
                        </div>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 px-2">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthView;