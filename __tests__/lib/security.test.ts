import { sanitizeHtml, sanitizeText, buildCSPHeader } from '@/lib/security';

describe('Security Utils', () => {
  describe('sanitizeHtml', () => {
    it('strips <script> tags', () => {
      const dirty = 'Hello <script>alert(1)</script> <b>World</b>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).toContain('<b>World</b>');
    });
  });

  describe('sanitizeText', () => {
    it('removes tags', () => {
      const dirty = 'Hello <b>World</b>';
      const clean = sanitizeText(dirty);
      expect(clean).not.toContain('<b>');
      expect(clean).toBe('Hello World');
    });
  });

  describe('buildCSPHeader', () => {
    it('returns a valid CSP string', () => {
      const header = buildCSPHeader();
      expect(header).toContain('https://maps.googleapis.com');
      expect(header).toContain("frame-ancestors 'none'");
      // Verify hardening: no unsafe-inline in script-src
      const scriptSrc = header.split(';').find(s => s.trim().startsWith('script-src'));
      expect(scriptSrc).not.toContain("'unsafe-inline'");
    });
  });
});
