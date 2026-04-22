/**
 * Utility functions for interacting with the Google Civic Information API.
 */

// Define interfaces for the expected API responses
export interface CivicElection {
  id: string;
  name: string;
  electionDay: string;
  ocdDivisionId: string;
}

export interface PollingLocation {
  address: {
    locationName: string;
    line1: string;
    city: string;
    state: string;
    zip: string;
  };
  pollingHours: string;
  startDate: string;
  endDate: string;
}

export interface VoterInfoResponse {
  election: CivicElection;
  pollingLocations?: PollingLocation[];
  earlyVoteSites?: PollingLocation[];
  dropOffLocations?: PollingLocation[];
}

export interface Official {
  name: string;
  party?: string;
  phones?: string[];
  urls?: string[];
}

export interface Office {
  name: string;
  divisionId: string;
  levels: string[];
  roles: string[];
  officialIndices: number[];
}

export interface RepresentativesResponse {
  offices: Office[];
  officials: Official[];
}

/**
 * Fetches voter information for a given address.
 * RULE 1 (DATA MINIMIZATION): The address is passed securely and immediately discarded from memory after the API call.
 * 
 * @param address The user's formatted address.
 * @returns VoterInfoResponse or null if no data is found.
 */
export async function fetchVoterInfo(address: string): Promise<VoterInfoResponse | null> {
  const apiKey = process.env.NEXT_PUBLIC_CIVIC_API_KEY;
  if (!apiKey) {
    console.warn('Civic API key is not defined.');
    return null;
  }

  const encodedAddress = encodeURIComponent(address);
  const url = `https://www.googleapis.com/civicinfo/v2/voterinfo?address=${encodedAddress}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Gracefully return null for any error (400 = no election, 403 = quota, etc.)
      console.warn(`Voter info not available (${response.status}): ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data as VoterInfoResponse;
  } catch (error) {
    console.error('Error fetching voter info:', error);
    return null;
  }
}

/**
 * Fetches representative information for a given address.
 * RULE 1 (DATA MINIMIZATION): The address is passed securely and immediately discarded from memory after the API call.
 *
 * @param address The user's formatted address.
 * @returns RepresentativesResponse or null if no data is found.
 */
export async function fetchRepresentativesInfo(address: string): Promise<RepresentativesResponse | null> {
  const apiKey = process.env.NEXT_PUBLIC_CIVIC_API_KEY;
  if (!apiKey) {
    console.warn('Civic API key is not defined.');
    return null;
  }

  const encodedAddress = encodeURIComponent(address);
  const url = `https://www.googleapis.com/civicinfo/v2/representatives?address=${encodedAddress}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Gracefully return null for any error
      console.warn(`Representatives info not available (${response.status}): ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data as RepresentativesResponse;
  } catch (error) {
    console.error('Error fetching representatives info:', error);
    return null;
  }
}
