export type AuditPlanStatus = 'PLAN' | 'PENDING_APPROVAL' | 'APPROVED' | 'PREPARING' | 'IN_PROGRESS' | 'PENDING_CLOSE' | 'COMPLETED'
export type AuditType = 'REGULAR' | 'SPECIAL' | 'EXPERT' | 'INTERNAL'
export type FindingSeverity = 'CRITICAL' | 'MINOR' | 'OBSERVATION'
export type CorrectiveStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'DEMONSTRATION' | 'NA'
export type CheckStatus = 'CHECKED' | 'UNCHECKED' | 'NA'

export type AuditLogAction =
  | 'CHECKLIST_SAVE'
  | 'STATUS_CHANGE'
  | 'FIELD_UPDATE'
  | 'APPROVAL_SUBMIT'
  | 'APPROVAL_APPROVED'
  | 'APPROVAL_REJECTED'
  | 'APPROVAL_COMPLETED'

export type AuditLogActorRole = 'EDITOR' | 'SUBMITTER' | 'APPROVER' | 'REJECTOR'

export interface AuditFieldChange {
  field: string
  before: string | null
  after: string | null
}

export interface AuditLogEntry {
  id: number
  auditId: number
  action: AuditLogAction | string
  changedBy: string | null
  detail: string | null
  totalCount?: number | null
  passCount?: number | null
  failCount?: number | null
  naCount?: number | null
  fieldChanges?: string | null
  approvalId?: number | null
  rejectReason?: string | null
  actorRole?: AuditLogActorRole | string | null
  createdAt: string
}

export interface AuditPlan {
  id: number
  planId: string
  auditName: string
  auditType: AuditType
  targetDept?: string
  /** 다중 감사담당자 — 콤마(,)로 구분된 이름 목록 */
  auditorName?: string
  auditorDept?: string
  /** 호환 alias (기존 코드용) */
  auditor?: string
  auditorEmail?: string
  personInCharge?: string
  planStartDate?: string
  planEndDate?: string
  purpose?: string
  notes?: string
  checklistTemplateId?: number
  approved?: boolean
  approvedBy?: string
  approvedAt?: string
  // 계획 승인자
  planApproverUserId?: number | null
  planApproverTeam?: string | null
  planApproverPosition?: string | null
  planApproverName?: string | null
  planApprovedAt?: string | null
  planApprovedBy?: string | null
  // 완료 승인자 (계획 단계에서 미리 지정)
  completionApproverUserId?: number | null
  completionApproverTeam?: string | null
  completionApproverPosition?: string | null
  completionApproverName?: string | null
  completionApprovedAt?: string | null
  completionApprovedBy?: string | null
  createdByUserId?: number | null
  createdByTeam?: string | null
  createdByName?: string | null
  createdByPosition?: string | null
  modifiedByUserId?: number | null
  modifiedByName?: string | null
  modifiedByTeam?: string | null
  modifiedByPosition?: string | null
  rejectReason?: string | null
  status: AuditPlanStatus
  createdAt: string
  modifiedAt: string
}

export interface AuditPlanRequest {
  auditName: string
  auditType: AuditType
  targetDept?: string
  auditorName?: string
  auditorDept?: string
  auditor?: string
  auditorEmail?: string
  personInCharge?: string
  planStartDate?: string
  planEndDate?: string
  purpose?: string
  notes?: string
  checklistTemplateId?: number
  status?: AuditPlanStatus
  planApproverUserId?: number | null
  planApproverTeam?: string
  planApproverPosition?: string
  planApproverName?: string
  completionApproverUserId?: number | null
  completionApproverTeam?: string
  completionApproverPosition?: string
  completionApproverName?: string
  createdByUserId?: number | null
  createdByName?: string
  createdByTeam?: string
  createdByPosition?: string
}

export interface Audit {
  id: number
  auditId: string
  planId?: number
  auditName: string
  auditType: AuditType
  targetDept?: string
  auditor?: string
  auditDate?: string
  auditEndDate?: string
  totalChecklist: number
  completedChecklist: number
  findingCount: number
  summary?: string
  notes?: string
  status: AuditPlanStatus
  modifiedBy?: string
  // 계획 승인자 (실시에서도 표시·편집)
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
  // 작성자 (로그인 사용자 자동 입력)
  createdByUserId?: number | null
  createdByTeam?: string | null
  createdByName?: string | null
  createdByPosition?: string | null
  // 수정자 (수정 시 자동 갱신)
  modifiedByUserId?: number | null
  modifiedByName?: string | null
  modifiedByTeam?: string | null
  modifiedByPosition?: string | null
  // 완료 결재 반려 사유
  rejectReason?: string | null
  createdAt: string
  modifiedAt: string
}

export interface AuditRequest {
  planId?: number
  auditName: string
  auditType: AuditType
  targetDept?: string
  auditor?: string
  auditDate?: string
  summary?: string
  status?: AuditPlanStatus
  planApproverUserId?: number | null
  planApproverTeam?: string
  planApproverPosition?: string
  planApproverName?: string
  completionApproverUserId?: number | null
  completionApproverTeam?: string
  completionApproverPosition?: string
  completionApproverName?: string
  createdByUserId?: number | null
  createdByName?: string
  createdByTeam?: string
  createdByPosition?: string
}

export interface AuditChecklistTemplate {
  id: number
  templateId: string
  templateName: string
  title?: string
  auditType: AuditType
  description?: string
  content?: string
  inspectionDate?: string
  inspectionLocation?: string
  inspectionDept?: string
  personInCharge?: string
  inspector?: string
  reviewer?: string
  inspectionType?: string
  inspectionCount?: string
  overallResult?: string
  totalScore?: string
  items: AuditChecklistItem[]
  createdAt: string
  modifiedAt: string
}

export interface AuditChecklistItem {
  id: number
  templateId: number
  section: string
  itemText: string
  legalRef?: string
  isCritical: boolean
  sortOrder: number
}

export interface AuditChecklistItemRequest {
  section: string
  itemText: string
  legalRef?: string
  isCritical?: boolean
  sortOrder?: number
}

export interface AuditChecklistTemplateRequest {
  templateName: string
  auditType: AuditType
  description?: string
  content?: string
  inspectionDate?: string
  inspectionLocation?: string
  inspectionDept?: string
  personInCharge?: string
  inspector?: string
  reviewer?: string
  inspectionType?: string
  inspectionCount?: string
  overallResult?: string
  totalScore?: string
  items?: AuditChecklistItemRequest[]
}

export interface AuditChecklistResult {
  id: number
  auditId: number
  checklistItemId: number
  section: string
  itemText: string
  legalRef?: string
  isCritical: boolean
  checkStatus: CheckStatus
  remark?: string
}

export interface AuditChecklistResultRequest {
  checkStatus: CheckStatus
  remark?: string
}

export interface AuditFinding {
  id: number
  findingId: string
  auditId: number
  auditName?: string
  severity: FindingSeverity
  description: string
  legalRef?: string
  responsiblePerson?: string
  responsibleDept?: string
  dueDate?: string
  status: CorrectiveStatus
  createdAt: string
  modifiedAt: string
}

export interface AuditFindingRequest {
  auditId: number
  severity: FindingSeverity
  description: string
  legalRef?: string
  responsiblePerson?: string
  responsibleDept?: string
  dueDate?: string
  status?: CorrectiveStatus
}

