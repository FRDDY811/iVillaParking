import React, { useState, useCallback } from 'react'
import { Card, Button, Space, Upload, Select, Divider, Typography } from 'antd'
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons'
import { useGetCyclesQuery } from '../../store/api/raffleApi'
import {
  useImportResidentsMutation,
  useImportParkingConfigMutation,
  useExportResidentsMutation,
  useExportRaffleResultsMutation,
  useExportParkingConfigMutation
} from '../../store/api/importExportApi'
import { useNotification } from '../../hooks/useNotification'
import { useMutationHandler } from '../../hooks/useMutationHandler'
import { downloadBlob } from '../../utils/download'
import { IRaffleCycle, RaffleCycleStatus } from '../../types'

const { Title } = Typography

const formatSelectStyle = { width: 120 }
const cycleSelectStyle = { width: 200 }
const formatOptions = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV (.csv)' }
]

/** Admin panel for bulk data operations: export residents/results/config to CSV/XLSX,
 * import residents and parking config from uploaded files.
 **/
const ImportExportPanel: React.FC = () => {
  const { data: cycles = [] } = useGetCyclesQuery()
  const [importResidents, { isLoading: isImportingResidents }] = useImportResidentsMutation()
  const [importParkingConfigMut, { isLoading: isImportingConfig }] =
    useImportParkingConfigMutation()
  const [exportResidents, { isLoading: isExportingResidents }] = useExportResidentsMutation()
  const [exportRaffleResults, { isLoading: isExportingRaffle }] = useExportRaffleResultsMutation()
  const [exportParkingConfig, { isLoading: isExportingConfig }] = useExportParkingConfigMutation()
  const notify = useNotification()
  const handle = useMutationHandler()
  const [exportFormat, setExportFormat] = useState('xlsx')
  const [selectedCycle, setSelectedCycle] = useState<string>()
  const isExporting = isExportingResidents || isExportingRaffle || isExportingConfig
  const isBusy = isExporting || isImportingResidents || isImportingConfig

  const handleExport = useCallback(
    async (type: 'residents' | 'raffle' | 'parking-config') => {
      let mutation: Promise<Blob>
      if (type === 'residents') {
        mutation = exportResidents(exportFormat).unwrap()
      } else if (type === 'raffle' && selectedCycle) {
        mutation = exportRaffleResults({ cycleId: selectedCycle, format: exportFormat }).unwrap()
      } else if (type === 'parking-config') {
        mutation = exportParkingConfig(exportFormat).unwrap()
      } else {
        notify.warning('Please select a raffle cycle')
        return
      }

      const blob = await handle(mutation, 'Export successful', 'Export failed')
      if (blob) {
        let filename: string = type
        if (type === 'raffle' && selectedCycle) {
          const cycleName = cycles.find((c: IRaffleCycle) => c.id === selectedCycle)?.name
          if (cycleName) filename = `raffle-${cycleName.replace(/\s+/g, '-')}`
        }
        downloadBlob(blob, `${filename}.${exportFormat}`)
      }
    },
    [
      exportFormat,
      selectedCycle,
      cycles,
      notify,
      handle,
      exportResidents,
      exportRaffleResults,
      exportParkingConfig
    ]
  )

  const handleImport = useCallback(
    async (file: File, type: 'residents' | 'parking-config') => {
      const data =
        type === 'residents'
          ? await handle(importResidents(file).unwrap(), `Import successful`, 'Import failed')
          : await handle(
              importParkingConfigMut(file).unwrap(),
              `Import successful`,
              'Import failed'
            )
      if (data) {
        notify.info(`Imported: ${data.imported}, Skipped: ${data.skipped}`)
      }
      return false
    },
    [importResidents, importParkingConfigMut, handle, notify]
  )

  return (
    <div>
      <Card title="Export Data" className="mb-16">
        <Space direction="vertical" className="w-full">
          <Space>
            <Select
              value={exportFormat}
              onChange={setExportFormat}
              style={formatSelectStyle}
              options={formatOptions}
            />
          </Space>
          <Space>
            <Button
              icon={<DownloadOutlined />}
              loading={isExporting}
              disabled={isBusy && !isExporting}
              onClick={() => handleExport('residents')}
            >
              Export Residents
            </Button>
            <Button
              icon={<DownloadOutlined />}
              loading={isExporting}
              disabled={isBusy && !isExporting}
              onClick={() => handleExport('parking-config')}
            >
              Export Parking Config
            </Button>
          </Space>
          <Divider />
          <Space>
            <Select
              placeholder="Select cycle"
              value={selectedCycle}
              onChange={setSelectedCycle}
              style={cycleSelectStyle}
              options={cycles
                .filter((cycle: IRaffleCycle) => cycle.status === RaffleCycleStatus.COMPLETED)
                .map((cycle: IRaffleCycle) => ({ value: cycle.id, label: cycle.name }))}
            />
            <Button
              icon={<DownloadOutlined />}
              loading={isExporting}
              onClick={() => handleExport('raffle')}
              disabled={!selectedCycle || (isBusy && !isExporting)}
            >
              Export Raffle Results
            </Button>
          </Space>
        </Space>
      </Card>

      <Card title="Import Data">
        <Space direction="vertical" className="w-full">
          <Title level={5}>Import Residents</Title>
          <Upload
            accept=".csv,.xlsx"
            showUploadList={false}
            beforeUpload={file => {
              handleImport(file, 'residents')
              return false
            }}
          >
            <Button
              icon={<UploadOutlined />}
              loading={isImportingResidents}
              disabled={isBusy && !isImportingResidents}
            >
              Upload Residents File
            </Button>
          </Upload>
          <Divider />
          <Title level={5}>Import Parking Config</Title>
          <Upload
            accept=".csv,.xlsx"
            showUploadList={false}
            beforeUpload={file => {
              handleImport(file, 'parking-config')
              return false
            }}
          >
            <Button
              icon={<UploadOutlined />}
              loading={isImportingConfig}
              disabled={isBusy && !isImportingConfig}
            >
              Upload Parking Config File
            </Button>
          </Upload>
        </Space>
      </Card>
    </div>
  )
}

export default ImportExportPanel
