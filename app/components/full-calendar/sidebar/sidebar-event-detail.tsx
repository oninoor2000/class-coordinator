import { useMemo } from 'react';

import { getHours, isSameDay } from 'date-fns';

import type { CalendarEvent } from '@/lib/types/calendar-types';

import {
  X,
  User,
  Copy,
  Share,
  School,
  Monitor,
  ClockIcon,
  QrCodeIcon,
  MapPinIcon,
  CalendarIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatTime, getDuration } from '@/utils/calendar/calendar-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardFooter, CardHeader, CardContent } from '@/components/ui/card';
import {
  stringToRecurrenceRule,
  getRecurrenceDescription,
} from '@/utils/calendar/recurrence-utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  // Generate event text for sharing
  const generateShareText = () => {
    if (!event) return '';

    const eventDate = formatDate(event.start);
    const eventTime = checkIfAllDay(event.start, event.end)
      ? 'All day'
      : `${formatTime(event.start ?? new Date())} - ${formatTime(event.end ?? new Date())}`;
    const location = event.location?.name ? `Location: ${event.location.name}` : '';
    const meetingLink = event.meetingLink?.url ? `Meeting Link: ${event.meetingLink.url}` : '';

    return `${event.title}
${eventDate}, ${eventTime}
${location}
${meetingLink}`;
  };

  // Share functions
  const copyEventDetails = () => {
    navigator.clipboard.writeText(generateShareText());
  };

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(generateShareText())}`, '_blank');
  };

  const shareToTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(generateShareText())}`, '_blank');
  };

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
      {!event ? (
        <CardContent className="bg-background p-4">
          <p className="text-muted-foreground text-sm">No event selected</p>
        </CardContent>
      ) : (
        <>
          <CardContent className="bg-background space-y-4 p-4">
            <ScrollArea className="h-[calc(100vh-170px)] max-w-3xl overflow-hidden">
              <div className="mb-5 space-y-4">
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
                    <p className="text-muted-foreground mt-1 text-sm">
                      {formattedEvent.description}
                    </p>
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
                    {formattedEvent.allDay && (
                      <span className="text-muted-foreground ml-1">All day</span>
                    )}
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
                      <p className="text-muted-foreground text-xs">
                        {formattedEvent.creator?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {(formattedEvent.meetingType === 'online' ||
                  formattedEvent.meetingType === 'hybrid') &&
                  formattedEvent.meetingLink && (
                    <>
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

                      {/* QR Code Display for meeting link */}
                      {formattedEvent.meetingLink.qrImgLink && (
                        <div className="mt-4 flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2">
                            <QrCodeIcon className="text-muted-foreground h-4 w-4" />
                            <span className="text-sm font-medium">Scan to join meeting</span>
                          </div>
                          <img
                            src={formattedEvent.meetingLink.qrImgLink}
                            alt="Meeting QR Code"
                            className="h-32 w-32 rounded-md object-contain"
                          />
                        </div>
                      )}
                    </>
                  )}

                {/* Meeting credentials if available */}
                {(formattedEvent.meetingType === 'online' ||
                  formattedEvent.meetingType === 'hybrid') &&
                  formattedEvent.meetingLink &&
                  (formattedEvent.meetingLink.meetingUsername ||
                    formattedEvent.meetingLink.meetingPassword) && (
                    <div className="mt-2 rounded-md bg-neutral-50 p-3 dark:bg-neutral-900">
                      <h3 className="mb-2 text-xs font-medium">Meeting Credentials</h3>
                      {formattedEvent.meetingLink.meetingUsername && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs">Username:</span>
                          <span className="text-xs font-medium">
                            {formattedEvent.meetingLink.meetingUsername}
                          </span>
                        </div>
                      )}
                      {formattedEvent.meetingLink.meetingPassword && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs">Password:</span>
                          <span className="text-xs font-medium">
                            {formattedEvent.meetingLink.meetingPassword}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex justify-between rounded-b-md bg-neutral-50 p-2 py-3 pt-2 dark:bg-neutral-900">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="cursor-pointer text-xs">
                  <Share className="mr-2 h-3 w-3" /> Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={copyEventDetails}>
                  <Copy className="mr-2 h-4 w-4" /> Copy details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={shareToWhatsApp}>
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.412-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={shareToTelegram}>
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                  Telegram
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="default"
              size="sm"
              onClick={onEdit}
              className="dark:text-background cursor-pointer bg-emerald-600 text-xs hover:bg-emerald-500"
            >
              Edit Event
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
