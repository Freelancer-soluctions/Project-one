import { Input } from '@/components/ui/input';
import { StoryObj } from '@storybook/react';


const meta = {
    title: 'UI/Components/Input',
    component: Input,
    tags: ['autodocs'],
    parameters: {
      layout: 'centered',
    },
    argTypes: {
      type: {
        control: 'select',
        options: ['text', 'email', 'password', 'number', 'file'],
      },
      placeholder: {
        control: 'text',
      },
      disabled: {
        control: 'boolean',
      },
    },
  };
  
  export default meta;
  type Story = StoryObj<typeof meta>;

  export const TextInput: Story = {
    args: {
      type: 'text',
      placeholder: 'Enter text',
    },
  };
  
  export const EmailInput: Story = {
    args: {
      type: 'email',
      placeholder: 'Enter email',
    },
  };
  
  export const PasswordInput: Story = {
    args: {
      type: 'password',
      placeholder: 'Enter password',
    },
  };
  
  export const NumberInput: Story = {
    args: {
      type: 'number',
      placeholder: 'Enter number',
    },
  };
  
  export const FileInput: Story = {
    args: {
      type: 'file',
      placeholder: 'Choose a file',
    },
  };
  
  export const DisabledInput: Story = {
    args: {
      type: 'text',
      placeholder: 'Disabled input',
      disabled: true,
    },
  };