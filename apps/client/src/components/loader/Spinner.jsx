import { TbLoader2 } from 'react-icons/tb'

export function Spinner() {
  return (
    <div className='absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm'>
      <TbLoader2 className='w-8 h-8 animate-spin text-primary' />
    </div>
  )
}
