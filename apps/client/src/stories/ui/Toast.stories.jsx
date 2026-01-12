import React from 'react'
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction
} from '@/components/ui/toast'

export default {
  title: 'UI/Toast',
  component: Toast,
  parameters: {
    layout: 'centered'
  }
}

export const DefaultToast = () => (
  <ToastProvider>
    <div className='flex flex-col space-y-4'>
      <Toast>
        <div className='flex flex-col space-y-1'>
          <ToastTitle>Notification</ToastTitle>
          <ToastDescription>This is a default toast message.</ToastDescription>
        </div>
        <ToastClose />
      </Toast>
    </div>
    <ToastViewport />
  </ToastProvider>
)

export const DestructiveToast = () => (
  <ToastProvider>
    <div className='flex flex-col space-y-4'>
      <Toast variant='destructive'>
        <div className='flex flex-col space-y-1'>
          <ToastTitle>Error</ToastTitle>
          <ToastDescription>
            This is a destructive toast message.
          </ToastDescription>
        </div>
        <ToastClose />
      </Toast>
    </div>
    <ToastViewport />
  </ToastProvider>
)

export const ToastWithAction = () => (
  <ToastProvider>
    <div className='flex flex-col space-y-4'>
      <Toast>
        <div className='flex flex-col space-y-1'>
          <ToastTitle>Undo Action</ToastTitle>
          <ToastDescription>You deleted a file. Undo?</ToastDescription>
        </div>
        <ToastAction altText='Undo'>Undo</ToastAction>
        <ToastClose />
      </Toast>
    </div>
    <ToastViewport />
  </ToastProvider>
)
