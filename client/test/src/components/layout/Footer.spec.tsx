import Footer from '@/components/layout/Footer';
import { render, screen } from '@testing-library/react';

test('renders Footer component', () => {
  render(<Footer />);

  const footerElement = screen.getByText('Footer');
  expect(footerElement).toBeInTheDocument();
});