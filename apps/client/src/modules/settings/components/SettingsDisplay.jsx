import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import PropTypes from 'prop-types';
export const SettingsDisplay = ({
  userDisplaySettings,
  onSaveDisplaySettings,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const form = useForm({
    defaultValues: {
      ...userDisplaySettings,
    },
  });
  async function onSubmit(data) {
    try {
      await onSaveDisplaySettings(data);
      toast({
        title: t('settings_display_success'),
        description: t('settings_display_success_message'),
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: t('settings_display_error'),
        description: error.message || t('settings_display_error_message'),
        variant: 'destructive',
      });
    }
  }

  // useEffect(() => {
  //   if (userDisplaySettings) {
  //     setDisplaySettings({ ...userDisplaySettings })
  //     console.log('dfdfd', displaySettings)
  //   }
  // }, [userDisplaySettings])

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div>
          <h3 className="mb-2 text-lg font-medium">{t('display')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('turn_off_on_message')}
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="mb-3 text-sm font-medium">{t('sidebar')}</h4>
            <p className="mb-4 text-sm text-muted-foreground">
              {t('select_items_display_message')}
            </p>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-3"
              >
                <FormField
                  control={form.control}
                  name="displayNews"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          className="mt-2"
                          id="news"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor="news"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {t('news')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="displayNotes"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          className="mt-2"
                          id="notes"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor="notes"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {t('notes')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="displayStock"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          className="mt-2"
                          id="stock"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor="stock"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {t('stock')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="displayEvents"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          className="mt-2"
                          id="events"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor="events"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {t('events')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="displayProfile"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          className="mt-2"
                          id="profile"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor="profile"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {t('profile')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="displayLanguage"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          className="mt-2"
                          id="language"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor="language"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {t('language')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="displayReports"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          className="mt-2"
                          id="reports"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor="reports"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {t('reports')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="displayPayroll"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          className="mt-2"
                          id="payroll"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor="payroll"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {t('payroll')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  variant="info"
                  className="w-full mt-6 sm:w-auto"
                >
                  {t('save')}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

SettingsDisplay.propTypes = {
  userDisplaySettings: PropTypes.object.isRequired,
  onSaveDisplaySettings: PropTypes.func.isRequired,
};
