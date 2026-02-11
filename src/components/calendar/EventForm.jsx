import { useState, useEffect } from 'react';
import { useEvents } from '../../hooks/useEvents';
import { User, AlertCircle, Calendar, Clock, MapPin } from 'lucide-react';
import { EVENT_STATUS, formatStatus, getStatusStyles } from '../../lib/supabase';

export const EventForm = ({ onSubmit, onCancel, loading, initialData = {}, editMode = false, userName }) => {
  const [title, setTitle] = useState(initialData.title || '');
  const [date, setDate] = useState(initialData.event_date || '');
  const [startTime, setStartTime] = useState(initialData.start_time || '');
  const [endTime, setEndTime] = useState(initialData.end_time || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [location, setLocation] = useState(initialData.location || '');
  const [status, setStatus] = useState(initialData.status || EVENT_STATUS.SCHEDULED);
  const [postponedReason, setPostponedReason] = useState(initialData.postponed_reason || '');
  const [formError, setFormError] = useState('');
  const [conflictError, setConflictError] = useState('');
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  const { checkConflicts } = useEvents();

  useEffect(() => {
    if (editMode && initialData) {
      setTitle(initialData.title || '');
      setDate(initialData.event_date || '');
      setStartTime(initialData.start_time || '');
      setEndTime(initialData.end_time || '');
      setDescription(initialData.description || '');
      setLocation(initialData.location || '');
      setStatus(initialData.status || EVENT_STATUS.SCHEDULED);
      setPostponedReason(initialData.postponed_reason || '');
    }
  }, [editMode, initialData]);

  useEffect(() => {
    if (date && startTime && endTime) validateTimes();
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
    if (!date || !startTime || !endTime || !validateTimes()) return false;
    if (status === EVENT_STATUS.CANCELLED || status === EVENT_STATUS.POSTPONED) return true;

    setCheckingConflicts(true);
    setConflictError('');

    const excludeEventId = editMode ? initialData.id : null;
    const { hasConflicts, conflicts, error } = await checkConflicts(date, startTime, endTime, excludeEventId);

    setCheckingConflicts(false);

    if (error) {
      setConflictError('Error checking for conflicts. Please try again.');
      return false;
    }

      if (hasConflicts) {
    // Optional: show warning but DO NOT block
    console.warn('Time overlap detected, but allowed.');
    // setConflictError(...) ← remove this
    return true; // ✅ allow submission
  }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setConflictError('');

    if (!title || !date || !startTime || !endTime || !location) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (!validateTimes()) return;

    const noConflicts = await checkForConflicts();
    if (!noConflicts) return;

    const eventData = { 
      title, 
      event_date: date, 
      start_time: startTime, 
      end_time: endTime,
      description: description || null,
      location,
      created_by: userName || 'Unknown',
      status,
      postponed_reason: postponedReason || null
    };
    
    // If rescheduling from postponed, clear original_date
    if (status === EVENT_STATUS.SCHEDULED && initialData.status === EVENT_STATUS.POSTPONED) {
      eventData.original_date = null;
    }
    
    // If postponing, store original date if not already stored
    if (status === EVENT_STATUS.POSTPONED && !initialData.original_date) {
      eventData.original_date = initialData.event_date || date;
    }
    
    await onSubmit(eventData);
  };

  const today = new Date().toISOString().split('T')[0];
  const isPostponed = status === EVENT_STATUS.POSTPONED;
  const styles = getStatusStyles(status);

  const inputClasses = "w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Status Badge - Edit Mode Only */}
      {editMode && (
        <div className="flex items-center justify-between p-4 rounded-lg border" style={{ backgroundColor: styles.bg.replace('bg-', '') + '20', borderColor: styles.border.replace('border-', '') }}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${styles.badge.split(' ')[0]}`}></div>
            <div>
              <p className="text-sm font-medium text-gray-700">Current Status</p>
              <p className={`text-lg font-bold ${styles.text}`}>{formatStatus(status)}</p>
            </div>
          </div>
          {initialData.original_date && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Original Date</p>
              <p className="text-sm font-medium text-gray-700">
                {new Date(initialData.original_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Messages */}
      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>{formError}</div>
        </div>
      )}
      {conflictError && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>{conflictError}</div>
        </div>
      )}

      {/* Status Selector - Edit Mode Only */}
      {editMode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Change Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputClasses}
            disabled={loading || checkingConflicts}
          >
            <option value={EVENT_STATUS.SCHEDULED}>Scheduled</option>
            <option value={EVENT_STATUS.POSTPONED}>Postponed</option>
            <option value={EVENT_STATUS.CANCELLED}>Cancelled</option>
            <option value={EVENT_STATUS.COMPLETED}>Completed</option>
          </select>
        </div>
      )}

      {/* Postponed Reason - Only show when status is POSTPONED */}
      {isPostponed && editMode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Postponed Reason (Optional)
          </label>
          <textarea
            value={postponedReason}
            onChange={(e) => setPostponedReason(e.target.value)}
            placeholder="Why is this event being postponed?"
            rows={2}
            className={inputClasses}
            disabled={loading || checkingConflicts}
          />
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Event Title *</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className={inputClasses} 
            disabled={loading || checkingConflicts || status === EVENT_STATUS.CANCELLED} 
            required 
          />
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              min={today} 
              className={inputClasses} 
              disabled={loading || checkingConflicts || status === EVENT_STATUS.CANCELLED} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
            <input 
              type="time" 
              value={startTime} 
              onChange={(e) => setStartTime(e.target.value)} 
              className={inputClasses} 
              disabled={loading || checkingConflicts || status === EVENT_STATUS.CANCELLED} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
            <input 
              type="time" 
              value={endTime} 
              onChange={(e) => setEndTime(e.target.value)} 
              className={inputClasses} 
              disabled={loading || checkingConflicts || status === EVENT_STATUS.CANCELLED} 
              required 
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
          <input 
            type="text" 
            value={location} 
            onChange={(e) => setLocation(e.target.value)} 
            className={inputClasses} 
            disabled={loading || checkingConflicts || status === EVENT_STATUS.CANCELLED} 
            required 
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-gray-500 text-sm font-normal ml-1">(Optional)</span>
          </label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            rows={4} 
            placeholder="Add any notes or agenda..." 
            className={inputClasses} 
            disabled={loading || checkingConflicts} 
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-gray-200">
        <button 
          type="button" 
          onClick={onCancel} 
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          disabled={loading || checkingConflicts}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={loading || checkingConflicts}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {checkingConflicts ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Checking Conflicts...
            </>
          ) : editMode ? (
            loading ? 'Saving Changes...' : 'Save Changes'
          ) : (
            loading ? 'Creating Event...' : 'Create Event'
          )}
        </button>
      </div>
    </form>
  );
};