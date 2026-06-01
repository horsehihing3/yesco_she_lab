export interface SafetyWorkStatistics {
  draft: number           // 작성
  review: number          // 검토
  reviewCompleted: number // 검토완료
  approved: number        // 승인(작업중)
  completed: number       // 작업완료
  rejected: number        // 반려
  total: number
}

export interface NearMissStatistics {
  pending: number         // 요청완료
  inProgress: number      // 조치중
  completed: number       // 조치완료
  rejected: number        // 반려
  approvalRequest: number // 승인요청(관리자)
  total: number
}

export interface RiskAssessmentStatistics {
  draft: number           // 작성중
  submitted: number       // 제출완료
  approved: number        // 승인
  rejected: number        // 반려
  approvalRequest: number // 승인요청(관리자)
  total: number
}

export interface DashboardStatistics {
  safetyWork: SafetyWorkStatistics
  nearMiss: NearMissStatistics
  riskAssessment: RiskAssessmentStatistics
}

export interface EhsPlanResponse {
  id: number
  title: string
  planDetail?: string
  planCompany?: string
  planCategory?: string
  planDate?: string
  planEndDate?: string
  isAutoRegistration?: boolean
  authorEmail?: string
  createdAt: string
  modifiedAt: string
}

export interface EhsAlertResponse {
  id: number
  alertId: string
  title: string
  titleEn?: string
  titleZh?: string
  detail?: string
  authorName?: string
  authorDept?: string
  authorEmail?: string
  authorCompany?: string
  isAutoRegistration: boolean
  views: number
  createdAt: string
  modifiedAt: string
}

export interface EhsMessageResponse {
  id: number
  messageId: string
  title: string
  titleEn?: string
  titleZh?: string
  category?: string
  subCategory?: string
  detail?: string
  detailEn?: string
  detailZh?: string
  authorName?: string
  authorRole?: string
  views: number
  sendDate?: string
  createdAt: string
  modifiedAt: string
}
