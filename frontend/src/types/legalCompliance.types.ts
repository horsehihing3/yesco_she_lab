// 법규 대응 — 4개 탭(법규검토/인허가/의무이행/개선등록) 도메인 타입

export interface LegalLaw {
  createdByUserId?: number | null
  createdByName?: string | null
  createdByTeam?: string | null
  createdByPosition?: string | null
  id: number
  category: string                  // 안전/환경/보건/화학물질/소방/전기
  lawName: string
  clause?: string                   // 개정 조항
  amendType?: string                // 일부개정/전부개정/신규제정/폐지
  promulgateDate?: string
  enforceDate?: string
  reviewer?: string
  reviewDueDate?: string
  reviewStatus: string              // 검토대기/검토중/완료-적용/완료-불해당
  applyYn?: string                  // 적용/불해당/검토중
  followUpAction?: string
  amendSummary?: string
  urgent?: boolean
  createdAt?: string
  modifiedAt?: string
}

export interface LegalLawRequest {
  category: string
  lawName: string
  clause?: string
  amendType?: string
  promulgateDate?: string
  enforceDate?: string
  reviewer?: string
  reviewDueDate?: string
  reviewStatus?: string
  applyYn?: string
  followUpAction?: string
  amendSummary?: string
  urgent?: boolean
}

export interface LegalLawStats {
  totalCount: number
  pendingCount: number
  doneCount: number
  doneApplyCount: number
  doneNotApplicableCount: number
  urgentCount: number
}

// ===== Permit =====
export interface LegalPermit {
  id: number
  permitType?: string               // 허가/신고/등록/검사/점검
  category?: string
  permitName: string
  baseLaw?: string
  agency?: string
  permitNo?: string
  issueDate?: string
  expireDate?: string
  ownerName?: string
  renewalPeriod?: string
  conditions?: string
  icon?: string
  createdAt?: string
  modifiedAt?: string
}

export interface LegalPermitRequest {
  permitType?: string
  category?: string
  permitName: string
  baseLaw?: string
  agency?: string
  permitNo?: string
  issueDate?: string
  expireDate?: string
  ownerName?: string
  renewalPeriod?: string
  conditions?: string
  icon?: string
}

export interface LegalPermitStats {
  totalCount: number
  validCount: number
  warnCount: number                 // D-60 이내
  urgentCount: number               // D-30 이내
}

// ===== Obligation =====
export interface LegalObligation {
  id: number
  obligationType?: string
  category?: string
  obligationName: string
  baseLaw?: string
  cycle?: string
  dept?: string
  ownerName?: string
  dueDate?: string
  nextDueDate?: string
  status: string                    // done/doing/delay/fail
  progress: number
  evidence?: string
  penalty?: string
  icon?: string
  createdAt?: string
  modifiedAt?: string
}

export interface LegalObligationRequest {
  obligationType?: string
  category?: string
  obligationName: string
  baseLaw?: string
  cycle?: string
  dept?: string
  ownerName?: string
  dueDate?: string
  nextDueDate?: string
  status?: string
  progress?: number
  evidence?: string
  penalty?: string
  icon?: string
}

export interface LegalObligationStats {
  totalCount: number
  doneCount: number
  doingCount: number
  delayCount: number
  failCount: number
  averageProgress: number
}

// ===== Improvement =====
export interface LegalImprovement {
  id: number
  improvementType?: string          // 법규준수/인허가/의무이행/자체발굴
  priority: string                  // high/mid/low
  title: string
  baseLaw?: string
  description?: string
  dept?: string
  ownerName?: string
  targetDate?: string
  source?: string
  colStatus: string                 // register/progress/review/done
  registeredDate?: string
  createdAt?: string
  modifiedAt?: string
}

export interface LegalImprovementRequest {
  improvementType?: string
  priority: string
  title: string
  baseLaw?: string
  description?: string
  dept?: string
  ownerName?: string
  targetDate?: string
  source?: string
  colStatus?: string
  registeredDate?: string
}

export interface LegalImprovementStats {
  totalCount: number
  registerCount: number
  progressCount: number
  reviewCount: number
  doneCount: number
  closeRate: number
}
