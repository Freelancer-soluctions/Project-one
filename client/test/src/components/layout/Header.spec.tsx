
import Header from '@/components/layout/Header';
import { render, screen } from '@testing-library/react';

test('renders Footer component', () => {
  render(<Header />);

  const footerElement = screen.getByText('Header');
  expect(footerElement).toBeInTheDocument();
});