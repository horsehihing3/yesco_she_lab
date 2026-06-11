export type RegStatus = 'APPROVED' | 'REVIEW' | 'HOLD'

export interface ContractorRegistration {
  id: number
  regNo: string
  createdByUserId?: number | null
  createdByName?: string | null
  createdByTeam?: string | null
  createdByPosition?: string | null

  // Step1
  bizNum: string
  corpNum?: string | null
  companyName: string
  ceoName: string
  bizType?: string | null
  bizCategory?: string | null
  zipCode?: string | null
  addr1?: string | null
  addr2?: string | null
  tel?: string | null
  fax?: string | null
  email?: string | null
  homepage?: string | null
  empSize?: string | null

  // Step2
  oshApply?: string | null
  safetyMgrStatus?: string | null
  healthMgrStatus?: string | null
  accRate?: number | null
  certifications?: string | null  // comma-separated
  riskEval?: string | null
  riskEvalDate?: string | null
  hazardFactors?: string | null   // comma-separated
  safetyRating?: number | null    // 0~5
  envRating?: number | null       // 0~5
  regStatus: RegStatus

  // Step3
  safetyMgrName?: string | null
  safetyMgrPosition?: string | null
  safetyMgrDept?: string | null
  safetyMgrTel?: string | null
  safetyMgrOfficeTel?: string | null
  safetyMgrEmail?: string | null
  healthMgrName?: string | null
  healthMgrPosition?: string | null
  healthMgrCert?: string | null
  healthMgrTel?: string | null
  healthMgrEmail?: string | null
  internalDept?: string | null
  internalName?: string | null
  internalTel?: string | null
  memo?: string | null

  // Step4
  contractStart?: string | null
  contractEnd?: string | null
  contractType?: string | null
  contractAmount?: number | null
  workZone?: string | null

  deleted?: boolean
  createdAt?: string
  modifiedAt?: string
  modifiedBy?: string | null
}

export type ContractorRegistrationRequest = Partial<Omit<ContractorRegistration, 'id' | 'regNo' | 'createdAt' | 'modifiedAt' | 'deleted'>>
