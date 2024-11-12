import { CgSpinner } from 'react-icons/cg'

export default function Spinner() {
  return (
    <main className='grid gap-5 place-content-center place-items-center'>
      {/* <UrbanBurger size='10em' /> */}

      <CgSpinner size='3.25em' className='animate-spin' />
    </main>
  )
}
