import { Meta, StoryFn } from "@storybook/react";
import { Calendar, CalendarProps } from "@/components/ui/calendar";

// Metadatos para Storybook
const meta: Meta<typeof Calendar> = {
  title: "UI/Components/Calendar", 
  component: Calendar,
  args: {
    showOutsideDays: true, 
  },
  parameters: {
    layout: "centered", 
  },
};

export default meta;

// Plantilla para las historias
const Template: StoryFn<CalendarProps> = (args: any) => <Calendar {...args} />;

// Historia básica
export const Default = Template.bind({});
Default.args = {};

// Historia con selección de rango
export const RangeSelection = Template.bind({});
RangeSelection.args = {
  mode: "range",
  selected: { from: new Date(2024, 10, 5), to: new Date(2024, 10, 10) },
};

// Historia con múltiples selecciones
export const MultipleSelection = Template.bind({});
MultipleSelection.args = {
  mode: "multiple",
  selected: [new Date(2024, 10, 5), new Date(2024, 10, 7), new Date(2024, 10, 10)],
};

// Historia personalizada con estilos
export const CustomStyles = Template.bind({});
CustomStyles.args = {
  className: "border border-red-500 p-4",
  classNames: {
    day: "text-blue-500 hover:text-blue-700",
    head_cell: "text-green-500",
  },
};
