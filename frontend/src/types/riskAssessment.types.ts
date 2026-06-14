// 위험성 평가 변경 이력
export type RiskAssessmentLogAction =
  | 'FIELD_UPDATE'
  | 'STATUS_CHANGE'
  | 'CHECKLIST_SAVE'
  | 'ACTIVITY_PROCESS_SAVE'
  | 'APPROVAL_SUBMIT'
  | 'APPROVAL_APPROVED'
  | 'APPROVAL_REJECTED'
  | 'APPROVAL_COMPLETED'

export type RiskAssessmentLogActorRole = 'EDITOR' | 'SUBMITTER' | 'APPROVER' | 'REJECTOR'

export interface RiskAssessmentFieldChange {
  field: string
  before: string | null
  after: string | null
}

export interface RiskAssessmentLogEntry {
  id: number
  assessmentId: number
  riskId: string | null
  action: RiskAssessmentLogAction | string
  changedBy: string | null
  actorRole: RiskAssessmentLogActorRole | string | null
  detail: string | null
  fieldChanges: string | null
  rejectReason: string | null
  createdAt: string
}

// 위험성 평가 기본 정보
export interface RiskAssessment {
  id: number
  riskId: string
  title: string
  site: string
  authorName: string
  authorTeam?: string | null
  authorPosition?: string | null
  authorDept: string
  authorMail: string
  approverName?: string
  approverMail?: string
  // 계획/완료 결재 분리
  planApproverUserId?: number | null
  planApproverTeam?: string
  planApproverPosition?: string
  planApproverName?: string
  planApprovedAt?: string
  planApprovedBy?: string
  completionApproverUserId?: number | null
  completionApproverTeam?: string
  completionApproverPosition?: string
  completionApproverName?: string
  completionApprovedAt?: string
  completionApprovedBy?: string
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'COMPLETION_SUBMITTED' | 'REJECTED' | 'COMPLETED'
  riskRegisterCount: number
  detailCount?: number     // 체크리스트 항목 수 (tb_risk_assessment_detail row count)
  officeCount: number      // 사무업무 평가건수
  fieldCount: number       // 출장/현장 평가건수
  completedDate?: string
  rejectReason?: string
  allowResubmit?: boolean
  formId?: number       // 선택 시점의 위험성 평가 양식 ID (기록용)
  formTitle?: string    // 선택 시점 양식 제목 스냅샷 (양식이 삭제되어도 보존)
  // 사무업무 탭 Step 2/3/4 에 연결된 체크리스트 템플릿 ID
  officeChecklistId?: number | null
  sanupChecklistId?: number | null
  jungdaeChecklistId?: number | null
  createdAt: string
  modifiedAt: string
}

// 활동공정 목록표 (Step 1)
export interface RiskActivityProcess {
  id: number
  riskId: string
  majorCategoryIdx: number  // 1: 사무업무
  majorCategory: string
  detailAction: string      // 세부 활동공정
  evaluationDate?: string   // 평가일시
  evaluator?: string        // 평가자
  isTarget: boolean         // 대상 여부
  createdAt: string
}

// 위험성평가 상세 항목 (Step 2)
export interface RiskAssessmentDetail {
  id: number
  riskId: string
  activityProcessId: number
  riskIdx: number
  majorCategory: string
  detailAction: string      // 세부 활동공정
  risk4M: '기계적' | '인적' | '물적/환경' | '관리적'
  danger: string            // 위험
  expectedDisaster: string  // 예상재해
  target: string            // 피해대상
  currentSafetyMeasures: string  // 현재안전조치
  possibilityGrade: number  // 발생 가능성 등급 (X) 1-5
  resultGrade: number       // 발생 결과 등급 (Y) 1-5
  riskScore: number         // 리스크 점수 (X * Y)
  riskGrade: 'A' | 'B' | 'C'  // 리스크 등급
  isRegistered: boolean     // 등록 여부
  reductionMeasures?: string  // 감소대책
  improvedPossibilityGrade?: number  // 개선후 발생 가능성 등급
  improvedResultGrade?: number       // 개선후 발생 결과 등급
  improvedRiskScore?: number         // 개선후 리스크 점수
  improvedRiskGrade?: 'A' | 'B' | 'C'  // 개선후 리스크 등급
  createdAt: string
}

// 위험성 등록부 (Step 3)
export interface RiskRegister {
  id: number
  riskId: string
  registerNum: number       // 등록번호
  categoryNum: string       // 분류번호 (연도-분기)
  detailAction: string
  danger: string
  expectedDisaster: string
  target: string
  currentSafetyMeasures: string
  riskGrade: 'A' | 'B' | 'C'
  reductionMeasures: string
  approverName: string
  approverMail: string
  relatedInstructions?: string  // 관련지침
  createdAt: string
}

// Request DTOs
export interface RiskAssessmentRequest {
  title: string
  site: string
  authorName?: string
  authorTeam?: string
  authorPosition?: string
  authorDept?: string
  authorMail?: string
  approverName?: string
  approverMail?: string
  planApproverUserId?: number | null
  planApproverTeam?: string
  planApproverPosition?: string
  planApproverName?: string
  completionApproverUserId?: number | null
  completionApproverTeam?: string
  completionApproverPosition?: string
  completionApproverName?: string
  formId?: number
  officeChecklistId?: number | null
  sanupChecklistId?: number | null
  jungdaeChecklistId?: number | null
}

