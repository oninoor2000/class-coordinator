import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';

import type { SQL } from 'drizzle-orm';
import type { CalendarEvent } from '@/lib/types/calendar-types';

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/server/db';
import { eq, lte, gte, asc, desc, and, sql } from 'drizzle-orm';

import {
  createErrorResponse,
  createItemResponse,
  createPaginatedResponse,
  safeParseJson,
} from '@/utils/api-helper';
import {
  links,
  users,
  classes,
  courses,
  schedules,
  locations,
  ClassTypeEnum,
  scheduleToLink,
  MeetingTypeEnum,
  events as eventsTable,
} from '@/lib/server/db/schema';
import { rateLimit } from '@/utils/api-rate-limiter';

// Base URL for HATEOAS links
const API_BASE_URL = '/api/v1/calendar';

// Rate limiter
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

// ===== SCHEMAS =====

// Schema for GET request query parameters
const GetEventsSchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  classType: z.enum(ClassTypeEnum.enumValues).optional(),
  meetingType: z.enum(MeetingTypeEnum.enumValues).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
  orderBy: z.enum(['start', 'end', 'title', 'createdAt']).optional().default('start'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
});

// Schema for CREATE operation
const CreateEventSchema = z.object({
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
  recurringId: z.string().optional(),
  sequence: z.number().optional(),
  icalUid: z.string().optional(),
  color: z.string().optional(),
  meetingLinkId: z.number().int().positive().optional(),
  creatorId: z.number().int().positive().optional(),
  eventsId: z.number().int().positive().optional(),
});
export type CreateEventSchemaType = z.infer<typeof CreateEventSchema>;

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

