import React from 'react';
import { Button } from '@/components/ui/button';

export default {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: [
        'default',
        'destructive',
        'outline',
        'secondary',
        'success',
        'info',
        'warning',
        'ghost',
        'link',
      ],
      description: 'Cambia el estilo del botón.',
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Ajusta el tamaño del botón.',
    },
    asChild: {
      control: 'boolean',
      description: 'Renderiza el botón como un elemento hijo personalizado.',
    },
  },
};

const Template = (args) => <Button {...args}>Click me</Button>;

export const Default = Template.bind({});
Default.args = {
  variant: 'default',
  size: 'default',
};

export const Destructive = Template.bind({});
Destructive.args = {
  variant: 'destructive',
  size: 'default',
};

export const Outline = Template.bind({});
Outline.args = {
  variant: 'outline',
  size: 'default',
};

export const Large = Template.bind({});
Large.args = {
  variant: 'default',
  size: 'lg',
};

export const Small = Template.bind({});
Small.args = {
  variant: 'default',
  size: 'sm',
};

export const IconButton = Template.bind({});
IconButton.args = {
  variant: 'default',
  size: 'icon',
};
