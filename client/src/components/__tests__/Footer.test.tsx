import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer', () => {
  test('renders the copyright information', () => {
    render(<Footer />);
    
    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(`© ${currentYear} Liminal Type Chat`))).toBeInTheDocument();
  });

  test('renders the GitHub link', () => {
    render(<Footer />);
    
    const link = screen.getByText('GitHub');
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', expect.stringContaining('github.com'));
  });
});
