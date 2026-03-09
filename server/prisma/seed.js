'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
const client_1 = require('@prisma/client')
const bcryptjs_1 = __importDefault(require('bcryptjs'))
const prisma = new client_1.PrismaClient()
async function main() {
  console.log('Seeding database...')

  const adminPassword = await bcryptjs_1.default.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ivillaparking.com' },
    update: {},
    create: {
      email: 'admin@ivillaparking.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      apartment: 'ADMIN',
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  })
  console.log(`Admin user created: ${admin.email}`)

  const configs = [
    { vehicleType: 'CAR', totalSpots: 10 },
    { vehicleType: 'MOTORCYCLE', totalSpots: 5 },
    { vehicleType: 'BICYCLE', totalSpots: 3 }
  ]
  for (const config of configs) {
    await prisma.parkingSpotConfig.create({
      data: config
    })
  }
  console.log('Parking spot config created')
  console.log('Seed completed!')
}
main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
//# sourceMappingURL=seed.js.map
