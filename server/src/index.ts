import app from './app'
import { env } from './config/env'
import logger from './utils/logger'

app.listen(env.PORT, () => {
  logger.info(`iVillaParking server is running on port ${env.PORT}`)
  logger.info(`Environment: ${env.NODE_ENV}`)
})
