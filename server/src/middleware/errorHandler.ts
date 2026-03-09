/**
 * Centralized error handling.
 *
 * AppError: application-level error with an HTTP status code. Throw from any
 * service/controller and it will be caught here and returned as JSON.
 *
 * errorHandler: Express error middleware (4 params). Maps AppError to its
 * statusCode; all other errors become 500. All errors are logged via Winston.
 *
 * @todo (scalability): External monitoring — report errors to Sentry/Datadog for alerting.
 */
import { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger'

export class AppError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.name = 'AppError'
  }
}

/** Narrows req.user to non-null, throwing 401 if authentication middleware didn't run. */
export function requireUser(req: Request): { userId: string; role: string } {
  if (!req.user) {
    throw new AppError('Authentication required', 401)
  }
  return req.user
}

/** Wraps an async route handler to forward thrown errors to Express error middleware. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const message = err instanceof Error ? err.message : String(err)
  const stack = err instanceof Error ? err.stack : undefined
  logger.error(message, stack)

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    })
  }

  return res.status(500).json({
    success: false,
    error: 'Internal server error'
  })
}
