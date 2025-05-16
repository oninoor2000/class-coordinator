import { json } from '@tanstack/react-start';

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

type RateLimitData = {
  count: number;
  timestamp: number;
};

/**
 * Rate limiting implementation
 */
export function rateLimit(options?: Options) {
  // Use a simple Map instead of LRUCache for better type safety
  const tokenMap = new Map<string, RateLimitData>();
  const interval = options?.interval ?? 60000; // 1 minute default

  // Clean up old entries periodically
  const cleanup = () => {
    const now = Date.now();
    for (const [key, data] of tokenMap.entries()) {
      if (now - data.timestamp > interval) {
        tokenMap.delete(key);
      }
    }
  };

  // Schedule cleanup every minute
  if (typeof setInterval !== 'undefined') {
    setInterval(cleanup, 60000);
  }

  return {
    check: (request: Request, limit: number): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        // Extract IP using nullish coalescing, fallback to a default token for development
        const ip =
          request.headers.get('x-forwarded-for') ??
          request.headers.get('x-real-ip') ??
          request.headers.get('cf-connecting-ip') ??
          'default-token'; // Fallback token for development

        // Get current timestamp
        const now = Date.now();

        // Get current data or initialize new
        const data = tokenMap.get(ip) ?? { count: 0, timestamp: now };

        // Reset counter if outside interval
        if (now - data.timestamp > interval) {
          data.count = 0;
          data.timestamp = now;
        }

        // Increment counter
        data.count++;

        // Update map
        tokenMap.set(ip, data);

        // Check if rate limited
        if (data.count > limit) {
          const response = json(
            { error: 'Too many requests, please try again later.' },
            { status: 429 }
          );
          response.headers.set('X-RateLimit-Limit', limit.toString());
          response.headers.set('X-RateLimit-Remaining', '0');

          const error = new Error('Rate limit exceeded');
          // Attach the response for handlers that need it
          Object.defineProperty(error, 'response', {
            value: response,
            enumerable: true,
            configurable: true,
          });

          reject(error);
        } else {
          const remaining = Math.max(0, limit - data.count);
          // Set a header for non-rate-limited responses that can be used client-side
          const response = new Response(null);
          response.headers.set('X-RateLimit-Limit', limit.toString());
          response.headers.set('X-RateLimit-Remaining', remaining.toString());
          resolve();
        }
      });
    },
  };
}
