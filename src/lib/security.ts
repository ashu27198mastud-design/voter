import DOMPurify from 'isomorphic-dompurify';

/**
 * Core security utilities for the application. This module handles input sanitization,
 * output cleaning, and Content Security Policy (CSP) header generation.
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", 'https://maps.googleapis.com'],
  'connect-src': [
    "'self'",
    'https://generativelanguage.googleapis.com',
    'https://maps.googleapis.com',
    'https://www.googleapis.com',
  ],
  'img-src': ["'self'", 'data:', 'https:'],
  'style-src': ["'self'", "'unsafe-inline'"],
  'font-src': ["'self'", 'data:', 'https:'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

export function buildCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if ('target' in node && node.getAttribute('target') === '_blank') {
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b',
      'i',
      'em',
      'strong',
      'a',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'h3',
      'h4',
      'div',
      'span',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'className', 'class'],
    ADD_ATTR: ['target', 'rel'],
    FORBID_ATTR: ['style', 'onerror', 'onclick'],
  });
}

export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}
