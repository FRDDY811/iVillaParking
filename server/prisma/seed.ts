import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const adminPassword = await bcrypt.hash('admin123', 12)
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
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
