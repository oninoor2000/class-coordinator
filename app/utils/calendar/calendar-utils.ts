import type { SidebarEventFormSchemaType } from '@/lib/schema/calendar-schema';
import type { CalendarEvent } from '@/lib/types/calendar-types';
import { addHours, getHours, isSameDay, format, addMinutes } from 'date-fns';
import { useCallback, useMemo } from 'react';

/**
 * @description Time interval in minutes for time options
 * @default 15
 */
const TIME_INTERVAL = 15;

/**
 * @description Event style getter
 * @param {CalendarEvent} event - The event to get the style for
 * @returns {Object} The style for the event
 */
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

/**
 * @description Format time in 24 hour format
 * @param {Date | string | undefined} date - The date to format
 * @returns {string} The formatted time
 */
export const formatTime = (date: Date | string | undefined) => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

/**
 * @description Default values for the event form
 * @param {Object} selectedSlot - The selected slot with from and to dates
 * @returns {SidebarEventFormSchemaType} The default values
 */
export const sidebarFormDefaultValues = (selectedSlot?: {
  from?: Date;
  to?: Date;
}): SidebarEventFormSchemaType => {
  return {
    title: '',
    description: '',
    start: selectedSlot?.from ?? addHours(new Date(), 1),
    end: selectedSlot?.to ?? addHours(new Date(), 2),
    allDay: false,
    startTime: format(selectedSlot?.from ?? addHours(new Date(), 1), 'HH:mm'),
    endTime: format(selectedSlot?.to ?? addHours(new Date(), 2), 'HH:mm'),
    classId: 0,
    subjectId: 0,
    classType: 'theory' as const,
    creatorId: 1,
    eventsId: 0,
    icalUid: undefined,
    meetingType: 'offline',
    recurrence: undefined,
    recurringId: undefined,
    sequence: 0,
    color: '#3b82f6',
    meetingLinkId: undefined,
    locationId: undefined,
    newMeetingLink: undefined,
  };
};

/**
 * @description Get duration in hours and minutes
 * @param {CalendarEvent} event - The event to get the duration for
 * @returns {string} The duration in hours and minutes
 */
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

/**
 * @description Custom React Hook for calendar utilities
 * @returns {Object} The calendar utilities
 * @example
 * const { checkIfAllDay, timeOptions, DURATION_OPTIONS, DURATION_MAP } = useCalendarUtils();
 */
