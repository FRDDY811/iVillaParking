import { Request, Response } from 'express'
import { raffleService } from '../services/raffleService'
import { asyncHandler, requireUser } from '../middleware/errorHandler'

export const raffleController = {
  getCycles: asyncHandler(async (req: Request, res: Response) => {
    const cycles = await raffleService.getCycles({ status: req.query.status as string })
    res.json({ success: true, data: cycles })
  }),

  getCycleById: asyncHandler(async (req: Request, res: Response) => {
    const cycle = await raffleService.getCycleById(req.params.id as string)
    res.json({ success: true, data: cycle })
  }),

  createCycle: asyncHandler(async (req: Request, res: Response) => {
    const cycle = await raffleService.createCycle(req.body)
    res.status(201).json({ success: true, data: cycle })
  }),

  updateCycle: asyncHandler(async (req: Request, res: Response) => {
    const cycle = await raffleService.updateCycle(req.params.id as string, req.body)
    res.json({ success: true, data: cycle })
  }),

  register: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req)
    const registration = await raffleService.register(
      user.userId,
      req.body.vehicleId,
      req.params.cycleId as string
    )
    res.status(201).json({ success: true, data: registration })
  }),

  unregister: asyncHandler(async (req: Request, res: Response) => {
    await raffleService.unregister(requireUser(req).userId, req.params.vehicleId as string, req.params.cycleId as string)
    res.json({ success: true, message: 'Unregistered successfully' })
  }),

  execute: asyncHandler(async (req: Request, res: Response) => {
    const result = await raffleService.execute(req.params.id as string)
    res.json({ success: true, data: result })
  }),

  getResults: asyncHandler(async (req: Request, res: Response) => {
    const results = await raffleService.getResults(req.params.id as string)
    res.json({ success: true, data: results })
  }),

  getUserRegistrations: asyncHandler(async (req: Request, res: Response) => {
    const registrations = await raffleService.getUserRegistrations(
      requireUser(req).userId,
      req.query.cycleId as string
    )
    res.json({ success: true, data: registrations })
  })
}
