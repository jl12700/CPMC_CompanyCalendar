import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventForm } from '../components/calendar/EventForm';
import { useEvents } from '../hooks/useEvents';
import MainLayout from '../components/layout/MainLayout';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { createEvent } = useEvents();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    setLoading(true);
    const { success } = await createEvent(formData);
    if (success) {
      navigate('/calendar');
    } else {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate(-1);

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
          <p className="text-gray-600 mt-2">
            Schedule a new meeting, appointment, or reminder
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
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
