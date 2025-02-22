import { TabsContent } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

export const SettingsDisplay = () => {
  const { t } = useTranslation()
  return (
    <TabsContent value='display' className='space-y-6'>
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
                  <Checkbox id='recents' defaultChecked />
                  <label
                    htmlFor='recents'
                    className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                    Recents
                  </label>
                </div>
                <div className='flex items-center space-x-2'>
                  <Checkbox id='home' defaultChecked />
                  <label
                    htmlFor='home'
                    className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                    Home
                  </label>
                </div>
                <div className='flex items-center space-x-2'>
                  <Checkbox id='applications' />
                  <label
                    htmlFor='applications'
                    className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                    Applications
                  </label>
                </div>
                <div className='flex items-center space-x-2'>
                  <Checkbox id='desktop' />
                  <label
                    htmlFor='desktop'
                    className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                    Desktop
                  </label>
                </div>
                <div className='flex items-center space-x-2'>
                  <Checkbox id='downloads' />
                  <label
                    htmlFor='downloads'
                    className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                    Downloads
                  </label>
                </div>
                <div className='flex items-center space-x-2'>
                  <Checkbox id='documents' />
                  <label
                    htmlFor='documents'
                    className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                    Documents
                  </label>
                </div>
              </div>
            </div>
            <Button className='mt-4'>Update display</Button>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  )
}
c
