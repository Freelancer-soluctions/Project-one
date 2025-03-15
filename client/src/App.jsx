import { lazy, Suspense } from 'react'
import Layout from './components/layout'
import { ProtectedRoutes, ProtectedFormRoute } from './components/guards'
import Home from './modules/home/pages/Home'
import NotFound from './components/404/NotFound'
import { Routes, Route } from 'react-router'
import { Spinner } from './components/loader/Spinner'

const SignIn = lazy(() => import('@/modules/auth/pages/SignIn'))
const SignUp = lazy(() => import('@/modules/auth/pages/SignUp'))
const Access = lazy(() => import('@/modules/home/components/AccessCardModules'))
const Notes = lazy(() => import('@/modules/notes/pages/Notes'))
const News = lazy(() => import('@/modules/news/pages/News'))
const Settings = lazy(() => import('@/modules/settings/pages/Settings'))
const Events = lazy(() => import('@/modules/events/pages/Events'))
const Products = lazy(() => import('@/modules/products/pages/Products'))
const ProductsForms = lazy(
  () => import('@/modules/products/pages/ProductsForms')
)
const Providers = lazy(() => import('@/modules/providers/pages/Providers'))
const Warehouse = lazy(() => import('@/modules/warehouse/pages/Warehouse'))

const App = () => {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* Rutas principales */}
        <Route path='/' element={<Layout />} />
        <Route path='/signIn' element={<SignIn />} />
        <Route path='/signUp' element={<SignUp />} />

        {/* Ruta padre con subrutas */}
        <Route
          path='/home'
          element={
            <ProtectedRoutes redirectTo='/signIn'>
              <Home />
            </ProtectedRoutes>
          }>
          <Route index element={<Access />} />
          <Route path='news' element={<News />} />
          <Route path='notes' element={<Notes />} />
          <Route path='settings' element={<Settings />} />
          <Route path='events' element={<Events />} />
          <Route path='products' element={<Products />} />
          <Route
            path='productsForms'
            element={
              <ProtectedFormRoute>
                <ProductsForms />
              </ProtectedFormRoute>
            }
          />
          <Route path='providers' element={<Providers />} />
          <Route path='warehouse' element={<Warehouse />} />


          {/* <Route path='inventory' element={<Events />} />
          <Route path='expenses' element={<Events />} /> */}

          {/* Ruta comodín para manejar 404 en /home */}
          <Route path='*' element={<NotFound link={'/home'} />} />
        </Route>

        {/* Ruta global comodín para manejar 404 */}
        <Route path='*' element={<NotFound link={'/'} />} />
      </Routes>
    </Suspense>
  )
}

export default App
