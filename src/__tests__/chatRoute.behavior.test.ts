import { NextRequest } from 'next/server';
import { POST } from '../app/api/chat/route';
import { GoogleGenerativeAI } from '@google/generative-ai';

jest.mock('isomorphic-dompurify', () => ({
  sanitize: jest.fn((text: string) => text),
  addHook: jest.fn(),
}));

// Mock all external services
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockImplementation(() => ({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => '<strong>Direct answer</strong> Refusal. I cannot suggest who to vote for. <br /><br /> <strong>Sources / verification</strong><br /> Non-partisan policy.'
        }
      })
    }))
  }))
}));

jest.mock('../services/searchGrounding', () => ({
  searchElectionSources: jest.fn().mockResolvedValue([])
}));

jest.mock('next/headers', () => ({
  headers: jest.fn().mockResolvedValue({
    get: (key: string) => (key === 'x-forwarded-for' ? '127.0.0.1' : null)
  })
}));

describe('Chat API Behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('refuses political questions with non-partisan policy', async () => {
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ query: 'who should I vote for' })
    });

    const res = await POST(req);
    const data = await res.json();
    
    expect(data.response).toContain('I cannot suggest who to vote for');
    expect(data.response).toContain('<strong>Direct answer</strong>');
  });

  it('removes technical leakage from Gemini responses', async () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: { text: () => 'AI Service Error: 503 failed' }
    });
    
    (GoogleGenerativeAI as jest.Mock).mockImplementationOnce(() => ({
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

  it('mentions Australian Electoral Commission for AU fallback', async () => {
    // Force a failure to trigger fallback
    (GoogleGenerativeAI as jest.Mock).mockImplementationOnce(() => ({
      getGenerativeModel: () => ({
        generateContent: () => { throw new Error('API Down'); }
      })
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

  it('mentions Election Commission of India for IN fallback', async () => {
    (GoogleGenerativeAI as jest.Mock).mockImplementationOnce(() => ({
      getGenerativeModel: () => ({
        generateContent: () => { throw new Error('API Down'); }
      })
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
