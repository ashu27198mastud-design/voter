import '@testing-library/jest-dom';

// Mock DOMPurify to provide basic sanitization for tests
jest.mock('isomorphic-dompurify', () => ({
  sanitize: (content: string, options?: any) => {
    if (options && options.ALLOWED_TAGS && options.ALLOWED_TAGS.length === 0) {
      // sanitizeText behavior: strip all tags
      return content.replace(/<[^>]*>/g, '');
    }
    // sanitizeHtml behavior: strip scripts and common dangerous tags
    return content.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
                  .replace(/onerror\s*=\s*"[^"]*"/gim, '')
                  .replace(/onerror\s*=\s*'[^']*'/gim, '')
                  .replace(/onerror\s*=\s*[^\s>]+/gim, '');
  },
  __esModule: true,
  default: {
    sanitize: (content: string, options?: any) => {
       if (options && options.ALLOWED_TAGS && options.ALLOWED_TAGS.length === 0) {
          return content.replace(/<[^>]*>/g, '');
       }
       return content.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '');
    },
  },
}));

// Mock scrollIntoView which is not implemented in JSDOM
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock Google Maps globally
(global as any).google = {
  maps: {
    places: {
      Autocomplete: jest.fn().mockImplementation(() => ({
        addListener: jest.fn(),
        getPlace: jest.fn()
      }))
    },
    Geocoder: jest.fn().mockImplementation(() => ({
      geocode: jest.fn()
    }))
  }
};
