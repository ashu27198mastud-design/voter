import { logger } from '@/lib/logger';

const GOOGLE_CIVIC_API_KEY = process.env.CIVIC_API_KEY || process.env.GOOGLE_CIVIC_API_KEY;
const BASE_URL = 'https://www.googleapis.com/civicinfo/v2';

/**
 * Fetches voter information for a specific address.
 */
export async function queryVoterInfo(address: string, electionId?: string) {
  if (!GOOGLE_CIVIC_API_KEY) {
    logger.error('GOOGLE_CIVIC_API_KEY is not defined in environment');
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
      logger.error('Google Civic API Error (voterInfo)', { error: errorData });
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Fetch error (voterInfo)', { error: String(error) });
    return null;
  }
}

/**
 * Fetches representative information by address.
 */
export async function queryRepresentatives(address: string) {
  if (!GOOGLE_CIVIC_API_KEY) {
    logger.error('GOOGLE_CIVIC_API_KEY is not defined in environment');
    return null;
  }

  const url = new URL(`${BASE_URL}/representatives`);
  url.searchParams.append('key', GOOGLE_CIVIC_API_KEY);
  url.searchParams.append('address', address);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      const errorData = await response.json();
      logger.error('Google Civic API Error (representatives)', { error: errorData });
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Fetch error (representatives)', { error: String(error) });
    return null;
  }
}
