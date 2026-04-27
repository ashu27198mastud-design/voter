import { searchElectionSources } from '../services/searchGrounding';

// Mock the global fetch
global.fetch = jest.fn();

describe('Search Grounding Service Advanced Suite', () => {
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

  describe('Location Context Targeting', () => {
    it('calls Google Search API with IN parameters', async () => {
      process.env.GOOGLE_SEARCH_API_KEY = 'test-key';
      process.env.GOOGLE_SEARCH_ENGINE_ID = 'test-id';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [{ title: 'Result 1', link: 'https://link1.com' }] })
      });

      await searchElectionSources('election status', { city: 'Kolkata', state: 'West Bengal', country: 'IN' });
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('Election+Commission+of+India'), expect.anything());
    });

    it('calls Google Search API with AU parameters', async () => {
      process.env.GOOGLE_SEARCH_API_KEY = 'test-key';
      process.env.GOOGLE_SEARCH_ENGINE_ID = 'test-id';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] })
      });

      await searchElectionSources('how to vote', { city: 'Sydney', state: 'NSW', country: 'AU' });
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('Australian+Electoral+Commission'), expect.anything());
    });

    it('calls Google Search API with GB parameters', async () => {
      process.env.GOOGLE_SEARCH_API_KEY = 'test-key';
      process.env.GOOGLE_SEARCH_ENGINE_ID = 'test-id';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] })
      });

      await searchElectionSources('vote id', { city: 'London', state: 'England', country: 'GB' });
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('gov.uk+electoral'), expect.anything());
    });

    it('calls Google Search API with US parameters', async () => {
      process.env.GOOGLE_SEARCH_API_KEY = 'test-key';
      process.env.GOOGLE_SEARCH_ENGINE_ID = 'test-id';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] })
      });

      await searchElectionSources('absentee', { city: 'New York', state: 'NY', country: 'US' });
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('vote.gov+state'), expect.anything());
    });

    it('calls Google Search API with CA parameters', async () => {
      process.env.GOOGLE_SEARCH_API_KEY = 'test-key';
      process.env.GOOGLE_SEARCH_ENGINE_ID = 'test-id';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] })
      });

      await searchElectionSources('polling', { city: 'Toronto', state: 'ON', country: 'CA' });
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('Elections+Canada'), expect.anything());
    });

    it('calls Google Search API with generic fallback parameters', async () => {
      process.env.GOOGLE_SEARCH_API_KEY = 'test-key';
      process.env.GOOGLE_SEARCH_ENGINE_ID = 'test-id';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] })
      });

      await searchElectionSources('polling', { city: 'Berlin', state: 'Berlin', country: 'DE' });
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('Berlin+Berlin+official'), expect.anything());
    });
  });

  describe('Data Normalization and Filtering', () => {
    it('normalizes results, strips HTML tags, and filters campaigns', async () => {
      process.env.GOOGLE_SEARCH_API_KEY = 'test-key';
      process.env.GOOGLE_SEARCH_ENGINE_ID = 'test-id';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            { title: '<b>Official</b> Election', snippet: '<i>Click here</i>', link: 'https://vote.gov', displayLink: 'vote.gov' },
            { title: 'Vote for Me', snippet: 'Donate now', link: 'https://campaign.com', displayLink: 'campaign.com' },
            { title: 'Missing Link', snippet: 'No link' }
          ]
        })
      });

      const results = await searchElectionSources('voting');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Official Election');
      expect(results[0].snippet).toBe('Click here');
      expect(results[0].link).toBe('https://vote.gov');
    });

    it('prioritizes official domains', async () => {
      process.env.GOOGLE_SEARCH_API_KEY = 'test-key';
      process.env.GOOGLE_SEARCH_ENGINE_ID = 'test-id';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            { title: 'News Site', snippet: 'News', link: 'https://news.com' },
            { title: 'Gov Site', snippet: 'Official', link: 'https://eci.gov.in' }
          ]
        })
      });

      const results = await searchElectionSources('voting');
      expect(results).toHaveLength(2);
      expect(results[0].link).toBe('https://eci.gov.in'); // Sorted first
    });
  });

  describe('Error Handling', () => {
    it('handles non-OK API response gracefully', async () => {
      process.env.GOOGLE_SEARCH_API_KEY = 'test-key';
      process.env.GOOGLE_SEARCH_ENGINE_ID = 'test-id';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const results = await searchElectionSources('test query');
      expect(results).toEqual([]);
    });

    it('handles missing items in JSON response', async () => {
      process.env.GOOGLE_SEARCH_API_KEY = 'test-key';
      process.env.GOOGLE_SEARCH_ENGINE_ID = 'test-id';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ noItemsHere: true })
      });

      const results = await searchElectionSources('test query');
      expect(results).toEqual([]);
    });

    it('handles network throw gracefully', async () => {
      process.env.GOOGLE_SEARCH_API_KEY = 'test-key';
      process.env.GOOGLE_SEARCH_ENGINE_ID = 'test-id';

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const results = await searchElectionSources('test query');
      expect(results).toEqual([]);
    });
  });
});
