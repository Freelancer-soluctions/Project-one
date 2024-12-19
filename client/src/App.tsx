import { lazy } from 'react'
import Home from './modules/home/pages/Home'

import Layout from './components/layout'
import NotFound from './components/404/NotFound'
import { Route, Routes } from 'react-router'

// import { createBrowserRouter, RouterProvider } from 'react-router-dom'
// import ProtectedRoutes from './components/protectedRoutes/ProtectedRoutes'

//Types page
const SignIn = lazy(() => import('@/modules/auth/pages/SignIn'))
const SignUp = lazy(() => import('@/modules/auth/pages/SignUp'))
const Access = lazy(() => import('@/modules/access/pages/Access'))
const Note = lazy(() => import('@/modules/note/pages/Note'))
const News = lazy(() => import('@/modules/news/pages/News'))

const App = () => {
  return (
    <>
      <Routes>
        <Route path='/' element={<Layout />} />
        <Route path='/signIn' element={<SignIn />} />
        <Route path='/signUp' element={<SignUp />} />
        <Route path='/home' element={<Home />}>
          <Route index element={<Access />} />
          <Route path='notes' element={<Note />} />
          <Route path='news' element={<News />} />
        </Route>
        <Route path='*' element={<NotFound />} />
      </Routes>
    </>
  )
  // const router = createBrowserRouter([
  //   {
  //     path: '/',
  //     element: <Layout />,
  //     children: [
  //       {
  //         // index: true,
  //         path: '/signIn',
  //         element: <SignIn/>
  //       },
  //       {
  //         path: '/signUp',
  //         element: <SignUp/>
  //       }
  //     ]

  //     // errorElement: <NotFound /> // ver diferencia con /*
  //   },
  //   {
  //     path: '/home',
  //     element: (
  //       // <ProtectedRoutes redirectTo='/signIn'>
  //       <Home />
  //       /* </ProtectedRoutes> */
  //     ),
  //     children: homeChildrenRoutes
  //     // errorElement:  <NotFound />, // ver diferencia con /*
  //   },
  //   {
  //     path: '/*',
  //     element: <NotFound />
  //   },
  // ], { future: { v7_relativeSplatPath: true } }
  // )

  // return <RouterProvider router={router} />
}

export default App
