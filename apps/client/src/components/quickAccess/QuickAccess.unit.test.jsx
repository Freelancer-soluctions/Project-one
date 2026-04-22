import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QuickAccessButton } from './QuickAccess';

describe('QuickAccessButton - Unit', () => {
  it('renders with label', () => {
    render(<QuickAccessButton label="Open" />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });
});
