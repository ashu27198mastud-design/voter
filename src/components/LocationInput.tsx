'use client';

import React, { useEffect, useRef, useState } from 'react';
import { LocationSchema } from '../lib/validation';
import { UserLocation } from '../types';

interface LocationInputProps {
  onLocationSubmit: (location: UserLocation) => void;
}

/**
 * LocationInput uses Google Places Autocomplete (legacy API, still supported).
 * Always renders a plain HTML input; Google Places attaches to it after mount.
 * Client-only via 'use client' directive.
 */
export const LocationInput: React.FC<LocationInputProps> = ({ onLocationSubmit }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');


  const parseAndSubmit = React.useCallback(
    (
      components: google.maps.GeocoderAddressComponent[] | undefined,
      formattedAddress: string | undefined
    ) => {
      let city = '';
      let state = '';
      let country = '';

      if (components) {
        for (const c of components) {
          if (c.types.includes('locality')) city = c.long_name;
          else if (c.types.includes('administrative_area_level_1')) state = c.short_name;
          else if (c.types.includes('country')) country = c.short_name; // Use ISO code
        }
      }

      // Fallback: If locality is not found, use the 'name' from Google Places (e.g., 'Mumbai')
      if (!city && formattedAddress) {
        city = formattedAddress.split(',')[0];
      }

      try {
        const validated = LocationSchema.parse({
          city: city || 'Unknown',
          state: state || 'Global',
          country: country || 'US',
          formattedAddress,
        });
        onLocationSubmit(validated);
        setError(null);
        if (formattedAddress) {
          setInputValue(formattedAddress);
        }
      } catch {
        setError('Invalid location. Please try a different search.');
      }
    },
    [onLocationSubmit]
  );

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key missing.');
      return;
    }

    let autocomplete: google.maps.places.Autocomplete | null = null;

    const attachAutocomplete = () => {
      if (!inputRef.current || !window.google?.maps?.places) return;

      autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['geocode'], 
        fields: ['address_components', 'formatted_address', 'name'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete?.getPlace();
        if (place) {
          parseAndSubmit(place.address_components, place.formatted_address);
        }
      });
    };

    const scriptId = 'google-maps-places-script';

    if (window.google?.maps?.places) {
      // Already loaded
      attachAutocomplete();
    } else if (!document.getElementById(scriptId)) {
      // First load
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = attachAutocomplete;
      document.head.appendChild(script);
    } else {
      // Script tag exists; wait for it
      document.getElementById(scriptId)!.addEventListener('load', attachAutocomplete);
    }

    return () => {
      if (autocomplete && window.google?.maps) {
        window.google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [parseAndSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const rawText = inputRef.current?.value ?? '';
      if (rawText.trim().length < 2) return;

      // Try Geocoder if Google Maps is available (best accuracy)
      if (window.google?.maps?.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: rawText }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            parseAndSubmit(
              results[0].address_components,
              results[0].formatted_address
            );
          } else {
            // Fallback: manual parse
            submitRawText(rawText);
          }
        });
      } else {
        submitRawText(rawText);
      }
    }
  };

  const submitRawText = (rawText: string) => {
    const parts = rawText.split(',').map(s => s.trim());
    const city = parts[0] || rawText;
    const state = parts.length > 1 ? parts[1] : 'Unknown';
    const country = parts.length > 2 ? parts[2] : 'US';

    try {
      const validated = LocationSchema.parse({
        city,
        state,
        country,
        formattedAddress: rawText,
      });
      onLocationSubmit(validated);
      setError(null);
    } catch {
      setError("Please select from the dropdown or type 'City, State'.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative group">
      <label htmlFor="location-input" className="sr-only">
        Enter your city or zip code
      </label>

      <input
        ref={inputRef}
        id="location-input"
        type="text"
        value={inputValue}
        placeholder="Enter your city or zip code..."
        className="w-full px-6 py-4 text-lg rounded-full border-2 border-election-blue-100 bg-white shadow-[0_4px_12px_rgba(21,101,192,0.08)] focus:border-election-blue-500 focus:outline-none focus:ring-4 focus:ring-election-blue-50 transition-all duration-300 text-gray-800 placeholder-gray-400"
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          setInputValue(e.target.value);
        }}
        aria-invalid={!!error}
        aria-describedby={error ? 'location-error' : undefined}
      />

      {/* 3D depth glow effect on focus */}
      <div className="absolute inset-0 -z-10 bg-election-blue-50 rounded-full blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />

      {error && (
        <p
          id="location-error"
          className="mt-2 text-red-600 text-sm font-medium text-center"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </p>
      )}
    </div>
  );
};
