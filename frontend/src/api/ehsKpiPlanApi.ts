import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import { EhsKpiPlan, EhsKpiPlanRequest } from '../types/ehsKpi.types'

export const ehsKpiPlanApi = {
  getAll: async (page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<EhsKpiPlan>>>('/ehs-kpi-plan', { params: { page, size } })
    return res.data.data
  },

  search: async (keyword?: string, indicatorType?: string, page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<EhsKpiPlan>>>('/ehs-kpi-plan/search', { params: { keyword, indicatorType, page, size } })
    return res.data.data
  },

  getById: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<EhsKpiPlan>>(`/ehs-kpi-plan/${id}`)
    return res.data.data
  },

  create: async (data: EhsKpiPlanRequest) => {
    const res = await axiosInstance.post<ApiResponse<EhsKpiPlan>>('/ehs-kpi-plan', data)
    return res.data.data
  },

  update: async (id: number, data: EhsKpiPlanRequest) => {
    const res = await axiosInstance.put<ApiResponse<EhsKpiPlan>>(`/ehs-kpi-plan/${id}`, data)
    return res.data.data
  },

  delete: async (id: number) => {
    await axiosInstance.delete(`/ehs-kpi-plan/${id}`)
  },
}
