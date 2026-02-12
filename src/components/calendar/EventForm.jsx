import { useState, useEffect } from 'react';
import { useEvents } from '../../hooks/useEvents';
import { AlertCircle } from 'lucide-react';
import { EVENT_STATUS, formatStatus, getStatusStyles } from '../../lib/supabase';

export const EventForm = ({
  onSubmit,
  onCancel,
  loading,
  initialData = {},
  editMode = false,
  userName
}) => {
  const [title, setTitle] = useState(initialData.title || '');
  const [date, setDate] = useState(initialData.event_date || '');
  const [startTime, setStartTime] = useState(initialData.start_time || '');
  const [endTime, setEndTime] = useState(initialData.end_time || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [location, setLocation] = useState(initialData.location || '');
  const [status, setStatus] = useState(initialData.status || EVENT_STATUS.SCHEDULED);
  const [postponedReason, setPostponedReason] = useState(initialData.postponed_reason || '');

  const [formError, setFormError] = useState('');
  const [conflictWarning, setConflictWarning] = useState('');
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
    if (!date || !startTime || !endTime || !validateTimes()) return true;
    if (status === EVENT_STATUS.CANCELLED || status === EVENT_STATUS.POSTPONED) return true;

    setCheckingConflicts(true);
    setConflictWarning('');

    const excludeEventId = editMode ? initialData.id : null;
    const { hasConflicts, error } = await checkConflicts(
      date,
      startTime,
      endTime,
      excludeEventId
    );

    setCheckingConflicts(false);

    if (error) {
      console.warn('Conflict check failed:', error);
      return true; // do not block
    }

    if (hasConflicts) {
      setConflictWarning('Another event exists at this time. This event will still be created.');
    }

    return true; // ✅ always allow submit
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title || !date || !startTime || !endTime || !location) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (!validateTimes()) return;

    await checkForConflicts(); // warning-only

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

    if (status === EVENT_STATUS.SCHEDULED && initialData.status === EVENT_STATUS.POSTPONED) {
      eventData.original_date = null;
    }

    if (status === EVENT_STATUS.POSTPONED && !initialData.original_date) {
      eventData.original_date = initialData.event_date || date;
    }

    await onSubmit(eventData);
  };

  const today = new Date().toISOString().split('T')[0];
  const isPostponed = status === EVENT_STATUS.POSTPONED;
  const styles = getStatusStyles(status);

  const inputClasses =
    'w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-100';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Status Badge */}
      {editMode && (
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div>
            <p className="text-sm text-gray-500">Current Status</p>
            <p className={`text-lg font-bold ${styles.text}`}>
              {formatStatus(status)}
            </p>
          </div>
        </div>
      )}

      {/* Errors */}
      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex gap-3">
          <AlertCircle className="w-5 h-5" />
          {formError}
        </div>
      )}

      {/* ⚠️ Warning */}
      {conflictWarning && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 flex gap-3">
          <AlertCircle className="w-5 h-5" />
          {conflictWarning}
        </div>
      )}

      {/* Status Selector */}
      {editMode && (
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
      )}

      {/* Postponed Reason */}
      {isPostponed && editMode && (
        <textarea
          value={postponedReason}
          onChange={(e) => setPostponedReason(e.target.value)}
          className={inputClasses}
          rows={2}
        />
      )}

      {/* Fields */}
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClasses} placeholder="Event Title *" />
      <input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} className={inputClasses} />
      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClasses} />
      <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClasses} />
      <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClasses} placeholder="Location *" />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClasses} />

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="px-5 py-2 border rounded-xl">
          Cancel
        </button>
        <button type="submit" disabled={loading || checkingConflicts} className="px-5 py-2 bg-blue-600 text-white rounded-xl">
          {loading ? 'Saving...' : 'Save Event'}
        </button>
      </div>
    </form>
  );
};
