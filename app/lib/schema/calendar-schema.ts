import { MeetingTypeEnum, PlatformEnum, ClassTypeEnum } from '@/lib/server/db/schema';
import { z } from 'zod';

/**
 * Schema for validating and transforming form data from the sidebar input.
 * @typedef {Object} SidebarFormSchema
 * @property {string} command - The command entered in the sidebar.
 * @description Used when the AI assistant is implemented.
 */
export const SidebarFormSchema = z.object({
  command: z.string(),
});

/**
 * Schema for Meeting Link input field
 * */
export const NewMeetingLinkSchema = z.object({
  platform: z.enum(PlatformEnum.enumValues),
  name: z.string().min(1, 'Link name is required'),
  url: z.string().url('Please enter a valid URL'),
  shortenedUrl: z.string().optional(), // Used as customShortCode in the API
  meetingUsername: z.string().optional(),
  meetingPassword: z.string().optional(),
  qrImgLink: z.string().optional(),
  description: z.string().optional(),
});
export type NewMeetingLinkSchemaType = z.infer<typeof NewMeetingLinkSchema>;

/**
 * Schema for validating and transforming form data from the sidebar input.
 * @typedef {Object} SidebarCalendarEventFormSchema
 * @property {string} title - The title of the event.
 * @property {string} description - The description of the event.
 * @property {Date} start - The start date of the event.
 * @property {Date} end - The end date of the event.
 * @property {string} startTime - The start time of the event.
 * @property {string} endTime - The end time of the event.
 * @property {boolean} allDay - Whether the event is an all-day event.
 * @property {string} creatorId - The ID of the event creator.
 * @property {string} eventId - The ID of the event.
 * @property {string} classType - The type of the class.
 * @property {string} meetingType - The type of the meeting.
 * @property {RecurrenceRule|null} recurrence - The recurrence rule of the event.
 * @property {string|null} recurringId - The ID of the recurring event.
 * @property {number|null} sequence - The sequence of the event.
 * @property {string|null} icalUid - The iCal UID of the event.
 * @property {string} color - The color of the event.
 * @property {number} classId - The ID of the class.
 * @property {number} meetingLinkId - The ID of the meeting link.
 * @property {Object} newMeetingLink - Details for creating a new meeting link.
 */
export const SidebarEventFormSchema = z
  .object({
    title: z.string({ required_error: 'Title is required' }).min(1, 'Title cannot be empty'),
    description: z.string().optional(),
    start: z.date({
      required_error: 'Please select a date for the event',
      invalid_type_error: 'Invalid date format for event date',
    }),
    end: z.date({
      required_error: 'Please select a date for the event',
      invalid_type_error: 'Invalid date format for event date',
    }),
    startTime: z
      .string({ required_error: 'Start time is required' })
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: 'Invalid start time format. Use HH:mm (e.g., 09:00)',
      }),
    endTime: z
      .string({ required_error: 'End time is required' })
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: 'Invalid end time format. Use HH:mm (e.g., 17:30)',
      }),
    allDay: z.boolean(),
    creatorId: z.number(),
    eventId: z.number(),
    classType: z.enum(ClassTypeEnum.enumValues),
    meetingType: z.enum(MeetingTypeEnum.enumValues),
    recurrence: z.string().nullable().optional(),
    recurringId: z.string().optional(),
    sequence: z.number().optional(),
    icalUid: z.string().optional(),
    color: z.string(),
    locationId: z.string().optional(),

    // Need to remove the optional for classId and subjectId
    classId: z.number(),
    subjectId: z.number(),

    // Meeting link fields
    meetingLinkId: z.number().optional(),
    newMeetingLink: NewMeetingLinkSchema.optional(),
  })
  .transform(data => {
    // TypeScript type assertion for the transform input
    const typedData = data as {
      startTime: string;
      start: Date;
      endTime: string;
      end: Date;
      allDay: boolean;
    };

    const [startHours, startMinutes] = typedData.startTime.split(':').map(Number);
    const startDate = new Date(typedData.start);
    startDate.setHours(startHours, startMinutes, 0, 0);

    const [endHours, endMinutes] = typedData.endTime.split(':').map(Number);
    const endDate = new Date(typedData.end); // Use a new Date instance
    endDate.setHours(endHours, endMinutes, 0, 0);

    // If allDay is true, set times to cover the whole day
    if (typedData.allDay) {
      startDate.setHours(0, 0, 0, 0); // Start of the day
      endDate.setHours(23, 59, 59, 999); // End of the day
    }

    return {
      ...data,
      start: startDate, // This will be a Date object
      end: endDate, // This will be a Date object
    };
  })
  .refine(
    data => {
      // If allDay is true, the specific time comparison might not be relevant,
      // as startDate and endDate are set to full day.
      // However, we still need to ensure endDate is after startDate for consistency.
      if (data.allDay) {
        return data.end > data.start; // Should always be true with the transform logic
      }
      // For non-all-day events, endDate must be strictly after startDate.
      return data.end > data.start;
    },
    {
      message: 'End time must be after start time.',
      // Apply the error to a path that makes sense for the user, e.g., endTime or a general form error.
      path: ['endTime'],
    }
  )
  .refine(
    data => {
      // If meeting type is online or hybrid, either meetingLinkId or newMeetingLink must be provided
      if (data.meetingType === 'online' || data.meetingType === 'hybrid') {
        return data.meetingLinkId !== undefined || data.newMeetingLink !== undefined;
      }
      return true;
    },
    {
      message: 'Please provide a meeting link for online or hybrid meetings',
      path: ['meetingLinkId'],
    }
  );

export type SidebarEventFormSchemaType = z.infer<typeof SidebarEventFormSchema>;
