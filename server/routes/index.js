import { Router } from 'express'
import auth from '../components/auth/routes.js'
import note from '../components/note/routes.js'
import news from '../components/news/routes.js'
import newsStatus from '../components/newsStatus/routes.js'
import noteStatus from '../components/noteStatus/routes.js'
import userStatus from '../components/userStatus/routes.js'

const router = Router()
router.use('/news', news)
router.use('/note', note)
router.use('/newsStatus', newsStatus)
router.use('/noteStatus', noteStatus)
router.use('/userStatus', userStatus)

router.use('/auth', auth)

export default router
