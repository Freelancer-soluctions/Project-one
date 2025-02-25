import { Card, CardContent } from '@/components/ui/card'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel
} from '@/components/ui/form'

export const SettingsDisplay = ({
  userDisplaySettings,
  onSaveDisplaySettings
}) => {
  const { t } = useTranslation()
  const form = useForm({
    defaultValues: {
      ...userDisplaySettings
    }
  })
  function onSubmit(data) {
    onSaveDisplaySettings(data)
  }

  // useEffect(() => {
  //   if (userDisplaySettings) {
  //     setDisplaySettings({ ...userDisplaySettings })
  //     console.log('dfdfd', displaySettings)
  //   }
  // }, [userDisplaySettings])

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
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-3'>
                <FormField
                  control={form.control}
                  name='displayNews'
                  render={({ field }) => (
                    <FormItem className='flex items-center space-x-2'>
                      <FormControl>
                        <Checkbox
                          className='mt-2'
                          id='news'
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor='news'
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                        {t('news')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='displayNotes'
                  render={({ field }) => (
                    <FormItem className='flex items-center space-x-2'>
                      <FormControl>
                        <Checkbox
                          className='mt-2'
                          id='notes'
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor='notes'
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                        {t('notes')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='displayEvents'
                  render={({ field }) => (
                    <FormItem className='flex items-center space-x-2'>
                      <FormControl>
                        <Checkbox
                          className='mt-2'
                          id='events'
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor='events'
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                        {t('events')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='displayProfile'
                  render={({ field }) => (
                    <FormItem className='flex items-center space-x-2'>
                      <FormControl>
                        <Checkbox
                          className='mt-2'
                          id='profile'
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor='profile'
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                        {t('profile')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='displayLanguage'
                  render={({ field }) => (
                    <FormItem className='flex items-center space-x-2'>
                      <FormControl>
                        <Checkbox
                          className='mt-2'
                          id='language'
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor='language'
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                        {t('language')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='displayReports'
                  render={({ field }) => (
                    <FormItem className='flex items-center space-x-2'>
                      <FormControl>
                        <Checkbox
                          className='mt-2'
                          id='reports'
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor='reports'
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                        {t('reports')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='displayPayroll'
                  render={({ field }) => (
                    <FormItem className='flex items-center space-x-2'>
                      <FormControl>
                        <Checkbox
                          className='mt-2'
                          id='payroll'
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor='payroll'
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                        {t('payroll')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <Button type='submit'>Submit</Button>
              </form>
            </Form>
            {/* <div className='space-y-3'>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='news'
                  checked={userDisplaySettings?.displayNews}
                  // defaultChecked={displaySettings?.displayEvents}
                  // value={displaySettings.displayNews}
                  onCheckedChange={checked =>
                    setDisplaySettings(prev => ({
                      ...prev,
                      displayNews: checked
                    }))
                  }
                />
                <label
                  htmlFor='news'
                  className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'></label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='notes'
                  value={displaySettings.displayNotes}
                  onCheckedChange={checked =>
                    setDisplaySettings(prev => ({
                      ...prev,
                      displayNotes: checked
                    }))
                  }
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
                  onCheckedChange={checked =>
                    setDisplaySettings(prev => ({
                      ...prev,
                      displayEvents: checked
                    }))
                  }
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
                  onCheckedChange={checked =>
                    setDisplaySettings(prev => ({
                      ...prev,
                      displayProfile: checked
                    }))
                  }
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
                  onCheckedChange={checked =>
                    setDisplaySettings(prev => ({
                      ...prev,
                      displayLanguage: checked
                    }))
                  }
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
                  onCheckedChange={checked =>
                    setDisplaySettings(prev => ({
                      ...prev,
                      displayReports: checked
                    }))
                  }
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
                  value={displaySettings.displayPayroll}
                  onCheckedChange={checked =>
                    setDisplaySettings(prev => ({
                      ...prev,
                      displayPayroll: checked
                    }))
                  }
                />
                <label
                  htmlFor='payroll'
                  className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                  {t('payroll')}
                </label>
              </div>
            </div> */}
          </div>
          {/* <Button className='mt-4'>Update display</Button> */}
        </div>
      </CardContent>
    </Card>
  )
}
