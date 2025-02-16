import React from 'react'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem
} from '@/components/ui/select'

export default {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered'
  }
}

export const Default = () => (
  <Select>
    <SelectTrigger className='w-56'>Selecciona una opción</SelectTrigger>
    <SelectContent>
      <SelectItem value='opcion1'>Opción 1</SelectItem>
      <SelectItem value='opcion2'>Opción 2</SelectItem>
      <SelectItem value='opcion3'>Opción 3</SelectItem>
    </SelectContent>
  </Select>
)
