export interface HazardFactor {
  id: number
  hazardType: string
  factorName: string
  category: string
  process: string
  riskLevel: string
  measuredValue: string | null
  exposureStandard: string | null
  assessmentMethod: string | null
  assessmentScore: string | null
  casNumber: string | null
  exposureRoute: string | null
  vaccinationStatus: string | null
  targetGroup: string | null
  targetCount: number | null
  highRiskCount: number | null
  preventionStatus: string
  preventionDetail: string | null
  preventionRate: number
  lastCheckDate: string | null
  managerName: string | null
  managerDept: string | null
  remarks: string | null
  createdAt: string
  modifiedAt: string
}

export interface HazardFactorRequest {
  hazardType: string
  factorName: string
  category?: string
  process?: string
  riskLevel?: string
  measuredValue?: string
  exposureStandard?: string
  assessmentMethod?: string
  assessmentScore?: string
  casNumber?: string
  exposureRoute?: string
  vaccinationStatus?: string
  targetGroup?: string
  targetCount?: number
  highRiskCount?: number
  preventionStatus?: string
  preventionDetail?: string
  preventionRate?: number
  lastCheckDate?: string
  managerName?: string
  managerDept?: string
  remarks?: string
}
