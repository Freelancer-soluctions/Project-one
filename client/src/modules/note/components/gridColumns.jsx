import { parseISO } from 'date-fns'
import { format, toZonedTime } from 'date-fns-tz'
import GridActions from './gridActions'

const columns = ({ onDelete, onEdit }) => [
  {
    accessorKey: 'note',
    header: 'Note'
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const { description } = row.getValue('status')
      return <span className='text-right'>{description}</span>
    }
  },
  {
    accessorKey: 'userNoteClosed',
    header: 'Closed By',
    cell: ({ row }) => {
      const { email } = row.getValue('userNoteClosed')
      return <span className='text-right'>{email}</span>
    }
  },
  {
    accessorKey: 'userNoteCreated',
    header: 'Created By',
    cell: ({ row }) => {
      const { email } = row.getValue('userNoteCreated')
      return <span className='text-right'>{email}</span>
    }
  },
  {
    accessorKey: 'createdOn',
    header: 'Created On',
    cell: ({ row }) => {
      const date = row.getValue('createdOn')
      return (
        <span className='text-right'>
          {format(toZonedTime(parseISO(date), 'UTC'), 'yyyy-MM-dd', {
            timeZone: 'UTC'
          })}
        </span>
      )
    }
  },
  {
    accessorKey: 'closedOn',
    header: 'Closed On',
    cell: ({ row }) => {
      const date = row.getValue('closedOn')
      return (
        <span className='text-right'>
          {format(toZonedTime(parseISO(date), 'UTC'), 'yyyy-MM-dd', {
            timeZone: 'UTC'
          })}
        </span>
      )
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return <GridActions row={row} onDelete={onDelete} onEdit={onEdit} />
    }
  }
]

export default columns
