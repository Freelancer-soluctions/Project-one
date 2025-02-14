import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { LuPlus, LuEraser } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'

export function NotesFilters({ onSearch, setOpen }) {
  const { t } = useTranslation()
  return (
    <>
      <div className='flex-1 max-w-md'>
        <Label htmlFor='textSearch'>{t('search')}</Label>
        <Input
          id='textSearch'
          type='text'
          maxLength={150}
          placeholder={t('search_notes')}
          className='py-2 pr-4'
          onChange={e => onSearch(e.target.value)}
        />
      </div>
      <div className='flex flex-wrap items-center justify-between gap-3 mt-5 md:justify-normal'>
        <Button
          className='flex-1 md:flex-initial md:w-24'
          variant='success'
          onClick={() => {
            setOpen(true)
          }}>
          {t('add')}
          <LuPlus className='w-5 h-5 ml-auto opacity-50' />
        </Button>
        <Button
          type='button'
          className='flex-1 md:flex-initial md:w-24'
          variant='outline'
          onClick={() => handleResetFilter()}>
          {t('clear')} <LuEraser className='w-4 h-4 ml-auto opacity-50' />
        </Button>
      </div>
    </>
  )
}

NotesFilters.propTypes = {
  onSearch: PropTypes.func
}
