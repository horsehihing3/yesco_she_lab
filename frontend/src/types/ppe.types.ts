// 보호구·장비 (PPE) 8개 도메인 타입 정의
// 모든 도메인 공통: PersonRef flat 필드(createdByName/Team/Position/UserId, modifiedByName/Team/Position/UserId)

// ── 공통 페이징 응답 ──
export interface PpePageResponse<T> {
  content: T[]
  totalElements: number
  page: number
  size: number
  totalPages: number
}

// ── 공통 PersonRef flat 필드 ──
export interface PpeAuditFields {
  createdByUserId?: number | null
  createdByName?: string | null
  createdByTeam?: string | null
  createdByPosition?: string | null
  modifiedByUserId?: number | null
  modifiedByName?: string | null
  modifiedByTeam?: string | null
  modifiedByPosition?: string | null
  createdAt?: string | null
  modifiedAt?: string | null
}

// ════════════════════════════════════════════════════════════════════
// 1. 품목 마스터
// ════════════════════════════════════════════════════════════════════
export interface PpeItem extends PpeAuditFields {
  id: number
  itemCode?: string
  name: string
  category?: string
  modelNo?: string
  kcCertNo?: string
  grade?: string
  supplier?: string
  unitPrice?: number
  replaceCycle?: number
  certExpiry?: string
  minStock?: number
  note?: string
}
export type PpeItemRequest = Omit<PpeItem, 'id' | 'createdAt' | 'modifiedAt'>

export interface PpeItemKpi {
  totalItems: number
  categoryCount: number
  supplierCount: number
}

// ════════════════════════════════════════════════════════════════════
// 2. 창고별 재고
// ════════════════════════════════════════════════════════════════════
export interface PpeStock extends PpeAuditFields {
  id: number
  itemId?: number
  itemName?: string
  location?: string
  quantity?: number
  minQty?: number
  optQty?: number
  expiryDate?: string
  note?: string
}
export type PpeStockRequest = Omit<PpeStock, 'id' | 'createdAt' | 'modifiedAt'>

export interface PpeStockKpi {
  totalQuantity: number
  lowStockCount: number
  expiringCount: number
}

// ════════════════════════════════════════════════════════════════════
// 3. 입출고 이력
// ════════════════════════════════════════════════════════════════════
export type PpeInoutType = 'IN' | 'OUT'

export interface PpeInout extends PpeAuditFields {
  id: number
  inoutDate?: string
  itemId?: number
  itemName?: string
  inoutType?: PpeInoutType
  quantity?: number
  location?: string
  expiryDate?: string
  manager?: string
  note?: string
}
export type PpeInoutRequest = Omit<PpeInout, 'id' | 'createdAt' | 'modifiedAt'>

export interface PpeInoutKpi {
  inThisMonth: number
  outThisMonth: number
}

// ════════════════════════════════════════════════════════════════════
// 4. 지급·반납
// ════════════════════════════════════════════════════════════════════
export type PpeIssueStatus = '지급완료' | '반납완료' | '교체요청' | '분실신고'
export type PpeIssueReason = '신규지급' | '정기교체' | '파손교체' | '분실재지급'

export interface PpeIssue extends PpeAuditFields {
  id: number
  issueDate?: string
  workerName?: string
  empId?: string
  department?: string
  itemId?: number
  itemName?: string
  quantity?: number
  issueReason?: PpeIssueReason | string
  returnDate?: string
  status?: PpeIssueStatus | string
  signed?: boolean
  signatureImage?: string
  note?: string
}
export type PpeIssueRequest = Omit<PpeIssue, 'id' | 'createdAt' | 'modifiedAt'>

export interface PpeIssueKpi {
  totalIssues: number
  returnedCount: number
  replaceRequestCount: number
  lossReportCount: number
}

// ════════════════════════════════════════════════════════════════════
// 5. 검사·점검
// ════════════════════════════════════════════════════════════════════
export type PpeInspectionType = '정기검사' | '자체점검' | '사전점검'
export type PpeInspectionResult = '합격' | '조건부합격' | '불합격' | '폐기'

export interface PpeInspection extends PpeAuditFields {
  id: number
  inspectionDate?: string
  itemId?: number
  itemName?: string
  itemCode?: string
  inspectionType?: PpeInspectionType | string
  inspector?: string
  result?: PpeInspectionResult | string
  nextDate?: string
  note?: string
}
export type PpeInspectionRequest = Omit<PpeInspection, 'id' | 'createdAt' | 'modifiedAt'>

export interface PpeInspectionKpi {
  totalCount: number
  passCount: number
  failOrDisposeCount: number
  upcomingCount: number
}

// ════════════════════════════════════════════════════════════════════
// 6. 착용 이행
// ════════════════════════════════════════════════════════════════════
export type PpeWearStatus = '착용확인' | '미착용' | '부적정착용'

export interface PpeWear extends PpeAuditFields {
  id: number
  checkDatetime?: string
  workerName?: string
  department?: string
  workZone?: string
  requiredPpe?: string
  wearStatus?: PpeWearStatus | string
  checker?: string
  actionTaken?: string
  note?: string
}
export type PpeWearRequest = Omit<PpeWear, 'id' | 'createdAt' | 'modifiedAt'>

export interface PpeWearKpi {
  totalCheck: number
  okCount: number
  violationCount: number
  educationNeededCount: number
  complianceRate: number
}

export interface PpeWearDeptRate {
  department: string
  total_count: number
  ok_count: number
}

// ════════════════════════════════════════════════════════════════════
// 7. 성능 평가
// ════════════════════════════════════════════════════════════════════
export type PpePerformanceResult = '기준충족' | '성능미달' | '평가중'

export interface PpePerformance extends PpeAuditFields {
  id: number
  evaluationDate?: string
  itemId?: number
  itemName?: string
  performanceStandard?: string
  standardValue?: string
  measuredValue?: string
  result?: PpePerformanceResult | string
  evaluator?: string
  note?: string
}
export type PpePerformanceRequest = Omit<PpePerformance, 'id' | 'createdAt' | 'modifiedAt'>

export interface PpePerformanceKpi {
  totalCount: number
  okCount: number
  failCount: number
  pendingCount: number
}

// ════════════════════════════════════════════════════════════════════
// 8. 비용·예산
// ════════════════════════════════════════════════════════════════════
export interface PpeBudget extends PpeAuditFields {
  id: number
  budgetYear?: number
  department?: string
  budgetAmount?: number
  spentAmount?: number
  remainingAmount?: number  // 백엔드 계산
  spentRate?: number        // 백엔드 계산 (%)
  note?: string
}
export type PpeBudgetRequest = Omit<PpeBudget, 'id' | 'createdAt' | 'modifiedAt' | 'remainingAmount' | 'spentRate'>

export interface PpeBudgetKpi {
  totalBudget: number
  totalSpent: number
  remaining: number
  spentRate: number
}
