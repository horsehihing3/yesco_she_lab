import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import { SafetyWork, SafetyWorkRequest } from '../types/safetyWork.types'

interface SearchParams {
  page: number
  size: number
  title?: string
  location?: string
  status?: string
}

export const safetyWorkApi = {
  search: async (params: SearchParams): Promise<PageResponse<SafetyWork>> => {
    const { page, size, title, location, status } = params
    let url = '/safety-works'
    const queryParams = new URLSearchParams()
    queryParams.append('page', String(page))
    queryParams.append('size', String(size))

    if (title) {
      url = '/safety-works/search'
      queryParams.append('title', title)
    } else if (status) {
      url = `/safety-works/status/${status}`
    } else if (location) {
      url = `/safety-works/location/${encodeURIComponent(location)}`
    }

    const res = await axiosInstance.get<ApiResponse<PageResponse<SafetyWork>>>(`${url}?${queryParams.toString()}`)
    return res.data.data
  },

  getById: async (id: number): Promise<SafetyWork> => {
    const res = await axiosInstance.get<ApiResponse<SafetyWork>>(`/safety-works/${id}`)
    return res.data.data
  },

  create: async (data: SafetyWorkRequest): Promise<SafetyWork> => {
    const res = await axiosInstance.post<ApiResponse<SafetyWork>>('/safety-works', data)
    return res.data.data
  },

  update: async (id: number, data: SafetyWorkRequest): Promise<SafetyWork> => {
    const res = await axiosInstance.put<ApiResponse<SafetyWork>>(`/safety-works/${id}`, data)
    return res.data.data
  },

  updateStatus: async (id: number, status: string): Promise<SafetyWork> => {
    const res = await axiosInstance.patch<ApiResponse<SafetyWork>>(`/safety-works/${id}/status?status=${status}`)
    return res.data.data
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/safety-works/${id}`)
  },
}