export const APIRoute = createAPIFileRoute('/api copy/v1/calendar')({
  GET: async ({ request }) => {
    try {
      // Apply rate limiting
      await limiter.check(request, 60); // 60 requests per minute

      // Extract query parameters from the URL
      const url = new URL(request.url);
      const searchParams = url.searchParams;

      // Parse and validate query parameters
      const {
        start,
        end,
        classId,
        subjectId,
        classType,
        meetingType,
        limit,
        offset,
        orderBy,
        order,
      } = GetEventsSchema.parse({
        start: searchParams.get('start') ?? undefined,
        end: searchParams.get('end') ?? undefined,
        classId: searchParams.get('classId') ?? undefined,
        subjectId: searchParams.get('subjectId') ?? undefined,
        classType: searchParams.get('classType') ?? undefined,
        meetingType: searchParams.get('meetingType') ?? undefined,
        limit: searchParams.has('limit') ? Number(searchParams.get('limit')) : undefined,
        offset: searchParams.has('offset') ? Number(searchParams.get('offset')) : undefined,
        orderBy: searchParams.get('orderBy') ?? undefined,
        order: searchParams.get('order') ?? undefined,
      });

      // Build query conditions
      const conditions: SQL<unknown>[] = [];

      if (start) {
        conditions.push(gte(schedules.start, new Date(start)));
      }

      if (end) {
        conditions.push(lte(schedules.end, new Date(end)));
      }

      if (classId) {
        conditions.push(eq(schedules.classId, parseInt(classId)));
      }

      if (subjectId) {
        conditions.push(eq(schedules.subjectId, parseInt(subjectId)));
      }

      if (classType) {
        conditions.push(eq(schedules.classType, classType));
      }

      if (meetingType) {
        conditions.push(eq(schedules.meetingType, meetingType));
      }

      // Build order by
      const orderFn = order === 'asc' ? asc : desc;
      let orderByColumn;

      switch (orderBy) {
        case 'start':
          orderByColumn = orderFn(schedules.start);
          break;
        case 'end':
          orderByColumn = orderFn(schedules.end);
          break;
        case 'title':
          orderByColumn = orderFn(schedules.title);
          break;
        case 'createdAt':
          orderByColumn = orderFn(schedules.createdAt);
          break;
        default:
          orderByColumn = orderFn(schedules.start);
      }

      // Execute query
      const query =
        conditions.length > 0
          ? db
              .select(selectionQuery)
              .from(schedules)
              .leftJoin(classes, eq(schedules.classId, classes.id))
              .leftJoin(courses, eq(schedules.subjectId, courses.id))
              .leftJoin(locations, eq(schedules.locationId, locations.id))
              .leftJoin(users, eq(schedules.creatorId, users.id))
              .leftJoin(eventsTable, eq(schedules.eventsId, eventsTable.id))
              .leftJoin(scheduleToLink, eq(schedules.id, scheduleToLink.scheduleId))
              .leftJoin(links, eq(scheduleToLink.meetingLinkId, links.id))
              .where(and(...conditions))
              .orderBy(orderByColumn)
              .limit(limit)
              .offset(offset)
          : db
              .select(selectionQuery)
              .from(schedules)
              .leftJoin(classes, eq(schedules.classId, classes.id))
              .leftJoin(courses, eq(schedules.subjectId, courses.id))
              .leftJoin(locations, eq(schedules.locationId, locations.id))
              .leftJoin(users, eq(schedules.creatorId, users.id))
              .leftJoin(eventsTable, eq(schedules.eventsId, eventsTable.id))
              .leftJoin(scheduleToLink, eq(schedules.id, scheduleToLink.scheduleId))
              .leftJoin(links, eq(scheduleToLink.meetingLinkId, links.id))
              .orderBy(orderByColumn)
              .limit(limit)
              .offset(offset);

      // Calculate total for pagination
      const countQuery =
        conditions.length > 0
          ? db
              .select({ count: sql<number>`count(*)` })
              .from(schedules)
              .where(and(...conditions))
          : db.select({ count: sql<number>`count(*)` }).from(schedules);

      const [eventResults, countResult] = (await Promise.all([query, countQuery])) as [
        CalendarEvent[],
        { count: number }[],
      ];
      const total = countResult[0]?.count ?? 0;

      // Create response
      return json(
        createPaginatedResponse(eventResults, API_BASE_URL, {
          offset,
          limit,
          total: Number(total),
        }),
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=30, stale-while-revalidate=30',
          },
        }
      );
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
  POST: async ({ request }) => {
    try {
      // Apply rate limiting
      await limiter.check(request, 30); // 30 requests per minute

      // Parse request body
      const { data: body, error: parseError } =
        await safeParseJson<Record<string, unknown>>(request);

      if (parseError || !body) {
        return createErrorResponse(400, 'INVALID_REQUEST_BODY', 'Invalid JSON in request body');
      }

      // Validate request body
      const result = CreateEventSchema.safeParse(body);
      if (!result.success) {
        return createErrorResponse(
          400,
          'VALIDATION_ERROR',
          'Invalid request data',
          'body',
          result.error.format()
        );
      }

      const eventData = result.data;

      // Convert string dates to Date objects
      const startDate = new Date(eventData.start);
      const endDate = new Date(eventData.end);

      const id = uuidv4();

      // Prepare data for insertion
      const newEvent: typeof schedules.$inferInsert = {
        id,
        title: eventData.title,
        description: eventData.description,
        start: startDate,
        end: endDate,
        classType: eventData.classType,
        meetingType: eventData.meetingType,
        classId: eventData.classId,
        subjectId: eventData.subjectId,
        locationId: eventData.locationId,
        recurrence: eventData.recurrence,
        color: eventData.color,
        creatorId: 1, // Will be replaced with user ID after authentication is implemented
        eventsId: eventData.eventsId, // Should be adjusted to match your events logic
        recurringId: eventData.recurringId,
        sequence: eventData.sequence,
        icalUid: eventData.icalUid,
        createdAt: new Date(),
      };

      if (
        eventData.meetingLinkId &&
        (eventData.meetingType === 'online' || eventData.meetingType === 'hybrid')
      ) {
        await Promise.all([
          db.insert(scheduleToLink).values({
            scheduleId: id,
            meetingLinkId: eventData.meetingLinkId,
          }),
          db.insert(schedules).values(newEvent),
        ]);
      } else {
        await db.insert(schedules).values(newEvent);
      }

      // Insert into database
      const [createdEvent] = await db
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

      return json(createItemResponse(createdEvent, API_BASE_URL, createdEvent.id), {
        status: 201,
        headers: {
          Location: `${API_BASE_URL}/${createdEvent.id}`,
        },
      });
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
  HEAD: ({ request }) => {
    return json({
      request,
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=30',
      },
    });
  },
  OPTIONS: () => {
    const response = json(null, {
      status: 204,
    });
    response.headers.set('Allow', 'GET, HEAD, POST, OPTIONS');
    // Add CORS headers if needed
    // response.headers.set("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS");
    // response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return response;
  },
});
