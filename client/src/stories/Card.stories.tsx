import { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardContent, CardFooter, CardDescription, CardTitle } from "@/components/ui/card";

const meta: Meta<typeof Card> = {
  title: 'UI/Components/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    className: {
      description: 'CSS classes to apply custom styles',
      control: 'text',
    },
    children: {
      description: 'Content to render inside the card',
      control: 'text',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Card>;


export const DefaultCard: Story = {
    args: {
      className: '',
      children: (
        <>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Description goes here</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the main content of the card.</p>
          </CardContent>
          <CardFooter>
            <button>Primary Action</button>
            <button>Secondary Action</button>
          </CardFooter>
        </>
      ),
    },
  };
  
  export const CardWithHeader: Story = {
    args: {
      children: (
        <CardHeader>
          <CardTitle>Header Title</CardTitle>
          <CardDescription>A short description.</CardDescription>
        </CardHeader>
      ),
    },
  };
  
  export const CardWithContent: Story = {
    args: {
      children: (
        <CardContent>
          <p>Main content goes here with some extra details.</p>
        </CardContent>
      ),
    },
  };
  
  export const CardWithFooter: Story = {
    args: {
      children: (
        <CardFooter>
          <button>Action 1</button>
          <button>Action 2</button>
        </CardFooter>
      ),
    },
  };
  
