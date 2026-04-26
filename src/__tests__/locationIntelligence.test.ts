import { normalizeLocationQuery, isLocationLikeQuery, getPredictiveLocationSuggestions } from '../lib/locationIntelligence';

describe('Location Intelligence', () => {
  it('normalizes common misspellings and aliases', () => {
    expect(normalizeLocationQuery('kolkate')).toMatchObject({ city: 'Kolkata', state: 'WB', country: 'IN' });
    expect(normalizeLocationQuery('mum')).toMatchObject({ city: 'Mumbai', state: 'MH', country: 'IN' });
    expect(normalizeLocationQuery('calcutta')).toMatchObject({ city: 'Kolkata', state: 'WB', country: 'IN' });
    expect(normalizeLocationQuery('blr')).toMatchObject({ city: 'Bengaluru', state: 'KA', country: 'IN' });
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
    expect(normalizeLocationQuery('hyderabad')).toMatchObject({ city: 'Hyderabad', state: 'TG', country: 'IN' });
    expect(normalizeLocationQuery('chennai')).toMatchObject({ city: 'Chennai', state: 'TN', country: 'IN' });
    expect(normalizeLocationQuery('sydney')).toMatchObject({ city: 'Sydney', state: 'NSW', country: 'AU' });
  });

  it('expands country level queries into major cities', () => {
    const auCities = getPredictiveLocationSuggestions('australia').map(s => s.city);
    expect(auCities).toEqual(expect.arrayContaining(['Sydney', 'Melbourne']));

    const inCities = getPredictiveLocationSuggestions('india').map(s => s.city);
    expect(inCities).toEqual(expect.arrayContaining(['New Delhi', 'Mumbai', 'Kolkata']));
  });
});
