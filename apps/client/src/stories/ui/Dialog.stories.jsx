import React from 'react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default {
  title: 'UI/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered'
  }
}

const Template = args => (
  <Dialog {...args}>
    <DialogTrigger asChild>
      <Button variant='default'>Abrir Diálogo</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogTitle>Diálogo de Ejemplo</DialogTitle>
      <DialogDescription>
        Este es un ejemplo de diálogo utilizando el componente Dialog.
      </DialogDescription>
    </DialogContent>
  </Dialog>
)

export const Default = Template.bind({})
