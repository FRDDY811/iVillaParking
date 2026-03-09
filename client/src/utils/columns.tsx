import React from 'react'
import { Tag } from 'antd'
import { VEHICLE_TYPE_LABELS, RAFFLE_STATUS_COLORS, getTierColor } from './constants'
import { formatUserName, formatDate } from './formatters'

export const licensePlateColumn = {
  title: 'License Plate',
  dataIndex: 'licensePlate',
  render: (plate: string) => <Tag>{plate}</Tag>
}

export const vehicleTypeColumn = (dataIndex = 'vehicleType') => ({
  title: 'Type',
  dataIndex,
  render: (type: string) => VEHICLE_TYPE_LABELS[type]
})

interface RecordWithUser {
  user?: { firstName: string; lastName: string; apartment?: string } | null
}

interface RecordWithVehicle {
  vehicle?: { licensePlate?: string } | null
}

export const residentColumn = {
  title: 'Resident',
  render: (_: unknown, record: RecordWithUser) => formatUserName(record.user)
}

export const apartmentColumn = {
  title: 'Apartment',
  render: (_: unknown, record: RecordWithUser) => record.user?.apartment || '-'
}

export const plateColumn = {
  title: 'Plate',
  render: (_: unknown, record: RecordWithVehicle) => record.vehicle?.licensePlate || '-'
}

export const tierColumn = {
  title: 'Tier',
  dataIndex: 'tier',
  render: (tier: number) => <Tag color={getTierColor(tier)}>{`Tier ${tier}`}</Tag>
}

export const raffleStatusColumn = (dataIndex = 'status') => ({
  title: 'Status',
  dataIndex,
  render: (status: string) => <Tag color={RAFFLE_STATUS_COLORS[status]}>{status}</Tag>
})

export const dateColumn = (title: string, dataIndex: string) => ({
  title,
  dataIndex,
  render: (date: string) => formatDate(date)
})
