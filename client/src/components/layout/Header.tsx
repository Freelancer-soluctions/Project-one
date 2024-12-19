import { useState } from 'react'
import { MdOutlineKeyboardArrowDown } from 'react-icons/md'
import { IoMdMenu } from 'react-icons/io'

const Header = () => {
  const [menu, setMenu] = useState<boolean>(false)

  return (
    <>
      {/* Header */}
      <nav className=' relative flex items-center md:flex-nowrap flex-wrap justify-between md:px-10 px-5 py-5 border-b border-gray-300 max-w-[1660px] mx-auto'>
        <a href='#' className='flex items-center'>
          <img src='/vite.svg' alt='logo' className='z-40 w-10 h-10 md:z-0' />
        </a>

        <IoMdMenu
          className='z-40 flex cursor-pointer w-7 h-7 md:hidden'
          onClick={() => setMenu(!menu)}
          aria-label={menu ? 'close-menu' : 'open-menu'}
        />

        {/* <ul className='flex items-center justify-center flex-1 gap-3 text-gray-400 md:gap-5'>
         
        </ul> */}

        <ul
          className={`md:flex flex-nowrap md:relative absolute w-full md:w-auto  md:gap-5 left-0 md:pt-0 pt-16  md:translate-y-0 md:bg-transparent scale-100 z-10 opacity-100 h-min gap-5 items-center ${
            menu
              ? 'translate-y-0 w-full top-0 opacity-100 h-screen bg-[#FCFCFC] z-30  md:px-10 px-5 py-20 md:py-0 '
              : '-translate-y-full opacity-0 bg-transparent'
          }
           md:h-auto md:opacity-100 md:bg-transparent`}>
          <li className='text-gray-400 '>
            <a href='#'>Funciones(FAQ)</a>
          </li>
          <li className='text-gray-400 '>
            <a href='#'>Funciones</a>
          </li>
          <li className='grid gap-3 md:flex'>
            <a
              className='bg-[#d9f2ff] py-3 px-4 rounded-2xl text-opacity-45 font-semibold text-sixth-color w-fit'
              href='#'>
              Iniciar sesión
            </a>
            <a
              className='px-4 py-3 font-semibold text-white bg-sixth-color w-fit rounded-2xl'
              href='#'>
              Crear cuenta
            </a>
          </li>
        </ul>
      </nav>

      {/* Contenido dinámico */}
      <div className='relative' style={{ height: 'calc(100vh - 80px)' }}>
        {/* Gradiente */}
        <div className='bg-gradient-to-r from-[#a4d1fa] to-transparent absolute z-10 w-full h-full'></div>

        <div className='absolute z-20 grid items-center w-full h-full px-5 py-3 pt-48 mx-auto md:w-1/2 md:px-10 md:items-start'>
          <div className='mx-auto space-y-16'>
            <h2 className='text-3xl font-normal tracking-tight text-center text-white md:text-5xl md:text-start'>
              La forma
              <span className='px-2 text-sixth-color'> más fácil y seguro</span>
              de enviar y recibir pagos online
            </h2>
            <div className='flex justify-center md:justify-start'>
              <button className='px-20 py-3 text-lg font-semibold text-white shadow-xl bg-sixth-color rounded-2xl'>
                Crear cuenta
              </button>
            </div>
          </div>
        </div>

        <img
          src='https://dm0qx8t0i9gc9.cloudfront.net/thumbnails/video/Vd3bj2jPe/videoblocks-smiling-businessman-working-on-laptop-computer-at-home-office-male-professional-typing-on-laptop-keyboard-at-office-workplace-portrait-of-positive-business-man-looking-at-laptop-screen-indoors_bfhjr_5md_thumbnail-1080_01.png'
          alt='example'
          className='object-cover w-full h-full'
        />
        <div className='absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center'>
          <MdOutlineKeyboardArrowDown className='w-20 h-20 text-white animate-bounce' />
        </div>
      </div>
    </>
  )
}

export default Header
