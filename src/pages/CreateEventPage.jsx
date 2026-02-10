// src/pages/CreateEventPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Lock, AlertCircle, CalendarPlus, Loader2 } from 'lucide-react';
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

  const handleCancel = () => navigate('/calendar');
  const handleLogin = () => navigate('/login', { state: { from: '/create-event' } });

  // --- Loading State ---
  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Verifying credentials...</p>
        </div>
      </MainLayout>
    );
  }

  // --- Unauthenticated State ---
  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in Required</h2>
              <p className="text-gray-600 mb-8">
                You need to be logged in to access the event creation tools.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={handleLogin}
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-100"
                >
                  Log In
                </button>
                <button
                  onClick={handleCancel}
                  className="w-full px-4 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
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

  // --- Main Form State ---
  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          
          {/* Navigation & Header */}
          <div className="mb-8 space-y-4">
            <button
              onClick={handleCancel}
              className="group flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-white mr-1 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </div>
              Back to Calendar
            </button>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create New Event</h1>
                <p className="text-gray-500 mt-2 text-lg">
                  Schedule a meeting, appointment, or reminder for your team.
                </p>
              </div>
              <div className="hidden sm:block p-3 bg-blue-50 rounded-lg">
                <CalendarPlus className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {(error || eventsError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-red-700">
                <h3 className="text-sm font-semibold">Unable to create event</h3>
                <p className="text-sm mt-1">{error || eventsError}</p>
              </div>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Optional: Header strip for the card if you want more separation */}
            <div className="h-1 bg-blue-600 w-full"></div>
            
            <div className="p-6 sm:p-8">
              <EventForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
              />
            </div>
          </div>
          
        </div>
      </div>
    </MainLayout>
  );
};

export default CreateEventPage;