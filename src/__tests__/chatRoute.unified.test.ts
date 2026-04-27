import { POST } from '../app/api/chat/route';
import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Unified Mocks
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
jest.mock('isomorphic-dompurify', () => ({
  sanitize: jest.fn((text: string) => text),
  addHook: jest.fn(),
}));

describe('Chat API Unified Suite', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-key' };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Stability and Configuration', () => {
    it('uses stable Gemini 1.5 model names', async () => {
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

      expect(mockGetGenerativeModel).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gemini-1.5-flash'
      }));
    });
  });

  describe('Behavior and Safety', () => {
    it('refuses political questions with non-partisan policy', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => '<strong>Direct answer</strong> Refusal. I cannot suggest who to vote for. <br /><br /> <strong>Sources / verification</strong><br /> Non-partisan policy.'
        }
      });
      
      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent
        })
      }));

      const req = new NextRequest('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({ query: 'who should I vote for' })
      });

      const res = await POST(req);
      const data = await res.json();
      
      expect(data.response).toContain('I cannot suggest who to vote for');
      expect(data.response).toContain('<strong>Direct answer</strong>');
    });

    it('removes technical leakage from responses', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: { text: () => 'AI Service Error: 503 failed' }
      });
      
      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent
        })
      }));

      const req = new NextRequest('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({ query: 'hello' })
      });

      const res = await POST(req);
      const data = await res.json();
      
      expect(data.response).not.toContain('AI Service Error');
      expect(data.response).toContain('the processing engine');
    });
  });

  describe('Location-Aware Fallbacks', () => {
    it('mentions Australian Electoral Commission for AU context', async () => {
      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: () => { throw new Error('API Down'); }
      }));

      const req = new NextRequest('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          query: 'how to vote',
          location: { city: 'Sydney', state: 'NSW', country: 'AU' }
        })
      });

      const res = await POST(req);
      const data = await res.json();
      
      expect(data.response).toContain('Australian Electoral Commission');
    });

    it('mentions Election Commission of India for IN context', async () => {
      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: () => { throw new Error('API Down'); }
      }));

      const req = new NextRequest('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          query: 'epic card',
          location: { city: 'Mumbai', state: 'MH', country: 'IN' }
        })
      });

      const res = await POST(req);
      const data = await res.json();
      
      expect(data.response).toContain('Election Commission of India');
    });
  });
});
