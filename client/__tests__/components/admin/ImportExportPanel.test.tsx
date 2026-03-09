import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, createMockNotify } from '../../helpers/renderWithProviders'
import ImportExportPanel from '../../../src/components/admin/ImportExportPanel'

const mockImportResidents = vi.fn()
const mockImportParkingConfig = vi.fn()
const mockExportResidents = vi.fn()
const mockExportParkingConfig = vi.fn()
const mockExportRaffleResults = vi.fn()
const mockNotify = createMockNotify()
const user = userEvent.setup({ delay: null })

vi.mock('../../../src/store/api/raffleApi', () => ({
  useGetCyclesQuery: () => ({
    data: [{ id: 'cycle-1', name: 'Q1 2026', status: 'COMPLETED' }],
    isLoading: false
  })
}))

vi.mock('../../../src/store/api/importExportApi', () => ({
  useImportResidentsMutation: () => [mockImportResidents, { isLoading: false }],
  useImportParkingConfigMutation: () => [mockImportParkingConfig, { isLoading: false }],
  useExportResidentsMutation: () => [mockExportResidents, { isLoading: false }],
  useExportParkingConfigMutation: () => [mockExportParkingConfig, { isLoading: false }],
  useExportRaffleResultsMutation: () => [mockExportRaffleResults, { isLoading: false }]
}))

vi.mock('../../../src/api/importExport', () => ({
  importExportApi: {
    exportResidents: (...args: unknown[]) => mockExportResidents(...args),
    exportRaffleResults: (...args: unknown[]) => mockExportRaffleResults(...args),
    exportParkingConfig: (...args: unknown[]) => mockExportParkingConfig(...args)
  }
}))

vi.mock('../../../src/utils/download', () => ({
  downloadBlob: vi.fn()
}))

vi.mock('../../../src/hooks/useNotification', () => ({
  useNotification: () => mockNotify
}))

describe('Import and Export Panel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExportResidents.mockReturnValue({ unwrap: () => Promise.resolve(new Blob()) })
    mockExportParkingConfig.mockReturnValue({ unwrap: () => Promise.resolve(new Blob()) })
    mockExportRaffleResults.mockReturnValue({ unwrap: () => Promise.resolve(new Blob()) })
    mockImportResidents.mockReturnValue({
      unwrap: () => Promise.resolve({ imported: 5, skipped: 0 })
    })
    mockImportParkingConfig.mockReturnValue({
      unwrap: () => Promise.resolve({ imported: 3, skipped: 1 })
    })
  })

  it('should render the export section', () => {
    renderWithProviders(<ImportExportPanel />)
    expect(screen.getByText('Export Data')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export residents/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export parking config/i })).toBeInTheDocument()
  })

  it('should render the import section', () => {
    renderWithProviders(<ImportExportPanel />)
    expect(screen.getByText('Import Data')).toBeInTheDocument()
    expect(screen.getByText('Import Residents')).toBeInTheDocument()
    expect(screen.getByText('Import Parking Config')).toBeInTheDocument()
  })

  it('should render the format selector', () => {
    renderWithProviders(<ImportExportPanel />)
    expect(screen.getByText('Excel (.xlsx)')).toBeInTheDocument()
  })

  it('should export the residents in the button click', async () => {
    renderWithProviders(<ImportExportPanel />)
    await user.click(screen.getByRole('button', { name: /export residents/i }))
    await waitFor(() => {
      expect(mockExportResidents).toHaveBeenCalledWith('xlsx')
      expect(mockNotify.success).toHaveBeenCalledWith('Export successful')
    })
  })

  it('exports parking config on button click', async () => {
    renderWithProviders(<ImportExportPanel />)
    await user.click(screen.getByRole('button', { name: /export parking config/i }))
    await waitFor(() => {
      expect(mockExportParkingConfig).toHaveBeenCalledWith('xlsx')
      expect(mockNotify.success).toHaveBeenCalledWith('Export successful')
    })
  })

  it('shows error notification on export failure', async () => {
    mockExportResidents.mockReturnValue({
      unwrap: () => Promise.reject(new Error('Network error'))
    })
    renderWithProviders(<ImportExportPanel />)
    await user.click(screen.getByRole('button', { name: /export residents/i }))
    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalledWith(expect.stringContaining('Network error'))
    })
  })

  it('shows warning when exporting raffle without cycle selected', async () => {
    renderWithProviders(<ImportExportPanel />)
    const raffleButton = screen.getByRole('button', { name: /export raffle results/i })
    expect(raffleButton).toBeDisabled()
  })

  it('shows error notification on import failure', async () => {
    mockImportResidents.mockReturnValue({
      unwrap: () => Promise.reject(new Error('Invalid file format'))
    })
    renderWithProviders(<ImportExportPanel />)

    const file = new File(['test'], 'residents.csv', { type: 'text/csv' })
    const uploadButton = screen.getByRole('button', { name: /upload residents file/i })
    const input = uploadButton.closest('.ant-upload')!.querySelector('input[type="file"]')!

    await user.upload(input as HTMLInputElement, file)

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalledWith('Invalid file format')
    })
  })
})
