import { Request, Response } from 'express'
import { vehicleService } from '../services/vehicleService'
import { asyncHandler, requireUser } from '../middleware/errorHandler'

export const vehicleController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req)
    const userId = user.role === 'ADMIN' ? undefined : user.userId
    const vehicles = await vehicleService.getAll(userId)
    res.json({ success: true, data: vehicles })
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await vehicleService.getById(req.params.id as string)
    res.json({ success: true, data: vehicle })
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req)
    const vehicle = await vehicleService.create(user.userId, req.body)
    res.status(201).json({ success: true, data: vehicle })
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req)
    const vehicle = await vehicleService.update(
      req.params.id as string,
      user.userId,
      req.body,
      user.role === 'ADMIN'
    )
    res.json({ success: true, data: vehicle })
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req)
    await vehicleService.delete(req.params.id as string, user.userId, user.role === 'ADMIN')
    res.json({ success: true, message: 'Vehicle deleted successfully' })
  }),

  search: asyncHandler(async (req: Request, res: Response) => {
    const vehicles = await vehicleService.searchByPlate((req.query.q as string) || '')
    res.json({ success: true, data: vehicles })
  })
}
