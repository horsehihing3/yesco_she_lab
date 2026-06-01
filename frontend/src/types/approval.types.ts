// 승인 목록
export interface Approval {
  id: number
  approvalId: string
  type: string
  title: string
  content?: string
  applicantName: string
  applicantDept: string
  applicantEmail: string
  requestDate: string
  status: string
  approverName?: string
  approvalDate?: string
  rejectReason?: string
  createdAt: string
}

// 승인 라인 항목
export interface ApprovalLineItem {
  id: number
  approvalItemCode: string
  deptCode: string
  lineOrder: number
  approverName: string
  approverPosition: string
  approverEmail: string
  approverPhone?: string
  approverDept: string
  hasFinalAuthority: boolean
  createdAt: string
}
