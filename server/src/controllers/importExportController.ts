import { Request, Response } from 'express'
import { importExportService } from '../services/importExportService'
import { asyncHandler, AppError } from '../middleware/errorHandler'

const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

function sendExport(res: Response, data: Buffer | string, format: string, filename: string) {
  if (format === 'xlsx') {
    res.setHeader('Content-Type', XLSX_CONTENT_TYPE)
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`)
  } else {
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`)
  }
  res.send(data)
}

export const importExportController = {
  exportResidents: asyncHandler(async (req: Request, res: Response) => {
    const format = ((req.query.format as string) || 'xlsx') as 'xlsx' | 'csv'
    const data = await importExportService.exportResidents(format)
    sendExport(res, data as Buffer | string, format, 'residents')
  }),

  exportRaffleResults: asyncHandler(async (req: Request, res: Response) => {
    const format = ((req.query.format as string) || 'xlsx') as 'xlsx' | 'csv'
    const cycleId = req.params.cycleId as string
    const data = await importExportService.exportRaffleResults(cycleId, format)
    sendExport(res, data as Buffer | string, format, 'raffle-results')
  }),

  exportParkingConfig: asyncHandler(async (req: Request, res: Response) => {
    const format = ((req.query.format as string) || 'xlsx') as 'xlsx' | 'csv'
    const data = await importExportService.exportParkingConfig(format)
    sendExport(res, data as Buffer | string, format, 'parking-config')
  }),

  importResidents: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400)
    }
    const result = await importExportService.importResidents(req.file.buffer, req.file.mimetype)
    res.json({ success: true, data: result })
  }),

  importParkingConfig: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400)
    }
    const result = await importExportService.importParkingConfig(
      req.file.buffer,
      req.file.mimetype
    )
    res.json({ success: true, data: result })
  })
}
