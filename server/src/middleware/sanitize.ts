/**
 * XSS protection middleware.
 * Recursively sanitizes all string values in req.body to strip
 * potentially malicious HTML/script tags before reaching controllers.
 */
import { Request, Response, NextFunction } from 'express'
import { sanitizeObject } from '../utils/sanitize'

export function sanitizeBody(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body)
  }
  next()
}
