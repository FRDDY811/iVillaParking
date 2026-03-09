import React, { useState, useDeferredValue, useCallback, useMemo } from 'react'
import { Table, Tag, Button, Space, Input, Select, Popconfirm, Card, Badge, Alert } from 'antd'
import { CheckOutlined, CloseOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import {
  useGetUsersQuery,
  useGetPendingUsersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation
} from '../../store/api/usersApi'
import { useActionInFlight } from '../../hooks/useActionInFlight'
import { extractErrorMessage } from '../../utils/errorMessage'
import { USER_STATUS_COLORS, DEFAULT_PAGE_SIZE } from '../../utils/constants'
import { formatDate, formatUserName } from '../../utils/formatters'
import { IUser, UserStatus } from '../../types'

const statusFilterStyle = { width: 120 }

const statusFilterOptions = [
  { value: UserStatus.ACTIVE, label: 'Active' },
  { value: UserStatus.PENDING, label: 'Pending' },
  { value: UserStatus.REJECTED, label: 'Rejected' }
]

/** Resident administration table with search, status filtering, and approval workflow.
 * Pending registrations appear in a highlighted card above the main table.
 * @todo (scalability): i18n — extract column headers and action labels to translation keys.
 **/
const ResidentManagement: React.FC = () => {
  const { isBusy, anyBusy, run } = useActionInFlight()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [statusFilter, setStatusFilter] = useState<UserStatus | undefined>()

  const {
    data: usersData,
    isLoading,
    isError,
    error
  } = useGetUsersQuery({
    page,
    limit: DEFAULT_PAGE_SIZE,
    ...(deferredSearch && { search: deferredSearch }),
    ...(statusFilter && { status: statusFilter })
  })
  const { data: pendingUsers = [] } = useGetPendingUsersQuery()
  const [updateUser] = useUpdateUserMutation()
  const [deleteUser] = useDeleteUserMutation()

  const handleApprove = useCallback(
    (id: string) =>
      run(
        id,
        updateUser({ id, data: { status: UserStatus.ACTIVE } }).unwrap(),
        'User approved',
        'Failed to approve user'
      ),
    [updateUser, run]
  )

  const handleReject = useCallback(
    (id: string) =>
      run(
        id,
        updateUser({ id, data: { status: UserStatus.REJECTED } }).unwrap(),
        'User rejected',
        'Failed to reject user'
      ),
    [updateUser, run]
  )

  const handleDelete = useCallback(
    (id: string) => run(id, deleteUser(id).unwrap(), 'User deleted', 'Failed to delete user'),
    [deleteUser, run]
  )

  const columns = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'firstName',
        render: (_: string, record: IUser) => formatUserName(record)
      },
      { title: 'Email', dataIndex: 'email' },
      { title: 'Apartment', dataIndex: 'apartment' },
      {
        title: 'Status',
        dataIndex: 'status',
        render: (status: string) => <Tag color={USER_STATUS_COLORS[status]}>{status}</Tag>
      },
      { title: 'Registered', dataIndex: 'createdAt', render: (date: string) => formatDate(date) },
      {
        title: 'Actions',
        key: 'actions',
        render: (_: unknown, record: IUser) => {
          const busy = isBusy(record.id)
          return (
            <Space>
              {record.status === UserStatus.PENDING && (
                <>
                  <Button
                    size="small"
                    type="primary"
                    icon={<CheckOutlined />}
                    loading={busy}
                    disabled={anyBusy && !busy}
                    onClick={() => handleApprove(record.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    danger
                    icon={<CloseOutlined />}
                    loading={busy}
                    disabled={anyBusy && !busy}
                    onClick={() => handleReject(record.id)}
                  >
                    Reject
                  </Button>
                </>
              )}
              <Popconfirm title="Delete this user?" onConfirm={() => handleDelete(record.id)}>
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  loading={busy}
                  disabled={anyBusy && !busy}
                  aria-label="Delete user"
                />
              </Popconfirm>
            </Space>
          )
        }
      }
    ],
    [isBusy, anyBusy, handleApprove, handleReject, handleDelete]
  )

  if (isError) {
    return (
      <Alert
        type="error"
        message="Failed to load residents"
        description={extractErrorMessage(error, 'An unexpected error occurred')}
        showIcon
      />
    )
  }

  return (
    <div>
      {pendingUsers.length > 0 && (
        <Card
          title={
            <Badge count={pendingUsers.length} offset={[10, 0]}>
              Pending Approvals
            </Badge>
          }
          className="mb-16"
        >
          <Table
            dataSource={pendingUsers}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      )}
      <Card title="All Residents">
        <Space className="mb-16">
          <Input
            placeholder="Search..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            allowClear
            aria-label="Search residents"
          />
          <Select
            placeholder="Status"
            allowClear
            style={statusFilterStyle}
            value={statusFilter}
            onChange={setStatusFilter}
            aria-label="Filter by status"
            options={statusFilterOptions}
          />
        </Space>
        <Table
          dataSource={usersData?.data ?? []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            total: usersData?.total ?? 0,
            pageSize: DEFAULT_PAGE_SIZE,
            onChange: setPage
          }}
        />
      </Card>
    </div>
  )
}

export default ResidentManagement
