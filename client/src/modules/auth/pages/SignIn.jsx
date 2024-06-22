import SignInForm from '../components/SignInForm'

const SignIn = () => {
  return (
    <div className="flex items-center justify-center px-4 bg-gray-100 min-h-dvh dark:bg-gray-950">
      <div className="w-full max-w-md space-y-6">
        <SignInForm />
      </div>
    </div>

  )
}

export default SignIn