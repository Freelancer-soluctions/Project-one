import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Header from './Header';

describe('Header - Unit Test', () => {
  it('renders header text', () => {
    render(<Header />);
    expect(screen.getByText('Header')).toBeInTheDocument();
  });
});
