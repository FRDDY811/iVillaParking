/**
 * Authentication and authorization middleware.
 *
 * authenticate() extracts the JWT from the Authorization header, verifies it,
 * and attaches { userId, role } to req.user for downstream handlers.
 *
 * authorize() is a factory that returns middleware restricting access to
 * specific roles (e.g., authorize('ADMIN')).
 *
 * @todo (scalability): RBAC — replace role-based checks with fine-grained permission strings (e.g., 'raffle:execute', 'user:approve').
 */
import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt'
import { AppError } from './errorHandler'

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: string
      role: string
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401))
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = verifyAccessToken(token)
    req.user = payload
    next()
  } catch {
    next(new AppError('Invalid or expired token', 401))
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401))
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403))
    }

    next()
  }
}
