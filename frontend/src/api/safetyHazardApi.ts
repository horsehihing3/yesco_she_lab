import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import { SafetyHazardForm, SafetyHazardFormRequest } from '../types/safetyHazard.types'

const BASE = '/safety-hazard-forms'

export const safetyHazardApi = {
  list: async (page = 0, size = 50): Promise<PageResponse<SafetyHazardForm>> => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<SafetyHazardForm>>>(`${BASE}?page=${page}&size=${size}`)
    return res.data.data
  },
  getById: async (id: number): Promise<SafetyHazardForm> => {
    const res = await axiosInstance.get<ApiResponse<SafetyHazardForm>>(`${BASE}/${id}`)
    return res.data.data
  },
  create: async (data: SafetyHazardFormRequest): Promise<SafetyHazardForm> => {
    const res = await axiosInstance.post<ApiResponse<SafetyHazardForm>>(BASE, data)
    return res.data.data
  },
  update: async (id: number, data: SafetyHazardFormRequest): Promise<SafetyHazardForm> => {
    const res = await axiosInstance.put<ApiResponse<SafetyHazardForm>>(`${BASE}/${id}`, data)
    return res.data.data
  },
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE}/${id}`)
  },
}
