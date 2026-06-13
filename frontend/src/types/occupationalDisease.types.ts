// 직업병 관리 — 7개 도메인

export interface OdPlan {
  createdByUserId?: number | null
  createdByName?: string | null
  createdByTeam?: string | null
  createdByPosition?: string | null
  id: number
  half: string                       // 상반기/하반기/수시
  orgName: string
  method?: string                    // 내원검진/출장검진
  startDate?: string
  endDate?: string
  targetCount: number
  hazardFactors?: string
  mgr?: string
  status: string                     // 계획/진행중/완료/취소
  note?: string
  createdAt?: string
  modifiedAt?: string
}

export interface OdWorker {
  createdByUserId?: number | null
  id: number
  employeeNo: string
  name: string
  dept?: string
  job?: string
  gender?: string
  birthDate?: string
  division: string                   // 정기/수시/배치전/미수검
  factor?: string
  carcinogenicity?: string
  exposurePeriod?: string
  examOrg?: string
  examDate?: string
  judge?: string                     // A/B/C1/C2/D1/D2 또는 빈값
  afterAction?: string
  actionDone?: string
  createdAt?: string
}

export interface OdOrg {
  createdByUserId?: number | null
  id: number
  name: string
  doctor?: string
  orgType?: string
  factors?: string
  costPerPerson?: number
  contractEnd?: string
  targetCount?: number
  createdAt?: string
}

export interface OdExposure {
  createdByUserId?: number | null
  id: number
  factorName: string
  factorClass?: string               // 화학적/물리적/생물학적
  dept?: string
  processName?: string
  measuredValue?: string
  twaStandard?: string
  exposureRatio?: number
  measureDate?: string
  workerCount?: number
  status?: string                    // danger/warn/ok
  action?: string
}

export interface OdAftercare {
  createdByUserId?: number | null
  id: number
  workerName: string
  dept?: string
  factor?: string
  judge?: string
  disease?: string
  actionsText?: string
  status?: string                    // 진행중/추적관찰/산재진행/완결
  urgent?: boolean
  dueDate?: string
}

export interface OdFitness {
  createdByUserId?: number | null
  id: number
  workerName: string
  dept?: string
  disease?: string
  evalDate?: string
  evalOrg?: string
  evalResult?: string
  recommendation?: string
  doneStatus?: string
}

export interface OdStats {
  planTotal: number
  planDoneCount: number
  planPlannedCount: number
  workerTotal: number
  workerD1Count: number
  workerD2Count: number
  workerCCount: number
  workerMissedCount: number
  workerCompletedCount: number
  aftercareTotal: number
  aftercareUrgentCount: number
  aftercareDoneCount: number
  exposureDangerCount: number
  exposureWarnCount: number
  exposureOkCount: number
}
