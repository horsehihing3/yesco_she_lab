// ===== Workplace Measurement (작업환경측정) =====
export type MeasurementStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'
export type MeasurementHalf = 'FIRST' | 'SECOND'
export type FactorType = 'CHEMICAL' | 'PHYSICAL' | 'DUST' | 'BIOLOGICAL'
export type MeasurementResultStatus = 'normal' | 'caution' | 'exceeded'
export type OverallMeasurementResult = 'PASS' | 'FAIL' | 'PARTIAL'

export interface WorkplaceMeasurement {
  id: number
  measurementId: string
  workPlaceId?: number
  measurementYear: number
  measurementHalf: MeasurementHalf
  measurementDate?: string
  measurementAgency?: string
  measurementSite?: string
  measurementSiteDetail?: string
  status: MeasurementStatus
  overallResult?: OverallMeasurementResult
  notes?: string
  authorName?: string
  authorEmail?: string
  authorDept?: string
  createdAt: string
  modifiedAt: string
  details?: WorkplaceMeasurementDetail[]
}

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

export interface WorkplaceMeasurementRequest {
  workPlaceId?: number
  measurementYear: number
  measurementHalf: MeasurementHalf
  measurementDate?: string
  measurementAgency?: string
  measurementSite?: string
  measurementSiteDetail?: string
  status?: MeasurementStatus
  overallResult?: OverallMeasurementResult
  notes?: string
  authorName?: string
  authorEmail?: string
  authorDept?: string
  details?: WorkplaceMeasurementDetailRequest[]
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

// ===== PPE Issuance (보호구 지급) =====
export type PpeType = 'RESPIRATORY' | 'HEARING' | 'EYE' | 'HAND' | 'FOOT' | 'HEAD' | 'BODY' | 'FALL' | 'OTHER'

export interface PpeIssuance {
  id: number
  issuanceId: string
  employeeId: string
  employeeName?: string
  employeeDept?: string
  employeeEmail?: string
  workPlaceId?: number
  ppeType: string
  ppeTypeEn?: string
  ppeTypeZh?: string
  ppeName?: string
  ppeModel?: string
  ppeImageFileId?: number
  quantity: number
  issuanceDate: string
  expiryDate?: string
  hazardousFactor?: string
  issuanceReason?: string
  receivedSignature?: boolean
  signatureDate?: string
  notes?: string
  authorName?: string
  authorEmail?: string
  authorDept?: string
  createdAt: string
  modifiedAt: string
}

export interface PpeIssuanceRequest {
  employeeId: string
  employeeName?: string
  employeeDept?: string
  employeeEmail?: string
  workPlaceId?: number
  ppeType: string
  ppeTypeEn?: string
  ppeTypeZh?: string
  ppeName?: string
  ppeModel?: string
  ppeImageFileId?: number
  quantity?: number
  issuanceDate: string
  expiryDate?: string
  hazardousFactor?: string
  issuanceReason?: string
  notes?: string
  authorName?: string
  authorEmail?: string
  authorDept?: string
}

// ===== Safety Education (안전보건교육) =====
export type EducationType = 'REGULAR' | 'SPECIAL' | 'HIRING' | 'CHANGE_JOB'
export type EducationStatus = 'PLANNED' | 'COMPLETED' | 'CANCELLED'

export interface SafetyEducation {
  id: number
  educationId: string
  workPlaceId?: number
  title: string
  titleEn?: string
  titleZh?: string
  educationType: EducationType
  educationCategory?: string
  educationDate: string
  educationHours?: number
  location?: string
  instructorName?: string
  instructorOrg?: string
  hazardousFactors?: string
  educationContent?: string
  attendeeCount: number
  status: EducationStatus
  notes?: string
  authorName?: string
  authorEmail?: string
  authorDept?: string
  createdAt: string
  modifiedAt: string
  attendees?: SafetyEducationAttendee[]
}

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

export interface SafetyEducationRequest {
  workPlaceId?: number
  title: string
  titleEn?: string
  titleZh?: string
  educationType: EducationType
  educationCategory?: string
  educationDate: string
  educationHours?: number
  location?: string
  instructorName?: string
  instructorOrg?: string
  hazardousFactors?: string
  educationContent?: string
  status?: EducationStatus
  notes?: string
  authorName?: string
  authorEmail?: string
  authorDept?: string
  attendees?: SafetyEducationAttendeeRequest[]
}

export interface SafetyEducationAttendeeRequest {
  attendeeName?: string
  attendeeEmail?: string
  attendeeDept?: string
  attendeeCompany?: string
  employeeId?: string
}
