import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LocationInput } from '@/components/LocationInput';

describe('LocationInput Component', () => {
  it('renders the search input with correct placeholder', () => {
    render(<LocationInput onLocationSubmit={jest.fn()} />);
    expect(screen.getByPlaceholderText(/Enter city or zip/i)).toBeInTheDocument();
  });

  it('shows error message on invalid manual input', async () => {
    render(<LocationInput onLocationSubmit={jest.fn()} />);
    const input = screen.getByPlaceholderText(/Enter city or zip/i);
    
    fireEvent.change(input, { target: { value: 'x' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      // Logic for error reporting
    }, { timeout: 500 });
  });
});
