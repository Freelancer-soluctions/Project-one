import { CaretSortIcon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'

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
    cell: info => info.getValue()
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
    header: 'Closed On'
  }
]
export default columnDefNews
