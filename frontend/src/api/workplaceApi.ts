import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import { WorkPlace, WorkPlaceRequest } from '../types/workPlace.types'

export type { WorkPlace, WorkPlaceRequest }

export const workplaceApi = {
  listPaged: async (page: number, size: number): Promise<PageResponse<WorkPlace>> => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<WorkPlace>>>('/workplaces', {
      params: { page, size, sort: 'place,asc' },
    })
    return res.data.data
  },

  getSites: async (): Promise<string[]> => {
    const response = await axiosInstance.get<ApiResponse<WorkPlace[]>>('/workplaces/all')
    return [...new Set(response.data.data.map((wp) => wp.place))]
  },

  getAll: async (): Promise<WorkPlace[]> => {
    const response = await axiosInstance.get<ApiResponse<WorkPlace[]>>('/workplaces/all')
    return response.data.data
  },

  getById: async (id: number): Promise<WorkPlace> => {
    const response = await axiosInstance.get<ApiResponse<WorkPlace>>(`/workplaces/${id}`)
    return response.data.data
  },

  getByPlace: async (place: string): Promise<WorkPlace[]> => {
    const response = await axiosInstance.get<ApiResponse<WorkPlace[]>>(
      `/workplaces/search?place=${encodeURIComponent(place)}`
    )
    return response.data.data
  },

  create: async (data: WorkPlaceRequest): Promise<WorkPlace> => {
    const res = await axiosInstance.post<ApiResponse<WorkPlace>>('/workplaces', data)
    return res.data.data
  },

  update: async (id: number, data: WorkPlaceRequest): Promise<WorkPlace> => {
    const res = await axiosInstance.put<ApiResponse<WorkPlace>>(`/workplaces/${id}`, data)
    return res.data.data
  },

  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/workplaces/${id}`)
  },
}
