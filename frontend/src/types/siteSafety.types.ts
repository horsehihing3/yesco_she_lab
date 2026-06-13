// 현장 안전 관리 — 협력사 관리 기반, 점검자 단일 서명 추가

export type SiteSafetyPlanType = 'INTERNAL' | 'PARTNER'

export interface SiteSafetyPlan {
  id: number
  planId: string
  planType?: SiteSafetyPlanType
  title: string
  workType?: string
  riskLevel?: string
  workLocation?: string
  workersCount: number
  workStartDate?: string
  workEndDate?: string
  workDescription?: string
  safetyMeasures?: string
  requiredPpe?: string
  hazardFactors?: string
  emergencyContact?: string
  notes?: string
  checklistTemplateId?: number
  approverName?: string

  // 계획 승인자
  planApproverUserId?: number | null
  planApproverTeam?: string
  planApproverPosition?: string
  planApproverName?: string
  planApprovedAt?: string
  planApprovedBy?: string

  // 완료 승인자
  completionApproverUserId?: number | null
  completionApproverTeam?: string
  completionApproverPosition?: string
  completionApproverName?: string
  completionApprovedAt?: string
  completionApprovedBy?: string

  inspectorTeam?: string | null
  inspectorName?: string | null
  inspectorPosition?: string | null
  inspectorSignedAt?: string | null
  inspectorSignature?: string | null
  repeatType?: string
  repeatInterval?: number
  repeatDays?: string
  status: string
  approvedBy?: string
  approvedAt?: string
  rejectReason?: string
  totalChecklist: number
  completedChecklist: number
  findingCount: number
  modifiedBy?: string
  modifiedByName?: string | null
  modifiedByTeam?: string | null
  modifiedByPosition?: string | null
  modifiedByUserId?: number | null
  createdByName?: string | null
  createdByTeam?: string | null
  createdByPosition?: string | null
  createdByUserId?: number | null
  createdAt: string
  modifiedAt: string
}

export interface SiteSafetyPlanRequest {
  planType?: SiteSafetyPlanType
  title: string
  workType?: string
  riskLevel?: string
  workLocation?: string
  workersCount?: number
  workStartDate?: string
  workEndDate?: string
  workDescription?: string
  safetyMeasures?: string
  requiredPpe?: string
  hazardFactors?: string
  emergencyContact?: string
  notes?: string
  checklistTemplateId?: number
  approverName?: string
  planApproverUserId?: number | null
  planApproverTeam?: string
  planApproverPosition?: string
  planApproverName?: string
  completionApproverUserId?: number | null
  completionApproverTeam?: string
  completionApproverPosition?: string
  completionApproverName?: string
  modifiedBy?: string
  repeatType?: string
  repeatInterval?: number
  repeatDays?: string
  status?: string
}

export interface SiteSafetyWorker {
  id: number
  planId: number
  workerName: string
  workerPhone?: string
  companyName?: string
  notes?: string
  createdAt: string
}

