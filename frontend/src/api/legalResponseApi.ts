import axiosInstance from './axiosInstance'
import { ApiResponse } from '../types/common.types'
import { LegalSearchResult, LegalRegistry, LegalRevisionLog, LegalKpi } from '../types/legalResponse.types'

const BASE = '/legal-response'

export const legalResponseApi = {
  // 외부 API 검색 (법제처)
  searchExternal: async (query: string, page = 1, display = 20): Promise<LegalSearchResult> => {
    const res = await axiosInstance.get<ApiResponse<LegalSearchResult>>(`${BASE}/external/search`, {
      params: { query, page, display },
    })
    return res.data.data!
  },
  syncRecent: async (display = 30): Promise<any> => {
    const res = await axiosInstance.post<ApiResponse<any>>(`${BASE}/external/sync-recent`, null, {
      params: { display },
    })
    return res.data.data
  },
  // Registry
  listRegistry: async (category?: string, keyword?: string): Promise<LegalRegistry[]> => {
    const res = await axiosInstance.get<ApiResponse<LegalRegistry[]>>(`${BASE}/registry`, {
      params: { category, keyword },
    })
    return res.data.data || []
  },
  getRegistry: async (id: number): Promise<LegalRegistry> => {
    const res = await axiosInstance.get<ApiResponse<LegalRegistry>>(`${BASE}/registry/${id}`)
    return res.data.data!
  },
  createRegistry: async (r: LegalRegistry): Promise<LegalRegistry> => {
    const res = await axiosInstance.post<ApiResponse<LegalRegistry>>(`${BASE}/registry`, r)
    return res.data.data!
  },
  updateRegistry: async (id: number, r: LegalRegistry): Promise<LegalRegistry> => {
    const res = await axiosInstance.put<ApiResponse<LegalRegistry>>(`${BASE}/registry/${id}`, r)
    return res.data.data!
  },
  deleteRegistry: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE}/registry/${id}`)
  },
  // 등록 법령별 미완료 개정 카운트 (lawId -> count)
  registryRevisionCounts: async (): Promise<Record<string, number>> => {
    const res = await axiosInstance.get<ApiResponse<Record<string, number>>>(`${BASE}/registry/revision-counts`)
    return res.data.data || {}
  },
  // 일괄 개정 확인 (법제처 API 호출)
  checkRegistryRevisions: async (): Promise<{ checked: number; inserted: number; changes: any[] }> => {
    const res = await axiosInstance.post<ApiResponse<any>>(`${BASE}/registry/check-revisions`)
    return res.data.data
  },
  // Revisions
  listRevisions: async (status?: string, keyword?: string): Promise<LegalRevisionLog[]> => {
    const res = await axiosInstance.get<ApiResponse<LegalRevisionLog[]>>(`${BASE}/revisions`, {
      params: { status, keyword },
    })
    return res.data.data || []
  },
  updateRevision: async (id: number, r: LegalRevisionLog): Promise<LegalRevisionLog> => {
    const res = await axiosInstance.put<ApiResponse<LegalRevisionLog>>(`${BASE}/revisions/${id}`, r)
    return res.data.data!
  },
  deleteRevision: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE}/revisions/${id}`)
  },
  // KPI
  getKpi: async (): Promise<LegalKpi> => {
    const res = await axiosInstance.get<ApiResponse<LegalKpi>>(`${BASE}/kpi`)
    return res.data.data!
  },
}
