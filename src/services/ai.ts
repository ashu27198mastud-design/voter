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
      if (response.status === 404) {
        return "I'm currently specialized in US election procedures. While I can't find specific local data for your region yet, I can help you with general information about voting steps and civic duties. What would you like to know?";
      }
      throw new Error(`AI Service Error: ${response.status}`);
    }

    const data = await response.json();
    return sanitizeHtml(data.response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Failed to get AI response', { query, error: message });
    return 'The VotePath Assistant is currently processing a high volume of requests. Please follow the steps in your personalized roadmap below for immediate guidance.';
  }
}
