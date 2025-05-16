import { json } from '@tanstack/react-start';

/**
 * Type for API response
 */
export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
  _links: Record<string, { href: string; method?: string }>;
}

/**
 * Function to generate standardized error responses
 */
export function createErrorResponse(
  status: number,
  code: string,
  message: string,
  target?: string,
  details?: unknown
) {
  return json(
    {
      error: {
        code,
        message,
        target,
        details,
      },
    },
    { status }
  );
}

/**
 * Function to generate HATEOAS links
 */
export function generateLinks(
  path: string,
  id?: string,
  page?: { offset: number; limit: number; total: number }
) {
  const links: Record<string, { href: string; method?: string }> = {
    self: { href: id ? `${path}/${id}` : path },
  };

  // Add links for CRUD operations
  if (id) {
    links.update = { href: `${path}/${id}`, method: 'PUT' };
    links.patch = { href: `${path}/${id}`, method: 'PATCH' };
    links.delete = { href: `${path}/${id}`, method: 'DELETE' };
  } else {
    links.create = { href: path, method: 'POST' };
  }

  // Add pagination links if available
  if (page) {
    const { offset, limit, total } = page;

    // Previous page
    if (offset > 0) {
      const prevOffset = Math.max(0, offset - limit);
      links.prev = {
        href: `${path}?offset=${prevOffset}&limit=${limit}`,
      };
    }

    // Next page
    if (offset + limit < total) {
      links.next = {
        href: `${path}?offset=${offset + limit}&limit=${limit}`,
      };
    }

    // First page
    if (offset > 0) {
      links.first = { href: `${path}?offset=0&limit=${limit}` };
    }

    // Last page
    const lastOffset = Math.floor(total / limit) * limit;
    if (offset < lastOffset) {
      links.last = { href: `${path}?offset=${lastOffset}&limit=${limit}` };
    }
  }

  return links;
}

/**
 * Function to create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  path: string,
  page: { offset: number; limit: number; total: number }
): ApiResponse<T[]> {
  return {
    data,
    meta: {
      total: page.total,
      limit: page.limit,
      offset: page.offset,
      hasMore: page.offset + data.length < page.total,
    },
    _links: generateLinks(path, undefined, page),
  };
}

/**
 * Function to create a single item response
 */
export function createItemResponse<T>(data: T, path: string, id: string): ApiResponse<T> {
  return {
    data,
    _links: generateLinks(path, id),
  };
}

/**
 * Safely parse JSON from a request body
 */
export async function safeParseJson<T>(
  request: Request
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const data = (await request.json()) as T;
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to parse JSON'),
    };
  }
}

/**
 * Function to get ID from URL
 */
export function getIdFromUrl(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1] ?? '';
}
