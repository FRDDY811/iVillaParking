import { Router } from 'express'
import { parkingSpotController } from '../controllers/parkingSpotController'
import { authenticate, authorize } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { createParkingConfigSchema } from '../validators/parkingSpot'

const router = Router()

router.use(authenticate)

router.get('/config', parkingSpotController.getConfig)
router.get('/config/all', authorize('ADMIN'), parkingSpotController.getAllConfigs)
router.post('/config', authorize('ADMIN'), validate(createParkingConfigSchema), parkingSpotController.createConfig)
router.get('/assignments', parkingSpotController.getCurrentAssignments)
router.get('/history', parkingSpotController.getAssignmentHistory)

export default router
