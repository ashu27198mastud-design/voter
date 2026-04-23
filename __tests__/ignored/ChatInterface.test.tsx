import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInterface } from '../../src/components/ChatInterface';

describe('ChatInterface Component', () => {
  it('renders the floating action button', () => {
    render(<ChatInterface location={null} />);
    expect(screen.getByLabelText(/Toggle Election Guide Chat/i)).toBeInTheDocument();
  });

  it('opens the chat window when clicked', () => {
    render(<ChatInterface location={null} />);
    const button = screen.getByLabelText(/Toggle Election Guide Chat/i);
    fireEvent.click(button);
    expect(screen.getByRole('heading', { name: /VotePath Assistant/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask about the voting process/i)).toBeInTheDocument();
  });

  it('allows typing into the input', () => {
    render(<ChatInterface location={null} />);
    fireEvent.click(screen.getByLabelText(/Toggle Election Guide Chat/i));
    const input = screen.getByPlaceholderText(/Ask about the voting process/i);
    fireEvent.change(input, { target: { value: 'How do I vote?' } });
    expect((input as HTMLInputElement).value).toBe('How do I vote?');
  });
});
