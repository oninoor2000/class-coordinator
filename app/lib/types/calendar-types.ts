import type {
  classes,
  ClassTypeEnum,
  courses,
  events,
  links,
  locations,
  MeetingTypeEnum,
} from '@/lib/server/db/schema';

/**
 * Calendar View Types
 */
export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

/**
 * Calendar Event Types
 * @description This is the type for the calendar event from the database
 */
export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  start: Date;
  end: Date;
  classType: (typeof ClassTypeEnum.enumValues)[number];
  meetingType: (typeof MeetingTypeEnum.enumValues)[number];
  recurrence: string | null;
  color: string | null;
  icalUid: string | null;
  recurringId: string | null;
  sequence: number | null;
  class: {
    id: number | null;
    name: string | null;
    totalStudent: number | null;
    semester: number | null;
  } | null;
  subject: {
    id: number | null;
    name: string | null;
    semester: number | null;
  } | null;
  location: {
    id: string | null;
    name: string | null;
    capacity: number | null;
  } | null;
  creator: {
    id: number | null;
    name: string | null;
    email: string | null;
  } | null;
  event: {
    id: number | null;
    name: string | null;
    color: string | null;
  } | null;
  meetingLink: {
    id: number | null;
    platform: string | null;
    name: string | null;
    url: string | null;
    shortenedUrl: string | null;
    meetingUsername: string | null;
    meetingPassword: string | null;
    qrImgLink: string | null;
  } | null;
};

/**
 * Get Calendar Events Response
 * @description This is the type for the response from the get calendar events API
 */
export type CalendarEventsApiResponse = {
  data: CalendarEvent[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  _links: Record<string, { href: string; method?: string }>;
};

/**
 * Api Response Options
 *
 * @description This is the type for the response from the get options API
 */
export type FormOptionsApiResponse = {
  data: {
    classOptions: (typeof classes.$inferSelect)[];
    subjectOptions: (typeof courses.$inferSelect)[];
    locationOptions: (typeof locations.$inferSelect)[];
    meetingLinkOptions: (typeof links.$inferSelect)[];
    eventOptions: (typeof events.$inferSelect)[];
  };
};

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
/**
 * @description This is the type for the event recurrence rule
 * @see https://github.com/jakubroztocil/rrule
 */
export type RecurrenceRule = {
  frequency: RecurrenceFrequency;
  interval: number;
  weekDays?: number[];
  endDate?: Date | null;
  count?: number | null;
};

export type CalendarLinkApiResponse = {
  data: typeof links.$inferSelect;
  _links: Record<string, { href: string; method?: string }>;
};
