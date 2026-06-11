import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import { SafetyAccidentForm, SafetyAccidentFormRequest } from '../types/safetyAccident.types'

const BASE = '/safety-accident-forms'

export const safetyAccidentApi = {
  list: async (page = 0, size = 50): Promise<PageResponse<SafetyAccidentForm>> => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<SafetyAccidentForm>>>(`${BASE}?page=${page}&size=${size}`)
    return res.data.data
  },
  getById: async (id: number): Promise<SafetyAccidentForm> => {
    const res = await axiosInstance.get<ApiResponse<SafetyAccidentForm>>(`${BASE}/${id}`)
    return res.data.data
  },
  create: async (data: SafetyAccidentFormRequest): Promise<SafetyAccidentForm> => {
    const res = await axiosInstance.post<ApiResponse<SafetyAccidentForm>>(BASE, data)
    return res.data.data
  },
  update: async (id: number, data: SafetyAccidentFormRequest): Promise<SafetyAccidentForm> => {
    const res = await axiosInstance.put<ApiResponse<SafetyAccidentForm>>(`${BASE}/${id}`, data)
    return res.data.data
  },
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE}/${id}`)
  },
}
