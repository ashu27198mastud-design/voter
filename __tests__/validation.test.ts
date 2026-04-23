import { LocationSchema, QuerySchema, ElectionStepEnum } from '@/lib/validation';

describe('Validation Schemas', () => {
  describe('LocationSchema', () => {
    it('validates a correct US location', () => {
      const valid = { city: 'New York', state: 'NY', country: 'USA' };
      expect(LocationSchema.safeParse(valid).success).toBe(true);
    });

    it('validates Indian location with Devanagari characters', () => {
      const valid = { city: 'मुंबई', state: 'Maharashtra', country: 'India' };
      expect(LocationSchema.safeParse(valid).success).toBe(true);
    });

    it('validates accented characters (French)', () => {
      const valid = { city: 'Montréal', state: 'Québec', country: 'Canada' };
      expect(LocationSchema.safeParse(valid).success).toBe(true);
    });

    it('fails on empty city', () => {
      const invalid = { city: '', state: 'NY', country: 'USA' };
      expect(LocationSchema.safeParse(invalid).success).toBe(false);
    });

    it('fails on script tags in city', () => {
      const invalid = { city: '<script>alert(1)</script>', state: 'NY', country: 'USA' };
      expect(LocationSchema.safeParse(invalid).success).toBe(false);
    });

    it('fails on too long city', () => {
      const invalid = { city: 'a'.repeat(101), state: 'NY', country: 'USA' };
      expect(LocationSchema.safeParse(invalid).success).toBe(false);
    });

    it('fails on invalid country characters', () => {
      const invalid = { city: 'NYC', state: 'NY', country: 'USA123' };
      expect(LocationSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('QuerySchema', () => {
    it('validates a simple query', () => {
      expect(QuerySchema.safeParse({ query: 'How do I vote?' }).success).toBe(true);
    });

    it('fails on empty query', () => {
      expect(QuerySchema.safeParse({ query: '' }).success).toBe(false);
    });

    it('fails on query too long', () => {
      expect(QuerySchema.safeParse({ query: 'a'.repeat(501) }).success).toBe(false);
    });

    it('blocks script tags in query', () => {
      expect(QuerySchema.safeParse({ query: 'Is this <script> safe?' }).success).toBe(false);
      expect(QuerySchema.safeParse({ query: 'What about <iframe>?' }).success).toBe(false);
    });
  });

  describe('ElectionStepEnum', () => {
    it('validates all enum values', () => {
      expect(ElectionStepEnum.safeParse('REGISTRATION').success).toBe(true);
      expect(ElectionStepEnum.safeParse('PREPARATION').success).toBe(true);
      expect(ElectionStepEnum.safeParse('VOTING').success).toBe(true);
      expect(ElectionStepEnum.safeParse('POST_ELECTION').success).toBe(true);
    });

    it('fails on invalid enum value', () => {
      expect(ElectionStepEnum.safeParse('INVALID').success).toBe(false);
    });
  });
});
