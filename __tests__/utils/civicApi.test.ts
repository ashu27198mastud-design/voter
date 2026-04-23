// Mock fetch globally
global.fetch = jest.fn();

describe('civicApi utility', () => {
  const mockApiKey = 'test-api-key';
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, GOOGLE_CIVIC_API_KEY: mockApiKey };
    (fetch as jest.Mock).mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('queryVoterInfo', () => {
    it('returns null if API key is missing', async () => {
      process.env.GOOGLE_CIVIC_API_KEY = '';
      // Require the module here after resetting modules
      const { queryVoterInfo } = require('@/utils/civicApi');
      const result = await queryVoterInfo('test address');
      expect(result).toBeNull();
    });

    it('successfully fetches voter info', async () => {
      const mockData = { election: { name: 'Test Election' } };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { queryVoterInfo } = require('@/utils/civicApi');
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

      const { queryVoterInfo } = require('@/utils/civicApi');
      const result = await queryVoterInfo('invalid address');
      expect(result).toBeNull();
    });

    it('returns null on fetch rejection', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      const { queryVoterInfo } = require('@/utils/civicApi');
      const result = await queryVoterInfo('test address');
      expect(result).toBeNull();
    });
  });

  describe('queryRepresentatives', () => {
    it('successfully fetches representatives', async () => {
      const mockData = { officials: [{ name: 'John Doe' }] };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { queryRepresentatives } = require('@/utils/civicApi');
      const result = await queryRepresentatives('123 Main St');
      expect(result).toEqual(mockData);
    });

    it('returns null on API error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'not found' }),
      });

      const { queryRepresentatives } = require('@/utils/civicApi');
      const result = await queryRepresentatives('unknown address');
      expect(result).toBeNull();
    });
  });
});
