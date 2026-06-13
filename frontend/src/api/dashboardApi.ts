import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import {
  DashboardStatistics,
  EhsPlanResponse,
  EhsAlertResponse,
  EhsMessageResponse,
} from '../types/dashboard.types'
import { EhsPlan } from '../types/ehsPlan.types'

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

  getPagedMessages: async (page: number, size: number): Promise<EhsMessageResponse[]> => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<EhsMessageResponse>>>('/messages', {
      params: { page, size, sort: 'createdAt,desc' },
    })
    return res.data.data.content
  },

  getPagedAlerts: async (page: number, size: number): Promise<EhsAlertResponse[]> => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<EhsAlertResponse>>>('/alerts', {
      params: { page, size, sort: 'createdAt,desc' },
    })
    return res.data.data.content
  },

  getPlansByDateRange: async (startDate: string, endDate: string): Promise<EhsPlan[]> => {
    const res = await axiosInstance.get<ApiResponse<EhsPlan[]>>('/plans/date-range', {
      params: { startDate, endDate },
    })
    return res.data.data
  },

  getTotalElements: async (url: string): Promise<number> => {
    try {
      const res = await axiosInstance.get<ApiResponse<PageResponse<unknown>>>(url, { params: { page: 0, size: 1 } })
      return res.data.data?.totalElements ?? 0
    } catch {
      return 0
    }
  },
}
