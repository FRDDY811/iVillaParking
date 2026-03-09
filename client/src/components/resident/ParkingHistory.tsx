import React from 'react'
import { Card, Table, Alert } from 'antd'
import { useGetAssignmentHistoryQuery } from '../../store/api/parkingSpotsApi'
import { extractErrorMessage } from '../../utils/errorMessage'
import { vehicleTypeColumn, tierColumn, plateColumn } from '../../utils/columns'
import { formatDate } from '../../utils/formatters'
import { ParkingAssignmentWithCycle } from '../../types'

const columns = [
  {
    title: 'Cycle',
    render: (_: unknown, record: ParkingAssignmentWithCycle) => record.raffleCycle?.name || '-'
  },
  {
    title: 'Period',
    render: (_: unknown, record: ParkingAssignmentWithCycle) =>
      record.raffleCycle
        ? `${formatDate(record.raffleCycle.startDate)} - ${formatDate(record.raffleCycle.endDate)}`
        : '-'
  },
  { title: 'Spot #', dataIndex: 'spotNumber' },
  vehicleTypeColumn(),
  tierColumn,
  plateColumn
]

/** Displays the resident's parking assignment history across all the raffle cycles, ordered by the most recent.
 * @todo (scalability): Pagination — paginate history for residents with many past cycles.
 **/
const ParkingHistory: React.FC = () => {
  const { data: assignmentHistory = [], isLoading, isError, error } = useGetAssignmentHistoryQuery()

  if (isError) {
    return (
      <Alert
        type="error"
        message="Failed to load assignment history"
        description={extractErrorMessage(error, 'An unexpected error occurred')}
        showIcon
      />
    )
  }

  return (
    <Card title="My Parking Assignment History">
      <Table dataSource={assignmentHistory} rowKey="id" loading={isLoading} columns={columns} />
    </Card>
  )
}

export default ParkingHistory
