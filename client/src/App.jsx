import { lazy, Suspense } from 'react'
import Layout from './components/layout'
import ProtectedRoutes from './components/protectedRoutes/ProtectedRoutes'
import Home from './modules/home/pages/Home'
import NotFound from './components/404/NotFound'
import homeChildrenRoutes from './routes'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Routes, Route } from 'react-router'
import { ErrorBoundary } from 'react-error-boundary'
import { Spinner } from './components/loader/Spinner'
// const App = () => {
//   const router = createBrowserRouter([
//     {
//       path: '/',
//       element: <Layout />,
//       children: []

//       // errorElement: <NotFound /> // ver diferencia con /*
//     },
//     {
//       // index: true,
//       path: '/signIn',
//       Component: lazy(() => import('@/modules/auth/pages/SignIn'))
//     },
//     {
//       path: '/signUp',
//       Component: lazy(() => import('@/modules/auth/pages/SignUp'))
//     },
//     {
//       path: '/home',
//       element: (
//         // <ProtectedRoutes redirectTo='/signIn'>
//         <Home />
//         /* </ProtectedRoutes> */
//       ),
//       children: homeChildrenRoutes
//       // errorElement:  <NotFound />, // ver diferencia con /*
//     },
//     {
//       path: '/*',
//       element: <NotFound />
//     }
//   ])

//   return <RouterProvider router={router} />
// }

// export default App

const SignIn = lazy(() => import('@/modules/auth/pages/SignIn'))
const SignUp = lazy(() => import('@/modules/auth/pages/SignUp'))
const Access = lazy(() => import('@/modules/access/pages/Access'))
const Note = lazy(() => import('@/modules/note/pages/Note'))
const News = lazy(() => import('@/modules/news/pages/News'))
const InternalServerError = lazy(
  () => import('@/components/500/InternalServerError')
)

import { useRouteError } from 'react-router'

const ErrorPage = () => {
  const error = useRouteError()

  return (
    <div>
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{error.statusText || error.message}</i>
      </p>
    </div>
  )
}
const Home2 = () => <div>Bienvenido a Home</div>
const App = () => {
  return (
    <Suspense fallback={<Spinner />}>
      <ErrorBoundary
        FallbackComponent={InternalServerError}
        onReset={() => {
          // Realiza alguna acción para reiniciar el estado de la aplicación
        }}>
        <Routes>
          {/* Rutas principales */}
          <Route path='/' element={<Layout />} />
          <Route path='/signIn' element={<SignIn />} />
          <Route path='/signUp' element={<SignUp />} />

          {/* Ruta padre con subrutas */}
          <Route path='/home' element={<Home />}>
            <Route index element={<Access />} />
            <Route path='news' element={<News />} />
            <Route path='notes' element={<Note />} />

            {/* Ruta comodín para manejar 404 en /home */}
            <Route path='*' element={<NotFound link={'/home'} />} />
          </Route>

          {/* Ruta global comodín para manejar 404 */}
          <Route path='*' element={<NotFound link={'/'} />} />
        </Routes>
      </ErrorBoundary>
    </Suspense>
  )
}

export default App
