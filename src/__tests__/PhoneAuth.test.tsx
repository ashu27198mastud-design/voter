import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PhoneAuth } from '../components/auth/PhoneAuth';
import * as authService from '../lib/auth';

// Mock the auth services
jest.mock('../lib/auth', () => ({
  initRecaptcha: jest.fn(),
  sendPhoneOtp: jest.fn(),
}));

describe('PhoneAuth Component', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (authService.initRecaptcha as jest.Mock).mockReturnValue({
      verify: jest.fn().mockResolvedValue('token'),
    });
  });

  it('renders phone input by default', () => {
    render(<PhoneAuth onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    expect(screen.getByPlaceholderText(/1 555 000 0000/i)).toBeInTheDocument();
    expect(screen.getByText(/Send Security Code/i)).toBeInTheDocument();
  });

  it('transitions to OTP input after sending code', async () => {
    const mockConfirmationResult = {
      confirm: jest.fn().mockResolvedValue({ user: { uid: '123' } }),
    };
    (authService.sendPhoneOtp as jest.Mock).mockResolvedValue(mockConfirmationResult);

    render(<PhoneAuth onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    const input = screen.getByPlaceholderText(/1 555 000 0000/i);
    fireEvent.change(input, { target: { value: '1234567890' } });
    
    const submitBtn = screen.getByText(/Send Security Code/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Verify your number/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/000000/i)).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<PhoneAuth onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    const cancelBtn = screen.getByText(/Cancel and go back/i);
    fireEvent.click(cancelBtn);
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
