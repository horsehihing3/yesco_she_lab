export interface EhsPlan {
  id: number
  title: string
  titleEn?: string
  titleZh?: string
  planDetail?: string
  planDetailEn?: string
  planDetailZh?: string
  planCompany?: string
  planCategory?: string
  planDate?: string
  planEndDate?: string
  isAutoRegistration?: boolean
  authorEmail?: string
  recipients?: string
  createdAt: string
  modifiedAt: string
}

export interface EhsPlanRequest {
  title: string
  titleEn?: string
  titleZh?: string
  planDetail?: string
  planDetailEn?: string
  planDetailZh?: string
  planCompany?: string
  planCategory?: string
  planDate?: string
  planEndDate?: string
  isAutoRegistration?: boolean
  authorEmail?: string
  recipients?: string
}
