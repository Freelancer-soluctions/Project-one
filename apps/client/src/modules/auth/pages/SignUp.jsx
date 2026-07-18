import {
  AuthWelcomeMessage,
  SignUpForm,
  AuthFooter,
} from '../components/index';

const SignUp = () => {
  return (
    <div className="flex items-center justify-center px-4 bg-gray-100 min-h-dvh dark:bg-gray-950">
      <div className="w-full max-w-md space-y-6">
        <AuthWelcomeMessage field_sign_message={'sign_up_message'} />
        <SignUpForm />
        <AuthFooter
          link={'/signIn'}
          linkMessage={'sign_in'}
          authMessage={'do_you_have_an_account'}
        />
      </div>
    </div>
  );
};

export default SignUp;
