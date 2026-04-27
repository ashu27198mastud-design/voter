import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PhoneAuth } from '../components/auth/PhoneAuth';
import { MFAEnrollmentModal } from '../components/auth/MFAEnrollmentModal';
import { MFASettings } from '../components/auth/MFASettings';

expect.extend(toHaveNoViolations);

// Mock the auth services globally
jest.mock('../lib/auth', () => ({
  initRecaptcha: jest.fn().mockReturnValue({
    verify: jest.fn().mockResolvedValue('token'),
  }),
  sendPhoneOtp: jest.fn(),
  enrollMfa: jest.fn(),
  verifyMfaSetup: jest.fn(),
}));

describe('Global Accessibility WCAG Audit Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('proves PhoneAuth component meets WCAG standards', async () => {
    const { container } = render(
      <PhoneAuth onSuccess={jest.fn()} onCancel={jest.fn()} />
    );
    
    // Ensure render
    expect(screen.getByLabelText(/Phone number/i)).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('proves MFAEnrollmentModal component meets WCAG standards', async () => {
    // Mock user
    const mockUser = { uid: '123' } as any;
    
    const { container } = render(
      <MFAEnrollmentModal user={mockUser} onSuccess={jest.fn()} onCancel={jest.fn()} />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('proves MFASettings component meets WCAG standards', async () => {
    const mockUser = { uid: '123' } as any;
    
    const { container } = render(
      <MFASettings user={mockUser} onEnroll={() => {}} onUnenroll={() => {}} />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
