import { normalizeAssistantResponse } from '../lib/responseFormatter';

jest.mock('isomorphic-dompurify', () => ({
  sanitize: jest.fn((text: string) => text.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')),
  addHook: jest.fn(),
}));

describe('normalizeAssistantResponse', () => {
  it('converts markdown bold headers to strong tags', () => {
    const input = '**Direct answer** This is a test.';
    const output = normalizeAssistantResponse(input);
    expect(output).toContain('<strong>Direct answer</strong><br />');
  });

  it('removes technical terms and leakage', () => {
    const input = 'AI Service Error: 503 service interruption on Gemini failed';
    const output = normalizeAssistantResponse(input);
    expect(output).not.toContain('AI Service Error');
    expect(output).not.toContain('503');
    expect(output).toContain('the processing engine');
  });

  it('preserves existing safe HTML strong tags', () => {
    const input = '<strong>Safe Tag</strong>';
    const output = normalizeAssistantResponse(input);
    expect(output).toContain('<strong>Safe Tag</strong>');
  });

  it('converts bullet points to ul/li', () => {
    const input = 'Checklist:\n- Step 1\n- Step 2';
    const output = normalizeAssistantResponse(input);
    expect(output).toContain('<ul><li>Step 1</li><li>Step 2</li></ul>');
  });

  it('removes unsafe script tags', () => {
    const input = 'Hello <script>alert(1)</script>';
    const output = normalizeAssistantResponse(input);
    expect(output).not.toContain('<script>');
  });

  it('adds line breaks after known section headers', () => {
    const input = '<strong>Key information</strong>Details here';
    const output = normalizeAssistantResponse(input);
    expect(output).toContain('<strong>Key information</strong><br />');
  });
});
