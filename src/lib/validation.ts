import { z } from 'zod';

/**
 * RULE 2 - INPUT VALIDATION (Zod):
 * Define strict schemas for all user inputs to prevent injection and ensure data integrity.
 */

// Regex that allows:
//   - Basic ASCII letters and digits
//   - Common punctuation used in place names: space, hyphen, period, comma, apostrophe
//   - Extended Latin (accented chars) U+00C0–U+024F: é, ñ, ü, ã etc.
const PLACE_NAME_REGEX = /^[a-zA-Z0-9\u00C0-\u024F\s\-.,'\u0900-\u097F]+$/;

// Schema for location input (city, state, country)
export const LocationSchema = z.object({
  city: z
    .string()
    .min(1, 'City is required')
    .max(100)
    .regex(PLACE_NAME_REGEX, 'Invalid characters in city name'),
  state: z
    .string()
    .min(1, 'State is required')
    .max(100)
    .regex(PLACE_NAME_REGEX, 'Invalid characters in state name'),
  country: z
    .string()
    .min(1, 'Country is required')
    .max(50)
    .regex(/^[a-zA-Z\s\-]+$/, 'Invalid characters in country name'),
  formattedAddress: z.string().optional(),
});

export type UserLocation = z.infer<typeof LocationSchema>;

// Schema for AI queries
export const QuerySchema = z.object({
  query: z
    .string()
    .min(1, 'Question cannot be empty')
    .max(500, 'Question is too long (max 500 characters)')
    .refine(
      val => !/<script>|<\/script>|<iframe|<\/iframe>|<object|<\/object>/.test(val),
      { message: 'Invalid characters in query' }
    ),
});

export type UserQuery = z.infer<typeof QuerySchema>;

// Enum schema for election steps
export const ElectionStepEnum = z.enum([
  'REGISTRATION',
  'PREPARATION',
  'VOTING',
  'POST_ELECTION',
]);

export const StepSchema = z.object({
  step: ElectionStepEnum,
});

export type ElectionStep = z.infer<typeof StepSchema>;
