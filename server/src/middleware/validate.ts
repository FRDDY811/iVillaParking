/**
 * Request body validation middleware using Zod schemas.
 * Parses req.body against the provided schema; on failure returns 400
 * with field-level error details. On success, replaces req.body with
 * the parsed/coerced data (stripping unknown fields).
 */
import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      })
    }

    req.body = result.data
    next()
  }
}
