import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Loader from './Loader';

describe('Loader - Unit Test', () => {
  it('renders loading text', () => {
    render(<Loader />);
    expect(screen.getByText('Loading ...')).toBeInTheDocument();
  });
});
