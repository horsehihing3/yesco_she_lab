// ===== Workplace Measurement (작업환경측정) =====
export type MeasurementStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'
export type MeasurementHalf = 'FIRST' | 'SECOND'
export type FactorType = 'CHEMICAL' | 'PHYSICAL' | 'DUST' | 'BIOLOGICAL'
export type MeasurementResultStatus = 'normal' | 'caution' | 'exceeded'
export type OverallMeasurementResult = 'PASS' | 'FAIL' | 'PARTIAL'

export interface WorkplaceMeasurementDetail {
  id: number
  measurementId: string
  hazardousFactor: string
  hazardousFactorEn?: string
  hazardousFactorZh?: string
  factorType: FactorType
  workProcess?: string
  measurementValue?: string
  exposureStandard?: string
  unit?: string
  resultRatio?: number
  resultStatus: MeasurementResultStatus
  employeeCount?: number
  notes?: string
  createdAt: string
}

export interface WorkplaceMeasurementDetailRequest {
  hazardousFactor: string
  hazardousFactorEn?: string
  hazardousFactorZh?: string
  factorType: FactorType
  workProcess?: string
  measurementValue?: string
  exposureStandard?: string
  unit?: string
  resultRatio?: number
  resultStatus?: string
  employeeCount?: number
  notes?: string
}

// ===== Pre-placement Exam (배치전 건강진단) =====
export type ExamResult = 'FIT' | 'CONDITIONAL_FIT' | 'UNFIT' | 'PENDING'
export type ExamStatus = 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'EXPIRED'

export interface PrePlacementExam {
  id: number
  examId: string
  employeeId: string
  employeeName?: string
  employeeDept?: string
  employeeEmail?: string
  workPlaceId?: number
  examDate?: string
  examYear: number
  targetJob?: string
  hazardousFactors?: string
  hospital?: string
  examResult?: ExamResult
  resultDetail?: string
  restrictionDetail?: string
  followUpRequired?: boolean
  followUpDate?: string
  status: ExamStatus
  notes?: string
  authorName?: string
  authorEmail?: string
  authorDept?: string
  createdAt: string
  modifiedAt: string
}

export interface PrePlacementExamRequest {
  employeeId: string
  employeeName?: string
  employeeDept?: string
  employeeEmail?: string
  workPlaceId?: number
  examDate?: string
  examYear: number
  targetJob?: string
  hazardousFactors?: string
  hospital?: string
  examResult?: ExamResult
  resultDetail?: string
  restrictionDetail?: string
  followUpRequired?: boolean
  followUpDate?: string
  status?: ExamStatus
  notes?: string
  authorName?: string
  authorEmail?: string
  authorDept?: string
}

// ===== Safety Education (안전보건교육) =====
export type EducationType = 'REGULAR' | 'SPECIAL' | 'HIRING' | 'CHANGE_JOB'
export type EducationStatus = 'PLANNED' | 'COMPLETED' | 'CANCELLED'

export interface SafetyEducationAttendee {
  id: number
  educationId: string
  attendeeName?: string
  attendeeEmail?: string
  attendeeDept?: string
  attendeeCompany?: string
  employeeId?: string
  isSigned: boolean
  signatureDate?: string
  createdAt: string
}

export interface SafetyEducationAttendeeRequest {
  attendeeName?: string
  attendeeEmail?: string
  attendeeDept?: string
  attendeeCompany?: string
  employeeId?: string
}
