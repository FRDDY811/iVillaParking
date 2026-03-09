import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { App as AntApp, ConfigProvider, Spin, theme } from 'antd'
import { useAppDispatch } from './store'
import { refreshToken } from './store/authSlice'
import { useAuth } from './hooks/useAuth'
import { UserRole } from './types'
import ErrorBoundary from './components/ErrorBoundary'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PublicRoute from './components/auth/PublicRoute'
import { ROUTES } from './utils/routes'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const ResidentDashboard = lazy(() => import('./pages/ResidentDashboard'))
const ResidentManagement = lazy(() => import('./components/admin/ResidentManagement'))
const ParkingSpotConfig = lazy(() => import('./components/admin/ParkingSpotConfig'))
const RaffleControl = lazy(() => import('./components/admin/RaffleControl'))
const LicensePlateSearch = lazy(() => import('./components/admin/LicensePlateSearch'))
const ImportExportPanel = lazy(() => import('./components/admin/ImportExportPanel'))
const CameraPanel = lazy(() => import('./components/admin/CameraPanel'))
const VehicleList = lazy(() => import('./components/resident/VehicleList'))
const RaffleRegistration = lazy(() => import('./components/resident/RaffleRegistration'))
const ParkingHistory = lazy(() => import('./components/resident/ParkingHistory'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

const PageLoader: React.FC = () => (
  <div className="center-loader">
    <Spin size="large" />
  </div>
)

const AppRoutes: React.FC = () => {
  const dispatch = useAppDispatch()
  const { isAuthenticated, isAdmin, loading } = useAuth()

  useEffect(() => {
    dispatch(refreshToken())
  }, [dispatch])

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route
          path={ROUTES.LOGIN}
          element={
            <PublicRoute>
              <ErrorBoundary>
                <LoginPage />
              </ErrorBoundary>
            </PublicRoute>
          }
        />
        <Route
          path={ROUTES.REGISTER}
          element={
            <PublicRoute>
              <ErrorBoundary>
                <RegisterPage />
              </ErrorBoundary>
            </PublicRoute>
          }
        />

        <Route
          element={
            <ProtectedRoute requiredRole={UserRole.ADMIN}>
              <ErrorBoundary>
                <AppLayout />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        >
          <Route
            path={ROUTES.ADMIN}
            element={
              <ErrorBoundary>
                <AdminDashboard />
              </ErrorBoundary>
            }
          />
          <Route
            path={ROUTES.ADMIN_RESIDENTS}
            element={
              <ErrorBoundary>
                <ResidentManagement />
              </ErrorBoundary>
            }
          />
          <Route
            path={ROUTES.ADMIN_PARKING}
            element={
              <ErrorBoundary>
                <ParkingSpotConfig />
              </ErrorBoundary>
            }
          />
          <Route
            path={ROUTES.ADMIN_RAFFLE}
            element={
              <ErrorBoundary>
                <RaffleControl />
              </ErrorBoundary>
            }
          />
          <Route
            path={ROUTES.ADMIN_SEARCH}
            element={
              <ErrorBoundary>
                <LicensePlateSearch />
              </ErrorBoundary>
            }
          />
          <Route
            path={ROUTES.ADMIN_IMPORT_EXPORT}
            element={
              <ErrorBoundary>
                <ImportExportPanel />
              </ErrorBoundary>
            }
          />
          <Route
            path={ROUTES.ADMIN_CAMERA}
            element={
              <ErrorBoundary>
                <CameraPanel />
              </ErrorBoundary>
            }
          />
        </Route>

        <Route
          element={
            <ProtectedRoute requiredRole={UserRole.RESIDENT}>
              <ErrorBoundary>
                <AppLayout />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        >
          <Route
            path={ROUTES.RESIDENT}
            element={
              <ErrorBoundary>
                <ResidentDashboard />
              </ErrorBoundary>
            }
          />
          <Route
            path={ROUTES.RESIDENT_VEHICLES}
            element={
              <ErrorBoundary>
                <VehicleList />
              </ErrorBoundary>
            }
          />
          <Route
            path={ROUTES.RESIDENT_RAFFLE}
            element={
              <ErrorBoundary>
                <RaffleRegistration />
              </ErrorBoundary>
            }
          />
          <Route
            path={ROUTES.RESIDENT_HISTORY}
            element={
              <ErrorBoundary>
                <ParkingHistory />
              </ErrorBoundary>
            }
          />
        </Route>

        <Route
          path="/"
          element={
            loading ? (
              <PageLoader />
            ) : isAuthenticated ? (
              <Navigate to={isAdmin ? ROUTES.ADMIN : ROUTES.RESIDENT} replace />
            ) : (
              <Navigate to={ROUTES.LOGIN} replace />
            )
          }
        />

        <Route
          path="*"
          element={
            loading ? (
              <PageLoader />
            ) : isAuthenticated ? (
              <NotFoundPage />
            ) : (
              <Navigate to={ROUTES.LOGIN} replace />
            )
          }
        />
      </Routes>
    </Suspense>
  )
}

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: { colorPrimary: '#1677ff' }
      }}
    >
      <AntApp>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  )
}

export default App
