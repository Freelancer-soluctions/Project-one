import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuickAccessButton } from './QuickAccess';

describe('QuickAccessButton - Integration', () => {
  it('renders and handles click without crash', () => {
    const onClick = vi.fn();
    render(<QuickAccessButton label="Click Me" onClick={onClick} />);
    expect(screen.getByText('Click Me')).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    // No crash occurred
  });
});
