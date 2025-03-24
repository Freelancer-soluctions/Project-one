import { lazy, Suspense } from 'react'
import Layout from './components/layout'
import { ProtectedRoutes, ProtectedFormRoute } from './components/guards'
import Home from './modules/home/pages/Home'
import NotFound from './components/404/NotFound'
import { Routes, Route } from 'react-router'
import { Spinner } from './components/loader/Spinner'
import { Toaster } from './components/ui/toaster'

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
const Stock = lazy(() => import('@/modules/stock/pages/Stock'))
/* const Sales = lazy(() => import('@/modules/sales/pages/Sales')) 
const Clients = lazy(() => import('@/modules/clients/pages/Clients'))
const Purchases = lazy(() => import('@/modules/purchases/pages/Purchases'))
const InventoryMovement = lazy(() => import('@/modules/inventoryMovement/pages/InventoryMovement')) */
/* const Attendance = lazy(() => import('@/modules/attendance/pages/Attendance'))
const Payroll = lazy(() => import('@/modules/payroll/pages/Payroll'))
const PerformanceEvaluation = lazy(() => import('@/modules/performanceEvaluation/pages/PerformanceEvaluation'))
const Vacations = lazy(() => import('@/modules/vacations/pages/Vacations'))
const Permission = lazy(() => import('@/modules/permission/pages/Permission')) */
/* const Employees = lazy(() => import('@/modules/employees/pages/Employees')) */



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
          <Route path='stock' element={<Stock />} />
 */} 
    {/*       <Route path='sales' element={<Sales />} />
          <Route path='clients' element={<Clients />} />
          <Route path='purchases' element={<Purchases />} />
          <Route path='inventoryMovement' element={<InventoryMovement />} /> */}
    {/*       <Route path='attendance' element={<Attendance />} />
          <Route path='payroll' element={<Payroll />} />
          <Route path='performanceEvaluation' element={<PerformanceEvaluation />} />
          <Route path='vacations' element={<Vacations />} />
          <Route path='permission' element={<Permission />} /> 
          <Route path='employees' element={<Employees />} />

        

          {/* <Route path='inventory' element={<Events />} />
          <Route path='expenses' element={<Events />} /> */}

          {/* Ruta comodín para manejar 404 en /home */}
          <Route path='*' element={<NotFound link={'/home'} />} />
        </Route>

        {/* Ruta global comodín para manejar 404 */}
        <Route path='*' element={<NotFound link={'/'} />} />
      </Routes>
      <Toaster />
    </Suspense>
  )
}

export default App
