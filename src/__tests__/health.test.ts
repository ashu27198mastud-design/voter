import { GET } from '../app/api/health/route';

describe('Health API Route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns booleans for all configurations', async () => {
    process.env.GEMINI_API_KEY = 'secret';
    process.env.CIVIC_API_KEY = 'secret';
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    
    const response = await GET();
    const data = await response.json();
    
    expect(data.geminiConfigured).toBe(true);
    expect(data.civicConfigured).toBe(true);
    expect(data.mapsConfigured).toBe(false);
    expect(typeof data.searchConfigured).toBe('boolean');
    expect(typeof data.firebaseConfigured).toBe('boolean');
    
    // Ensure no actual keys are returned
    expect(Object.values(data)).not.toContain('secret');
  });
});
