import 'isomorphic-fetch';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Polyfill Response.json if missing (needed for Next.js 13+ tests in some Node envs)
if (typeof Response.json !== 'function') {
  (Response as unknown as { json: (data: unknown, init?: ResponseInit) => Response }).json = (data: unknown, init?: ResponseInit) => {
    const response = new Response(JSON.stringify(data), init);
    response.headers.set('Content-Type', 'application/json');
    return response;
  };
}

// Mock matchMedia for Framer Motion and UI tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Mock Google Maps
global.google = {
  maps: {
    places: {
      AutocompleteService: jest.fn().mockImplementation(() => ({
        getPlacePredictions: jest.fn(),
      })),
      PlacesService: jest.fn().mockImplementation(() => ({
        getDetails: jest.fn(),
      })),
      PlacesServiceStatus: {
        OK: 'OK',
        ZERO_RESULTS: 'ZERO_RESULTS',
      },
    },
    Geocoder: jest.fn().mockImplementation(() => ({
      geocode: jest.fn(),
    })),
  },
} as unknown as typeof google;
