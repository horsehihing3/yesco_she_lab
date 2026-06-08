export interface EhsMessage {
  id: number
  messageId: string
  title: string
  titleEn?: string
  titleZh?: string
  category?: string
  subCategory?: string
  recipient?: string
  recipientGroup?: string
  referrer?: string
  detail?: string
  detailEn?: string
  detailZh?: string
  authorName?: string
  authorRole?: string
  authorEmail?: string
  authorDept?: string
  authorPosition?: string
  authorCompany?: string
  views: number
  sendDate?: string
  entireOrNot?: boolean
  createdAt: string
  modifiedAt: string
}

export interface EhsMessageRequest {
  title: string
  titleEn?: string
  titleZh?: string
  category?: string
  subCategory?: string
  recipient?: string
  recipientGroup?: string
  referrer?: string
  detail?: string
  detailEn?: string
  detailZh?: string
  authorName?: string
  authorRole?: string
  authorEmail?: string
  authorDept?: string
  authorPosition?: string
  authorCompany?: string
  sendDate?: string
  entireOrNot?: boolean
  sourceLang?: string  // 'ko' | 'en' | 'zh'
}
