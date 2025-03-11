import { Router } from 'express'
import auth from '../components/auth/routes.js'
import news from '../components/news/routes.js'
import notes from '../components/notes/routes.js'
import role from '../components/role/routes.js'
import settings from '../components/settings/routes.js'
import events from '../components/events/routes.js'
import products from '../components/products/routes.js'

const router = Router()
router.use('/auth', auth)
router.use('/news', news)
router.use('/settings', settings)
router.use('/notes', notes)
router.use('/events', events)
router.use('/products', products)

router.use('/role', role)

export default router
