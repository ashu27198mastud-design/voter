import { POST } from '../app/api/chat/route';
import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock the dependencies
jest.mock('@google/generative-ai');
jest.mock('../services/searchGrounding', () => ({
  searchElectionSources: jest.fn().mockResolvedValue([]),
}));
jest.mock('../lib/rateLimit', () => ({
  checkRateLimit: jest.fn().mockReturnValue({ allowed: true }),
}));
jest.mock('next/headers', () => ({
  headers: jest.fn().mockResolvedValue({
    get: (key: string) => (key === 'x-forwarded-for' ? '127.0.0.1' : null)
  }),
}));
jest.mock('../lib/security', () => ({
  sanitizeHtml: jest.fn((html) => html),
}));

describe('Chat API Route Stabilization', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-key' };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses stable Gemini 1.5 model names without experimental tools', async () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: { text: () => '<strong>Direct answer</strong><p>Test</p>' }
    });
    const mockGetGenerativeModel = jest.fn().mockReturnValue({
      generateContent: mockGenerateContent
    });
    
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel
    }));

    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ query: 'Who can vote?' }),
    });

    await POST(req);

    // Verify model config
    expect(mockGetGenerativeModel).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gemini-1.5-flash'
    }));
    
    // Verify no experimental tools passed
    const callArgs = mockGetGenerativeModel.mock.calls[0][0];
    expect(callArgs.tools).toBeUndefined();
  });

  it('enforces safe HTML sections in the response', async () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: { text: () => '<strong>Direct answer</strong><p>Test response</p>' }
    });
    const mockGetGenerativeModel = jest.fn().mockReturnValue({
      generateContent: mockGenerateContent
    });
    
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel
    }));

    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ query: 'How to register?' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(data.response).toContain('<strong>Direct answer</strong>');
    expect(data.response).not.toContain('**Direct answer**');
  });

  it('uses resolved location in fallback when Gemini fails', async () => {
    // Force Gemini failure
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: () => { throw new Error('Gemini Down'); }
    }));

    const location = { city: 'Sydney', state: 'NSW', country: 'AU' };
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ query: 'Polling places?', location }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(data.response).toContain('Australian Electoral Commission');
    expect(data.response).not.toContain('Gemini Down');
    expect(data.response).not.toContain('service interruption');
  });
});
