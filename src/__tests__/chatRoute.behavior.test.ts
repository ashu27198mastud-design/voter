import { NextRequest } from 'next/server';
import { POST } from '../app/api/chat/route';

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
          text: () => '**Direct answer** Refusal. I cannot suggest who to vote for. Sources / verification: Non-partisan policy.'
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: () => ({
        generateContent: () => ({
          response: { text: () => 'AI Service Error: 503 failed' }
        })
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    GoogleGenerativeAI.mockImplementationOnce(() => ({
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    GoogleGenerativeAI.mockImplementationOnce(() => ({
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
