'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { LocationSchema } from '@/lib/validation';
import { UserLocation } from '@/types';
import { normalizeLocationQuery } from '@/lib/locationIntelligence';

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

// ALIASES and ALIAS_LOCATION_DATA removed in favor of locationIntelligence library

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 275;
const MIN_CHARS = 2;
const MAX_RESULTS = 6;
const MAX_CACHE = 50;

function matchLocalIntelligence(raw: string): Prediction[] {
  const result = normalizeLocationQuery(raw);
  if (!result) return [];

  const sourceLabels = {
    alias: 'Smart match',
    postal: 'PIN code match',
    heuristic: 'Search fallback',
  };

  return [{
    placeId: `local::${result.source}`,
    description: result.formattedAddress,
    mainText: result.city || result.formattedAddress,
    secondaryText: sourceLabels[result.source] || 'Smart match',
    isAlias: true, // We treat local matches like aliases for instant resolution
  }];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const LocationInput: React.FC<LocationInputProps> = ({ onLocationSubmit }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const serviceNodeRef = useRef<HTMLDivElement | null>(null);
  const reqIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cacheRef = useRef<Map<string, Prediction[]>>(new Map());

  const [inputValue, setInputValue] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Declare closeDropdown BEFORE useEffect usage
  const closeDropdown = useCallback(() => {
    setPredictions([]);
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  const openDropdown = useCallback((preds: Prediction[]) => {
    setPredictions(preds);
    setActiveIndex(-1);
    setIsOpen(preds.length > 0);
  }, []);

  const cacheWrite = useCallback((key: string, value: Prediction[]) => {
    if (cacheRef.current.size >= MAX_CACHE) {
      const first = cacheRef.current.keys().next().value;
      if (first !== undefined) cacheRef.current.delete(first);
    }
    cacheRef.current.set(key, value);
  }, []);

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
    if (!key) return;
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
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [initServices]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [closeDropdown]);

  const normalizeAndSubmit = useCallback((components: google.maps.GeocoderAddressComponent[] | undefined, formatted: string | undefined) => {
    let city = '', state = '', country = '';
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
        state: state || 'Unknown',
        country: country || 'Unknown',
        formattedAddress: formatted,
      });
      onLocationSubmit(validated);
      setError(null);
      if (formatted) setInputValue(formatted);
    } catch {
      setError('Please select a precise location from the list.');
    }
  }, [onLocationSubmit]);

  const geocodeAndSubmit = useCallback((address: string) => {
    const localMatch = normalizeLocationQuery(address);
    
    if (window.google?.maps?.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      setIsLoading(true);
      geocoder.geocode({ address }, (results, status) => {
        setIsLoading(false);
        if (status === 'OK' && results?.[0]) {
          normalizeAndSubmit(results[0].address_components, results[0].formatted_address);
        } else if (localMatch) {
          // Fallback to local intelligence if Maps fails but we have a match
          onLocationSubmit({
            city: localMatch.city,
            state: localMatch.state,
            country: localMatch.country,
            formattedAddress: localMatch.formattedAddress
          });
        } else {
          setError('Could not verify this location. Please be more specific.');
        }
      });
    } else if (localMatch) {
      // Instant resolution if Maps is not available
      onLocationSubmit({
        city: localMatch.city,
        state: localMatch.state,
        country: localMatch.country,
        formattedAddress: localMatch.formattedAddress
      });
    } else {
      // Submit as low-confidence manual entry instead of blocking error
      try {
        const manualLoc = {
          city: address.split(',')[0].trim(),
          state: 'Unknown',
          country: 'Unknown',
          formattedAddress: address
        };
        onLocationSubmit(manualLoc);
      } catch {
        setError('Please enter a valid location.');
      }
    }
  }, [normalizeAndSubmit, onLocationSubmit]);

  const selectPrediction = useCallback((pred: Prediction) => {
    closeDropdown();
    setInputValue(pred.description);

    const localMatch = normalizeLocationQuery(pred.description);

    // Bypassing geocoder for local intelligence matches
    if (pred.isAlias && localMatch) {
      onLocationSubmit({
        city: localMatch.city,
        state: localMatch.state,
        country: localMatch.country,
        formattedAddress: localMatch.formattedAddress
      });
      return;
    }

    if (pred.isAlias) {
      geocodeAndSubmit(pred.description);
    } else {
      const svc = placesServiceRef.current;
      if (!svc) {
        geocodeAndSubmit(pred.description);
        return;
      }
      svc.getDetails({ placeId: pred.placeId, fields: ['address_components', 'formatted_address'] }, (result, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && result) {
          normalizeAndSubmit(result.address_components, result.formatted_address);
        } else {
          geocodeAndSubmit(pred.description);
        }
      });
    }
  }, [closeDropdown, geocodeAndSubmit, normalizeAndSubmit, onLocationSubmit]);

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
    const localPreds = matchLocalIntelligence(trimmed);
    const svc = autocompleteServiceRef.current;
    if (!svc) {
      if (localPreds.length > 0) openDropdown(localPreds);
      setIsLoading(false);
      return;
    }
    const thisId = ++reqIdRef.current;
    svc.getPlacePredictions({ input: trimmed, types: ['geocode'] }, (results, status) => {
      if (thisId !== reqIdRef.current) return;
      setIsLoading(false);
      const OK = window.google.maps.places.PlacesServiceStatus.OK;
      if (status === OK && results?.length) {
        const googlePreds: Prediction[] = results.map(r => ({
          placeId: r.place_id, description: r.description,
          mainText: r.structured_formatting.main_text,
          secondaryText: r.structured_formatting.secondary_text ?? '',
          isAlias: false,
        }));
        const merged = [...localPreds, ...googlePreds.filter(g => !localPreds.some(a => a.mainText === g.mainText))].slice(0, MAX_RESULTS);
        cacheWrite(cacheKey, merged);
        openDropdown(merged);
      } else if (localPreds.length > 0) {
        openDropdown(localPreds);
      } else {
        closeDropdown();
      }
    });
  }, [cacheWrite, closeDropdown, openDropdown]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, predictions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
        break;
      case 'Escape':
        closeDropdown();
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && predictions[activeIndex]) {
          selectPrediction(predictions[activeIndex]);
        } else if (inputValue.trim().length >= MIN_CHARS) {
          geocodeAndSubmit(inputValue.trim());
        }
        break;
    }
  };

  const listboxId = 'location-listbox';

  return (
    <div 
      ref={containerRef} 
      className="relative w-full max-w-md mx-auto group"
      aria-busy={isLoading}
      role="search"
    >
      <div className="sr-only" aria-live="polite">
        {isLoading ? 'Loading location suggestions' : isOpen ? `${predictions.length} suggestions available` : ''}
      </div>

      <label htmlFor="location-input" className="sr-only">Enter your city or zip code</label>
      <div className="relative">
        <input
          ref={inputRef}
          id="location-input"
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-activedescendant={activeIndex >= 0 ? `opt-${activeIndex}` : undefined}
          aria-invalid={!!error}
          aria-describedby={error ? 'location-error' : undefined}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter city or zip (e.g., mum, blr, nyc)..."
          className="w-full px-6 py-4 pr-14 text-lg rounded-full border-2 border-election-blue-100 bg-white shadow-sm focus:border-election-blue-500 focus:outline-none focus:ring-4 focus:ring-election-blue-50 transition-all duration-300"
        />
        {isLoading && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2" role="status">
            <span className="sr-only">Searching...</span>
            <div className="w-4 h-4 border-2 border-election-blue-200 border-t-election-blue-600 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen && predictions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          {predictions.map((p, i) => (
            <li
              key={p.placeId}
              id={`opt-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => selectPrediction(p)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`px-5 py-3 cursor-pointer ${i === activeIndex ? 'bg-election-blue-50 text-election-blue-800' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{p.mainText}</span>
                <span className="text-xs text-gray-400">{p.secondaryText}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p id="location-error" role="alert" className="mt-2 text-sm font-medium text-red-600 text-center">
          {error}
        </p>
      )}
    </div>
  );
};
