import '@testing-library/jest-dom';

// Mock matchMedia for Framer Motion and UI tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
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

// Mock DOMPurify to allow testing of sanitized HTML
jest.mock('isomorphic-dompurify', () => ({
  sanitize: jest.fn((dirty: string) => dirty),
  addHook: jest.fn(),
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
