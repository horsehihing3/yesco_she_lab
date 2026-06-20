import { FlowNode } from './WorkflowFlowChart'

/**
 * 메뉴별 업무 흐름도 정의 레지스트리.
 * FlowChartButton 이 flowKey 로 조회한다. 키가 없으면 버튼은 렌더되지 않는다.
 *
 * 패턴(근거: docs/APPROVAL_STANDARD.md 표준 상태머신):
 *  - twoStage     : 2단계 결재 (DRAFT→PENDING_APPROVAL→APPROVED→COMPLETION_PENDING→DONE)
 *  - singleApproval: 단건 중앙 결재 (DRAFT→PENDING_APPROVAL→APPROVED/REJECTED)
 *  - simpleStatus : 단순 처리 (등록→진행→완료, 결재 개념 약함)
 *  - crud         : 기준정보·마스터 관리 (등록→조회→수정)
 */

export interface FlowSpec {
  title: string
  steps: FlowNode[]
}

// ── 패턴 빌더 ──────────────────────────────────────────────
const twoStage = (plan: string, exec: string, result = '레포트 출력'): FlowNode[] => [
  { kind: 'terminator', label: '시작' },
  { kind: 'process', label: plan },
  { kind: 'process', label: '계획 결재 상신' },
  { kind: 'decision', label: '계획\n승인?', rejectTo: 1 },
  { kind: 'process', label: exec },
  { kind: 'process', label: '완료 결재 상신' },
  { kind: 'decision', label: '완료\n승인?', rejectTo: 4 },
  { kind: 'io', label: result },
  { kind: 'terminator', label: '종료' },
]

const singleApproval = (create: string, done = '승인 완료'): FlowNode[] => [
  { kind: 'terminator', label: '시작' },
  { kind: 'process', label: create },
  { kind: 'process', label: '결재 상신' },
  { kind: 'decision', label: '승인?', rejectTo: 1, noLabel: '반려' },
  { kind: 'io', label: done },
  { kind: 'terminator', label: '종료' },
]

const simpleStatus = (create: string, mid: string, done: string): FlowNode[] => [
  { kind: 'terminator', label: '시작' },
  { kind: 'process', label: create },
  { kind: 'process', label: mid },
  { kind: 'io', label: done },
  { kind: 'terminator', label: '종료' },
]

const crud = (entity: string): FlowNode[] => [
  { kind: 'terminator', label: '시작' },
  { kind: 'process', label: `${entity} 등록` },
  { kind: 'io', label: '목록 조회·검색' },
  { kind: 'process', label: '상세 확인 / 수정' },
  { kind: 'terminator', label: '종료' },
]

