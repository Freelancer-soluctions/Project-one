import Loader from '@/components/loader/Loader';
import { render, screen } from '@testing-library/react';

test('renders Loader component', () => {
  render(<Loader />);

  const footerElement = screen.getByText('Loading ...');
  expect(footerElement).toBeInTheDocument();
});