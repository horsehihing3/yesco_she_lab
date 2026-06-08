export interface TrainingApplication {
  id: number
  applicationNo: string
  courseId: number
  courseName: string
  courseDate: string | null
  applicantName: string
  applicantDept: string | null
  applicantPosition?: string | null
  applicantEmpNo: string | null
  applicantPhone: string | null
  applicantUsername: string | null
  applyDate: string | null
  status: string                  // PENDING / APPROVED / COMPLETED / REJECTED / CANCELLED
  reason: string | null
  mealOption: string | null
  transportOption: string | null
  approvedBy: string | null
  approvedAt: string | null
  rejectReason: string | null
  completionDate: string | null
  completionScore: string | null
  createdAt: string
  modifiedAt: string
}

export interface TrainingApplicationRequest {
  courseId: number
  applicantName?: string
  applicantDept?: string
  applicantEmpNo?: string
  applicantPhone?: string
  reason?: string
  mealOption?: string
  transportOption?: string
}
