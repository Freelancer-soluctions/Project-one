import Filter from '@/components/dataTable/Filter';
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

describe('Filter component', () => {
  let mockColumn: any;

  beforeEach(() => {
    mockColumn = {
      getFilterValue: vi.fn(),
      setFilterValue: vi.fn(),
      columnDef: {
        meta: {}
      }
    }
  })

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders a text filter by default', () => {
    vi.useFakeTimers(); // Enable fake timers to handle debounce

    mockColumn.getFilterValue.mockReturnValue('search value');

    render(<Filter column={mockColumn} />);

    const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
    expect(input.value).to.equal('search value'); // Cambiado aquí

    // Simulate change in text input
    fireEvent.change(input, { target: { value: 'new value' } });

    // Advance timers to process debounce
    vi.advanceTimersByTime(500);

    expect(mockColumn.setFilterValue).toHaveBeenCalledWith('new value');

    vi.useRealTimers(); // Restore real timers
  });
});
