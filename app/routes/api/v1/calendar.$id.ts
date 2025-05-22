import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/server/db';
import { json } from '@tanstack/react-start';
import { rateLimit } from '@/utils/api-rate-limiter';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import {
  classes,
  ClassTypeEnum,
  courses,
  locations,
  MeetingTypeEnum,
  schedules,
  scheduleToLink,
  users,
  events as eventsTable,
  links,
} from '@/lib/server/db/schema';
import { createErrorResponse, createItemResponse, safeParseJson } from '@/utils/api-helper';

const UpdateEventSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    start: z.string().refine(value => !isNaN(Date.parse(value)), {
      message: 'Invalid date format for start',
    }),
    end: z.string().refine(value => !isNaN(Date.parse(value)), {
      message: 'Invalid date format for end',
    }),
    allDay: z.boolean().optional(),
    classId: z.number().int().positive().optional(),
    subjectId: z.number().int().positive().optional(),
    classType: z.enum(ClassTypeEnum.enumValues),
    meetingType: z.enum(MeetingTypeEnum.enumValues),
    locationId: z.string().optional(),
    recurrence: z.string().optional(),
    color: z.string().optional(),
    meetingLinkId: z.number().int().positive().optional(),
    creatorId: z.number().int().positive().optional(),
    eventsId: z.number().int().positive().optional(),
    recurringId: z.string().optional(),
    sequence: z.number().optional(),
    icalUid: z.string().optional(),
  })
  .partial();
export type UpdateEventSchemaType = z.infer<typeof UpdateEventSchema>;

// Base URL for HATEOAS links
const API_BASE_URL = '/api/v1/calendar/';

// Rate limiter
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

const selectionQuery = {
  id: schedules.id,
  title: schedules.title,
  description: schedules.description,
  start: schedules.start,
  end: schedules.end,
  classType: schedules.classType,
  meetingType: schedules.meetingType,
  recurrence: schedules.recurrence,
  color: schedules.color,
  icalUid: schedules.icalUid,
  recurringId: schedules.recurringId,
  sequence: schedules.sequence,
  class: {
    id: classes.id,
    name: classes.name,
    totalStudent: classes.totalStudent,
    semester: classes.semester,
  },
  subject: {
    id: courses.id,
    name: courses.name,
    semester: courses.semester,
  },
  location: {
    id: locations.id,
    name: locations.name,
    capacity: locations.capacity,
  },
  creator: {
    id: users.id,
    name: users.name,
    email: users.email,
  },
  event: {
    id: eventsTable.id,
    name: eventsTable.name,
    color: eventsTable.color,
  },
  meetingLink: {
    id: links.id,
    platform: links.platform,
    name: links.name,
    url: links.url,
    shortenedUrl: links.shortenedUrl,
    meetingUsername: links.meetingUsername,
    meetingPassword: links.meetingPassword,
    qrImgLink: links.qrImgLink,
  },
};

