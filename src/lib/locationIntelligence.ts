export interface LocationResult {
  city: string;
  state: string;
  country: string;
  formattedAddress: string;
  confidence: "high" | "medium" | "low";
  source: "alias" | "postal" | "heuristic";
}

const CITY_ALIASES: Record<string, Omit<LocationResult, "confidence" | "source" | "formattedAddress">> = {
  "delhi": { city: "New Delhi", state: "DL", country: "IN" },
  "new delhi": { city: "New Delhi", state: "DL", country: "IN" },
  "ndl": { city: "New Delhi", state: "DL", country: "IN" },
  "mumbai": { city: "Mumbai", state: "MH", country: "IN" },
  "mum": { city: "Mumbai", state: "MH", country: "IN" },
  "bombay": { city: "Mumbai", state: "MH", country: "IN" },
  "kolkata": { city: "Kolkata", state: "WB", country: "IN" },
  "kolkate": { city: "Kolkata", state: "WB", country: "IN" },
  "calcutta": { city: "Kolkata", state: "WB", country: "IN" },
  "kol": { city: "Kolkata", state: "WB", country: "IN" },
  "bengaluru": { city: "Bengaluru", state: "KA", country: "IN" },
  "bangalore": { city: "Bengaluru", state: "KA", country: "IN" },
  "blr": { city: "Bengaluru", state: "KA", country: "IN" },
  "pune": { city: "Pune", state: "MH", country: "IN" },
  "chennai": { city: "Chennai", state: "TN", country: "IN" },
  "madras": { city: "Chennai", state: "TN", country: "IN" },
  "hyderabad": { city: "Hyderabad", state: "TG", country: "IN" },
  "ahmedabad": { city: "Ahmedabad", state: "GJ", country: "IN" },
  "jaipur": { city: "Jaipur", state: "RJ", country: "IN" },
  "lucknow": { city: "Lucknow", state: "UP", country: "IN" },
  "london": { city: "London", state: "England", country: "GB" },
  "nyc": { city: "New York City", state: "New York", country: "US" },
  "new york": { city: "New York City", state: "New York", country: "US" },
  "california": { city: "Sacramento", state: "CA", country: "US" },
  "sf": { city: "San Francisco", state: "CA", country: "US" },
  "la": { city: "Los Angeles", state: "CA", country: "US" },
  "chi": { city: "Chicago", state: "IL", country: "US" },
  "bos": { city: "Boston", state: "MA", country: "US" },
  "sea": { city: "Seattle", state: "WA", country: "US" },
  "dc": { city: "Washington", state: "DC", country: "US" },
  "toronto": { city: "Toronto", state: "ON", country: "CA" },
  "vancouver": { city: "Vancouver", state: "BC", country: "CA" },
  "sydney": { city: "Sydney", state: "NSW", country: "AU" },
  "melbourne": { city: "Melbourne", state: "VIC", country: "AU" },
  "berlin": { city: "Berlin", state: "Berlin", country: "DE" },
  "paris": { city: "Paris", state: "IDF", country: "FR" },
  "tokyo": { city: "Tokyo", state: "Tokyo", country: "JP" },
  "singapore": { city: "Singapore", state: "Singapore", country: "SG" },
  "dubai": { city: "Dubai", state: "Dubai", country: "AE" },
  "cape town": { city: "Cape Town", state: "WC", country: "ZA" },
  "jhb": { city: "Johannesburg", state: "GP", country: "ZA" },
};

const PIN_CODE_MAP: Record<string, Omit<LocationResult, "confidence" | "source" | "formattedAddress">> = {
  "400067": { city: "Mumbai", state: "MH", country: "IN" },
  "110001": { city: "New Delhi", state: "DL", country: "IN" },
};

export function normalizeLocationQuery(input: string): LocationResult | null {
  const cleanInput = input.trim().toLowerCase();

  // 1. Check PIN Codes (Indian 6-digit)
  const pinMatch = cleanInput.match(/\b\d{6}\b/);
  if (pinMatch) {
    const pin = pinMatch[0];
    const mapped = PIN_CODE_MAP[pin];
    if (mapped) {
      return {
        ...mapped,
        formattedAddress: `${mapped.city}, ${mapped.state}, ${mapped.country}`,
        confidence: "high",
        source: "postal",
      };
    }
    return {
      city: pin,
      state: "Unknown",
      country: "IN",
      formattedAddress: `${pin}, India`,
      confidence: "low",
      source: "postal",
    };
  }

  // 2. Check Aliases
  if (CITY_ALIASES[cleanInput]) {
    const mapped = CITY_ALIASES[cleanInput];
    return {
      ...mapped,
      formattedAddress: `${mapped.city}, ${mapped.state}, ${mapped.country}`,
      confidence: "high",
      source: "alias",
    };
  }

  // 3. Check for city-like text (simple heuristic)
  if (cleanInput.length >= 3 && /^[a-z\s]+$/.test(cleanInput)) {
    // Try to find a partial match in aliases
    const aliasKey = Object.keys(CITY_ALIASES).find(key => key.includes(cleanInput) || cleanInput.includes(key));
    if (aliasKey) {
       const mapped = CITY_ALIASES[aliasKey];
       return {
         ...mapped,
         formattedAddress: `${mapped.city}, ${mapped.state}, ${mapped.country}`,
         confidence: "medium",
         source: "alias",
       };
    }
  }

  return null;
}

export function isLocationLikeQuery(input: string): boolean {
  const cleanInput = input.trim().toLowerCase();
  
  // PIN code check
  if (/\b\d{6}\b/.test(cleanInput)) return true;
  
  // Alias check
  if (CITY_ALIASES[cleanInput]) return true;
  
  // Common location markers
  const markers = ["in ", "at ", "near ", "polling", "voter", "status"];
  if (markers.some(m => cleanInput.includes(m)) && cleanInput.length < 50) {
    return true;
  }

  return false;
}

export function extractLocationIntent(input: string): LocationResult | null {
  const cleanInput = input.toLowerCase();

  // Try to find a city or PIN in the query
  const words = cleanInput.split(/\s+|,/);
  for (const word of words) {
    const normalized = normalizeLocationQuery(word);
    if (normalized) return normalized;
  }

  // Try multi-word aliases
  for (const alias of Object.keys(CITY_ALIASES)) {
    if (alias.includes(" ") && cleanInput.includes(alias)) {
      return normalizeLocationQuery(alias);
    }
  }

  return null;
}
