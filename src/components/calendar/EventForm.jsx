// src/components/calendar/EventForm.jsx
import { useState, useEffect } from 'react';
import { useEvents } from '../../hooks/useEvents';

export const EventForm = ({ onSubmit, onCancel, loading, initialData = {}, editMode = false }) => {
  const [title, setTitle] = useState(initialData.title || '');
  const [date, setDate] = useState(initialData.event_date || '');
  const [startTime, setStartTime] = useState(initialData.start_time || '');
  const [endTime, setEndTime] = useState(initialData.end_time || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [formError, setFormError] = useState('');
  const [conflictError, setConflictError] = useState('');
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  
  const { checkConflicts } = useEvents();

  // Initialize form when initialData changes
  useEffect(() => {
    if (editMode && initialData) {
      setTitle(initialData.title || '');
      setDate(initialData.event_date || '');
      setStartTime(initialData.start_time || '');
      setEndTime(initialData.end_time || '');
      setDescription(initialData.description || '');
    }
  }, [editMode, initialData]);

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
      const conflictTitles = conflicts.slice(0, 2).map(c => c.title).join(', ');
      const more = conflicts.length > 2 ? ` and ${conflicts.length - 2} more` : '';
      setConflictError(`Time conflict detected with: ${conflictTitles}${more}`);
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
      setFormError('Please fill in all required fields.');
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
    
    await onSubmit(eventData);
  };

  // Format today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">
          {editMode ? 'Edit Event' : 'Create New Event'}
        </h2>
        <p className="text-gray-600 mt-1">
          {editMode ? 'Update your event details below' : 'Fill in the details to schedule a new event'}
        </p>
      </div>

      {/* Error Messages */}
      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium text-red-800">Validation Error</p>
              <p className="text-red-700 text-sm mt-1">{formError}</p>
            </div>
          </div>
        </div>
      )}
      
      {conflictError && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium text-yellow-800">Time Conflict</p>
              <p className="text-yellow-700 text-sm mt-1">{conflictError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="Input events here"
            disabled={loading || checkingConflicts}
            required
          />
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              disabled={loading || checkingConflicts}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time *
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              disabled={loading || checkingConflicts}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Time *
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              disabled={loading || checkingConflicts}
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
            <span className="text-gray-500 text-sm font-normal ml-1">(Optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="Add any additional details, notes, or agenda for this event..."
            rows={4}
            disabled={loading || checkingConflicts}
          />
          <p className="text-xs text-gray-500 mt-2">
            Add details like meeting agenda, location, or important notes.
          </p>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || checkingConflicts}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || checkingConflicts}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
        >
          {checkingConflicts ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Checking conflicts...
            </span>
          ) : loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {editMode ? 'Saving changes...' : 'Creating event...'}
            </span>
          ) : editMode ? (
            'Save Changes'
          ) : (
            'Create Event'
          )}
        </button>
      </div>
    </form>
  );
};