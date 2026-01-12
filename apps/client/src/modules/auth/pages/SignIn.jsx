import { AuthWelcomeMessage, SignInForm, AuthFooter } from '../components/index'

const SignIn = () => {
  return (
    <div className='flex items-center justify-center px-4 bg-gray-100 min-h-dvh dark:bg-gray-950'>
      <div className='w-full max-w-md space-y-6'>
        <AuthWelcomeMessage field_sign_message={'sign_in_message'} />
        <SignInForm />
        <AuthFooter
          link={'/signUp'}
          linkMessage={'sign_up'}
          authMessage={'dont_you_have_an_account'}
        />
      </div>
    </div>
  )
}

export default SignIn
