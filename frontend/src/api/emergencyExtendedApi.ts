import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import {
  EmergencyPlan, EmergencyPlanRequest,
  EmergencyDrill, EmergencyDrillRequest,
  EmergencyResource, EmergencyResourceRequest,
  EmergencyContact, EmergencyContactRequest,
} from '../types/emergencyExtended.types'

export const emergencyPlanApi = {
  getAll: async (page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<EmergencyPlan>>>('/emergency-plan', { params: { page, size } })
    return res.data.data
  },
  getById: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<EmergencyPlan>>(`/emergency-plan/${id}`)
    return res.data.data
  },
  getByType: async (planType: string, page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<EmergencyPlan>>>(`/emergency-plan/type/${planType}`, { params: { page, size } })
    return res.data.data
  },
  create: async (data: EmergencyPlanRequest) => {
    const res = await axiosInstance.post<ApiResponse<EmergencyPlan>>('/emergency-plan', data)
    return res.data.data
  },
  update: async (id: number, data: EmergencyPlanRequest) => {
    const res = await axiosInstance.put<ApiResponse<EmergencyPlan>>(`/emergency-plan/${id}`, data)
    return res.data.data
  },
  delete: async (id: number) => {
    await axiosInstance.delete(`/emergency-plan/${id}`)
  },
  transition: async (id: number, action: 'submit' | 'approve' | 'reject' | 'completionSubmit' | 'complete', rejectReason?: string) => {
    const res = await axiosInstance.patch<ApiResponse<EmergencyPlan>>(`/emergency-plan/${id}/transition`, { action, rejectReason })
    return res.data.data
  },
}

export const emergencyDrillApi = {
  getAll: async (page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<EmergencyDrill>>>('/emergency-drill', { params: { page, size } })
    return res.data.data
  },
  getById: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<EmergencyDrill>>(`/emergency-drill/${id}`)
    return res.data.data
  },
  getByStatus: async (status: string, page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<EmergencyDrill>>>(`/emergency-drill/status/${status}`, { params: { page, size } })
    return res.data.data
  },
  getByType: async (drillType: string, page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<EmergencyDrill>>>(`/emergency-drill/type/${drillType}`, { params: { page, size } })
    return res.data.data
  },
  create: async (data: EmergencyDrillRequest) => {
    const res = await axiosInstance.post<ApiResponse<EmergencyDrill>>('/emergency-drill', data)
    return res.data.data
  },
  update: async (id: number, data: EmergencyDrillRequest) => {
    const res = await axiosInstance.put<ApiResponse<EmergencyDrill>>(`/emergency-drill/${id}`, data)
    return res.data.data
  },
  delete: async (id: number) => {
    await axiosInstance.delete(`/emergency-drill/${id}`)
  },
  getLogs: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<{ id: number; drillId: number; action: string; changedBy: string; detail: string; totalCount: number; passCount: number; failCount: number; naCount: number; createdAt: string }[]>>(`/emergency-drill/${id}/logs`)
    return res.data.data
  },
  getLogItems: async (logId: number) => {
    const res = await axiosInstance.get<ApiResponse<{ id: number; logId: number; categoryName: string; itemNo: number; classification: string; checkItem: string; legalBasis: string; checkResult: string; finding: string; actionDeadline: string; actionComplete: boolean }[]>>(`/emergency-drill/logs/${logId}/items`)
    return res.data.data
  },
}

export const emergencyResourceApi = {
  getAll: async (page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<EmergencyResource>>>('/emergency-resource', { params: { page, size } })
    return res.data.data
  },
  getById: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<EmergencyResource>>(`/emergency-resource/${id}`)
    return res.data.data
  },
  getByType: async (resourceType: string, page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<EmergencyResource>>>(`/emergency-resource/type/${resourceType}`, { params: { page, size } })
    return res.data.data
  },
  create: async (data: EmergencyResourceRequest) => {
    const res = await axiosInstance.post<ApiResponse<EmergencyResource>>('/emergency-resource', data)
    return res.data.data
  },
  update: async (id: number, data: EmergencyResourceRequest) => {
    const res = await axiosInstance.put<ApiResponse<EmergencyResource>>(`/emergency-resource/${id}`, data)
    return res.data.data
  },
  delete: async (id: number) => {
    await axiosInstance.delete(`/emergency-resource/${id}`)
  },
}

export const emergencyContactApi = {
  getAll: async (page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<EmergencyContact>>>('/emergency-contact', { params: { page, size } })
    return res.data.data
  },
  getById: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<EmergencyContact>>(`/emergency-contact/${id}`)
    return res.data.data
  },
  getByType: async (contactType: string, page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<EmergencyContact>>>(`/emergency-contact/type/${contactType}`, { params: { page, size } })
    return res.data.data
  },
  create: async (data: EmergencyContactRequest) => {
    const res = await axiosInstance.post<ApiResponse<EmergencyContact>>('/emergency-contact', data)
    return res.data.data
  },
  update: async (id: number, data: EmergencyContactRequest) => {
    const res = await axiosInstance.put<ApiResponse<EmergencyContact>>(`/emergency-contact/${id}`, data)
    return res.data.data
  },
  delete: async (id: number) => {
    await axiosInstance.delete(`/emergency-contact/${id}`)
  },
}
