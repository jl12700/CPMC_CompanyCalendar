// src/pages/CreateEventPage.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Lock, AlertCircle, Loader2, Calendar, Clock, X, User, MapPin } from 'lucide-react';
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

  const [showModal, setShowModal] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const [userName, setUserName] = useState('');

  useEffect(() => {
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
  }, []);

  const handleFormSubmit = (formData) => {
    if (!isAuthenticated) {
      setError('You must be logged in to create events');
      return;
    }
    setPendingData(formData);
    setShowModal(true);
  };

  const handleConfirm = async () => {
    if (!pendingData) return;
    setLoading(true);
    setError('');

    const { success, data, error: createError } = await createEvent(pendingData);

    if (success) {
      navigate('/calendar', { state: { message: 'Event created successfully!', eventTitle: data.title } });
    } else {
      setError(createError || 'Failed to create event');
      setLoading(false);
      setShowModal(false);
    }
  };

  const handleCancel = () => navigate('/calendar');
  const handleLogin = () => navigate('/login', { state: { from: '/create-event' } });

  const formatDateSummary = (dateStr) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  if (authLoading) return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Verifying credentials...</p>
      </div>
    </MainLayout>
  );

  if (!isAuthenticated) return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign in Required</h2>
            <p className="text-slate-600 mb-8">You need to be logged in to access the event creation tools.</p>
            <div className="space-y-3">
              <button onClick={handleLogin} className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg">Log In</button>
              <button onClick={handleCancel} className="w-full px-4 py-2.5 text-slate-700 rounded-lg border border-transparent hover:border-slate-200">Back to Calendar</button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-1 py-1 space-y-6 text-left">
        <div className="flex flex-row items-center justify-between w-full border-b border-gray-100 pb-4">
          <div className="text-left">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-left">Create Event</h1>
            <p className="text-sm text-slate-500 mt-1 text-left">Schedule a meeting</p>
          </div>
          <button onClick={handleCancel} className="inline-flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg">
            Go to Calendar <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {(error || eventsError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="text-red-700">
              <h3 className="text-sm font-semibold">Unable to create event</h3>
              <p className="text-sm mt-1">{error || eventsError}</p>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto w-full pt-2 relative">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="h-1.5 bg-blue-600 w-full"></div>
            <div className="p-6 sm:p-8">
              <EventForm
                onSubmit={handleFormSubmit}
                onCancel={handleCancel}
                loading={loading}
                userName={userName}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && pendingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Confirm Event</h3>
                <p className="text-sm text-slate-500 mt-1">Please review details before posting.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Event Title</p>
                  <p className="text-slate-900 font-medium">{pendingData.title}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date & Time</p>
                  <p className="text-slate-900 font-medium">
                    {formatDateSummary(pendingData.event_date)} to {pendingData.end_time}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-blue-50 rounded-lg text-blue-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Location</p>
                  <p className="text-slate-900 font-medium">{pendingData.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-blue-50 rounded-lg text-blue-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Facilitated by</p>
                  <p className="text-slate-900 font-medium">{pendingData.facilitator || pendingData.created_by}</p>
                </div>
              </div>

              {pendingData.description && (
                <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Required Attendees</p>
                  <p className="italic">{pendingData.description}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 flex gap-3 justify-end border-t border-slate-100">
              <button 
                onClick={() => setShowModal(false)} 
                disabled={loading} 
                className="px-4 py-2 text-sm font-medium text-slate-700 border rounded-lg hover:bg-white"
              >
                Keep Editing
              </button>
              <button 
                onClick={handleConfirm} 
                disabled={loading} 
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Confirm & Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default CreateEventPage;