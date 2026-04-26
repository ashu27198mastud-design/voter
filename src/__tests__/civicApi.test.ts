import { voterInfoQuery, representativesInfoByAddress } from '../utils/civicApi';

// Mock fetch
global.fetch = jest.fn();

describe('civicApi utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_CIVIC_API_KEY = 'test-key';
  });

  describe('voterInfoQuery', () => {
    it('should fetch voter info successfully', async () => {
      const mockData = { election: { name: 'Test Election' } };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await voterInfoQuery('123 Main St');
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('address=123+Main+St')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('key=your_actual_civic_key')
      );
    });

    it('should return null on error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
        json: async () => ({ error: 'Not Found' }),
      });

      const result = await voterInfoQuery('Invalid Address');
      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network failure'));

      const result = await voterInfoQuery('123 Main St');
      expect(result).toBeNull();
    });
  });

  describe('representativesInfoByAddress', () => {
    it('should fetch representative info successfully', async () => {
      const mockData = { offices: [], officials: [] };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await representativesInfoByAddress('123 Main St');
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('address=123+Main+St')
      );
    });
  });
});
