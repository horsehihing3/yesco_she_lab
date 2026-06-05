import axiosInstance from './axiosInstance'
import type { ApiResponse, PageResponse } from '../types/common.types'
import type {
  LegalLaw, LegalLawRequest, LegalLawStats,
  LegalPermit, LegalPermitRequest, LegalPermitStats,
  LegalObligation, LegalObligationRequest, LegalObligationStats,
  LegalImprovement, LegalImprovementRequest, LegalImprovementStats,
} from '../types/legalCompliance.types'
import type {
  AuditPlan, AuditPlanRequest,
  Audit, AuditRequest, AuditGrade,
  AuditFinding, AuditFindingRequest,
  AuditLogEntry,
} from '../types/audit.types'

// ===== Law =====
export const lawApi = {
  list: async (): Promise<LegalLaw[]> => {
    const res = await axiosInstance.get<ApiResponse<LegalLaw[]>>('/legal/laws')
    return res.data.data
  },
  stats: async (): Promise<LegalLawStats> => {
    const res = await axiosInstance.get<ApiResponse<LegalLawStats>>('/legal/laws/stats')
    return res.data.data
  },
  create: async (req: LegalLawRequest): Promise<LegalLaw> => {
    const res = await axiosInstance.post<ApiResponse<LegalLaw>>('/legal/laws', req)
    return res.data.data
  },
  update: async (id: number, req: LegalLawRequest): Promise<LegalLaw> => {
    const res = await axiosInstance.put<ApiResponse<LegalLaw>>(`/legal/laws/${id}`, req)
    return res.data.data
  },
  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/legal/laws/${id}`)
  },
}

// ===== Permit =====
export const permitApi = {
  list: async (): Promise<LegalPermit[]> => {
    const res = await axiosInstance.get<ApiResponse<LegalPermit[]>>('/legal/permits')
    return res.data.data
  },
  stats: async (): Promise<LegalPermitStats> => {
    const res = await axiosInstance.get<ApiResponse<LegalPermitStats>>('/legal/permits/stats')
    return res.data.data
  },
  create: async (req: LegalPermitRequest): Promise<LegalPermit> => {
    const res = await axiosInstance.post<ApiResponse<LegalPermit>>('/legal/permits', req)
    return res.data.data
  },
  update: async (id: number, req: LegalPermitRequest): Promise<LegalPermit> => {
    const res = await axiosInstance.put<ApiResponse<LegalPermit>>(`/legal/permits/${id}`, req)
    return res.data.data
  },
  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/legal/permits/${id}`)
  },
}

// ===== Obligation =====
export const obligationApi = {
  list: async (): Promise<LegalObligation[]> => {
    const res = await axiosInstance.get<ApiResponse<LegalObligation[]>>('/legal/obligations')
    return res.data.data
  },
  stats: async (): Promise<LegalObligationStats> => {
    const res = await axiosInstance.get<ApiResponse<LegalObligationStats>>('/legal/obligations/stats')
    return res.data.data
  },
  create: async (req: LegalObligationRequest): Promise<LegalObligation> => {
    const res = await axiosInstance.post<ApiResponse<LegalObligation>>('/legal/obligations', req)
    return res.data.data
  },
  update: async (id: number, req: LegalObligationRequest): Promise<LegalObligation> => {
    const res = await axiosInstance.put<ApiResponse<LegalObligation>>(`/legal/obligations/${id}`, req)
    return res.data.data
  },
  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/legal/obligations/${id}`)
  },
}

// ===== Improvement =====
export const improvementApi = {
  list: async (): Promise<LegalImprovement[]> => {
    const res = await axiosInstance.get<ApiResponse<LegalImprovement[]>>('/legal/improvements')
    return res.data.data
  },
  stats: async (): Promise<LegalImprovementStats> => {
    const res = await axiosInstance.get<ApiResponse<LegalImprovementStats>>('/legal/improvements/stats')
    return res.data.data
  },
  create: async (req: LegalImprovementRequest): Promise<LegalImprovement> => {
    const res = await axiosInstance.post<ApiResponse<LegalImprovement>>('/legal/improvements', req)
    return res.data.data
  },
  update: async (id: number, req: LegalImprovementRequest): Promise<LegalImprovement> => {
    const res = await axiosInstance.put<ApiResponse<LegalImprovement>>(`/legal/improvements/${id}`, req)
    return res.data.data
  },
  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/legal/improvements/${id}`)
  },
}

// ===== 법규 대응 — 계획/실시/부적합/시정조치 =====
// auditApi 와 동일 shape, '/audit-*' 대신 '/legal-compliance-*' 경로 사용.
// LegalCompliancePage 에서 Audit*Tab 의 props 로 주입.

