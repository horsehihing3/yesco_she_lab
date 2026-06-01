import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import { ErgonomicsAssessment, ErgonomicsAssessmentRequest } from '../types/ergonomics.types'

export const ergonomicsApi = {
  getAll: async (page = 0, size = 10) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<ErgonomicsAssessment>>>('/ergonomics', { params: { page, size } })
    return res.data.data
  },
  getById: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<ErgonomicsAssessment>>(`/ergonomics/${id}`)
    return res.data.data
  },
  getByRisk: async (riskLevel: string, page = 0, size = 10) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<ErgonomicsAssessment>>>(`/ergonomics/risk/${riskLevel}`, { params: { page, size } })
    return res.data.data
  },
  search: async (keyword: string, page = 0, size = 10) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<ErgonomicsAssessment>>>('/ergonomics/search', { params: { keyword, page, size } })
    return res.data.data
  },
  create: async (data: ErgonomicsAssessmentRequest) => {
    const res = await axiosInstance.post<ApiResponse<ErgonomicsAssessment>>('/ergonomics', data)
    return res.data.data
  },
  update: async (id: number, data: ErgonomicsAssessmentRequest) => {
    const res = await axiosInstance.put<ApiResponse<ErgonomicsAssessment>>(`/ergonomics/${id}`, data)
    return res.data.data
  },
  delete: async (id: number) => { await axiosInstance.delete(`/ergonomics/${id}`) },
}
