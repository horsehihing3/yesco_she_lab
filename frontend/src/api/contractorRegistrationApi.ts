import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import { ContractorRegistration, ContractorRegistrationRequest } from '../types/contractorRegistration.types'

export const contractorRegistrationApi = {
  search: async (params: { keyword?: string; regStatus?: string; page?: number; size?: number } = {}) => {
    const { keyword = '', regStatus = '', page = 0, size = 20 } = params
    const res = await axiosInstance.get<ApiResponse<PageResponse<ContractorRegistration>>>(
      '/contractor-registrations',
      { params: { keyword, regStatus, page, size } }
    )
    return res.data.data
  },

  getById: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<ContractorRegistration>>(`/contractor-registrations/${id}`)
    return res.data.data
  },

  create: async (data: ContractorRegistrationRequest) => {
    const res = await axiosInstance.post<ApiResponse<ContractorRegistration>>('/contractor-registrations', data)
    return res.data.data
  },

  update: async (id: number, data: ContractorRegistrationRequest) => {
    const res = await axiosInstance.put<ApiResponse<ContractorRegistration>>(`/contractor-registrations/${id}`, data)
    return res.data.data
  },

  updateStatus: async (id: number, regStatus: string) => {
    const res = await axiosInstance.patch<ApiResponse<ContractorRegistration>>(
      `/contractor-registrations/${id}/status`,
      { regStatus }
    )
    return res.data.data
  },

  delete: async (id: number) => {
    await axiosInstance.delete<ApiResponse<void>>(`/contractor-registrations/${id}`)
  },
}