export const legalCompliancePlanApi = {
  getAll: async (page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<AuditPlan>>>('/legal-compliance-plan', { params: { page, size, sort: 'createdAt,desc' } })
    return res.data.data
  },
  getById: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<AuditPlan>>(`/legal-compliance-plan/${id}`)
    return res.data.data
  },
  getByStatus: async (status: string, page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<AuditPlan>>>(`/legal-compliance-plan/status/${status}`, { params: { page, size } })
    return res.data.data
  },
  create: async (data: AuditPlanRequest) => {
    const res = await axiosInstance.post<ApiResponse<AuditPlan>>('/legal-compliance-plan', data)
    return res.data.data
  },
  update: async (id: number, data: AuditPlanRequest) => {
    const res = await axiosInstance.put<ApiResponse<AuditPlan>>(`/legal-compliance-plan/${id}`, data)
    return res.data.data
  },
  delete: async (id: number) => {
    await axiosInstance.delete(`/legal-compliance-plan/${id}`)
  },
  submit: async (id: number) => {
    const res = await axiosInstance.patch<ApiResponse<AuditPlan>>(`/legal-compliance-plan/${id}/submit`, null)
    return res.data.data
  },
  approve: async (id: number, approvedBy?: string) => {
    const res = await axiosInstance.patch<ApiResponse<AuditPlan>>(`/legal-compliance-plan/${id}/approve`, null, { params: approvedBy ? { approvedBy } : {} })
    return res.data.data
  },
  reject: async (id: number, rejectReason?: string) => {
    const res = await axiosInstance.patch<ApiResponse<AuditPlan>>(`/legal-compliance-plan/${id}/reject`, { rejectReason })
    return res.data.data
  },
}

export const legalComplianceExecApi = {
  getAll: async (page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<Audit>>>('/legal-compliance', { params: { page, size, sort: 'createdAt,desc' } })
    return res.data.data
  },
  getById: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<Audit>>(`/legal-compliance/${id}`)
    return res.data.data
  },
  getByStatus: async (status: string, page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<Audit>>>(`/legal-compliance/status/${status}`, { params: { page, size } })
    return res.data.data
  },
  recalcCounts: async (): Promise<number> => {
    const res = await axiosInstance.post<ApiResponse<number>>('/legal-compliance/recalc-counts')
    return res.data.data
  },
  create: async (data: AuditRequest) => {
    const res = await axiosInstance.post<ApiResponse<Audit>>('/legal-compliance', data)
    return res.data.data
  },
  update: async (id: number, data: AuditRequest) => {
    const res = await axiosInstance.put<ApiResponse<Audit>>(`/legal-compliance/${id}`, data)
    return res.data.data
  },
  updateGrade: async (id: number, grade: AuditGrade) => {
    const res = await axiosInstance.patch<ApiResponse<Audit>>(`/legal-compliance/${id}/grade`, null, { params: { grade } })
    return res.data.data
  },
  complete: async (id: number) => {
    const res = await axiosInstance.patch<ApiResponse<Audit>>(`/legal-compliance/${id}/complete`, null)
    return res.data.data
  },
  reject: async (id: number, rejectReason?: string) => {
    const res = await axiosInstance.patch<ApiResponse<Audit>>(`/legal-compliance/${id}/reject`, { rejectReason })
    return res.data.data
  },
  delete: async (id: number) => {
    await axiosInstance.delete(`/legal-compliance/${id}`)
  },
  getLogs: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<AuditLogEntry[]>>(`/legal-compliance/${id}/logs`)
    return res.data.data
  },
  getLogItems: async (logId: number) => {
    const res = await axiosInstance.get<ApiResponse<{ id: number; logId: number; categoryName: string; itemNo: number; classification: string; checkItem: string; legalBasis: string; checkResult: string; finding: string; actionDeadline: string; actionComplete: boolean }[]>>(`/legal-compliance/logs/${logId}/items`)
    return res.data.data
  },
}

export const legalComplianceFindingApi = {
  getAll: async (page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<AuditFinding>>>('/legal-compliance-finding', { params: { page, size, sort: 'createdAt,desc' } })
    return res.data.data
  },
  getById: async (id: number): Promise<AuditFinding> => {
    const res = await axiosInstance.get<ApiResponse<AuditFinding>>(`/legal-compliance-finding/${id}`)
    return res.data.data
  },
  syncFromChecklist: async (auditId: number): Promise<number> => {
    const res = await axiosInstance.post<ApiResponse<number>>(`/legal-compliance-finding/audit/${auditId}/sync`)
    return res.data.data
  },
  getByAudit: async (auditId: number, page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<AuditFinding>>>(`/legal-compliance-finding/audit/${auditId}`, { params: { page, size } })
    return res.data.data
  },
  getBySeverity: async (severity: string, page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<AuditFinding>>>(`/legal-compliance-finding/severity/${severity}`, { params: { page, size } })
    return res.data.data
  },
  create: async (data: AuditFindingRequest) => {
    const res = await axiosInstance.post<ApiResponse<AuditFinding>>('/legal-compliance-finding', data)
    return res.data.data
  },
  update: async (id: number, data: AuditFindingRequest) => {
    const res = await axiosInstance.put<ApiResponse<AuditFinding>>(`/legal-compliance-finding/${id}`, data)
    return res.data.data
  },
  delete: async (id: number) => {
    await axiosInstance.delete(`/legal-compliance-finding/${id}`)
  },
}

