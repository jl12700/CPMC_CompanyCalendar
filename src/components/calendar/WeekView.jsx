// src/components/calendar/WeekView.jsx
import { useState, useMemo } from 'react';
import DateUtils from '../../utils/dateUtils';
import { EVENT_STATUS } from '../../lib/supabase';

const WeekView = ({ currentDate, events, onEventClick }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Generate time slots from 6 AM to 10 PM
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        label: hour <= 12 ? `${hour} AM` : `${hour - 12} PM`,
        isHourMark: true
      });
      if (hour < 22) {
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:30`,
          label: '',
          isHourMark: false
        });
      }
    }
    return slots;
  }, []);

  // Get week days
  const weekDays = useMemo(() => {
    return DateUtils.getWeekDays(currentDate);
  }, [currentDate]);

  // Get events for a specific day
  const getEventsForDay = (date) => {
    const dateStr = DateUtils.formatDate(date, 'yyyy-MM-dd');
    return events.filter(event => 
      event.event_date === dateStr && 
      event.status === EVENT_STATUS.SCHEDULED
    ).sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  // Convert time to minutes from start of day (6 AM)
  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours * 60 + minutes) - (6 * 60); // Subtract 6 AM offset
  };

  // Calculate event position and height
  const calculateEventPosition = (event) => {
    const startMinutes = timeToMinutes(event.start_time);
    const endMinutes = timeToMinutes(event.end_time);
    const durationMinutes = endMinutes - startMinutes;
    
    return {
      top: (startMinutes / (16 * 60)) * 100, // 6 AM to 10 PM is 16 hours
      height: Math.max((durationMinutes / (16 * 60)) * 100, 2), // Minimum 2%
      durationHours: durationMinutes / 60
    };
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  // Format day header
  const formatDayHeader = (date) => {
    const today = new Date();
    const isToday = DateUtils.isSameDay(date, today);
    const isSelected = selectedDate && DateUtils.isSameDay(date, selectedDate);
    
    return (
      <div 
        className={`flex flex-col items-center p-2 cursor-pointer transition-all rounded-lg ${
          isToday ? 'bg-blue-100' : 
          isSelected ? 'bg-blue-50' : 
          'hover:bg-gray-50'
        }`}
        onClick={() => handleDateSelect(date)}
      >
        <div className={`text-xs font-medium ${
          isToday ? 'text-blue-600' : 
          isSelected ? 'text-blue-700' : 
          'text-gray-600'
        }`}>
          {date.toLocaleDateString('en-US', { weekday: 'short' })}
        </div>
        <div className={`text-lg font-semibold mt-1 ${
          isToday ? 'text-blue-600' : 
          isSelected ? 'text-blue-700' : 
          'text-gray-900'
        }`}>
          {date.getDate()}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {date.toLocaleDateString('en-US', { month: 'short' })}
        </div>
      </div>
    );
  };

  // Get color for event
  const getEventColor = (event, isHovered = false) => {
    if (event.status === EVENT_STATUS.CANCELLED) {
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        hover: 'hover:bg-red-100'
      };
    }
    
    // Use a consistent color based on event title hash
    const colors = [
      { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', hover: 'hover:bg-blue-100' },
      { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', hover: 'hover:bg-green-100' },
      { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', hover: 'hover:bg-purple-100' },
      { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', hover: 'hover:bg-orange-100' },
      { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', hover: 'hover:bg-indigo-100' },
    ];
    
    const hash = event.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Render event
  const renderEvent = (event, dayIndex) => {
    const position = calculateEventPosition(event);
    const color = getEventColor(event);
    const isCancelled = event.status === EVENT_STATUS.CANCELLED;
    const durationText = DateUtils.formatDuration(position.durationHours);
    
    return (
      <div
        key={event.id}
        className={`absolute left-0 right-0 mx-1 rounded border ${color.border} ${color.bg} ${color.hover} 
          cursor-pointer transition-all duration-200 overflow-hidden group z-10
          ${isCancelled ? 'opacity-60 line-through' : ''}
          hover:shadow-md hover:z-20`}
        style={{
          top: `${position.top}%`,
          height: `${position.height}%`,
          minHeight: '24px'
        }}
        onClick={(e) => {
          e.stopPropagation();
          onEventClick(event);
        }}
        title={`${event.title} (${DateUtils.formatTime(event.start_time)} - ${DateUtils.formatTime(event.end_time)})`}
      >
        <div className="p-1 h-full flex flex-col">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className={`text-xs font-medium truncate ${color.text}`}>
                {DateUtils.formatTime(event.start_time)}
              </div>
              <div className={`text-xs font-semibold truncate mt-0.5 ${isCancelled ? 'text-red-700' : 'text-gray-900'}`}>
                {event.title}
              </div>
            </div>
            {position.durationHours >= 0.75 && (
              <div className="text-xs text-gray-500 ml-1 flex-shrink-0">
                {durationText}
              </div>
            )}
          </div>
          
          {event.description && position.durationHours >= 1.5 && (
            <div className="text-xs text-gray-600 truncate mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {event.description}
            </div>
          )}
          
          {/* Time indicator for current events */}
          {event.status === EVENT_STATUS.SCHEDULED && 
           DateUtils.isTimeBetween(DateUtils.getCurrentTime(), event.start_time, event.end_time) &&
           DateUtils.isSameDay(new Date(event.event_date), new Date()) && (
            <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Week Header */}
      <div className="grid grid-cols-8 border-b border-gray-200">
        <div className="p-3 border-r border-gray-200 bg-gray-50">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Time
          </div>
        </div>
        {weekDays.map((date, index) => (
          <div key={index} className="border-r border-gray-200 last:border-r-0">
            {formatDayHeader(date)}
          </div>
        ))}
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-8 divide-x divide-gray-200 overflow-y-auto max-h-[calc(100vh-250px)]">
        {/* Time column */}
        <div className="relative">
          {timeSlots.map((slot, index) => (
            <div
              key={index}
              className={`relative border-b border-gray-100 ${
                slot.isHourMark ? 'h-16' : 'h-8'
              }`}
            >
              {slot.isHourMark && (
                <div className="absolute -top-2 left-2 text-xs text-gray-400 bg-white px-1">
                  {slot.label}
                </div>
              )}
              {slot.isHourMark && index < timeSlots.length - 1 && (
                <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100"></div>
              )}
            </div>
          ))}
          
          {/* Current time indicator */}
          {DateUtils.isSameDay(new Date(), currentDate) && (
            <div
              className="absolute left-0 right-0 z-30 pointer-events-none"
              style={{
                top: `${((DateUtils.getTimeInMinutes(DateUtils.getCurrentTime()) - 360) / (16 * 60)) * 100}%`
              }}
            >
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="h-0.5 bg-red-500 flex-1"></div>
              </div>
            </div>
          )}
        </div>

        {/* Day columns */}
        {weekDays.map((date, dayIndex) => {
          const dayEvents = getEventsForDay(date);
          const isToday = DateUtils.isSameDay(date, new Date());
          const isSelected = selectedDate && DateUtils.isSameDay(date, selectedDate);
          
          return (
            <div 
              key={dayIndex}
              className={`relative ${
                isToday ? 'bg-blue-50 bg-opacity-20' : 
                isSelected ? 'bg-blue-50 bg-opacity-10' : ''
              }`}
            >
              {/* Time grid lines */}
              {timeSlots.map((slot, index) => (
                <div
                  key={index}
                  className={`relative border-b border-gray-100 ${
                    slot.isHourMark ? 'h-16' : 'h-8'
                  }`}
                >
                  {slot.isHourMark && index < timeSlots.length - 1 && (
                    <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100"></div>
                  )}
                </div>
              ))}
              
              {/* Events */}
              {dayEvents.map((event) => renderEvent(event, dayIndex))}
              
              {/* Empty state */}
              {dayEvents.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center p-4">
                    <div className="text-gray-300 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-400">No events</p>
                  </div>
                </div>
              )}
              
              {/* Add event button */}
              <div className="absolute bottom-2 right-2">
                <button
                  onClick={() => {
                    console.log('Quick add event for', date);
                  }}
                  className="p-1.5 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 hover:shadow-md transition-all opacity-0 hover:opacity-100"
                  title="Add event"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Week Summary */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{events.filter(e => e.status === EVENT_STATUS.SCHEDULED).length}</span> events this week
          </div>
          <div className="flex items-center space-x-4 text-xs">
            {weekDays.map((date, index) => {
              const dayEvents = getEventsForDay(date);
              if (dayEvents.length === 0) return null;
              
              return (
                <div key={index} className="flex items-center">
                  <span className="text-gray-500 mr-1">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}:
                  </span>
                  <span className="font-medium text-gray-700">
                    {dayEvents.length}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekView;