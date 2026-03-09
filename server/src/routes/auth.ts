import { Router } from 'express'
import { authController } from '../controllers/authController'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { registerSchema, loginSchema } from '../validators/auth'
import { authLimiter } from '../middleware/rateLimiter'

const router = Router()

router.post('/register', authLimiter, validate(registerSchema), authController.register)
router.post('/login', authLimiter, validate(loginSchema), authController.login)
router.post('/refresh', authController.refresh)
router.post('/logout', authenticate, authController.logout)
router.get('/me', authenticate, authController.getMe)

export default router
