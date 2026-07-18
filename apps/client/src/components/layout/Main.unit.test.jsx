import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Main from './Main';

describe('Main - Unit Test', () => {
  it('renders main text', () => {
    render(<Main />);
    expect(screen.getByText('Main')).toBeInTheDocument();
  });
});
