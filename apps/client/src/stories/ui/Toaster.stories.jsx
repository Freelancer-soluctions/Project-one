import React from 'react'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'

export default {
  title: 'UI/Toaster',
  component: Toaster,
  parameters: {
    layout: 'centered'
  }
}

export const DefaultToaster = () => {
  const { toast } = useToast()

  return (
    <div className='flex flex-col items-center space-y-4'>
      <Button
        onClick={() =>
          toast({
            title: 'Notification',
            description: 'This is a sample toast notification.'
          })
        }>
        Show Toast
      </Button>
      <Toaster />
    </div>
  )
}
