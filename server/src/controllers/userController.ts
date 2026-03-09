import { Request, Response } from 'express'
import { userService } from '../services/userService'
import { asyncHandler } from '../middleware/errorHandler'
import { parseIntClamped } from '../utils/parseQuery'
import { PAGINATION } from '@ivillaparking/shared'

export const userController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.getAll({
      page: parseIntClamped(req.query.page as string, 1, 1),
      limit: parseIntClamped(req.query.limit as string, PAGINATION.DEFAULT_PAGE_SIZE, 1, PAGINATION.MAX_PAGE_SIZE),
      status: req.query.status as string,
      role: req.query.role as string,
      search: req.query.search as string
    })
    res.json({ success: true, ...result })
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getById(req.params.id as string)
    res.json({ success: true, data: user })
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.update(req.params.id as string, req.body)
    res.json({ success: true, data: user })
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await userService.delete(req.params.id as string)
    res.json({ success: true, message: 'User deleted successfully' })
  }),

  getPending: asyncHandler(async (_req: Request, res: Response) => {
    const users = await userService.getPending()
    res.json({ success: true, data: users })
  })
}
