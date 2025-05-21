/**
 * URL Shortener Utility
 *
 * This utility provides functions to generate short URLs for meeting links.
 * It creates unique, readable short codes that can be used instead of long
 * video conference URLs.
 */

/**
 * Supported meeting platforms
 */
export type Platform = 'google-meet' | 'zoom' | 'youtube' | undefined;

/**
 * Configuration options for the URL shortener
 */
export interface ShortenerOptions {
  /** Desired length of the generated short code (default: 6) */
  codeLength?: number;
  /** Custom domain for short URLs (default: process.env.BASE_URL or window.location.origin) */
  domain?: string;
  /** Whether to use only alphanumeric characters (default: true) */
  alphanumeric?: boolean;
  /** Custom short code provided by the user (will be used instead of generating one) */
  customShortCode?: string;
  /** Options for QR code generation */
  qrOptions?: QRCodeOptions;
}

/**
 * Options for QR code generation
 */
export interface QRCodeOptions {
  /** Size of the QR code in pixels (default: 200) */
  size?: number;
  /** Error correction level (default: 'M') */
  errorCorrection?: 'L' | 'M' | 'Q' | 'H';
  /** Margin around the QR code (default: 4) */
  margin?: number;
  /** Color of the QR code foreground (default: '000000') */
  dark?: string;
  /** Color of the QR code background (default: 'ffffff') */
  light?: string;
}

/**
 * Result of the URL shortening process
 */
export interface ShortenResult {
  /** The original URL that was shortened */
  originalUrl: string;
  /** The generated short code */
  shortCode: string;
  /** The complete shortened URL (domain + short code) */
  shortenedUrl: string;
  /** URL to a QR code image for the shortened URL (optional) */
  qrCodeUrl?: string;
}

/**
 * Meeting link data
 */
export interface MeetingLink {
  /** Name of the meeting */
  name: string;
  /** Original meeting URL */
  url: string;
  /** Shortened URL */
  shortenedUrl: string;
  /** QR code URL (if generated) */
  qrCodeUrl?: string;
  /** Meeting platform */
  platform: Exclude<Platform, undefined>;
  /** Meeting description */
  description?: string;
  /** Meeting username (if required) */
  meetingUsername?: string;
  /** Meeting password (if required) */
  meetingPassword?: string;
  /** Creation timestamp */
  createdAt: Date;
}

// Character sets for generating short codes
const ALPHA_NUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const ALPHA_NUMERIC_SAFE = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'; // Removed confusing chars: 0O1Il

/**
 * Generates a random short code for URL shortening
 *
 * @param length - The length of the code to generate (default: 6)
 * @param alphanumeric - Whether to use only alphanumeric characters (default: true)
 * @param safe - Whether to exclude visually similar characters like 0/O, 1/I/l (default: true)
 * @returns A unique short code string
 */
export function generateShortCode(length = 6, alphanumeric = true, safe = true): string {
  const chars = safe ? ALPHA_NUMERIC_SAFE : ALPHA_NUMERIC;
  let result = '';

  // Create cryptographically strong random values
  const randomValues = new Uint8Array(length);

  // Use crypto.getRandomValues if available (browser), otherwise fallback to Math.random
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
  } else {
    for (let i = 0; i < length; i++) {
      randomValues[i] = Math.floor(Math.random() * 256);
    }
  }

  // Convert random values to characters
  for (let i = 0; i < length; i++) {
    result += chars.charAt(randomValues[i] % chars.length);
  }

  return result;
}

/**
 * Gets the base domain for shortened URLs
 *
 * @param customDomain - Optional custom domain to use
 * @returns The base domain for shortened URLs
 */
export function getShortDomain(customDomain?: string): string {
  // Use custom domain if provided
  if (customDomain) return customDomain;

  // Use environment variable if available
  if (typeof process !== 'undefined' && process.env.BASE_URL) {
    return process.env.BASE_URL;
  }

  // Fallback to current origin in browser context
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Default fallback
  return 'This is a fallback';
}

/**
 * Validates a URL
 *
 * @param url - The URL to validate
 * @returns True if the URL is valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes and normalizes a URL
 *
 * @param url - The URL to sanitize
 * @returns Sanitized URL with proper protocol
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  try {
    // Normalize the URL
    return new URL(url).toString();
  } catch {
    return url;
  }
}

/**
 * Generates a QR code for a URL
 *
 * @param url - The URL to generate a QR code for
 * @param options - Options for QR code generation
 * @returns A data URL containing the QR code image
 */
