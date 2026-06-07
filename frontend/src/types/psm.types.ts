// 공정안전관리 (PSM/PSW/MOC) 타입

export type PsmCategory = 'EQUIP' | 'CHEM' | 'POWER' | 'VESSEL' | 'PIPE' | 'PSV'

export interface PsmData {
  id: number
  category: PsmCategory
  code: string
  nameKo: string
  typeLabel?: string | null
  location?: string | null
  manufacturer?: string | null
  installDate?: string | null
  designPressure?: string | null
  designTemperature?: string | null
  material?: string | null
  inspectionCycle?: string | null
  lastInspectionDate?: string | null
  nextInspectionDate?: string | null
  statusCode?: string | null   // NORMAL/PLAN/ABNORMAL/EXPIRED
  managerName?: string | null
  notes?: string | null
  extraA?: string | null
  extraB?: string | null
  extraC?: string | null
  casNumber?: string | null
  ghsClass?: string | null
  regulatedQtyKg?: number | null
  holdingQtyKg?: number | null
  psmTarget?: boolean | null
  setPressure?: string | null
  protectedEquip?: string | null
  createdByUserId?: number | null
  createdByName?: string | null
  modifiedByUserId?: number | null
  modifiedByName?: string | null
  createdAt?: string
  modifiedAt?: string
}

export type MocStatus = 'DRAFT' | 'REVIEWING' | 'APPROVING' | 'EDUCATING' | 'EXECUTING' | 'PSSR' | 'DONE' | 'REJECTED'

export interface PsmMoc {
  id: number
  mocNo: string
  changeType: 'PROCESS' | 'EQUIP' | 'MATERIAL' | 'PROCEDURE'
  title: string
  requesterName?: string | null
  requesterDept?: string | null
  requestDate?: string | null
  targetDate?: string | null
  reason?: string | null
  scope?: string | null
  riskMethod?: 'HAZOP' | 'WHATIF' | 'CHECKLIST' | null
  riskResult?: 'APPROVED' | 'CONDITIONAL' | 'REJECTED' | null
  riskReviewDate?: string | null
  riskOpinion?: string | null
  status: MocStatus
  planApproverName?: string | null
  planApprovedAt?: string | null
  completionApproverName?: string | null
  completionApprovedAt?: string | null
  rejectReason?: string | null
  createdByUserId?: number | null
  createdByName?: string | null
  modifiedByUserId?: number | null
  modifiedByName?: string | null
  createdAt?: string
  modifiedAt?: string
}

export interface PsmHazopItem {
  id?: number
  hazopId?: number
  itemNo?: number
  deviation?: string | null
  guideWord?: 'More' | 'Less' | 'No' | 'Reverse' | 'Other' | null
  cause?: string | null
  consequence?: string | null
  likelihood?: '낮음' | '중간' | '높음' | null
  severity?: '낮음' | '중간' | '높음' | null
  riskGrade?: '저' | '중' | '고' | null
  safeguard?: string | null
  owner?: string | null
  sortOrder?: number
  createdAt?: string
}

export type HazopStatus = 'IN_PROGRESS' | 'REVIEWING' | 'COMPLETED'

export interface PsmHazop {
  id: number
  hazopNo: string
  nodeName?: string | null
  pidDrawingNo?: string | null
  reviewDate?: string | null
  designIntent?: string | null
  teamLeader?: string | null
  secretary?: string | null
  status: HazopStatus
  items?: PsmHazopItem[]
  createdByUserId?: number | null
  createdByName?: string | null
  modifiedByUserId?: number | null
  modifiedByName?: string | null
  createdAt?: string
  modifiedAt?: string
}

export interface PsmDashboardSummary {
  totalEquip: number
  totalChem: number
  totalPower: number
  totalVessel: number
  totalPipe: number
  totalPsv: number
  totalMoc: number
  mocInProgress: number
  totalHazop: number
  totalWo: number
  totalIncident: number
  totalPtw: number
  ptwPending: number
  expiringCount: number
}

