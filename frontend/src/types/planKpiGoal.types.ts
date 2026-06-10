export interface EhsPlanGoal {
  id?: number
  goalText?: string | null
  subGoal?: string | null
  task?: string | null
  kpi?: string | null
  prevResult?: string | null
  targetValue?: string | null
  ownerUserId?: number | null
  ownerTeam?: string | null
  ownerName?: string | null
  q1?: boolean
  q2?: boolean
  q3?: boolean
  q4?: boolean
  q1Status?: string | null
  q2Status?: string | null
  q3Status?: string | null
  q4Status?: string | null
  sortOrder?: number
}

export type KpiQuarterStatus = 'ACHIEVED' | 'IN_PROGRESS' | 'REVIEW' | 'NOT_ACHIEVED'

export interface EhsPlan {
  id: number
  planYear: number
  planName: string
  description: string | null
  status: string
  priority: string | null
  remarks: string | null
  createdByUserId: number | null
  createdByTeam: string | null
  createdByPosition: string | null
  createdByName: string | null
  modifiedByUserId: number | null
  modifiedByName: string | null
  modifiedByTeam: string | null
  modifiedByPosition: string | null
  // 계획 승인자 (연간 계획에서 승인)
  planApproverUserId: number | null
  planApproverTeam: string | null
  planApproverPosition: string | null
  planApproverName: string | null
  planApprovedAt: string | null
  planApprovedBy: string | null
  // 완료 승인자 (KPI현황에서 작업 완료 승인)
  completionApproverUserId: number | null
  completionApproverTeam: string | null
  completionApproverPosition: string | null
  completionApproverName: string | null
  completionApprovedAt: string | null
  completionApprovedBy: string | null
  isApproved: boolean | null
  rejectReason: string | null
  createdAt: string
  modifiedAt: string
  goals?: EhsPlanGoal[]
}

export interface EhsPlanRequest {
  planYear: number
  planName: string
  description?: string
  status?: string
  priority?: string
  remarks?: string
  createdByUserId?: number | null
  createdByTeam?: string
  createdByPosition?: string
  createdByName?: string
  planApproverUserId?: number | null
  planApproverTeam?: string
  planApproverPosition?: string
  planApproverName?: string
  completionApproverUserId?: number | null
  completionApproverTeam?: string
  completionApproverPosition?: string
  completionApproverName?: string
  goals?: EhsPlanGoal[]
}
