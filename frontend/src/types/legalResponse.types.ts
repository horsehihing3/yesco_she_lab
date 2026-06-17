// 법규 대응 관리 타입

export interface LegalSearchItem {
  lawId?: string
  lawName: string
  lawType?: string
  competentOrg?: string
  promulgationNo?: string
  promulgationDt?: string
  enforceDt?: string
  revisionType?: string
  detailLink?: string
}

export interface LegalSearchResult {
  totalCount: number
  page: number
  size: number
  items: LegalSearchItem[]
}

export interface LegalRegistry {
  id?: number
  lawId?: string
  lawName: string
  lawType?: string
  category?: string
  competentOrg?: string
  promulgationNo?: string
  promulgationDt?: string
  enforceDt?: string
  status?: string
  detailLink?: string
  memo?: string
  createdByName?: string
  modifiedByName?: string
  createdAt?: string
  modifiedAt?: string
}

export interface LegalRevisionLog {
  id?: number
  lawId?: string
  lawName: string
  revisionType?: string
  revisionNo?: string
  revisionDt?: string
  enforceDt?: string
  summary?: string
  detailLink?: string
  reviewStatus?: string  // PENDING/IN_REVIEW/DONE/NEED_ACTION/NO_IMPACT
  impactLevel?: string   // HIGH/MID/LOW
  fetchedAt?: string
  createdAt?: string
  modifiedAt?: string
}

export interface LegalKpi {
  totalLaws: number
  pending: number
  inReview: number
  done: number
  needAction: number
}

export interface LegalFilter {
  id?: number
  allowedLaws?: string  // 개행 구분 키워드
  updatedAt?: string
}
