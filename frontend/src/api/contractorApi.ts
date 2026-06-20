import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import { ContractorPlan, ContractorPlanRequest, ContractorWorker } from '../types/contractor.types'

export const contractorPlanApi = {
  getAll: async (page = 0, size = 10) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<ContractorPlan>>>('/contractor-plans', { params: { page, size } })
    return res.data.data
  },
  getById: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<ContractorPlan>>(`/contractor-plans/${id}`)
    return res.data.data
  },
  getByStatus: async (status: string, page = 0, size = 50) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<ContractorPlan>>>(`/contractor-plans/status/${status}`, { params: { page, size } })
    return res.data.data
  },
  create: async (data: ContractorPlanRequest) => {
    const res = await axiosInstance.post<ApiResponse<ContractorPlan>>('/contractor-plans', data)
    return res.data.data
  },
  update: async (id: number, data: ContractorPlanRequest) => {
    const res = await axiosInstance.put<ApiResponse<ContractorPlan>>(`/contractor-plans/${id}`, data)
    return res.data.data
  },
  approve: async (id: number) => {
    const res = await axiosInstance.patch<ApiResponse<ContractorPlan>>(`/contractor-plans/${id}/approve`)
    return res.data.data
  },
  transition: async (id: number, action: 'submit' | 'approve' | 'reject' | 'completionSubmit' | 'complete', rejectReason?: string) => {
    const res = await axiosInstance.patch<ApiResponse<ContractorPlan>>(`/contractor-plans/${id}/transition`, { action, rejectReason })
    return res.data.data
  },
  delete: async (id: number) => {
    await axiosInstance.delete(`/contractor-plans/${id}`)
  },
  getWorkers: async (planId: number) => {
    const res = await axiosInstance.get<ApiResponse<ContractorWorker[]>>(`/contractor-plans/${planId}/workers`)
    return res.data.data
  },
  addWorker: async (planId: number, worker: Omit<ContractorWorker, 'id' | 'planId' | 'createdAt'>) => {
    await axiosInstance.post(`/contractor-plans/${planId}/workers`, worker)
  },
  deleteWorkers: async (planId: number) => {
    await axiosInstance.delete(`/contractor-plans/${planId}/workers`)
  },
  acquireEditLock: async (id: number): Promise<{ acquired: boolean; currentEditor: string | null }> => {
    const res = await axiosInstance.post<ApiResponse<{ acquired: boolean; currentEditor: string | null }>>(`/contractor-plans/${id}/edit-lock`)
    return res.data.data
  },
  releaseEditLock: async (id: number) => {
    await axiosInstance.delete(`/contractor-plans/${id}/edit-lock`)
  },
}
