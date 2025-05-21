import { json } from '@tanstack/react-start';
import { rateLimit } from '@/utils/api-rate-limiter';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { createErrorResponse, createItemResponse, safeParseJson } from '@/utils/api-helper';
import { NewMeetingLinkSchema } from '@/lib/schema/calendar-schema';
import { db } from '@/lib/server/db';
import { links } from '@/lib/server/db/schema';
import { z } from 'zod';

// Base URL for HATEOAS links
const API_BASE_URL = '/api/v1/meeting-link';

// Rate limiter
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export const APIRoute = createAPIFileRoute('/api/v1/meeting-link')({
  GET: ({ request, params }) => {
    return json({ message: 'Hello "/api/v1/meeting-link"!' });
  },
  POST: async ({ request }) => {
    try {
      // Apply rate limiting
      await limiter.check(request, 30); // 30 requests per minute

      // Parse request body
      const { data: body, error: parseError } =
        await safeParseJson<Record<string, unknown>>(request);

      if (parseError || !body) {
        console.error('Invalid JSON in request body:', parseError);
        return createErrorResponse(400, 'INVALID_REQUEST_BODY', 'Invalid JSON in request body');
      }

      // Validate request body
      const result = NewMeetingLinkSchema.safeParse(body);
      if (!result.success) {
        console.error('Validation error:', result.error.format());
        return createErrorResponse(
          400,
          'VALIDATION_ERROR',
          'Invalid request data',
          'body',
          result.error.format()
        );
      }

      // Create new meeting link
      const [newLink] = await db
        .insert(links)
        .values({
          ...result.data,
          shortenedUrl: result.data.shortenedUrl || '', // Use provided shortenedUrl if available
          createdAt: new Date(),
        })
        .returning({
          platform: links.platform,
          name: links.name,
          url: links.url,
          meetingUsername: links.meetingUsername,
          meetingPassword: links.meetingPassword,
          description: links.description,
          id: links.id,
          createdAt: links.createdAt,
          shortenedUrl: links.shortenedUrl,
          qrImgLink: links.qrImgLink,
        });
      return json(createItemResponse(newLink, API_BASE_URL, newLink.id.toString()), {
        status: 201,
        headers: {
          Location: `${API_BASE_URL}/${newLink.id}`,
        },
      });
    } catch (error) {
      console.error('Error processing request:', error);

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
