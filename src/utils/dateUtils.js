// src/utils/dateUtils.js
const DateUtils = {
  // Format date to string
  formatDate: (date, format = 'yyyy-MM-dd') => {
    if (!date) return '';
    
    const d = new Date(date);
    
    const formats = {
      'yyyy-MM-dd': () => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      },
      'MMMM yyyy': () => {
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      },
      'EEE, MMM d': () => {
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      },
      'EEEE, MMMM d, yyyy': () => {
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      },
      'MM/dd/yyyy': () => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${month}/${day}/${year}`;
      }
    };

    return formats[format] ? formats[format]() : d.toISOString().split('T')[0];
  },

  // Format time (24h to 12h)
  formatTime: (timeString) => {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    
    return `${formattedHours}:${formattedMinutes} ${period}`;
  },

  // Navigate month
  navigateMonth: (date, direction) => {
    const newDate = new Date(date);
    if (direction === 'next') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    return newDate;
  },

  // Navigate week
  navigateWeek: (date, direction) => {
    const newDate = new Date(date);
    if (direction === 'next') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    }
    return newDate;
  },

  // Get week range
  formatWeekRange: (date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    
    const formatOptions = { month: 'short', day: 'numeric' };
    const startStr = startOfWeek.toLocaleDateString('en-US', formatOptions);
    const endStr = endOfWeek.toLocaleDateString('en-US', {
      ...formatOptions,
      year: startOfWeek.getFullYear() !== endOfWeek.getFullYear() ? 'numeric' : undefined
    });
    
    return `${startStr} - ${endStr}`;
  },

  // Get days in month
  getDaysInMonth: (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  },

  // Get first day of month
  getFirstDayOfMonth: (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  },

  // Check if two dates are the same day
  isSameDay: (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  },

  // Check if date is today - FIXED
  isToday: (date) => {
    const today = new Date();
    return DateUtils.isSameDay(date, today);
  },

  // Check if date is in current month - FIXED
  isCurrentMonth: (date, currentDate) => {
    const d = new Date(date);
    const current = new Date(currentDate);
    return d.getMonth() === current.getMonth() && d.getFullYear() === current.getFullYear();
  },

  // Get events for a specific date (deprecated - use getEventsForDateString instead)
  getEventsForDate: (events, date) => {
    const dateStr = DateUtils.formatDate(date, 'yyyy-MM-dd');
    return events.filter(event => event.event_date === dateStr);
  },

  // Get week days
  getWeekDays: (date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  },

  // Sort events by time
  sortEventsByTime: (events) => {
    return [...events].sort((a, b) => {
      if (a.start_time < b.start_time) return -1;
      if (a.start_time > b.start_time) return 1;
      return 0;
    });
  },

  // Get events for date (string format) - renamed to avoid conflict
  getEventsForDateString: (events, date) => {
    const dateStr = typeof date === 'string' ? date : DateUtils.formatDate(date, 'yyyy-MM-dd');
    return events.filter(event => event.event_date === dateStr);
  },

  // Calculate event duration in hours
  getEventDuration: (startTime, endTime) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    return (endMinutes - startMinutes) / 60;
  },

  // Format duration for display
  formatDuration: (hours) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours === Math.floor(hours)) {
      return `${hours}h`;
    } else {
      const wholeHours = Math.floor(hours);
      const minutes = Math.round((hours - wholeHours) * 60);
      return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
    }
  },

  // Get time in minutes from midnight
  getTimeInMinutes: (timeString) => {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  },

  // Check if time is between two times
  isTimeBetween: (time, startTime, endTime) => {
    const timeMinutes = DateUtils.getTimeInMinutes(time);
    const startMinutes = DateUtils.getTimeInMinutes(startTime);
    const endMinutes = DateUtils.getTimeInMinutes(endTime);
    
    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
  },

  // Get current time in HH:MM format
  getCurrentTime: () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  // Check if date is weekend
  isWeekend: (date) => {
    const day = new Date(date).getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  },

  // Add days to a date
  addDays: (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  // Get start of day
  startOfDay: (date) => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  },

  // Get end of day
  endOfDay: (date) => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }
};

export default DateUtils;