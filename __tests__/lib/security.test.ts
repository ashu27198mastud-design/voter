import { sanitizeHtml, sanitizeText, buildCSPHeader } from '@/lib/security';

jest.mock('isomorphic-dompurify', () => ({
  sanitize: (text: string, options?: unknown) => {
    const opts = options as { ALLOWED_TAGS?: string[] } | undefined;
    // Very simple mock logic for testing purposes
    if (opts && opts.ALLOWED_TAGS && opts.ALLOWED_TAGS.length === 0) {
      return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
    return text.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
               .replace(/onclick=".*?"/gim, '');
  },
  addHook: jest.fn(),
}));

describe('Security Utils', () => {
  describe('sanitizeHtml', () => {
    it('strips <script> tags', () => {
      const dirty = 'Hello <script>alert(1)</script> <b>World</b>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).toContain('<b>World</b>');
    });

    it('handles links and attributes correctly', () => {
      const dirty = '<a href="https://example.com" onclick="alert(1)">Link</a>';
      const clean = sanitizeHtml(dirty);
      expect(clean).toContain('href="https://example.com"');
      expect(clean).not.toContain('onclick');
    });
  });

  describe('sanitizeText', () => {
    it('removes all HTML tags', () => {
      const dirty = 'Hello <b>World</b> <p>Test</p>';
      const clean = sanitizeText(dirty);
      expect(clean).toBe('Hello World Test');
    });
  });

  describe('buildCSPHeader', () => {
    it('returns a structured CSP string', () => {
      const header = buildCSPHeader();
      expect(typeof header).toBe('string');
      expect(header).toContain("default-src 'self'");
      expect(header).toContain("frame-ancestors 'none'");
    });

    it('includes all necessary connect-src domains', () => {
      const header = buildCSPHeader();
      expect(header).toContain('https://maps.googleapis.com');
      expect(header).toContain('https://www.googleapis.com');
      expect(header).toContain('https://generativelanguage.googleapis.com');
    });
  });
});
