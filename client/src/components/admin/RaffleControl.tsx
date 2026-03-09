import React from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  DatePicker,
  Popconfirm,
  Descriptions,
  Alert
} from 'antd'
import {
  PlusOutlined,
  PlayCircleOutlined,
  StopOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import { useRaffleControl } from '../../hooks/useRaffleControl'
import { extractErrorMessage } from '../../utils/errorMessage'
import { RAFFLE_STATUS_COLORS, MAX_CYCLE_NAME_LENGTH } from '../../utils/constants'
import {
  vehicleTypeColumn,
  tierColumn,
  residentColumn,
  apartmentColumn,
  plateColumn,
  raffleStatusColumn,
  dateColumn
} from '../../utils/columns'
import { RaffleCycleStatus, CycleWithCount } from '../../types'

const resultsColumns = [
  { title: 'Spot', dataIndex: 'spotNumber' },
  vehicleTypeColumn(),
  tierColumn,
  residentColumn,
  apartmentColumn,
  plateColumn
]

/** Full raffle lifecycle management: create cycles,
 * transition status (PENDING->OPEN->CLOSED->COMPLETED),
 * execute the algorithm, and view the results.
 * @todo (scalability): i18n — extract user-facing strings to translation keys.
 **/
const RaffleControl: React.FC = () => {
  const [form] = Form.useForm()
  const {
    cycles,
    isLoading,
    isError,
    error,
    isCreating,
    isExecuting,
    statusActionId,
    createModalOpen,
    openCreateModal,
    closeCreateModal,
    resultsModalOpen,
    closeResultsModal,
    currentCycle,
    results,
    isLoadingResults,
    isResultsError,
    resultsError,
    handleCreate,
    handleStatusChange,
    handleExecute,
    handleViewResults
  } = useRaffleControl(form)

  const renderActions = (_: unknown, record: CycleWithCount) => {
    const actions = []
    const isBusy = statusActionId === record.id
    const anyBusy = statusActionId !== null
    if (record.status === RaffleCycleStatus.PENDING) {
      actions.push(
        <Button
          key="open"
          type="primary"
          icon={<PlayCircleOutlined />}
          size="small"
          loading={isBusy}
          disabled={anyBusy && !isBusy}
          onClick={() => handleStatusChange(record.id, RaffleCycleStatus.OPEN)}
        >
          Open
        </Button>
      )
    }
    if (record.status === RaffleCycleStatus.OPEN) {
      actions.push(
        <Button
          key="close"
          icon={<StopOutlined />}
          size="small"
          loading={isBusy}
          disabled={anyBusy && !isBusy}
          onClick={() => handleStatusChange(record.id, RaffleCycleStatus.CLOSED)}
        >
          Close
        </Button>
      )
    }
    if (record.status === RaffleCycleStatus.CLOSED) {
      actions.push(
        <Popconfirm
          key="exec"
          title="Execute raffle? This cannot be undone."
          onConfirm={() => handleExecute(record.id)}
        >
          <Button type="primary" icon={<ThunderboltOutlined />} size="small" loading={isExecuting}>
            Execute
          </Button>
        </Popconfirm>
      )
    }
    if (record.status === RaffleCycleStatus.COMPLETED) {
      actions.push(
        <Button key="results" size="small" onClick={() => handleViewResults(record.id)}>
          View Results
        </Button>
      )
    }
    return <Space>{actions}</Space>
  }

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    dateColumn('Start', 'startDate'),
    dateColumn('End', 'endDate'),
    raffleStatusColumn(),
    {
      title: 'Registrations',
      render: (_: unknown, record: CycleWithCount) => record._count?.registrations ?? 0
    },
    {
      title: 'Assignments',
      render: (_: unknown, record: CycleWithCount) => record._count?.parkingAssignments ?? 0
    },
    { title: 'Actions', render: renderActions }
  ]

  if (isError) {
    return (
      <Alert
        type="error"
        message="Failed to load raffle cycles"
        description={extractErrorMessage(error, 'An unexpected error occurred')}
        showIcon
      />
    )
  }

  return (
    <div>
      <Card
        title="Raffle Cycles"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            New Cycle
          </Button>
        }
      >
        <Table dataSource={cycles} rowKey="id" loading={isLoading} columns={columns} />
      </Card>

      <Modal
        title="Create Raffle Cycle"
        open={createModalOpen}
        onCancel={closeCreateModal}
        footer={null}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item
            name="name"
            label="Cycle Name"
            rules={[
              { required: true },
              {
                max: MAX_CYCLE_NAME_LENGTH,
                message: `Cycle name must be ${MAX_CYCLE_NAME_LENGTH} characters or less`
              }
            ]}
          >
            <Input placeholder="e.g., Q1 2026" maxLength={MAX_CYCLE_NAME_LENGTH} />
          </Form.Item>
          <Form.Item name="dates" label="Date Range" rules={[{ required: true }]}>
            <DatePicker.RangePicker className="w-full" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isCreating} block>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Raffle Results"
        open={resultsModalOpen}
        onCancel={closeResultsModal}
        width={800}
        footer={null}
      >
        {currentCycle && (
          <Descriptions bordered size="small" column={2} className="mb-16">
            <Descriptions.Item label="Cycle">{currentCycle.name}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={RAFFLE_STATUS_COLORS[currentCycle.status]}>{currentCycle.status}</Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
        {isResultsError && (
          <Alert
            type="error"
            message={extractErrorMessage(resultsError, 'Failed to load results')}
            showIcon
            className="mb-16"
          />
        )}
        <Table
          dataSource={results}
          rowKey="id"
          size="small"
          loading={isLoadingResults}
          columns={resultsColumns}
          pagination={false}
        />
      </Modal>
    </div>
  )
}

export default RaffleControl