export function generateQRCode(url: string, options: QRCodeOptions = {}): string {
  const {
    size = 200,
    errorCorrection = 'M',
    margin = 4,
    dark = '000000',
    light = 'ffffff',
  } = options;

  // Encode URL for the QR code service
  const encodedUrl = encodeURIComponent(url);

  // Use QRServer API for QR code generation
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodedUrl}&size=${size}x${size}&ecc=${errorCorrection.toLowerCase()}&margin=${margin}&color=${dark}&bgcolor=${light}`;
}

/**
 * Extracts the platform name from a meeting URL
 *
 * @param url - The meeting URL
 * @returns The detected platform ('google-meet', 'zoom', 'youtube', or undefined)
 */
export function detectPlatform(url: string): Platform {
  if (!url) return undefined;

  const sanitizedUrl = sanitizeUrl(url).toLowerCase();

  if (sanitizedUrl.includes('zoom.us') || sanitizedUrl.includes('zoomgov.com')) {
    return 'zoom';
  }

  if (sanitizedUrl.includes('meet.google.com') || sanitizedUrl.includes('google.com/meet')) {
    return 'google-meet';
  }

  if (sanitizedUrl.includes('youtube.com') || sanitizedUrl.includes('youtu.be')) {
    return 'youtube';
  }

  return undefined;
}

/**
 * Shortens a URL to create a more user-friendly link
 *
 * This function generates a shortened URL for meeting links. The shortened
 * URL consists of a domain and a short code that redirects to the original URL.
 * Optionally generates a QR code for the shortened URL.
 *
 * @param originalUrl - The original URL to shorten
 * @param options - Configuration options for the shortener
 * @returns A ShortenResult object containing the original URL, short code, shortened URL, and optional QR code URL
 * @throws Error if the original URL is invalid
 *
 * @example
 * // Basic usage
 * const result = shortenUrl('https://zoom.us/j/123456789?pwd=abcdef');
 * // result.shortenedUrl = 'https://yourdomain.com/Ac7b3F'
 *
 * @example
 * // With custom options
 * const result = shortenUrl('https://meet.google.com/abc-defg-hij', {
 *   codeLength: 8,
 *   domain: 'https://short.myapp.com',
 *   customShortCode: 'my-meeting',
 *   qrOptions: { size: 300 }
 * });
 */
export function shortenUrl(originalUrl: string, options: ShortenerOptions = {}): ShortenResult {
  // Set default options
  const { codeLength = 6, domain, alphanumeric = true, customShortCode, qrOptions } = options;

  // Sanitize the original URL
  const sanitizedUrl = sanitizeUrl(originalUrl);

  // Validate the URL
  if (!isValidUrl(sanitizedUrl)) {
    throw new Error('Invalid URL provided');
  }

  // Use the custom short code if provided, otherwise generate one
  const shortCode = customShortCode ?? generateShortCode(codeLength, alphanumeric);

  // Get the domain for the shortened URL
  const shortDomain = getShortDomain(domain);

  // Build the complete shortened URL
  const shortenedUrl = `${shortDomain}/${shortCode}`;

  // Create result object
  const result: ShortenResult = {
    originalUrl: sanitizedUrl,
    shortCode,
    shortenedUrl,
  };

  // Generate QR code if options provided
  if (qrOptions !== undefined) {
    result.qrCodeUrl = generateQRCode(shortenedUrl, qrOptions);
  }

  return result;
}

/**
 * Creates a formatted meeting link object ready to be stored in the database
 *
 * @param name - The name of the meeting link
 * @param url - The original meeting URL
 * @param options - Additional options (platform, description, credentials)
 * @returns An object with meeting link data including the shortened URL and optional QR code URL
 */
export function createMeetingLink(
  name: string,
  url: string,
  options?: {
    platform?: Platform;
    description?: string;
    meetingUsername?: string;
    meetingPassword?: string;
    shortenerOptions?: ShortenerOptions;
  }
): MeetingLink {
  // Sanitize the URL
  const sanitizedUrl = sanitizeUrl(url);

  // Auto-detect platform if not provided
  const platform = options?.platform || detectPlatform(sanitizedUrl) || 'zoom';

  // Generate the shortened URL (with optional QR code)
  const result = shortenUrl(sanitizedUrl, options?.shortenerOptions);

  // Create the meeting link object
  return {
    name,
    url: sanitizedUrl,
    shortenedUrl: result.shortenedUrl,
    qrCodeUrl: result.qrCodeUrl,
    platform,
    description: options?.description,
    meetingUsername: options?.meetingUsername,
    meetingPassword: options?.meetingPassword,
    createdAt: new Date(),
  };
}

export default {
  shortenUrl,
  generateShortCode,
  generateQRCode,
  isValidUrl,
  sanitizeUrl,
  detectPlatform,
  createMeetingLink,
};
