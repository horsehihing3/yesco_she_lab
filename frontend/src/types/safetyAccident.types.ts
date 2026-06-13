export interface SafetyAccidentItem {
  id?: number
  formId?: number
  itemNo?: number
  accidentCase?: string
  accidentType?: string
  nearMiss?: number
  fatalAccident?: number
  leaveOver1month?: number
  leaveUnder1month?: number
  noLeave?: number
  frequency?: string
  processActivity?: string
  sortOrder?: number
}

export interface SafetyAccidentForm {
  id?: number
  title: string
  description?: string
  divisionName?: string
  departmentName?: string
  evaluator?: string
  surveyDate?: string
  createdByName?: string
  createdByTeam?: string
  createdByPosition?: string
  modifiedByName?: string
  modifiedByTeam?: string
  modifiedByPosition?: string
  createdAt?: string
  modifiedAt?: string
  items?: SafetyAccidentItem[]
}

export type SafetyAccidentFormRequest = Omit<SafetyAccidentForm, 'id' | 'createdAt' | 'modifiedAt' | 'createdByName' | 'modifiedByName'>
