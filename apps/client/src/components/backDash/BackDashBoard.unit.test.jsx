import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BackDashBoard } from './BackDashBoard';

vi.mock('react-router', () => ({
  // eslint-disable-next-line react/prop-types
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));

describe('BackDashBoard - Unit', () => {
  it('renders moduleName text', () => {
    render(<BackDashBoard link="/dashboard" moduleName="Dashboard" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
