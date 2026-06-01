export interface WemPlan {
  id: number; planYear: number; processName: string; department: string | null
  hazardType: string | null; measurementCycle: string | null
  lastMeasurementDate: string | null; nextMeasurementDate: string | null
  status: string; measurementAgency: string | null; agencyCode: string | null
  contractPeriod: string | null; remarks: string | null; createdAt: string; modifiedAt: string
}
export interface WemPlanRequest {
  planYear?: number; processName: string; department?: string; hazardType?: string
  measurementCycle?: string; lastMeasurementDate?: string; nextMeasurementDate?: string
  status?: string; measurementAgency?: string; agencyCode?: string; contractPeriod?: string; remarks?: string
}
export interface WemFactor {
  id: number; factorName: string; factorNameEn: string | null; casNumber: string | null
  factorType: string | null; twa: string | null; stel: string | null; ceilingValue: string | null
  unit: string | null; msdsLinked: boolean; isPermitted: boolean; usedProcess: string | null
  remarks: string | null; createdAt: string; modifiedAt: string
}
export interface WemFactorRequest {
  factorName: string; factorNameEn?: string; casNumber?: string; factorType?: string
  twa?: string; stel?: string; ceilingValue?: string; unit?: string
  msdsLinked?: boolean; isPermitted?: boolean; usedProcess?: string; remarks?: string
}
export interface WemResult {
  id: number; processName: string; factorName: string; sampleType: string | null
  measuredValue: string | null; twaValue: string | null; stelValue: string | null
  exposureStandard: string | null; exceedRate: number | null; judgment: string | null
  hasReport: boolean; measurementDate: string | null; measurementAgency: string | null
  remarks: string | null; createdAt: string; modifiedAt: string
}
export interface WemResultRequest {
  processName: string; factorName: string; sampleType?: string; measuredValue?: string
  twaValue?: string; stelValue?: string; exposureStandard?: string; exceedRate?: number
  judgment?: string; hasReport?: boolean; measurementDate?: string; measurementAgency?: string; remarks?: string
}
export interface WemImprovement {
  id: number; processName: string; factorName: string; measuredValue: string | null
  exposureStandard: string | null; exceedRate: number | null; exceedLevel: string | null
  department: string | null; measurementDate: string | null; measurementAgency: string | null
  deadline: string | null; remainingDays: number | null; improvementPlan: string | null
  status: string; completionDate: string | null; remarks: string | null
  createdAt: string; modifiedAt: string
}
export interface WemImprovementRequest {
  processName: string; factorName: string; measuredValue?: string; exposureStandard?: string
  exceedRate?: number; exceedLevel?: string; department?: string; measurementDate?: string
  measurementAgency?: string; deadline?: string; improvementPlan?: string; status?: string
  completionDate?: string; remarks?: string
}
