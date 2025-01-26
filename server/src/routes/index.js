import { Router } from 'express'
import auth from '../components/auth/routes.js'
import news from '../components/news/routes.js'
import newsStatus from '../components/newsStatus/routes.js'
import note from '../components/note/routes.js'
import noteStatus from '../components/noteStatus/routes.js'
import question from '../components/question/routes.js'
import role from '../components/role/routes.js'
import userStatus from '../components/userStatus/routes.js'

const router = Router()
router.use('/auth', auth)
router.use('/news', news)
router.use('/newsStatus', newsStatus)
router.use('/note', note)
router.use('/noteStatus', noteStatus)
router.use('/question', question)
router.use('/role', role)
router.use('/userStatus', userStatus)
router.use('/settings')

export default router
