import React from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../helpers/renderWithProviders'
import LicensePlateSearch from '../../../src/components/admin/LicensePlateSearch'

const mockTrigger = vi.fn()
const user = userEvent.setup({ delay: null })

let mockHookReturn: unknown[] = [
  mockTrigger,
  { data: [], isLoading: false, isError: false, error: null }
]

vi.mock('../../../src/store/api/vehiclesApi', () => ({
  useLazySearchVehiclesQuery: () => mockHookReturn
}))

describe('LicensePlate Search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHookReturn = [mockTrigger, { data: [], isLoading: false, isError: false, error: null }]
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render the search input', () => {
    renderWithProviders(<LicensePlateSearch />)
    expect(screen.getByRole('searchbox', { name: /search license plates/i })).toBeInTheDocument()
  })

  it('should render the title', () => {
    renderWithProviders(<LicensePlateSearch />)
    expect(screen.getByText('License Plate Search')).toBeInTheDocument()
  })

  it('should show an empty state when the query exists but no results', async () => {
    renderWithProviders(<LicensePlateSearch />)
    const input = screen.getByRole('searchbox', { name: /search license plates/i })
    await user.type(input, 'XYZ')
    expect(screen.getByText('No vehicles found')).toBeInTheDocument()
  })

  it('should show an error alert when the query fails', () => {
    mockHookReturn = [
      mockTrigger,
      { data: [], isLoading: false, isError: true, error: { data: 'Search failed' } }
    ]

    renderWithProviders(<LicensePlateSearch />)
    expect(screen.getByText('Search failed')).toBeInTheDocument()
  })

  it('should debounce the search input', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const fakeUser = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime })

    renderWithProviders(<LicensePlateSearch />)
    const input = screen.getByRole('searchbox', { name: /search license plates/i })

    await fakeUser.type(input, 'ABC')

    expect(mockTrigger).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)

    expect(mockTrigger).toHaveBeenCalledTimes(1)
    expect(mockTrigger).toHaveBeenCalledWith('ABC')
  })

  it('should clear the results on empty input', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const fakeUser = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime })

    renderWithProviders(<LicensePlateSearch />)
    const input = screen.getByRole('searchbox', { name: /search license plates/i })

    await fakeUser.type(input, 'ABC')
    vi.advanceTimersByTime(300)
    expect(mockTrigger).toHaveBeenCalledTimes(1)

    await fakeUser.clear(input)
    vi.advanceTimersByTime(300)

    expect(mockTrigger).toHaveBeenCalledTimes(1)
  })
})
