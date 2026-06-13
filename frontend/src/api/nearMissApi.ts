import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import { NearMiss, NearMissRequest } from '../types/nearMiss.types'

export const nearMissApi = {
  listByType: async (incidentType: string, page: number, size: number): Promise<PageResponse<NearMiss>> => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<NearMiss>>>(`/near-miss/type/${incidentType}`, {
      params: { page, size, sort: 'createdAt,desc' },
    })
    return res.data.data
  },

  getById: async (id: number): Promise<NearMiss> => {
    const res = await axiosInstance.get<ApiResponse<NearMiss>>(`/near-miss/${id}`)
    return res.data.data
  },

  create: async (data: NearMissRequest): Promise<NearMiss> => {
    const res = await axiosInstance.post<ApiResponse<NearMiss>>('/near-miss', data)
    return res.data.data
  },

  update: async (id: number, data: NearMissRequest): Promise<NearMiss> => {
    const res = await axiosInstance.put<ApiResponse<NearMiss>>(`/near-miss/${id}`, data)
    return res.data.data
  },

  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/near-miss/${id}`)
  },
}
