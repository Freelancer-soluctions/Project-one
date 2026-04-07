import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import InternalServerError from './InternalServerError';

describe('InternalServerError - Unit', () => {
  it('renders error and button, and calls resetErrorBoundary on click', () => {
    const reset = vi.fn();
    render(
      <InternalServerError
        error={new Error('Test')}
        resetErrorBoundary={reset}
      />
    );
    expect(screen.getByText(/¡Ups! Algo salió mal/)).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /Volver al inicio/i });
    fireEvent.click(btn);
    expect(reset).toHaveBeenCalled();
  });
});
