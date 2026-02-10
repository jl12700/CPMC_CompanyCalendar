// src/components/calendar/EventForm.jsx
import { useState } from 'react';

export const EventForm = ({ onSubmit, onCancel, loading }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !date || !startTime || !endTime) {
      setError('All fields are required.');
      return;
    }

    if (startTime >= endTime) {
      setError('End time must be after start time.');
      return;
    }

    // Pass data to parent handler
    await onSubmit({ title, event_date: date, start_time: startTime, end_time: endTime });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500">{error}</p>}
      <div>
        <label className="block font-medium">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block font-medium">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full border rounded px-3 py-2"
        />
      </div>
      <div className="flex gap-2">
        <div>
          <label className="block font-medium">Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium">End Time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1 border rounded px-3 py-2"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-500 text-white rounded">
          {loading ? 'Saving...' : 'Create Event'}
        </button>
      </div>
    </form>
  );
};
