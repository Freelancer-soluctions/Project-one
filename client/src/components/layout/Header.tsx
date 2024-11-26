import { useState } from 'react'
import { MdOutlineKeyboardArrowDown } from 'react-icons/md'
import { IoMdMenu } from 'react-icons/io'
import Card from './Card'

const itemCard = [
  {
    title: 'Ten una cuenta gratis y son burocracia',
    url: 'Crea tu cuenta',
    description:
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Impedit magni quod enim eum quis quaerat dignissimos cupiditate doloremque, optio, nulla ea ipsam'
  },
  {
    title: 'Ten una cuenta gratis y son burocracia',
    url: 'Crea tu cuenta',
    description:
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Impedit magni quod enim eum quis quaerat dignissimos cupiditate doloremque, optio, nulla ea ipsam'
  },
  {
    title: 'Ten una cuenta gratis y son burocracia',
    url: 'Crea tu cuenta',
    description:
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Impedit magni quod enim eum quis quaerat dignissimos cupiditate doloremque, optio, nulla ea ipsam'
  }
]

const detailsData = [
  {
    title: "Open this box 1",
    content: "More info about the details 1.",
  },
  {
    title: "Open this box 2",
    content: "More info about the details 2.",
  },
  {
    title: "Open this box 3",
    content: "More info about the details 3.",
  },
  {
    title: "Open this box 4",
    content: "More info about the details 4.",
  },
  {
    title: "Open this box 5",
    content: "More info about the details 5.",
  },
];


const Header = () => {
  const [menu, setMenu] = useState<boolean>(false)

  return (
    <>
      {/* Header */}
      <nav className=' relative flex items-center md:flex-nowrap flex-wrap justify-between md:px-10 px-5 py-5 border-b border-gray-300 max-w-[1660px] mx-auto'>
        <a href='#' className='flex items-center'>
          <img src='/vite.svg' alt='logo' className='md:z-0 z-40 h-10 w-10' />
        </a>

        <IoMdMenu
          className='w-7 h-7 cursor-pointer md:hidden flex z-40'
          onClick={() => setMenu(!menu)}
          aria-label={menu ? 'close-menu' : 'open-menu'}
        />

        {/* <ul className='flex items-center gap-3 md:gap-5 text-gray-400 flex-1 justify-center'>
         
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
          <li className='grid md:flex gap-3'>
            <a
              className='bg-[#d9f2ff] py-3 px-4 rounded-2xl text-opacity-45 font-semibold text-sixth-color w-fit'
              href='#'>
              Iniciar sesión
            </a>
            <a
              className='bg-sixth-color w-fit py-3 px-4 rounded-2xl text-white font-semibold'
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

        <div className='absolute z-20 mx-auto w-full md:w-1/2 h-full grid pt-48 md:px-10 px-5 py-3 items-center md:items-start'>
          <div className='space-y-16 mx-auto'>
            <h2 className='md:text-5xl text-3xl text-white font-normal tracking-tight text-center md:text-start'>
              La forma
              <span className='text-sixth-color px-2'> más fácil y seguro</span>
              de enviar y recibir pagos online
            </h2>
            <div className='flex justify-center md:justify-start'>
              <button className='py-3 px-20 font-semibold bg-sixth-color text-lg text-white rounded-2xl shadow-xl'>
                Crear cuenta
              </button>
            </div>
          </div>
        </div>

        <img
          src='https://dm0qx8t0i9gc9.cloudfront.net/thumbnails/video/Vd3bj2jPe/videoblocks-smiling-businessman-working-on-laptop-computer-at-home-office-male-professional-typing-on-laptop-keyboard-at-office-workplace-portrait-of-positive-business-man-looking-at-laptop-screen-indoors_bfhjr_5md_thumbnail-1080_01.png'
          alt='example'
          className='h-full w-full object-cover'
        />
        <div className='absolute bottom-0 left-0 right-0 z-10 flex justify-center items-center'>
          <MdOutlineKeyboardArrowDown className='h-20 w-20 text-white animate-bounce' />
        </div>
      </div>

      {/* Section */}
      <h2 className='text-3xl text-center font-medium md:px-10 px-5 py-10'>
        Funciones
      </h2>

      <section className='grid md:grid-cols-3 gap-10 text-white md:px-10 px-5'>
        {itemCard.map((item, index) => (
          <Card 
            key={index} 
            item={item}
          />
        ))}
      </section>

      {/* Section question */}
      <h2 className='text-3xl text-center font-medium md:px-10 px-5 pt-20'>
        Preguntas frecuentes
      </h2>

      <section className='md:px-10 px-5 py-10 md:w-2/3 mx-auto'>
      <div className="space-y-4">
      {detailsData.map((detail, index) => (
        <details
          key={index}
          className="text-lg py-3 text-sixth-color font-medium px-5 bg-[#d9f2ff] rounded-lg list-none flex w-full [&_svg]:open:rotate-180">
          <summary className="flex cursor-pointer list-none items-center gap-4">
            <div className="flex items-center justify-between w-full">
              {detail.title}
              <svg
                className="rotate-0 transform text-sixth-color transition-all duration-300"
                fill="none"
                height="20"
                width="20"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </summary>
          <p>{detail.content}</p>
        </details>
      ))}
    </div>
      </section>
    </>
  )
}

export default Header
