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

    const results = await searchElectionSources('election status', { city: 'Kolkata', state: 'West Bengal', country: 'IN' });
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('Election+Commission+of+India'),
      expect.anything()
    );
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Result 1');
  });

  it('enhances AU query with AEC intent', async () => {
    process.env.GOOGLE_SEARCH_API_KEY = 'test-key';
    process.env.GOOGLE_SEARCH_ENGINE_ID = 'test-id';

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] })
    });

    await searchElectionSources('how to vote', { city: 'Sydney', state: 'NSW', country: 'AU' });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('Australian+Electoral+Commission'),
      expect.anything()
    );
  });

  it('normalizes results and filters campaigns', async () => {
    process.env.GOOGLE_SEARCH_API_KEY = 'test-key';
    process.env.GOOGLE_SEARCH_ENGINE_ID = 'test-id';

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          { title: '<b>Official</b> Election', snippet: 'Click here', link: 'https://vote.gov' },
          { title: 'Vote for Me', snippet: 'Donate now', link: 'https://campaign.com' }
        ]
      })
    });

    const results = await searchElectionSources('voting');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Official Election');
    expect(results[0].link).toBe('https://vote.gov');
  });

  it('handles API errors and empty responses gracefully', async () => {
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
