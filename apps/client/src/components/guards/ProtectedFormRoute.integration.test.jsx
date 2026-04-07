import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProtectedFormRoute } from './ProtectedFormRoute';
import { MemoryRouter, Routes, Route } from 'react-router';

describe('ProtectedFormRoute - Integration', () => {
  it('redirects to /home when state is missing', () => {
    render(
      <MemoryRouter initialEntries={['/form']}>
        <Routes>
          <Route
            path="/form"
            element={
              <ProtectedFormRoute>
                <div>Form Content</div>
              </ProtectedFormRoute>
            }
          />
          <Route path="/home" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Form Content')).not.toBeInTheDocument();
  });
});
