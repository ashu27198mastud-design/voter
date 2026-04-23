import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

// Mock dynamic ChatInterface to keep test lightweight
jest.mock('@/components/ChatInterface', () => ({
  ChatInterface: () => <div aria-label="Chat assistant" />,
}));

// Mock security/dompurify to avoid ESM transform issues in JSDOM
jest.mock('isomorphic-dompurify', () => ({
  sanitize: (_text: string) => _text,
}));

jest.mock('@/lib/security', () => ({
  sanitizeInput: (_text: string) => _text,
  validateAddress: (_text: string) => true,
}));

// Mock auth + firestore side effects
jest.mock('@/lib/auth', () => ({
  subscribeToAuthChanges: jest.fn((callback) => {
    callback(null);
    return jest.fn();
  }),
}));

jest.mock('@/lib/firestore', () => ({
  saveUserProgress: jest.fn(),
  getUserProgress: jest.fn(async () => null),
}));

// Mock election data hook
jest.mock('@/hooks/useElectionData', () => ({
  useElectionData: () => ({
    location: null,
    setLocation: jest.fn(),
    isLoading: false,
    voterInfo: null,
    fetchDataForLocation: jest.fn(),
  }),
}));

describe('Accessibility smoke test', () => {
  it('renders core accessible landmarks and controls', () => {
    render(<Home />);
    
    // verifies landmark presence
    expect(screen.getByRole('main')).toBeInTheDocument();
    
    // verifies accessible heading
    expect(
      screen.getByRole('heading', { name: /votepath ai/i }),
    ).toBeInTheDocument();
    
    // verifies input has an accessible label
    const locationInput = screen.getByLabelText(/enter your city or zip code/i);
    expect(locationInput).toBeInTheDocument();
    
    // verifies combobox role exists
    expect(locationInput).toHaveAttribute('role', 'combobox');
    
    expect(
      screen.queryByRole('alert'),
    ).not.toBeInTheDocument();
  });
});
