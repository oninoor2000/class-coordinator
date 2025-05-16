import { useMemo, useState } from 'react';

import type { CalendarEvent } from '@/lib/types/calendar-types';

import { getHours, isSameDay } from 'date-fns';

import { Card, CardFooter, CardHeader, CardContent } from '@/components/ui/card';
import {
  X,
  User,
  School,
  Monitor,
  ClockIcon,
  MapPinIcon,
  CalendarIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from 'lucide-react';
import { stringToRecurrenceRule, getRecurrenceDescription } from '@/utils/recurrence-utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatTime, getDuration } from '@/utils/calendar-utils';

interface SidebarContentShowEventProps {
  event: CalendarEvent | undefined;
  onClose?: () => void;
  onEdit?: () => void;
}

/**
 * This component is used to show the event details in the sidebar.
 * It shows the event title, description, start date, end date, class type, meeting type, location, and creator.
 * It also shows the recurrence description if the event is recurring.
 * It also shows the class and subject name if the event is a class.
 * It also shows the meeting link if the event is an online or hybrid meeting.
 * It also shows the creator name and email if the event is a class.
 * @param event - The event to show.
 * @param onClose - The function to call when the close button is clicked.
 * @param onEdit - The function to call when the edit button is clicked.
 */
export default function SidebarEventDetail({
  event,
  onClose,
  onEdit,
}: SidebarContentShowEventProps) {
  const [expanded, setExpanded] = useState(false);

  //   #### Helper functions ####
  // Format date and time
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get recurrence description
  const recurrenceDescription = () => {
    if (!event?.recurrence) return null;

    const rrule = stringToRecurrenceRule(event?.recurrence ?? '');
    return getRecurrenceDescription(rrule);
  };

  // Get class type badge color
  const getClassTypeColor = () => {
    switch (event?.classType) {
      case 'theory':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'practicum':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'midterm-exams':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'end-of-semester-exams':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Get meeting type badge color
  const getMeetingTypeColor = () => {
    switch (event?.meetingType) {
      case 'offline':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300';
      case 'online':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'hybrid':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Helper function to check if the event is all day
  const checkIfAllDay = (start: Date | string | undefined, end: Date | string | undefined) => {
    if (!start || !end) return false;

    const startDate = start instanceof Date ? start : new Date(start);
    const endDate = end instanceof Date ? end : new Date(end);

    return isSameDay(startDate, endDate) && getHours(startDate) === 0 && getHours(endDate) === 0;
  };

  // Format event
  const formattedEvent = useMemo(() => {
    return {
      ...event,
      allDay: checkIfAllDay(event?.start, event?.end),
    };
  }, [event]);

  if (!event) return <div>Oops! No event found.</div>;

  return (
    <Card className="m-4 gap-0 rounded-md py-0">
      <CardHeader className="rounded-t-md bg-neutral-50 px-4 pt-2 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Event Details</span>
          <Button
            variant={'outline'}
            size={'icon'}
            className="h-6 w-6 cursor-pointer"
            onClick={onClose}
          >
            <X className="h-2 w-2" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="bg-background space-y-2 p-4">
        <div className="mb-5 flex flex-col gap-4">
          <div className="flex flex-col items-start justify-between gap-2">
            <h2 className="text-lg font-bold">{formattedEvent.title}</h2>
            <div className="flex gap-1">
              <Badge className={cn('font-medium capitalize', getClassTypeColor())}>
                {formattedEvent.classType?.replace('-', ' ')}
              </Badge>
              <Badge className={cn('font-medium capitalize', getMeetingTypeColor())}>
                {formattedEvent.meetingType}
              </Badge>
            </div>
          </div>
          {formattedEvent.description && (
            <p className="text-muted-foreground mt-1 text-sm">{formattedEvent.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <CalendarIcon className="text-muted-foreground h-4 w-4" />
          <div className="text-sm text-wrap">
            {formatDate(formattedEvent.start ?? new Date())}
            {!formattedEvent.allDay && (
              <span className="text-muted-foreground ml-1 text-wrap">
                {formatTime(formattedEvent.start ?? new Date())} -{' '}
                {formatTime(formattedEvent.end ?? new Date())} (
                {event && event.id ? getDuration(formattedEvent as CalendarEvent) : '-'})
              </span>
            )}
            {formattedEvent.allDay && <span className="text-muted-foreground ml-1">All day</span>}
          </div>
        </div>

        {recurrenceDescription() && (
          <div className="flex items-center gap-2">
            <ClockIcon className="text-muted-foreground h-4 w-4" />
            <span className="text-sm">{recurrenceDescription()}</span>
          </div>
        )}

        {formattedEvent.location && (
          <div className="flex items-center gap-2">
            <MapPinIcon className="text-muted-foreground h-4 w-4" />
            <span className="text-sm">{formattedEvent.location.name}</span>
          </div>
        )}

        <Separator />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex cursor-pointer items-center gap-2">
                <School className="text-muted-foreground min-h-4 min-w-4" />
                <div className="text-sm">
                  {formattedEvent.class?.name && (
                    <span className="font-medium">{formattedEvent.class?.name}</span>
                  )}
                  {formattedEvent.subject?.name && (
                    <span className="text-muted-foreground ml-1">
                      {formattedEvent.class?.name && '•'} {formattedEvent.subject?.name}
                    </span>
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>This is the class name and subject name</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {expanded && (
          <>
            <Separator />

            <div className="flex items-center gap-3">
              <User className="text-muted-foreground h-4 w-4" />
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={'/placeholder.svg'} />
                  <AvatarFallback>
                    {formattedEvent.creator?.name
                      ?.split(' ')
                      .map(n => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{formattedEvent.creator?.name}</p>
                  <p className="text-muted-foreground text-xs">{formattedEvent.creator?.email}</p>
                </div>
              </div>
            </div>

            {(formattedEvent.meetingType === 'online' || formattedEvent.meetingType === 'hybrid') &&
              formattedEvent.meetingLink && (
                <div className="flex items-center gap-2">
                  <Monitor className="text-muted-foreground h-4 w-4" />
                  <div className="text-sm">
                    <span className="font-medium">
                      {formattedEvent.meetingLink.name ?? 'Online Meeting'} Link
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground capitalize">
                        {formattedEvent.meetingLink.platform ?? 'Meeting'} Link
                      </span>
                      <a
                        href={formattedEvent.meetingLink.url ?? ''}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Join
                      </a>
                    </div>
                  </div>
                </div>
              )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between rounded-b-md bg-neutral-50 p-2 py-3 pt-2 dark:bg-neutral-900">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="cursor-pointer text-xs"
        >
          {expanded ? (
            <>
              <ChevronUpIcon className="mr-1 h-3 w-3" /> Show Less
            </>
          ) : (
            <>
              <ChevronDownIcon className="mr-1 h-3 w-3" /> Show More
            </>
          )}
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={onEdit}
          className="dark:text-background cursor-pointer bg-emerald-600 text-xs hover:bg-emerald-500"
        >
          Edit Event
        </Button>
      </CardFooter>
    </Card>
  );
}
