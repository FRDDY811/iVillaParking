/** RTK Query endpoints for parking spot configuration and assignment queries. */
import { baseApi } from '../api'
import { IParkingSpotConfig, IParkingAssignment, ApiResponse, requireData } from '../../types'
import { ParkingConfigFormValues } from '../../types/forms'

export const parkingSpotsApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getParkingConfig: builder.query<IParkingSpotConfig[], void>({
      query: () => '/parking-spots/config',
      transformResponse: (response: ApiResponse<IParkingSpotConfig[]>) => response.data ?? [],
      providesTags: result =>
        result
          ? [
              ...result.map(config => ({ type: 'ParkingConfig' as const, id: config.id })),
              { type: 'ParkingConfig', id: 'LIST' }
            ]
          : [{ type: 'ParkingConfig', id: 'LIST' }]
    }),

    createParkingConfig: builder.mutation<IParkingSpotConfig, ParkingConfigFormValues>({
      query: data => ({ url: '/parking-spots/config', method: 'POST', body: data }),
      transformResponse: (response: ApiResponse<IParkingSpotConfig>) => requireData(response),
      invalidatesTags: [{ type: 'ParkingConfig', id: 'LIST' }]
    }),

    getCurrentAssignments: builder.query<IParkingAssignment[], void>({
      query: () => '/parking-spots/assignments',
      transformResponse: (response: ApiResponse<IParkingAssignment[]>) => response.data ?? [],
      providesTags: result =>
        result
          ? [
              ...result.map(assignment => ({ type: 'Assignments' as const, id: assignment.id })),
              { type: 'Assignments', id: 'CURRENT' }
            ]
          : [{ type: 'Assignments', id: 'CURRENT' }]
    }),

    getAssignmentHistory: builder.query<IParkingAssignment[], string | void>({
      query: userId => ({
        url: '/parking-spots/history',
        params: userId ? { userId } : undefined
      }),
      transformResponse: (response: ApiResponse<IParkingAssignment[]>) => response.data ?? [],
      providesTags: result =>
        result
          ? [
              ...result.map(assignment => ({ type: 'Assignments' as const, id: assignment.id })),
              { type: 'Assignments', id: 'HISTORY' }
            ]
          : [{ type: 'Assignments', id: 'HISTORY' }]
    })
  })
})

export const {
  useGetParkingConfigQuery,
  useCreateParkingConfigMutation,
  useGetCurrentAssignmentsQuery,
  useGetAssignmentHistoryQuery
} = parkingSpotsApi
