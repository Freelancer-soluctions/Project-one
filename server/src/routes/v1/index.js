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
router.use('/role', role)

export default router
