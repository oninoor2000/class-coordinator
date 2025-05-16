import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';

import type { FormOptionsApiResponse } from '@/lib/types/calendar-types';

import { z } from 'zod';
import { db } from '@/lib/server/db';
import { rateLimit } from '@/utils/api-rate-limiter';
import { createErrorResponse } from '@/utils/api-helper';
import { links, classes, courses, locations, events } from '@/lib/server/db/schema';

// Rate limiter
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export const APIRoute = createAPIFileRoute('/api/v1/get-options')({
  GET: async ({ request }) => {
    try {
      // Apply rate limiting
      await limiter.check(request, 60); // 60 requests per minute

      const queryGetClassOptions = db.select().from(classes);
      const queryGetSubjectOptions = db.select().from(courses);
      const queryGetLocationOptions = db.select().from(locations);
      const queryGetMeetingLinkOptions = db.select().from(links);
      const queryGetEventOptions = db.select().from(events);

      const [classOptions, subjectOptions, locationOptions, meetingLinkOptions, eventOptions] =
        await Promise.all([
          queryGetClassOptions,
          queryGetSubjectOptions,
          queryGetLocationOptions,
          queryGetMeetingLinkOptions,
          queryGetEventOptions,
        ]);

      return json(
        {
          data: {
            classOptions,
            subjectOptions,
            locationOptions,
            meetingLinkOptions,
            eventOptions,
          },
        } as FormOptionsApiResponse,
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
});
