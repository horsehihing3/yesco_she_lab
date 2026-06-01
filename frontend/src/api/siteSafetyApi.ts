import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import {
  SiteSafetyPlan, SiteSafetyPlanRequest, SiteSafetyWorker,
} from '../types/siteSafety.types'

export const siteSafetyPlanApi = {
  getAll: async (page = 0, size = 10, planType?: string) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<SiteSafetyPlan>>>('/site-safety-plans', { params: { page, size, planType } })
    return res.data.data
  },
  getById: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<SiteSafetyPlan>>(`/site-safety-plans/${id}`)
    return res.data.data
  },
  getByStatus: async (status: string, page = 0, size = 50, planType?: string) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<SiteSafetyPlan>>>(`/site-safety-plans/status/${status}`, { params: { page, size, planType } })
    return res.data.data
  },
  create: async (data: SiteSafetyPlanRequest) => {
    const res = await axiosInstance.post<ApiResponse<SiteSafetyPlan>>('/site-safety-plans', data)
    return res.data.data
  },
  update: async (id: number, data: SiteSafetyPlanRequest) => {
    const res = await axiosInstance.put<ApiResponse<SiteSafetyPlan>>(`/site-safety-plans/${id}`, data)
    return res.data.data
  },
  transition: async (id: number, action: 'submit' | 'approve' | 'reject' | 'completionSubmit' | 'complete', rejectReason?: string) => {
    const res = await axiosInstance.patch<ApiResponse<SiteSafetyPlan>>(`/site-safety-plans/${id}/transition`, { action, rejectReason })
    return res.data.data
  },
  delete: async (id: number) => {
    await axiosInstance.delete(`/site-safety-plans/${id}`)
  },
  getWorkers: async (planId: number) => {
    const res = await axiosInstance.get<ApiResponse<SiteSafetyWorker[]>>(`/site-safety-plans/${planId}/workers`)
    return res.data.data
  },
  addWorker: async (planId: number, worker: Omit<SiteSafetyWorker, 'id' | 'planId' | 'createdAt'>) => {
    await axiosInstance.post(`/site-safety-plans/${planId}/workers`, worker)
  },
  deleteWorkers: async (planId: number) => {
    await axiosInstance.delete(`/site-safety-plans/${planId}/workers`)
  },
  acquireEditLock: async (id: number): Promise<{ acquired: boolean; currentEditor: string | null }> => {
    const res = await axiosInstance.post<ApiResponse<{ acquired: boolean; currentEditor: string | null }>>(`/site-safety-plans/${id}/edit-lock`)
    return res.data.data
  },
  releaseEditLock: async (id: number) => {
    await axiosInstance.delete(`/site-safety-plans/${id}/edit-lock`)
  },
}
