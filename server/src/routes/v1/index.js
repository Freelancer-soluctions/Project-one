import { Router } from 'express'
import auth from '../../components/auth/routes.js'
import news from '../../components/news/routes.js'
import providers from '../../components/providers/routes.js'
import notes from '../../components/notes/routes.js'
import role from '../../components/role/routes.js'
import settings from '../../components/settings/routes.js'
import events from '../../components/events/routes.js'
import products from '../../components/products/routes.js'
import warehouse from '../../components/warehouse/routes.js'
import stock from '../../components/stock/routes.js'
import inventoryMovement from '../../components/inventoryMovement/routes.js'
import sale from '../../components/sale/routes.js'
import clients from '../../components/clients/routes.js'
import purchase from '../../components/purchase/routes.js'
import employees from '../../components/employees/routes.js'
import attendance from '../../components/attendance/routes.js'
import payroll from '../../components/payroll/routes.js'
import vacation from '../../components/vacation/routes.js'
import permission from '../../components/permission/routes.js'

const router = Router()
router.use('/auth', auth)
router.use('/news', news)
router.use('/settings', settings)
router.use('/notes', notes)
router.use('/events', events)
router.use('/products', products)
router.use('/providers', providers)
router.use('/warehouse', warehouse)
router.use('/stock', stock)
router.use('/inventory-movement', inventoryMovement)
router.use('/sales', sale)
router.use('/clients', clients)
router.use('/purchases', purchase)
router.use('/role', role)
router.use('/employees', employees)
router.use('/attendance', attendance)
router.use('/payroll', payroll)
router.use('/vacation', vacation)
router.use('/permission', permission)

export default router
