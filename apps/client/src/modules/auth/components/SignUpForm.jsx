import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema } from '../utils/schema';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

/** Sign-up input field (parametrized name/label/placeholder/type). */
function SignUpTextField({ control, name, labelKey, placeholderKey, type }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t(labelKey)}</FormLabel>
          <FormControl>
            <Input
              id={name}
              name={name}
              placeholder={t(placeholderKey)}
              type={type}
              {...field}
              value={field.value ?? ''}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

SignUpTextField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  placeholderKey: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
};

/** Date-of-birth picker (past dates only). */
function SignUpDobField({ control }) {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name="dob"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{t('date_of_birth')}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant={'outline'}
                  className={cn(
                    ' pl-3 text-left font-normal',
                    !field.value && 'text-muted-foreground'
                  )}
                >
                  {field.value ? (
                    format(field.value, 'PPP')
                  ) : (
                    <span>{t('pick_date')}</span>
                  )}
                  <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                disabled={(date) =>
                  date > new Date() || date < new Date('1900-01-01')
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}

SignUpDobField.propTypes = {
  control: PropTypes.object.isRequired,
};

/** Centered submit row. */
function buildSubmitRow({ t }) {
  return (
    <div className="flex items-center justify-center">
      <Button type="submit" className="flex-1">
        {t('sign_up_button')}
      </Button>
    </div>
  );
}

export const SignUpForm = () => {
  const { t } = useTranslation();
  const form = useForm({ resolver: zodResolver(signUpSchema) });
  const onSubmit = (data) => {
    console.log(data);
  };
  return (
    <>
      <div className="border shadow rounded-xl bg-card text-card-foreground">
        <Form {...form}>
          <form
            method="post"
            action=""
            id="profile-info-form"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full p-10 space-y-5 "
          >
            <SignUpTextField
              control={form.control}
              name="fname"
              labelKey="first_name"
              placeholderKey="sign_name_placeholder"
              type="text"
            />

            <SignUpTextField
              control={form.control}
              name="lname"
              labelKey="last_name"
              placeholderKey="sign_last_name_placeholder"
              type="text"
            />

            <SignUpTextField
              control={form.control}
              name="email"
              labelKey="email"
              placeholderKey="sign_email_placeholder"
              type="email"
            />

            <SignUpTextField
              control={form.control}
              name="password"
              labelKey="password"
              placeholderKey="sign_password_placeholder"
              type="password"
            />
            <SignUpTextField
              control={form.control}
              name="rpassword"
              labelKey="password"
              placeholderKey="sign_confirm_password_placeholder"
              type="password"
            />

            <SignUpDobField control={form.control} />

            {buildSubmitRow({ t })}
          </form>
        </Form>
      </div>
    </>
  );
};
