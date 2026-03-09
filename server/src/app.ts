import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import { generalLimiter } from './middleware/rateLimiter'
import { sanitizeBody } from './middleware/sanitize'
import { errorHandler } from './middleware/errorHandler'
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import vehicleRoutes from './routes/vehicles'
import parkingSpotRoutes from './routes/parkingSpots'
import raffleRoutes from './routes/raffle'
import importExportRoutes from './routes/importExport'
import cameraRoutes from './routes/camera'

const app = express()

// Security middleware
app.use(helmet())

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173']
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
)
app.use(generalLimiter)

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'))
}

// Body parsing
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Sanitize all request bodies
app.use(sanitizeBody)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/parking-spots', parkingSpotRoutes)
app.use('/api/raffle', raffleRoutes)
app.use('/api/import-export', importExportRoutes)
app.use('/api/camera', cameraRoutes)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'iVillaParking API is running' })
})

// Error handler
app.use(errorHandler)

export default app