// ─── PTW ───
export type PermitType = 'HOT_WORK' | 'CONFINED_SPACE' | 'HEIGHT' | 'ELECTRICAL' | 'GENERAL'
export type PtwStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED' | 'EXPIRED'

export interface PsmPtwCheck {
  key: string
  label: string
  checked: boolean
  owner?: string
}

export interface PsmPtw {
  id: number
  ptwNo: string
  permitType: PermitType
  workName: string
  workLocation?: string | null
  startAt?: string | null
  endAt?: string | null
  supervisorName?: string | null
  supervisorDept?: string | null
  workDescription?: string | null
  safetyChecksJson?: string | null
  supervisorSign?: string | null
  supervisorSignedAt?: string | null
  ehsApproverName?: string | null
  ehsApprovedAt?: string | null
  opsApproverName?: string | null
  opsApprovedAt?: string | null
  status: PtwStatus
  rejectReason?: string | null
  relatedMocNo?: string | null
  relatedWoNo?: string | null
  createdByUserId?: number | null
  createdByName?: string | null
  modifiedByUserId?: number | null
  modifiedByName?: string | null
  createdAt?: string
  modifiedAt?: string
}

// ─── Work Order ───
export interface PsmWoOperation {
  no: string
  desc: string
  wc?: string
  hours?: number
  crew?: number
  status?: 'PENDING' | 'IN_PROGRESS' | 'DONE'
}
export interface PsmWoMaterial {
  code: string
  name: string
  qty?: number
  unit?: string
  status?: 'STOCK' | 'PURCHASING' | 'SHORT'
}
export type WoStatus = 'CREATED' | 'PLANNED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED'

export interface PsmWo {
  id: number
  woNo: string
  woType?: string | null
  priority?: string | null
  functionalLocation?: string | null
  equipmentNo?: string | null
  equipmentName?: string | null
  plantCode?: string | null
  workCenter?: string | null
  planStartDate?: string | null
  planEndDate?: string | null
  actualStartDate?: string | null
  actualEndDate?: string | null
  managerName?: string | null
  description?: string | null
  status: WoStatus
  laborCost?: number | null
  materialCost?: number | null
  outsourcingCost?: number | null
  otherCost?: number | null
  operationsJson?: string | null
  materialsJson?: string | null
  createdAt?: string
  modifiedAt?: string
}

// ─── Incident ───
export type IncidentType = 'LEAK' | 'FIRE' | 'EXPLOSION' | 'NEAR_MISS' | 'INJURY'
export type IncidentSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'NEAR'
export type IncidentStatus = 'DRAFT' | 'SUBMITTED' | 'CLOSED'

export interface PsmIncidentAction {
  no: number
  desc: string
  owner?: string
  due?: string
}

export interface PsmIncident {
  id: number
  incidentNo: string
  incidentType?: IncidentType | null
  occurAt?: string | null
  location?: string | null
  relatedEquipment?: string | null
  relatedMaterial?: string | null
  firstFinder?: string | null
  reporter?: string | null
  investigator?: string | null
  reportedAt?: string | null
  narrative?: string | null
  severity?: IncidentSeverity | null
  humanFactorsJson?: string | null
  technicalFactorsJson?: string | null
  why1?: string | null
  why2?: string | null
  why3?: string | null
  why4?: string | null
  why5?: string | null
  managementCause?: string | null
  deaths?: number | null
  seriousInjuries?: number | null
  minorInjuries?: number | null
  injuryType?: string | null
  damagedEquipment?: string | null
  propertyLoss?: number | null
  productionLoss?: number | null
  downtimeHours?: number | null
  envImpact?: string | null
  recoveryDate?: string | null
  actionsJson?: string | null
  technicalAction?: string | null
  managerialAction?: string | null
  similarCheckPlan?: string | null
  psmImprovement?: string | null
  status: IncidentStatus
  createdAt?: string
  modifiedAt?: string
}
