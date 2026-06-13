import axiosInstance from './axiosInstance'
import { ApiResponse } from '../types/common.types'
import { HealthCheckup, HealthCheckupRequest } from '../types/healthCheckup.types'

export const myHealthCheckupApi = {
  list: async (email: string): Promise<HealthCheckup[]> => {
    const res = await axiosInstance.get<ApiResponse<HealthCheckup[]>>('/health-checkup/my', {
      params: { email },
    })
    return res.data.data
  },

  create: async (data: HealthCheckupRequest): Promise<HealthCheckup> => {
    const res = await axiosInstance.post<ApiResponse<HealthCheckup>>('/health-checkup', data)
    return res.data.data
  },

  update: async (id: number, data: HealthCheckupRequest): Promise<HealthCheckup> => {
    const res = await axiosInstance.put<ApiResponse<HealthCheckup>>(`/health-checkup/${id}`, data)
    return res.data.data
  },

  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/health-checkup/${id}`)
  },
}
