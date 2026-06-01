export interface ErgonomicsAssessment {
  id: number
  assessmentId: string
  assessType: string
  department?: string
  workProcess: string
  workDescription?: string
  workerName?: string
  workerId?: string
  assessDate: string
  assessorName?: string
  score?: number
  riskLevel?: string
  affectedBodyParts?: string
  symptoms?: string
  improvementAction?: string
  improvementDeadline?: string
  improvementStatus?: string
  photoFileId?: number
  notes?: string
  createdAt: string
  modifiedAt: string
}

export interface ErgonomicsAssessmentRequest {
  assessType: string
  department?: string
  workProcess: string
  workDescription?: string
  workerName?: string
  workerId?: string
  assessDate: string
  assessorName?: string
  score?: number
  riskLevel?: string
  affectedBodyParts?: string
  symptoms?: string
  improvementAction?: string
  improvementDeadline?: string
  improvementStatus?: string
  photoFileId?: number
  notes?: string
}
