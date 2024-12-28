import { GoChevronLeft } from 'react-icons/go'
import { Link } from 'react-router-dom'

export const BackDashBoard = ({ link, moduleName }) => {
  return (
    <div className='px-0 py-5'>
      <Link
        to={link}
        className='inline-flex items-center text-lg transition-colors text-muted-foreground hover:text-foreground'>
        <GoChevronLeft className='mr-2 w-7 h-7' />
        {moduleName}
      </Link>
    </div>
  )
}
