import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProtectedRoutes } from './ProtectedRoutes';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router';

vi.mock('../../utils/jwt-decode', () => ({
  getUserFromToken: () => ({ id: 1 }),
}));

describe('ProtectedRoutes - Integration', () => {
  it('renders children when user is authenticated', () => {
    const store = configureStore({
      reducer: {
        auth: () => ({
          user: { data: { user: { id: 1 } } },
          isAuth: true,
        }),
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ProtectedRoutes redirectTo="/login">
            <div>Protected Content</div>
          </ProtectedRoutes>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
