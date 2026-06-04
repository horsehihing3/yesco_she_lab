import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import {
  AuditPlan, AuditPlanRequest,
  Audit, AuditRequest, AuditGrade,
  AuditChecklistTemplate, AuditChecklistTemplateRequest,
  AuditChecklistResult, AuditChecklistResultRequest,
  AuditFinding, AuditFindingRequest,
  AuditCorrective, AuditCorrectiveRequest,
  AuditLogEntry,
} from '../types/audit.types'

export const auditPlanApi = {
  getAll: async (page = 0, size = 20, unapproved = false) => {
    const params: Record<string, unknown> = { page, size, sort: 'createdAt,desc' }
    if (unapproved) params.unapproved = true
    const res = await axiosInstance.get<ApiResponse<PageResponse<AuditPlan>>>('/audit-plan', { params })
    return res.data.data
  },
  getById: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<AuditPlan>>(`/audit-plan/${id}`)
    return res.data.data
  },
  getByStatus: async (status: string, page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<AuditPlan>>>(`/audit-plan/status/${status}`, { params: { page, size } })
    return res.data.data
  },
  create: async (data: AuditPlanRequest) => {
    const res = await axiosInstance.post<ApiResponse<AuditPlan>>('/audit-plan', data)
    return res.data.data
  },
  update: async (id: number, data: AuditPlanRequest) => {
    const res = await axiosInstance.put<ApiResponse<AuditPlan>>(`/audit-plan/${id}`, data)
    return res.data.data
  },
  delete: async (id: number) => {
    await axiosInstance.delete(`/audit-plan/${id}`)
  },
  submit: async (id: number) => {
    const res = await axiosInstance.patch<ApiResponse<AuditPlan>>(`/audit-plan/${id}/submit`, null)
    return res.data.data
  },
  approve: async (id: number, approvedBy?: string) => {
    const res = await axiosInstance.patch<ApiResponse<AuditPlan>>(`/audit-plan/${id}/approve`, null, { params: approvedBy ? { approvedBy } : {} })
    return res.data.data
  },
  reject: async (id: number, rejectReason?: string) => {
    const res = await axiosInstance.patch<ApiResponse<AuditPlan>>(`/audit-plan/${id}/reject`, { rejectReason })
    return res.data.data
  },
}

export const auditApi = {
  getAll: async (page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<Audit>>>('/audit', { params: { page, size, sort: 'createdAt,desc' } })
    return res.data.data
  },
  getById: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<Audit>>(`/audit/${id}`)
    return res.data.data
  },
  getByStatus: async (status: string, page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<Audit>>>(`/audit/status/${status}`, { params: { page, size } })
    return res.data.data
  },
  recalcCounts: async (): Promise<number> => {
    const res = await axiosInstance.post<ApiResponse<number>>('/audit/recalc-counts')
    return res.data.data
  },
  create: async (data: AuditRequest) => {
    const res = await axiosInstance.post<ApiResponse<Audit>>('/audit', data)
    return res.data.data
  },
  update: async (id: number, data: AuditRequest) => {
    const res = await axiosInstance.put<ApiResponse<Audit>>(`/audit/${id}`, data)
    return res.data.data
  },
  updateGrade: async (id: number, grade: AuditGrade) => {
    const res = await axiosInstance.patch<ApiResponse<Audit>>(`/audit/${id}/grade`, { grade })
    return res.data.data
  },
  complete: async (id: number) => {
    const res = await axiosInstance.patch<ApiResponse<Audit>>(`/audit/${id}/complete`, null)
    return res.data.data
  },
  reject: async (id: number, rejectReason?: string) => {
    const res = await axiosInstance.patch<ApiResponse<Audit>>(`/audit/${id}/reject`, { rejectReason })
    return res.data.data
  },
  delete: async (id: number) => {
    await axiosInstance.delete(`/audit/${id}`)
  },
  getLogs: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<AuditLogEntry[]>>(`/audit/${id}/logs`)
    return res.data.data
  },
  getLogItems: async (logId: number) => {
    const res = await axiosInstance.get<ApiResponse<{ id: number; logId: number; categoryName: string; itemNo: number; classification: string; checkItem: string; legalBasis: string; checkResult: string; finding: string; actionDeadline: string; actionComplete: boolean }[]>>(`/audit/logs/${logId}/items`)
    return res.data.data
  },
}

