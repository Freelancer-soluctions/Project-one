import Spinner from '@/components/loader/Spinner';
import { render, screen } from '@testing-library/react';

test('renders spinner', () => {
    render(<Spinner />);
  
    const spinnerElement = screen.getByTestId('spinner');
    expect(spinnerElement).toBeInTheDocument();
  });
  