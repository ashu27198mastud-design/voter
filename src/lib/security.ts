import DOMPurify from 'isomorphic-dompurify';

/**
 * RULE 3 - OUTPUT SANITIZATION (DOMPurify):
 * All AI-generated content or user-submitted content rendered in the UI
 * MUST pass through this function.
 */

const purifyConfig = {
  ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'a', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id'],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
};

/**
 * Sanitizes an HTML string to prevent XSS attacks.
 * @param dirty The potentially unsafe HTML string.
 * @returns A safe, sanitized HTML string.
 */
export function sanitizeHtml(dirty: string): string {
  // We use isomorphic-dompurify so this works on both client and server safely.
  return DOMPurify.sanitize(dirty, purifyConfig) as string;
}

/**
 * Sanitizes plain text input (e.g., stripping tags completely if we only want text).
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }) as string;
}
