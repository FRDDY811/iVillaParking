import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, Input, Table, Empty, Alert } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useLazySearchVehiclesQuery } from '../../store/api/vehiclesApi'
import { extractErrorMessage } from '../../utils/errorMessage'
import {
  licensePlateColumn,
  vehicleTypeColumn,
  residentColumn,
  apartmentColumn
} from '../../utils/columns'
import { IVehicle } from '../../types'

const DEBOUNCE_MS = 300

const columns = [
  licensePlateColumn,
  vehicleTypeColumn('type'),
  {
    title: 'Make / Model',
    render: (_: unknown, record: IVehicle) => `${record.make} ${record.model}`
  },
  { title: 'Color', dataIndex: 'color' },
  residentColumn,
  apartmentColumn
]

/** Quick-search for vehicles by license plate. Displays owner, apartment, and vehicle details. */
const LicensePlateSearch: React.FC = () => {
  const [trigger, { data: searchResults = [], isLoading, isError, error }] =
    useLazySearchVehiclesQuery()
  const [query, setQuery] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setQuery(value)
      clearTimeout(timerRef.current)
      if (value.trim()) {
        timerRef.current = setTimeout(() => trigger(value), DEBOUNCE_MS)
      }
    },
    [trigger]
  )

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <Card title="License Plate Search">
      <Input.Search
        placeholder="Search by license plate..."
        prefix={<SearchOutlined />}
        size="large"
        value={query}
        onChange={handleChange}
        allowClear
        aria-label="Search license plates"
        className="mb-16"
      />
      {isError && (
        <Alert
          type="error"
          message={extractErrorMessage(error, 'Search failed')}
          showIcon
          className="mb-16"
        />
      )}
      {searchResults.length > 0 ? (
        <Table
          dataSource={searchResults}
          rowKey="id"
          loading={isLoading}
          columns={columns}
          pagination={false}
        />
      ) : query && !isLoading ? (
        <Empty description="No vehicles found" />
      ) : null}
    </Card>
  )
}

export default LicensePlateSearch
