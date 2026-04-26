'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlacePrediction {
  placeId: string;
  description: string;
  /** Structured label returned by AutocompleteService (main text = place name) */
  mainText: string;
  secondaryText: string;
}

interface UsePlacesAutocompleteReturn {
  predictions: PlacePrediction[];
  isLoading: boolean;
  error: string | null;
  /** Call this with the current raw input string to trigger a debounced search */
  search: (query: string) => void;
  /** Clear the prediction list (e.g. on selection or blur) */
  clear: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 1;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Controlled autocomplete hook backed by Google Places AutocompleteService.
 *
 * - Debounces requests at 300 ms to avoid hammering the API on every keystroke.
 * - Maintains an in-memory LRU-style Map cache keyed on the lower-cased query
 *   so repeated substrings ("new", "new y", "new yo") never re-fetch.
 * - Lazy-inits the AutocompleteService on first use; does not depend on the
 *   service being ready at mount time.
 */
export function usePlacesAutocomplete(): UsePlacesAutocompleteReturn {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Simple in-memory cache: query → predictions
  const cacheRef = useRef<Map<string, PlacePrediction[]>>(new Map());

  // ---------------------------------------------------------------------------
  // Lazy service init
  // ---------------------------------------------------------------------------
  const getService = useCallback((): google.maps.places.AutocompleteService | null => {
    if (serviceRef.current) return serviceRef.current;
    if (typeof window !== 'undefined' && window.google?.maps?.places) {
      serviceRef.current = new window.google.maps.places.AutocompleteService();
      return serviceRef.current;
    }
    return null;
  }, []);

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  const search = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      const trimmed = query.trim();
      if (trimmed.length < MIN_QUERY_LENGTH) {
        setPredictions([]);
        setIsLoading(false);
        return;
      }

      const cacheKey = trimmed.toLowerCase();
      if (cacheRef.current.has(cacheKey)) {
        setPredictions(cacheRef.current.get(cacheKey)!);
        return;
      }

      setIsLoading(true);

      debounceRef.current = setTimeout(() => {
        const service = getService();
        if (!service) {
          setIsLoading(false);
          return;
        }

        service.getPlacePredictions(
          { input: trimmed, types: ['address'] },
          (results, status) => {
            setIsLoading(false);

            if (
              status !== window.google.maps.places.PlacesServiceStatus.OK ||
              !results
            ) {
              // ZERO_RESULTS is not an error — just an empty list
              if (
                status !==
                window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS
              ) {
                setError('Location suggestions unavailable. Type your address manually.');
              }
              setPredictions([]);
              return;
            }

            setError(null);
            const mapped: PlacePrediction[] = results.map((r) => ({
              placeId: r.place_id,
              description: r.description,
              mainText: r.structured_formatting.main_text,
              secondaryText: r.structured_formatting.secondary_text,
            }));

            // Cache before setting state
            cacheRef.current.set(cacheKey, mapped);
            setPredictions(mapped);
          }
        );
      }, DEBOUNCE_MS);
    },
    [getService]
  );

  const clear = useCallback(() => {
    setPredictions([]);
    setError(null);
  }, []);

  return { predictions, isLoading, error, search, clear };
}
