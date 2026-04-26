import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { PhoneAuth } from '../components/auth/PhoneAuth';

// Mock the auth services
jest.mock('../lib/auth', () => ({
  initRecaptcha: jest.fn(),
  sendPhoneOtp: jest.fn(),
}));

describe('PhoneAuth Accessibility', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has labeled phone input', () => {
    render(<PhoneAuth onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    const input = screen.getByLabelText(/Phone number/i);
    expect(input).toBeInTheDocument();
  });
});
