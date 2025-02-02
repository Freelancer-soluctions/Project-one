import { Input } from '@/components/ui/input'
import { LuSearch } from 'react-icons/lu'

export function NotesSearchBar({ onSearch }) {
  return (
    <div className='relative w-full max-w-md mx-auto mb-6'>
      <LuSearch className='absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2' />
      <Input
        type='text'
        placeholder='Buscar notas...'
        className='py-2 pl-10 pr-4'
        onChange={e => onSearch(e.target.value)}
      />
    </div>
  )
}
