import prisma from '../config/database'
import { Prisma } from '@prisma/client'
import { AppError } from '../middleware/errorHandler'
import { PAGINATION } from '@ivillaparking/shared'

interface UpdateUserData {
  firstName?: string
  lastName?: string
  apartment?: string
  status?: string
  role?: string
}

/**
 * CRUD operations for user management (admin-facing).
 * Supports paginated listing with filters (status, role, search).
 * Password and refresh token fields are always excluded from responses.
 *
 * @todo (scalability): RBAC — replace simple role enum with fine-grained permissions (e.g., 'user:approve', 'raffle:execute').
 * @todo (scalability): Audit logging — record approval/rejection decisions with admin ID and timestamp.
 */
export class UserService {
  async getAll(params: {
    page?: number
    limit?: number
    status?: string
    role?: string
    search?: string
  }) {
    const { page = 1, limit = PAGINATION.DEFAULT_PAGE_SIZE, status, role, search } = params
    const skip = (page - 1) * limit

    const where: Prisma.UserWhereInput = {}
    if (status) where.status = status
    if (role) where.role = role
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { apartment: { contains: search } }
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          apartment: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { vehicles: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ])

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        apartment: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        vehicles: true
      }
    })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    return user
  }

  async update(id: string, data: UpdateUserData) {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      throw new AppError('User not found', 404)
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        apartment: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return updated
  }

  async delete(id: string) {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      throw new AppError('User not found', 404)
    }

    await prisma.user.delete({ where: { id } })
  }

  async getPending() {
    return prisma.user.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        apartment: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'asc' }
    })
  }
}

export const userService = new UserService()
