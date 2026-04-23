'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { LocationSchema } from '../lib/validation';
import { UserLocation } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LocationInputProps {
  onLocationSubmit: (location: UserLocation) => void;
}

interface Prediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  isAlias: boolean;
}

// ---------------------------------------------------------------------------
// Alias map — shorthand input → expanded city name
// ---------------------------------------------------------------------------

const ALIASES: Readonly<Record<string, string>> = {
  // India
  mum: 'Mumbai',
  bom: 'Mumbai',
  del: 'Delhi',
  ndl: 'New Delhi',
  blr: 'Bengaluru',
  ban: 'Bengaluru',
  bang: 'Bengaluru',
  kol: 'Kolkata',
  cal: 'Kolkata',
  hyd: 'Hyderabad',
  chn: 'Chennai',
  mad: 'Chennai',
  pun: 'Pune',
  ahm: 'Ahmedabad',
  jpr: 'Jaipur',
  lko: 'Lucknow',
  sur: 'Surat',
  // USA
  nyc: 'New York City',
  ny: 'New York',
  la: 'Los Angeles',
  chi: 'Chicago',
  sf: 'San Francisco',
  bos: 'Boston',
  sea: 'Seattle',
  atl: 'Atlanta',
  mia: 'Miami',
  den: 'Denver',
  dal: 'Dallas',
  hou: 'Houston',
  phx: 'Phoenix',
  las: 'Las Vegas',
  phi: 'Philadelphia',
  // International
  lon: 'London',
  par: 'Paris',
  tok: 'Tokyo',
  syd: 'Sydney',
  mel: 'Melbourne',
  tor: 'Toronto',
  van: 'Vancouver',
  dxb: 'Dubai',
  sin: 'Singapore',
  hkg: 'Hong Kong',
  bkk: 'Bangkok',
  ist: 'Istanbul',
  ber: 'Berlin',
  rom: 'Rome',
  ams: 'Amsterdam',
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 275;
const MIN_CHARS = 2;
const MAX_RESULTS = 6;
const MAX_CACHE = 50;

// ---------------------------------------------------------------------------
// Alias matching — returns predictions from the local alias map
// ---------------------------------------------------------------------------

function matchAliases(raw: string): Prediction[] {
  const q = raw.toLowerCase().trim();
  const seen = new Set<string>();
  const out: Prediction[] = [];

  const add = (city: string, key: string) => {
    if (seen.has(city)) return;
    seen.add(city);
    out.push({
      placeId: `alias::${key}`,
      description: city,
      mainText: city,
      secondaryText: 'Quick match',
      isAlias: true,
    });
  };

  // Exact key hit — highest priority
  if (ALIASES[q]) add(ALIASES[q], q);

  // Key prefix: "ban" → "bang" → Bengaluru
  for (const [k, v] of Object.entries(ALIASES)) {
    if (k !== q && k.startsWith(q)) add(v, k);
  }

  // City-name prefix: "mumb" → Mumbai
  for (const [k, v] of Object.entries(ALIASES)) {
    if (v.toLowerCase().startsWith(q)) add(v, k);
  }

  return out.slice(0, 5);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const LocationInput: React.FC<LocationInputProps> = ({ onLocationSubmit }) => {
  // --- DOM refs ---
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // --- Google service refs (data-only, no widget attached to input) ---
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const serviceNodeRef = useRef<HTMLDivElement | null>(null);

  // --- Stale request guard ---
  const reqIdRef = useRef(0);

  // --- Debounce ---
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- In-memory cache: query → predictions ---
  const cacheRef = useRef<Map<string, Prediction[]>>(new Map());

  // --- State ---
  const [inputValue, setInputValue] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Bootstrap Google Maps Services
  // NOTE: We intentionally use AutocompleteService (data API) only.
  //       We do NOT attach google.maps.places.Autocomplete to the input element.
  // ---------------------------------------------------------------------------
  const initServices = useCallback(() => {
    if (!window.google?.maps?.places) return;
    if (!autocompleteServiceRef.current) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
    }
    if (!placesServiceRef.current) {
      if (!serviceNodeRef.current) serviceNodeRef.current = document.createElement('div');
      placesServiceRef.current = new window.google.maps.places.PlacesService(serviceNodeRef.current);
    }
  }, []);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!key) {
      console.warn('[LocationInput] NEXT_PUBLIC_GOOGLE_MAPS_KEY not set — alias-only mode.');
      return;
    }

    const scriptId = 'gm-places-sdk';

    if (window.google?.maps?.places) {
      initServices();
    } else if (!document.getElementById(scriptId)) {
      const s = document.createElement('script');
      s.id = scriptId;
      s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&v=weekly&loading=async`;
      s.async = true;
      s.defer = true;
      s.onload = initServices;
      document.head.appendChild(s);
    } else {
      document.getElementById(scriptId)!.addEventListener('load', initServices);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [initServices]);

  // Click-outside → close dropdown
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // ---------------------------------------------------------------------------
  // Dropdown helpers
  // ---------------------------------------------------------------------------
  const openDropdown = (preds: Prediction[]) => {
    setPredictions(preds);
    setActiveIndex(-1);
    setIsOpen(preds.length > 0);
  };

  const closeDropdown = () => {
    setPredictions([]);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  // Bounded LRU-style cache write
  const cacheWrite = (key: string, value: Prediction[]) => {
    if (cacheRef.current.size >= MAX_CACHE) {
      const first = cacheRef.current.keys().next().value;
      if (first !== undefined) cacheRef.current.delete(first);
    }
    cacheRef.current.set(key, value);
  };

  // ---------------------------------------------------------------------------
  // Core prediction fetch
  // Uses AutocompleteService.getPlacePredictions (data-only).
  // Merges alias rows (shown first) with Google results.
  // ---------------------------------------------------------------------------
  const fetchPredictions = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (trimmed.length < MIN_CHARS) {
      closeDropdown();
      setIsLoading(false);
      return;
    }

    const cacheKey = trimmed.toLowerCase();

    if (cacheRef.current.has(cacheKey)) {
      openDropdown(cacheRef.current.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    const aliasPreds = matchAliases(trimmed);
    const svc = autocompleteServiceRef.current;

    if (!svc) {
      // Google not loaded — alias-only
      if (aliasPreds.length > 0) {
        cacheWrite(cacheKey, aliasPreds);
        openDropdown(aliasPreds);
      } else {
        closeDropdown();
      }
      setIsLoading(false);
      return;
    }

    const thisId = ++reqIdRef.current;

    svc.getPlacePredictions(
      { input: trimmed, types: ['geocode'] },
      (results, status) => {
        if (thisId !== reqIdRef.current) return; // discard stale
        setIsLoading(false);

        const OK = window.google.maps.places.PlacesServiceStatus.OK;
        const ZERO = window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS;

        if (status === OK && results?.length) {
          const googlePreds: Prediction[] = results.map((r) => ({
            placeId: r.place_id,
            description: r.description,
            mainText: r.structured_formatting.main_text,
            secondaryText: r.structured_formatting.secondary_text ?? '',
            isAlias: false,
          }));

          const merged = [
            ...aliasPreds.filter((a) => !googlePreds.some((g) => g.mainText === a.mainText)),
            ...googlePreds,
          ].slice(0, MAX_RESULTS);

          cacheWrite(cacheKey, merged);
          openDropdown(merged);
        } else if (status === ZERO || status !== OK) {
          if (aliasPreds.length > 0) {
            cacheWrite(cacheKey, aliasPreds);
            openDropdown(aliasPreds);
          } else {
            closeDropdown();
          }
        }
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Input change handler — debounced
  // ---------------------------------------------------------------------------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < MIN_CHARS) {
      closeDropdown();
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    debounceRef.current = setTimeout(() => fetchPredictions(val), DEBOUNCE_MS);
  };

  // ---------------------------------------------------------------------------
  // Address normalization — parses Google address_components into the
  // { city, state, country, formattedAddress } shape expected by LocationSchema.
  // ---------------------------------------------------------------------------
  const normalizeAndSubmit = useCallback(
    (
      components: google.maps.GeocoderAddressComponent[] | undefined,
      formatted: string | undefined
    ) => {
      let city = '';
      let state = '';
      let country = '';

      if (components) {
        for (const c of components) {
          if (c.types.includes('locality')) city = c.long_name;
          else if (c.types.includes('administrative_area_level_1')) state = c.short_name;
          else if (c.types.includes('country')) country = c.short_name;
        }
      }

      if (!city && formatted) city = formatted.split(',')[0].trim();

      try {
        const validated = LocationSchema.parse({
          city: city || 'Unknown',
          state: state || 'Global',
          country: country || 'US',
          formattedAddress: formatted,
        });
        onLocationSubmit(validated);
        setError(null);
        if (formatted) setInputValue(formatted);
      } catch {
        setError('Invalid location — please try a different search.');
      }
    },
    [onLocationSubmit]
  );

  // Manual text fallback — splits "City, State, Country" freeform entry
  const submitRawText = useCallback(
    (text: string) => {
      const parts = text.split(',').map((p) => p.trim());
      try {
        const validated = LocationSchema.parse({
          city: parts[0] || text,
          state: parts[1] ?? 'Unknown',
          country: parts[2] ?? 'US',
          formattedAddress: text,
        });
        onLocationSubmit(validated);
        setError(null);
      } catch {
        setError("Please select a suggestion or type 'City, State'.");
      }
    },
    [onLocationSubmit]
  );

  // Geocode a plain text / alias city name for accurate components
  const geocodeAndSubmit = useCallback(
    (address: string) => {
      if (window.google?.maps?.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            normalizeAndSubmit(results[0].address_components, results[0].formatted_address);
          } else {
            submitRawText(address);
          }
        });
      } else {
        submitRawText(address);
      }
    },
    [normalizeAndSubmit, submitRawText]
  );

  // ---------------------------------------------------------------------------
  // Prediction selection
  // ---------------------------------------------------------------------------
  const selectPrediction = useCallback(
    (pred: Prediction) => {
      closeDropdown();
      setInputValue(pred.description);

      if (pred.isAlias) {
        geocodeAndSubmit(pred.description);
        return;
      }

      const svc = placesServiceRef.current;
      if (!svc) {
        geocodeAndSubmit(pred.description);
        return;
      }

      svc.getDetails(
        { placeId: pred.placeId, fields: ['address_components', 'formatted_address'] },
        (result, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && result) {
            normalizeAndSubmit(result.address_components, result.formatted_address);
          } else {
            geocodeAndSubmit(pred.description);
          }
        }
      );
    },
    [geocodeAndSubmit, normalizeAndSubmit]
  );

  // ---------------------------------------------------------------------------
  // Keyboard handler
  // ---------------------------------------------------------------------------
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, predictions.length - 1));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;

      case 'Escape':
        closeDropdown();
        break;

      case 'Enter': {
        e.preventDefault();
        if (activeIndex >= 0 && predictions[activeIndex]) {
          selectPrediction(predictions[activeIndex]);
          return;
        }
        const raw = inputValue.trim();
        if (raw.length < MIN_CHARS) return;
        const aliasHit = ALIASES[raw.toLowerCase()];
        if (aliasHit) {
          setInputValue(aliasHit);
          geocodeAndSubmit(aliasHit);
        } else {
          geocodeAndSubmit(raw);
        }
        break;
      }
    }
  };

  // ---------------------------------------------------------------------------
  // ARIA helpers
  // ---------------------------------------------------------------------------
  const listboxId = 'location-listbox';
  const activeDescendant = activeIndex >= 0 ? `loc-opt-${activeIndex}` : undefined;

  // ---------------------------------------------------------------------------
  // Render — custom in-app dropdown (no Google widget)
  // ---------------------------------------------------------------------------
  return (
    <div ref={containerRef} className="relative w-full max-w-md mx-auto group">
      <label htmlFor="location-input" className="sr-only">
        Enter your city or zip code
      </label>

      {/* Input + spinner wrapper */}
      <div className="relative">
        <input
          ref={inputRef}
          id="location-input"
          type="text"
          role="combobox"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-activedescendant={activeDescendant}
          aria-invalid={!!error}
          aria-describedby={error ? 'location-error' : undefined}
          value={inputValue}
          placeholder="Enter city or zip (try: mum, blr, nyc)..."
          className="w-full px-6 py-4 pr-14 text-lg rounded-full border-2 border-election-blue-100 bg-white shadow-[0_4px_12px_rgba(21,101,192,0.08)] focus:border-election-blue-500 focus:outline-none focus:ring-4 focus:ring-election-blue-50 transition-all duration-300 text-gray-800 placeholder-gray-400"
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />

        {isLoading && (
          <span
            className="absolute right-5 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          >
            <span className="block w-4 h-4 rounded-full border-2 border-election-blue-200 border-t-election-blue-600 animate-spin" />
          </span>
        )}
      </div>

      {/* Focus glow */}
      <div
        className="absolute inset-0 -z-10 rounded-full bg-election-blue-50 blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* Custom in-app suggestions dropdown */}
      {isOpen && predictions.length > 0 && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Location suggestions"
          className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden"
        >
          {predictions.map((pred, idx) => {
            const active = idx === activeIndex;
            return (
              <li
                key={pred.placeId}
                id={`loc-opt-${idx}`}
                role="option"
                aria-selected={active}
                className={`flex items-start gap-3 px-5 py-3 cursor-pointer select-none transition-colors duration-100 ${
                  active
                    ? 'bg-election-blue-50 text-election-blue-800'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur before click fires
                  selectPrediction(pred);
                }}
              >
                {/* Pin icon */}
                <svg
                  className={`mt-0.5 w-4 h-4 shrink-0 ${active ? 'text-election-blue-500' : 'text-gray-400'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a6 6 0 00-6 6c0 4.418 6 10 6 10s6-5.582 6-10a6 6 0 00-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z"
                    clipRule="evenodd"
                  />
                </svg>

                <div className="min-w-0 flex flex-col">
                  {pred.isAlias && (
                    <span className="mb-0.5 inline-block px-1.5 py-0.5 text-[10px] font-semibold tracking-widest uppercase rounded bg-election-blue-100 text-election-blue-700 w-fit">
                      quick match
                    </span>
                  )}
                  <span className="text-sm font-semibold leading-snug truncate">
                    {pred.mainText}
                  </span>
                  {pred.secondaryText && !pred.isAlias && (
                    <span className="text-xs text-gray-400 leading-snug truncate mt-0.5">
                      {pred.secondaryText}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Error */}
      {error && (
        <p
          id="location-error"
          role="alert"
          aria-live="assertive"
          className="mt-2 text-sm font-medium text-red-600 text-center"
        >
          {error}
        </p>
      )}
    </div>
  );
};
