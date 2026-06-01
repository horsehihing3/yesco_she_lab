// 소방·방제 시설 관리

export interface FireFacility {
  id: number
  mgmtNo: string
  name: string
  category?: string
  spec?: string
  qty?: string
  location?: string
  installDate?: string
  maker?: string
  makerNo?: string
  installer?: string
  lawBasis?: string
  checkCycle?: string
  lastCheck?: string
  nextCheck?: string
  status?: string
  mgrName?: string
  acquirePrice?: number
  note?: string
  createdAt?: string
  modifiedAt?: string
}

export interface FireInspection {
  id: number
  inspNo?: string
  inspName?: string
  inspType?: string
  org?: string
  applyDate?: string
  inspDate?: string
  inspector?: string
  result?: string
  cost?: number
  submitStatus?: string
  submitDate?: string
  summary?: string
  issue?: string
  plan?: string
  createdAt?: string
  modifiedAt?: string
}

export interface FireIssue {
  id: number
  issueNo?: string
  facility?: string
  issueType?: string
  foundDate?: string
  issueContent?: string
  actionContent?: string
  dueDate?: string
  progressPct?: number
  status?: string
  ownerName?: string
  createdAt?: string
  modifiedAt?: string
}

export interface FirePlan {
  id: number
  planType?: string
  lawBasis?: string
  cycle?: string
  planDate?: string
  org?: string
  target?: string
  cost?: string
  status?: string
  createdAt?: string
  modifiedAt?: string
}

export interface DisasterFacility {
  id: number
  mgmtNo: string
  name: string
  facType?: string
  location?: string
  capacity?: string
  material?: string
  chemical?: string
  installDate?: string
  checkCycle?: string
  lastCheck?: string
  nextCheck?: string
  status?: string
  mgrName?: string
  lawBasis?: string
  interlock?: string
  note?: string
  createdAt?: string
  modifiedAt?: string
}

export interface DisasterInspection {
  id: number
  inspDate: string
  facilityName?: string
  facType?: string
  location?: string
  checker?: string
  content?: string
  anomaly?: string
  actionTaken?: string
  doneStatus?: string
  nextCheck?: string
  createdAt?: string
  modifiedAt?: string
}

export interface FireContact {
  id: number
  orgType?: string
  orgName: string
  mainTel?: string
  emergencyTel?: string
  mgrName?: string
  mgrMobile?: string
  contractPeriod?: string
  coverage?: string
  note?: string
  createdAt?: string
  modifiedAt?: string
}

export interface FireDrill {
  id: number
  drillDate: string
  drillType?: string
  scenario?: string
  participants?: number
  evacTime?: string
  mgrName?: string
  fireDeptObs?: string
  result?: string
  improvement?: string
  createdAt?: string
  modifiedAt?: string
}

export interface FireCompliance {
  id: number
  title: string
  lawBasis?: string
  rate?: number
  items?: string  // "이름|값|1;이름|값|0" 형식
  createdAt?: string
  modifiedAt?: string
}

export interface FireReport {
  id: number
  reportType: string
  lawBasis?: string
  deadlineText?: string
  targetOrg?: string
  lastSubmit?: string
  nextSubmit?: string
  status?: string
  note?: string
  createdAt?: string
  modifiedAt?: string
}

export interface FireStats {
  facTotal: number
  facOk: number
  facWarn: number
  facBad: number
  facOkRate: number
  inspTotal: number
  inspPassed: number
  inspCondPass: number
  inspFailed: number
  issueOpen: number
  issueDone: number
  disTotal: number
  disOk: number
  disWarn: number
  disBad: number
  drillTotal: number
  drillYear: number
  contactTotal: number
  planTotal: number
}
