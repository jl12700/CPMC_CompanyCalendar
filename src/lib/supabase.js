import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export const TABLES = {
  EVENTS: 'events',
};

export const EVENT_STATUS = {
  SCHEDULED: 'scheduled',
  POSTPONED: 'postponed',
  CANCELLED: 'cancelled',
};

export const EVENT_COLORS = [
  { name: 'Blue', value: '#0ea5e9', bg: 'bg-blue-500' },
  { name: 'Green', value: '#10b981', bg: 'bg-green-500' },
  { name: 'Purple', value: '#8b5cf6', bg: 'bg-purple-500' },
  { name: 'Orange', value: '#f59e0b', bg: 'bg-orange-500' },
  { name: 'Red', value: '#ef4444', bg: 'bg-red-500' },
  { name: 'Pink', value: '#ec4899', bg: 'bg-pink-500' },
  { name: 'Indigo', value: '#6366f1', bg: 'bg-indigo-500' },
  { name: 'Teal', value: '#14b8a6', bg: 'bg-teal-500' },
];

// Helper function to get status styles
export const getStatusStyles = (status) => {
  switch (status) {
    case EVENT_STATUS.SCHEDULED:
      return {
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: 'text-blue-500'
      };
    case EVENT_STATUS.POSTPONED:
      return {
        badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        icon: 'text-yellow-500'
      };
    case EVENT_STATUS.CANCELLED:
      return {
        badge: 'bg-red-100 text-red-800 border-red-200',
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: 'text-red-500'
      };
    default:
      return {
        badge: 'bg-gray-100 text-gray-800 border-gray-200',
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        icon: 'text-gray-500'
      };
  }
};

// Helper function to format status for display
export const formatStatus = (status) => {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// Helper function to check if event is active
export const isEventActive = (status) => {
  return status === EVENT_STATUS.SCHEDULED;
};

// Helper function to check if event is cancelled
export const isEventCancelled = (status) => {
  return status === EVENT_STATUS.CANCELLED;
};

// Helper function to check if event is postponed
export const isEventPostponed = (status) => {
  return status === EVENT_STATUS.POSTPONED;
};