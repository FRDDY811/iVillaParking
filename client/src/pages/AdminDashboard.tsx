import React, { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Statistic, Typography, Alert } from 'antd'
import { TeamOutlined, CarOutlined, TrophyOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useGetUsersQuery, useGetPendingUsersQuery } from '../store/api/usersApi'
import {
  useGetParkingConfigQuery,
  useGetCurrentAssignmentsQuery
} from '../store/api/parkingSpotsApi'
import { useGetCyclesQuery } from '../store/api/raffleApi'
import { useDashboardError } from '../hooks/useDashboardError'
import { POLLING_INTERVAL_NORMAL } from '../utils/constants'
import { ROUTES } from '../utils/routes'
import { IParkingSpotConfig, IRaffleCycle, RaffleCycleStatus } from '../types'

const { Title } = Typography

const pendingValueStyle = { color: '#faad14' }

/** Admin dashboard page. Composes admin panels: ResidentManagement, RaffleControl, ParkingSpotConfig, CameraPanel, ImportExportPanel, LicensePlateSearch. */
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
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
    data: usersData,
    isError: isUsersError,
    error: usersError
  } = useGetUsersQuery({ limit: 1 })
  const { data: pendingUsers = [] } = useGetPendingUsersQuery(undefined, {
    pollingInterval: POLLING_INTERVAL_NORMAL,
    skipPollingIfUnfocused: true
  })
  const {
    data: config = [],
    isError: isConfigError,
    error: configError
  } = useGetParkingConfigQuery()
  const { data: currentAssignments = [] } = useGetCurrentAssignmentsQuery()
  const { data: cycles = [] } = useGetCyclesQuery()

  const totalSpots = useMemo(
    () => config.reduce((sum: number, spotConfig: IParkingSpotConfig) => sum + spotConfig.totalSpots, 0),
    [config]
  )
  const activeCycles = useMemo(
    () =>
      cycles.filter(
        (cycle: IRaffleCycle) =>
          cycle.status === RaffleCycleStatus.OPEN || cycle.status === RaffleCycleStatus.CLOSED
      ).length,
    [cycles]
  )

  const { anyError, errorMsg } = useDashboardError(
    { isError: isUsersError, error: usersError },
    { isError: isConfigError, error: configError }
  )

  return (
    <div>
      <Title level={3}>Admin Dashboard</Title>
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
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            onClick={() => navigate(ROUTES.ADMIN_RESIDENTS)}
            onKeyDown={cardKeyDown(ROUTES.ADMIN_RESIDENTS)}
            tabIndex={0}
            role="link"
            className="clickable-card"
          >
            <Statistic
              title="Total Residents"
              value={usersData?.total ?? 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            onClick={() => navigate(ROUTES.ADMIN_RESIDENTS)}
            onKeyDown={cardKeyDown(ROUTES.ADMIN_RESIDENTS)}
            tabIndex={0}
            role="link"
            className="clickable-card"
          >
            <Statistic
              title="Pending Approvals"
              value={pendingUsers.length}
              prefix={<CheckCircleOutlined />}
              valueStyle={pendingUsers.length > 0 ? pendingValueStyle : undefined}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            onClick={() => navigate(ROUTES.ADMIN_PARKING)}
            onKeyDown={cardKeyDown(ROUTES.ADMIN_PARKING)}
            tabIndex={0}
            role="link"
            className="clickable-card"
          >
            <Statistic title="Total Parking Spots" value={totalSpots} prefix={<CarOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            onClick={() => navigate(ROUTES.ADMIN_RAFFLE)}
            onKeyDown={cardKeyDown(ROUTES.ADMIN_RAFFLE)}
            tabIndex={0}
            role="link"
            className="clickable-card"
          >
            <Statistic
              title="Active Raffle Cycles"
              value={activeCycles}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} className="mt-16">
        <Col span={12}>
          <Card title="Current Assignments">
            <Statistic
              title="Assigned Spots"
              value={currentAssignments.length}
              suffix={`/ ${totalSpots}`}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Parking Configuration">
            {config.map((spotConfig: IParkingSpotConfig) => (
              <div key={spotConfig.vehicleType} className="flex-between mb-8">
                <span>{spotConfig.vehicleType}</span>
                <strong>{spotConfig.totalSpots} spots</strong>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AdminDashboard
