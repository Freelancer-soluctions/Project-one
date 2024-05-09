import { Router } from 'express'
import newsStatus from '../components/newsStatus/routes.js'
import noteStatus from '../components/noteStatus/routes.js'
import userStatus from '../components/userStatus/routes.js'


const router = Router()
router.use('/newsStatus' , newsStatus)
router.use('/noteStatus' , noteStatus)
router.use('/userStatus' , userStatus)


export default router
