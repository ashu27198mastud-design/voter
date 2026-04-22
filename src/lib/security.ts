import DOMPurify from 'isomorphic-dompurify';

/**
 * Core security utilities for the application. This module handles input sanitization,
 * output cleaning, and Content Security Policy (CSP) header generation.
 * It strictly adheres to data minimization and security best practices.
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://maps.googleapis.com'],
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
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h3', 'h4', 'div', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'className', 'class'],
    // Automatically add noopener/noreferrer to target="_blank"
    FORBID_ATTR: ['style', 'onerror', 'onclick'],
  });
}

/**
 * Sanitizes plain text by removing all HTML tags.
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}
