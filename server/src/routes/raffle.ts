import { Router } from 'express'
import { raffleController } from '../controllers/raffleController'
import { authenticate, authorize } from '../middleware/auth'
import { validate } from '../middleware/validate'
import {
  createRaffleCycleSchema,
  updateRaffleCycleSchema,
  raffleRegistrationSchema
} from '../validators/raffle'

const router = Router()

router.use(authenticate)

router.get('/cycles', raffleController.getCycles)
router.get('/cycles/:id', raffleController.getCycleById)
router.post('/cycles', authorize('ADMIN'), validate(createRaffleCycleSchema), raffleController.createCycle)
router.patch('/cycles/:id', authorize('ADMIN'), validate(updateRaffleCycleSchema), raffleController.updateCycle)

router.post('/cycles/:cycleId/register', validate(raffleRegistrationSchema), raffleController.register)
router.delete('/cycles/:cycleId/register/:vehicleId', raffleController.unregister)
router.get('/registrations', raffleController.getUserRegistrations)

router.post('/cycles/:id/execute', authorize('ADMIN'), raffleController.execute)
router.get('/cycles/:id/results', raffleController.getResults)

export default router
