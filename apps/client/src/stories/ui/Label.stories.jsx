import React from 'react';
import { Label } from '@/components/ui/label';

export default {
  title: 'UI/Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
};

const Template = (args) => <Label {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: 'Etiqueta de ejemplo',
};
