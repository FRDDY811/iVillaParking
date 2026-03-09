import { Request, Response } from 'express'
import { parkingSpotService } from '../services/parkingSpotService'
import { asyncHandler, requireUser } from '../middleware/errorHandler'

export const parkingSpotController = {
  getConfig: asyncHandler(async (_req: Request, res: Response) => {
    const config = await parkingSpotService.getConfig()
    res.json({ success: true, data: config })
  }),

  getAllConfigs: asyncHandler(async (_req: Request, res: Response) => {
    const configs = await parkingSpotService.getAllConfigs()
    res.json({ success: true, data: configs })
  }),

  createConfig: asyncHandler(async (req: Request, res: Response) => {
    const config = await parkingSpotService.createConfig(req.body)
    res.status(201).json({ success: true, data: config })
  }),

  getCurrentAssignments: asyncHandler(async (_req: Request, res: Response) => {
    const assignments = await parkingSpotService.getCurrentAssignments()
    res.json({ success: true, data: assignments })
  }),

  getAssignmentHistory: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req)
    const userId = user.role === 'ADMIN' ? (req.query.userId as string) : user.userId
    const assignments = await parkingSpotService.getAssignmentHistory(userId)
    res.json({ success: true, data: assignments })
  })
}
