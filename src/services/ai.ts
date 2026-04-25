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
      
      return "I’m having trouble reaching the AI service right now, but I can still help with election-process guidance. Please verify live dates, voter status, and polling booth details with your official election authority.";
    }

    const data = await response.json();
    return sanitizeHtml(data.response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Failed to get AI response', { query, error: message });
    
    return "I’m having trouble reaching the AI service right now, but I can still help with election-process guidance. Please verify live dates, voter status, and polling booth details with your official election authority.";
  }
}
