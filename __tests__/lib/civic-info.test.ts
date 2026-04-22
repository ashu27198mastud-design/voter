import { fetchVoterInfo, fetchRepresentativesInfo } from '../../src/lib/civic-info';

// Mock global fetch
global.fetch = jest.fn();

describe('Civic Info API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Silence console logs during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Set mock API key
    process.env.NEXT_PUBLIC_CIVIC_API_KEY = 'mock-key';
  });

  it('fetchVoterInfo returns null on API error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    const result = await fetchVoterInfo('Invalid Address');
    expect(result).toBeNull();
  });

  it('fetchVoterInfo returns data on success', async () => {
    const mockData = { election: { name: '2024 General' } };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const result = await fetchVoterInfo('1600 Amphitheatre Pkwy');
    expect(result).toEqual(mockData);
  });

  it('fetchRepresentativesInfo returns null on network failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Fail'));

    const result = await fetchRepresentativesInfo('123 Main St');
    expect(result).toBeNull();
  });
});
