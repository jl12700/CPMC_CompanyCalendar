import { useState } from 'react';
import { format } from 'date-fns';
import MainLayout from '../components/layout/MainLayout';
import { EventCard } from '../components/calendar/EventCard';
import Modal from '../components/ui/Modal';
import { EventForm } from '../components/calendar/EventForm';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import Select from '../components/ui/Select';
import { useEvents } from '../hooks/useEvents';


const SchedulePage = () => {
  const { events, loading, updateEvent, deleteEvent } = useEvents();
  const [filter, setFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  const filteredEvents = events.filter(event => {
    switch (filter) {
      case 'upcoming': return event.event_date >= today && event.status === 'scheduled';
      case 'past': return event.event_date < today;
      case 'scheduled': return event.status === 'scheduled';
      case 'postponed': return event.status === 'postponed';
      case 'cancelled': return event.status === 'cancelled';
      default: return true;
    }
  });

  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const date = event.event_date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(event);
    return groups;
  }, {});

  const handleEdit = event => { setSelectedEvent(event); setIsModalOpen(true); };
  const handleSubmit = async formData => {
    setIsSaving(true);
    const { success } = await updateEvent(selectedEvent.id, formData);
    if (success) { setIsModalOpen(false); setSelectedEvent(null); }
    setIsSaving(false);
  };
  const handleDelete = async eventId => { await deleteEvent(eventId); };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">My Schedule</h1>
          <Select value={filter} onChange={e => setFilter(e.target.value)} options={[
            { label: 'All Events', value: 'all' },
            { label: 'Upcoming', value: 'upcoming' },
            { label: 'Past Events', value: 'past' },
            { label: 'Scheduled', value: 'scheduled' },
            { label: 'Postponed', value: 'postponed' },
            { label: 'Cancelled', value: 'cancelled' },
          ]} className="w-48" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" text="Loading schedule..." /></div>
        ) : filteredEvents.length === 0 ? (
          <EmptyState title="No events found" description={filter === 'all' ? "You haven't created any events yet." : `No ${filter} events found.`} action actionLabel="Create Event" onAction={() => (window.location.href = '/create-event')} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedEvents).sort().map(date => (
              <div key={date} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">{format(new Date(date), 'EEEE, MMMM d, yyyy')}</h3>
                </div>
                <div className="p-4 space-y-3">
                  {groupedEvents[date].sort((a, b) => a.start_time.localeCompare(b.start_time)).map(event => (
                    <EventCard key={event.id} event={event} onEdit={handleEdit} onDelete={handleDelete} onReschedule={handleEdit} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedEvent(null); }} title="Edit Event" size="lg">
          <EventForm event={selectedEvent} onSubmit={handleSubmit} onCancel={() => { setIsModalOpen(false); setSelectedEvent(null); }} loading={isSaving} />
        </Modal>
      </div>
    </MainLayout>
  );
};

export default SchedulePage;
