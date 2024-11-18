import { Input } from '@/components/ui/input';
import { render, screen } from '@testing-library/react';

test('renders an input element', () => {
  render(<Input type="text" />);

  const inputElement = screen.getByRole('textbox');
  expect(inputElement).toBeInTheDocument();
});

test('renders a disabled input', () => {
  render(<Input type="text" disabled />);

  const inputElement = screen.getByRole('textbox');
  expect(inputElement).toBeDisabled();
});


test('renders with custom HTML attributes', () => {
  render(<Input type="text" placeholder="Enter your name" />);

  const inputElement = screen.getByRole('textbox');
  expect(inputElement).toHaveAttribute('placeholder', 'Enter your name');
});