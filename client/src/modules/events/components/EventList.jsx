import { LuPencil, LuTrash2 } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { EventTypeCodes } from '../utils'

export function EventList({ events, onEdit, onDelete }) {
  const getEventTypeColor = type => {
    switch (type) {
      case EventTypeCodes.CONFERENCE:
        return 'bg-emerald-100 text-emerald-800'
      case EventTypeCodes.WORKSHOP:
        return 'bg-blue-100 text-blue-800'
      case EventTypeCodes.SESSION:
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Sort events by date and time
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(`${a.eventDate}T${a.startTime}`)
    const dateB = new Date(`${b.eventDate}T${b.startTime}`)
    return dateA.getTime() - dateB.getTime()
  })

  // Group events by date
  const groupedEvents = sortedEvents.reduce((groups, event) => {
    const date = event.eventDate
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(event)
    return groups
  }, {})

  return events.length > 0 ? (
    <div className='space-y-8'>
      {Object.entries(groupedEvents).map(([date, dateEvents]) => (
        <div key={date} className='space-y-4'>
          <h2 className='text-lg font-semibold sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2'>
            {format(new Date(date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </h2>
          {dateEvents.map(event => (
            <div
              key={event.id}
              className='grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-4 items-start rounded-lg border p-4 transition-colors hover:bg-muted/50'>
              <div className='flex items-center justify-between text-sm sm:block'>
                <div className='font-medium'>{event.startTime}</div>
                <div className='text-muted-foreground'>{event.endTime}</div>
              </div>
              <div className='flex flex-col justify-between gap-4 sm:flex-row'>
                <div className='space-y-1'>
                  <div className='font-semibold'>{event.title}</div>
                  <div className='text-sm text-muted-foreground'>
                    {event.speaker}
                  </div>
                  <div className='text-sm'>{event.description}</div>
                  <div className='mt-2'>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getEventTypeColor(event.eventTypeCode)}`}>
                      {event.eventTypeDescription}
                    </span>
                  </div>
                </div>
                <div className='flex gap-2'>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => onEdit(event)}>
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
      ))}
    </div>
  ) : (
    <div className='text-lg text-center text-muted-foreground'>
      No hay eventos disponibles
    </div>
  )
}

//   return (
//     <div className='space-y-4'>
//       {events.map(event => (
//         <div
//           key={event.id}
//           className='grid grid-cols-[120px_1fr] gap-4 items-center rounded-lg border p-4 transition-colors hover:bg-muted/50'>
//           <div className='text-sm'>
//             <div className='font-medium'>{event.startTime}</div>
//             <div className='text-muted-foreground'>{event.endTime}</div>
//           </div>
//           <div className='flex items-start justify-between'>
//             <div>
//               <div className='font-semibold'>{event.title}</div>
//               <div className='mb-2 text-sm text-muted-foreground'>
//                 {event.speaker}
//               </div>
//               <div className='text-sm'>{event.description}</div>
//               <div className='mt-2'>
//                 <span
//                   className={`text-xs px-2 py-1 rounded-full ${getEventTypeColor(event.type)}`}>
//                   {event.type}
//                 </span>
//               </div>
//             </div>
//             <div className='flex gap-2'>
//               <Button variant='ghost' size='icon' onClick={() => onEdit(event)}>
//                 <LuPencil className='w-4 h-4' />
//               </Button>
//               <Button
//                 variant='ghost'
//                 size='icon'
//                 onClick={() => onDelete(event.id)}>
//                 <LuTrash2 className='w-4 h-4' />
//               </Button>
//             </div>
//           </div>
//         </div>
//       ))}
//     </div>
//   )
// }
