import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import { PpeEquipment, PpeEquipmentRequest, PpeKpiStats, PpeHistory, PpeHistoryRequest, PpeRequestItem, PpeRequestCreate } from '../types/ppeEquipment.types'

export const ppeEquipmentApi = {
  getAll: async (page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<PpeEquipment>>>('/ppe-equipment', { params: { page, size } })
    return res.data.data
  },

  getById: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<PpeEquipment>>(`/ppe-equipment/${id}`)
    return res.data.data
  },

  getByCategory: async (category: string, page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<PpeEquipment>>>(`/ppe-equipment/category/${encodeURIComponent(category)}`, { params: { page, size } })
    return res.data.data
  },

  search: async (name: string, page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<PpeEquipment>>>('/ppe-equipment/search', { params: { name, page, size } })
    return res.data.data
  },

  getByStatus: async (status: string, page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<PpeEquipment>>>(`/ppe-equipment/status/${status}`, { params: { page, size } })
    return res.data.data
  },

  getKpi: async () => {
    const res = await axiosInstance.get<ApiResponse<PpeKpiStats>>('/ppe-equipment/kpi')
    return res.data.data
  },

  create: async (data: PpeEquipmentRequest) => {
    const res = await axiosInstance.post<ApiResponse<PpeEquipment>>('/ppe-equipment', data)
    return res.data.data
  },

  update: async (id: number, data: PpeEquipmentRequest) => {
    const res = await axiosInstance.put<ApiResponse<PpeEquipment>>(`/ppe-equipment/${id}`, data)
    return res.data.data
  },

  delete: async (id: number) => {
    await axiosInstance.delete(`/ppe-equipment/${id}`)
  },
}

export const ppeHistoryApi = {
  getAll: async (page = 0, size = 10) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<PpeHistory>>>('/ppe-history', { params: { page, size } })
    return res.data.data
  },

  create: async (data: PpeHistoryRequest) => {
    const res = await axiosInstance.post<ApiResponse<PpeHistory>>('/ppe-history', data)
    return res.data.data
  },

  delete: async (id: number) => {
    await axiosInstance.delete(`/ppe-history/${id}`)
  },
}

export const ppeRequestApi = {
  getAll: async (page = 0, size = 10) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<PpeRequestItem>>>('/ppe-request', { params: { page, size } })
    return res.data.data
  },
  getByStatus: async (status: string, page = 0, size = 10) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<PpeRequestItem>>>(`/ppe-request/status/${status}`, { params: { page, size } })
    return res.data.data
  },
  getById: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<PpeRequestItem>>(`/ppe-request/${id}`)
    return res.data.data
  },
  create: async (data: PpeRequestCreate) => {
    const res = await axiosInstance.post<ApiResponse<PpeRequestItem>>('/ppe-request', data)
    return res.data.data
  },
  approve: async (id: number, approverName: string, approverDept: string) => {
    const res = await axiosInstance.patch<ApiResponse<PpeRequestItem>>(`/ppe-request/${id}/approve`, null, { params: { approverName, approverDept } })
    return res.data.data
  },
  reject: async (id: number, approverName: string, approverDept: string, rejectionReason?: string) => {
    const res = await axiosInstance.patch<ApiResponse<PpeRequestItem>>(`/ppe-request/${id}/reject`, null, { params: { approverName, approverDept, rejectionReason } })
    return res.data.data
  },
  issue: async (id: number) => {
    const res = await axiosInstance.patch<ApiResponse<PpeRequestItem>>(`/ppe-request/${id}/issue`)
    return res.data.data
  },
  returnItem: async (id: number) => {
    const res = await axiosInstance.patch<ApiResponse<PpeRequestItem>>(`/ppe-request/${id}/return`)
    return res.data.data
  },
  cancel: async (id: number) => {
    const res = await axiosInstance.patch<ApiResponse<PpeRequestItem>>(`/ppe-request/${id}/cancel`)
    return res.data.data
  },
  delete: async (id: number) => {
    await axiosInstance.delete(`/ppe-request/${id}`)
  },
}
