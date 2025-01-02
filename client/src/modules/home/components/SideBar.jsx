import {
  AiOutlineHome,
  AiOutlineSetting,
  AiOutlineLogout
} from 'react-icons/ai'
import { MdNewspaper, MdEventAvailable } from 'react-icons/md'
import { Link } from 'react-router'

const SideBar = () => {
  return (
    <>
      <Link
        to={'/home'}
        className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
        prefetch={false}>
        <AiOutlineHome className='w-5 h-5' />
        Home
      </Link>
      <Link
        href='#'
        className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
        prefetch={false}>
        <MdNewspaper className='w-5 h-5' />
        News
      </Link>
      <Link
        href='#'
        className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
        prefetch={false}>
        <AiOutlineSetting className='w-5 h-5' />
        Settings
      </Link>
      <Link
        href='#'
        className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
        prefetch={false}>
        <MdEventAvailable className='w-5 h-5' />
        Events
      </Link>
      <Link
        href='#'
        className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
        prefetch={false}>
        <AiOutlineLogout className='w-5 h-5' />
        Log out
      </Link>
    </>
  )
}

export default SideBar
