import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router';
import { BackDashBoard } from './BackDashBoard';

describe('BackDashBoard - Unit', () => {
  it('renders moduleName text', () => {
    render(
      <MemoryRouter>
        <BackDashBoard link="/dashboard" moduleName="Dashboard" />
      </MemoryRouter>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
