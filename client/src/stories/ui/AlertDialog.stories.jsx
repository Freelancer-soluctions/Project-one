import React from 'react'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel
} from '@/components/ui/alert-dialog'

export default {
  title: 'UI/AlertDialog',
  component: AlertDialog,
  parameters: {
    layout: 'centered' // Optional parameter to center the component in the Canvas.
  }
}

const Template = args => (
  <AlertDialog {...args}>
    <AlertDialogTrigger asChild>
      <button className='px-4 py-2 text-white bg-blue-500 rounded-md'>
        Open Alert
      </button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
        <AlertDialogDescription>
          This action cannot be undone. This will permanently delete your
          account and remove your data from our servers.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction variant='destructive'>Confirm</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)

export const Default = Template.bind({})
Default.args = {}
