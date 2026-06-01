export interface EhsAlert {
  id: number
  alertId: string
  title: string
  titleEn?: string
  titleZh?: string
  detail?: string
  detailEn?: string
  detailZh?: string
  authorName?: string
  authorDept?: string
  authorEmail?: string
  authorCompany?: string
  isAutoRegistration: boolean
  views: number
  createdAt: string
  modifiedAt: string
}

export interface EhsAlertRequest {
  title: string
  titleEn?: string
  titleZh?: string
  detail?: string
  detailEn?: string
  detailZh?: string
  authorName?: string
  authorDept?: string
  authorEmail?: string
  authorCompany?: string
  isAutoRegistration?: boolean
  sourceLang?: string  // 'ko' | 'en' | 'zh'
}
