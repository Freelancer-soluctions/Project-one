// import { CaretSortIcon } from '@radix-ui/react-icons'
// import { Button } from '@/components/ui/button'
import { format, parseISO } from 'date-fns'

export const columnDefNews = [
  {
    accessorKey: 'createdOn',
    header: 'Created On',
    // size: 270, //set column size for this column
    // header: ({ column }) => {
    //   return (
    //     <Button
    //       variant='ghost'
    //       onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
    //       Created On
    //       <CaretSortIcon className='w-4 h-4 ml-2' />
    //     </Button>
    //   )
    // },
    cell: info => format(info.getValue(), 'dd/MM/yyyy')
    // formatISO( "yyyy-MM-dd'T'HH:mm:ssXX")
  },
  {
    accessorKey: 'description',
    header: 'Description',
    // size: 1170, //set column size for this column
    // sortUndefined: 'last', //force undefined values to the end
    // sortDescFirst: false, //first sort order will be ascending (nullable values can mess up auto detection of sort order)
    cell: info => {
      const value = info.getValue();
      return value.length > 30 ? `${value.slice(0, 30)}...` : value;
    }
    
  },
  {
    accessorKey: 'status.description',
    header: 'Status'
  },
  {
    accessorKey: 'userNewsCreated.name',
    header: 'Created By',
    cell: info => {
      const userNewsCreated = info.row.original.userNewsCreated; // Accede al dato original de la fila
      return userNewsCreated?.name 
        ? userNewsCreated.name.toUpperCase() 
        : null; // Retorna null para mantener la celda vacía
    }
  },
  {
    accessorKey: 'userNewsPending.name',
    header: 'Pending By',
    cell: info => {
      const userNewsPending = info.row.original.userNewsPending; // Accede al dato original de la fila
      return userNewsPending?.name 
        ? userNewsPending.name.toUpperCase() 
        : null; // Retorna null para mantener la celda vacía
    }
  },
  {
    accessorKey: 'pendingOn',
    header: 'Pending On',
    cell: info =>
      info.getValue() ? format(info.getValue(), 'dd/MM/yyyy/hh:mm:s aaa') : ''
  },
  {
    accessorKey: 'userNewsClosed.name',
    header: 'Closed By',
    cell: info => {
      const userNewsClosed = info.row.original.userNewsClosed; // Accede al dato original de la fila
      return userNewsClosed?.name 
        ? userNewsClosed.name.toUpperCase() 
        : null; // Retorna null para mantener la celda vacía
    }
  },
  {
    accessorKey: 'closedOn',
    header: 'Closed On',
    cell: info =>
      info.getValue() ? format(info.getValue(), 'dd/MM/yyyy/hh:mm:s aaa') : ''
  }
]

