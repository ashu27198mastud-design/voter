import { getElectionAuthorityGuidance } from '../lib/electionAuthority';
import { UserLocation } from '../types';

describe('AI Fallback Guidance', () => {
  it('returns generic guidance when no location is provided', () => {
    const result = getElectionAuthorityGuidance(null);
    expect(result.authority).toBe('your local election authority');
    // Ensure no technical error language
    const allText = JSON.stringify(result);
    expect(allText).not.toMatch(/technical issue|AI Service Error|service interruption|Gemini failed/i);
  });

  it('returns specific guidance for Australia', () => {
    const location: UserLocation = { city: 'Sydney', state: 'NSW', country: 'AU' };
    const result = getElectionAuthorityGuidance(location);
    expect(result.authority).toContain('Australian Electoral Commission');
  });

  it('returns specific guidance for India', () => {
    const location: UserLocation = { city: 'New Delhi', state: 'DL', country: 'IN' };
    const result = getElectionAuthorityGuidance(location);
    expect(result.authority).toContain('Election Commission of India');
  });

  it('includes resolved location when provided', () => {
    const location: UserLocation = { city: 'Mumbai', state: 'MH', country: 'IN' };
    const result = getElectionAuthorityGuidance(location);
    expect(result.authority).toContain('Maharashtra');
    expect(result.authority).toContain('Election Commission of India');
  });
});
