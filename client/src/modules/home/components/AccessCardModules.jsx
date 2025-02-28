import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from '@/components/ui/card'
import { UpcomingEventsAlert } from './UpcomingEvents'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router'
import { CgNotes } from 'react-icons/cg'
import { LuArrowRight, LuNewspaper, LuCalendarCheck2, LuPackage} from 'react-icons/lu'
import { useTranslation } from 'react-i18next'
const CardModule = () => {
  const { t } = useTranslation()
  return (
    <>
      <UpcomingEventsAlert />

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8'>
        <Card className='relative overflow-hidden transition-all group hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='p-6'>
            <div className='flex items-center gap-4'>
              <LuNewspaper className='w-8 h-8 text-zinc-800' />
              <div>
                <CardTitle className='text-xl'>{t('news')}</CardTitle>
                <CardDescription>{t('news_card_msg')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            <Link
              to={'news'}
              className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
              prefetch={false}>
              {t('access')} <LuArrowRight className='w-4 h-4 ml-2' />
            </Link>
            {/* <Button
            variant='ghost'
            className='transition-transform group-hover:translate-x-1'>
            {t('access')} <LuArrowRight className='w-4 h-4 ml-2' />
          </Button> */}
          </CardContent>
        </Card>

        <Card className='relative overflow-hidden transition-all group hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='p-6'>
            <div className='flex items-center gap-4'>
              <CgNotes className='w-8 h-8 text-zinc-800' />
              <div>
                <CardTitle className='text-xl'>{t('notes')}</CardTitle>
                <CardDescription>{t('notes_card_msg')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            <Link
              to={'notes'}
              className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
              prefetch={false}>
              {t('access')} <LuArrowRight className='w-4 h-4 ml-2' />
            </Link>
          </CardContent>
        </Card>
        <Card className='relative overflow-hidden transition-all group hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='p-6'>
            <div className='flex items-center gap-4'>
              <LuCalendarCheck2 className='w-8 h-8 text-zinc-800' />
              <div>
                <CardTitle className='text-xl'>{t('events')}</CardTitle>
                <CardDescription>{t('events_card_msg')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            <Link
              to={'events'}
              className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
              prefetch={false}>
              {t('access')} <LuArrowRight className='w-4 h-4 ml-2' />
            </Link>
          </CardContent>
        </Card>
        <Card className='relative overflow-hidden transition-all group hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='p-6'>
            <div className='flex items-center gap-4'>
              <LuPackage className='w-8 h-8 text-zinc-800' />
              <div>
                <CardTitle className='text-xl'>{t('products')}</CardTitle>
                <CardDescription>{t('products_card_msg')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            <Link
              to={'products'}
              className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
              prefetch={false}>
              {t('access')} <LuArrowRight className='w-4 h-4 ml-2' />
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default CardModule
