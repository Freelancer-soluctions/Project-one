import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'

// A typical debounced input react component
export function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value])

  return (
    <Input
      onChange={e => setValue(e.target.value)}
      {...props}
      value={value ?? ''}
    />
    // <input {...props} value={value} onChange={} />
  )
}
