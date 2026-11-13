import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import PropTypes from 'prop-types';

// A typical debounced input react component
export function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}) {
  const [value, setValue] = useState(initialValue);
  const [syncedInitialValue, setSyncedInitialValue] = useState(initialValue);

  // Ajuste en render (no en efecto): evita el render en cascada.
  if (initialValue !== syncedInitialValue) {
    setSyncedInitialValue(initialValue);
    setValue(initialValue);
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value, debounce, onChange]);

  return (
    <Input
      onChange={(e) => setValue(e.target.value)}
      {...props}
      value={value ?? ''}
    />
    // <input {...props} value={value} onChange={} />
  );
}

DebouncedInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  debounce: PropTypes.number,
};
