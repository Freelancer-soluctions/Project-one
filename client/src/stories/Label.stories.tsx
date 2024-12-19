import { Label } from "@/components/ui/label";
import { StoryObj } from "@storybook/react";

const meta = {
    title: 'UI/Components/Label',
    component: Label,
    tags: ['autodocs'],
    parameters: {
      layout: 'centered',
    },
    argTypes: {
      htmlFor: {
        control: 'text',
      },
      children: {
        control: 'text',
      },
    },
  };
  
  export default meta;
  type Story = StoryObj<typeof meta>;


  export const BasicLabel: Story = {
    args: {
      children: 'Label Text',
    },
  };
  
  export const LabelForInput: Story = {
    args: {
      htmlFor: 'my-input',
      children: 'Input Label',
    },
    render: (args) => (
      <div>
        <Label {...args} />
        <input id="my-input" />
      </div>
    ),
  };