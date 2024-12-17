import { Textarea } from "@/components/ui/textarea";
import { StoryObj } from "@storybook/react";

const meta = {
    title: 'UI/Components/Textarea',
    component: Textarea,
    tags: ['autodocs'],
    parameters: {
      layout: 'centered',
    },
    argTypes: {
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


  export const BasicTextarea: Story = {
    args: {
      placeholder: 'Enter your text here',
    },
  };
  
  export const DisabledTextarea: Story = {
    args: {
      placeholder: 'Disabled textarea',
      disabled: true,
    },
  };