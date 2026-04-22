import DOMPurify from 'isomorphic-dompurify';

/**
 * CSP_DIRECTIVES defines the allowed sources for various resource types.
 * strictly adheres to the PromptWars security mandate.
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://maps.googleapis.com'],
  'connect-src': ["'self'", 'https://generativelanguage.googleapis.com', 'https://maps.googleapis.com', 'https://www.googleapis.com'],
  'img-src': ["'self'", 'data:', 'https:'],
  'frame-ancestors': ["'none'"],
};

/**
 * Builds a Content Security Policy header string from directives.
 */
export function buildCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Sanitizes an HTML string to prevent XSS attacks.
 * @param dirty The potentially unsafe HTML string.
 * @returns A safe, sanitized HTML string.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h3', 'h4'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

/**
 * Sanitizes plain text by removing all HTML tags.
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}
