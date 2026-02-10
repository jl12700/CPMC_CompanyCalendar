import { useState } from 'react';
import MonthView from '../components/calendar/MonthView';
import WeekView from '../components/calendar/WeekView';
import DateUtils from '../utils/dateUtils';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  const events = []; // fetch or pass events

  const handleNext = () => {
    const newDate =
      viewMode === 'month'
        ? DateUtils.navigateMonth(currentDate, 'next')
        : DateUtils.navigateWeek(currentDate, 'next');
    setCurrentDate(newDate);
  };

  const handlePrev = () => {
    const newDate =
      viewMode === 'month'
        ? DateUtils.navigateMonth(currentDate, 'prev')
        : DateUtils.navigateWeek(currentDate, 'prev');
    setCurrentDate(newDate);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={handlePrev} className="btn">Prev</button>
        <h2 className="text-xl font-semibold">
          {DateUtils.formatDate(currentDate, 'MMMM yyyy')}
        </h2>
        <button onClick={handleNext} className="btn">Next</button>
      </div>

      {viewMode === 'month' ? (
        <MonthView
          currentDate={currentDate}
          events={events}
          onDateClick={(date) => console.log(date)}
          onEventClick={(event) => console.log(event)}
        />
      ) : (
        <WeekView
          currentDate={currentDate}
          events={events}
          onEventClick={(event) => console.log(event)}
        />
      )}
    </div>
  );
}
