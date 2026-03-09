import { Request, Response } from 'express'
import { cameraService } from '../services/cameraService'
import { asyncHandler, AppError } from '../middleware/errorHandler'
import { parseIntClamped } from '../utils/parseQuery'
import { PAGINATION } from '@ivillaparking/shared'

export const cameraController = {
  detect: asyncHandler(async (req: Request, res: Response) => {
    const { licensePlate } = req.body
    if (!licensePlate) {
      throw new AppError('License plate is required', 400)
    }
    const detection = await cameraService.detect(licensePlate)
    res.status(201).json({ success: true, data: detection })
  }),

  getDetections: asyncHandler(async (req: Request, res: Response) => {
    const detections = await cameraService.getDetections({
      limit: parseIntClamped(req.query.limit as string, PAGINATION.DETECTIONS_LIMIT, 1, PAGINATION.MAX_PAGE_SIZE),
      status: req.query.status as string
    })
    res.json({ success: true, data: detections })
  })
}
