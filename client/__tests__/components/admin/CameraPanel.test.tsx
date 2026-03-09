import React from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, createMockNotify } from '../../helpers/renderWithProviders'
import CameraPanel from '../../../src/components/admin/CameraPanel'

const mockDetect = vi.fn()
const mockGetDetectionsQuery = vi.fn()
const mockNotify = createMockNotify()

const user = userEvent.setup({ delay: null })

vi.mock('../../../src/store/api/cameraApi', () => ({
  useDetectMutation: () => [mockDetect, { isLoading: false }],
  useGetDetectionsQuery: () => mockGetDetectionsQuery()
}))

vi.mock('../../../src/hooks/useNotification', () => ({
  useNotification: () => mockNotify
}))

const mockDetection = {
  id: 'det-1',
  licensePlate: 'ABC-1234',
  status: 'AUTHORIZED',
  detectedAt: '2026-01-15T10:30:00.000Z',
  vehicle: {
    user: { firstName: 'John', lastName: 'Doe', apartment: '4B' }
  }
}

describe('CameraPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetDetectionsQuery.mockReturnValue({
      data: [mockDetection],
      isError: false,
      error: null
    })
    mockDetect.mockReturnValue({ unwrap: () => Promise.resolve({}) })
  })

  it('should render the camera input and the detect button', () => {
    renderWithProviders(<CameraPanel />)
    expect(
      screen.getByRole('textbox', { name: /license plate for detection/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /detect/i })).toBeInTheDocument()
  })

  it('should render the detection data with the correct status in a table', () => {
    renderWithProviders(<CameraPanel />)
    expect(screen.getByText('ABC-1234')).toBeInTheDocument()
    expect(screen.getByText('AUTHORIZED')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('should render the section titles', () => {
    renderWithProviders(<CameraPanel />)
    expect(screen.getByText('Mock Camera Detection')).toBeInTheDocument()
    expect(screen.getByText('Recent Detections')).toBeInTheDocument()
  })

  it('should show an error when the detection fails to load', () => {
    mockGetDetectionsQuery.mockReturnValue({
      data: [],
      isError: true,
      error: { data: { message: 'Failed to load detections' } }
    })

    renderWithProviders(<CameraPanel />)
    expect(screen.getByText('Failed to load detections')).toBeInTheDocument()
  })

  it('should call detect and shows success on valid plate', async () => {
    renderWithProviders(<CameraPanel />)
    const input = screen.getByRole('textbox', { name: /license plate for detection/i })
    await user.type(input, 'xyz-999')
    await user.click(screen.getByRole('button', { name: /detect/i }))
    expect(mockDetect).toHaveBeenCalledWith('XYZ-999')
    expect(mockNotify.success).toHaveBeenCalledWith('Detection recorded')
  })

  it('does not call the detect mutation when the plate input is empty', async () => {
    renderWithProviders(<CameraPanel />)
    await user.click(screen.getByRole('button', { name: /detect/i }))
    expect(mockDetect).not.toHaveBeenCalled()
  })

  it('should show an error notification when a failure is detected', async () => {
    mockDetect.mockReturnValue({
      unwrap: () => Promise.reject({ data: { message: 'Detection failed' } })
    })
    renderWithProviders(<CameraPanel />)
    await user.type(screen.getByRole('textbox', { name: /license plate for detection/i }), 'ABC')
    await user.click(screen.getByRole('button', { name: /detect/i }))
    expect(mockNotify.error).toHaveBeenCalled()
  })
})
