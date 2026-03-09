import React, { useMemo } from 'react'
import { Card, Table, Button, Tag, Space, Empty, Select, Alert } from 'antd'
import { useRaffleRegistration } from '../../hooks/useRaffleRegistration'
import { extractErrorMessage } from '../../utils/errorMessage'
import { RAFFLE_STATUS_COLORS, VEHICLE_TYPE_LABELS } from '../../utils/constants'
import { formatDate } from '../../utils/formatters'
import {
  IRaffleCycle,
  IVehicle,
  RaffleCycleStatus,
  RaffleRegistrationWithCycle,
  RaffleRegistrationWithVehicle
} from '../../types'

const vehicleSelectStyle = { width: 250 }

const buildVehicleOptions = (vehicles: IVehicle[]) =>
  vehicles.map(vehicle => ({
    value: vehicle.id,
    label: `${vehicle.licensePlate} (${VEHICLE_TYPE_LABELS[vehicle.type]})`
  }))

/** Allows residents to register/unregister their vehicles for open raffle cycles.
 * Shows registration status per vehicle per cycle.
 **/
const RaffleRegistration: React.FC = () => {
  const {
    vehicles,
    userRegistrations,
    isLoading,
    isError,
    error,
    isRegistering,
    isUnregistering,
    openCycles,
    selectedVehicles,
    selectVehicle,
    handleRegister,
    handleUnregister
  } = useRaffleRegistration()

  const vehicleOptions = useMemo(() => buildVehicleOptions(vehicles), [vehicles])

  const registrationColumns = [
    {
      title: 'Cycle',
      render: (_: unknown, record: RaffleRegistrationWithCycle) => record.raffleCycle?.name || '-'
    },
    {
      title: 'Vehicle',
      render: (_: unknown, record: RaffleRegistrationWithVehicle) =>
        record.vehicle
          ? `${record.vehicle.licensePlate} (${VEHICLE_TYPE_LABELS[record.vehicle.type]})`
          : '-'
    },
    {
      title: 'Status',
      render: (_: unknown, record: RaffleRegistrationWithCycle) => (
        <Tag color={RAFFLE_STATUS_COLORS[record.raffleCycle?.status ?? '']}>
          {record.raffleCycle?.status}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: RaffleRegistrationWithCycle) =>
        record.raffleCycle?.status === RaffleCycleStatus.OPEN ? (
          <Button
            size="small"
            danger
            loading={isUnregistering}
            onClick={() => handleUnregister(record.raffleCycleId, record.vehicleId)}
          >
            Unregister
          </Button>
        ) : null
    }
  ]

  if (isError) {
    return (
      <Alert
        type="error"
        message="Failed to load raffle data"
        description={extractErrorMessage(error, 'An unexpected error occurred')}
        showIcon
      />
    )
  }

  return (
    <div>
      <Card title="Open Raffle Cycles" className="mb-16">
        {openCycles.length === 0 ? (
          <Empty description="No raffle cycles are currently open for registration" />
        ) : (
          openCycles.map((cycle: IRaffleCycle) => (
            <Card
              key={cycle.id}
              type="inner"
              title={cycle.name}
              className="mb-8"
              extra={<Tag color={RAFFLE_STATUS_COLORS[cycle.status]}>{cycle.status}</Tag>}
            >
              <p>
                Period: {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
              </p>
              <Space>
                <Select
                  placeholder="Select vehicle"
                  value={selectedVehicles[cycle.id]}
                  onChange={value => selectVehicle(cycle.id, value)}
                  style={vehicleSelectStyle}
                  aria-label="Select vehicle for raffle registration"
                  options={vehicleOptions}
                />
                <Button
                  type="primary"
                  loading={isRegistering}
                  disabled={!selectedVehicles[cycle.id] || isRegistering}
                  onClick={() => handleRegister(cycle.id)}
                >
                  Register
                </Button>
              </Space>
            </Card>
          ))
        )}
      </Card>

      <Card title="My Registrations">
        <Table
          dataSource={userRegistrations}
          rowKey="id"
          loading={isLoading}
          columns={registrationColumns}
        />
      </Card>
    </div>
  )
}

export default RaffleRegistration
