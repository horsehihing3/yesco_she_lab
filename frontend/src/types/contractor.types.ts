export interface ContractorPlan {
  id: number
  planId: string
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
  // 계획/완료 결재 분리
  planApproverUserId?: number | null
  planApproverTeam?: string
  planApproverPosition?: string
  planApproverName?: string
  planApprovedAt?: string
  planApprovedBy?: string
  completionApproverUserId?: number | null
  completionApproverTeam?: string
  completionApproverPosition?: string
  completionApproverName?: string
  completionApprovedAt?: string
  completionApprovedBy?: string
  repeatType?: string
  repeatInterval?: number
  repeatDays?: string
  status: string
  approvedBy?: string
  approvedAt?: string
  totalChecklist: number
  completedChecklist: number
  findingCount: number
  modifiedBy?: string
  createdAt: string
  modifiedAt: string
}

export interface ContractorPlanRequest {
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
  repeatType?: string
  repeatInterval?: number
  repeatDays?: string
  status?: string
}

export interface ContractorEvalTemplate {
  id: number
  templateName: string
  description?: string
  sortOrder: number
  isActive: boolean
  itemCount?: number
  // 시그니처 (슬라이드 3)
  evaluatorName?: string
  evaluatorSign?: string
  approverName?: string
  approverSign?: string
  signDate?: string
}

export interface ContractorEvalItem {
  id?: number
  templateId: number
  sortOrder: number
  workContent?: string
  evalCategory?: string
  riskFactor?: string
  disasterType?: string
  isNa?: boolean
  currentMeasures?: string
  currentFrequency?: number
  currentSeverity?: number
  currentRisk?: number
  riskGrade?: string
  improvement?: string
  eduFrequency?: string
  postFrequency?: number
  postSeverity?: number
  postRisk?: number
}

export interface ContractorWorker {
  id: number
  planId: number
  workerName: string
  workerPhone?: string
  companyName?: string
  notes?: string
  createdAt: string
}
