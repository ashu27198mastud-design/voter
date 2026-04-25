import { logger } from '../lib/logger';
import { sanitizeHtml } from '../lib/security';
import type { UserLocation } from '../types';

/**
 * Service for interacting with the Gemini AI assistant.
 * Handles the logic for sending queries to the server-side API proxy.
 */
export async function askElectionQuestion(
  query: string,
  location?: UserLocation
): Promise<string> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, location: location ?? null }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.response) return sanitizeHtml(errorData.response);
      
      return `
**Direct answer**
I can still help with election-process guidance for your selected region.

**Key information**
Please verify your voter registration, required documents, polling booth, and official election dates through the relevant election authority.

**What you should do next**
Check your voter status, confirm your polling booth, and keep an approved photo ID ready before election day.

**Verification note**
Live dates, voter status, and polling booth details must be verified with the official election authority.
`.trim();
    }

    const data = await response.json();
    return sanitizeHtml(data.response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Failed to get AI response', { query, error: message });
    
    return `
**Direct answer**
I can still help with election-process guidance for your selected region.

**Key information**
Please verify your voter registration, required documents, polling booth, and official election dates through the relevant election authority.

**What you should do next**
Check your voter status, confirm your polling booth, and keep an approved photo ID ready before election day.

**Verification note**
Live dates, voter status, and polling booth details must be verified with the official election authority.
`.trim();
  }
}
