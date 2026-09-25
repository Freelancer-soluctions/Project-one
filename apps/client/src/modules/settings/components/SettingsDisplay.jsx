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

/** Sidebar display toggles in render order. */
const DISPLAY_SETTINGS = [
  { name: 'displayNews', id: 'news', labelKey: 'news' },
  { name: 'displayNotes', id: 'notes', labelKey: 'notes' },
  { name: 'displayStock', id: 'stock', labelKey: 'stock' },
  { name: 'displayEvents', id: 'events', labelKey: 'events' },
  { name: 'displayProfile', id: 'profile', labelKey: 'profile' },
  { name: 'displayLanguage', id: 'language', labelKey: 'language' },
  { name: 'displayReports', id: 'reports', labelKey: 'reports' },
  { name: 'displayPayroll', id: 'payroll', labelKey: 'payroll' },
];

/** Sidebar display toggle checkbox. */
function DisplayToggleField({ control, name, id, labelKey }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center space-x-2">
          <FormControl>
            <Checkbox
              className="mt-2"
              id={id}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
          <FormLabel
            htmlFor={id}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {t(labelKey)}
          </FormLabel>
        </FormItem>
      )}
    />
  );
}

DisplayToggleField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
};

/** Renders the display toggles in order. */
const renderDisplayToggles = (control) =>
  DISPLAY_SETTINGS.map((setting) => (
    <DisplayToggleField key={setting.name} control={control} {...setting} />
  ));

/** Save button row. */
function buildSaveButton({ t }) {
  return (
    <Button type="submit" variant="info" className="w-full mt-6 sm:w-auto">
      {t('save')}
    </Button>
  );
}

/** Display section header: sidebar description. */
function buildSidebarHeader({ t }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-medium">{t('sidebar')}</h4>
      <p className="mb-4 text-sm text-muted-foreground">
        {t('select_items_display_message')}
      </p>
    </div>
  );
}

/**
 * Display settings form state: toggles submit with success/error
 * toasts.
 */
function useDisplaySettingsForm({
  userDisplaySettings,
  onSaveDisplaySettings,
}) {
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

  return { t, form, onSubmit };
}

export const SettingsDisplay = ({
  userDisplaySettings,
  onSaveDisplaySettings,
}) => {
  const { t, form, onSubmit } = useDisplaySettingsForm({
    userDisplaySettings,
    onSaveDisplaySettings,
  });

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
            {buildSidebarHeader({ t })}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-3"
              >
                {renderDisplayToggles(form.control)}

                {buildSaveButton({ t })}
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
