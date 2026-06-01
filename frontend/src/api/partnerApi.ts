import axiosInstance from './axiosInstance'
import type { ApiResponse } from '../types/common.types'
import type {
  PartnerEval, PartnerVisitor, PartnerStats,
} from '../types/partner.types'

const BASE = '/partner'

const make = <T,>(path: string) => ({
  list: async (): Promise<T[]> => {
    const r = await axiosInstance.get<ApiResponse<T[]>>(`${BASE}/${path}`)
    return r.data.data
  },
  create: async (e: Partial<T>): Promise<T> => {
    const r = await axiosInstance.post<ApiResponse<T>>(`${BASE}/${path}`, e)
    return r.data.data
  },
  update: async (id: number, e: Partial<T>): Promise<T> => {
    const r = await axiosInstance.put<ApiResponse<T>>(`${BASE}/${path}/${id}`, e)
    return r.data.data
  },
  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE}/${path}/${id}`)
  },
})

export const partnerEvalApi    = make<PartnerEval>('evals')
export const partnerVisitorApi = make<PartnerVisitor>('visitors')

export const partnerStatsApi = {
  get: async (): Promise<PartnerStats> => {
    const r = await axiosInstance.get<ApiResponse<PartnerStats>>(`${BASE}/stats`)
    return r.data.data
  },
}
