import React from 'react'
import { Calendar } from '@/components/ui/calendar'

export default {
  title: 'UI/Calendar',
  component: Calendar,
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    mode: {
      control: { type: 'select' },
      options: ['single', 'multiple', 'range'],
      description: 'Selecciona el modo de selección de fechas.'
    },
    showOutsideDays: {
      control: 'boolean',
      description: 'Muestra días fuera del mes actual.'
    },
    disabledDays: {
      control: 'array',
      description: 'Lista de fechas deshabilitadas.'
    },
    selected: {
      control: 'date',
      description: 'Fecha(s) seleccionada(s) en el calendario.'
    }
  }
}

const Template = args => <Calendar {...args} />

export const Default = Template.bind({})
Default.args = {
  mode: 'single',
  showOutsideDays: true
}

export const MultipleSelection = Template.bind({})
MultipleSelection.args = {
  mode: 'multiple',
  showOutsideDays: true
}

export const RangeSelection = Template.bind({})
RangeSelection.args = {
  mode: 'range',
  showOutsideDays: true
}

export const DisabledDays = Template.bind({})
DisabledDays.args = {
  mode: 'single',
  showOutsideDays: true,
  disabledDays: [new Date(2025, 1, 15), new Date(2025, 1, 20)]
}

export const PreselectedDate = Template.bind({})
PreselectedDate.args = {
  mode: 'single',
  showOutsideDays: true,
  selected: new Date()
}
