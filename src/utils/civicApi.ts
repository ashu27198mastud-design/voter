import { logger } from '@/lib/logger';

const API_KEY = process.env.GOOGLE_CIVIC_API_KEY;
const BASE_URL = 'https://www.googleapis.com/civicinfo/v2';

if (!API_KEY) {
  logger.warn('GOOGLE_CIVIC_API_KEY is not defined in environment variables.');
}

/**
 * Fetches voter information (polling places, contests, etc.) for a specific address.
 * Corresponds to the voterInfoQuery endpoint.
 * @param address The voter's registered address.
 * @param electionId Optional election ID. Defaults to the latest/upcoming.
 */
export async function voterInfoQuery(address: string, electionId?: string) {
  if (!API_KEY) return null;
  try {
    const url = new URL(`${BASE_URL}/voterinfo`);
    url.searchParams.append('key', API_KEY || '');
    url.searchParams.append('address', address);
    if (electionId) {
      url.searchParams.append('electionId', electionId);
    }

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 } // Deep caching: 1 hour revalidation
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('Error fetching voter info', { error: errorData || response.statusText, address });
      return null;
    }
    return await response.json();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error fetching voter info', { error: message, address });
    return null;
  }
}

/**
 * Fetches representative information for a specific address.
 * Corresponds to the representativesInfoByAddress endpoint.
 * @param address The address to lookup.
 * @param levels Optional levels to filter by.
 * @param roles Optional roles to filter by.
 */
export async function representativesInfoByAddress(
  address: string, 
  levels?: string[], 
  roles?: string[]
) {
  if (!API_KEY) return null;
  try {
    const url = new URL(`${BASE_URL}/representatives`);
    url.searchParams.append('key', API_KEY);
    url.searchParams.append('address', address);
    
    if (levels) {
      levels.forEach(level => url.searchParams.append('levels', level));
    }
    if (roles) {
      roles.forEach(role => url.searchParams.append('roles', role));
    }

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 } // Deep caching: 1 hour revalidation
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('Error fetching representative info', { error: errorData || response.statusText, address });
      return null;
    }
    return await response.json();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error fetching representative info', { error: message, address });
    return null;
  }
}

// Aliases for compatibility with existing API routes
export const queryVoterInfo = voterInfoQuery;
export const queryRepresentatives = representativesInfoByAddress;
