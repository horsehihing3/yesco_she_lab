export interface PermitToWork {
  id: number
  permitId: string
  permitType: string
  riskLevel: string
  status: string
  title: string
  description?: string
  workLocation?: string
  workStartDate?: string
  workEndDate?: string
  requesterName?: string
  requesterDept?: string
  requesterId?: string
  approverName?: string
  approverDept?: string
  approverId?: string
  approvedAt?: string
  safetyMeasures?: string
  requiredPpe?: string
  hazardFactors?: string
  emergencyContact?: string
  workersCount?: number
  rejectionReason?: string
  rejectReason?: string
  completedAt?: string
  checklistTemplateId?: number
  inspectorName?: string
  isExternal?: boolean
  totalChecklist: number
  completedChecklist: number
  findingCount: number
  modifiedBy?: string
  createdByUserId?: number | null
  createdByName?: string | null
  createdByTeam?: string | null
  createdByPosition?: string | null
  notes?: string
  // 계획 / 완료 결재 분리
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
  createdAt: string
  modifiedAt: string
}

export interface PermitWorker {
  id: number
  permitId: number
  workerName: string
  workerCompany?: string
  workerPhone?: string
  workerType: string
  notes?: string
  createdAt: string
}

export interface PermitToWorkRequest {
  permitType: string
  riskLevel: string
  status?: string
  title: string
  description?: string
  workLocation?: string
  workStartDate?: string
  workEndDate?: string
  requesterName?: string
  requesterDept?: string
  requesterId?: string
  approverName?: string
  approverDept?: string
  approverId?: string
  safetyMeasures?: string
  requiredPpe?: string
  hazardFactors?: string
  emergencyContact?: string
  workersCount?: number
  rejectionReason?: string
  checklistTemplateId?: number
  inspectorName?: string
  isExternal?: boolean
  notes?: string
  planApproverUserId?: number | null
  planApproverTeam?: string
  planApproverPosition?: string
  planApproverName?: string
  completionApproverUserId?: number | null
  completionApproverTeam?: string
  completionApproverPosition?: string
  completionApproverName?: string
}
