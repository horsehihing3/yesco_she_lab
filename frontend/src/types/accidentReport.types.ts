export interface AccidentReport {
  id: number
  caseDescription?: string
  disasterType?: string          // DISASTER_TYPE code
  isNearMiss: boolean             // 아차사고
  isFatal: boolean                // 사망자 발생
  leaveOverMonth: boolean         // 휴업재해 1개월 이상
  leaveUnderMonth: boolean        // 휴업재해 1개월 미만
  freqNone: boolean               // 발생빈도: 없음
  occurrenceCycle?: string        // 발생주기
  relatedProcess?: string         // 해당 공정/활동 및 작업
  sortOrder: number
  createdAt?: string
  modifiedAt?: string
}

export type AccidentReportRequest = Omit<AccidentReport, 'id' | 'createdAt' | 'modifiedAt'>
