/** RTK Query endpoints for user management (admin-facing). */
import { baseApi } from '../api'
import { IUser, PaginatedResponse, ApiResponse, UserStatus, requireData } from '../../types'
import { UpdateUserRequest } from '../../types/forms'

export const usersApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getUsers: builder.query<
      { data: IUser[]; total: number; page: number; totalPages: number },
      { page?: number; limit?: number; search?: string; status?: UserStatus } | void
    >({
      query: params => ({ url: '/users', params: params ?? undefined }),
      transformResponse: (response: PaginatedResponse<IUser>) => ({
        data: response.data ?? [],
        total: response.total,
        page: response.page,
        totalPages: response.totalPages
      }),
      providesTags: result =>
        result
          ? [
              ...result.data.map(user => ({ type: 'Users' as const, id: user.id })),
              { type: 'Users', id: 'LIST' }
            ]
          : [{ type: 'Users', id: 'LIST' }]
    }),

    getPendingUsers: builder.query<IUser[], void>({
      query: () => '/users/pending',
      transformResponse: (response: ApiResponse<IUser[]>) => response.data ?? [],
      providesTags: result =>
        result
          ? [
              ...result.map(user => ({ type: 'Users' as const, id: user.id })),
              { type: 'Users', id: 'PENDING' }
            ]
          : [{ type: 'Users', id: 'PENDING' }]
    }),

    updateUser: builder.mutation<IUser, { id: string; data: UpdateUserRequest }>({
      query: ({ id, data }) => ({ url: `/users/${id}`, method: 'PATCH', body: data }),
      transformResponse: (response: ApiResponse<IUser>) => requireData(response),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Users', id },
        { type: 'Users', id: 'LIST' },
        { type: 'Users', id: 'PENDING' }
      ]
    }),

    deleteUser: builder.mutation<void, string>({
      query: id => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Users', id },
        { type: 'Users', id: 'LIST' },
        { type: 'Users', id: 'PENDING' }
      ]
    })
  })
})

export const {
  useGetUsersQuery,
  useGetPendingUsersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation
} = usersApi
