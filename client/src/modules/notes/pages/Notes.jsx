import { NotesGrid } from '../components/NotesGrid'
import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import { useTranslation } from 'react-i18next'

export default function NotesPage() {
  const { t } = useTranslation()
  return (
    <>
      <BackDashBoard link={'/home'} moduleName={t('notes')} />
      <div className='w-full px-4'>
        <NotesGrid />
      </div>
    </>
  )
}
