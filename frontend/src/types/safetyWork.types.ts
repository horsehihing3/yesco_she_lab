export interface SafetyWork {
  id: number
  safetyWorkId: string
  title: string
  titleEn?: string
  titleZh?: string
  location: string
  startDate: string
  endDate: string
  partners: string
  partnersName: string
  managerName: string
  managerDept: string
  approverName: string
  approverMail: string
  approverDept: string
  approveDate: string
  status: string
  rejectComment: string
  rejectBy: string
  rejectDate: string
  authorName: string
  authorMail: string
  authorDept: string
  authorCompany: string
  completedDate: string
  createdAt: string
  modifiedAt: string
}

export interface SafetyWorkRequest {
  title: string
  titleEn?: string
  titleZh?: string
  location?: string
  startDate?: string
  endDate?: string
  partners?: string
  partnersName?: string
  managerName?: string
  managerDept?: string
  approverName?: string
  approverMail?: string
  approverDept?: string
  status?: string
  authorName?: string
  authorMail?: string
  authorDept?: string
  authorCompany?: string
}

export const SAFETY_WORK_STATUS = {
  DRAFT: { label: '작성중', color: 'default' as const },
  SUBMITTED: { label: '제출됨', color: 'info' as const },
  APPROVED: { label: '승인', color: 'success' as const },
  IN_PROGRESS: { label: '작업중', color: 'primary' as const },
  COMPLETED: { label: '완료', color: 'success' as const },
  REJECTED: { label: '반려', color: 'error' as const },
}
