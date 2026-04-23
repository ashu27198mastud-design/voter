/**
 * Utility for interacting with the Google Civic Information API.
 * This utility is designed for server-side use to securely manage API keys.
 */

const GOOGLE_CIVIC_API_KEY = process.env.GOOGLE_CIVIC_API_KEY;
const BASE_URL = 'https://www.googleapis.com/civicinfo/v2';

/**
 * Fetches voter information for a specific address.
 * Includes polling places, early vote sites, and ballot information.
 */
export async function queryVoterInfo(address: string, electionId?: string) {
  if (!GOOGLE_CIVIC_API_KEY) {
    console.error('GOOGLE_CIVIC_API_KEY is not defined');
    return null;
  }

  const url = new URL(`${BASE_URL}/voterinfo`);
  url.searchParams.append('key', GOOGLE_CIVIC_API_KEY);
  url.searchParams.append('address', address);
  if (electionId) {
    url.searchParams.append('electionId', electionId);
  }

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Civic API Error (voterInfo):', errorData);
      return null;
    }
    const data = await response.json();
    
    // NIST Aligned Data Minimization: We return the data but do not store it.
    // The calling function must handle the data and discard it after use.
    return data;
  } catch (error) {
    console.error('Fetch error (voterInfo):', error);
    return null;
  }
}

/**
 * Fetches representative information by address.
 * Useful for finding local, state, and federal officials.
 */
export async function queryRepresentatives(address: string) {
  if (!GOOGLE_CIVIC_API_KEY) {
    console.error('GOOGLE_CIVIC_API_KEY is not defined');
    return null;
  }

  const url = new URL(`${BASE_URL}/representatives`);
  url.searchParams.append('key', GOOGLE_CIVIC_API_KEY);
  url.searchParams.append('address', address);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Civic API Error (representatives):', errorData);
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error (representatives):', error);
    return null;
  }
}
