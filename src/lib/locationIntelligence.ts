/**
 * Location Intelligence Utility
 * Provides normalization and detection for common location aliases and misspellings.
 */

interface NormalizedLocation {
  city: string;
  state: string;
  country: string;
}

const LOCATION_ALIASES: Record<string, NormalizedLocation> = {
  // India
  "kolkate": { city: "Kolkata", state: "West Bengal", country: "IN" },
  "kol": { city: "Kolkata", state: "West Bengal", country: "IN" },
  "calcutta": { city: "Kolkata", state: "West Bengal", country: "IN" },
  "mum": { city: "Mumbai", state: "Maharashtra", country: "IN" },
  "bombay": { city: "Mumbai", state: "Maharashtra", country: "IN" },
  "mumbai": { city: "Mumbai", state: "Maharashtra", country: "IN" },
  "blr": { city: "Bengaluru", state: "Karnataka", country: "IN" },
  "bangalore": { city: "Bengaluru", state: "Karnataka", country: "IN" },
  "bengaluru": { city: "Bengaluru", state: "Karnataka", country: "IN" },
  "delhi": { city: "New Delhi", state: "Delhi", country: "IN" },
  "ndl": { city: "New Delhi", state: "Delhi", country: "IN" },
  "pune": { city: "Pune", state: "Maharashtra", country: "IN" },
  "pun": { city: "Pune", state: "Maharashtra", country: "IN" },
  
  // UK
  "london": { city: "London", state: "England", country: "GB" },
  "lon": { city: "London", state: "England", country: "GB" },
  
  // US
  "nyc": { city: "New York City", state: "New York", country: "US" },
  "new york": { city: "New York City", state: "New York", country: "US" },
  "ny": { city: "New York City", state: "New York", country: "US" },
  "sf": { city: "San Francisco", state: "California", country: "US" },
  "la": { city: "Los Angeles", state: "California", country: "US" },
};

/**
 * Normalizes a location query into a structured object if it matches a known alias.
 */
export function normalizeLocationQuery(input: string): NormalizedLocation | null {
  const normalized = input.toLowerCase().trim();
  return LOCATION_ALIASES[normalized] || null;
}

/**
 * Detects if a query is purely a location-like phrase.
 */
export function isLocationLikeQuery(input: string): boolean {
  const normalized = input.toLowerCase().trim();
  return !!LOCATION_ALIASES[normalized];
}
