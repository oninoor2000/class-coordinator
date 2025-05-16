import { useCallback, useState, useMemo } from 'react';

import type {
  CalendarEvent,
  CalendarEventsApiResponse,
  CalendarView,
  FormOptionsApiResponse,
} from '@/lib/types/calendar-types';
import type { DateRange } from 'react-day-picker';

import { id } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { format, getDay, isSameDay, parse, startOfWeek } from 'date-fns';

import { cn } from '@/lib/utils';
import { SidebarButton } from './sidebar/sidebar-toggle';
import { eventStyleGetter } from '@/utils/calendar-utils';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';

import CalendarHeader from './calendar-header';
import SidebarEvents from './sidebar/sidebar-events';
import SidebarEventForm from './sidebar/sidebar-event-form';
import SidebarEventDetail from './sidebar/sidebar-event-detail';

const locales = {
  id: id,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function FullCalendar() {
  // Fetch events
  const { isLoading: isLoadingEvents, data: dataEvents } = useQuery({
    queryKey: ['calendarEvents'],
    queryFn: () =>
      fetch('/api/v1/calendar').then(res => res.json() as Promise<CalendarEventsApiResponse>),
  });

  // Fetch options
  const { data: dataOptions } = useQuery({
    queryKey: ['calendarOptions'],
    queryFn: () =>
      fetch('/api/v1/get-options').then(res => res.json() as Promise<FormOptionsApiResponse>),
  });

  // #### Sidebar State ####
  // Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [sidebarContent, setSidebarContent] = useState<
    'events' | 'addForm' | 'editForm' | 'showEvent'
  >('events');

  // #### Calendar State ####
  // -----------
  const [view, setView] = useState<CalendarView>('week');
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<DateRange | undefined>(undefined);

  // #### Event Handlers ####
  // -----------
  // On view change
  const onViewChange = useCallback((view: CalendarView) => {
    setView(view);
  }, []);

  // Custom time formats for 24-hour format
  const formats = useMemo(
    () => ({
      timeGutterFormat: 'HH:mm',
      eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) => {
        return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
      },
      selectRangeFormat: ({ start, end }: { start: Date; end: Date }) => {
        return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
      },
      agendaTimeFormat: 'HH:mm',
      agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) => {
        return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
      },
    }),
    []
  );

  // Custom date header component
  const DateHeader = useMemo(
    () =>
      ({ date, label, currentView }: { date: Date; label: string; currentView?: string }) => {
        const day = date.getDate();
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const isToday = isSameDay(date, new Date());

        // Only show date + day in week view
        if (currentView === 'week') {
          return (
            <>
              {isToday ? (
                <div className="flex w-full items-center justify-center gap-0.5">
                  <span className="min-w-6 rounded-md bg-emerald-600 p-1 !font-bold !text-white dark:bg-emerald-500">
                    {day}
                  </span>
                  <span className="!-translate-y-0.5 !text-sm !font-bold text-black dark:text-white">
                    {dayName}
                  </span>
                </div>
              ) : (
                <div className="flex transform items-center justify-center">
                  <span className="!font-medium dark:text-gray-300">
                    {day} {dayName}
                  </span>
                </div>
              )}
            </>
          );
        }

        if (currentView === 'month') {
          return <span className="mb-1 !text-sm !font-medium">{label}</span>;
        }

        if (currentView === 'day') {
          return (
            <div className="flex w-full items-center justify-center gap-0.5">
              <span className="min-w-6 rounded-md bg-emerald-600 p-1 !font-bold !text-white dark:bg-emerald-500">
                {day}
              </span>
              <span className="!-translate-y-0.5 !text-sm !font-bold text-black dark:text-white">
                {dayName}
              </span>
            </div>
          );
        }

        // For other views, just use the default label
        return <span>{label}</span>;
      },
    []
  );

  // Calendar Callbacks
  // -----------
  // Ensure all events have proper Date objects for start and end times
  const processedEvents = useMemo(() => {
    if (!dataEvents?.data) return [];
    return dataEvents.data.map(event => ({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end),
    }));
  }, [dataEvents?.data]);

  const handlePrevious = useCallback(() => {
    // Make sure date is a valid Date object
    const newDate = date instanceof Date ? new Date(date) : new Date();

    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }

    setDate(newDate);
  }, [date, view]);

  const handleNext = useCallback(() => {
    // Make sure date is a valid Date object
    const newDate = date instanceof Date ? new Date(date) : new Date();

    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }

    setDate(newDate);
  }, [date, view]);

  const handleToday = useCallback(() => {
    setDate(new Date());
  }, []);

  // On navigate using callbacks
  const onNavigate = useCallback(
    (action: 'prev' | 'next' | 'today') => {
      const navigationHandlers = {
        prev: handlePrevious,
        next: handleNext,
        today: handleToday,
      };

      navigationHandlers[action]();
    },
    [handlePrevious, handleNext, handleToday]
  );

  // On select slot
  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ from: start, to: end });
    setSelectedEvent(null);
    setSidebarOpen(true);
    setSidebarContent('addForm');
  }, []);

  // On select event
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setSidebarOpen(true);
    setSidebarContent('showEvent');
  }, []);

  // #### Sidebar Handlers ####
  // On close sidebar
  const handleCloseSidebar = () => {
    setSidebarContent('events');
  };

  // On close edit form sidebar
  const handleCloseEditFormSidebar = () => {
    setSidebarContent('showEvent');
  };

  // On edit event
  const handleEditEvent = () => {
    setSidebarContent('editForm');
  };

  return (
    <div className="flex h-full w-full flex-col md:flex-row">
      {/* Calendar Sidebar */}
      <motion.div
        className={cn(
          'border-border bg-card flex flex-col md:h-full md:w-96',
          sidebarOpen ? 'border-r' : 'border-r-0'
        )}
        initial={{ width: 0, x: -384 }}
        animate={{
          width: sidebarOpen ? 384 : 0,
          x: sidebarOpen ? 0 : -384,
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        <AnimatePresence mode="wait">
          {sidebarContent === 'events' && (
            <motion.div
              key="events"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex h-full flex-col"
            >
              {/* Sidebar Header */}
              <div className="border-border bg-card/20 sticky top-0 z-10 mb-4 flex flex-none items-center justify-between space-x-4 border-b p-4 backdrop-blur">
                <p className="text-base font-semibold">
                  {date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
                <SidebarButton
                  setSidebarOpen={setSidebarOpen}
                  sidebarOpen={sidebarOpen}
                  place="sidebar"
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarEvents
                  events={processedEvents}
                  handleSelectEvent={handleSelectEvent}
                  isLoading={isLoadingEvents}
                />
              </div>
            </motion.div>
          )}
          {sidebarContent === 'addForm' && (
            <motion.div
              key="addForm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="h-full"
            >
              <SidebarEventForm
                mode="create"
                onClose={handleCloseSidebar}
                options={dataOptions}
                selectedSlot={selectedSlot}
                handleSelectedEvent={handleSelectEvent}
              />
            </motion.div>
          )}
          {sidebarContent === 'editForm' && (
            <motion.div
              key="editForm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="h-full"
            >
              <SidebarEventForm
                mode="edit"
                onClose={handleCloseEditFormSidebar}
                options={dataOptions}
                initialData={selectedEvent ?? undefined}
              />
            </motion.div>
          )}
          {sidebarContent === 'showEvent' && (
            <motion.div key="showEvent" className="h-full">
              <SidebarEventDetail
                event={selectedEvent ?? undefined}
                onClose={handleCloseSidebar}
                onEdit={handleEditEvent}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Main Calendar */}
      <motion.div
        className="flex h-full flex-1 flex-col gap-2.5 overflow-hidden p-2 md:p-4"
        animate={{
          x: 0,
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        <div className="bg-accent dark:bg-accent-dark mb-2 flex w-full flex-none items-center justify-between rounded-lg p-2 backdrop-blur">
          <CalendarHeader
            date={date}
            view={view}
            onViewChange={onViewChange}
            onNavigate={onNavigate}
            setSidebarOpen={setSidebarOpen}
            sidebarOpen={sidebarOpen}
          />
        </div>
        <div className="bg-card relative flex-1 overflow-hidden rounded-lg">
          <Calendar
            localizer={localizer}
            events={processedEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            view={view}
            date={date}
            className={cn({
              'month-view-borders': view === 'month',
              'day-view-borders': view === 'day',
            })}
            components={{
              timeGutterHeader: () => <span></span>,
              header: props => <DateHeader {...props} currentView={view} />,
              agenda: {
                time: (props: unknown) => {
                  const { event } = props as { event: CalendarEvent };
                  return (
                    <span className="text-sm">
                      {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                    </span>
                  );
                },
                event: (props: unknown) => {
                  const { event } = props as { event: CalendarEvent };
                  const eventColor = event.event?.color || '#10b981'; // Use emerald-500 as fallback

                  return (
                    <div className="group relative cursor-pointer">
                      <div
                        className="absolute top-1/2 left-0 h-4/5 w-1.5 -translate-y-1/2 rounded-r-full"
                        style={{ backgroundColor: eventColor }}
                      />
                      <span className="pl-3 text-sm group-hover:underline">{event.title}</span>
                    </div>
                  );
                },
              },
            }}
            formats={formats}
            onNavigate={setDate}
            onView={newView => setView(newView as CalendarView)}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            popup
            eventPropGetter={eventStyleGetter}
            toolbar={false}
            views={{
              month: true,
              week: true,
              day: true,
              agenda: true,
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
