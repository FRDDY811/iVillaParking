import { Request, Response } from 'express'
import { authService } from '../services/authService'
import { asyncHandler, AppError, requireUser } from '../middleware/errorHandler'

const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_COOKIE_MAX_AGE
  })
}

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.register(req.body)
    res.status(201).json({
      success: true,
      data: user,
      message: 'Registration successful. Please wait for admin approval.'
    })
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { accessToken, refreshToken, user } = await authService.login(
      req.body.email,
      req.body.password
    )
    setRefreshCookie(res, refreshToken)
    res.json({ success: true, data: { accessToken, user } })
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken
    if (!refreshToken) {
      throw new AppError('No refresh token provided', 401)
    }
    const result = await authService.refresh(refreshToken)
    setRefreshCookie(res, result.refreshToken)
    res.json({ success: true, data: { accessToken: result.accessToken, user: result.user } })
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    if (req.user) {
      await authService.logout(req.user.userId)
    }
    res.clearCookie('refreshToken')
    res.json({ success: true, message: 'Logged out successfully' })
  }),

  getMe: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getMe(requireUser(req).userId)
    res.json({ success: true, data: user })
  })
}
