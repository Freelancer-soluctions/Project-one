import React from 'react';
import { Switch } from '@/components/ui/switch';

export default {
  title: 'UI/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
  },
};

const Template = (args) => <Switch {...args} />;

export const Default = Template.bind({});
Default.args = {};
