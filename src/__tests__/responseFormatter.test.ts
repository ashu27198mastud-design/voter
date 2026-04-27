import { normalizeAssistantResponse } from '../lib/responseFormatter';

jest.mock('isomorphic-dompurify', () => ({
  sanitize: jest.fn((text: string) => text.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')),
  addHook: jest.fn(),
}));

describe('Response Formatter Advanced Suite', () => {
  it('handles empty or null inputs gracefully', () => {
    expect(normalizeAssistantResponse('')).toBe('');
    expect(normalizeAssistantResponse(null as unknown as string)).toBe('');
  });

  it('converts markdown bold headers to strong tags and adds breaks', () => {
    const input = '**Direct answer** This is a test.\n**Key information** Here is more.';
    const output = normalizeAssistantResponse(input);
    expect(output).toContain('<strong>Direct answer</strong><br />');
    expect(output).toContain('<strong>Key information</strong><br />');
  });

  it('removes multiple technical terms and leakage in a single response', () => {
    const input = 'AI Service Error: 503 service interruption on Gemini failed. Also stack trace and model-not-found.';
    const output = normalizeAssistantResponse(input);
    expect(output).not.toContain('AI Service Error');
    expect(output).not.toContain('503');
    expect(output).not.toContain('Gemini failed');
    expect(output).not.toContain('stack trace');
    expect(output).not.toContain('model-not-found');
    expect(output).toContain('the processing engine');
  });

  it('preserves existing safe HTML strong tags', () => {
    const input = '<strong>Safe Tag</strong>';
    const output = normalizeAssistantResponse(input);
    expect(output).toContain('<strong>Safe Tag</strong>');
  });

  describe('List Processing', () => {
    it('converts bullet points to ul/li correctly', () => {
      const input = 'Checklist:\n- Step 1\n- Step 2';
      const output = normalizeAssistantResponse(input);
      expect(output).toContain('<ul><li>Step 1</li><li>Step 2</li></ul>');
    });

    it('handles lists terminated by empty lines', () => {
      const input = 'Intro:\n* Item A\n* Item B\n\nOutro text';
      const output = normalizeAssistantResponse(input);
      expect(output).toContain('<ul><li>Item A</li><li>Item B</li></ul>');
      expect(output).toContain('Outro text');
    });

    it('handles lists immediately followed by normal text', () => {
      const input = 'Intro:\n- Item 1\n- Item 2\nNormal text continues here.';
      const output = normalizeAssistantResponse(input);
      expect(output).toContain('<ul><li>Item 1</li><li>Item 2</li></ul>Normal text');
    });

    it('handles lists at the very end of the input', () => {
      const input = 'Ending with a list:\n* Final 1\n* Final 2';
      const output = normalizeAssistantResponse(input);
      expect(output).toContain('<ul><li>Final 1</li><li>Final 2</li></ul>');
    });
  });

  it('removes unsafe script tags', () => {
    const input = 'Hello <script>alert(1)</script>';
    const output = normalizeAssistantResponse(input);
    expect(output).not.toContain('<script>');
  });
});
