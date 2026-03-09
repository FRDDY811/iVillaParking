import { Router } from 'express'
import { userController } from '../controllers/userController'
import { authenticate, authorize } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { updateUserSchema } from '../validators/user'

const router = Router()

router.use(authenticate)

router.get('/', authorize('ADMIN'), userController.getAll)
router.get('/pending', authorize('ADMIN'), userController.getPending)
router.get('/:id', authorize('ADMIN'), userController.getById)
router.patch('/:id', authorize('ADMIN'), validate(updateUserSchema), userController.update)
router.delete('/:id', authorize('ADMIN'), userController.delete)

export default router
