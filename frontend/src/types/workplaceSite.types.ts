export interface WorkplaceSite {
  id: number
  buildingNumber: string         // B30-0001
  siteName: string
  siteCode?: string
  siteType?: string
  industry?: string
  address?: string
  businessRegNo?: string
  sheManager?: string
  establishedDate?: string
  representativeContact?: string
  riskGrade?: string
  operationStatus: string
  notes?: string
  active: boolean
  createdAt: string
  modifiedAt: string
}

export interface WorkplaceSiteRequest {
  siteName: string
  siteCode?: string
  siteType?: string
  industry?: string
  address?: string
  businessRegNo?: string
  sheManager?: string
  establishedDate?: string
  representativeContact?: string
  riskGrade?: string
  operationStatus?: string
  notes?: string
}
