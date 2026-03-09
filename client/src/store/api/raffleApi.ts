/**
 * RTK Query endpoints for the raffle lifecycle:
 * cycles CRUD, registration/unregistration, execution, and results.
 *
 * @todo (scalability): WebSocket — subscribe to execution progress instead of polling.
 */
import { baseApi } from '../api'
import {
  IRaffleCycle,
  IRaffleRegistration,
  IParkingAssignment,
  ApiResponse,
  requireData
} from '../../types'
import { CreateCycleRequest, UpdateCycleRequest } from '../../types/forms'

export const raffleApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getCycles: builder.query<IRaffleCycle[], string | void>({
      query: status => ({
        url: '/raffle/cycles',
        params: status ? { status } : undefined
      }),
      transformResponse: (response: ApiResponse<IRaffleCycle[]>) => response.data ?? [],
      providesTags: result =>
        result
          ? [
              ...result.map(cycle => ({ type: 'Cycles' as const, id: cycle.id })),
              { type: 'Cycles', id: 'LIST' }
            ]
          : [{ type: 'Cycles', id: 'LIST' }]
    }),

    getCycleById: builder.query<
      IRaffleCycle & {
        registrations?: IRaffleRegistration[]
        parkingAssignments?: IParkingAssignment[]
      },
      string
    >({
      query: id => `/raffle/cycles/${id}`,
      transformResponse: (
        response: ApiResponse<
          IRaffleCycle & {
            registrations?: IRaffleRegistration[]
            parkingAssignments?: IParkingAssignment[]
          }
        >
      ) => requireData(response),
      providesTags: (_result, _error, id) => [{ type: 'Cycles', id }]
    }),

    createCycle: builder.mutation<IRaffleCycle, CreateCycleRequest>({
      query: data => ({ url: '/raffle/cycles', method: 'POST', body: data }),
      transformResponse: (response: ApiResponse<IRaffleCycle>) => requireData(response),
      invalidatesTags: [{ type: 'Cycles', id: 'LIST' }]
    }),

    updateCycle: builder.mutation<IRaffleCycle, { id: string; data: UpdateCycleRequest }>({
      query: ({ id, data }) => ({ url: `/raffle/cycles/${id}`, method: 'PATCH', body: data }),
      transformResponse: (response: ApiResponse<IRaffleCycle>) => requireData(response),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Cycles', id },
        { type: 'Cycles', id: 'LIST' }
      ]
    }),

    registerForRaffle: builder.mutation<
      IRaffleRegistration,
      { cycleId: string; vehicleId: string }
    >({
      query: ({ cycleId, vehicleId }) => ({
        url: `/raffle/cycles/${cycleId}/register`,
        method: 'POST',
        body: { vehicleId }
      }),
      transformResponse: (response: ApiResponse<IRaffleRegistration>) => requireData(response),
      invalidatesTags: (_result, _error, { cycleId }) => [
        { type: 'Registrations', id: 'LIST' },
        { type: 'Cycles', id: cycleId }
      ]
    }),

    unregisterFromRaffle: builder.mutation<void, { cycleId: string; vehicleId: string }>({
      query: ({ cycleId, vehicleId }) => ({
        url: `/raffle/cycles/${cycleId}/register/${vehicleId}`,
        method: 'DELETE'
      }),
      invalidatesTags: (_result, _error, { cycleId }) => [
        { type: 'Registrations', id: 'LIST' },
        { type: 'Cycles', id: cycleId }
      ]
    }),

    executeRaffle: builder.mutation<IRaffleCycle, string>({
      query: cycleId => ({
        url: `/raffle/cycles/${cycleId}/execute`,
        method: 'POST'
      }),
      transformResponse: (response: ApiResponse<IRaffleCycle>) => requireData(response),
      invalidatesTags: (_result, _error, cycleId) => [
        { type: 'Cycles', id: cycleId },
        { type: 'Cycles', id: 'LIST' },
        { type: 'Results', id: cycleId },
        { type: 'Assignments', id: 'CURRENT' },
        { type: 'Assignments', id: 'HISTORY' }
      ]
    }),

    getResults: builder.query<IParkingAssignment[], string>({
      query: cycleId => `/raffle/cycles/${cycleId}/results`,
      transformResponse: (response: ApiResponse<IParkingAssignment[]>) => response.data ?? [],
      providesTags: (_result, _error, cycleId) => [{ type: 'Results', id: cycleId }]
    }),

    getUserRegistrations: builder.query<IRaffleRegistration[], string | void>({
      query: cycleId => ({
        url: '/raffle/registrations',
        params: cycleId ? { cycleId } : undefined
      }),
      transformResponse: (response: ApiResponse<IRaffleRegistration[]>) => response.data ?? [],
      providesTags: result =>
        result
          ? [
              ...result.map(reg => ({ type: 'Registrations' as const, id: reg.id })),
              { type: 'Registrations', id: 'LIST' }
            ]
          : [{ type: 'Registrations', id: 'LIST' }]
    })
  })
})

export const {
  useGetCyclesQuery,
  useGetCycleByIdQuery,
  useLazyGetCycleByIdQuery,
  useCreateCycleMutation,
  useUpdateCycleMutation,
  useRegisterForRaffleMutation,
  useUnregisterFromRaffleMutation,
  useExecuteRaffleMutation,
  useGetResultsQuery,
  useLazyGetResultsQuery,
  useGetUserRegistrationsQuery
} = raffleApi
