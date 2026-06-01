export type CheckupStatus = 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'OVERDUE'
export type CheckupType = 'GENERAL' | 'SPECIAL' | 'HIRING'
export type OverallResult = 'A' | 'B' | 'C1' | 'C2' | 'D1' | 'D2'
export type ResultStatus = 'normal' | 'caution' | 'abnormal'

export type BodyPart =
  | 'head' | 'eye' | 'ear' | 'nose' | 'mouth' | 'neck'
  | 'chest' | 'heart' | 'lung' | 'abdomen' | 'back' | 'stomach' | 'largeIntestine' | 'liver' | 'pancreas'
  | 'leftShoulder' | 'rightShoulder' | 'leftArm' | 'rightArm' | 'leftHand' | 'rightHand'
  | 'leftLeg' | 'rightLeg' | 'leftKnee' | 'rightKnee'
  | 'leftFoot' | 'rightFoot' | 'leftAnkle' | 'rightAnkle'

export interface HealthCheckup {
  id: number
  checkupId: string
  employeeId: string
  employeeName: string
  employeeDept?: string
  employeeEmail?: string
  checkupYear: number
  checkupType?: string
  isTarget?: boolean
  checkupStatus: CheckupStatus
  checkupDate?: string
  hospital?: string
  overallResult?: string
  nextCheckupDate?: string
  notes?: string
  authorName?: string
  authorEmail?: string
  authorDept?: string
  createdAt: string
  modifiedAt: string
  details?: HealthCheckupDetail[]
}

export interface HealthCheckupDetail {
  id: number
  checkupId: string
  bodyPart: BodyPart
  category: string
  resultValue?: string
  referenceRange?: string
  resultStatus: ResultStatus
  notes?: string
  createdAt: string
}

export interface HealthCheckupRequest {
  employeeId: string
  employeeName?: string
  employeeDept?: string
  employeeEmail?: string
  checkupYear: number
  checkupType?: string
  isTarget?: boolean
  checkupStatus?: CheckupStatus
  checkupDate?: string
  hospital?: string
  overallResult?: string
  nextCheckupDate?: string
  notes?: string
  authorName?: string
  authorEmail?: string
  authorDept?: string
  details?: HealthCheckupDetailRequest[]
}

export interface HealthCheckupDetailRequest {
  bodyPart: string
  category: string
  resultValue?: string
  referenceRange?: string
  resultStatus?: string
  notes?: string
}
