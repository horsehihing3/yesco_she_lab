// 방사선 관리 — 8 도메인 타입

export interface RadSource {
  id: number
  mgmtNo: string
  name: string
  sourceType?: string
  isotope?: string
  activity?: string
  maker?: string
  location?: string
  permitNo?: string
  permitDate?: string
  expireDate?: string
  status?: string
  ownerName?: string
  makerNo?: string
  note?: string
  createdAt?: string
  modifiedAt?: string
}

export interface RadWorker {
  id: number
  employeeNo: string
  name: string
  dept?: string
  job?: string
  workerType?: string
  nrscNo?: string
  dosimeterType?: string
  dosimeterNo?: string
  registerDate?: string
  lastEduDate?: string
  nextEduDate?: string
  status?: string
  createdAt?: string
  modifiedAt?: string
}

export interface RadDose {
  id: number
  workerId?: number
  workerName?: string
  dept?: string
  measureMonth: string
  dosimeterType?: string
  effectiveDose?: number
  handDose?: number
  lensDose?: number
  measureOrg?: string
  confirmNo?: string
  note?: string
  createdAt?: string
  modifiedAt?: string
}

export interface RadZone {
  id: number
  name: string
  zoneType?: string
  location?: string
  areaM2?: number
  measureCycle?: string
  ownerName?: string
  relatedSource?: string
  standardValue?: string
  accessRule?: string
  createdAt?: string
  modifiedAt?: string
}

export interface RadMeasurement {
  id: number
  measureDate: string
  zoneName?: string
  pointName?: string
  measureType?: string
  measureValue?: number
  unit?: string
  standardValue?: string
  device?: string
  measurer?: string
  evaluation?: string
  createdAt?: string
  modifiedAt?: string
}

export interface RadHealth {
  id: number
  employeeNo?: string
  workerName: string
  dept?: string
  examType?: string
  examDate?: string
  examOrg?: string
  judgment?: string
  cbcWbc?: string
  lensCheck?: string
  cumulativeDose?: number
  afterAction?: string
  nextExamDate?: string
  createdAt?: string
  modifiedAt?: string
}

export interface RadAccident {
  id: number
  accidentDate: string
  accidentType?: string
  location?: string
  cause?: string
  response?: string
  nrscReported?: boolean
  reportedAt?: string
  status?: string
  note?: string
  createdAt?: string
  modifiedAt?: string
}

export interface RadDrill {
  id: number
  drillDate: string
  drillType?: string
  scenario?: string
  participants?: number
  ownerName?: string
  result?: string
  improvement?: string
  createdAt?: string
  modifiedAt?: string
}

export interface RadStats {
  sourceTotal: number
  sourceValid: number
  sourceNear: number
  sourceExpired: number
  workerTotal: number
  workerNormal: number
  workerAlert: number
  doseAvg: number
  doseMax: number
  doseOverLimit: number
  zoneTotal: number
  measureTotal: number
  measureOverCount: number
  healthAbnormalCount: number
  accidentTotal: number
  accidentOpen: number
}
