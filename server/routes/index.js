import { Router } from 'express'

const router = Router()
router.use('/user', () => {
  console.log('Estoy aqui de temporal')
})

export default router
