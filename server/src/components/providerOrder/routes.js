```javascript
import { Router } from 'express'
import * as providerOrderController from './controller.js'
import { validateCreateProviderOrder, validateUpdateProviderOrder } from './schemas.js'
import { auth } from '../../middleware/auth.js'

const router = Router()

router.get('/', auth, providerOrderController.getAllProviderOrders)
router.post('/', auth, validateCreateProviderOrder, providerOrderController.createProviderOrder)
router.put('/:id', auth, validateUpdateProviderOrder, providerOrderController.updateProviderOrderById)
router.delete('/:id', auth, providerOrderController.deleteProviderOrderById)

export default router