// ── 메뉴별 흐름 정의 ──────────────────────────────────────
export const FLOW_SPECS: Record<string, FlowSpec> = {
  // 2단계 결재 워크플로
  kpiGoal:          { title: 'KPI 목표 업무 흐름도',      steps: twoStage('연간 계획 작성', 'KPI 실적 입력', '레포트 출력') },
  audit:            { title: '감사·점검 업무 흐름도',     steps: twoStage('감사 계획 수립', '감사 수행·결과 입력', '감사 보고서') },
  emr:              { title: '비상대응 업무 흐름도',      steps: twoStage('비상대응 계획 수립', '훈련 실시·결과 입력', '결과 보고') },
  legalCompliance:  { title: '법규 준수 업무 흐름도',     steps: twoStage('준수계획 수립', '이행·점검 결과 입력', '레포트 출력') },
  healthCheckup:    { title: '건강검진 업무 흐름도',      steps: twoStage('검진 계획 수립', '검진 시행·결과 입력', '검진 리포트') },
  siteSafety:       { title: '현장안전 업무 흐름도',      steps: twoStage('현장안전 계획 수립', '점검 실시·결과 입력', '레포트 출력') },
  riskAssessment:   { title: '위험성평가 업무 흐름도',    steps: twoStage('위험성평가 계획', '평가 실시·개선', '레포트 출력') },
  contractor:       { title: '협력업체 관리 흐름도',      steps: twoStage('협력업체 계획 등록', '평가·점검 결과 입력', '레포트 출력') },
  workEnvMeasure:   { title: '작업환경측정 업무 흐름도',  steps: twoStage('측정 계획 수립', '측정 실시·결과 입력', '결과 보고') },

  // 단건 중앙 결재
  ppe:              { title: 'PPE 지급 업무 흐름도',      steps: singleApproval('PPE 지급 신청', '지급 완료') },
  ptw:              { title: '작업허가(PTW) 흐름도',      steps: singleApproval('작업허가 신청', '작업 허가') },
  training:         { title: '교육 업무 흐름도',          steps: singleApproval('교육 신청', '수료 처리') },
  chemicalLife:     { title: '화학물질 도입 흐름도',      steps: singleApproval('화학물질 도입 신청', '도입 승인') },
  psm:              { title: '공정안전(PSM/MOC) 흐름도',  steps: singleApproval('변경관리(MOC) 신청', '변경 승인') },
  partnerPermit:    { title: '협력업체 출입·작업 흐름도', steps: singleApproval('출입·작업 신청', '작업 승인') },
  approvalManage:   { title: '결재 관리 흐름도',          steps: singleApproval('결재 상신 접수', '결재 처리') },
  approval:         { title: '내 결재 흐름도',            steps: singleApproval('결재 상신 접수', '승인/반려') },

  // 단순 처리(status)
  incident:         { title: '사고 대응 흐름도',          steps: simpleStatus('사고 접수·등록', '원인조사·조치', '종결 보고') },
  nearMiss:         { title: '아차사고 흐름도',           steps: simpleStatus('아차사고 등록', '원인분석·개선', '완료 처리') },
  waste:            { title: '폐기물 관리 흐름도',        steps: simpleStatus('폐기물 등록', '보관·처리 위탁', '처리 완료') },
  oshCommittee:     { title: '산업안전보건위원회 흐름도', steps: simpleStatus('위원회 개최 등록', '안건 심의·의결', '회의록 등록') },
  legalResponse:    { title: '법적 대응 흐름도',          steps: simpleStatus('대응 건 등록', '대응·조치 진행', '종결 처리') },
  waterQuality:     { title: '수질 관리 흐름도',          steps: simpleStatus('측정지점 등록', '측정·기록', '결과 보고') },
  legalFacility:    { title: '법정설비 관리 흐름도',      steps: simpleStatus('법정설비 등록', '점검·검사', '결과 기록') },
  occDisease:       { title: '직업병 관리 흐름도',        steps: simpleStatus('직업병 사례 등록', '조사·관리', '결과 보고') },
  occExposure:      { title: '직업적 노출 관리 흐름도',   steps: simpleStatus('노출 평가 등록', '측정·관리', '결과 보고') },
  diseasePrevent:   { title: '질병예방 관리 흐름도',      steps: simpleStatus('대상자 등록', '예방·관리 시행', '결과 기록') },
  ehsBudget:        { title: 'EHS 예산 관리 흐름도',      steps: simpleStatus('예산 계획 수립', '집행 등록', '실적 비교') },
  ehs:              { title: 'EHS 안전보건 흐름도',       steps: simpleStatus('문서·계획 등록', '시행·관리', '결과 공유') },
  myHealthCheckup:  { title: '내 건강검진 흐름도',        steps: simpleStatus('검진 대상 확인', '검진 수검', '결과 확인') },
  partnerSafety:    { title: '협력업체 안전관리 흐름도',  steps: simpleStatus('안전관리 계획 등록', '점검·평가', '결과 보고') },
  partnerOsh:       { title: '협력업체 노사협의 흐름도',  steps: simpleStatus('협의회 개최 등록', '안건 심의', '회의록 등록') },
  processActivity:  { title: '공정·활동 작업 흐름도',     steps: simpleStatus('작업 등록', '작업 진행·기록', '완료 처리') },

  // 기준정보·마스터·시스템 (CRUD)
  contractorReg:    { title: '협력업체 등록 흐름도',      steps: crud('협력업체') },
  chemicalMaster:   { title: '화학물질 마스터 흐름도',    steps: crud('화학물질') },
  chemicalMsdsProd: { title: '완제품 MSDS 흐름도',        steps: crud('완제품 MSDS') },
  chemicalMsdsRaw:  { title: '원료 MSDS 흐름도',          steps: crud('원료 MSDS') },
  chemicalReg:      { title: '화학물질 규제정보 흐름도',  steps: crud('규제정보') },
  codeManage:       { title: '공통코드 관리 흐름도',      steps: crud('공통코드') },
  buttonManage:     { title: '버튼 권한 관리 흐름도',     steps: crud('버튼 권한') },
  checklist:        { title: '체크리스트 관리 흐름도',    steps: crud('체크리스트') },
  workplaceDrawings:{ title: '도면 관리 흐름도',          steps: crud('도면') },
  approvalLine:     { title: '결재선 관리 흐름도',        steps: crud('결재선') },
  oshSign:          { title: '안전보건 표지 흐름도',      steps: crud('표지·게시물') },
  admin:            { title: '시스템 관리 흐름도',        steps: crud('관리 항목') },
  safetyAccidentInfo:{ title: '안전사고 정보 흐름도',     steps: crud('사고 정보') },
  safetyHazardInfo: { title: '위험정보 흐름도',           steps: crud('위험 정보') },
}

export type FlowKey = keyof typeof FLOW_SPECS
