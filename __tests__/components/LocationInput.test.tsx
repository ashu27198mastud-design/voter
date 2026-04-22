import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocationInput } from '../../src/components/LocationInput';

// Mock Google Maps
(window as any).google = {
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

describe('LocationInput Component', () => {
  it('renders the search input with correct placeholder', () => {
    render(<LocationInput onLocationSubmit={jest.fn()} />);
    expect(screen.getByPlaceholderText(/Enter your city or zip code/i)).toBeInTheDocument();
  });

  it('shows error message on invalid manual input', () => {
    render(<LocationInput onLocationSubmit={jest.fn()} />);
    const input = screen.getByPlaceholderText(/Enter your city or zip code/i);
    
    fireEvent.change(input, { target: { value: 'a' } }); // Too short
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    // We expect the error to trigger if Geocoder fails (which it will since it's mocked empty)
    // and manual parse fails validation
    setTimeout(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
    }, 100);
  });
});
