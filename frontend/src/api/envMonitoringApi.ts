import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import { EnvMonitoring, EnvMonitoringRequest, EnvMonitoringKpi } from '../types/envMonitoring.types'

export const envMonitoringApi = {
  getAll: async (page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<EnvMonitoring>>>('/env-monitoring', { params: { page, size } })
    return res.data.data
  },

  getById: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<EnvMonitoring>>(`/env-monitoring/${id}`)
    return res.data.data
  },

  search: async (keyword: string, page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<EnvMonitoring>>>('/env-monitoring/search', { params: { keyword, page, size } })
    return res.data.data
  },

  getByType: async (monitorType: string, page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<EnvMonitoring>>>(`/env-monitoring/type/${encodeURIComponent(monitorType)}`, { params: { page, size } })
    return res.data.data
  },

  getByStatus: async (status: string, page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<EnvMonitoring>>>(`/env-monitoring/status/${status}`, { params: { page, size } })
    return res.data.data
  },

  getKpi: async () => {
    const res = await axiosInstance.get<ApiResponse<EnvMonitoringKpi>>('/env-monitoring/kpi')
    return res.data.data
  },

  create: async (data: EnvMonitoringRequest) => {
    const res = await axiosInstance.post<ApiResponse<EnvMonitoring>>('/env-monitoring', data)
    return res.data.data
  },

  update: async (id: number, data: EnvMonitoringRequest) => {
    const res = await axiosInstance.put<ApiResponse<EnvMonitoring>>(`/env-monitoring/${id}`, data)
    return res.data.data
  },

  delete: async (id: number) => {
    await axiosInstance.delete(`/env-monitoring/${id}`)
  },
}
