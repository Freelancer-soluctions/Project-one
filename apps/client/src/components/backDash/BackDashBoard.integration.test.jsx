import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect } from 'vitest';
import BackDashBoard from './BackDashBoard';

describe('BackDashBoard - Integration', () => {
  it('renders link with correct href', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <BackDashBoard link="/dashboard" moduleName="Dashboard" />
      </MemoryRouter>
    );
    const link = screen.getByText('Dashboard').closest('a');
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe('/dashboard');
  });
});
