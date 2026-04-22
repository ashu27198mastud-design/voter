import { logger } from '../lib/logger';

export interface VoterInfoResponse {
  election: { name: string; electionDay: string };
  pollingLocations?: Array<{ address: { line1: string; city: string; state: string } }>;
  state?: Array<{ electionAdministrationBody: { electionInfoUrl?: string; registrationInfoUrl?: string } }>;
}

/**
 * Service for interacting with Google Civic Information API via server proxy.
 */
export async function fetchVoterInfo(address: string): Promise<VoterInfoResponse | null> {
  try {
    const response = await fetch(`/api/civic?address=${encodeURIComponent(address)}&type=voter`);
    if (!response.ok) throw new Error(`Civic API error: ${response.status}`);
    return await response.json();
  } catch (error) {
    logger.error('Failed to fetch voter info', { address, error });
    return null;
  }
}

export async function fetchRepresentatives(address: string): Promise<any | null> {
  try {
    const response = await fetch(`/api/civic?address=${encodeURIComponent(address)}&type=reps`);
    if (!response.ok) throw new Error(`Civic API error: ${response.status}`);
    return await response.json();
  } catch (error) {
    logger.error('Failed to fetch representatives', { address, error });
    return null;
  }
}
