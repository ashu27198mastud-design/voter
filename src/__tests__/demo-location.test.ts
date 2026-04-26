import { normalizeLocationQuery } from '../lib/locationIntelligence';

describe('Demo Local Resolution', () => {
  const cities = [
    { input: 'delhi', expectedCity: 'New Delhi', expectedState: 'Delhi' },
    { input: 'mumbai', expectedCity: 'Mumbai', expectedState: 'Maharashtra' },
    { input: 'chennai', expectedCity: 'Chennai', expectedState: 'Tamil Nadu' },
    { input: 'kolkate', expectedCity: 'Kolkata', expectedState: 'West Bengal' },
    { input: '110001', expectedCity: 'New Delhi', expectedState: 'Delhi' },
    { input: '400067', expectedCity: 'Mumbai', expectedState: 'Maharashtra' },
  ];

  cities.forEach(({ input, expectedCity, expectedState }) => {
    it(`resolves "${input}" to ${expectedCity}, ${expectedState}`, () => {
      const result = normalizeLocationQuery(input);
      expect(result).toMatchObject({
        city: expectedCity,
        state: expectedState,
        country: 'IN'
      });
    });
  });
});