export const useCalendarUtils = () => {
  /**
   * @description Check if the event is all day
   * @param {Object} event - The event to check
   * @returns {boolean} True if the event is all day, false otherwise
   */
  const checkIfAllDay = useCallback(
    ({ start, end }: { start: Date | undefined; end: Date | undefined }): boolean => {
      if (!start || !end) return false;
      return isSameDay(start, end) && getHours(start) === 0 && getHours(end) === 23;
    },
    []
  );

  /**
   * @description Generate time options
   * @returns {Array} The time options
   * @example
   * const { timeOptions } = useCalendarUtils();
   * console.log(timeOptions);
   * // [
   * //   { value: '00:00', label: '00:00' },
   * //   { value: '00:15', label: '00:15' },
   * //   { value: '00:30', label: '00:30' },
   * //   { value: '00:45', label: '00:45' },
   * // ]
   */
  const timeOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += TIME_INTERVAL) {
        const hours = String(h).padStart(2, '0');
        const minutes = String(m).padStart(2, '0');
        const time = `${hours}:${minutes}`;
        options.push({ value: time, label: time });
      }
    }
    return options;
  }, []);

  /**
   * @description Duration options
   * @returns {Array} The duration options
   * @example
   * const { DURATION_OPTIONS } = useCalendarUtils();
   * console.log(DURATION_OPTIONS);
   * // [
   * //   { value: 'duration_30m', label: '30 minutes' },
   * //   { value: 'duration_1h', label: '1 hour' },
   * //   { value: 'duration_1h30m', label: '1 hour 30 minutes' },
   * //   { value: 'duration_2h', label: '2 hours' },
   * //   { value: 'duration_3h', label: '3 hours' },
   * // ]
   */
  const DURATION_OPTIONS = useMemo(
    () => [
      { value: 'duration_30m', label: '30 minutes' },
      { value: 'duration_1h', label: '1 hour' },
      { value: 'duration_1h30m', label: '1 hour 30 minutes' },
      { value: 'duration_2h', label: '2 hours' },
      { value: 'duration_3h', label: '3 hours' },
    ],
    []
  );

  /**
   * @description Duration map for @constant DURATION_MAP
   * @returns {Object} The duration map
   * @example
   * const { DURATION_MAP } = useCalendarUtils();
   * console.log(DURATION_MAP);
   * // {
   * //   duration_30m: 30,
   * //   duration_1h: 60,
   * //   duration_1h30m: 90,
   * //   duration_2h: 120,
   * //   duration_3h: 180,
   * // }
   }
   */
  const DURATION_MAP = useMemo(
    () => ({
      duration_30m: 30,
      duration_1h: 60,
      duration_1h30m: 90,
      duration_2h: 120,
      duration_3h: 180,
    }),
    []
  );

  /**
   * @description Parse time string into hours and minutes
   * @param {string} timeString - The time string to parse
   * @returns {Array} The hours and minutes
   * @example
   * const { parseTime } = useCalendarUtils();
   * console.log(parseTime('12:30'));
   * // [12, 30]
   */
  const parseTime = useCallback((timeString: string) => {
    if (!timeString || typeof timeString !== 'string') return [0, 0];
    const [hours, minutes] = timeString.split(':').map(Number);
    return [hours ?? 0, minutes ?? 0];
  }, []);

  /**
   * @description Create date with specific time
   * @param {Date} date - The date to create with time
   * @param {string} timeString - The time string to create with
   * @returns {Date} The date with time
   * @example
   * const { createDateWithTime } = useCalendarUtils();
   * console.log(createDateWithTime(new Date(), '12:30'));
   * // 2021-01-01T12:30:00.000Z
   */
  const createDateWithTime = useCallback(
    (date: Date, timeString: string) => {
      if (!date) return new Date();
      const newDate = new Date(date);
      const [hours, minutes] = parseTime(timeString);
      newDate.setHours(hours ?? 0, minutes, 0, 0);
      return newDate;
    },
    [parseTime]
  );

  // Helper function to calculate end time based on start time and duration
  /**
   * @description Calculate end time from start time and duration
   * @param {Date} startDate - The start date
   * @param {string} startTime - The start time
   * @param {string} durationValue - The duration value
   * @returns {Date} The end date
   * @example
   * const { calculateEndTimeFromDuration } = useCalendarUtils();
   * console.log(calculateEndTimeFromDuration(new Date(), '12:30', 'duration_1h'));
   * // 2021-01-01T13:30:00.000Z
   * /
   */
  const calculateEndTimeFromDuration = useCallback(
    (startDate: Date, startTime: string, durationValue: string) => {
      // Create a base date with the start time
      const baseDate = createDateWithTime(startDate, startTime);

      // If it's a duration-based end time
      if (durationValue.startsWith('duration_')) {
        const durationMinutes = DURATION_MAP[durationValue as keyof typeof DURATION_MAP] ?? 0;
        // Check if the value exists in the map
        if (durationValue in DURATION_MAP === false) return baseDate;

        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;

        let newEndDate = baseDate;
        if (hours > 0) newEndDate = addHours(newEndDate, hours);
        if (minutes > 0) newEndDate = addMinutes(newEndDate, minutes);

        return newEndDate;
      }

      // If it's a specific end time
      return createDateWithTime(startDate, durationValue);
    },
    [createDateWithTime, DURATION_MAP]
  );

  return {
    checkIfAllDay,
    timeOptions,
    DURATION_OPTIONS,
    DURATION_MAP,
    parseTime,
    createDateWithTime,
    calculateEndTimeFromDuration,
  };
};
