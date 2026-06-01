import axiosInstance from './axiosInstance'
import type { ApiResponse } from '../types/common.types'
import type { IncidentResponse, IncidentResponseStats } from '../types/incidentResponse.types'

const BASE = '/incident-response'

export const incidentResponseApi = {
  list: async (): Promise<IncidentResponse[]> => {
    const r = await axiosInstance.get<ApiResponse<IncidentResponse[]>>(BASE)
    return r.data.data || []
  },
  get: async (id: number): Promise<IncidentResponse> => {
    const r = await axiosInstance.get<ApiResponse<IncidentResponse>>(`${BASE}/${id}`)
    return r.data.data
  },
  create: async (e: Partial<IncidentResponse>): Promise<IncidentResponse> => {
    const r = await axiosInstance.post<ApiResponse<IncidentResponse>>(BASE, e)
    return r.data.data
  },
  update: async (id: number, e: Partial<IncidentResponse>): Promise<IncidentResponse> => {
    const r = await axiosInstance.put<ApiResponse<IncidentResponse>>(`${BASE}/${id}`, e)
    return r.data.data
  },
  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE}/${id}`)
  },
  stats: async (): Promise<IncidentResponseStats> => {
    const r = await axiosInstance.get<ApiResponse<IncidentResponseStats>>(`${BASE}/stats`)
    return r.data.data
  },
}
