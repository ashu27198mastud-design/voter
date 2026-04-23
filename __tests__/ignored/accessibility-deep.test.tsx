import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Home from '@/app/page';
import { VoterContextSelector } from '@/components/VoterContextSelector';
import { ElectionTimeline } from '@/components/ElectionTimeline';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock security/dompurify to avoid ESM transform issues in JSDOM
jest.mock('isomorphic-dompurify', () => ({
  sanitize: () => '',
  addHook: jest.fn(),
}));


// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: unknown) => <div {...(props as object)}>{children}</div>,
    article: ({ children, ...props }: unknown) => <article {...(props as object)}>{children}</article>,
    section: ({ children, ...props }: unknown) => <section {...(props as object)}>{children}</section>,
    span: ({ children, ...props }: unknown) => <span {...(props as object)}>{children}</span>,
  },
  AnimatePresence: ({ children }: unknown) => <>{children}</>,
}));

jest.mock('@/components/BallotBoxIcon', () => ({
  BallotBoxIcon: () => <div role="img" aria-label="Ballot box" />,
}));

// Mock dynamic components and services
jest.mock('@/components/ChatInterface', () => ({
  ChatInterface: () => <div role="region" aria-label="Chat assistant" />,
}));

jest.mock('@/components/PollingMap', () => ({
  PollingMap: () => <div role="application" aria-label="Polling location map" />,
}));

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

jest.mock('@/hooks/useElectionData', () => ({
  useElectionData: () => ({
    location: null,
    setLocation: jest.fn(),
    isLoading: false,
    voterInfo: null,
    fetchDataForLocation: jest.fn(),
  }),
}));

describe('Deep Accessibility Audits', () => {
  it('should have no basic accessibility violations on the Home page', async () => {
    const { container } = render(<Home />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('VoterContextSelector should have no accessibility violations', async () => {
    const { container } = render(
      <VoterContextSelector onComplete={jest.fn()} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('VoterContextSelector should be keyboard navigable', () => {
    render(<VoterContextSelector onComplete={jest.fn()} />);
    const options = screen.getAllByRole('button');
    
    // Check that we can tab through options
    options[0].focus();
    expect(document.activeElement).toBe(options[0]);
    
    // Ensure labels and descriptions are connected
    options.forEach(opt => {
      expect(opt).toHaveAttribute('aria-describedby');
      const descId = opt.getAttribute('aria-describedby');
      expect(document.getElementById(descId!)).toBeInTheDocument();
    });
  });

  it('ElectionTimeline should render with proper list roles', () => {
    const mockSteps = [
      {
        id: '1',
        title: 'Register to Vote',
        description: 'Verify status',
        isCompleted: false,
        content: 'Check online',
        status: 'Not Started' as const,
      }
    ];
    
    render(<ElectionTimeline steps={mockSteps} isVisible={true} />);
    
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register to vote/i })).toHaveAttribute('aria-expanded');
  });
});
