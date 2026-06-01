import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import { ProcessActivityForm, ProcessActivityFormRequest } from '../types/processActivity.types'

const BASE = '/process-activity-forms'

export const processActivityApi = {
  list: async (page = 0, size = 50): Promise<PageResponse<ProcessActivityForm>> => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<ProcessActivityForm>>>(`${BASE}?page=${page}&size=${size}`)
    return res.data.data
  },
  getById: async (id: number): Promise<ProcessActivityForm> => {
    const res = await axiosInstance.get<ApiResponse<ProcessActivityForm>>(`${BASE}/${id}`)
    return res.data.data
  },
  create: async (data: ProcessActivityFormRequest): Promise<ProcessActivityForm> => {
    const res = await axiosInstance.post<ApiResponse<ProcessActivityForm>>(BASE, data)
    return res.data.data
  },
  update: async (id: number, data: ProcessActivityFormRequest): Promise<ProcessActivityForm> => {
    const res = await axiosInstance.put<ApiResponse<ProcessActivityForm>>(`${BASE}/${id}`, data)
    return res.data.data
  },
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE}/${id}`)
  },
}
