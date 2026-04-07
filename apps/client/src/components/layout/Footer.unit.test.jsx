import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Footer from './Footer';

describe('Footer - Unit Test', () => {
  it('renders footer text', () => {
    render(<Footer />);
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});
