import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Layout from './index';

describe('Layout - Unit Test', () => {
  it('renders Header, Main, and Footer', () => {
    render(<Layout />);
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Main')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});
