import React from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, Popconfirm, Space, Alert } from 'antd'
import { licensePlateColumn, vehicleTypeColumn } from '../../utils/columns'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useVehicleForm } from '../../hooks/useVehicleForm'
import { extractErrorMessage } from '../../utils/errorMessage'
import {
  VEHICLE_TYPE_OPTIONS,
  MAX_LICENSE_PLATE_LENGTH,
  MAX_VEHICLE_MAKE_LENGTH,
  MAX_VEHICLE_MODEL_LENGTH,
  MAX_VEHICLE_COLOR_LENGTH
} from '../../utils/constants'
import { IVehicle } from '../../types'

/** Vehicle CRUD interface for residents. Supports adding, editing, and deleting vehicles with license plate uniqueness validation. */
const VehicleList: React.FC = () => {
  const [form] = Form.useForm()
  const {
    vehicles,
    isLoading,
    isError,
    error,
    isCreating,
    isUpdating,
    isDeleting,
    modalOpen,
    editing,
    openModal,
    closeModal,
    handleSubmit,
    handleEdit,
    handleDelete
  } = useVehicleForm(form)

  const columns = [
    licensePlateColumn,
    vehicleTypeColumn('type'),
    { title: 'Make', dataIndex: 'make' },
    { title: 'Model', dataIndex: 'model' },
    { title: 'Color', dataIndex: 'color' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: IVehicle) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            aria-label="Edit vehicle"
          />
          <Popconfirm title="Delete this vehicle?" onConfirm={() => handleDelete(record.id)}>
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={isDeleting}
              aria-label="Delete vehicle"
            />
          </Popconfirm>
        </Space>
      )
    }
  ]

  if (isError) {
    return (
      <Alert
        type="error"
        message="Failed to load vehicles"
        description={extractErrorMessage(error, 'An unexpected error occurred')}
        showIcon
      />
    )
  }

  return (
    <Card
      title="My Vehicles"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openModal}>
          Add Vehicle
        </Button>
      }
    >
      <Table dataSource={vehicles} rowKey="id" loading={isLoading} columns={columns} />

      <Modal
        title={editing ? 'Edit Vehicle' : 'Add Vehicle'}
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="licensePlate"
            label="License Plate"
            rules={[
              { required: true },
              {
                pattern: /^[A-Za-z0-9]{2,10}(-[A-Za-z0-9]{1,6})?$/,
                message: 'Invalid plate format (e.g., ABC-1234)'
              }
            ]}
          >
            <Input placeholder="e.g., ABC-1234" maxLength={MAX_LICENSE_PLATE_LENGTH} />
          </Form.Item>
          <Form.Item name="type" label="Vehicle Type" rules={[{ required: true }]}>
            <Select options={VEHICLE_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="make"
            label="Make"
            rules={[
              { required: true },
              {
                max: MAX_VEHICLE_MAKE_LENGTH,
                message: `Make must be ${MAX_VEHICLE_MAKE_LENGTH} characters or less`
              }
            ]}
          >
            <Input placeholder="e.g., Toyota" maxLength={MAX_VEHICLE_MAKE_LENGTH} />
          </Form.Item>
          <Form.Item
            name="model"
            label="Model"
            rules={[
              { required: true },
              {
                max: MAX_VEHICLE_MODEL_LENGTH,
                message: `Model must be ${MAX_VEHICLE_MODEL_LENGTH} characters or less`
              }
            ]}
          >
            <Input placeholder="e.g., Corolla" maxLength={MAX_VEHICLE_MODEL_LENGTH} />
          </Form.Item>
          <Form.Item
            name="color"
            label="Color"
            rules={[
              { required: true },
              {
                max: MAX_VEHICLE_COLOR_LENGTH,
                message: `Color must be ${MAX_VEHICLE_COLOR_LENGTH} characters or less`
              }
            ]}
          >
            <Input placeholder="e.g., Silver" maxLength={MAX_VEHICLE_COLOR_LENGTH} />
          </Form.Item>
          <Form.Item>
            <Space className="flex-end">
              <Button onClick={closeModal}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={isCreating || isUpdating}>
                {editing ? 'Update' : 'Add'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default VehicleList
