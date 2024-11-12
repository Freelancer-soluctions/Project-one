import React, { ChangeEvent } from 'react'
import { Input } from '@/components/ui/input'
// A typical debounced input react component

interface PropsDebouncedInput{
  value: string;
  onChange : (value:string)=> void;
  debounce:number
}
function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: PropsDebouncedInput) {
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

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  return (
      <Input
        type='text'
        onChange={handleChange}
        {...props}
        value={value ?? ''}
      />
    // <input {...props} value={value} onChange={} />
  )
}

export default DebouncedInput
