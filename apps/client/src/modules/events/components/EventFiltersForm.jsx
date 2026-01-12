import { LuPlus, LuEraser } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'

export const EventFiltersForm = ({
  setSearchQuery,
  searchQuery,
  setIsDialogOpen,
  setEvent
}) => {
  const { t } = useTranslation()

  return (
    <div className='flex flex-col gap-4 p-4 sm:p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='flex flex-col items-start gap-5 sm:flex-row sm:items-center'>
        <div className='w-full sm:max-w-sm'>
          <Label htmlFor='textSearch'>{t('search')}</Label>
          <Input
            id='textSearch'
            type='text'
            maxLength={150}
            placeholder='Buscar eventos...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className='flex flex-wrap items-center justify-between gap-3 mt-5'>
          <Button
            type='button'
            className='flex-1 md:flex-initial md:w-24'
            variant='success'
            onClick={() => {
              setIsDialogOpen(true), setEvent({})
            }}>
            {t('add')} <LuPlus className='w-4 h-4 ml-auto opacity-50' />
          </Button>
          <Button
            type='button'
            className='flex-1 md:flex-initial md:w-24'
            variant='outline'
            onClick={() => setSearchQuery('')}>
            {t('clear')} <LuEraser className='w-4 h-4 ml-auto opacity-50' />
          </Button>
        </div>
      </div>
    </div>
  )
}

EventFiltersForm.propTypes = {
  setSearchQuery: PropTypes.func.isRequired,
  searchQuery: PropTypes.string.isRequired,
  setIsDialogOpen: PropTypes.func.isRequired,
  setEvent: PropTypes.func.isRequired
}
