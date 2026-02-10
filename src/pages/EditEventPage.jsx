// src/pages/EditEventPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EventForm } from '../components/calendar/EventForm';
import { useEvents } from '../hooks/useEvents';
import MainLayout from '../components/layout/MainLayout';
import { EVENT_STATUS } from '../lib/supabase';

const EditEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getEventById, updateEvent, deleteEvent } = useEvents();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      
      setLoading(true);
      setError('');
      
      try {
        const { data, error: fetchError } = await getEventById(id);
        
        if (fetchError) {
          setError(fetchError || 'Failed to load event');
        } else if (data) {
          setEvent(data);
        } else {
          setError('Event not found');
        }
      } catch (err) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, getEventById]);

  const handleSubmit = async (formData) => {
    if (!id || !event) return;
    
    setSaving(true);
    setError('');
    
    try {
      const { success, error: updateError } = await updateEvent(id, {
        ...formData,
        updated_at: new Date().toISOString()
      });
      
      if (success) {
        navigate('/calendar', { 
          state: { 
            message: 'Event updated successfully!',
            eventTitle: formData.title 
          } 
        });
      } else {
        setError(updateError || 'Failed to update event');
        setSaving(false);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/calendar');
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!id || !event) return;
    
    if (window.confirm(`Change event status to "${newStatus}"?`)) {
      setSaving(true);
      const { success, error: updateError } = await updateEvent(id, { 
        status: newStatus,
        updated_at: new Date().toISOString()
      });
      
      if (success) {
        setEvent(prev => ({ ...prev, status: newStatus }));
        setSaving(false);
      } else {
        setError(updateError || 'Failed to update status');
        setSaving(false);
      }
    }
  };

  const handleDuplicate = () => {
    if (!event) return;
    
    const { title, description, start_time, end_time, event_date } = event;
    navigate('/create-event', {
      state: {
        title: `Copy of ${title}`,
        description,
        start_time,
        end_time,
        event_date
      }
    });
  };

  const handleDelete = async () => {
    if (!id || !event) return;
    
    if (window.confirm(`Are you sure you want to delete "${event.title}"? This action cannot be undone.`)) {
      setSaving(true);
      const { success, error: deleteError } = await deleteEvent(id);
      
      if (success) {
        navigate('/calendar', { 
          state: { 
            message: 'Event deleted successfully!',
            eventTitle: event.title 
          } 
        });
      } else {
        setError(deleteError || 'Failed to delete event');
        setSaving(false);
      }
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show loading state
  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading event details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show error state
  if (error || !event) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {event ? 'Error' : 'Event Not Found'}
              </h2>
              <p className="text-gray-600 mb-6">
                {error || 'The event you are looking for does not exist or you do not have permission to access it.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/calendar')}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                >
                  Back to Calendar
                </button>
                <button
                  onClick={() => navigate('/create-event')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-medium transition-colors shadow-sm hover:shadow"
                >
                  Create New Event
                </button>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
            >
              <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Calendar</span>
            </button>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Edit Event
                </h1>
                <p className="text-gray-600 text-lg">
                  Update your event details below
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium ${
                  event.status === EVENT_STATUS.SCHEDULED
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : event.status === EVENT_STATUS.CANCELLED
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : event.status === EVENT_STATUS.POSTPONED
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-red-800">Unable to save changes</p>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form - 2/3 width */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8">
                  <EventForm
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={saving}
                    initialData={event}
                    editMode={true}
                  />
                </div>
              </div>
            </div>

            {/* Sidebar - 1/3 width */}
            <div className="space-y-6">
              {/* Status Update Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Update Status</h3>
                  <div className="space-y-3">
                    {Object.values(EVENT_STATUS).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusUpdate(status)}
                        disabled={saving || status === event.status}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-between ${
                          status === event.status
                            ? 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 text-blue-700'
                            : 'hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            status === EVENT_STATUS.SCHEDULED ? 'bg-emerald-500' :
                            status === EVENT_STATUS.CANCELLED ? 'bg-rose-500' :
                            status === EVENT_STATUS.POSTPONED ? 'bg-amber-500' :
                            'bg-gray-500'
                          }`}></div>
                          <span className="font-medium capitalize">{status}</span>
                        </div>
                        {status === event.status && (
                          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={handleDuplicate}
                      disabled={saving}
                      className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors border border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Duplicate Event</span>
                    </button>
                    
                    <button
                      onClick={handleDelete}
                      disabled={saving}
                      className="w-full flex items-center gap-3 px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200 hover:border-rose-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete Event</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Event History Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Event History</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-gray-900">Event Created</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(event.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    {event.updated_at && event.updated_at !== event.created_at && (
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium text-gray-900">Last Updated</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(event.updated_at)}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Current Status</p>
                        <p className="text-sm text-gray-600 capitalize">
                          {event.status}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default EditEventPage;