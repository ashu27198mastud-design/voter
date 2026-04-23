import { logger } from '../lib/logger';

/**
 * RULE 1 - Google Civic Information API Integration:
 * Dedicated server-side utility to handle requests to the Google Civic Information API.
 * Securely uses process.env.GOOGLE_CIVIC_API_KEY.
 */

const GOOGLE_CIVIC_API_URL = 'https://www.googleapis.com/civicinfo/v2';

export interface CivicVoterInfoResponse {
  election?: { name: string; electionDay: string };
  pollingLocations?: Array<{ address: { line1: string; city: string; state: string; zip: string } }>;
  state?: Array<{
    electionAdministrationBody: {
      electionInfoUrl?: string;
      registrationInfoUrl?: string;
    };
  }>;
}

export interface CivicRepresentativesResponse {
  offices?: Array<{
    name: string;
    divisionId?: string;
    officialIndices?: number[];
  }>;
  officials?: Array<{
    name: string;
    party?: string;
    phones?: string[];
    urls?: string[];
  }>;
}

/**
 * Fetches voter information (polling places, election dates) for a given address.
 * DATA MINIMIZATION: Address is used only for the request and never stored.
 */
export async function queryVoterInfo(address: string): Promise<CivicVoterInfoResponse | null> {
  const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
  if (!apiKey) {
    logger.error('GOOGLE_CIVIC_API_KEY is missing');
    return null;
  }

  try {
    const url = `${GOOGLE_CIVIC_API_URL}/voterinfo?key=${apiKey}&address=${encodeURIComponent(address)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 400) {
        logger.info('Civic API: No data for address', { address });
        return null;
      }
      throw new Error(`Civic API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Failed to query voter info', { error });
    return null;
  }
}

/**
 * Fetches representative information for a given address.
 * DATA MINIMIZATION: Address is discarded immediately after the request.
 */
export async function queryRepresentatives(address: string): Promise<CivicRepresentativesResponse | null> {
  const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `${GOOGLE_CIVIC_API_URL}/representatives?key=${apiKey}&address=${encodeURIComponent(address)}`;
    const response = await fetch(url);
    
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    logger.error('Failed to query representatives', { error });
    return null;
  }
}
