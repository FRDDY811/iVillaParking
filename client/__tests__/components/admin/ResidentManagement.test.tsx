import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  renderWithProviders,
  mockAdminUser,
  createMockNotify
} from '../../helpers/renderWithProviders'
import ResidentManagement from '../../../src/components/admin/ResidentManagement'

const mockGetUsersQuery = vi.fn()
const mockGetPendingUsersQuery = vi.fn()
const mockUpdateUserMutation = vi.fn()
const mockDeleteUserMutation = vi.fn()

const user = userEvent.setup({ delay: null })

vi.mock('../../../src/store/api/usersApi', () => ({
  useGetUsersQuery: () => mockGetUsersQuery(),
  useGetPendingUsersQuery: () => mockGetPendingUsersQuery(),
  useUpdateUserMutation: () => [mockUpdateUserMutation, { isLoading: false }],
  useDeleteUserMutation: () => [mockDeleteUserMutation, { isLoading: false }]
}))

const mockNotify = createMockNotify()

vi.mock('../../../src/hooks/useNotification', () => ({
  useNotification: () => mockNotify
}))

const mockResident = {
  id: 'user-1',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@test.com',
  apartment: '3A',
  role: 'RESIDENT',
  status: 'ACTIVE',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z'
}

const mockPendingUser = {
  ...mockResident,
  id: 'user-2',
  firstName: 'Pending',
  lastName: 'User',
  status: 'PENDING'
}

describe('ResidentManagement', () => {
  const adminState = {
    auth: { user: mockAdminUser, isAuthenticated: true, loading: false, error: null }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateUserMutation.mockReturnValue({ unwrap: () => Promise.resolve({}) })
    mockDeleteUserMutation.mockReturnValue({ unwrap: () => Promise.resolve({}) })
    mockGetUsersQuery.mockReturnValue({
      data: { data: [mockResident], total: 1, page: 1, totalPages: 1 },
      isLoading: false,
      isError: false,
      error: null
    })
    mockGetPendingUsersQuery.mockReturnValue({ data: [], isLoading: false })
  })

  it('should render the residents table', () => {
    renderWithProviders(<ResidentManagement />, { preloadedState: adminState })
    expect(screen.getByText('All Residents')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('jane@test.com')).toBeInTheDocument()
  })

  it('should render the search input', () => {
    renderWithProviders(<ResidentManagement />, { preloadedState: adminState })
    expect(screen.getByRole('textbox', { name: /search residents/i })).toBeInTheDocument()
  })

  it('should show the pending approvals card when pending users exist', () => {
    mockGetPendingUsersQuery.mockReturnValue({ data: [mockPendingUser], isLoading: false })
    renderWithProviders(<ResidentManagement />, { preloadedState: adminState })
    expect(screen.getByText('Pending Approvals')).toBeInTheDocument()
  })

  it('should show an error alert on query failure', () => {
    mockGetUsersQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { data: { message: 'Server error' } }
    })
    renderWithProviders(<ResidentManagement />, { preloadedState: adminState })
    expect(screen.getByText('Failed to load residents')).toBeInTheDocument()
  })

  it('should show the approve and reject buttons for pending users', () => {
    mockGetPendingUsersQuery.mockReturnValue({ data: [mockPendingUser], isLoading: false })
    renderWithProviders(<ResidentManagement />, { preloadedState: adminState })
    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument()
  })

  it('should call updateUser with ACTIVE status when the approve button is clicked', async () => {
    mockGetPendingUsersQuery.mockReturnValue({ data: [mockPendingUser], isLoading: false })
    renderWithProviders(<ResidentManagement />, { preloadedState: adminState })
    await user.click(screen.getByRole('button', { name: /approve/i }))
    expect(mockUpdateUserMutation).toHaveBeenCalledWith({
      id: 'user-2',
      data: { status: 'ACTIVE' }
    })
    expect(mockNotify.success).toHaveBeenCalledWith('User approved')
  })

  it('should call updateUser with REJECTED status when the reject button is clicked', async () => {
    mockGetPendingUsersQuery.mockReturnValue({ data: [mockPendingUser], isLoading: false })
    renderWithProviders(<ResidentManagement />, { preloadedState: adminState })
    await user.click(screen.getByRole('button', { name: /reject/i }))
    expect(mockUpdateUserMutation).toHaveBeenCalledWith({
      id: 'user-2',
      data: { status: 'REJECTED' }
    })
    expect(mockNotify.success).toHaveBeenCalledWith('User rejected')
  })

  it('should show an error notification on approve failure', async () => {
    mockUpdateUserMutation.mockReturnValue({
      unwrap: () => Promise.reject({ data: { message: 'Approve failed' } })
    })
    mockGetPendingUsersQuery.mockReturnValue({ data: [mockPendingUser], isLoading: false })
    renderWithProviders(<ResidentManagement />, { preloadedState: adminState })
    await user.click(screen.getByRole('button', { name: /approve/i }))
    expect(mockNotify.error).toHaveBeenCalled()
  })

  it('should call deleteUser when the delete confirmation buton is clicked', async () => {
    mockGetPendingUsersQuery.mockReturnValue({ data: [mockPendingUser], isLoading: false })
    renderWithProviders(<ResidentManagement />, { preloadedState: adminState })
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await user.click(deleteButtons[0])
    await waitFor(() => {
      expect(document.querySelector('.ant-popconfirm')).toBeInTheDocument()
    })
    const okBtn = document.querySelector('.ant-popconfirm-buttons .ant-btn-primary') as HTMLElement
    await user.click(okBtn)
    expect(mockDeleteUserMutation).toHaveBeenCalledWith('user-2')
    expect(mockNotify.success).toHaveBeenCalledWith('User deleted')
  })
})
