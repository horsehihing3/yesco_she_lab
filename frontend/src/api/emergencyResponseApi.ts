import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import { EmergencyResponse, EmergencyResponseRequest } from '../types/emergencyResponse.types'

export const emergencyResponseApi = {
  getAll: async (page = 0, size = 10) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<EmergencyResponse>>>('/emergency-response', { params: { page, size } })
    return res.data.data
  },

  getById: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<EmergencyResponse>>(`/emergency-response/${id}`)
    return res.data.data
  },

  getByStatus: async (status: string, page = 0, size = 10) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<EmergencyResponse>>>(`/emergency-response/status/${status}`, { params: { page, size } })
    return res.data.data
  },

  getByType: async (emergencyType: string, page = 0, size = 10) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<EmergencyResponse>>>(`/emergency-response/type/${emergencyType}`, { params: { page, size } })
    return res.data.data
  },

  search: async (title: string, page = 0, size = 10) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<EmergencyResponse>>>('/emergency-response/search', { params: { title, page, size } })
    return res.data.data
  },

  create: async (data: EmergencyResponseRequest) => {
    const res = await axiosInstance.post<ApiResponse<EmergencyResponse>>('/emergency-response', data)
    return res.data.data
  },

  update: async (id: number, data: EmergencyResponseRequest) => {
    const res = await axiosInstance.put<ApiResponse<EmergencyResponse>>(`/emergency-response/${id}`, data)
    return res.data.data
  },

  updateStatus: async (id: number, status: string) => {
    const res = await axiosInstance.patch<ApiResponse<EmergencyResponse>>(`/emergency-response/${id}/status`, null, { params: { status } })
    return res.data.data
  },

  delete: async (id: number) => {
    await axiosInstance.delete(`/emergency-response/${id}`)
  },
}
