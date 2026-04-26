export interface LocationResult {
  city: string;
  state: string;
  country: string;
  formattedAddress: string;
  confidence: "high" | "medium" | "low";
  source: "alias" | "postal" | "heuristic" | "predictive";
}

const CITY_DATA: Record<string, { city: string; state: string; country: string }> = {
  "delhi": { city: "New Delhi", state: "DL", country: "IN" },
  "mumbai": { city: "Mumbai", state: "MH", country: "IN" },
  "kolkata": { city: "Kolkata", state: "WB", country: "IN" },
  "bengaluru": { city: "Bengaluru", state: "KA", country: "IN" },
  "chennai": { city: "Chennai", state: "TN", country: "IN" },
  "hyderabad": { city: "Hyderabad", state: "TG", country: "IN" },
  "pune": { city: "Pune", state: "MH", country: "IN" },
  "ahmedabad": { city: "Ahmedabad", state: "GJ", country: "IN" },
  "jaipur": { city: "Jaipur", state: "RJ", country: "IN" },
  "lucknow": { city: "Lucknow", state: "UP", country: "IN" },
  "new york": { city: "New York City", state: "NY", country: "US" },
  "san francisco": { city: "San Francisco", state: "CA", country: "US" },
  "los angeles": { city: "Los Angeles", state: "CA", country: "US" },
  "chicago": { city: "Chicago", state: "IL", country: "US" },
  "boston": { city: "Boston", state: "MA", country: "US" },
  "seattle": { city: "Seattle", state: "WA", country: "US" },
  "washington": { city: "Washington", state: "DC", country: "US" },
  "london": { city: "London", state: "England", country: "GB" },
  "toronto": { city: "Toronto", state: "ON", country: "CA" },
  "vancouver": { city: "Vancouver", state: "BC", country: "CA" },
  "sydney": { city: "Sydney", state: "NSW", country: "AU" },
  "melbourne": { city: "Melbourne", state: "VIC", country: "AU" },
  "brisbane": { city: "Brisbane", state: "QLD", country: "AU" },
  "perth": { city: "Perth", state: "WA", country: "AU" },
  "berlin": { city: "Berlin", state: "BE", country: "DE" },
  "paris": { city: "Paris", state: "IDF", country: "FR" },
  "tokyo": { city: "Tokyo", state: "TYO", country: "JP" },
  "singapore": { city: "Singapore", state: "SG", country: "SG" },
  "dubai": { city: "Dubai", state: "DXB", country: "AE" },
  "cape town": { city: "Cape Town", state: "WC", country: "ZA" },
  "johannesburg": { city: "Johannesburg", state: "GP", country: "ZA" },
};

const COUNTRY_CITY_MAP: Record<string, string[]> = {
  "in": ["delhi", "mumbai", "bengaluru", "kolkata", "chennai"],
  "india": ["delhi", "mumbai", "bengaluru", "kolkata", "chennai"],
  "au": ["sydney", "melbourne", "brisbane", "perth"],
  "australia": ["sydney", "melbourne", "brisbane", "perth"],
  "us": ["new york", "san francisco", "los angeles", "chicago", "washington"],
  "usa": ["new york", "san francisco", "los angeles", "chicago", "washington"],
  "za": ["cape town", "johannesburg"],
  "south africa": ["cape town", "johannesburg"],
};

const CITY_ALIASES: Record<string, string> = {
  "ndl": "delhi",
  "mum": "mumbai",
  "blr": "bengaluru",
  "cal": "kolkata",
  "syd": "sydney",
  "mel": "melbourne",
  "nyc": "new york",
  "sf": "san francisco",
  "la": "los angeles",
  "bos": "boston",
  "sea": "seattle",
  "dc": "washington",
  "jhb": "johannesburg",
};

const PIN_CODE_MAP: Record<string, string> = {
  "400067": "mumbai",
  "110001": "delhi",
  "560001": "bengaluru",
  "600001": "chennai",
  "700001": "kolkata",
};

export function getPredictiveLocationSuggestions(input: string): LocationResult[] {
  const cleanInput = input.trim().toLowerCase();
  if (cleanInput.length < 1) return [];

  const suggestions: LocationResult[] = [];
  const seen = new Set<string>();

  const add = (cityKey: string, source: LocationResult["source"], confidence: LocationResult["confidence"]) => {
    const data = CITY_DATA[cityKey];
    if (data && !seen.has(cityKey)) {
      seen.add(cityKey);
      suggestions.push({
        ...data,
        formattedAddress: `${data.city}, ${data.state}, ${data.country}`,
        confidence,
        source,
      });
    }
  };

  // 1. PIN Code Direct Match
  if (/^\d+$/.test(cleanInput)) {
    if (PIN_CODE_MAP[cleanInput]) {
      add(PIN_CODE_MAP[cleanInput], "postal", "high");
    }
    // Partial PIN match (heuristic)
    for (const pin in PIN_CODE_MAP) {
      if (pin.startsWith(cleanInput)) {
        add(PIN_CODE_MAP[pin], "postal", "medium");
      }
    }
  }

  // 2. Country-to-Cities Expansion
  if (COUNTRY_CITY_MAP[cleanInput]) {
    COUNTRY_CITY_MAP[cleanInput].forEach(city => add(city, "predictive", "high"));
  } else {
    // Partial country match
    for (const country in COUNTRY_CITY_MAP) {
      if (country.startsWith(cleanInput)) {
        COUNTRY_CITY_MAP[country].forEach(city => add(city, "predictive", "medium"));
      }
    }
  }

  // 3. Alias Direct/Partial Match
  if (CITY_ALIASES[cleanInput]) {
    add(CITY_ALIASES[cleanInput], "alias", "high");
  }
  for (const alias in CITY_ALIASES) {
    if (alias.startsWith(cleanInput)) {
      add(CITY_ALIASES[alias], "alias", "medium");
    }
  }

  // 4. City Name Direct/Partial Match
  for (const cityKey in CITY_DATA) {
    if (cityKey.startsWith(cleanInput) || CITY_DATA[cityKey].city.toLowerCase().startsWith(cleanInput)) {
      add(cityKey, "heuristic", "medium");
    }
  }

  return suggestions.slice(0, 5);
}

export function normalizeLocationQuery(input: string): LocationResult | null {
  const suggestions = getPredictiveLocationSuggestions(input);
  return suggestions.length > 0 ? suggestions[0] : null;
}

export function isLocationLikeQuery(input: string): boolean {
  const cleanInput = input.trim().toLowerCase();
  return getPredictiveLocationSuggestions(cleanInput).length > 0;
}

export function extractLocationIntent(input: string): LocationResult | null {
  const words = input.toLowerCase().split(/\s+|,/);
  for (const word of words) {
    const res = normalizeLocationQuery(word);
    if (res) return res;
  }
  return null;
}
