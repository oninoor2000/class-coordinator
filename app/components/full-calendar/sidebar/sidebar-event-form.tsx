import { useCallback, useEffect, useMemo, useState } from 'react';

import { id } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addHours, addMinutes, format, isSameDay } from 'date-fns';

import type { LucideIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import type { CreateEventSchemaType } from '@/routes/api/v1/calendar';
import type { UpdateEventSchemaType } from '@/routes/api/v1/calendar.$id';
import type { SidebarEventFormSchemaType } from '@/lib/schema/calendar-schema';
import type {
  CalendarEvent,
  FormOptionsApiResponse,
  CalendarEventApiResponse,
} from '@/lib/types/calendar-types';

import {
  X,
  User,
  Trash,
  Check,
  School,
  Monitor,
  Loader2,
  ClockIcon,
  CalendarIcon,
  ChevronDownIcon,
  CalendarClockIcon,
} from 'lucide-react';
import {
  Select,
  SelectItem,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectContent,
  SelectTrigger,
  SelectSeparator,
} from '@/components/ui/select';
import {
  Form,
  FormItem,
  FormLabel,
  FormField,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  Command,
  CommandList,
  CommandItem,
  CommandInput,
  CommandEmpty,
  CommandGroup,
} from '@/components/ui/command';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SidebarEventFormSchema } from '@/lib/schema/calendar-schema';
import { stringToRecurrenceRule } from '@/utils/calendar/recurrence-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CLASS_TYPE_OPTIONS, MEETING_TYPE_OPTIONS } from '@/utils/calendar/constant';
import { sidebarFormDefaultValues, useCalendarUtils } from '@/utils/calendar/calendar-utils';

import OnlineMeetingInput from './online-meeting-input';
import SbFormRecurrenceInput from './sb-form-recurrence-input';

interface SidebarContentEventFormProps {
  mode: 'create' | 'edit';
  selectedSlot?: DateRange | undefined;
  initialData?: CalendarEvent | undefined;
  options: FormOptionsApiResponse | undefined;
  onClose?: () => void;
  deleteClose?: () => void;
  calendarEventRefetch: () => void;
  handleSelectedEvent?: (event: CalendarEvent) => void;
}

/**
 * This component is used to create and edit events in the sidebar.
 * It shows the event title, description, start date, end date, class type, meeting type, location, and creator.
 * It also shows the recurrence description if the event is recurring.
 * It also shows the class and subject name if the event is a class.
 * It also shows the meeting link if the event is an online or hybrid meeting.
 * @param options - The options for the input fields.
 * @param onClose - The function to call when the close button is clicked.
 * @param initialData - The initial data for the form.
 * @param onFormSubmit - The function to call when the form is submitted.
 * @param mode - The mode of the form. Can be "create" or "edit".
 */
