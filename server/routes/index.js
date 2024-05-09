import { Router } from 'express'
import userStatus from '../components/userStatus/routes.js'

const router = Router()
router.use('/userStatus',userStatus)

export default router
