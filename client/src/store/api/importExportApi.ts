/** RTK Query endpoints for bulk import/export operations (CSV/XLSX). */
import { baseApi } from '../api'
import { ApiResponse, ImportResult, requireData } from '../../types'

export const importExportApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    importResidents: builder.mutation<ImportResult, File>({
      query: file => {
        const formData = new FormData()
        formData.append('file', file)
        return {
          url: '/import-export/residents',
          method: 'POST',
          body: formData
        }
      },
      transformResponse: (response: ApiResponse<ImportResult>) => requireData(response),
      invalidatesTags: [
        { type: 'Users', id: 'LIST' },
        { type: 'Users', id: 'PENDING' }
      ]
    }),

    importParkingConfig: builder.mutation<ImportResult, File>({
      query: file => {
        const formData = new FormData()
        formData.append('file', file)
        return {
          url: '/import-export/parking-config',
          method: 'POST',
          body: formData
        }
      },
      transformResponse: (response: ApiResponse<ImportResult>) => requireData(response),
      invalidatesTags: [{ type: 'ParkingConfig', id: 'LIST' }]
    }),

    exportResidents: builder.mutation<Blob, string>({
      query: format => ({
        url: '/import-export/residents',
        params: { format },
        responseHandler: res => res.blob()
      })
    }),

    exportRaffleResults: builder.mutation<Blob, { cycleId: string; format: string }>({
      query: ({ cycleId, format }) => ({
        url: `/import-export/raffle/${cycleId}`,
        params: { format },
        responseHandler: res => res.blob()
      })
    }),

    exportParkingConfig: builder.mutation<Blob, string>({
      query: format => ({
        url: '/import-export/parking-config',
        params: { format },
        responseHandler: res => res.blob()
      })
    })
  })
})

export const {
  useImportResidentsMutation,
  useImportParkingConfigMutation,
  useExportResidentsMutation,
  useExportRaffleResultsMutation,
  useExportParkingConfigMutation
} = importExportApi
