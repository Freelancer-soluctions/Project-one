import React from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export default {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'centered'
  }
}

const Template = args => (
  <RadioGroup {...args}>
    <RadioGroupItem value='option1' /> Opción 1
    <RadioGroupItem value='option2' /> Opción 2
    <RadioGroupItem value='option3' /> Opción 3
  </RadioGroup>
)

export const Default = Template.bind({})
Default.args = {}
