import prisma from '../config/database'
import { hashPassword, comparePassword } from '../utils/password'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt'
import { AppError } from '../middleware/errorHandler'

/**
 * Handles the full authentication lifecycle:
 * register (PENDING) -> admin approval -> login (JWT pair) -> refresh -> logout.
 *
 * Tokens: short-lived access token (in-memory on client) + long-lived refresh token
 * (httpOnly cookie). Refresh tokens are stored in DB for revocation on logout.
 *
 * Registration enforces one account per email and one per apartment.
 * Previously rejected accounts are auto-cleaned on re-registration.
 *
 *  @todo (scalability): Send push notifications, send welcome email to notify when the user is registered and notify the tier results.
 *  @todo (scalability): Send email notifications, send welcome email to notify when the user is registered and notify the tier results.
 *  @todo (scalability): Audit logging — record login attempts, failed auth, and role changes.
 */
export class AuthService {
  async register(data: {
    email: string
    password: string
    firstName: string
    lastName: string
    apartment: string
  }) {
    data.email = data.email.toLowerCase().trim()
    const existing = await prisma.user.findUnique({ where: { email: data.email } })

    if (existing) {
      if (existing.status === 'REJECTED') {
        await prisma.user.delete({ where: { id: existing.id } })
      } else {
        throw new AppError('Registration failed. Please check your details or contact admin.', 409)
      }
    }

    const existingApartment = await prisma.user.findFirst({ where: { apartment: data.apartment } })

    if (existingApartment) {
      if (existingApartment.status === 'REJECTED') {
        if (!existing || existing.id !== existingApartment.id) {
          await prisma.user.delete({ where: { id: existingApartment.id } })
        }
      } else {
        throw new AppError('Registration failed. Please check your details or contact admin.', 409)
      }
    }

    const hashedPassword = await hashPassword(data.password)

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword
      },
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

    return user
  }

  async login(email: string, password: string) {
    email = email.toLowerCase().trim()
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      throw new AppError('Invalid credentials', 401)
    }

    const isMatch = await comparePassword(password, user.password)

    if (!isMatch) {
      throw new AppError('Invalid credentials', 401)
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError(`Account is ${user.status.toLowerCase()}. Please contact admin.`, 403)
    }

    const tokenPayload = { userId: user.id, role: user.role }
    const accessToken = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    })

    const { password: _password, refreshToken: _refreshToken, ...userWithoutSensitive } = user

    return { accessToken, refreshToken, user: userWithoutSensitive }
  }

  async refresh(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken)

      const user = await prisma.user.findUnique({
        where: { id: payload.userId }
      })

      if (!user || user.refreshToken !== refreshToken) {
        throw new AppError('Invalid refresh token', 401)
      }

      const tokenPayload = { userId: user.id, role: user.role }
      const newAccessToken = generateAccessToken(tokenPayload)
      const newRefreshToken = generateRefreshToken(tokenPayload)

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken }
      })

      const { password: _password, refreshToken: _refreshToken, ...userWithoutSensitive } = user

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: userWithoutSensitive
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('Invalid refresh token', 401)
    }
  }

  async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null }
    })
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      throw new AppError('User not found', 404)
    }

    return user
  }
}

export const authService = new AuthService()
