import { Router } from 'express'
import multer from 'multer'
import { importExportController } from '../controllers/importExportController'
import { authenticate, authorize } from '../middleware/auth'

const fileSize = 5 * 1024 * 1024

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize } })
const router = Router()

router.use(authenticate, authorize('ADMIN'))

router.get('/residents', importExportController.exportResidents)
router.post('/residents', upload.single('file'), importExportController.importResidents)

router.get('/raffle/:cycleId', importExportController.exportRaffleResults)

router.get('/parking-config', importExportController.exportParkingConfig)
router.post('/parking-config', upload.single('file'), importExportController.importParkingConfig)

export default router
