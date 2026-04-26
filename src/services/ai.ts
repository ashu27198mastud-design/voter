import { logger } from '../lib/logger';
import type { UserLocation } from '../types';
import { getElectionAuthorityGuidance } from '../lib/electionAuthority';

export interface AIResponse {
  response: string;
  grounded: boolean;
}

/**
 * Service for interacting with the Gemini AI assistant.
 * Handles the logic for sending queries to the server-side API proxy.
 */
export async function askElectionQuestion(
  query: string,
  location?: UserLocation
): Promise<AIResponse> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, location: location ?? null }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.response) return { response: errorData.response, grounded: errorData.grounded ?? false };
      
      const guidance = getElectionAuthorityGuidance(location);
      return {
        grounded: false,
        response: `
<strong>Direct answer</strong><br />
I can still help with election-process guidance for ${location ? `${location.city}, ${location.state}, ${location.country}` : 'your selected region'}.
<br /><br />
<strong>Key information</strong>
<ul>
${guidance.keyInfo.map(info => `<li>${info}</li>`).join('')}
</ul>
<br />
<strong>What you should do next</strong>
<ol>
${guidance.nextSteps.map(step => `<li>${step}</li>`).join('')}
</ol>
<br />
<strong>Sources / verification</strong><br />
<p>${guidance.verificationNote}</p>
      `.trim()
      };
    }

    const data = await response.json();
    return {
      response: data.response,
      grounded: data.grounded ?? false
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Failed to get AI response', { query, error: message });
    
    const guidance = getElectionAuthorityGuidance(location);
    return {
      grounded: false,
      response: `
<strong>Direct answer</strong><br />
I can still help with election-process guidance for ${location ? `${location.city}, ${location.state}, ${location.country}` : 'your selected region'}.
<br /><br />
<strong>Key information</strong>
<ul>
${guidance.keyInfo.map(info => `<li>${info}</li>`).join('')}
</ul>
<br />
<strong>What you should do next</strong>
<ol>
${guidance.nextSteps.map(step => `<li>${step}</li>`).join('')}
</ol>
<br />
<strong>Sources / verification</strong><br />
<p>${guidance.verificationNote}</p>
    `.trim()
    };
  }
}
