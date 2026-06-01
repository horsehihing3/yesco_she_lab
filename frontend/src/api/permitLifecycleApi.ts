import axiosInstance from './axiosInstance'
import type { ApiResponse } from '../types/common.types'
import type {
  PermitIdentification, PermitRegistry, PermitRenewal, PermitChange,
  PermitInspection, PermitReporting, PermitDocument, PermitLifecycleStats,
} from '../types/permitLifecycle.types'

const BASE = '/permit-lifecycle'

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

export const permitIdentApi      = make<PermitIdentification>('identifications')
export const permitRegistryApi   = make<PermitRegistry>('registries')
export const permitRenewalApi    = make<PermitRenewal>('renewals')
export const permitChangeApi     = make<PermitChange>('changes')
export const permitInspectionApi = make<PermitInspection>('inspections')
export const permitReportingApi  = make<PermitReporting>('reportings')
export const permitDocumentApi   = make<PermitDocument>('documents')

export const permitLifecycleStatsApi = {
  get: async (): Promise<PermitLifecycleStats> => {
    const r = await axiosInstance.get<ApiResponse<PermitLifecycleStats>>(`${BASE}/stats`)
    return r.data.data
  },
}
