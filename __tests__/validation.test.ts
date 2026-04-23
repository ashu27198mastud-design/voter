import { LocationSchema, QuerySchema } from '@/lib/validation';

describe('Validation schemas', () => {
  it('accepts valid location input', () => {
    const result = LocationSchema.safeParse({
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid city characters', () => {
    const result = LocationSchema.safeParse({
      city: '<script>alert(1)</script>',
      state: 'Maharashtra',
      country: 'India',
    });

    expect(result.success).toBe(false);
  });

  it('accepts valid election query', () => {
    const result = QuerySchema.safeParse({
      query: 'How do I register to vote in Mumbai?',
    });

    expect(result.success).toBe(true);
  });

  it('rejects dangerous query input', () => {
    const result = QuerySchema.safeParse({
      query: '<script>alert(1)</script>',
    });

    expect(result.success).toBe(false);
  });

  it('rejects overly long query input', () => {
    const result = QuerySchema.safeParse({
      query: 'a'.repeat(501),
    });

    expect(result.success).toBe(false);
  });
});
