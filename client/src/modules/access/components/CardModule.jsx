import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Link } from 'react-router'
import { MdNewspaper } from 'react-icons/md'
import { CgNotes } from 'react-icons/cg'
const CardModule = () => {
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between pb-2'>
          <CardTitle className='text-sm font-medium'>Notes</CardTitle>
          <CgNotes className='w-4 h-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <Link
            to={'notes'}
            className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'>
            Go to notes
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between pb-2'>
          <CardTitle className='text-sm font-medium'>News</CardTitle>
          <MdNewspaper className='w-4 h-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <Link
            to={'news'}
            className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'>
            Go to news
          </Link>
        </CardContent>
      </Card>

      {/* <Card
          className='p-4 bg-white rounded-lg shadow-md cursor-grab'
          draggable
          onDragStart={e => handleCardDragStart(e, card)}>
          <CardHeader className='flex items-center mb-2'>
            <CardTitle>cfdfdfdf</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-gray-500'>sdsdsdsdsds</p>
          </CardContent>
        </Card> */}

      {/* <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Notes</CardTitle>
            <DollarSignIcon className='w-4 h-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <Link
              href='#'
              className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'>
              Products
            </Link>
            <div className='text-2xl font-bold'>$45,231.89</div>
            <p className='text-xs text-muted-foreground'>
              +20.1% from last month
            </p>
          </CardContent>
        </Card> */}
    </div>
  )
}

export default CardModule
