import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DebouncedInput from '@/components/dataTable/DebouncedInput'
import '@testing-library/jest-dom'



describe('DebouncedInput', () => {
  it('renders with the initial value', () => {
    render(
      <DebouncedInput
        value="initial value"
        onChange={() => {}}
        debounce={500}
      />
    )

    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('initial value')
  })

  it('updates the value when typing', async () => {
    const handleChange = vi.fn() // Mock function for `onChange`
    render(
      <DebouncedInput
        value=""
        onChange={handleChange}
        debounce={300}
      />
    )

    const input = screen.getByRole('textbox')

    // Simulate typing
    fireEvent.change(input, { target: { value: 'Hello' } })

    // The input's value should update immediately
    expect(input).toHaveValue('Hello')

    // Wait for the debounce effect to trigger the onChange function
    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith('Hello')
    }, { timeout: 400 }) // Slightly more than the debounce time
  })

  it('resets the value when the initial value changes', () => {
    const { rerender } = render(
      <DebouncedInput
        value="initial value"
        onChange={() => {}}
        debounce={500}
      />
    )

    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('initial value')

    // Rerender with a new value
    rerender(
      <DebouncedInput
        value="new value"
        onChange={() => {}}
        debounce={500}
      />
    )

    expect(input).toHaveValue('new value')
  })
})
