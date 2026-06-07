import axiosInstance from './axiosInstance'
import type { ApiResponse } from '../types/common.types'
import type { WorkplaceSite, WorkplaceSiteRequest } from '../types/workplaceSite.types'

const BASE = '/workplace-sites'

export const workplaceSiteApi = {
  list: async (): Promise<WorkplaceSite[]> => {
    const { data } = await axiosInstance.get<ApiResponse<WorkplaceSite[]>>(BASE)
    return data.data
  },
  detail: async (id: number): Promise<WorkplaceSite> => {
    const { data } = await axiosInstance.get<ApiResponse<WorkplaceSite>>(`${BASE}/${id}`)
    return data.data
  },
  create: async (req: WorkplaceSiteRequest): Promise<WorkplaceSite> => {
    const { data } = await axiosInstance.post<ApiResponse<WorkplaceSite>>(BASE, req)
    return data.data
  },
  update: async (id: number, req: WorkplaceSiteRequest): Promise<WorkplaceSite> => {
    const { data } = await axiosInstance.put<ApiResponse<WorkplaceSite>>(`${BASE}/${id}`, req)
    return data.data
  },
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE}/${id}`)
  },
}
