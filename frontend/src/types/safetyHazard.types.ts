export interface SafetyHazardItem {
  id?: number
  formId?: number
  processActivity?: string
  machineName?: string
  machineQty?: number
  chemicalName?: string
  chemicalQty?: string
  exposureTime?: string
  workerComp1?: boolean
  workerComp2?: boolean
  workerComp3?: boolean
  workerComp4?: boolean
  workerComp5?: boolean
  workerComp6?: boolean
  shiftWork1?: boolean
  shiftWork2?: boolean
  shiftWork3?: boolean
  heavyLoad1?: boolean
  heavyLoad2?: boolean
  heavyLoad3?: boolean
  permitWork?: string
  specialTraining?: string
  sortOrder?: number
}

export interface SafetyHazardForm {
  id?: number
  title: string
  description?: string
  divisionName?: string
  departmentName?: string
  evaluator?: string
  surveyDate?: string
  teamMembers?: string
  createdByName?: string
  modifiedByName?: string
  createdAt?: string
  modifiedAt?: string
  items?: SafetyHazardItem[]
}

export type SafetyHazardFormRequest = Omit<SafetyHazardForm, 'id' | 'createdAt' | 'modifiedAt' | 'createdByName' | 'modifiedByName'>
