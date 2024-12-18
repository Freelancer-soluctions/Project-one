import {
  AiOutlineHome,
  AiOutlineSetting,
  AiOutlineLogout
} from 'react-icons/ai'
import { MdNewspaper, MdEventAvailable } from 'react-icons/md'
import { Link } from 'react-router-dom'

const SideBar = () => {
  return (
    <>
      <Link
        to='#'
        className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
        >
        <AiOutlineHome className='w-5 h-5' />
        Home
      </Link>
      <Link
        to='#'
        className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
        >
        <MdNewspaper className='w-5 h-5' />
        News
      </Link>
      <Link
        to='#'
        className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
        >
        <AiOutlineSetting className='w-5 h-5' />
        Settings
      </Link>
      <Link
        to='#'
        className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
        >
        <MdEventAvailable className='w-5 h-5' />
        Events
      </Link>
      <Link
        to='#'
        className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
        >
        <AiOutlineLogout className='w-5 h-5' />
        Log out
      </Link>
    </>
  )
}

export default SideBar