export const APIRoute = createAPIFileRoute('/api/v1/calendar/$id')({
  PATCH: async ({ request, params }) => {
    try {
      // Apply rate limiting
      await limiter.check(request, 30); // 30 requests per minute

      const { id } = params;
      if (!id) {
        return createErrorResponse(400, 'MISSING_ID', 'Missing event ID');
      }

      // Parse request body
      const { data: body, error: parseError } =
        await safeParseJson<Record<string, unknown>>(request);

      if (parseError || !body) {
        return createErrorResponse(400, 'INVALID_REQUEST_BODY', 'Invalid JSON in request body');
      }

      // Validate request body
      const result = UpdateEventSchema.safeParse(body);
      if (!result.success) {
        return createErrorResponse(
          400,
          'VALIDATION_ERROR',
          'Invalid request data',
          'body',
          result.error.format()
        );
      }

      // Check if the event exists
      const event = await db.query.schedules.findFirst({
        where: eq(schedules.id, id),
      });

      if (!event) {
        return json({ error: 'Event not found' }, { status: 404 });
      }

      // Prepare update data with proper types
      const updateData: Partial<typeof schedules.$inferInsert> = {};

      // Handle string fields
      if (result.data.title !== undefined) updateData.title = result.data.title;
      if (result.data.description !== undefined) updateData.description = result.data.description;
      if (result.data.locationId !== undefined) updateData.locationId = result.data.locationId;
      if (result.data.color !== undefined) updateData.color = result.data.color;
      if (result.data.recurrence !== undefined) updateData.recurrence = result.data.recurrence;
      if (result.data.recurringId !== undefined) updateData.recurringId = result.data.recurringId;
      if (result.data.icalUid !== undefined) updateData.icalUid = result.data.icalUid;

      // Handle number fields
      if (result.data.classId !== undefined) updateData.classId = result.data.classId;
      if (result.data.subjectId !== undefined) updateData.subjectId = result.data.subjectId;
      if (result.data.creatorId !== undefined) updateData.creatorId = result.data.creatorId;
      if (result.data.eventsId !== undefined) updateData.eventsId = result.data.eventsId;
      if (result.data.sequence !== undefined) updateData.sequence = result.data.sequence;

      // Handle enum fields
      if (result.data.classType !== undefined) updateData.classType = result.data.classType;
      if (result.data.meetingType !== undefined) updateData.meetingType = result.data.meetingType;

      // Handle date fields
      if (result.data.start !== undefined) updateData.start = new Date(result.data.start);
      if (result.data.end !== undefined) updateData.end = new Date(result.data.end);

      // Update the schedule record
      await db.update(schedules).set(updateData).where(eq(schedules.id, id));

      const [updatedEvent] = await db
        .select(selectionQuery)
        .from(schedules)
        .leftJoin(classes, eq(schedules.classId, classes.id))
        .leftJoin(courses, eq(schedules.subjectId, courses.id))
        .leftJoin(locations, eq(schedules.locationId, locations.id))
        .leftJoin(users, eq(schedules.creatorId, users.id))
        .leftJoin(eventsTable, eq(schedules.eventsId, eventsTable.id))
        .leftJoin(scheduleToLink, eq(schedules.id, scheduleToLink.scheduleId))
        .leftJoin(links, eq(scheduleToLink.meetingLinkId, links.id))
        .where(eq(schedules.id, id));

      // Handle meeting link relationship if provided
      if (
        result.data.meetingLinkId !== undefined &&
        (result.data.meetingType === 'online' || result.data.meetingType === 'hybrid')
      ) {
        // Check if a link already exists
        const existingLink = await db.query.scheduleToLink.findFirst({
          where: eq(scheduleToLink.scheduleId, id),
        });

        if (existingLink) {
          // Update the existing link
          await db
            .update(scheduleToLink)
            .set({ meetingLinkId: result.data.meetingLinkId })
            .where(eq(scheduleToLink.scheduleId, id));
        } else {
          // Create a new link
          await db.insert(scheduleToLink).values({
            scheduleId: id,
            meetingLinkId: result.data.meetingLinkId,
          });
        }
      }

      return json(createItemResponse(updatedEvent, API_BASE_URL, event.id), { status: 200 });
    } catch (error) {
      console.error('Error fetching events:', error);

      if (error instanceof Error && error.message === 'Rate limit exceeded') {
        return createErrorResponse(
          429,
          'RATE_LIMIT_EXCEEDED',
          'Too many requests, please try again later'
        );
      }

      if (error instanceof z.ZodError) {
        return createErrorResponse(
          400,
          'INVALID_PARAMETERS',
          'Invalid query parameters: ' + JSON.stringify(error.errors)
        );
      }

      return createErrorResponse(
        500,
        'INTERNAL_SERVER_ERROR',
        'An unexpected error occurred while processing your request'
      );
    }
  },

  DELETE: async ({ request, params }) => {
    try {
      // Apply rate limiting
      await limiter.check(request, 20); // 20 requests per minute

      const { id } = params;
      if (!id) {
        return createErrorResponse(400, 'MISSING_ID', 'Missing event ID');
      }

      // Check if the event exists
      const event = await db.query.schedules.findFirst({
        where: eq(schedules.id, id),
      });

      if (!event) {
        return createErrorResponse(404, 'EVENT_NOT_FOUND', 'Event not found');
      }

      // First remove any link associations
      await db.delete(scheduleToLink).where(eq(scheduleToLink.scheduleId, id));

      // Then delete the event
      await db.delete(schedules).where(eq(schedules.id, id));

      return json({ message: 'Event deleted successfully' }, { status: 200 });
    } catch (error) {
      console.error('Error deleting event:', error);

      if (error instanceof Error && error.message === 'Rate limit exceeded') {
        return createErrorResponse(
          429,
          'RATE_LIMIT_EXCEEDED',
          'Too many requests, please try again later'
        );
      }

      return createErrorResponse(
        500,
        'INTERNAL_SERVER_ERROR',
        'An unexpected error occurred while processing your request'
      );
    }
  },
});
