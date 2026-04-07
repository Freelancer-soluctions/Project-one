import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProtectedRoutes } from './ProtectedRoutes';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router';

vi.mock('../../utils/jwt-decode', () => ({
  getUserFromToken: () => ({ id: 1 }),
}));

describe('ProtectedRoutes - Unit', () => {
  const mockAuthState = {
    user: { data: { user: { id: 1 } } },
    isAuth: true,
  };

  const createMockStore = (authState = mockAuthState) =>
    configureStore({
      reducer: {
        auth: (state = authState) => state,
      },
    });

  it('renders children when user is authenticated', () => {
    const store = createMockStore();
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
