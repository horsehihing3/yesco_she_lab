import axiosInstance from './axiosInstance'
import type { ApiResponse } from '../types/common.types'
import type {
  LegalLaw, LegalLawRequest, LegalLawStats,
  LegalPermit, LegalPermitRequest, LegalPermitStats,
  LegalObligation, LegalObligationRequest, LegalObligationStats,
  LegalImprovement, LegalImprovementRequest, LegalImprovementStats,
} from '../types/legalCompliance.types'

// ===== Law =====
export const lawApi = {
  list: async (): Promise<LegalLaw[]> => {
    const res = await axiosInstance.get<ApiResponse<LegalLaw[]>>('/legal/laws')
    return res.data.data
  },
  stats: async (): Promise<LegalLawStats> => {
    const res = await axiosInstance.get<ApiResponse<LegalLawStats>>('/legal/laws/stats')
    return res.data.data
  },
  create: async (req: LegalLawRequest): Promise<LegalLaw> => {
    const res = await axiosInstance.post<ApiResponse<LegalLaw>>('/legal/laws', req)
    return res.data.data
  },
  update: async (id: number, req: LegalLawRequest): Promise<LegalLaw> => {
    const res = await axiosInstance.put<ApiResponse<LegalLaw>>(`/legal/laws/${id}`, req)
    return res.data.data
  },
  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/legal/laws/${id}`)
  },
}

// ===== Permit =====
export const permitApi = {
  list: async (): Promise<LegalPermit[]> => {
    const res = await axiosInstance.get<ApiResponse<LegalPermit[]>>('/legal/permits')
    return res.data.data
  },
  stats: async (): Promise<LegalPermitStats> => {
    const res = await axiosInstance.get<ApiResponse<LegalPermitStats>>('/legal/permits/stats')
    return res.data.data
  },
  create: async (req: LegalPermitRequest): Promise<LegalPermit> => {
    const res = await axiosInstance.post<ApiResponse<LegalPermit>>('/legal/permits', req)
    return res.data.data
  },
  update: async (id: number, req: LegalPermitRequest): Promise<LegalPermit> => {
    const res = await axiosInstance.put<ApiResponse<LegalPermit>>(`/legal/permits/${id}`, req)
    return res.data.data
  },
  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/legal/permits/${id}`)
  },
}

// ===== Obligation =====
export const obligationApi = {
  list: async (): Promise<LegalObligation[]> => {
    const res = await axiosInstance.get<ApiResponse<LegalObligation[]>>('/legal/obligations')
    return res.data.data
  },
  stats: async (): Promise<LegalObligationStats> => {
    const res = await axiosInstance.get<ApiResponse<LegalObligationStats>>('/legal/obligations/stats')
    return res.data.data
  },
  create: async (req: LegalObligationRequest): Promise<LegalObligation> => {
    const res = await axiosInstance.post<ApiResponse<LegalObligation>>('/legal/obligations', req)
    return res.data.data
  },
  update: async (id: number, req: LegalObligationRequest): Promise<LegalObligation> => {
    const res = await axiosInstance.put<ApiResponse<LegalObligation>>(`/legal/obligations/${id}`, req)
    return res.data.data
  },
  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/legal/obligations/${id}`)
  },
}

// ===== Improvement =====
export const improvementApi = {
  list: async (): Promise<LegalImprovement[]> => {
    const res = await axiosInstance.get<ApiResponse<LegalImprovement[]>>('/legal/improvements')
    return res.data.data
  },
  stats: async (): Promise<LegalImprovementStats> => {
    const res = await axiosInstance.get<ApiResponse<LegalImprovementStats>>('/legal/improvements/stats')
    return res.data.data
  },
  create: async (req: LegalImprovementRequest): Promise<LegalImprovement> => {
    const res = await axiosInstance.post<ApiResponse<LegalImprovement>>('/legal/improvements', req)
    return res.data.data
  },
  update: async (id: number, req: LegalImprovementRequest): Promise<LegalImprovement> => {
    const res = await axiosInstance.put<ApiResponse<LegalImprovement>>(`/legal/improvements/${id}`, req)
    return res.data.data
  },
  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/legal/improvements/${id}`)
  },
}
