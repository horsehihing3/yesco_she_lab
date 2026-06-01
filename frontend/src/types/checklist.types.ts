export interface ChecklistItem {
  id?: number
  category: string
  checkItem: string
  checkContent: string
  isNormal: string
  isAbnormal: string
  remarks: string
  checkStandard: string
  actionTaken: string
  confirm: string
}

export interface ChecklistTemplateMaster {
  id: number
  title: string
  checkDate?: string
  checker?: string
  checkManager?: string
  facilityManager?: string
  regUser?: string
  modUser?: string
  createdAt: string
  modifiedAt: string
  items?: ChecklistItem[]
}

export interface ChecklistTemplateMasterRequest {
  title: string
  checkDate?: string
  checker?: string
  checkManager?: string
  facilityManager?: string
  regUser?: string
  items: ChecklistItem[]
}

export interface ChecklistResultMaster {
  id: number
  title: string
  checkDate?: string
  checker?: string
  checkManager?: string
  facilityManager?: string
  templateId?: number
  regUser?: string
  modUser?: string
  createdAt: string
  modifiedAt: string
  items?: ChecklistItem[]
}

export interface ChecklistResultMasterRequest {
  title: string
  checkDate?: string
  checker?: string
  checkManager?: string
  facilityManager?: string
  templateId?: number
  regUser?: string
  items: ChecklistItem[]
}

export interface ExcelParseResult {
  title?: string
  checkDate?: string
  checker?: string
  checkManager?: string
  facilityManager?: string
  items: ChecklistItem[]
}