export interface RiskActivityProcessRequest {
  majorCategoryIdx: number
  majorCategory: string
  detailAction: string
  evaluationDate?: string
  evaluator?: string
  isTarget: boolean
}

export interface RiskAssessmentDetailRequest {
  activityProcessId: number
  riskIdx: number
  majorCategory: string
  detailAction: string
  risk4M: string
  danger: string
  expectedDisaster: string
  target: string
  currentSafetyMeasures: string
  possibilityGrade: number
  resultGrade: number
  isRegistered: boolean
  reductionMeasures?: string
  improvedPossibilityGrade?: number
  improvedResultGrade?: number
  createdAt?: string
}

// 위험성 등급 계산 헬퍼
export const calculateRiskScore = (possibility: number, result: number): number => {
  return possibility * result
}

export const getRiskGrade = (score: number): string => {
  if (score >= 15) return '매우높음(VH)'
  if (score >= 9) return '높음(H)'
  if (score >= 4) return '중간(M)'
  return '낮음(L)'
}

// 가능성(L) 평가 기준 - i18n 키 기반
export const POSSIBILITY_CRITERIA = [
  { score: 1, labelKey: 'possibility1Label', descKey: 'possibility1Desc', freqKey: 'possibility1Freq' },
  { score: 2, labelKey: 'possibility2Label', descKey: 'possibility2Desc', freqKey: 'possibility2Freq' },
  { score: 3, labelKey: 'possibility3Label', descKey: 'possibility3Desc', freqKey: 'possibility3Freq' },
  { score: 4, labelKey: 'possibility4Label', descKey: 'possibility4Desc', freqKey: 'possibility4Freq' },
  { score: 5, labelKey: 'possibility5Label', descKey: 'possibility5Desc', freqKey: 'possibility5Freq' },
]

// 중대성(S) 평가 기준 - i18n 키 기반
export const RESULT_CRITERIA = [
  { score: 1, labelKey: 'result1Label', descKey: 'result1Desc', exampleKey: 'result1Example' },
  { score: 2, labelKey: 'result2Label', descKey: 'result2Desc', exampleKey: 'result2Example' },
  { score: 3, labelKey: 'result3Label', descKey: 'result3Desc', exampleKey: 'result3Example' },
  { score: 4, labelKey: 'result4Label', descKey: 'result4Desc', exampleKey: 'result4Example' },
  { score: 5, labelKey: 'result5Label', descKey: 'result5Desc', exampleKey: 'result5Example' },
]

// 위험등급 판정 기준 - i18n 키 기반 (엑셀 기준: 낮음→매우높음 순)
export const RISK_GRADE_CRITERIA = {
  '낮음(L)': { rangeKey: 'gradeLRange', levelKey: 'gradeLLevel', colorKey: 'gradeLColor', actionKey: 'gradeLAction' },
  '중간(M)': { rangeKey: 'gradeMRange', levelKey: 'gradeMLevel', colorKey: 'gradeMColor', actionKey: 'gradeMAction' },
  '높음(H)': { rangeKey: 'gradeHRange', levelKey: 'gradeHLevel', colorKey: 'gradeHColor', actionKey: 'gradeHAction' },
  '매우높음(VH)': { rangeKey: 'gradeVHRange', levelKey: 'gradeVHLevel', colorKey: 'gradeVHColor', actionKey: 'gradeVHAction' },
}

// 위험성 평가서 (Form Template)
export interface RiskAssessmentFormMaster {
  id: number
  title: string
  description?: string
  regUser: string
  modUser: string
  createdAt: string
  modifiedAt: string
  itemCount?: number
  items?: RiskAssessmentFormItem[]
}

export interface RiskAssessmentFormItem {
  id: number
  formId: number
  riskIdx: number
  detailAction: string
  risk4M: string
  danger: string
  expectedDisaster: string
  target: string
  currentSafetyMeasures: string
  possibilityGrade: number
  resultGrade: number
  reductionMeasures: string
  improvementManager: string
  improvementDeadline: string
  improvedPossibilityGrade: number
  improvedResultGrade: number
  relatedLaw: string
  remark: string
  reviewer: string
  approverName: string
  currentFrequency?: number | null
  currentSeverity?: number | null
  currentRisk?: number | null
  currentGrade?: number | null
  codeNumber?: string
  improvedFrequency?: number | null
  improvedSeverity?: number | null
  improvedRisk?: number | null
  improvedGrade?: number | null
}

export interface RiskAssessmentFormRequest {
  title: string
  description?: string
  regUser?: string
  items: RiskAssessmentFormItemRequest[]
}

export interface RiskAssessmentFormItemRequest {
  riskIdx: number
  detailAction: string
  risk4M: string
  danger: string
  expectedDisaster: string
  target: string
  currentSafetyMeasures: string
  possibilityGrade: number
  resultGrade: number
  reductionMeasures: string
  improvementManager: string
  improvementDeadline: string
  improvedPossibilityGrade: number
  improvedResultGrade: number
  relatedLaw: string
  remark: string
  reviewer: string
  approverName: string
  currentFrequency?: number | null
  currentSeverity?: number | null
  currentRisk?: number | null
  currentGrade?: number | null
  codeNumber?: string
  improvedFrequency?: number | null
  improvedSeverity?: number | null
  improvedRisk?: number | null
  improvedGrade?: number | null
}
