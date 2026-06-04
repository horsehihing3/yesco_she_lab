import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import {
  RiskAssessment,
  RiskActivityProcess,
  RiskAssessmentDetail,
  RiskRegister,
  RiskAssessmentRequest,
  RiskActivityProcessRequest,
  RiskAssessmentDetailRequest,
  RiskAssessmentFormMaster,
  RiskAssessmentFormRequest,
  RiskAssessmentLogEntry,
} from '../types/riskAssessment.types'

export const riskAssessmentApi = {
  // ==================== Risk Assessment ====================

  getAll: async (params?: {
    site?: string
    status?: string
    page?: number
    size?: number
    officeOnly?: boolean
  }): Promise<PageResponse<RiskAssessment>> => {
    const searchParams = new URLSearchParams()
    if (params?.site) searchParams.append('site', params.site)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.page !== undefined) searchParams.append('page', params.page.toString())
    if (params?.size !== undefined) searchParams.append('size', params.size.toString())
    if (params?.officeOnly) searchParams.append('officeOnly', 'true')

    const response = await axiosInstance.get<ApiResponse<PageResponse<RiskAssessment>>>(
      `/risk-assessments${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    )
    return response.data.data
  },

  getById: async (id: number): Promise<RiskAssessment> => {
    const response = await axiosInstance.get<ApiResponse<RiskAssessment>>(`/risk-assessments/${id}`)
    return response.data.data
  },

  getByRiskId: async (riskId: string): Promise<RiskAssessment> => {
    const response = await axiosInstance.get<ApiResponse<RiskAssessment>>(
      `/risk-assessments/risk-id/${riskId}`
    )
    return response.data.data
  },

  create: async (data: RiskAssessmentRequest): Promise<RiskAssessment> => {
    const response = await axiosInstance.post<ApiResponse<RiskAssessment>>('/risk-assessments', data)
    return response.data.data
  },

  update: async (id: number, data: RiskAssessmentRequest): Promise<RiskAssessment> => {
    const response = await axiosInstance.put<ApiResponse<RiskAssessment>>(
      `/risk-assessments/${id}`,
      data
    )
    return response.data.data
  },

  updateStatus: async (
    id: number,
    status: string,
    rejectReason?: string,
    allowResubmit?: boolean
  ): Promise<RiskAssessment> => {
    const response = await axiosInstance.patch<ApiResponse<RiskAssessment>>(
      `/risk-assessments/${id}/status`,
      { status, rejectReason, allowResubmit }
    )
    return response.data.data
  },

  /**
   * 결재 흐름 전이.
   * action: submit | approve | reject | completionSubmit | complete
   */
  transition: async (
    id: number,
    action: 'submit' | 'approve' | 'reject' | 'completionSubmit' | 'complete',
    rejectReason?: string,
  ): Promise<RiskAssessment> => {
    const response = await axiosInstance.patch<ApiResponse<RiskAssessment>>(
      `/risk-assessments/${id}/transition`,
      { action, rejectReason }
    )
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/risk-assessments/${id}`)
  },

  getLogs: async (id: number): Promise<RiskAssessmentLogEntry[]> => {
    const response = await axiosInstance.get<ApiResponse<RiskAssessmentLogEntry[]>>(
      `/risk-assessments/${id}/logs`
    )
    return response.data.data
  },

  // ==================== Activity Process (Step 1) ====================

  getActivityProcesses: async (riskId: string): Promise<RiskActivityProcess[]> => {
    const response = await axiosInstance.get<ApiResponse<RiskActivityProcess[]>>(
      `/risk-assessments/${riskId}/activity-processes`
    )
    return response.data.data
  },

  createActivityProcess: async (
    riskId: string,
    data: RiskActivityProcessRequest
  ): Promise<RiskActivityProcess> => {
    const response = await axiosInstance.post<ApiResponse<RiskActivityProcess>>(
      `/risk-assessments/${riskId}/activity-processes`,
      data
    )
    return response.data.data
  },

  updateActivityProcess: async (
    id: number,
    data: RiskActivityProcessRequest
  ): Promise<RiskActivityProcess> => {
    const response = await axiosInstance.put<ApiResponse<RiskActivityProcess>>(
      `/risk-assessments/activity-processes/${id}`,
      data
    )
    return response.data.data
  },

  deleteActivityProcess: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/risk-assessments/activity-processes/${id}`)
  },

  saveActivityProcessesBatch: async (
    riskId: string,
    data: RiskActivityProcessRequest[]
  ): Promise<void> => {
    await axiosInstance.post(`/risk-assessments/${riskId}/activity-processes/batch`, data)
  },

  // ==================== Assessment Detail (Step 2) ====================

  getAssessmentDetails: async (riskId: string): Promise<RiskAssessmentDetail[]> => {
    const response = await axiosInstance.get<ApiResponse<RiskAssessmentDetail[]>>(
      `/risk-assessments/${riskId}/assessment-details`
    )
    return response.data.data
  },

  createAssessmentDetail: async (
    riskId: string,
    data: RiskAssessmentDetailRequest
  ): Promise<RiskAssessmentDetail> => {
    const response = await axiosInstance.post<ApiResponse<RiskAssessmentDetail>>(
      `/risk-assessments/${riskId}/assessment-details`,
      data
    )
    return response.data.data
  },

  updateAssessmentDetail: async (
    id: number,
    data: RiskAssessmentDetailRequest
  ): Promise<RiskAssessmentDetail> => {
    const response = await axiosInstance.put<ApiResponse<RiskAssessmentDetail>>(
      `/risk-assessments/assessment-details/${id}`,
      data
    )
    return response.data.data
  },

  deleteAssessmentDetail: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/risk-assessments/assessment-details/${id}`)
  },

  saveAssessmentDetailsBatch: async (
    riskId: string,
    data: RiskAssessmentDetailRequest[]
  ): Promise<void> => {
    await axiosInstance.post(`/risk-assessments/${riskId}/assessment-details/batch`, data)
  },

  // ==================== Risk Register (Step 3) ====================

  getRiskRegisters: async (riskId: string): Promise<RiskRegister[]> => {
    const response = await axiosInstance.get<ApiResponse<RiskRegister[]>>(
      `/risk-assessments/${riskId}/risk-registers`
    )
    return response.data.data
  },

  createRiskRegister: async (
    riskId: string,
    data: Partial<RiskRegister>
  ): Promise<RiskRegister> => {
    const response = await axiosInstance.post<ApiResponse<RiskRegister>>(
      `/risk-assessments/${riskId}/risk-registers`,
      data
    )
    return response.data.data
  },

  updateRiskRegister: async (
    id: number,
    data: Partial<RiskRegister>
  ): Promise<RiskRegister> => {
    const response = await axiosInstance.put<ApiResponse<RiskRegister>>(
      `/risk-assessments/risk-registers/${id}`,
      data
    )
    return response.data.data
  },

  deleteRiskRegister: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/risk-assessments/risk-registers/${id}`)
  },

  generateRiskRegisters: async (riskId: string): Promise<void> => {
    await axiosInstance.post(`/risk-assessments/${riskId}/risk-registers/generate`)
  },

  // ==================== Risk Assessment Form (위험성 평가서) ====================

  getForms: async (params?: {
    page?: number
    size?: number
    title?: string
  }): Promise<PageResponse<RiskAssessmentFormMaster>> => {
    const searchParams = new URLSearchParams()
    if (params?.page !== undefined) searchParams.append('page', params.page.toString())
    if (params?.size !== undefined) searchParams.append('size', params.size.toString())
    if (params?.title) searchParams.append('title', params.title)
    const response = await axiosInstance.get<ApiResponse<PageResponse<RiskAssessmentFormMaster>>>(
      `/risk-assessment-forms${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    )
    return response.data.data
  },

  getFormById: async (id: number): Promise<RiskAssessmentFormMaster> => {
    const response = await axiosInstance.get<ApiResponse<RiskAssessmentFormMaster>>(
      `/risk-assessment-forms/${id}`
    )
    return response.data.data
  },

  getFormsDropdown: async (): Promise<RiskAssessmentFormMaster[]> => {
    const response = await axiosInstance.get<ApiResponse<RiskAssessmentFormMaster[]>>(
      `/risk-assessment-forms/dropdown`
    )
    return response.data.data
  },

  createForm: async (data: RiskAssessmentFormRequest): Promise<RiskAssessmentFormMaster> => {
    const response = await axiosInstance.post<ApiResponse<RiskAssessmentFormMaster>>(
      `/risk-assessment-forms`,
      data
    )
    return response.data.data
  },

  updateForm: async (id: number, data: RiskAssessmentFormRequest): Promise<RiskAssessmentFormMaster> => {
    const response = await axiosInstance.put<ApiResponse<RiskAssessmentFormMaster>>(
      `/risk-assessment-forms/${id}`,
      data
    )
    return response.data.data
  },

  deleteForm: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/risk-assessment-forms/${id}`)
  },
}
