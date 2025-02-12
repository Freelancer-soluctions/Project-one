import { LuPencil, LuTrash2 } from 'react-icons/lu'

import { Button } from '@/components/ui/button'

export function EventList({ events, onEdit, onDelete }) {
  const getEventTypeColor = type => {
    switch (type) {
      case 'conference':
        return 'bg-emerald-100 text-emerald-800'
      case 'workshop':
        return 'bg-blue-100 text-blue-800'
      case 'session':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className='space-y-4'>
      {events.map(event => (
        <div
          key={event.id}
          className='grid grid-cols-[120px_1fr] gap-4 items-center rounded-lg border p-4 transition-colors hover:bg-muted/50'>
          <div className='text-sm'>
            <div className='font-medium'>{event.startTime}</div>
            <div className='text-muted-foreground'>{event.endTime}</div>
          </div>
          <div className='flex items-start justify-between'>
            <div>
              <div className='font-semibold'>{event.title}</div>
              <div className='mb-2 text-sm text-muted-foreground'>
                {event.speaker}
              </div>
              <div className='text-sm'>{event.description}</div>
              <div className='mt-2'>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${getEventTypeColor(event.type)}`}>
                  {event.type}
                </span>
              </div>
            </div>
            <div className='flex gap-2'>
              <Button variant='ghost' size='icon' onClick={() => onEdit(event)}>
                <LuPencil className='w-4 h-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => onDelete(event.id)}>
                <LuTrash2 className='w-4 h-4' />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
