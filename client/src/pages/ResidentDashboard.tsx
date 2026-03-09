import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Statistic, Tag, Empty, Typography, Alert } from 'antd'
import { CarOutlined, TrophyOutlined } from '@ant-design/icons'
import { useGetVehiclesQuery } from '../store/api/vehiclesApi'
import { useGetAssignmentHistoryQuery } from '../store/api/parkingSpotsApi'
import { useGetUserRegistrationsQuery } from '../store/api/raffleApi'
import { useAuth } from '../hooks/useAuth'
import { useDashboardError } from '../hooks/useDashboardError'
import { VEHICLE_TYPE_LABELS, getTierColor } from '../utils/constants'
import { formatDate } from '../utils/formatters'
import { ROUTES } from '../utils/routes'
import { IParkingAssignment, IRaffleCycle } from '../types'

const { Title } = Typography

/** Resident dashboard page. Composes resident panels: VehicleList, RaffleRegistration, ParkingHistory. */
const ResidentDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const cardKeyDown = useCallback(
    (path: string) => (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        navigate(path)
      }
    },
    [navigate]
  )
  const {
    data: vehicles = [],
    isError: isVehiclesError,
    error: vehiclesError
  } = useGetVehiclesQuery()
  const {
    data: assignmentHistory = [],
    isError: isHistoryError,
    error: historyError
  } = useGetAssignmentHistoryQuery()
  const {
    data: userRegistrations = [],
    isError: isRegistrationsError,
    error: registrationsError
  } = useGetUserRegistrationsQuery()

  const currentAssignment: (IParkingAssignment & { raffleCycle?: IRaffleCycle }) | undefined =
    assignmentHistory[0]

  const { anyError, errorMsg } = useDashboardError(
    { isError: isVehiclesError, error: vehiclesError },
    { isError: isHistoryError, error: historyError },
    { isError: isRegistrationsError, error: registrationsError }
  )

  return (
    <div>
      <Title level={3}>Welcome, {user?.firstName}!</Title>
      {anyError && (
        <Alert
          type="warning"
          message="Some data failed to load"
          description={errorMsg}
          showIcon
          closable
          className="mb-16"
        />
      )}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card
            hoverable
            onClick={() => navigate(ROUTES.RESIDENT_VEHICLES)}
            onKeyDown={cardKeyDown(ROUTES.RESIDENT_VEHICLES)}
            tabIndex={0}
            role="link"
            className="clickable-card"
          >
            <Statistic title="My Vehicles" value={vehicles.length} prefix={<CarOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card
            hoverable
            onClick={() => navigate(ROUTES.RESIDENT_RAFFLE)}
            onKeyDown={cardKeyDown(ROUTES.RESIDENT_RAFFLE)}
            tabIndex={0}
            role="link"
            className="clickable-card"
          >
            <Statistic
              title="Active Registrations"
              value={userRegistrations.length}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card
            hoverable
            onClick={() => navigate(ROUTES.RESIDENT_HISTORY)}
            onKeyDown={cardKeyDown(ROUTES.RESIDENT_HISTORY)}
            tabIndex={0}
            role="link"
            className="clickable-card"
          >
            <Statistic title="Past Assignments" value={assignmentHistory.length} />
          </Card>
        </Col>
      </Row>

      <Card title="Current Parking Assignment" className="mt-16">
        {currentAssignment ? (
          <div>
            <p>
              <strong>Spot #{currentAssignment.spotNumber}</strong> -{' '}
              {VEHICLE_TYPE_LABELS[currentAssignment.vehicleType]}
            </p>
            <p>
              Tier:{' '}
              <Tag color={getTierColor(currentAssignment.tier)}>Tier {currentAssignment.tier}</Tag>
            </p>
            <p>Cycle: {currentAssignment.raffleCycle?.name}</p>
            {currentAssignment.raffleCycle && (
              <p>
                Period: {formatDate(currentAssignment.raffleCycle.startDate)} -{' '}
                {formatDate(currentAssignment.raffleCycle.endDate)}
              </p>
            )}
          </div>
        ) : (
          <Empty description="No current parking assignment" />
        )}
      </Card>
    </div>
  )
}

export default ResidentDashboard
