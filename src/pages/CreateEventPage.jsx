// src/pages/CreateEventPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventForm } from '../components/calendar/EventForm';
import { useEvents } from '../hooks/useEvents';
import { supabase } from '../lib/supabase';
import MainLayout from '../components/layout/MainLayout';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { createEvent, error: eventsError } = useEvents();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsAuthenticated(false);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleSubmit = async (formData) => {
    if (!isAuthenticated) {
      setError('You must be logged in to create events');
      return;
    }

    setLoading(true);
    setError('');
    
    const { success, data, error: createError } = await createEvent(formData);
    
    if (success) {
      navigate('/calendar', { 
        state: { 
          message: 'Event created successfully!',
          eventTitle: data.title 
        } 
      });
    } else {
      setError(createError || 'Failed to create event');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/calendar');
  };

  const handleLogin = () => {
    navigate('/login', { state: { from: '/create-event' } });
  };

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-500">Checking authentication...</div>
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in to create events.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleLogin}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Log In
              </button>
              <button
                onClick={handleCancel}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Back to Calendar
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center text-sm font-medium"
          >
            ← Back to Calendar
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
          <p className="text-gray-600 mt-2">
            Schedule a new meeting, appointment, or reminder
          </p>
        </div>

        {(error || eventsError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 font-medium">Error: {error || eventsError}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <EventForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default CreateEventPage;