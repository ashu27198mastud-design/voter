import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { PhoneAuth } from '../components/auth/PhoneAuth';

import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock the auth services
jest.mock('../lib/auth', () => ({
  initRecaptcha: jest.fn().mockReturnValue({
    verify: jest.fn().mockResolvedValue('token'),
  }),
  sendPhoneOtp: jest.fn(),
}));

describe('PhoneAuth Accessibility WCAG Audit', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes automated WCAG accessibility audit for the phone input step', async () => {
    const { container } = render(<PhoneAuth onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);
    
    // Ensure the input is rendered
    expect(screen.getByLabelText(/Phone number/i)).toBeInTheDocument();

    // Run the axe accessibility audit
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
