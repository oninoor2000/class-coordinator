import type { CalendarEvent } from '@/lib/types/calendar-types';

export const eventStyleGetter = (event: CalendarEvent) => {
  const style = {
    backgroundColor: event.color ?? '#9b87f5',
    color: '#fff',
    border: 'none',
  };
  return {
    style,
  };
};

export const formatTime = (date: Date | string | undefined) => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

// Get duration in hours and minutes
export const getDuration = (event: CalendarEvent) => {
  if (!event?.end || !event?.start) return '0 minutes';

  const start = event.start instanceof Date ? event.start : new Date(event.start);
  const end = event.end instanceof Date ? event.end : new Date(event.end);

  const durationMs = end.getTime() - start.getTime();
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};
