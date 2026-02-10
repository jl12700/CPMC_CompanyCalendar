import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isToday,
  isPast,
  isFuture,
  parseISO,
} from 'date-fns';

const DateUtils = {
  formatDate: (date, formatStr = 'PPP') => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  },

  formatTime: (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  },

  formatDateTime: (date, time) => `${DateUtils.formatDate(date, 'MMM d, yyyy')} at ${DateUtils.formatTime(time)}`,

  getWeekDays: (date) => {
    const start = startOfWeek(date, { weekStartsOn: 0 });
    const end = endOfWeek(date, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  },

  getMonthDays: (date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachDayOfInterval({ start, end });
  },

  getCalendarDays: (date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  },

  isSameDay: (date1, date2) => {
    if (!date1 || !date2) return false;
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
    return isSameDay(d1, d2);
  },

  isSameMonth: (date1, date2) => {
    if (!date1 || !date2) return false;
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
    return isSameMonth(d1, d2);
  },

  isToday: (date) => {
    if (!date) return false;
    const d = typeof date === 'string' ? parseISO(date) : date;
    return isToday(d);
  },

  isPast: (date) => {
    if (!date) return false;
    const d = typeof date === 'string' ? parseISO(date) : date;
    return isPast(d) && !isToday(d);
  },

  isFuture: (date) => {
    if (!date) return false;
    const d = typeof date === 'string' ? parseISO(date) : date;
    return isFuture(d);
  },

  navigateMonth: (date, direction) => (direction === 'next' ? addMonths(date, 1) : subMonths(date, 1)),
  navigateWeek: (date, direction) => (direction === 'next' ? addWeeks(date, 1) : subWeeks(date, 1)),

  getEventsForDate: (events, date) => events.filter((e) => DateUtils.isSameDay(e.event_date, date)),
  getEventsForDateRange: (events, startDate, endDate) =>
    events.filter((e) => {
      const eventDate = parseISO(e.event_date);
      return eventDate >= startDate && eventDate <= endDate;
    }),

  sortEventsByTime: (events) => [...events].sort((a, b) => a.start_time.localeCompare(b.start_time)),

  isValidTimeRange: (startTime, endTime) => startTime && endTime && startTime < endTime,

  parseTimeToMinutes: (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  },

  getEventDuration: (startTime, endTime) => DateUtils.parseTimeToMinutes(endTime) - DateUtils.parseTimeToMinutes(startTime),

  getTodayDateString: () => format(new Date(), 'yyyy-MM-dd'),
  getCurrentTimeString: () => format(new Date(), 'HH:mm'),

  roundToNearestQuarterHour: (time = null) => {
    const date = time ? new Date(time) : new Date();
    const minutes = date.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    date.setMinutes(roundedMinutes);
    date.setSeconds(0);
    return format(date, 'HH:mm');
  },
};

export default DateUtils;
