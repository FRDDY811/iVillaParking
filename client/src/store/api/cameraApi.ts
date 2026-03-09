/**
 * RTK Query endpoints for the simulated camera detection system.
 *
 * @todo (scalability): WebSocket — replace polling with a real-time detection feed.
 */
import { baseApi } from '../api'
import { ICameraDetection, ApiResponse, requireData } from '../../types'

export const cameraApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    detect: builder.mutation<ICameraDetection, string>({
      query: licensePlate => ({
        url: '/camera/detect',
        method: 'POST',
        body: { licensePlate }
      }),
      transformResponse: (response: ApiResponse<ICameraDetection>) => requireData(response),
      invalidatesTags: [{ type: 'Detections', id: 'LIST' }]
    }),

    getDetections: builder.query<ICameraDetection[], { limit?: number; status?: string } | void>({
      query: params => ({
        url: '/camera/detections',
        params: params ?? undefined
      }),
      transformResponse: (response: ApiResponse<ICameraDetection[]>) => response.data ?? [],
      providesTags: result =>
        result
          ? [
              ...result.map(detection => ({ type: 'Detections' as const, id: detection.id })),
              { type: 'Detections', id: 'LIST' }
            ]
          : [{ type: 'Detections', id: 'LIST' }]
    })
  })
})

export const { useDetectMutation, useGetDetectionsQuery } = cameraApi
