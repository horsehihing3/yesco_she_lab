import axiosInstance from './axiosInstance'
import type { ApiResponse } from '../types/common.types'
import type {
  FireFacility, FireInspection, FireIssue, FirePlan,
  DisasterFacility, DisasterInspection,
  FireContact, FireDrill, FireCompliance, FireReport, FireStats,
} from '../types/fireSafety.types'

const BASE = '/fire-safety'

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

export const fireFacilityApi    = make<FireFacility>('facilities')
export const fireInspectionApi  = make<FireInspection>('inspections')
export const fireIssueApi       = make<FireIssue>('issues')
export const firePlanApi        = make<FirePlan>('plans')
export const disasterFacApi     = make<DisasterFacility>('disaster-facilities')
export const disasterInspApi    = make<DisasterInspection>('disaster-inspections')
export const fireContactApi     = make<FireContact>('contacts')
export const fireDrillApi       = make<FireDrill>('drills')
export const fireComplianceApi  = make<FireCompliance>('compliances')
export const fireReportApi      = make<FireReport>('reports')

export const fireStatsApi = {
  get: async (): Promise<FireStats> => {
    const r = await axiosInstance.get<ApiResponse<FireStats>>(`${BASE}/stats`)
    return r.data.data
  },
}
