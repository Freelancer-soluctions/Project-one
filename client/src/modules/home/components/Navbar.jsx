import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { MenuIcon, MountainIcon } from '../../../utils/icons/icons'

const NavBar = () => {
  return (
    <header className='flex items-center justify-between px-4 py-3 shadow-sm bg-primary text-primary-foreground md:px-6'>
      <div className='flex items-center gap-4'>
        <Button
          variant='ghost'
          size='icon'
          className='lg:hidden'
          onClick={() => {
            document.querySelector('.lg\\:flex').classList.toggle('hidden')
          }}>
          <MenuIcon className='w-6 h-6' />
          <span className='sr-only'>Toggle navigation</span>
        </Button>
        <Link
          href='#'
          className='flex items-center gap-2 font-bold'
          prefetch={false}>
          <MountainIcon className='w-6 h-6' />
          <span className='sr-only'>Dashboard</span>
        </Link>
      </div>
      <div className='flex items-center gap-2'>
        <Button variant='ghost' size='icon' className='rounded-full'>
          <img
            src='/placeholder.svg'
            width='32'
            height='32'
            className='rounded-full'
            alt='Avatar'
          />
          <span className='sr-only'>User menu</span>
        </Button>
      </div>
    </header>
  )
}

export default NavBar
