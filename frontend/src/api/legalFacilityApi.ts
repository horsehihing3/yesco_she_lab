import axiosInstance from './axiosInstance'
import type { ApiResponse } from '../types/common.types'
import type {
  FacilityEquipment, FacilityEquipmentStats,
  FacilityInspection, FacilityInspectionStats,
  FacilityWatch, FacilityWatchStats,
  FacilityWatchCheck,
} from '../types/legalFacility.types'

// ===== Equipment =====
export const equipmentApi = {
  list: async (): Promise<FacilityEquipment[]> => {
    const r = await axiosInstance.get<ApiResponse<FacilityEquipment[]>>('/legal-facility/equipments')
    return r.data.data
  },
  stats: async (): Promise<FacilityEquipmentStats> => {
    const r = await axiosInstance.get<ApiResponse<FacilityEquipmentStats>>('/legal-facility/equipments/stats')
    return r.data.data
  },
  create: async (e: Partial<FacilityEquipment>): Promise<FacilityEquipment> => {
    const r = await axiosInstance.post<ApiResponse<FacilityEquipment>>('/legal-facility/equipments', e)
    return r.data.data
  },
  update: async (id: number, e: Partial<FacilityEquipment>): Promise<FacilityEquipment> => {
    const r = await axiosInstance.put<ApiResponse<FacilityEquipment>>(`/legal-facility/equipments/${id}`, e)
    return r.data.data
  },
  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/legal-facility/equipments/${id}`)
  },
}

// ===== Inspection =====
export const inspectionApi = {
  list: async (): Promise<FacilityInspection[]> => {
    const r = await axiosInstance.get<ApiResponse<FacilityInspection[]>>('/legal-facility/inspections')
    return r.data.data
  },
  stats: async (): Promise<FacilityInspectionStats> => {
    const r = await axiosInstance.get<ApiResponse<FacilityInspectionStats>>('/legal-facility/inspections/stats')
    return r.data.data
  },
  create: async (e: Partial<FacilityInspection>): Promise<FacilityInspection> => {
    const r = await axiosInstance.post<ApiResponse<FacilityInspection>>('/legal-facility/inspections', e)
    return r.data.data
  },
  update: async (id: number, e: Partial<FacilityInspection>): Promise<FacilityInspection> => {
    const r = await axiosInstance.put<ApiResponse<FacilityInspection>>(`/legal-facility/inspections/${id}`, e)
    return r.data.data
  },
  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/legal-facility/inspections/${id}`)
  },
}

// ===== Watch =====
export const watchApi = {
  list: async (): Promise<FacilityWatch[]> => {
    const r = await axiosInstance.get<ApiResponse<FacilityWatch[]>>('/legal-facility/watches')
    return r.data.data
  },
  stats: async (): Promise<FacilityWatchStats> => {
    const r = await axiosInstance.get<ApiResponse<FacilityWatchStats>>('/legal-facility/watches/stats')
    return r.data.data
  },
  create: async (e: Partial<FacilityWatch>): Promise<FacilityWatch> => {
    const r = await axiosInstance.post<ApiResponse<FacilityWatch>>('/legal-facility/watches', e)
    return r.data.data
  },
  update: async (id: number, e: Partial<FacilityWatch>): Promise<FacilityWatch> => {
    const r = await axiosInstance.put<ApiResponse<FacilityWatch>>(`/legal-facility/watches/${id}`, e)
    return r.data.data
  },
  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/legal-facility/watches/${id}`)
  },
}

// ===== Watch Check =====
export const watchCheckApi = {
  list: async (): Promise<FacilityWatchCheck[]> => {
    const r = await axiosInstance.get<ApiResponse<FacilityWatchCheck[]>>('/legal-facility/watch-checks')
    return r.data.data
  },
  create: async (e: Partial<FacilityWatchCheck>): Promise<FacilityWatchCheck> => {
    const r = await axiosInstance.post<ApiResponse<FacilityWatchCheck>>('/legal-facility/watch-checks', e)
    return r.data.data
  },
  update: async (id: number, e: Partial<FacilityWatchCheck>): Promise<FacilityWatchCheck> => {
    const r = await axiosInstance.put<ApiResponse<FacilityWatchCheck>>(`/legal-facility/watch-checks/${id}`, e)
    return r.data.data
  },
  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/legal-facility/watch-checks/${id}`)
  },
}
