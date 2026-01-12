import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LuArrowRight } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

export function StockSummary({ dataCountStock }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Card className='border-0 shadow-none'>
      <CardHeader>
        <CardTitle>{t('stock_alerts')}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-4'>
          {dataCountStock?.data.expired > 0 && (
            <Alert
              className={cn(
                'border-red-200 bg-red-50/50 transition-colors hover:bg-red-100/50 cursor-pointer'
              )}
              onClick={() =>
                navigate('stock', { state: { filter: { stocksExpirated: true } } })
              }>
              <AlertDescription className='flex items-center justify-between'>
                <span>{t('expired_stock')}</span>
                <div className='flex items-center gap-2'>
                  <span className='font-semibold text-red-700'>
                    {dataCountStock.data.expired}
                  </span>
                  <LuArrowRight className='w-4 h-4 text-red-700' />
                </div>
              </AlertDescription>
            </Alert>
          )}
          {dataCountStock?.data.lowStock > 0 && (
            <Alert
              className={cn(
                'border-yellow-200 bg-yellow-50/50 transition-colors hover:bg-yellow-100/50 cursor-pointer'
              )}
              onClick={() =>
                navigate('stock', { state: { filter: { stocksLow: true } } })
              }>
              <AlertDescription className='flex items-center justify-between'>
                <span>{t('low_stock')}</span>
                <div className='flex items-center gap-2'>
                  <span className='font-semibold text-yellow-700'>
                    {dataCountStock.data.lowStock}
                  </span>
                  <LuArrowRight className='w-4 h-4 text-yellow-700' />
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Button
          variant='outline'
          className='w-full mt-2'
          onClick={() => navigate('stock')}>
          {t('show_all_stock')}
        </Button>
      </CardContent>
    </Card>
  )
} 