import { normalizeLocationQuery, isLocationLikeQuery } from '../lib/locationIntelligence';

describe('Location Intelligence', () => {
  it('normalizes common misspellings and aliases', () => {
    expect(normalizeLocationQuery('kolkate')).toMatchObject({ city: 'Kolkata', state: 'West Bengal', country: 'IN' });
    expect(normalizeLocationQuery('mum')).toMatchObject({ city: 'Mumbai', state: 'Maharashtra', country: 'IN' });
    expect(normalizeLocationQuery('calcutta')).toMatchObject({ city: 'Kolkata', state: 'West Bengal', country: 'IN' });
    expect(normalizeLocationQuery('blr')).toMatchObject({ city: 'Bengaluru', state: 'Karnataka', country: 'IN' });
    expect(normalizeLocationQuery('nyc')).toMatchObject({ city: 'New York City', state: 'New York', country: 'US' });
  });

  it('detects location-like queries', () => {
    expect(isLocationLikeQuery('kolkate')).toBe(true);
    expect(isLocationLikeQuery('london')).toBe(true);
    expect(isLocationLikeQuery('how do I vote?')).toBe(false);
  });

  it('returns null for unknown locations', () => {
    expect(normalizeLocationQuery('unknown_place')).toBeNull();
  });
});
