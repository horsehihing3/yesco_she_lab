import axiosInstance from './axiosInstance'
import { ApiResponse } from '../types/common.types'

export interface PartnerSafetyExecution {
  id: number
  planId?: number | null
  name: string
  companyCode: string
  phone?: string | null
  systemCode: string
  systemUid: string
  calledAt: string
  executionToken: string
  signature?: string | null
  checklistTemplateId?: number | null
  checklistData?: string | null
  completed: boolean
  completedAt?: string | null
  createdAt?: string
  modifiedAt?: string
}

export interface PartnerSafetyExecutionCreateRequest {
  planId?: number | null
  name: string
  companyCode: string
  phone?: string | null
  systemCode: string
  systemUid: string
  calledAt?: string
  checklistTemplateId?: number | null
}

export const partnerSafetyExecutionApi = {
  findAll: async (): Promise<PartnerSafetyExecution[]> => {
    const res = await axiosInstance.get<ApiResponse<PartnerSafetyExecution[]>>('/partner-safety-executions')
    return res.data.data
  },
  findCompleted: async (): Promise<PartnerSafetyExecution[]> => {
    const res = await axiosInstance.get<ApiResponse<PartnerSafetyExecution[]>>('/partner-safety-executions/completed')
    return res.data.data
  },
  findByPlanId: async (planId: number): Promise<PartnerSafetyExecution[]> => {
    const res = await axiosInstance.get<ApiResponse<PartnerSafetyExecution[]>>(`/partner-safety-executions/plan/${planId}`)
    return res.data.data
  },
  findById: async (id: number): Promise<PartnerSafetyExecution> => {
    const res = await axiosInstance.get<ApiResponse<PartnerSafetyExecution>>(`/partner-safety-executions/${id}`)
    return res.data.data
  },
  findByToken: async (token: string): Promise<PartnerSafetyExecution> => {
    const res = await axiosInstance.get<ApiResponse<PartnerSafetyExecution>>(`/partner-safety-executions/token/${token}`)
    return res.data.data
  },
  findPreviousByToken: async (token: string): Promise<PartnerSafetyExecution | null> => {
    const res = await axiosInstance.get<ApiResponse<PartnerSafetyExecution | null>>(`/partner-safety-executions/token/${token}/previous`)
    return res.data.data
  },
  create: async (req: PartnerSafetyExecutionCreateRequest): Promise<PartnerSafetyExecution> => {
    const res = await axiosInstance.post<ApiResponse<PartnerSafetyExecution>>('/partner-safety-executions', req)
    return res.data.data
  },
  complete: async (id: number, payload: { signature: string; checklistData?: string }): Promise<PartnerSafetyExecution> => {
    const res = await axiosInstance.patch<ApiResponse<PartnerSafetyExecution>>(
      `/partner-safety-executions/${id}/complete`, payload,
    )
    return res.data.data
  },
}