export default function SidebarEventForm({
  mode,
  initialData,
  options,
  onClose,
  deleteClose,
  selectedSlot,
  handleSelectedEvent,
  calendarEventRefetch,
}: SidebarContentEventFormProps) {
  // Get calendar utilities
  const {
    parseTime,
    timeOptions,
    checkIfAllDay,
    DURATION_OPTIONS,
    createDateWithTime,
    calculateEndTimeFromDuration,
  } = useCalendarUtils();

  // #### Constants ####
  const EVENT_OPTIONS = options?.data?.eventOptions ?? [];
  const CLASS_OPTIONS = options?.data?.classOptions ?? [];
  const SUBJECT_OPTIONS = options?.data?.subjectOptions ?? [];
  const LOCATION_OPTIONS = options?.data?.locationOptions ?? [];
  const MEETING_LINK_OPTIONS = options?.data?.meetingLinkOptions ?? [];

  // #### State ####
  //  ---------------
  const [classDialogOpen, setClassDialogOpen] = useState<boolean>(false);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState<boolean>(false);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);

  //   #### Form ####
  //  ---------------
  // Initialize form with default values or initial data
  const form = useForm<SidebarEventFormSchemaType>({
    resolver: zodResolver(SidebarEventFormSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      start: initialData?.start ?? selectedSlot?.from ?? addHours(new Date(), 1),
      end: initialData?.end ?? selectedSlot?.to ?? addHours(new Date(), 2),
      allDay: checkIfAllDay({
        start: new Date(initialData?.start ?? new Date()),
        end: new Date(initialData?.end ?? new Date()),
      }),
      startTime: format(
        initialData?.start ?? selectedSlot?.from ?? addHours(new Date(), 1),
        'HH:mm'
      ),
      endTime: format(initialData?.end ?? selectedSlot?.to ?? addHours(new Date(), 2), 'HH:mm'),
      classId: initialData?.class?.id ?? undefined,
      subjectId: initialData?.subject?.id ?? undefined,
      classType: initialData?.classType ?? 'theory',
      creatorId: 1,
      eventsId: initialData?.event?.id ?? 1,
      icalUid: initialData?.icalUid ?? '',
      meetingType: initialData?.meetingType ?? 'offline',
      recurrence: initialData?.recurrence ?? undefined,
      recurringId: initialData?.recurringId ?? undefined,
      sequence: initialData?.sequence ?? 0,
      color: initialData?.color ?? '#3b82f6',
      meetingLinkId: initialData?.meetingLink?.id ?? undefined,
      locationId: initialData?.location?.id ?? undefined,
      newMeetingLink: undefined,
    },
  });

  // Watch necessary form values
  const watchAllDay = form.watch('allDay');
  const watchStartDate = form.watch('start');
  const watchStartTime = form.watch('startTime');
  const watchEndDate = form.watch('end');
  const watchEndTime = form.watch('endTime');
  const watchMeetingType = form.watch('meetingType');

  //   #### Helper functions ####
  //  ---------------
  // Helper function to check if online meeting input should be visible
  const showOnlineMeetingInput = watchMeetingType === 'online' || watchMeetingType === 'hybrid';

  // Helper function to filter end time options. Show only times after start time for same day
  const endTimeOptions = useMemo(() => {
    if (!watchStartDate || !watchEndDate || !watchStartTime) return timeOptions;

    // Add duration options first
    const result = [...DURATION_OPTIONS];

    // If start and end dates are the same day, filter times
    if (isSameDay(watchStartDate, watchEndDate)) {
      const [startHours, startMinutes] = parseTime(watchStartTime);
      const startTotalMinutes = (startHours ?? 0) * 60 + (startMinutes ?? 0);

      // Add specific time options that are after the start time
      timeOptions.forEach((option: { value: string; label: string }) => {
        const [hours, minutes] = parseTime(option.value);
        const optionTotalMinutes = (hours ?? 0) * 60 + (minutes ?? 0);

        if (optionTotalMinutes > startTotalMinutes) {
          result.push(option);
        }
      });
    } else {
      // If different days, all time options are valid
      result.push(...timeOptions);
    }

    return result;
  }, [watchStartDate, watchEndDate, watchStartTime, timeOptions, DURATION_OPTIONS, parseTime]);

  //   #### Effect Hooks ####
  //  ---------------

  // This effect updates form values when selectedSlot changes
  useEffect(() => {
    if (!selectedSlot?.from || !selectedSlot?.to || initialData) return;

    form.setValue('start', selectedSlot.from, { shouldValidate: true });
    form.setValue('end', selectedSlot.to, { shouldValidate: true });
    form.setValue('startTime', format(selectedSlot.from, 'HH:mm'), { shouldValidate: true });
    form.setValue('endTime', format(selectedSlot.to, 'HH:mm'), { shouldValidate: true });
  }, [selectedSlot, form, initialData]);

  // This effect updates the start date time when the start time changes.
  // It also updates the start date if the start date is changed.
  useEffect(() => {
    if (watchAllDay || !watchStartDate || !watchStartTime) return;

    const newStartDate = createDateWithTime(watchStartDate, watchStartTime);
    const currentStartDate = form.getValues('start');

    if (currentStartDate.getTime() !== newStartDate.getTime()) {
      form.setValue('start', newStartDate, { shouldValidate: true });
    }
  }, [watchStartDate, watchStartTime, watchAllDay, createDateWithTime, form]);

  // This effect updates the end date based on the start date/time and duration/end time.
  useEffect(() => {
    if (watchAllDay || !watchStartDate || !watchStartTime || !watchEndTime) return;

    // Calculate the new end date based on start date/time and duration/end time
    const newEndDate = calculateEndTimeFromDuration(watchStartDate, watchStartTime, watchEndTime);
    const currentEndDate = form.getValues('end');

    // Only update if the new end date is different to avoid infinite loops
    if (currentEndDate.getTime() !== newEndDate.getTime()) {
      form.setValue('end', newEndDate, { shouldValidate: true });

      // Update endTime when a duration is selected to show the actual calculated time
      if (watchEndTime.startsWith('duration_')) {
        const formattedTime = format(newEndDate, 'HH:mm');
        form.setValue('endTime', formattedTime, { shouldValidate: true });
      }
    }
  }, [
    watchStartDate,
    watchStartTime,
    watchEndTime,
    watchAllDay,
    calculateEndTimeFromDuration,
    form,
  ]);

  const queryClient = useQueryClient();
  // Event Mutation
  const { mutate: createEvent, isPending: isCreatingEvent } = useMutation({
    mutationFn: async (event: CreateEventSchemaType) => {
      const response = await fetch('/api/v1/calendar', {
        method: 'POST',
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server response error:', errorData);
        throw new Error(errorData.message || 'Failed to create event');
      }

      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });

      const responseData = await response.json();
      return responseData as CalendarEventApiResponse;
    },
    onSuccess: () => {
      toast.success('Event created successfully', {
        description: 'The event has been created successfully',
      });
    },
    onError: error => {
      console.error('Update error:', error);
      toast.error('Failed to update event', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    },
    onSettled: async response => {
      if (response) {
        const event = response.data;
        form.reset();
        if (handleSelectedEvent) handleSelectedEvent(event);
        if (onClose) onClose();
      }
    },
  });

  const { mutate: updateEvent, isPending: isUpdatingEvent } = useMutation({
    mutationFn: async (event: UpdateEventSchemaType) => {
      const response = await fetch(`/api/v1/calendar/${event.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server response error:', errorData);
        throw new Error(errorData.message || 'Failed to update event');
      }

      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      calendarEventRefetch();

      const responseData = await response.json();
      return responseData as CalendarEventApiResponse;
    },
    onSuccess: () => {
      toast.success('Event updated successfully', {
        description: 'The event has been updated successfully',
      });
    },
    onError: error => {
      console.error('Update error:', error);
      toast.error('Failed to update event', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    },
    onSettled: async response => {
      if (response) {
        const event = response.data;
        form.reset();
        if (handleSelectedEvent) handleSelectedEvent(event);
      }
    },
  });

  // Delete Event Mutation
  const { mutate: deleteEvent, isPending: isDeletingEvent } = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`/api/v1/calendar/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server response error:', errorData);
        throw new Error(errorData.message || 'Failed to delete event');
      }

      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      calendarEventRefetch();

      const responseData = await response.json();
      return responseData as CalendarEventApiResponse;
    },
    onSuccess: () => {
      toast.success('Event deleted successfully', {
        description: 'The event has been removed from calendar',
      });
    },
    onError: error => {
      console.error(error);
      toast.error('Failed to delete event', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    },
    onSettled: () => {
      setIsConfirmDeleteDialogOpen(false);
      if (deleteClose) deleteClose();
    },
  });

  // Handle event deletion
  const confirmDeleteAction = () => {
    if (initialData?.id) {
      deleteEvent(initialData.id);
    }
  };

  // Handle form submission
  function handleSubmit(data: SidebarEventFormSchemaType): void {
    const { recurrence, ...rest } = data;

    const commonData = {
      ...rest,
      start: data.start.toISOString(),
      end: data.end.toISOString(),
      recurrence: recurrence ?? undefined,
    };

    if (mode === 'create') {
      createEvent(commonData);
    } else if (mode === 'edit' && initialData?.id) {
      const updatePayload = {
        ...commonData,
        id: initialData.id,
      };
      updateEvent(updatePayload);
    } else {
      toast.error('Cannot update event', {
        description: 'Event ID is missing',
      });
    }
  }

  return (
    <Card className="m-4 gap-4 rounded-md py-0">
      <CardHeader className="rounded-t-md bg-neutral-50 px-4 pt-2 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {mode === 'create' ? 'Add Event' : 'Edit Event'}
          </span>
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="bg-background p-0">
            <ScrollArea className="h-[calc(100vh-160px)] max-w-3xl overflow-hidden">
              <div className="mb-5 space-y-4 px-4">
                {/* Title */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Event title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Event description"
                            {...field}
                            className="resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <SidebarSeparator Icon={User} classname="pt-2" />
                <div className="space-y-4">
                  {/* Creator */}
                  <div className="flex items-center justify-start gap-4">
                    <Avatar>
                      <AvatarImage src="https://github.com/shadcn.png" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">John Doe</p>
                      <p className="text-muted-foreground text-xs">john.doe@example.com</p>
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="creatorId"
                    render={({ field }) => <Input type="hidden" {...field} />}
                  />

                  {/* Event */}
                  <FormField
                    control={form.control}
                    name="eventsId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={value => {
                              field.onChange(Number(value));
                              form.setValue(
                                'color',
                                EVENT_OPTIONS.find(opt => opt.id === Number(value))?.color ??
                                  '#3b82f6'
                              );
                            }}
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger className="hover:bg-accent w-full cursor-pointer transition-all">
                                <SelectValue placeholder="Select event" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {EVENT_OPTIONS.map(option => (
                                <SelectItem
                                  className="cursor-pointer"
                                  key={option.id}
                                  value={option.id.toString()}
                                >
                                  {option.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <SidebarSeparator Icon={CalendarClockIcon} classname="pt-2" />

                {/* Start Date and Start Time */}
                <div className="flex items-center justify-start gap-5">
                  <FormField
                    control={form.control}
                    name="start"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'w-[170px] cursor-pointer bg-transparent pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              locale={id}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Start Time</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={watchAllDay}
                        >
                          <FormControl>
                            <SelectTrigger className="hover:bg-accent w-full max-w-[127.6px] cursor-pointer transition-all">
                              <ClockIcon className="mr-2 h-4 w-4 opacity-50" />
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timeOptions.map(option => (
                              <SelectItem
                                className="cursor-pointer"
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* End Date and End Time */}
                <div className="flex items-center justify-start gap-5">
                  <FormField
                    control={form.control}
                    name="end"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'w-[170px] cursor-pointer bg-transparent pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                                disabled={watchAllDay}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              disabled={date => date < watchStartDate}
                              locale={id}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>End Time</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={watchAllDay}
                        >
                          <FormControl>
                            <SelectTrigger className="hover:bg-accent w-full max-w-[127.6px] cursor-pointer transition-all">
                              <ClockIcon className="mr-2 h-4 w-4 opacity-50" />
                              <SelectValue placeholder="Select end time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Quick durations</SelectLabel>
                              {DURATION_OPTIONS.map(option => (
                                <SelectItem
                                  className="cursor-pointer"
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                            <SelectSeparator />
                            <SelectGroup>
                              <SelectLabel>Specific times</SelectLabel>
                              {endTimeOptions
                                .filter(option => !option.value.startsWith('duration_'))
                                .map(option => (
                                  <SelectItem
                                    className="cursor-pointer"
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* All Day & Recurrence */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="allDay"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2 px-3">
                        <div className="space-y-0.5">
                          <FormLabel className="cursor-pointer">All Day</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={checked => {
                              field.onChange(checked);
                              // Reset time settings if all day is enabled
                              if (checked) {
                                const startDate = new Date(form.getValues('start'));
                                startDate.setHours(0, 0, 0, 0);

                                const endDate = new Date(form.getValues('end'));
                                endDate.setHours(23, 59, 59, 999);

                                form.setValue('start', startDate, {
                                  shouldValidate: true,
                                });
                                form.setValue('end', endDate, {
                                  shouldValidate: true,
                                });
                              }
                            }}
                            className="cursor-pointer"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <SbFormRecurrenceInput
                    form={form}
                    recurrence={
                      form.getValues('recurrence') !== null &&
                      form.getValues('recurrence') !== undefined
                        ? stringToRecurrenceRule(form.getValues('recurrence') as string)
                        : undefined
                    }
                  />
                </div>

                <SidebarSeparator Icon={School} classname="pt-2" />

                {/* Class, Subject, Class Type, Meeting Type */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="classId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class</FormLabel>
                          <Popover open={classDialogOpen} onOpenChange={setClassDialogOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    'w-full max-w-[142.5px] cursor-pointer justify-between bg-transparent font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  <span className="truncate">
                                    {field.value
                                      ? CLASS_OPTIONS.find(classOpt => classOpt.id === field.value)
                                          ?.name
                                      : 'Select class'}
                                  </span>
                                  <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                              <Command>
                                <CommandInput placeholder="Search class..." className="h-9" />
                                <CommandList>
                                  <CommandEmpty>No results found.</CommandEmpty>
                                  <CommandGroup>
                                    {CLASS_OPTIONS.map(classOpt => (
                                      <CommandItem
                                        key={classOpt.id}
                                        onSelect={() => {
                                          field.onChange(classOpt.id);
                                          setClassDialogOpen(false);
                                        }}
                                        value={classOpt.name}
                                        className="cursor-pointer"
                                      >
                                        {classOpt.name}
                                        <Check
                                          className={cn(
                                            'ml-auto h-4 w-4',
                                            classOpt.id === field.value
                                              ? 'opacity-100'
                                              : 'opacity-0'
                                          )}
                                        />
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subjectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <Popover open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    'w-full max-w-[142.5px] cursor-pointer justify-between bg-transparent font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  <span className="truncate">
                                    {field.value
                                      ? SUBJECT_OPTIONS.find(
                                          classOpt => classOpt.id === field.value
                                        )?.name
                                      : 'Select subject'}
                                  </span>
                                  <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                              <Command>
                                <CommandInput placeholder="Search subject..." className="h-9" />
                                <CommandList>
                                  <CommandEmpty>No results found.</CommandEmpty>
                                  <CommandGroup>
                                    {SUBJECT_OPTIONS.map(classOpt => (
                                      <CommandItem
                                        key={classOpt.id}
                                        onSelect={() => {
                                          field.onChange(classOpt.id);
                                          setSubjectDialogOpen(false);
                                        }}
                                        value={classOpt.name}
                                        className="cursor-pointer"
                                      >
                                        {classOpt.name}
                                        <Check
                                          className={cn(
                                            'ml-auto h-4 w-4',
                                            classOpt.id === field.value
                                              ? 'opacity-100'
                                              : 'opacity-0'
                                          )}
                                        />
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="classType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="hover:bg-accent w-full max-w-[142.5px] cursor-pointer transition-all">
                                <SelectValue placeholder="Select class type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CLASS_TYPE_OPTIONS.map(option => (
                                <SelectItem
                                  className="cursor-pointer"
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="meetingType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meeting Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="hover:bg-accent w-full max-w-[142.5px] cursor-pointer transition-all">
                                <SelectValue placeholder="Select meeting type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {MEETING_TYPE_OPTIONS.map(option => (
                                <SelectItem
                                  className="cursor-pointer"
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="locationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="hover:bg-accent w-full cursor-pointer transition-all">
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                              {LOCATION_OPTIONS.map(option => (
                                <SelectItem
                                  className="cursor-pointer"
                                  key={option.id}
                                  value={option.id}
                                >
                                  {option.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Online Meeting Settings */}
                {showOnlineMeetingInput && (
                  <>
                    <SidebarSeparator Icon={Monitor} classname="pt-2" />
                    <OnlineMeetingInput
                      form={form}
                      isVisible={showOnlineMeetingInput}
                      MEETING_LINK_OPTIONS={MEETING_LINK_OPTIONS}
                    />
                  </>
                )}

                {/* Hidden input for iCalUID, recurringId, sequence */}
                <FormField
                  control={form.control}
                  name="icalUid"
                  render={({ field }) => <Input type="hidden" {...field} />}
                />

                <FormField
                  control={form.control}
                  name="recurringId"
                  render={({ field }) => <Input type="hidden" {...field} />}
                />

                <FormField
                  control={form.control}
                  name="sequence"
                  render={({ field }) => <Input type="hidden" {...field} />}
                />
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex justify-between rounded-b-md bg-neutral-50 p-2 py-3 dark:bg-neutral-900">
            {mode == 'edit' && (
              <AlertDialog
                open={isConfirmDeleteDialogOpen}
                onOpenChange={setIsConfirmDeleteDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mr-2 cursor-pointer border-red-500 text-xs text-red-500 hover:bg-red-500/10 hover:text-red-500 dark:border-red-500/80 dark:text-red-500/80 dark:hover:bg-red-500/10 dark:hover:text-red-500/80"
                    disabled={isDeletingEvent}
                  >
                    <Trash className="h-3 w-3" />
                    Delete this event
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the event.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={e => {
                        e.preventDefault();
                        confirmDeleteAction();
                      }}
                      disabled={isDeletingEvent}
                    >
                      {isDeletingEvent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Button
              size="sm"
              type="submit"
              variant="default"
              className="dark:text-background ml-auto cursor-pointer bg-emerald-600 text-xs hover:bg-emerald-500"
              disabled={isCreatingEvent || isUpdatingEvent}
            >
              {(isCreatingEvent || isUpdatingEvent) && <Loader2 className="h-3 w-3 animate-spin" />}
              {mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

function SidebarSeparator({ Icon, classname }: { Icon: LucideIcon; classname?: string }) {
  return (
    <div className={cn('flex items-center gap-2 overflow-clip pr-4', classname)}>
      {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
      <Separator className="my-0 w-full py-0" />
    </div>
  );
}
