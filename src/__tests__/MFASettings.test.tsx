import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MFASettings } from '../components/auth/MFASettings';
import * as authService from '../lib/auth';
import { multiFactor } from '../lib/firebase';

// Mock the services
jest.mock('../lib/auth', () => ({
  isMFAEnabled: jest.fn(),
  unenrollPhoneMFA: jest.fn(),
  initRecaptcha: jest.fn(),
  startMfaEnrollment: jest.fn(),
  finishMfaEnrollment: jest.fn(),
}));

jest.mock('../lib/firebase', () => ({
  auth: { currentUser: { uid: '123' } },
  multiFactor: jest.fn(),
}));

describe('MFASettings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders disabled state when MFA is off', async () => {
    (authService.isMFAEnabled as jest.Mock).mockReturnValue(false);
    (multiFactor as jest.Mock).mockReturnValue({ enrolledFactors: [] });

    render(<MFASettings />);
    
    await waitFor(() => {
      expect(screen.getByText(/Two-Factor Authentication/i)).toBeInTheDocument();
      expect(screen.queryByText(/Active/i)).not.toBeInTheDocument();
    });
  });

  it('renders active state when MFA is on', async () => {
    (authService.isMFAEnabled as jest.Mock).mockReturnValue(true);
    (multiFactor as jest.Mock).mockReturnValue({ enrolledFactors: [{ uid: 'factor-1' }] });

    render(<MFASettings />);
    
    await waitFor(() => {
      expect(screen.getByText(/Active/i)).toBeInTheDocument();
    });
  });

  it('opens enrollment modal when clicking enable', async () => {
    (authService.isMFAEnabled as jest.Mock).mockReturnValue(false);
    (multiFactor as jest.Mock).mockReturnValue({ enrolledFactors: [] });

    render(<MFASettings />);
    
    const toggle = screen.getByRole('button', { name: /Toggle Two-Factor Authentication/i });
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByText(/Enable MFA/i)).toBeInTheDocument();
    });
  });
});
