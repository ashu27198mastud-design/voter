import { searchElectionSources } from '../services/searchGrounding';

// Mock the global fetch
global.fetch = jest.fn();

describe('Search Grounding Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    (global.fetch as jest.Mock).mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('skips search if API keys are missing', async () => {
    delete process.env.GOOGLE_SEARCH_API_KEY;
    const results = await searchElectionSources('test query');
    expect(results).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('calls Google Search API with correct parameters', async () => {
    process.env.GOOGLE_SEARCH_API_KEY = 'test-key';
    process.env.GOOGLE_SEARCH_ENGINE_ID = 'test-id';

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          { title: 'Result 1', snippet: 'Snippet 1', link: 'https://link1.com' }
        ]
      })
    });

    const results = await searchElectionSources('election status', { city: 'Kolkata' });
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('q=election+status+Kolkata'),
      expect.anything()
    );
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Result 1');
  });

  it('handles API errors gracefully', async () => {
    process.env.GOOGLE_SEARCH_API_KEY = 'test-key';
    process.env.GOOGLE_SEARCH_ENGINE_ID = 'test-id';

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const results = await searchElectionSources('test query');
    expect(results).toEqual([]);
  });
});
