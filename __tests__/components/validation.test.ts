import { LocationSchema, QuerySchema } from '../../src/lib/validation';

describe('Validation Schemas', () => {
  it('validates a standard US city correctly', () => {
    expect(() =>
      LocationSchema.parse({ city: 'San Francisco', state: 'CA', country: 'US' })
    ).not.toThrow();
  });

  it('validates an Indian postal code as city', () => {
    // Postal codes like 400067 must now pass (Mumbai zip code)
    expect(() =>
      LocationSchema.parse({ city: '400067', state: 'Maharashtra', country: 'IN' })
    ).not.toThrow();
  });

  it('validates international city names with special characters', () => {
    expect(() =>
      LocationSchema.parse({ city: 'São Paulo', state: 'SP', country: 'BR' })
    ).not.toThrow();
  });

  it('rejects a location with missing state field', () => {
    expect(() =>
      LocationSchema.parse({ city: 'San Francisco', country: 'US' })
    ).toThrow();
  });

  it('rejects injection characters in country field', () => {
    expect(() =>
      LocationSchema.parse({ city: 'Berlin', state: 'BE', country: '<script>' })
    ).toThrow();
  });

  it('rejects malicious characters in AI query', () => {
    const invalidInput = { query: '<script>alert("xss")</script>' };
    expect(() => QuerySchema.parse(invalidInput)).toThrow();
  });

  it('accepts a normal election question', () => {
    expect(() =>
      QuerySchema.parse({ query: 'How do I register to vote in California?' })
    ).not.toThrow();
  });
});
