// src/components/calendar/EventForm.jsx
import { useState, useEffect } from 'react';
import { useEvents } from '../../hooks/useEvents';

export const EventForm = ({ onSubmit, onCancel, loading, initialData = {}, editMode = false }) => {
  const [title, setTitle] = useState(initialData.title || '');
  const [date, setDate] = useState(initialData.event_date || '');
  const [startTime, setStartTime] = useState(initialData.start_time || '');
  const [endTime, setEndTime] = useState(initialData.end_time || '');
  const [formError, setFormError] = useState('');
  const [conflictError, setConflictError] = useState('');
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [description, setDescription] = useState(initialData.description || '');
  
  const { checkConflicts } = useEvents();

  // Validate form on changes
  useEffect(() => {
    if (date && startTime && endTime) {
      validateTimes();
    }
  }, [date, startTime, endTime]);

  const validateTimes = () => {
    if (startTime && endTime && startTime >= endTime) {
      setFormError('End time must be after start time.');
      return false;
    }
    setFormError('');
    return true;
  };

  const checkForConflicts = async () => {
    if (!date || !startTime || !endTime || !validateTimes()) {
      return false;
    }

    setCheckingConflicts(true);
    setConflictError('');
    
    const excludeEventId = editMode ? initialData.id : null;
    const { hasConflicts, conflicts, error } = await checkConflicts(
      date, 
      startTime, 
      endTime, 
      excludeEventId
    );

    setCheckingConflicts(false);

    if (error) {
      setConflictError('Error checking for conflicts. Please try again.');
      return false;
    }

    if (hasConflicts) {
      const conflictTitles = conflicts.slice(0, 3).map(c => c.title).join(', ');
      const more = conflicts.length > 3 ? ` and ${conflicts.length - 3} more` : '';
      setConflictError(`Time conflict with: ${conflictTitles}${more}`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setConflictError('');

    // Basic validation
    if (!title || !date || !startTime || !endTime) {
      setFormError('All fields are required.');
      return;
    }

    // Time validation
    if (!validateTimes()) {
      return;
    }

    // Check for conflicts
    const noConflicts = await checkForConflicts();
    if (!noConflicts) {
      return;
    }

    // Prepare data and submit
    const eventData = { 
      title, 
      event_date: date, 
      start_time: startTime, 
      end_time: endTime,
      description: description || null
    };
    
    if (editMode && initialData.id) {
      eventData.id = initialData.id;
    }

    await onSubmit(eventData);
  };

  // Format today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="font-medium">Please fix the following:</p>
          <p className="text-sm mt-1">{formError}</p>
        </div>
      )}
      
      {conflictError && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">Time Conflict Detected</p>
              <p className="text-sm mt-1">{conflictError}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Event Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          placeholder="Input name of event here"
          disabled={loading || checkingConflicts}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={today}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            disabled={loading || checkingConflicts}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Time *
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            disabled={loading || checkingConflicts}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Time *
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            disabled={loading || checkingConflicts}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          placeholder="Add any additional details about the event..."
          rows={3}
          disabled={loading || checkingConflicts}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || checkingConflicts}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || checkingConflicts}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
        >
          {checkingConflicts ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Checking...
            </span>
          ) : loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {editMode ? 'Updating...' : 'Creating...'}
            </span>
          ) : editMode ? (
            'Update Event'
          ) : (
            'Create Event'
          )}
        </button>
      </div>
    </form>
  );
};