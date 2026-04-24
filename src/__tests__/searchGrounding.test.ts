import { searchElectionSources } from '../services/searchGrounding';

// Mock global fetch
global.fetch = jest.fn();

describe('searchElectionSources Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    (global.fetch as jest.Mock).mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns empty array if API keys are missing', async () => {
    delete process.env.GOOGLE_SEARCH_API_KEY;
    delete process.env.GOOGLE_SEARCH_ENGINE_ID;

    const results = await searchElectionSources('test query');
    expect(results).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns normalized results on success', async () => {
    process.env.GOOGLE_SEARCH_API_KEY = 'test_key';
    process.env.GOOGLE_SEARCH_ENGINE_ID = 'test_id';

    const mockResponse = {
      items: [
        {
          title: 'Official Voting Info',
          link: 'https://election.gov',
          snippet: 'Learn how to register to vote.',
          displayLink: 'election.gov'
        }
      ]
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponse)
    });

    const results = await searchElectionSources('how to register');
    
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      title: 'Official Voting Info',
      link: 'https://election.gov',
      snippet: 'Learn how to register to vote.',
      displayLink: 'election.gov'
    });
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('q=how+to+register'),
      expect.any(Object)
    );
  });

  it('handles API errors gracefully', async () => {
    process.env.GOOGLE_SEARCH_API_KEY = 'test_key';
    process.env.GOOGLE_SEARCH_ENGINE_ID = 'test_id';

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error'
    });

    const results = await searchElectionSources('query');
    expect(results).toEqual([]);
  });
});
