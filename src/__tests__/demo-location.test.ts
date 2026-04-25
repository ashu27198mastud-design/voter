import { normalizeLocationQuery } from '../lib/locationIntelligence';

describe('Demo Local Resolution', () => {
  const cities = [
    { input: 'delhi', expectedCity: 'New Delhi', expectedState: 'DL' },
    { input: 'mumbai', expectedCity: 'Mumbai', expectedState: 'MH' },
    { input: 'chennai', expectedCity: 'Chennai', expectedState: 'TN' },
    { input: 'kolkate', expectedCity: 'Kolkata', expectedState: 'WB' },
    { input: '110001', expectedCity: 'New Delhi', expectedState: 'DL' },
    { input: '400067', expectedCity: 'Mumbai', expectedState: 'MH' },
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
