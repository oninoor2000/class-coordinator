import { useMemo, useState, useEffect } from 'react';

import { formatDistanceToNow } from 'date-fns';

import type { CalendarEvent } from '@/lib/types/calendar-types';

import { cn } from '@/lib/utils';
import { Skeleton } from '../../ui/skeleton';
import { ScrollArea } from '../../ui/scroll-area';
import { formatTime, getDuration } from '@/utils/calendar/calendar-utils';

import SidebarForm from './sidebar-form';

interface SidebarEventsProps {
  events?: CalendarEvent[] | undefined;
  handleSelectEvent: (event: CalendarEvent) => void;
  isLoading: boolean;
}

/**
 * This component is used to show a list of events in the sidebar.
 * It shows the event title, description, start date, end date.
 * @param events - The events to show in the sidebar.
 * @param handleSelectEvent - The function to handle the event click.
 * @param isLoading - Whether the events are loading.
 */

export default function SidebarEvents({
  events,
  handleSelectEvent,
  isLoading,
}: SidebarEventsProps) {
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    return (
      events?.filter(event => {
        const eventStart = new Date(
          event.start instanceof Date ? event.start : new Date(event.start)
        );
        return eventStart >= today && eventStart <= endOfDay;
      }) || []
    );
  }, [events]);

  // State to store the formatted time until next event
  const [timeUntilNextEvent, setTimeUntilNextEvent] = useState<string | undefined>(
    upcomingEvents.length > 0
      ? formatDistanceToNow(new Date(upcomingEvents[0].start), { addSuffix: true })
      : undefined
  );

  // Update time every minute
  useEffect(() => {
    const updateTimeUntilNextEvent = () => {
      if (upcomingEvents.length > 0) {
        setTimeUntilNextEvent(
          formatDistanceToNow(new Date(upcomingEvents[0].start), { addSuffix: true })
        );
      } else {
        setTimeUntilNextEvent(undefined);
      }
    };

    // Initial update
    updateTimeUntilNextEvent();

    // Set up interval for updates
    const intervalId = setInterval(updateTimeUntilNextEvent, 60000); // Update every minute (60000ms)

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [upcomingEvents]);

  return (
    <div className="flex h-full flex-col gap-5 pb-5">
      <div className="flex-1 overflow-hidden">
        {isLoading && (
          <>
            <p className="text-muted-foreground mb-2 w-full px-4 text-center text-sm font-medium">
              Loading events...
            </p>
            <ScrollArea className="h-[calc(100%-2rem)] px-4">
              <div className="flex flex-col space-y-2">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="w-full rounded-md">
                    <div className="flex items-center justify-start gap-2 rounded-md bg-neutral-100 p-3 dark:bg-neutral-800">
                      <Skeleton className="h-10 w-1 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                      <div className="w-full">
                        <Skeleton
                          className={`mb-1.5 h-4 ${index % 3 === 0 ? 'w-3/5' : index % 3 === 1 ? 'w-3/4' : 'w-4/5'} bg-neutral-200 dark:bg-neutral-700`}
                        />
                        <Skeleton
                          className={`h-3 ${index % 2 === 0 ? 'w-2/5' : 'w-1/2'} bg-neutral-200 dark:bg-neutral-700`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        {!isLoading && upcomingEvents.length === 0 && (
          <>
            <p className="text-muted-foreground mb-2 w-full px-4 text-left text-sm font-medium">
              No upcoming meetings
            </p>
            {/* No upcoming meetings */}
            <div className="mx-4 flex items-center justify-center rounded-md bg-neutral-200 p-4 opacity-60 dark:bg-neutral-700">
              <p className="text-sm">Take a breather</p>
            </div>
          </>
        )}

        {!isLoading && upcomingEvents.length > 0 && (
          <>
            <p className="text-muted-foreground mb-2 w-full px-4 text-left text-sm font-medium">
              {upcomingEvents.length ? timeUntilNextEvent : 'No upcoming meetings'}
            </p>
            {/* Show Meetings */}
            <ScrollArea className="h-[calc(100%-2rem)] px-4">
              <div className="flex flex-col space-y-2">
                {upcomingEvents.map(event => (
                  // Event Card
                  <button
                    key={event.id}
                    className="w-full cursor-pointer rounded-md transition-all duration-300 hover:shadow-sm"
                    onClick={() => handleSelectEvent(event)}
                  >
                    <div
                      className={cn('flex items-center justify-start gap-2 rounded-md p-3')}
                      style={
                        event.event?.color
                          ? { backgroundColor: `${event.event.color}20` }
                          : undefined
                      }
                    >
                      <div
                        className="h-10 w-1 rounded-full"
                        style={
                          event.event?.color ? { backgroundColor: event.event.color } : undefined
                        }
                      />
                      <div>
                        <p className="mb-1.5 text-left text-sm font-semibold">{event.title}</p>
                        <p className="text-left text-xs">
                          {formatTime(event.start)} - {formatTime(event.end)} ({getDuration(event)})
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </div>

      <div className="px-4">
        <SidebarForm />
      </div>
    </div>
  );
}
