import axiosInstance from './axiosInstance'
import type { ApiResponse } from '../types/common.types'
import type {
  DpMsd, DpCvd, DpStress, DpRespi, DpHearing, DpThermal, DpInfect,
  DiseasePreventionMgmtStats,
} from '../types/diseasePreventionMgmt.types'

const BASE = '/disease-prevention-mgmt'

const make = <T,>(path: string) => ({
  list: async (): Promise<T[]> => {
    const r = await axiosInstance.get<ApiResponse<T[]>>(`${BASE}/${path}`)
    return r.data.data || []
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

export const dpMsdApi     = make<DpMsd>('msd')
export const dpCvdApi     = make<DpCvd>('cvd')
export const dpStressApi  = make<DpStress>('stress')
export const dpRespiApi   = make<DpRespi>('respi')
export const dpHearingApi = make<DpHearing>('hearing')
export const dpThermalApi = make<DpThermal>('thermal')
export const dpInfectApi  = make<DpInfect>('infect')

export const dpMgmtStatsApi = {
  get: async (): Promise<DiseasePreventionMgmtStats> => {
    const r = await axiosInstance.get<ApiResponse<DiseasePreventionMgmtStats>>(`${BASE}/stats`)
    return r.data.data
  },
}