export const auditChecklistApi = {
  getTemplates: async (page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<AuditChecklistTemplate>>>('/audit-checklist/template', { params: { page, size } })
    return res.data.data
  },
  getTemplateById: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<AuditChecklistTemplate>>(`/audit-checklist/template/${id}`)
    return res.data.data
  },
  createTemplate: async (data: AuditChecklistTemplateRequest) => {
    const res = await axiosInstance.post<ApiResponse<AuditChecklistTemplate>>('/audit-checklist/template', data)
    return res.data.data
  },
  updateTemplate: async (id: number, data: AuditChecklistTemplateRequest) => {
    const res = await axiosInstance.put<ApiResponse<AuditChecklistTemplate>>(`/audit-checklist/template/${id}`, data)
    return res.data.data
  },
  deleteTemplate: async (id: number) => {
    await axiosInstance.delete(`/audit-checklist/template/${id}`)
  },
  getResults: async (auditId: number) => {
    const res = await axiosInstance.get<ApiResponse<AuditChecklistResult[]>>(`/audit-checklist/result/audit/${auditId}`)
    return res.data.data
  },
  getTemplatesByAuditType: async (auditType: string) => {
    const res = await axiosInstance.get<ApiResponse<AuditChecklistTemplate[]>>(`/audit-checklist/template/audit-type/${auditType}`)
    return res.data.data
  },
  initResults: async (auditId: number, templateId: number) => {
    const res = await axiosInstance.post<ApiResponse<AuditChecklistResult[]>>('/audit-checklist/result/init', null, { params: { auditId, templateId } })
    return res.data.data
  },
  updateResult: async (resultId: number, data: AuditChecklistResultRequest) => {
    const res = await axiosInstance.put<ApiResponse<AuditChecklistResult>>(`/audit-checklist/result/${resultId}`, data)
    return res.data.data
  },
}

export const auditFindingApi = {
  getAll: async (page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<AuditFinding>>>('/audit-finding', { params: { page, size, sort: 'createdAt,desc' } })
    return res.data.data
  },
  getById: async (id: number): Promise<AuditFinding> => {
    const res = await axiosInstance.get<ApiResponse<AuditFinding>>(`/audit-finding/${id}`)
    return res.data.data
  },
  syncFromChecklist: async (auditId: number): Promise<number> => {
    const res = await axiosInstance.post<ApiResponse<number>>(`/audit-finding/audit/${auditId}/sync`)
    return res.data.data
  },
  getByAudit: async (auditId: number, page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<AuditFinding>>>(`/audit-finding/audit/${auditId}`, { params: { page, size } })
    return res.data.data
  },
  getBySeverity: async (severity: string, page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<AuditFinding>>>(`/audit-finding/severity/${severity}`, { params: { page, size } })
    return res.data.data
  },
  create: async (data: AuditFindingRequest) => {
    const res = await axiosInstance.post<ApiResponse<AuditFinding>>('/audit-finding', data)
    return res.data.data
  },
  update: async (id: number, data: AuditFindingRequest) => {
    const res = await axiosInstance.put<ApiResponse<AuditFinding>>(`/audit-finding/${id}`, data)
    return res.data.data
  },
  delete: async (id: number) => {
    await axiosInstance.delete(`/audit-finding/${id}`)
  },
}

export const auditCorrectiveApi = {
  getAll: async (page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<AuditCorrective>>>('/audit-corrective', { params: { page, size, sort: 'createdAt,desc' } })
    return res.data.data
  },
  getByAudit: async (auditId: number, page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<AuditCorrective>>>(`/audit-corrective/audit/${auditId}`, { params: { page, size } })
    return res.data.data
  },
  getByStatus: async (status: string, page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<AuditCorrective>>>(`/audit-corrective/status/${status}`, { params: { page, size } })
    return res.data.data
  },
  create: async (data: AuditCorrectiveRequest) => {
    const res = await axiosInstance.post<ApiResponse<AuditCorrective>>('/audit-corrective', data)
    return res.data.data
  },
  update: async (id: number, data: AuditCorrectiveRequest) => {
    const res = await axiosInstance.put<ApiResponse<AuditCorrective>>(`/audit-corrective/${id}`, data)
    return res.data.data
  },
  updateCompletion: async (id: number, completionRate: number) => {
    const res = await axiosInstance.patch<ApiResponse<AuditCorrective>>(`/audit-corrective/${id}/completion`, { completionRate })
    return res.data.data
  },
  delete: async (id: number) => {
    await axiosInstance.delete(`/audit-corrective/${id}`)
  },
}
