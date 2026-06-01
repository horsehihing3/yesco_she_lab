import axiosInstance from './axiosInstance'
import { ApiResponse } from '../types/common.types'
import {
  DashboardStatistics,
  EhsPlanResponse,
  EhsAlertResponse,
  EhsMessageResponse,
} from '../types/dashboard.types'

export const dashboardApi = {
  getStatistics: async (): Promise<DashboardStatistics> => {
    const response = await axiosInstance.get<ApiResponse<DashboardStatistics>>('/dashboard/statistics')
    return response.data.data
  },

  getMonthlyPlans: async (year?: number, month?: number): Promise<EhsPlanResponse[]> => {
    const params = new URLSearchParams()
    if (year) params.append('year', year.toString())
    if (month) params.append('month', month.toString())
    const response = await axiosInstance.get<ApiResponse<EhsPlanResponse[]>>(
      `/dashboard/plans/monthly${params.toString() ? `?${params.toString()}` : ''}`
    )
    return response.data.data
  },

  getRecentAlerts: async (limit: number = 5): Promise<EhsAlertResponse[]> => {
    const response = await axiosInstance.get<ApiResponse<EhsAlertResponse[]>>(
      `/dashboard/alerts/recent?limit=${limit}`
    )
    return response.data.data
  },

  getRecentMessages: async (limit: number = 5): Promise<EhsMessageResponse[]> => {
    const response = await axiosInstance.get<ApiResponse<EhsMessageResponse[]>>(
      `/dashboard/messages/recent?limit=${limit}`
    )
    return response.data.data
  },
}
