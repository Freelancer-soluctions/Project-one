import React from 'react'
import { Input } from '@/components/ui/input'
// A typical debounced input react component
function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}) {
  const [value, setValue] = React.useState(initialValue)

  React.useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  React.useEffect(() => {
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

export default DebouncedInput
