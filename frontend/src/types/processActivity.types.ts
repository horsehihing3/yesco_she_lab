export interface ProcessActivityItem {
  id?: number
  processId?: number
  itemNo?: number
  workContent?: string
  excludeEval?: boolean
  applicableLaw?: string
  sortOrder?: number
}

export interface ProcessActivityProcess {
  id?: number
  formId?: number
  majorCategory?: string
  middleCategory?: string
  subCategory?: string
  sortOrder?: number
  items?: ProcessActivityItem[]
}

export interface ProcessActivityForm {
  id: number
  title: string
  description?: string
  divisionName?: string
  departmentName?: string
  evaluator?: string
  creationDate?: string
  teamMembers?: string
  createdAt?: string
  modifiedAt?: string
  processes?: ProcessActivityProcess[]
}

export interface ProcessActivityFormRequest {
  title: string
  description?: string
  divisionName?: string
  departmentName?: string
  evaluator?: string
  creationDate?: string
  teamMembers?: string
  processes: ProcessActivityProcess[]
}
