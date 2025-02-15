// import { fn } from '@storybook/test'
// import { Button } from './ui/Button'

// // More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
// export default {
//   title: 'Example/Button',
//   component: Button,
//   parameters: {
//     // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
//     layout: 'centered'
//   },
//   // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
//   tags: ['autodocs'],
//   // More on argTypes: https://storybook.js.org/docs/api/argtypes
//   argTypes: {
//     backgroundColor: { control: 'color' }
//   },
//   // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
//   args: { onClick: fn() }
// }

// // More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
// export const Primary = {
//   args: {
//     primary: true,
//     label: 'Button'
//   }
// }

// export const Secondary = {
//   args: {
//     label: 'Button'
//   }
// }

// export const Large = {
//   args: {
//     size: 'large',
//     label: 'Button'
//   }
// }

// export const Small = {
//   args: {
//     size: 'small',
//     label: 'Button'
//   }
// }

// export const Warning = {
//   args: {
//     primary: true,
//     label: 'Delete now',
//     backgroundColor: 'red'
//   }
// }

import { action } from "@storybook/addon-actions"; // Importamos action para registrar eventos
import { Button } from "@/components/ui/button";

export default {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: 'centered' // Optional parameter to center the component in the Canvas. 
  }, 
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "destructive",
        "outline",
        "secondary",
        "success",
        "info",
        "warning",
        "ghost",
        "link",
      ],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
    children: { control: "text" },
  },
  args: {
    children: "Click me",
    variant: "default",
    size: "default",
    onClick: action("Button clicked!"), // Acción registrada
  },
};

export const Default = {};
export const Destructive = { args: { variant: "destructive",  label: 'Button' } };
export const Outline = { args: { variant: "outline" } };
export const Secondary = { args: { variant: "secondary" } };
export const Success = { args: { variant: "success" } };
export const Info = { args: { variant: "info" } };
export const Warning = { args: { variant: "warning" } };
export const Ghost = { args: { variant: "ghost" } };
export const Link = { args: { variant: "link" } };

export const Small = { args: { size: "sm" } };
export const Large = { args: { size: "lg" } };
export const Icon = { args: { size: "icon", children: "🔔" } };
