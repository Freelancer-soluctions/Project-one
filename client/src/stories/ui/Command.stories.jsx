import React from 'react'
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
  CommandShortcut
} from '@/components/ui/command'

export default {
  title: 'UI/Command',
  component: Command,
  parameters: {
    layout: 'centered'
  }
}

const Template = args => (
  <Command {...args}>
    <CommandInput placeholder='Search...' />
    <CommandList>
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandGroup heading='Suggestions'>
        <CommandItem>
          Profile <CommandShortcut>⌘P</CommandShortcut>
        </CommandItem>
        <CommandItem>
          Settings <CommandShortcut>⌘S</CommandShortcut>
        </CommandItem>
        <CommandItem>
          Logout <CommandShortcut>⌘L</CommandShortcut>
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </Command>
)

export const Default = Template.bind({})
Default.args = {}

export const WithDialog = () => (
  <CommandDialog open={true}>
    <CommandInput placeholder='Type a command...' />
    <CommandList>
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandGroup heading='Actions'>
        <CommandItem>
          New File <CommandShortcut>⌘N</CommandShortcut>
        </CommandItem>
        <CommandItem>
          Open File <CommandShortcut>⌘O</CommandShortcut>
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </CommandDialog>
)
