import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'

export const SettingsDisplay = ({ userDisplaySettings }) => {
  const { t } = useTranslation()
  const { displaySettings, setDisplaySettings } = useState({})

  useEffect(() => {
    if (!userDisplaySettings) return
    setDisplaySettings(userDisplaySettings)
  }, [userDisplaySettings])

  return (
    <Card>
      <CardContent className='p-6 space-y-6'>
        <div>
          <h3 className='mb-2 text-lg font-medium'>{t('display')}</h3>
          <p className='text-sm text-muted-foreground'>
            {t('turn_off_on_message')}
          </p>
        </div>
        <div className='space-y-4'>
          <div>
            <h4 className='mb-3 text-sm font-medium'>{t('sidebar')}</h4>
            <p className='mb-4 text-sm text-muted-foreground'>
              {t('select_items_display_message')}
            </p>
            <div className='space-y-3'>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='nesw'
                  value={displaySettings.displayNews}
                  onchangeValue={setDisplaySettings}
                />
                <label
                  htmlFor='news'
                  className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                  {t('news')}
                </label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='notes'
                  value={displaySettings.displayNotes}
                  onchangeValue={setDisplaySettings}
                />
                <label
                  htmlFor='notes'
                  className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                  {t('notes')}
                </label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='events'
                  value={displaySettings.displayEvents}
                  onchangeValue={setDisplaySettings}
                />
                <label
                  htmlFor='events'
                  className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                  {t('events')}
                </label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='profile'
                  value={displaySettings.displayProfile}
                  onchangeValue={setDisplaySettings}
                />
                <label
                  htmlFor='profile'
                  className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                  {t('profile')}
                </label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='language'
                  value={displaySettings.displayLanguage}
                  onchangeValue={setDisplaySettings}
                />
                <label
                  htmlFor='language'
                  className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                  {t('language')}
                </label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='resports'
                  value={displaySettings.displayReports}
                  onchangeValue={setDisplaySettings}
                />
                <label
                  htmlFor='resports'
                  className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                  {t('reports')}
                </label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='payroll'
                  value={displaySettings}
                  onchangeValue={setDisplaySettings}
                />
                <label
                  htmlFor='payroll'
                  className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                  {t('payroll')}
                </label>
              </div>
            </div>
          </div>
          <Button className='mt-4'>Update display</Button>
        </div>
      </CardContent>
    </Card>
  )
}
