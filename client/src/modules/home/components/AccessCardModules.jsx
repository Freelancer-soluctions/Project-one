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
import {
  LuArrowRight,
  LuNewspaper,
  LuCalendarCheck2,
  LuPackage,
  LuPackagePlus,
  LuBuilding2,
  LuWarehouse,
  LuShoppingCart ,
  LuArrowLeftRight,
  LuDollarSign,
  LuUsersRound ,
  LuUsers,
  LuClock,
  LuStar,
  LuUserSearch,
  LuWalletMinimal,
  LuClipboardPen 
} from 'react-icons/lu'
import { useTranslation } from 'react-i18next'
const CardModule = () => {
  const { t } = useTranslation()
  return (
    <>
      <UpcomingEventsAlert />

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 '>
      <Card className='relative overflow-hidden transition-all group hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='p-6'>
            <div className='flex items-center gap-4'>
              <LuUserSearch  className='w-8 h-8 text-zinc-800' />
              <div>
                <CardTitle className='text-xl'>{t('users')}</CardTitle>
                <CardDescription>{t('users_card_msg')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            <Link
              to={'users'}
              className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
              prefetch={false}>
              {t('access')} <LuArrowRight className='w-4 h-4 ml-2' />
            </Link>
          
          </CardContent>
        </Card>
        <Card className='relative overflow-hidden transition-all group hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='p-6'>
            <div className='flex items-center gap-4'>
              <LuWalletMinimal  className='w-8 h-8 text-zinc-800' />
              <div>
                <CardTitle className='text-xl'>{t('expenses')}</CardTitle>
                <CardDescription>{t('expenses_card_msg')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            <Link
              to={'expenses'}
              className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
              prefetch={false}>
              {t('access')} <LuArrowRight className='w-4 h-4 ml-2' />
            </Link>
          
          </CardContent>
        </Card>
        <Card className='relative overflow-hidden transition-all group hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='p-6'>
            <div className='flex items-center gap-4'>
              <LuWalletMinimal  className='w-8 h-8 text-zinc-800' />
              <div>
                <CardTitle className='text-xl'>{t('reports')}</CardTitle>
                <CardDescription>{t('reports_card_msg')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            <Link
              to={'reports'}
              className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
              prefetch={false}>
              {t('access')} <LuArrowRight className='w-4 h-4 ml-2' />
            </Link>
          
          </CardContent>
        </Card>
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
      </div>
      <div className='grid grid-cols-1 gap-4 mt-20 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8'>
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
        <Card className='relative overflow-hidden transition-all group hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='p-6'>
            <div className='flex items-center gap-4'>
              <LuBuilding2 className='w-8 h-8 text-zinc-800' />
              <div>
                <CardTitle className='text-xl'>{t('providers')}</CardTitle>
                <CardDescription>{t('providers_card_msg')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            <Link
              to={'providers'}
              className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
              prefetch={false}>
              {t('access')} <LuArrowRight className='w-4 h-4 ml-2' />
            </Link>
          </CardContent>
        </Card>
        <Card className='relative overflow-hidden transition-all group hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='p-6'>
            <div className='flex items-center gap-4'>
              <LuWarehouse className='w-8 h-8 text-zinc-800' />
              <div>
                <CardTitle className='text-xl'>{t('warehouse')}</CardTitle>
                <CardDescription>{t('warehouse_card_msg')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            <Link
              to={'warehouse'}
              className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
              prefetch={false}>
              {t('access')} <LuArrowRight className='w-4 h-4 ml-2' />
            </Link>
          </CardContent>
        </Card>
        <Card className='relative overflow-hidden transition-all group hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='p-6'>
            <div className='flex items-center gap-4'>
              <LuPackagePlus className='w-8 h-8 text-zinc-800' />
              <div>
                <CardTitle className='text-xl'>{t('stock')}</CardTitle>
                <CardDescription>{t('stock_card_msg')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            <Link
              to={'stock'}
              className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
              prefetch={false}>
              {t('access')} <LuArrowRight className='w-4 h-4 ml-2' />
            </Link>
          </CardContent>
        </Card>
        <Card className='relative overflow-hidden transition-all group hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='p-6'>
            <div className='flex items-center gap-4'>
              <LuDollarSign className='w-8 h-8 text-zinc-800' />
              <div>
                <CardTitle className='text-xl'>{t('sales')}</CardTitle>
                <CardDescription>{t('sales_card_msg')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            <Link
              to={'sales'}
              className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
              prefetch={false}>
              {t('access')} <LuArrowRight className='w-4 h-4 ml-2' />
            </Link>
          </CardContent>
        </Card>
        <Card className='relative overflow-hidden transition-all group hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='p-6'>
            <div className='flex items-center gap-4'>
              <LuUsersRound className='w-8 h-8 text-zinc-800' />
              <div>
                <CardTitle className='text-xl'>{t('clients')}</CardTitle>
                <CardDescription>{t('clients_card_msg')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            <Link
              to={'clients'}
              className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
              prefetch={false}>
              {t('access')} <LuArrowRight className='w-4 h-4 ml-2' />
            </Link>
          </CardContent>
        </Card>
        <Card className='relative overflow-hidden transition-all group hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='p-6'>
            <div className='flex items-center gap-4'>
              <LuShoppingCart className='w-8 h-8 text-zinc-800' />
              <div>
                <CardTitle className='text-xl'>{t('purchases')}</CardTitle>
                <CardDescription>{t('purchases_card_msg')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            <Link
              to={'purchases'}
              className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
              prefetch={false}>
              {t('access')} <LuArrowRight className='w-4 h-4 ml-2' />
            </Link>
          </CardContent>
        </Card>
        <Card className='relative overflow-hidden transition-all group hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='p-6'>
            <div className='flex items-center gap-4'>
              <LuArrowLeftRight className='w-8 h-8 text-zinc-800' />
              <div>
                <CardTitle className='text-xl'>{t('inventoryMovement')}</CardTitle>
                <CardDescription>{t('inventoryMovement_card_msg')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            <Link
              to={'inventoryMovement'}
              className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
              prefetch={false}>
              {t('access')} <LuArrowRight className='w-4 h-4 ml-2' />
            </Link>
          </CardContent>
        </Card>
        <Card className='relative overflow-hidden transition-all group hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='p-6'>
            <div className='flex items-center gap-4'>
              <LuClipboardPen  className='w-8 h-8 text-zinc-800' />
              <div>
                <CardTitle className='text-xl'>{t('provider_order')}</CardTitle>
                <CardDescription>{t('provider_order_card_msg')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            <Link
              to={'providerOrder'}
              className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
              prefetch={false}>
              {t('access')} <LuArrowRight className='w-4 h-4 ml-2' />
            </Link>
          </CardContent>
        </Card>
        <Card className='relative overflow-hidden transition-all group hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='p-6'>
            <div className='flex items-center gap-4'>
              <LuClipboardPen  className='w-8 h-8 text-zinc-800' />
              <div>
                <CardTitle className='text-xl'>{t('client_order')}</CardTitle>
                <CardDescription>{t('client_order_card_msg')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            <Link
              to={'clientOrder'}
              className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
              prefetch={false}>
              {t('access')} <LuArrowRight className='w-4 h-4 ml-2' />
            </Link>
          </CardContent>
        </Card>
      </div>
      <div className='grid grid-cols-1 gap-4 mt-20 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8'>
      <Card className='relative overflow-hidden transition-all group hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='p-6'>
            <div className='flex items-center gap-4'>
              <LuUsers className='w-8 h-8 text-zinc-800' />
              <div>
                <CardTitle className='text-xl'>{t('employees')}</CardTitle>
                <CardDescription>{t('employees_card_msg')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            <Link
              to={'employees'}
              className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
              prefetch={false}>
              {t('access')} <LuArrowRight className='w-4 h-4 ml-2' />
            </Link>
          </CardContent>
        </Card>
        <Card className='relative overflow-hidden transition-all group hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='p-6'>
            <div className='flex items-center gap-4'>
              <LuClock className='w-8 h-8 text-zinc-800' />
              <div>
                <CardTitle className='text-xl'>{t('attendance')}</CardTitle>
                <CardDescription>{t('attendance_card_msg')}</CardDescription>
              </div>
            </div>
          </CardHeader> 
          <CardContent className='px-6 pb-6'>
            <Link
              to={'attendance'}
              className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
              prefetch={false}>
              {t('access')} <LuArrowRight className='w-4 h-4 ml-2' />
            </Link>
          </CardContent>
        </Card>
        <Card className='relative overflow-hidden transition-all group hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='p-6'>
            <div className='flex items-center gap-4'>
              <LuDollarSign className='w-8 h-8 text-zinc-800' />
              <div>
                <CardTitle className='text-xl'>{t('payroll')}</CardTitle>
                <CardDescription>{t('payroll_card_msg')}</CardDescription>
              </div>
            </div>
          </CardHeader> 
          <CardContent className='px-6 pb-6'>
            <Link
              to={'payroll'}
              className='flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
              prefetch={false}>
              {t('access')} <LuArrowRight className='w-4 h-4 ml-2' />
            </Link>
          </CardContent>
        </Card>
        <Card className='relative overflow-hidden transition-all group hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='p-6'>
            <div className='flex items-center gap-4'>
              <LuStar className='w-8 h-8 text-zinc-800' />
              <div>
                <CardTitle className='text-xl'>{t('performanceEvaluation')}</CardTitle>
                <CardDescription>{t('performanceEvaluation_card_msg')}</CardDescription>
              </div>
            </div>
          </CardHeader> 
          <CardContent className='px-6 pb-6'>
            <Link
              to={'performanceEvaluation'}
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
                <CardTitle className='text-xl'>{t('vacations')}</CardTitle>
                <CardDescription>{t('vacations_card_msg')}</CardDescription>
              </div>
            </div>
          </CardHeader> 
          <CardContent className='px-6 pb-6'>
            <Link
              to={'vacations'}
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
                <CardTitle className='text-xl'>{t('permission')}</CardTitle>
                <CardDescription>{t('permission_card_msg')}</CardDescription>
              </div>
            </div>
          </CardHeader> 
          <CardContent className='px-6 pb-6'>
            <Link
              to={'permission'}
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
