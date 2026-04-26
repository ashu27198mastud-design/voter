import { sanitizeHtml, sanitizeText, buildCSPHeader } from '@/lib/security';

jest.mock('isomorphic-dompurify', () => {
  const mockNode = {
    getAttribute: (name: string) => (name === 'target' ? '_blank' : null),
    setAttribute: jest.fn(),
  };
  // To cover the branch 'target' in node
  Object.defineProperty(mockNode, 'target', { value: '_blank' });

  return {
    sanitize: jest.fn((text: string) => text),
    addHook: jest.fn((event: string, cb: (node: unknown) => void) => {
      if (event === 'afterSanitizeAttributes') {
        cb(mockNode);
        cb({}); // node without target
      }
    }),
  };
});

describe('Security Utils', () => {
  describe('sanitizeHtml', () => {
    it('returns text (mocked)', () => {
      const dirty = '<b>Test</b>';
      const clean = sanitizeHtml(dirty);
      expect(clean).toBe(dirty);
    });
  });

  describe('sanitizeText', () => {
    it('returns text (mocked)', () => {
      const dirty = 'Test';
      const clean = sanitizeText(dirty);
      expect(clean).toBe(dirty);
    });
  });

  describe('buildCSPHeader', () => {
    it('returns a structured CSP string', () => {
      const header = buildCSPHeader();
      expect(typeof header).toBe('string');
      expect(header).toContain("default-src 'self'");
    });
  });
});
