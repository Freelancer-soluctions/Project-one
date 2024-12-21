// import { CaretSortIcon } from '@radix-ui/react-icons'
// import { Button } from '@/components/ui/button'
import { format, parseISO } from 'date-fns'

const columnDefNews = [
  {
    accessorKey: 'createdOn',
    header: 'Created On',
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
    // sortUndefined: 'last', //force undefined values to the end
    // sortDescFirst: false, //first sort order will be ascending (nullable values can mess up auto detection of sort order)
    cell: info => info.getValue()
  },
  {
    accessorKey: 'status.description',
    header: 'Status'
  },
  {
    accessorKey: 'userNewsCreated.name',
    header: 'Created By'
  },
  {
    accessorKey: 'userNewsClosed.name',
    header: 'Closed By'
  },
  {
    accessorKey: 'closedOn',
    header: 'Closed On',
    cell: info =>
      info.getValue() ? format(info.getValue(), 'dd/MM/yyyy/hh:mm:s aaa') : ''
  }
]
export default columnDefNews
