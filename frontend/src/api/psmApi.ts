import axiosInstance from './axiosInstance'
import type { ApiResponse, PageResponse } from '../types/common.types'
import type { PsmCategory, PsmData, PsmMoc, PsmHazop, PsmDashboardSummary, PsmWo, PsmIncident, PsmPtw } from '../types/psm.types'

export const psmApi = {
  // ─── PSM Data (6 categories) ───
  listData: async (category?: PsmCategory, page = 0, size = 50): Promise<PageResponse<PsmData>> => {
    const params: Record<string, unknown> = { page, size, sort: 'code,asc' }
    if (category) params.category = category
    const res = await axiosInstance.get<ApiResponse<PageResponse<PsmData>>>('/psm/data', { params })
    return res.data.data
  },
  getData: async (id: number): Promise<PsmData> => {
    const res = await axiosInstance.get<ApiResponse<PsmData>>(`/psm/data/${id}`)
    return res.data.data
  },
  createData: async (data: Partial<PsmData>): Promise<PsmData> => {
    const res = await axiosInstance.post<ApiResponse<PsmData>>('/psm/data', data)
    return res.data.data
  },
  updateData: async (id: number, data: Partial<PsmData>): Promise<PsmData> => {
    const res = await axiosInstance.put<ApiResponse<PsmData>>(`/psm/data/${id}`, data)
    return res.data.data
  },
  deleteData: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/psm/data/${id}`)
  },
  listExpiring: async (): Promise<PsmData[]> => {
    const res = await axiosInstance.get<ApiResponse<PsmData[]>>('/psm/data/expiring')
    return res.data.data || []
  },

  // ─── MOC ───
  listMoc: async (page = 0, size = 50): Promise<PageResponse<PsmMoc>> => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<PsmMoc>>>('/psm/moc', {
      params: { page, size, sort: 'createdAt,desc' },
    })
    return res.data.data
  },
  getMoc: async (id: number): Promise<PsmMoc> => {
    const res = await axiosInstance.get<ApiResponse<PsmMoc>>(`/psm/moc/${id}`)
    return res.data.data
  },
  createMoc: async (data: Partial<PsmMoc>): Promise<PsmMoc> => {
    const res = await axiosInstance.post<ApiResponse<PsmMoc>>('/psm/moc', data)
    return res.data.data
  },
  updateMoc: async (id: number, data: Partial<PsmMoc>): Promise<PsmMoc> => {
    const res = await axiosInstance.put<ApiResponse<PsmMoc>>(`/psm/moc/${id}`, data)
    return res.data.data
  },
  deleteMoc: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/psm/moc/${id}`)
  },

  // ─── HAZOP ───
  listHazop: async (page = 0, size = 50): Promise<PageResponse<PsmHazop>> => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<PsmHazop>>>('/psm/hazop', {
      params: { page, size, sort: 'createdAt,desc' },
    })
    return res.data.data
  },
  getHazop: async (id: number): Promise<PsmHazop> => {
    const res = await axiosInstance.get<ApiResponse<PsmHazop>>(`/psm/hazop/${id}`)
    return res.data.data
  },
  createHazop: async (data: Partial<PsmHazop>): Promise<PsmHazop> => {
    const res = await axiosInstance.post<ApiResponse<PsmHazop>>('/psm/hazop', data)
    return res.data.data
  },
  updateHazop: async (id: number, data: Partial<PsmHazop>): Promise<PsmHazop> => {
    const res = await axiosInstance.put<ApiResponse<PsmHazop>>(`/psm/hazop/${id}`, data)
    return res.data.data
  },
  deleteHazop: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/psm/hazop/${id}`)
  },

  // ─── Work Order ───
  listWo: async (page = 0, size = 50): Promise<PageResponse<PsmWo>> => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<PsmWo>>>('/psm/wo', { params: { page, size, sort: 'createdAt,desc' } })
    return res.data.data
  },
  getWo: async (id: number): Promise<PsmWo> => {
    const res = await axiosInstance.get<ApiResponse<PsmWo>>(`/psm/wo/${id}`)
    return res.data.data
  },
  createWo: async (data: Partial<PsmWo>): Promise<PsmWo> => {
    const res = await axiosInstance.post<ApiResponse<PsmWo>>('/psm/wo', data)
    return res.data.data
  },
  updateWo: async (id: number, data: Partial<PsmWo>): Promise<PsmWo> => {
    const res = await axiosInstance.put<ApiResponse<PsmWo>>(`/psm/wo/${id}`, data)
    return res.data.data
  },
  deleteWo: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/psm/wo/${id}`)
  },

  // ─── Incident ───
  listIncident: async (page = 0, size = 50): Promise<PageResponse<PsmIncident>> => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<PsmIncident>>>('/psm/incident', { params: { page, size, sort: 'createdAt,desc' } })
    return res.data.data
  },
  getIncident: async (id: number): Promise<PsmIncident> => {
    const res = await axiosInstance.get<ApiResponse<PsmIncident>>(`/psm/incident/${id}`)
    return res.data.data
  },
  createIncident: async (data: Partial<PsmIncident>): Promise<PsmIncident> => {
    const res = await axiosInstance.post<ApiResponse<PsmIncident>>('/psm/incident', data)
    return res.data.data
  },
  updateIncident: async (id: number, data: Partial<PsmIncident>): Promise<PsmIncident> => {
    const res = await axiosInstance.put<ApiResponse<PsmIncident>>(`/psm/incident/${id}`, data)
    return res.data.data
  },
  deleteIncident: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/psm/incident/${id}`)
  },

  // ─── PTW ───
  listPtw: async (page = 0, size = 50): Promise<PageResponse<PsmPtw>> => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<PsmPtw>>>('/psm/ptw', { params: { page, size, sort: 'createdAt,desc' } })
    return res.data.data
  },
  getPtw: async (id: number): Promise<PsmPtw> => {
    const res = await axiosInstance.get<ApiResponse<PsmPtw>>(`/psm/ptw/${id}`)
    return res.data.data
  },
  createPtw: async (data: Partial<PsmPtw>): Promise<PsmPtw> => {
    const res = await axiosInstance.post<ApiResponse<PsmPtw>>('/psm/ptw', data)
    return res.data.data
  },
  updatePtw: async (id: number, data: Partial<PsmPtw>): Promise<PsmPtw> => {
    const res = await axiosInstance.put<ApiResponse<PsmPtw>>(`/psm/ptw/${id}`, data)
    return res.data.data
  },
  deletePtw: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/psm/ptw/${id}`)
  },

  // ─── Dashboard ───
  dashboardSummary: async (): Promise<PsmDashboardSummary> => {
    const res = await axiosInstance.get<ApiResponse<PsmDashboardSummary>>('/psm/dashboard/summary')
    return res.data.data
  },
}
