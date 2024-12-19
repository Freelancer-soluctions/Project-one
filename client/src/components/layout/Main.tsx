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
    title: 'Open this box 1',
    content: 'More info about the details 1.'
  },
  {
    title: 'Open this box 2',
    content: 'More info about the details 2.'
  },
  {
    title: 'Open this box 3',
    content: 'More info about the details 3.'
  },
  {
    title: 'Open this box 4',
    content: 'More info about the details 4.'
  },
  {
    title: 'Open this box 5',
    content: 'More info about the details 5.'
  }
]

const Main = () => {
  return (
    <div>
      {' '}
      {/* Section */}
      <h2 className='text-3xl text-center font-medium md:px-10 px-5 py-10'>
        Funciones
      </h2>
      <section className='grid md:grid-cols-3 gap-10 text-white md:px-10 px-5'>
        {itemCard.map((item, index) => (
          <Card key={index} item={item} />
        ))}
      </section>
      {/* Section question */}
      <h2 className='text-3xl text-center font-medium md:px-10 px-5 pt-20'>
        Preguntas frecuentes
      </h2>
      <section className='md:px-10 px-5 py-10 md:w-2/3 mx-auto'>
        <div className='space-y-4'>
          {detailsData.map((detail, index) => (
            <details
              key={index}
              className='text-lg py-3 text-sixth-color font-medium px-5 bg-[#d9f2ff] rounded-lg list-none flex w-full [&_svg]:open:rotate-180'>
              <summary className='flex cursor-pointer list-none items-center gap-4'>
                <div className='flex items-center justify-between w-full'>
                  {detail.title}
                  <svg
                    className='rotate-0 transform text-sixth-color transition-all duration-300'
                    fill='none'
                    height='20'
                    width='20'
                    stroke='currentColor'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    viewBox='0 0 24 24'>
                    <polyline points='6 9 12 15 18 9'></polyline>
                  </svg>
                </div>
              </summary>
              <p>{detail.content}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Main
