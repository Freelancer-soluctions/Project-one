import { useNavigate } from "react-router-dom"
import { Button } from '../ui/button'

const NotFound = () => {
  const navigate = useNavigate()
  const goback = () => {
    navigate(-1)
  }
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-gray-100 px-4 py-12 dark:bg-gray-950">
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-gray-100 dark:bg-gray-900 px-4 md:px-6">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="font-bold tracking-tighter text-gray-900 text-8xl dark:text-gray-50">404</h1>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-50">Oops! Page not found.</h2>
          <p className="text-gray-500 dark:text-gray-400">The page you're looking for doesn't exist or has been moved.</p>
          <Button onClick={goback}>
            Go back home
          </Button>
        </div>
      </div>
    </main>
  )
}
export default NotFound

