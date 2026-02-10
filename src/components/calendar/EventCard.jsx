import Badge from '../ui/Badge'; // default export
import DateUtils from '../../utils/dateUtils'; // default export

export const EventCard = ({ event, onEdit, onDelete, onReschedule, compact = false }) => {
  const getStatusVariant = (status) => {
    switch (status) {
      case 'scheduled':
        return 'scheduled';
      case 'postponed':
        return 'postponed';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'default';
    }
  };

  const handleQuickAction = (action, e) => {
    e.stopPropagation();
    switch (action) {
      case 'edit':
        onEdit?.(event);
        break;
      case 'delete':
        if (window.confirm('Are you sure you want to delete this event?')) {
          onDelete?.(event.id);
        }
        break;
      case 'reschedule':
        onReschedule?.(event);
        break;
      default:
        break;
    }
  };

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => onEdit?.(event)}
        style={{ borderLeft: `4px solid ${event.color}` }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
          <p className="text-xs text-gray-500">
            {DateUtils.formatTime(event.start_time)} - {DateUtils.formatTime(event.end_time)}
          </p>
        </div>
        <Badge variant={getStatusVariant(event.status)} size="sm">
          {event.status}
        </Badge>
      </div>
    );
  }

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onEdit?.(event)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: event.color }}
            />
            <h3 className="text-lg font-semibold text-gray-900 truncate">{event.title}</h3>
          </div>
          {event.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
          )}
        </div>
        <Badge variant={getStatusVariant(event.status)}>{event.status}</Badge>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
        <svg
          className="w-4 h-4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>
          {DateUtils.formatTime(event.start_time)} - {DateUtils.formatTime(event.end_time)}
        </span>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => handleQuickAction('edit', e)}
          className="text-xs px-3 py-1.5 bg-primary-50 text-primary-700 rounded hover:bg-primary-100 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={(e) => handleQuickAction('reschedule', e)}
          className="text-xs px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100 transition-colors"
        >
          Reschedule
        </button>
        <button
          onClick={(e) => handleQuickAction('delete', e)}
          className="text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
};
