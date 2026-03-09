import prisma from '../config/database'
import * as XLSX from 'xlsx'
import { Parser } from 'json2csv'
import { Readable } from 'stream'
import csvParser from 'csv-parser'
import { hashPassword } from '../utils/password'
import { AppError } from '../middleware/errorHandler'
import { VEHICLE_TYPES } from '@ivillaparking/shared'
import { invalidateCache, CACHE_KEYS } from '../config/cache'

/**
 * Bulk data operations for admin: export residents/results/config to CSV/XLSX,
 * and import residents or parking config from uploaded files.
 *
 * Imported residents get a default password ('changeme123') and ACTIVE status.
 * Duplicate emails are silently skipped during import.
 *
 * @todo (scalability): File storage, upload files to AWS S3 or another cloud storage instead of returning in-memory buffers.
 */
export class ImportExportService {
  async exportResidents(format: 'xlsx' | 'csv') {
    const currentCycle = await prisma.raffleCycle.findFirst({
      where: { status: 'COMPLETED' },
      orderBy: { executedAt: 'desc' },
      select: { id: true }
    })

    const users = await prisma.user.findMany({
      where: { role: 'RESIDENT' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        apartment: true,
        status: true,
        createdAt: true,
        vehicles: {
          select: { licensePlate: true, type: true, make: true, model: true, color: true }
        },
        parkingAssignments: {
          select: {
            spotNumber: true,
            raffleCycleId: true,
            raffleCycle: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { lastName: 'asc' }
    })

    const rows = users.map(user => {
      const currentAssignment = currentCycle
        ? user.parkingAssignments.find(assignment => assignment.raffleCycleId === currentCycle.id)
        : undefined

      const history = user.parkingAssignments
        .map(assignment => `Spot ${assignment.spotNumber} (${assignment.raffleCycle.name})`)
        .join('; ')

      return {
        Email: user.email,
        'First Name': user.firstName,
        'Last Name': user.lastName,
        Apartment: user.apartment,
        Status: user.status,
        'Registered At': user.createdAt.toISOString(),
        Vehicles: user.vehicles
          .map(vehicle => `${vehicle.licensePlate} (${vehicle.type})`)
          .join('; '),
        'Has Current Spot?': currentAssignment ? 'Yes' : 'No',
        'Current Spot': currentAssignment ? `Spot ${currentAssignment.spotNumber}` : '',
        'Spot History': history || 'None'
      }
    })

    if (format === 'xlsx') {
      return this.toXlsx(rows, 'Residents')
    }
    return this.toCsv(rows)
  }

  async exportRaffleResults(cycleId: string, format: 'xlsx' | 'csv') {
    const assignments = await prisma.parkingAssignment.findMany({
      where: { raffleCycleId: cycleId },
      include: {
        user: { select: { firstName: true, lastName: true, apartment: true, email: true } },
        vehicle: { select: { licensePlate: true, type: true, make: true, model: true } },
        raffleCycle: { select: { name: true } }
      },
      orderBy: [{ vehicleType: 'asc' }, { spotNumber: 'asc' }]
    })

    const rows = assignments.map(assignment => ({
      'Cycle Name': assignment.raffleCycle.name,
      'Spot Number': assignment.spotNumber,
      'Vehicle Type': assignment.vehicleType,
      Tier: assignment.tier,
      Resident: `${assignment.user.firstName} ${assignment.user.lastName}`,
      Apartment: assignment.user.apartment,
      Email: assignment.user.email,
      'License Plate': assignment.vehicle.licensePlate,
      'Vehicle Make': assignment.vehicle.make,
      'Vehicle Model': assignment.vehicle.model
    }))

    if (format === 'xlsx') {
      return this.toXlsx(rows, 'Raffle Results')
    }
    return this.toCsv(rows)
  }

  async exportParkingConfig(format: 'xlsx' | 'csv') {
    const configs = await prisma.parkingSpotConfig.findMany({
      orderBy: [{ vehicleType: 'asc' }, { effectiveFrom: 'desc' }]
    })

    const rows = configs.map(config => ({
      'Vehicle Type': config.vehicleType,
      'Total Spots': config.totalSpots,
      'Effective From': config.effectiveFrom.toISOString()
    }))

    if (format === 'xlsx') {
      return this.toXlsx(rows, 'Parking Config')
    }
    return this.toCsv(rows)
  }

  async importResidents(buffer: Buffer, mimetype: string) {
    const rows = await this.parseFile(buffer, mimetype)
    const results = { imported: 0, skipped: 0, errors: [] as string[] }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2
      try {
        const email = (row['Email'] || row['email'] || '').toLowerCase().trim()
        const firstName = row['First Name'] || row['firstName'] || row['first_name']
        const lastName = row['Last Name'] || row['lastName'] || row['last_name']
        const apartment = String(row['Apartment'] || row['apartment'] || '')

        if (!email || !firstName || !lastName || !apartment) {
          results.errors.push(`Row ${rowNum}: missing required fields`)
          results.skipped++
          continue
        }

        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
          results.errors.push(`Row ${rowNum}: email '${email}' already exists`)
          results.skipped++
          continue
        }
        const hashedPw = await hashPassword('changeme123')
        await prisma.user.create({
          data: {
            email,
            password: hashedPw,
            firstName,
            lastName,
            apartment,
            status: 'ACTIVE'
          }
        })
        results.imported++
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        results.errors.push(`Row ${rowNum}: ${msg}`)
        results.skipped++
      }
    }

    return results
  }

  async importParkingConfig(buffer: Buffer, mimetype: string) {
    const rows = await this.parseFile(buffer, mimetype)
    const results = { imported: 0, skipped: 0, errors: [] as string[] }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2
      try {
        const vehicleType = row['Vehicle Type'] || row['vehicleType']
        const totalSpots = parseInt(row['Total Spots'] || row['totalSpots'], 10)

        if (!vehicleType || isNaN(totalSpots) || totalSpots < 0) {
          results.errors.push(`Row ${rowNum}: missing or invalid vehicleType/totalSpots`)
          results.skipped++
          continue
        }

        if (!(VEHICLE_TYPES as string[]).includes(vehicleType)) {
          results.errors.push(`Row ${rowNum}: invalid vehicle type '${vehicleType}'`)
          results.skipped++
          continue
        }

        await prisma.parkingSpotConfig.create({
          data: { vehicleType, totalSpots }
        })
        results.imported++
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        results.errors.push(`Row ${rowNum}: ${msg}`)
        results.skipped++
      }
    }

    invalidateCache(CACHE_KEYS.PARKING_CONFIG)
    return results
  }

  private toXlsx(data: Record<string, string | number>[], sheetName: string): Buffer {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
  }

  private toCsv(data: Record<string, string | number>[]): string {
    if (data.length === 0) return ''
    const parser = new Parser({ fields: Object.keys(data[0]) })
    return parser.parse(data)
  }

  private async parseFile(buffer: Buffer, mimetype: string): Promise<Record<string, string>[]> {
    if (
      mimetype.includes('spreadsheet') ||
      mimetype.includes('xlsx') ||
      mimetype.includes('excel')
    ) {
      const wb = XLSX.read(buffer, { type: 'buffer' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      return XLSX.utils.sheet_to_json(ws) as Record<string, string>[]
    }

    if (mimetype.includes('csv') || mimetype.includes('text')) {
      return new Promise((resolve, reject) => {
        const results: Record<string, string>[] = []
        const stream = Readable.from(buffer.toString())
        stream
          .pipe(csvParser())
          .on('data', (data: Record<string, string>) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', reject)
      })
    }

    throw new AppError('Unsupported file format. Please use CSV or XLSX.', 400)
  }
}

export const importExportService = new ImportExportService()
