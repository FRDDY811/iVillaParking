import { Router } from 'express'
import { cameraController } from '../controllers/cameraController'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.use(authenticate, authorize('ADMIN'))

router.post('/detect', cameraController.detect)
router.get('/detections', cameraController.getDetections)

export default router
