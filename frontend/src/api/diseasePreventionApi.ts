import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import { HazardFactor, HazardFactorRequest } from '../types/diseasePrevention.types'

export const diseasePreventionApi = {
  getByType: async (hazardType: string, page = 0, size = 10) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<HazardFactor>>>(`/hazard-factors/type/${hazardType}`, { params: { page, size } })
    return res.data.data
  },

  search: async (hazardType: string, name: string, page = 0, size = 10) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<HazardFactor>>>(`/hazard-factors/type/${hazardType}/search`, { params: { name, page, size } })
    return res.data.data
  },

  getById: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<HazardFactor>>(`/hazard-factors/${id}`)
    return res.data.data
  },

  create: async (data: HazardFactorRequest) => {
    const res = await axiosInstance.post<ApiResponse<HazardFactor>>('/hazard-factors', data)
    return res.data.data
  },

  update: async (id: number, data: HazardFactorRequest) => {
    const res = await axiosInstance.put<ApiResponse<HazardFactor>>(`/hazard-factors/${id}`, data)
    return res.data.data
  },

  delete: async (id: number) => {
    await axiosInstance.delete(`/hazard-factors/${id}`)
  },
}
