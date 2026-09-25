import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema } from '../utils/schema';
import { Link, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { signInFetch } from '../slice/authSlice';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '../../../components/loader/Spinner';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

/** Sign-in input field (email/password). */
function SignInTextField({
  control,
  name,
  labelKey,
  placeholderKey,
  type,
  autoComplete,
}) {
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
              autoComplete={autoComplete}
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

SignInTextField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  placeholderKey: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  autoComplete: PropTypes.string,
};

/** Remind-me / forgot-password row. */
function buildRemindMeRow({ t }) {
  return (
    <div className="flex items-center justify-between">
      <p>{t('remind_me')}</p>
      <Link className="text-sm font-medium text-gray-900 underline underline-offset-4 hover:text-gray-700 dark:text-gray-50 dark:hover:text-gray-300">
        {t('forgot_password')}
      </Link>
    </div>
  );
}

/** Centered submit row. */
function buildSubmitRow({ t, isLoading }) {
  return (
    <div className="flex items-center justify-center">
      <Button type="submit" disabled={isLoading} className="flex-1">
        {t('sign_in')}
      </Button>
    </div>
  );
}

/**
 * Sign-in form state: credentials submit dispatches `signInFetch` and
 * a successful auth state navigates to /home (once).
 */
function useSignInForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // const state = useSelector(state => state) todos los estados
  const { user, isError, isLoading, errorMessage } = useSelector(
    (state) => state.auth
  );
  const form = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });
  const { t } = useTranslation();

  const onSubmit = ({ email, password }) => {
    dispatch(signInFetch({ email, password }));
  };

  const hasNavigated = useRef(false);

  useEffect(() => {
    if (hasNavigated.current) return;
    if (!isError && user && !user?.error) {
      hasNavigated.current = true;
      navigate('/home', { replace: true });
    }
  }, [user, isError, navigate]);

  // const handleChangeEmail = useCallback(
  //   e => dispatch(updateAuthData(e.target.value)),
  //   [dispatch]
  // )

  const checkState = () => {
    console.log('newSate', user);
  };

  return { t, form, isLoading, isError, errorMessage, onSubmit, checkState };
}

export const SignInForm = () => {
  const { t, form, isLoading, isError, errorMessage, onSubmit, checkState } =
    useSignInForm();

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
            <SignInTextField
              control={form.control}
              name="email"
              labelKey="email"
              placeholderKey="sign_email_placeholder"
              type="email"
              autoComplete="false"
              // onChange={handleChangeEmail(event)}
            />

            <SignInTextField
              control={form.control}
              name="password"
              labelKey="password"
              placeholderKey="sign_password_placeholder"
              type="password"
              autoComplete="current-password"
            />

            {buildRemindMeRow({ t })}

            {buildSubmitRow({ t, isLoading })}

            {isError && errorMessage && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {errorMessage}
              </p>
            )}
          </form>
        </Form>
      </div>

      {isLoading && <Spinner />}

      <div>
        <button onClick={checkState}>{t('check_state')}</button>
      </div>
    </>
  );
};
