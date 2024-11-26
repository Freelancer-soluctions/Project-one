const Footer = () => {
  return (
    <>
      <footer className='bg-gray-100 text-center py-8'>
        <div className='flex flex-col items-center'>
          <img
            src='/vite.svg'
            alt='Logo'
            className='w-16 h-16 mb-2'
          />
          <p className='text-blue-600 text-xl font-bold'>ezpay</p>

          <div className='flex space-x-4 mt-4'>
            <a href='#' className='text-blue-600'>
              <i className='fab fa-instagram text-2xl'></i>
            </a>
            <a href='#' className='text-blue-600'>
              <i className='fab fa-facebook text-2xl'></i>
            </a>
            <a href='#' className='text-blue-600'>
              <i className='fab fa-twitter text-2xl'></i>
            </a>
          </div>
        </div>

        <p className='text-gray-500 text-sm mt-6'>
          &copy; Todos los derechos reservados
        </p>
      </footer>
    </>
  )
}

export default Footer
