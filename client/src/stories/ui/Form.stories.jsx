import React from 'react'
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'

export default {
  title: 'UI/Form',
  component: Form,
  parameters: {
    layout: 'centered'
  }
}

const Template = args => {
  const form = useForm({
    defaultValues: {
      name: ''
    }
  })

  const onSubmit = data => {
    console.log('Form submitted:', data)
  }

  return (
    <Form {...args} {...form} onSubmit={form.handleSubmit(onSubmit)}>
      <FormField
        name='name'
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre</FormLabel>
            <FormControl>
              <Input {...field} placeholder='Escribe tu nombre' />
            </FormControl>
            <FormDescription>Por favor, introduce tu nombre.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button type='submit'>Enviar</Button>
    </Form>
  )
}

export const Default = Template.bind({})
