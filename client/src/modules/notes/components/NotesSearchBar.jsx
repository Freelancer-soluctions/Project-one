import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'

export function NotesSearchBar({ onSearch }) {
  const { t } = useTranslation()
  return (
    <div className='relative w-full max-w-md mx-auto mb-6'>
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
  )
}

NotesSearchBar.propTypes = {
  onSearch: PropTypes.func
}
