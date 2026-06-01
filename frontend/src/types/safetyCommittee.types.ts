// 산업안전보건위원회 타입 정의

export interface SafetyCommittee {
  id: number
  committeeId: string
  year: number
  quarter: string
  meetingDate: string
  location: string
  agenda: string
  comment?: string
  attendeeCount: number
  createdAt: string
  updatedAt: string
  authorId: number
  authorName: string
}

export interface SafetyCommitteeRequest {
  year: number
  quarter: string
  meetingDate: string
  location: string
  agenda: string
  comment?: string
}

export interface CommitteeAttendee {
  id: number
  committeeId: number
  userId: number
  userName: string
  userEmail: string
  signed: boolean
  signedAt?: string
}

export interface CommitteeAttendeeRequest {
  userId: number
  userName: string
  userEmail: string
}
