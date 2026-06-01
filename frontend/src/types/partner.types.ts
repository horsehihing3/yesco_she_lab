// 협력업체 관리 — 2 도메인 타입

export interface PartnerEval {
  id: number
  contractorRegistrationId?: number | null
  companyName: string
  industry?: string
  mgrName?: string
  partnerMgr?: string
  contact?: string
  evalDate?: string
  scoreSafety?: number
  scoreHealth?: number
  scoreEnv?: number
  scoreMgmt?: number
  accidentCount?: number
  nextEvalDate?: string
  status?: string
  opinion?: string
  createdAt?: string
  modifiedAt?: string
}

export interface PartnerVisitor {
  id: number
  visitDt?: string
  visitorName: string
  companyName?: string
  position?: string
  contact?: string
  purpose?: string
  area?: string
  education?: string
  ppe?: string
  checkInTime?: string
  checkOutTime?: string
  stayHours?: string
  mgrName?: string
  idNumber?: string
  status?: string
  note?: string
  createdAt?: string
  modifiedAt?: string
}

export interface PartnerStats {
  evalTotal: number
  evalACount: number
  evalBCount: number
  evalCCount: number
  evalDCount: number
  evalPlannedCount: number
  evalReevalCount: number
  visitorToday: number
  visitorMonth: number
  visitorInside: number
  visitorBlocked: number
  visitorNoEdu: number
}
