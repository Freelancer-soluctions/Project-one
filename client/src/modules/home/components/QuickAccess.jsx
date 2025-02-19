'use client'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { NotesSummary } from './notes-summary'
import { LuStickyNote } from 'react-icons/lu'

export function QuickAccessButton() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='link'
          size='sm'
          className='gap-2 px-0 font-normal text-muted-foreground hover:text-primary'>
          <LuStickyNote className='w-4 h-4' />
          Acceso Rápido
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80' align='start'>
        <NotesSummary columns={columns} />
      </PopoverContent>
    </Popover>
  )
}
