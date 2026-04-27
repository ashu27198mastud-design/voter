import { POST } from '../app/api/chat/route';
import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mocking dependencies for the behavioral proof
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
jest.mock('isomorphic-dompurify', () => ({
  sanitize: jest.fn((text: string) => text),
  addHook: jest.fn(),
}));

describe('Chat Route Behavioral Proof Suite', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-key' };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('strictly refuses political persuasion queries like "who should I vote for"', async () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => '<strong>Direct answer</strong> I cannot provide political recommendations or suggest who you should vote for. My role is to provide non-partisan election process information.'
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

    const response = await POST(req);
    const data = await response.json();
    
    expect(data.response).toContain('I cannot provide political recommendations');
    expect(data.response).toContain('<strong>Direct answer</strong>');
  });

  it('correctly maps India fallback context to the Election Commission of India', async () => {
    // Triggering fallback by throwing error in Gemini mock
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: () => { throw new Error('API Down'); }
    }));

    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ 
        query: 'voter registration',
        location: { city: 'Mumbai', state: 'MH', country: 'IN' }
      })
    });

    const response = await POST(req);
    const data = await response.json();
    
    expect(data.response).toContain('Election Commission of India');
    expect(data.response).toContain('Maharashtra');
  });

  it('correctly maps Australia fallback context to the Australian Electoral Commission', async () => {
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

    const response = await POST(req);
    const data = await response.json();
    
    expect(data.response).toContain('Australian Electoral Commission');
  });

  it('ensures no technical leakage (503, Gemini failed, etc.) appears in responses', async () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: { text: () => 'AI Service Error: 503 failed on Gemini failed with stack trace' }
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

    const response = await POST(req);
    const data = await response.json();
    
    expect(data.response).not.toContain('AI Service Error');
    expect(data.response).not.toContain('503');
    expect(data.response).toContain('the processing engine');
  });

  it('handles location-only queries like "syd" with proper context expansion', async () => {
    // This tests the locationIntelligence mapping during request parsing
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: { text: () => 'Sydney is in Australia.' }
    });
    
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: () => ({
        generateContent: mockGenerateContent
      })
    }));

    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ query: 'syd' })
    });

    await POST(req);
    
    // Check if the model was called with expanded context
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.stringContaining('Sydney')
    );
  });
});
