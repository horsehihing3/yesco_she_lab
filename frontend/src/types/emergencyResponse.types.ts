export interface EmergencyResponse {
  id: number
  responseId: string
  emergencyType: string
  status: string
  title: string
  description?: string
  location?: string
  reportedAt?: string
  respondedAt?: string
  resolvedAt?: string
  reporterName?: string
  reporterDept?: string
  commanderName?: string
  commanderDept?: string
  casualtiesCount?: number
  damageDescription?: string
  actionsTaken?: string
  lessonsLearned?: string
  drillYn?: boolean
  notes?: string
  createdAt: string
  modifiedAt: string
}

export interface EmergencyResponseRequest {
  emergencyType: string
  status?: string
  title: string
  description?: string
  location?: string
  reportedAt?: string
  respondedAt?: string
  resolvedAt?: string
  reporterName?: string
  reporterDept?: string
  commanderName?: string
  commanderDept?: string
  casualtiesCount?: number
  damageDescription?: string
  actionsTaken?: string
  lessonsLearned?: string
  drillYn?: boolean
  notes?: string
}
