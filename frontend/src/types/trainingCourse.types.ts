export interface TrainingCourse {
  id: number
  courseCode: string
  courseName: string
  category: string | null         // LEGAL_GENERAL / LEGAL_SPECIAL / NEW_HIRE / MANAGER / OTHER
  catType: string | null          // safety / health / environment / special / manager
  targetAudience: string | null
  durationHours: number | null
  cycle: string | null            // QUARTERLY / SEMI_ANNUAL / ANNUAL / AS_NEEDED
  legalRequired: boolean
  instructor: string | null
  description: string | null
  dateStart: string | null
  dateEnd: string | null
  location: string | null
  mode: string | null             // CLASSROOM / ONLINE / HYBRID
  status: string | null           // OPEN / CLOSED / PREPARING / ENDED
  totalSeats: number
  currentSeats: number
  lawBasis: string | null
  isActive: boolean
  createdBy: string | null
  createdAt: string
  modifiedAt: string
}

export interface TrainingCourseRequest {
  courseCode: string
  courseName: string
  category?: string
  catType?: string
  targetAudience?: string
  durationHours?: number
  cycle?: string
  legalRequired?: boolean
  instructor?: string
  description?: string
  dateStart?: string
  dateEnd?: string
  location?: string
  mode?: string
  status?: string
  totalSeats?: number
  currentSeats?: number
  lawBasis?: string
  isActive?: boolean
}
