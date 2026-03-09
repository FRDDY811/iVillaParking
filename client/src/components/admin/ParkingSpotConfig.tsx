import React, { useCallback } from 'react'
import { Card, Table, Form, InputNumber, Select, Button, Statistic, Row, Col, Alert } from 'antd'
import {
  useGetParkingConfigQuery,
  useCreateParkingConfigMutation,
  useGetCurrentAssignmentsQuery
} from '../../store/api/parkingSpotsApi'
import { useMutationHandler } from '../../hooks/useMutationHandler'
import { extractErrorMessage } from '../../utils/errorMessage'
import { VEHICLE_TYPE_LABELS, VEHICLE_TYPE_OPTIONS } from '../../utils/constants'
import {
  vehicleTypeColumn,
  residentColumn,
  apartmentColumn,
  plateColumn
} from '../../utils/columns'
import { IParkingSpotConfig } from '../../types'
import { ParkingConfigFormValues } from '../../types/forms'

const vehicleTypeSelectStyle = { width: 150 }

const assignmentColumns = [
  { title: 'Spot #', dataIndex: 'spotNumber' },
  vehicleTypeColumn(),
  residentColumn,
  apartmentColumn,
  plateColumn,
  { title: 'Tier', dataIndex: 'tier' }
]

/** Manages parking spot capacity by vehicle type (CAR, MOTORCYCLE, BICYCLE).
 * Each configuration entry is versioned by effectiveFrom date.
 **/
const ParkingSpotConfig: React.FC = () => {
  const {
    data: config = [],
    isLoading: isConfigLoading,
    isError: isConfigError,
    error: configError
  } = useGetParkingConfigQuery()
  const { data: currentAssignments = [], isLoading: isAssignmentsLoading } =
    useGetCurrentAssignmentsQuery()
  const [createParkingConfig, { isLoading: isCreating }] = useCreateParkingConfigMutation()
  const handle = useMutationHandler()
  const [form] = Form.useForm()

  const handleCreate = useCallback(
    async (values: ParkingConfigFormValues) => {
      const result = await handle(
        createParkingConfig(values).unwrap(),
        'Parking configuration updated',
        'Failed to update parking configuration'
      )
      if (result) form.resetFields()
    },
    [createParkingConfig, handle, form]
  )

  if (isConfigError) {
    return (
      <Alert
        type="error"
        message="Failed to load parking configuration"
        description={extractErrorMessage(configError, 'An unexpected error occurred')}
        showIcon
      />
    )
  }

  return (
    <div>
      <Row gutter={16} className="mb-16">
        {config.map((spotConfig: IParkingSpotConfig) => (
          <Col xs={24} sm={12} lg={8} key={spotConfig.vehicleType}>
            <Card>
              <Statistic
                title={`${VEHICLE_TYPE_LABELS[spotConfig.vehicleType]} Spots`}
                value={spotConfig.totalSpots}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="Update Parking Configuration" className="mb-16">
        <Form form={form} layout="inline" onFinish={handleCreate}>
          <Form.Item name="vehicleType" label="Vehicle Type" rules={[{ required: true }]}>
            <Select
              placeholder="Vehicle Type"
              style={vehicleTypeSelectStyle}
              options={VEHICLE_TYPE_OPTIONS}
            />
          </Form.Item>
          <Form.Item name="totalSpots" label="Total Spots" rules={[{ required: true }]}>
            <InputNumber min={0} placeholder="Total Spots" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isCreating}>
              Update
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Current Assignments">
        <Table
          dataSource={currentAssignments}
          rowKey="id"
          loading={isConfigLoading || isAssignmentsLoading}
          columns={assignmentColumns}
          pagination={false}
        />
      </Card>
    </div>
  )
}

export default ParkingSpotConfig
