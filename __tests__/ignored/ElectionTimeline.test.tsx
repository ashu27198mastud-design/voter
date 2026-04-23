import React from 'react';
import { render, screen } from '@testing-library/react';
import { ElectionTimeline } from '../../src/components/ElectionTimeline';
import { TimelineStep } from '../../src/types';

const mockSteps: TimelineStep[] = [
  {
    id: '1',
    title: 'Test Step',
    description: 'Test Description',
    isCompleted: false,
    status: 'Not Started',
    content: '<p>Content</p>'
  }
];

describe('ElectionTimeline Component', () => {
  it('renders nothing when isVisible is false', () => {
    const { container } = render(<ElectionTimeline steps={mockSteps} isVisible={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders steps when isVisible is true', () => {
    render(<ElectionTimeline steps={mockSteps} isVisible={true} />);
    expect(screen.getByText('Test Step')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('shows the journey heading', () => {
    render(<ElectionTimeline steps={mockSteps} isVisible={true} />);
    expect(screen.getByText(/Your Election Journey/i)).toBeInTheDocument();
  });
});
