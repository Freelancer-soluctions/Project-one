import { Meta, StoryFn } from "@storybook/react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

export default {
  title: "UI/Components/Dialog",
  component: Dialog,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    children: { control: { disable: true } },
  },
} as Meta;

// Template para la historia base
const Template: StoryFn = (_args) => (
  <Dialog>
    <DialogTrigger asChild>
      <button className="btn btn-primary">Open Dialog</button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Dialog Title</DialogTitle>
        <DialogDescription>
          This is a description for the dialog content.
        </DialogDescription>
      </DialogHeader>
      <p>This is the body of the dialog.</p>
      <DialogFooter>
        <button className="btn btn-secondary">Cancel</button>
        <button className="btn btn-primary">Confirm</button>
      </DialogFooter>
      <DialogClose />
    </DialogContent>
  </Dialog>
);

// Historia predeterminada
export const Default = Template.bind({});
Default.args = {};