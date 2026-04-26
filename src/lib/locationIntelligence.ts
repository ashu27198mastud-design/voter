export interface LocationResult {
  city: string;
  state: string;
  country: string;
  formattedAddress: string;
  confidence: "high" | "medium" | "low";
  source: "alias" | "postal" | "country" | "heuristic" | "predictive" | "google";
}

const CITY_DATA: Record<string, { city: string; state: string; country: string }> = {
  "delhi": { city: "New Delhi", state: "Delhi", country: "IN" },
  "new delhi": { city: "New Delhi", state: "Delhi", country: "IN" },
  "mumbai": { city: "Mumbai", state: "Maharashtra", country: "IN" },
  "kolkata": { city: "Kolkata", state: "West Bengal", country: "IN" },
  "bengaluru": { city: "Bengaluru", state: "Karnataka", country: "IN" },
  "chennai": { city: "Chennai", state: "Tamil Nadu", country: "IN" },
  "hyderabad": { city: "Hyderabad", state: "Telangana", country: "IN" },
  "pune": { city: "Pune", state: "MH", country: "IN" },
  "ahmedabad": { city: "Ahmedabad", state: "GJ", country: "IN" },
  "jaipur": { city: "Jaipur", state: "RJ", country: "IN" },
  "lucknow": { city: "Lucknow", state: "UP", country: "IN" },
  "new york": { city: "New York City", state: "New York", country: "US" },
  "new york city": { city: "New York City", state: "New York", country: "US" },
  "san francisco": { city: "San Francisco", state: "CA", country: "US" },
  "los angeles": { city: "Los Angeles", state: "CA", country: "US" },
  "chicago": { city: "Chicago", state: "IL", country: "US" },
  "boston": { city: "Boston", state: "MA", country: "US" },
  "seattle": { city: "Seattle", state: "WA", country: "US" },
  "washington": { city: "Washington", state: "DC", country: "US" },
  "washington dc": { city: "Washington", state: "DC", country: "US" },
  "london": { city: "London", state: "England", country: "GB" },
  "manchester": { city: "Manchester", state: "England", country: "GB" },
  "birmingham": { city: "Birmingham", state: "England", country: "GB" },
  "toronto": { city: "Toronto", state: "ON", country: "CA" },
  "vancouver": { city: "Vancouver", state: "BC", country: "CA" },
  "ottawa": { city: "Ottawa", state: "ON", country: "CA" },
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
  "in": ["new delhi", "mumbai", "kolkata", "chennai", "bengaluru"],
  "ind": ["new delhi", "mumbai", "kolkata", "chennai", "bengaluru"],
  "india": ["new delhi", "mumbai", "kolkata", "chennai", "bengaluru"],
  "bharat": ["new delhi", "mumbai", "kolkata", "chennai", "bengaluru"],
  "au": ["sydney", "melbourne", "brisbane", "perth"],
  "aus": ["sydney", "melbourne", "brisbane", "perth"],
  "australia": ["sydney", "melbourne", "brisbane", "perth"],
  "us": ["washington", "new york city", "los angeles", "chicago"],
  "usa": ["washington", "new york city", "los angeles", "chicago"],
  "america": ["washington", "new york city", "los angeles", "chicago"],
  "united states": ["washington", "new york city", "los angeles", "chicago"],
  "uk": ["london", "manchester", "birmingham"],
  "united kingdom": ["london", "manchester", "birmingham"],
  "britain": ["london", "manchester", "birmingham"],
  "ca": ["ottawa", "toronto", "vancouver"],
  "can": ["ottawa", "toronto", "vancouver"],
  "canada": ["ottawa", "toronto", "vancouver"],
  "za": ["cape town", "johannesburg"],
  "south africa": ["cape town", "johannesburg"],
};

const CITY_ALIASES: Record<string, string> = {
  "ndl": "delhi",
  "mum": "mumbai",
  "blr": "bengaluru",
  "cal": "kolkata",
  "chen": "chennai",
  "syd": "sydney",
  "mel": "melbourne",
  "nyc": "new york city",
  "sf": "san francisco",
  "la": "los angeles",
  "bos": "boston",
  "sea": "seattle",
  "dc": "washington",
  "jhb": "johannesburg",
  "kolkate": "kolkata",
  "calcutta": "kolkata",
  "bombay": "mumbai",
  "madras": "chennai",
  "bangalore": "bengaluru",
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
    } else if (cleanInput.length === 6) {
      // unknown 6-digit Indian PIN = low confidence with country IN
      suggestions.push({
        city: 'Unknown City',
        state: 'Unknown',
        country: 'IN',
        formattedAddress: `PIN ${cleanInput}, IN`,
        confidence: 'low',
        source: 'postal'
      });
      return suggestions;
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

  // Deduplicate combinations
  const uniqueSuggestions: LocationResult[] = [];
  const uniqueSet = new Set<string>();
  
  for (const s of suggestions) {
    const key = `${s.city}-${s.state}-${s.country}`;
    if (!uniqueSet.has(key)) {
      uniqueSet.add(key);
      uniqueSuggestions.push(s);
    }
  }

  return uniqueSuggestions.slice(0, 6);
}

export function normalizeLocationQuery(input: string): LocationResult | null {
  const suggestions = getPredictiveLocationSuggestions(input);
  if (suggestions.length === 0) return null;
  // sort highest confidence first
  return suggestions.sort((a, b) => {
    const scores = { high: 3, medium: 2, low: 1 };
    return scores[b.confidence] - scores[a.confidence];
  })[0];
}

export function isLocationLikeQuery(input: string): boolean {
  const cleanInput = input.trim().toLowerCase();
  return getPredictiveLocationSuggestions(cleanInput).length > 0;
}

export function extractLocationIntent(input: string): LocationResult | null {
  const cleanInput = input.toLowerCase();
  
  // Try all known city keys and aliases directly in the input
  const allCityKeys = [...Object.keys(CITY_DATA), ...Object.keys(CITY_ALIASES)];
  // Sort by length descending to match longest possible names first (e.g. "new york city" before "new york")
  allCityKeys.sort((a, b) => b.length - a.length);

  for (const key of allCityKeys) {
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(cleanInput)) {
      const res = normalizeLocationQuery(key);
      if (res) return res;
    }
  }

  // Try country names next
  for (const country in COUNTRY_CITY_MAP) {
    if (country === 'in') continue; // Skip 'in' boundary check as it's too common as a preposition
    if (cleanInput.includes(country)) {
      const regex = new RegExp(`\\b${country}\\b`, 'i');
      if (regex.test(cleanInput)) {
         const res = normalizeLocationQuery(country);
         if (res) return res;
      }
    }
  }

  // Fallback to word-by-word extraction
  const words = cleanInput.split(/\s+|,/);
  for (const word of words) {
    if (word.length < 3 && !/^\d+$/.test(word)) continue; // skip small noise words unless it's a number
    const res = normalizeLocationQuery(word);
    if (res && res.confidence === 'high') return res;
  }
  
  // Try again for medium confidence
  for (const word of words) {
    if (word.length < 3 && !/^\d+$/.test(word)) continue;
    const res = normalizeLocationQuery(word);
    if (res) return res;
  }

  return null;
}
