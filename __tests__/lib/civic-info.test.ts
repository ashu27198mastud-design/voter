import { queryVoterInfo, queryRepresentatives } from '@/utils/civicApi';

// Mock global fetch
global.fetch = jest.fn();

describe('Civic Info API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Silence console logs during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Set mock API key
    process.env.GOOGLE_CIVIC_API_KEY = 'mock-key';
  });

  it('queryVoterInfo returns null on API error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    const result = await queryVoterInfo('Invalid Address');
    expect(result).toBeNull();
  });

  it('queryVoterInfo returns data on success', async () => {
    const mockData = { election: { name: '2024 General' } };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const result = await queryVoterInfo('1600 Amphitheatre Pkwy');
    expect(result).toEqual(mockData);
  });

  it('queryRepresentatives returns null on network failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Fail'));

    const result = await queryRepresentatives('123 Main St');
    expect(result).toBeNull();
  });
});
