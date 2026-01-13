import React from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
} from '@/components/ui/popover';

export default {
  title: 'UI/Popover',
  component: Popover,
  parameters: {
    layout: 'centered',
  },
};

const Template = (args) => (
  <Popover>
    <PopoverTrigger {...args}>Abrir Popover</PopoverTrigger>
    <PopoverContent>Contenido del Popover</PopoverContent>
  </Popover>
);

export const Default = Template.bind({});
Default.args = {};
