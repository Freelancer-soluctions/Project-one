import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { AiOutlineMenu } from 'react-icons/ai'
import { SiAnalogue } from 'react-icons/si'

const NavBar = () => {
  return (
    <>
      <div className='flex items-center gap-4'>
        <Button
          variant='ghost'
          size='icon'
          className='lg:hidden'
          onClick={() => {
            document.querySelector('.lg\\:flex').classList.toggle('hidden')
          }}>
          <AiOutlineMenu className='w-6 h-6' />
          <span className='sr-only'>Toggle navigation</span>
        </Button>
        <Link
          href='#'
          className='flex items-center gap-2 font-bold'
          prefetch={false}>
          <SiAnalogue className='w-6 h-6' />
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
    </>
  )
}

export default NavBar
