export interface HealthCheckupPlan {
  id: number
  planYear: number
  checkupType: string           // GENERAL / SPECIAL / OCCUPATIONAL
  planName: string
  targetDept: string | null
  targetCount: number
  completedCount: number
  hazardFactors: string | null
  hospital: string | null
  planStartDate: string | null
  planEndDate: string | null
  status: string                // PLANNED / PENDING_APPROVAL / IN_PROGRESS / COMPLETED / REJECTED / CANCELLED
  notes: string | null
  createdBy: string | null
  createdByName: string | null
  createdByDept: string | null
  modifiedByUserId?: number | null
  modifiedByName?: string | null
  modifiedByTeam?: string | null
  modifiedByPosition?: string | null
  createdAt: string
  modifiedAt: string

  // 계획 승인자
  planApproverUserId?: number | null
  planApproverTeam?: string | null
  planApproverPosition?: string | null
  planApproverName?: string | null
  planApprovedAt?: string | null
  planApprovedBy?: string | null

  // 완료 승인자
  completionApproverUserId?: number | null
  completionApproverTeam?: string | null
  completionApproverPosition?: string | null
  completionApproverName?: string | null
  completionApprovedAt?: string | null
  completionApprovedBy?: string | null

  writer?: string | null
  rejectReason?: string | null
}

export interface HealthCheckupPlanRequest {
  planYear: number
  checkupType: string
  planName: string
  targetDept?: string
  targetCount?: number
  hazardFactors?: string
  hospital?: string
  planStartDate?: string
  planEndDate?: string
  status?: string
  notes?: string

  planApproverUserId?: number | null
  planApproverTeam?: string
  planApproverPosition?: string
  planApproverName?: string
  completionApproverUserId?: number | null
  completionApproverTeam?: string
  completionApproverPosition?: string
  completionApproverName?: string

  writer?: string
}
