/** RTK Query endpoints for vehicle CRUD (resident + admin). */
import { baseApi } from '../api'
import { IVehicle, ApiResponse, requireData } from '../../types'
import { VehicleFormValues } from '../../types/forms'

export const vehiclesApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getVehicles: builder.query<IVehicle[], void>({
      query: () => '/vehicles',
      transformResponse: (response: ApiResponse<IVehicle[]>) => response.data ?? [],
      providesTags: result =>
        result
          ? [
              ...result.map(vehicle => ({ type: 'Vehicles' as const, id: vehicle.id })),
              { type: 'Vehicles', id: 'LIST' }
            ]
          : [{ type: 'Vehicles', id: 'LIST' }]
    }),

    createVehicle: builder.mutation<IVehicle, VehicleFormValues>({
      query: data => ({ url: '/vehicles', method: 'POST', body: data }),
      transformResponse: (response: ApiResponse<IVehicle>) => requireData(response),
      invalidatesTags: [{ type: 'Vehicles', id: 'LIST' }]
    }),

    updateVehicle: builder.mutation<IVehicle, { id: string; data: Partial<VehicleFormValues> }>({
      query: ({ id, data }) => ({ url: `/vehicles/${id}`, method: 'PUT', body: data }),
      transformResponse: (response: ApiResponse<IVehicle>) => requireData(response),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Vehicles', id },
        { type: 'Vehicles', id: 'LIST' }
      ]
    }),

    deleteVehicle: builder.mutation<void, string>({
      query: id => ({ url: `/vehicles/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Vehicles', id },
        { type: 'Vehicles', id: 'LIST' }
      ]
    }),

    searchVehicles: builder.query<IVehicle[], string>({
      query: q => ({ url: '/vehicles/search', params: { q } }),
      transformResponse: (response: ApiResponse<IVehicle[]>) => response.data ?? [],
      providesTags: result =>
        result ? result.map(vehicle => ({ type: 'Vehicles' as const, id: vehicle.id })) : []
    })
  })
})

export const {
  useGetVehiclesQuery,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
  useLazySearchVehiclesQuery
} = vehiclesApi
