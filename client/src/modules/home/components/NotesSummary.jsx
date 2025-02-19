import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LuArrowRight } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { StatusColumn } from '@/modules/notes/utils/enums'
import { useEffect } from 'react'

export function NotesSummary({ data }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => {
    if (data?.data.length > 0) {
      console.log(data.data)
    }
  }, [data])

  return (
    <Card className='border-0 shadow-none'>
      <CardHeader>
        <CardTitle>{t('status_notes')}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-4'>
          <Alert
            className={cn(
              'border-green-200 bg-green-50/50 transition-colors hover:bg-green-100/50 cursor-pointer'
            )}
            onClick={() =>
              navigate('/notes', { state: { filter: StatusColumn.LOW } })
            }>
            <AlertDescription className='flex items-center justify-between'>
              <span>{t('to_do')}</span>
              <div className='flex items-center gap-2'>
                <span className='font-semibold text-green-700'>
                  {/* {getTotalNotes('col1')} */}
                </span>
                <LuArrowRight className='w-4 h-4 text-green-700' />
              </div>
            </AlertDescription>
          </Alert>

          <Alert
            className={cn(
              'border-yellow-200 bg-yellow-50/50 transition-colors hover:bg-yellow-100/50 cursor-pointer'
            )}
            onClick={() =>
              navigate('/notes', { state: { filter: StatusColumn.MEDIUM } })
            }>
            <AlertDescription className='flex items-center justify-between'>
              <span>{t('in_progress')}</span>
              <div className='flex items-center gap-2'>
                <span className='font-semibold text-yellow-700'>
                  {/* {getTotalNotes('col2')} */}
                </span>
                <LuArrowRight className='w-4 h-4 text-yellow-700' />
              </div>
            </AlertDescription>
          </Alert>

          <Alert
            className={cn(
              'border-red-200 bg-red-50/50 transition-colors hover:bg-red-100/50 cursor-pointer'
            )}
            onClick={() =>
              navigate('/notes', { state: { filter: StatusColumn.HIGH } })
            }>
            <AlertDescription className='flex items-center justify-between'>
              <span>{t('completed')}</span>
              <div className='flex items-center gap-2'>
                <span className='font-semibold text-red-700'>
                  {/* {getTotalNotes('col3')} */}
                </span>
                <LuArrowRight className='w-4 h-4 text-red-700' />
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <Button variant='outline' className='w-full mt-2'>
          {t('show_all_notes')}
        </Button>
      </CardContent>
    </Card>
  )
}
