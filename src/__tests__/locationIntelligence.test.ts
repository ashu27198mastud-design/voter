import { normalizeLocationQuery, isLocationLikeQuery, getPredictiveLocationSuggestions } from '../lib/locationIntelligence';

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

  it('normalizes major international and national cities', () => {
    expect(normalizeLocationQuery('hyderabad')).toMatchObject({ city: 'Hyderabad', state: 'Telangana', country: 'IN' });
    expect(normalizeLocationQuery('chennai')).toMatchObject({ city: 'Chennai', state: 'Tamil Nadu', country: 'IN' });
    expect(normalizeLocationQuery('sydney')).toMatchObject({ city: 'Sydney', state: 'NSW', country: 'AU' });
  });

  it('expands country level queries into major cities', () => {
    const auCities = getPredictiveLocationSuggestions('aus').map(s => s.city);
    expect(auCities).toEqual(expect.arrayContaining(['Sydney', 'Melbourne']));

    const inCities = getPredictiveLocationSuggestions('ind').map(s => s.city);
    expect(inCities).toEqual(expect.arrayContaining(['New Delhi', 'Mumbai', 'Kolkata']));

    const ukCities = getPredictiveLocationSuggestions('uk').map(s => s.city);
    expect(ukCities).toEqual(expect.arrayContaining(['London']));

    const caCities = getPredictiveLocationSuggestions('can').map(s => s.city);
    expect(caCities).toEqual(expect.arrayContaining(['Ottawa', 'Toronto']));
  });

  it('handles pincodes and multi-match aliases', () => {
    expect(normalizeLocationQuery('400067')).toMatchObject({ city: 'Mumbai' });
    expect(normalizeLocationQuery('new')).toMatchObject({ city: 'New Delhi' }); // Prioritize national capital
  });

  it('extracts location intent from full questions', () => {
    const { extractLocationIntent } = require('../lib/locationIntelligence');
    expect(extractLocationIntent('voting date in sydney')).toMatchObject({ city: 'Sydney' });
    expect(extractLocationIntent('how to register in london')).toMatchObject({ city: 'London' });
  });
});
