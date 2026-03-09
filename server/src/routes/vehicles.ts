import { Router } from 'express'
import { vehicleController } from '../controllers/vehicleController'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { createVehicleSchema, updateVehicleSchema } from '../validators/vehicle'

const router = Router()

router.use(authenticate)

router.get('/', vehicleController.getAll)
router.get('/search', vehicleController.search)
router.get('/:id', vehicleController.getById)
router.post('/', validate(createVehicleSchema), vehicleController.create)
router.put('/:id', validate(updateVehicleSchema), vehicleController.update)
router.delete('/:id', vehicleController.delete)

export default router
