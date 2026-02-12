// src/pages/EditEventPage.js
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { EventForm } from '../components/calendar/EventForm';
import { useEvents } from '../hooks/useEvents';
import { supabase } from '../lib/supabase';
import { ChevronRight, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { EVENT_STATUS } from '../lib/supabase';

export default function EditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { events, updateEvent, loading } = useEvents();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [userName, setUserName] = useState('');

  // Find the event to edit
  const eventToEdit = events.find(event => event.id === id);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsAuthenticated(true);
          setUserName(user.user_metadata.full_name || 'Unknown');
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error(err);
        setIsAuthenticated(false);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    // Redirect if event not found
    if (!loading && !eventToEdit && id) {
      navigate('/calendar', { 
        state: { 
          message: 'Event not found or may have been deleted.',
          type: 'error'
        }
      });
    }
  }, [eventToEdit, loading, id, navigate]);

  const handleSubmit = async (formData) => {
    if (!id || !isAuthenticated) {
      setError('You must be logged in to edit events');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const eventData = {
        ...formData,
        id: id
      };

      const { success, error: updateError } = await updateEvent(id, eventData);
      
      if (success) {
        navigate('/calendar', { 
          state: { 
            message: 'Event updated successfully!',
            type: 'success'
          }
        });
      } else {
        setError(updateError || 'Failed to update event. Please try again.');
      }
    } catch (err) {
      console.error('Error updating event:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/calendar');
  };

  const handleBack = () => {
    if (location.state?.from === 'calendar') {
      navigate('/calendar');
    } else {
      handleCancel();
    }
  };

  if (authLoading || (loading && !eventToEdit)) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Loading event details...</p>
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign in Required</h2>
              <p className="text-slate-600 mb-8">You need to be logged in to edit events.</p>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/login', { state: { from: `/edit-event/${id}` } })} 
                  className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Log In
                </button>
                <button 
                  onClick={handleCancel} 
                  className="w-full px-4 py-2.5 text-slate-700 rounded-lg border border-transparent hover:border-slate-200 transition-colors"
                >
                  Back to Calendar
                </button>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!eventToEdit) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-slate-700 mb-2">
              Event Not Found
            </h2>
            <p className="text-slate-500 mb-6">
              The event you're trying to edit may have been deleted or doesn't exist.
            </p>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Calendar
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-1 py-1 space-y-6 text-left">
        {/* Header */}
        <div className="flex flex-row items-center justify-between w-full border-b border-gray-100 pb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBack}
              className="inline-flex items-center px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </button>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Event</h1>
              <p className="text-sm text-slate-500 mt-1">
                {eventToEdit.status === EVENT_STATUS.POSTPONED ? 
                  "Reschedule this postponed event" : 
                  "Update event details"}
              </p>
            </div>
          </div>
          <button 
            onClick={handleCancel} 
            className="inline-flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Go to Calendar <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="text-red-700">
              <h3 className="text-sm font-semibold">Unable to update event</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Event Form */}
        <div className="max-w-3xl mx-auto w-full pt-2 relative">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="h-1.5 bg-blue-600 w-full"></div>
            <div className="p-6 sm:p-8">
              <EventForm
                initialData={eventToEdit}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={isSubmitting}
                editMode={true}
                userName={userName}
              />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}