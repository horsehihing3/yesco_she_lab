import axiosInstance from './axiosInstance'
import type { ApiResponse } from '../types/common.types'
import type {
  RadSource, RadWorker, RadDose, RadZone,
  RadMeasurement, RadHealth, RadAccident, RadDrill, RadStats,
} from '../types/radiation.types'

const BASE = '/radiation'

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

export const radSourceApi      = make<RadSource>('sources')
export const radWorkerApi      = make<RadWorker>('workers')
export const radDoseApi        = make<RadDose>('doses')
export const radZoneApi        = make<RadZone>('zones')
export const radMeasurementApi = make<RadMeasurement>('measurements')
export const radHealthApi      = make<RadHealth>('healths')
export const radAccidentApi    = make<RadAccident>('accidents')
export const radDrillApi       = make<RadDrill>('drills')

export const radStatsApi = {
  get: async (): Promise<RadStats> => {
    const r = await axiosInstance.get<ApiResponse<RadStats>>(`${BASE}/stats`)
    return r.data.data
  },
}
