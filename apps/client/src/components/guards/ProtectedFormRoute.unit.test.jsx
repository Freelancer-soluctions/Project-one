import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProtectedFormRoute } from './ProtectedFormRoute';
import { MemoryRouter } from 'react-router';

describe('ProtectedFormRoute - Unit', () => {
  it('renders children when state is present', () => {
    render(
      <MemoryRouter
        initialEntries={[{ pathname: '/form', state: { fromForm: true } }]}
      >
        <ProtectedFormRoute>
          <div>Form Content</div>
        </ProtectedFormRoute>
      </MemoryRouter>
    );
    expect(screen.getByText('Form Content')).toBeInTheDocument();
  });
});
