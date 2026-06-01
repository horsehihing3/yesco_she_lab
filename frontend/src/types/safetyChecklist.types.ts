export interface SafetyChecklistTemplate {
  id: number
  templateName: string
  description: string
  categoryType?: string
  note: string
  resultOptions: string
  sortOrder: number
  isActive: boolean
  inspectorName?: string
  inspectorSign?: string
  inspectorSignDate?: string
  reviewerName?: string
  reviewerSign?: string
  reviewerSignDate?: string
  approverName?: string
  approverSign?: string
  approverSignDate?: string
  itemCount?: number
  createdAt: string
  categories?: SafetyChecklistCategory[]
}

export interface SafetyChecklistCategory {
  id: number
  templateId: number
  categoryName: string
  sortOrder: number
  items?: SafetyChecklistItem[]
}

export interface SafetyChecklistItem {
  id: number
  categoryId: number
  itemNo: number
  classification?: string
  checkItem: string
  legalBasis: string
  checkResult?: string
  finding?: string
  actionDeadline?: string
  actionComplete?: boolean
  sortOrder: number
}

export interface SafetyChecklistInspection {
  id: number
  templateId: number
  templateName?: string
  inspectionDate: string
  department: string
  inspector: string
  site: string
  status: string
  remark: string
  createdAt: string
  results?: SafetyChecklistInspectionResult[]
}

export interface SafetyChecklistInspectionResult {
  id?: number
  inspectionId?: number
  itemId: number
  result: string
  actionDeadline?: string
  personInCharge?: string
  remark?: string
}

export interface SafetyChecklistInspectionRequest {
  templateId: number
  riskAssessmentId?: number
  inspectionDate: string
  department: string
  inspector: string
  site: string
  status: string
  remark?: string
  results: SafetyChecklistInspectionResult[]
}

export interface SafetyChecklistCategoryRequest {
  templateId: number
  categoryName: string
  sortOrder: number
}

export interface SafetyChecklistItemRequest {
  categoryId: number
  itemNo?: number
  classification?: string
  checkItem: string
  legalBasis?: string
  checkResult?: string
  finding?: string
  actionDeadline?: string
  actionComplete?: boolean
  sortOrder: number
}
