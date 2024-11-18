import { lazy } from 'react'
// import ProtectedRoutes from './components/protectedRoutes/ProtectedRoutes'
import Home from './modules/home/pages/Home'
import homeChildrenRoutes from './routes'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './components/layout'
import NotFound from './components/404/NotFound'


//Types page
const SignIn = lazy(() => import('@/modules/auth/pages/SignIn'));
const SignUp = lazy(() => import('@/modules/auth/pages/SignUp'));



const App = () => {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Layout />,
      children: [
        {
          // index: true,
          path: '/signIn',
          element: <SignIn/>
        },
        {
          path: '/signUp',
          element: <SignUp/>
        }
      ]

      // errorElement: <NotFound /> // ver diferencia con /*
    },
    {
      path: '/home',
      element: (
        // <ProtectedRoutes redirectTo='/signIn'>
        <Home />
        /* </ProtectedRoutes> */
      ),
      children: homeChildrenRoutes
      // errorElement:  <NotFound />, // ver diferencia con /*
    },
    {
      path: '/*',
      element: <NotFound />
    },
  ], { future: { v7_relativeSplatPath: true } }
  )

  return <RouterProvider router={router} />
}

export default App
