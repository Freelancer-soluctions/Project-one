import { Label } from '@/components/ui/label';
import { render, screen } from '@testing-library/react';

test('renders a label', () => {
  render(<Label htmlFor="input-id">Label Text</Label>);

  const labelElement = screen.getByText('Label Text');
  expect(labelElement).toBeInTheDocument();
  expect(labelElement).toHaveAttribute('for', 'input-id');
});

test('renders a disabled label', () => {
    render(<Label htmlFor="input-id" >Disabled Label</Label>);
  
    const labelElement = screen.getByText('Disabled Label');
    expect(labelElement).toHaveClass('peer-disabled:cursor-not-allowed peer-disabled:opacity-70');
  });

  test('renders with custom class names', () => {
    render(<Label htmlFor="input-id" className="text-red-500">Custom Label</Label>);
  
    const labelElement = screen.getByText('Custom Label');
    expect(labelElement).toHaveClass('text-red-500');
  });