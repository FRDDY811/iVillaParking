import React, { useState, useCallback } from 'react'
import { Card, Input, Button, Table, Tag, Space, Alert } from 'antd'
import { licensePlateColumn } from '../../utils/columns'
import { CameraOutlined } from '@ant-design/icons'
import { useDetectMutation, useGetDetectionsQuery } from '../../store/api/cameraApi'
import { useMutationHandler } from '../../hooks/useMutationHandler'
import {
  POLLING_INTERVAL_FAST,
  DETECTION_STATUS_COLORS,
  DETECTIONS_LIMIT,
  MAX_LICENSE_PLATE_LENGTH
} from '../../utils/constants'
import { extractErrorMessage } from '../../utils/errorMessage'
import { formatDateTime, formatUserName } from '../../utils/formatters'
import { ICameraDetection } from '../../types'

const plateInputStyle = { width: 300 }

const columns = [
  licensePlateColumn,
  {
    title: 'Status',
    dataIndex: 'status',
    render: (status: string) => (
      <Tag color={DETECTION_STATUS_COLORS[status] ?? 'default'}>{status}</Tag>
    )
  },
  {
    title: 'Owner',
    render: (_: unknown, record: ICameraDetection) =>
      formatUserName(record.vehicle?.user, 'Unknown')
  },
  {
    title: 'Apartment',
    render: (_: unknown, record: ICameraDetection) => record.vehicle?.user?.apartment || '-'
  },
  { title: 'Detected At', dataIndex: 'detectedAt', render: (date: string) => formatDateTime(date) }
]

/** Simulated camera detection panel.
 * Admin enters the license plates and views detection history with AUTHORIZED/DETECTED/UNKNOWN status.
 **/
const CameraPanel: React.FC = () => {
  const [plate, setPlate] = useState('')
  const {
    data: detections = [],
    isError,
    error
  } = useGetDetectionsQuery(
    { limit: DETECTIONS_LIMIT },
    { pollingInterval: POLLING_INTERVAL_FAST, skipPollingIfUnfocused: true }
  )
  const [detect, { isLoading }] = useDetectMutation()
  const handle = useMutationHandler()

  const handleDetect = useCallback(async () => {
    if (plate.trim().length < 2) return
    const result = await handle(
      detect(plate.trim().toUpperCase()).unwrap(),
      'Detection recorded',
      'Detection failed'
    )
    if (result) setPlate('')
  }, [plate, detect, handle])

  return (
    <div>
      <Card title="Mock Camera Detection" className="mb-16">
        <Space role="search" aria-label="License plate detection">
          <Input
            placeholder="Enter license plate"
            value={plate}
            onChange={e => setPlate(e.target.value)}
            onPressEnter={handleDetect}
            aria-label="License plate for detection"
            maxLength={MAX_LICENSE_PLATE_LENGTH}
            style={plateInputStyle}
          />
          <Button
            type="primary"
            icon={<CameraOutlined />}
            onClick={handleDetect}
            loading={isLoading}
          >
            Detect
          </Button>
        </Space>
      </Card>

      <Card title="Recent Detections">
        {isError && (
          <Alert
            type="error"
            message={extractErrorMessage(error, 'Failed to load detections')}
            showIcon
            className="mb-16"
          />
        )}
        <Table
          dataSource={detections}
          rowKey="id"
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}

export default CameraPanel
