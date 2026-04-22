import { logger } from '../lib/logger';
import { sanitizeHtml } from '../lib/security';

/**
 * Service for interacting with the Gemini AI assistant.
 * Handles the logic for sending queries to the server-side API proxy.
 */
export async function askElectionQuestion(query: string, location: any = null): Promise<string> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, location }),
    });

    if (!response.ok) {
      throw new Error(`AI Service Error: ${response.status}`);
    }

    const data = await response.json();
    return sanitizeHtml(data.response);
  } catch (error: any) {
    logger.error('Failed to get AI response', { query, error: error.message });
    return "The VotePath Assistant is temporarily offline. Please follow the steps in your personalized roadmap.";
  }
}
