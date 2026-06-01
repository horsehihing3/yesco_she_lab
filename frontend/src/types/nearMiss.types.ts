export type NearMissStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
export type IncidentType = 'ACCIDENT' | 'NEAR_MISS'

export interface NearMissAction {
  id: number
  nearMissId: string
  improvementMeasures?: string
  improvementMeasuresEn?: string
  improvementMeasuresZh?: string
  manageDept?: string
  responsiblePerson?: string
  responsiblePersonMail?: string
  responsiblePersonCompany?: string
  planDate?: string
  completeDate?: string
  createdAt?: string
}

export interface NearMissActionRequest {
  improvementMeasures?: string
  manageDept?: string
  responsiblePerson?: string
  responsiblePersonMail?: string
  responsiblePersonCompany?: string
  planDate?: string
  completeDate?: string
}

export interface NearMiss {
  id: number
  nearMissId: string
  incidentType?: IncidentType
  workPlaceId?: number
  workPlaceName?: string
  occTitle: string
  occTitleEn?: string
  occTitleZh?: string
  occDate?: string
  occSite?: string
  occFloor?: string
  occSiteInfo?: string
  occSiteX?: number
  occSiteY?: number
  occImageFileId?: number
  occInfo?: string
  occInfoEn?: string
  occInfoZh?: string
  company?: string
  authorName?: string
  authorEmail?: string
  authorDept?: string
  intensity?: number
  frequency?: number
  status: NearMissStatus
  createdAt: string
  modifiedAt: string
  actions?: NearMissAction[]
}

export interface NearMissRequest {
  incidentType?: IncidentType
  workPlaceId?: number
  occTitle: string
  occTitleEn?: string
  occTitleZh?: string
  occDate?: string
  occSite?: string
  occFloor?: string
  occSiteInfo?: string
  occSiteX?: number
  occSiteY?: number
  occImageFileId?: number
  occInfo?: string
  occInfoEn?: string
  occInfoZh?: string
  company?: string
  authorName?: string
  authorEmail?: string
  authorDept?: string
  intensity?: number
  frequency?: number
  status?: NearMissStatus
  actions?: NearMissActionRequest[]
}
