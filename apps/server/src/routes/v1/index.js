import { Router } from 'express'
import auth from '../../modules/auth/routes.js'
import news from '../../modules/news/routes.js'
import providers from '../../modules/providers/routes.js'
import notes from '../../modules/notes/routes.js'
import settings from '../../modules/settings/routes.js'
import events from '../../modules/events/routes.js'
import products from '../../modules/products/routes.js'
import warehouse from '../../modules/warehouse/routes.js'
import stock from '../../modules/stock/routes.js'
import inventoryMovement from '../../modules/inventoryMovement/routes.js'
import sale from '../../modules/sale/routes.js'
import clients from '../../modules/clients/routes.js'
import purchase from '../../modules/purchase/routes.js'
import employees from '../../modules/employees/routes.js'
import attendance from '../../modules/attendance/routes.js'
import payroll from '../../modules/payroll/routes.js'
import vacation from '../../modules/vacation/routes.js'
import permission from '../../modules/permission/routes.js'
import users from '../../modules/users/routes.js'
import expenses from '../../modules/expenses/routes.js'
import performanceEvaluation from '../../modules/performanceEvaluation/routes.js'
import security from '../../modules/security/routes.js'

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
router.use('/employees', employees)
router.use('/attendance', attendance)
router.use('/payroll', payroll)
router.use('/vacation', vacation)
router.use('/permission', permission)
router.use('/users', users)
router.use('/expenses', expenses)
router.use('/performance-evaluation', performanceEvaluation)
router.use('/security', security)
export default router
