import { sanitizeHtml, sanitizeText } from '../../src/lib/security';
import { QuerySchema, LocationSchema } from '../../src/lib/validation';

describe('Security: Sanitization & Validation', () => {
  
  describe('sanitizeHtml', () => {
    it('removes <script> tags but keeps <b> tags', () => {
      const dirty = 'Hello <script>alert("xss")</script> <b>World</b>';
      const clean = sanitizeHtml(dirty);
      expect(clean).toBe('Hello  <b>World</b>');
    });

    it('removes event handlers like onmouseover', () => {
      const dirty = '<p onmouseover="alert(1)">Hover me</p>';
      const clean = sanitizeHtml(dirty);
      expect(clean).toBe('<p>Hover me</p>');
    });

    it('removes javascript: pseudo-protocol in links', () => {
      const dirty = '<a href="javascript:alert(1)">Click me</a>';
      const clean = sanitizeHtml(dirty);
      expect(clean).toBe('<a>Click me</a>');
    });
  });

  describe('sanitizeText', () => {
    it('removes all HTML tags', () => {
      const dirty = '<div>Hello</div> <span>World</span>';
      const clean = sanitizeText(dirty);
      expect(clean).toBe('Hello World');
    });
  });

  describe('QuerySchema (Input Validation)', () => {
    it('rejects input exceeding 500 characters', () => {
      const longInput = 'a'.repeat(501);
      const result = QuerySchema.safeParse({ query: longInput });
      expect(result.success).toBe(false);
    });

    it('rejects input containing <script> tags', () => {
      const result = QuerySchema.safeParse({ query: 'Hello <script>alert(1)</script>' });
      expect(result.success).toBe(false);
    });

    it('accepts clean alphanumeric queries', () => {
      const result = QuerySchema.safeParse({ query: 'How do I register to vote in California?' });
      expect(result.success).toBe(true);
    });
  });

  describe('LocationSchema (Input Validation)', () => {
    it('rejects city names with potentially malicious characters', () => {
      const result = LocationSchema.safeParse({ 
        city: 'Mumbai<script>', 
        state: 'MH', 
        country: 'IN' 
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid international names with accents', () => {
      const result = LocationSchema.safeParse({ 
        city: 'São Paulo', 
        state: 'SP', 
        country: 'BR' 
      });
      expect(result.success).toBe(true);
    });
  });
});
