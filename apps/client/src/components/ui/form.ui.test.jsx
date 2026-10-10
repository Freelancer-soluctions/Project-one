import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';

// Subárbol del campo, no un formulario completo con validación: valores
// fijos por defecto, sin estado touched/dirty que pudiera alterar el snapshot.
function EmailField() {
  const form = useForm({ defaultValues: { email: '' } });
  return (
    <Form {...form}>
      <FormField
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input {...field} placeholder="you@example.com" />
            </FormControl>
            <FormDescription>Your work email.</FormDescription>
          </FormItem>
        )}
      />
    </Form>
  );
}

describe('Form - UI snapshot', () => {
  it('renders a single field subtree with fixed default values', () => {
    const { container } = render(<EmailField />);
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        class="space-y-2"
      >
        <label
          class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          for=":r0:-form-item"
        >
          Email
        </label>
        <input
          aria-describedby=":r0:-form-item-description"
          aria-invalid="false"
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          id=":r0:-form-item"
          name="email"
          placeholder="you@example.com"
          value=""
        />
        <p
          class="text-[0.8rem] text-muted-foreground"
          id=":r0:-form-item-description"
        >
          Your work email.
        </p>
      </div>
    `,
      'form field subtree with label, input and description'
    );
  });
});
