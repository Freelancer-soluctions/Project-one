import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import InternalServerError from './InternalServerError';

describe('InternalServerError - Integration', () => {
  it('renders with simulated error data without crashing', () => {
    const mockError = new Error('Simulated server error');
    const mockReset = vi.fn();

    const { container } = render(
      <InternalServerError error={mockError} resetErrorBoundary={mockReset} />
    );

    expect(container).toBeTruthy();
    expect(screen.getByText(/¡Ups! Algo salió mal/)).toBeInTheDocument();
    expect(screen.getByText('Simulated server error')).toBeInTheDocument();
  });
});
