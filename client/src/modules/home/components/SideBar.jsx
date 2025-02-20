import { CgNotes } from 'react-icons/cg'
import {
  LuNewspaper,
  LuCalendarCheck2,
  LuHouse,
  LuSlidersHorizontal,
  LuLogOut
} from 'react-icons/lu'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { QuickAccessButton } from '@/components/quickAccess/QuickAccess'
import { NotesSummary } from './NotesSummary'
import { useGetAllCountNotesQuery } from '@/modules/notes/api/notesAPI'

const SideBar = () => {
  const { t } = useTranslation()
  const {
    data: dataCountNotes = { data: [] },
    isError: isErrorCountNotes,
    isLoading: isLoadingCountNotes,
    isFetching: isFetchingCountNotes,
    isSuccess: isSuccesCountNotes,
    error: errorCountNotes
  } = useGetAllCountNotesQuery()

  return (
    <>
      <Link
        to={'/home'}
        className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
        prefetch={false}>
        <LuHouse className='w-5 h-5' />
        {t('home')}
      </Link>
      <Link
        to={'news'}
        className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
        prefetch={false}>
        <LuNewspaper className='w-5 h-5' />
        {t('news')}
      </Link>
      <QuickAccessButton
        icon={CgNotes}
        label={t('notes')}
        content={NotesSummary}
        contentProps={{ dataCountNotes }}
        className={
          'flex items-center justify-start gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground '
        }
      />

      {/* <Link
        to={'notes'}
        className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
        prefetch={false}>
        <CgNotes className='w-5 h-5' />
        {t('notes')}
      </Link> */}
      <Link
        to={'settings'}
        className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
        prefetch={false}>
        <LuSlidersHorizontal className='w-5 h-5' />
        {t('settings')}
      </Link>
      <Link
        to={'events'}
        className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
        prefetch={false}>
        <LuCalendarCheck2 className='w-5 h-5' />
        {t('events')}
      </Link>
      <Link
        href='#'
        className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
        prefetch={false}>
        <LuLogOut className='w-5 h-5' />
        {t('logout')}
      </Link>
    </>
  )
}

export default SideBar
