import { z } from 'zod';

const CIVIC_API_BASE_URL = 'https://www.googleapis.com/civicinfo/v2';

export const VoterInfoSchema = z.object({
  address: z.string(),
  electionId: z.string().optional(),
});

export const RepresentativeSchema = z.object({
  address: z.string(),
  levels: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional(),
});

export async function queryVoterInfo(address: string, electionId?: string) {
  const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_CIVIC_API_KEY is not defined');
    return null;
  }

  const url = new URL(`${CIVIC_API_BASE_URL}/voterinfo`);
  url.searchParams.append('key', apiKey);
  url.searchParams.append('address', address);
  if (electionId) {
    url.searchParams.append('electionId', electionId);
  }

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Civic API Error:', errorData);
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching voter info:', error);
    return null;
  }
}

export async function queryRepresentatives(address: string, levels?: string[], roles?: string[]) {
  const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_CIVIC_API_KEY is not defined');
    return null;
  }

  const url = new URL(`${CIVIC_API_BASE_URL}/representatives`);
  url.searchParams.append('key', apiKey);
  url.searchParams.append('address', address);
  if (levels) {
    levels.forEach(level => url.searchParams.append('levels', level));
  }
  if (roles) {
    roles.forEach(role => url.searchParams.append('roles', role));
  }

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Civic API Error:', errorData);
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching representative info:', error);
    return null;
  }
}
