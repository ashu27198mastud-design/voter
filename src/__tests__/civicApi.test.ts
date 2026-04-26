
describe('civicApi utility', () => {
  const mockApiKey = 'test-api-key';
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, GOOGLE_CIVIC_API_KEY: mockApiKey };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('queryVoterInfo', () => {
    it('returns null if API key is missing', async () => {
      process.env.GOOGLE_CIVIC_API_KEY = '';
      // Use dynamic import to test env var changes after module reset
      const { queryVoterInfo } = await import('@/utils/civicApi');
      const result = await queryVoterInfo('test address');
      expect(result).toBeNull();
    });

    it('successfully fetches voter info', async () => {
      const mockData = { election: { name: 'Test Election' } };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { queryVoterInfo } = await import('@/utils/civicApi');
      const result = await queryVoterInfo('123 Main St', '2000');
      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('electionId=2000'));
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('key=test-api-key'));
    });

    it('returns null on API error response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'bad request' }),
      });

      const { queryVoterInfo } = await import('@/utils/civicApi');
      const result = await queryVoterInfo('invalid address');
      expect(result).toBeNull();
    });

    it('returns null on fetch rejection', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      const { queryVoterInfo } = await import('@/utils/civicApi');
      const result = await queryVoterInfo('test address');
      expect(result).toBeNull();
    });
  });

  describe('queryRepresentatives', () => {
    it('returns null if API key is missing', async () => {
      process.env.GOOGLE_CIVIC_API_KEY = '';
      const { queryRepresentatives } = await import('@/utils/civicApi');
      const result = await queryRepresentatives('test address');
      expect(result).toBeNull();
    });

    it('successfully fetches representatives', async () => {
      const mockData = { officials: [{ name: 'John Doe' }] };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { queryRepresentatives } = await import('@/utils/civicApi');
      const result = await queryRepresentatives('123 Main St');
      expect(result).toEqual(mockData);
    });

    it('successfully fetches representatives with levels and roles', async () => {
      const mockData = { officials: [{ name: 'Jane Doe' }] };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { queryRepresentatives } = await import('@/utils/civicApi');
      const result = await queryRepresentatives('123 Main St', ['administrativeArea1'], ['legislatorUpperBody']);
      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('levels=administrativeArea1'));
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('roles=legislatorUpperBody'));
    });

    it('returns null on API error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'not found' }),
      });

      const { queryRepresentatives } = await import('@/utils/civicApi');
      const result = await queryRepresentatives('unknown address');
      expect(result).toBeNull();
    });
    it('returns null on fetch rejection', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      const { queryRepresentatives } = await import('@/utils/civicApi');
      const result = await queryRepresentatives('test address');
      expect(result).toBeNull();
    });
  });
});
