import axiosInstance from './axiosInstance'
import type { ApiResponse } from '../types/common.types'
import type {
  OdPlan, OdWorker, OdOrg, OdExposure, OdAftercare, OdFitness, OdStats,
} from '../types/occupationalDisease.types'

const BASE = '/occupational-disease'

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

export const planApi      = make<OdPlan>('plans')
export const workerApi    = make<OdWorker>('workers')
export const odOrgApi     = make<OdOrg>('orgs')
export const exposureApi  = make<OdExposure>('exposures')
export const aftercareApi = make<OdAftercare>('aftercare')
export const fitnessApi   = make<OdFitness>('fitness')

export const odStatsApi = {
  get: async (): Promise<OdStats> => {
    const r = await axiosInstance.get<ApiResponse<OdStats>>(`${BASE}/stats`)
    return r.data.data
  },
}
