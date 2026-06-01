// 인허가 라이프사이클 — 7 모듈 공통 타입

export interface PermitIdentification {
  id: number
  equipmentName: string
  equipmentType?: string
  location?: string
  installDate?: string
  applicableCategories?: string  // CSV: "환경,화학"
  applicablePermits?: string     // CSV
  status: string                 // 식별완료 / 검토중 / 미식별 / 미대상
  assessor?: string
  assessmentDate?: string
  linkedPermits?: string
  notes?: string
  createdAt?: string
  modifiedAt?: string
}

export interface PermitRegistry {
  id: number
  category: string               // 환경 / 안전 / 보건 / 소방 / 화학 / 건축
  permitType?: string
  name: string
  law?: string
  agency?: string
  permitNumber?: string
  issuedDate?: string
  expiryDate?: string
  cycle?: string
  facility?: string
  location?: string
  manager?: string
  notes?: string
  createdAt?: string
  modifiedAt?: string
}

export interface PermitRenewal {
  id: number
  permitName: string
  category?: string
  stage: string                  // 검토 / 서류준비 / 신청완료 / 심사중 / 승인 / 완료
  currentExpiry?: string
  targetDate?: string
  startDate?: string
  assignee?: string
  nextAction?: string
  dueDate?: string
  notes?: string
}

export interface PermitChange {
  id: number
  changeType: string             // 설비증설/공정변경/물질변경/인원변경/위치변경
  title: string
  description?: string
  requestDate?: string
  plannedDate?: string
  initiator?: string
  approver?: string
  impactAssessment?: string      // 검토중/영향있음/영향없음
  status: string                 // 검토중/안전영향평가/허가신청/심사중/승인/이행완료/반려
  affectedPermits?: string
  notes?: string
}

export interface PermitInspection {
  id: number
  inspectionName: string
  inspectionType?: string        // 법정/자체/외부위탁
  frequency: string              // 일/주/월/분기/반기/연
  targetFacility?: string
  legalBasis?: string
  lastDate?: string
  nextDate: string
  assignee?: string
  lastResult?: string            // 적합/시정필요/부적합
  notes?: string
}

export interface PermitReporting {
  id: number
  reportName: string
  reportType?: string            // 결과보고/연간보고/분기보고/월간보고/재해보고/수시보고
  regulatoryBody?: string
  legalBasis?: string
  frequency?: string
  lastSubmission?: string
  nextDeadline?: string
  assignee?: string
  status: string                 // 제출완료/준비중/임박/지연
  notes?: string
}

export interface PermitDocument {
  id: number
  docName: string
  docType: string                // 허가증/신고증/검사결과서/측정결과서/보고서/취급일지/교육일지/기타
  category?: string
  relatedPermit?: string
  issueDate: string
  retentionYears: number         // 999 = 영구
  fileLocation?: string
  notes?: string
}

export interface PermitLifecycleStats {
  identTotal: number
  identDone: number
  identReview: number
  identMiss: number
  regTotal: number
  regValid: number
  regWarn: number
  regExpired: number
  rnActive: number
  rnDone: number
  rnWarn: number
  chTotal: number
  chReview: number
  chProgress: number
  chDone: number
  ipTotal: number
  ipNear: number
  ipOverdue: number
  rpTotal: number
  rpDone: number
  rpNear: number
  rpOverdue: number
  dcTotal: number
}
