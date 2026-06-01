import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import { PermitToWork, PermitToWorkRequest, PermitWorker } from '../types/permitToWork.types'

export const permitToWorkApi = {
  getAll: async (page = 0, size = 10) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<PermitToWork>>>('/permit-to-work', { params: { page, size } })
    return res.data.data
  },

  getById: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<PermitToWork>>(`/permit-to-work/${id}`)
    return res.data.data
  },

  getByStatus: async (status: string, page = 0, size = 10) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<PermitToWork>>>(`/permit-to-work/status/${status}`, { params: { page, size } })
    return res.data.data
  },

  getByType: async (permitType: string, page = 0, size = 10) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<PermitToWork>>>(`/permit-to-work/type/${permitType}`, { params: { page, size } })
    return res.data.data
  },

  getByRequester: async (requesterId: string, page = 0, size = 10) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<PermitToWork>>>(`/permit-to-work/requester/${requesterId}`, { params: { page, size } })
    return res.data.data
  },

  search: async (title: string, page = 0, size = 10) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<PermitToWork>>>('/permit-to-work/search', { params: { title, page, size } })
    return res.data.data
  },

  create: async (data: PermitToWorkRequest) => {
    const res = await axiosInstance.post<ApiResponse<PermitToWork>>('/permit-to-work', data)
    return res.data.data
  },

  update: async (id: number, data: PermitToWorkRequest) => {
    const res = await axiosInstance.put<ApiResponse<PermitToWork>>(`/permit-to-work/${id}`, data)
    return res.data.data
  },

  updateStatus: async (id: number, status: string) => {
    const res = await axiosInstance.patch<ApiResponse<PermitToWork>>(`/permit-to-work/${id}/status`, null, { params: { status } })
    return res.data.data
  },

  /**
   * 결재 흐름 전이.
   * action: submit | approve | reject | completionSubmit | complete
   */
  transition: async (
    id: number,
    action: 'submit' | 'approve' | 'reject' | 'completionSubmit' | 'complete',
    rejectReason?: string,
  ) => {
    const res = await axiosInstance.patch<ApiResponse<PermitToWork>>(
      `/permit-to-work/${id}/transition`,
      { action, rejectReason }
    )
    return res.data.data
  },

  delete: async (id: number) => {
    await axiosInstance.delete(`/permit-to-work/${id}`)
  },

  getExternal: async (page = 0, size = 10) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<PermitToWork>>>('/permit-to-work/external', { params: { page, size } })
    return res.data.data
  },

  getWorkers: async (permitId: number) => {
    const res = await axiosInstance.get<ApiResponse<PermitWorker[]>>(`/permit-to-work/${permitId}/workers`)
    return res.data.data
  },

  addWorker: async (permitId: number, worker: Omit<PermitWorker, 'id' | 'permitId' | 'createdAt'>) => {
    await axiosInstance.post(`/permit-to-work/${permitId}/workers`, worker)
  },

  deleteWorkers: async (permitId: number) => {
    await axiosInstance.delete(`/permit-to-work/${permitId}/workers`)
  },
}
