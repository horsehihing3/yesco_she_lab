// ─── 타입 ───────────────────────────────────────────────────────────────────
export type Role = 'guest' | 'writer' | 'auditor' | 'superAdmin' | 'planApprover' | 'completionApprover'

export const ABSTRACT_ROLE_KEYS: ReadonlySet<string> = new Set([
  'guest', 'writer', 'auditor', 'superAdmin', 'planApprover', 'completionApprover',
])

export const GENERAL_ADMIN_ROLE_OPTIONS: { key: string; label: string }[] = [
  { key: 'EHS_ADMIN',           label: '회사 EHS 담당자' },
  { key: 'TEAM_ADMIN',          label: '팀 EHS 담당자' },
  { key: 'RISK_ASSESS_ADMIN',   label: '위험성 평가 관리자' },
  { key: 'NEAR_MISS_ADMIN',     label: '사고/아차사고 관리자' },
  { key: 'AUDIT_ADMIN',         label: '감사 및 점검 관리자' },
  { key: 'PERMIT_ADMIN',        label: '작업 허가 관리자' },
  { key: 'PPE_ADMIN',           label: '보호구 장비 관리자' },
  { key: 'TRAINING_ADMIN',      label: '교육·훈련 관리자' },
  { key: 'EMERGENCY_ADMIN',     label: '비상대응 관리자' },
  { key: 'HEALTH_ADMIN',        label: '검진 관리자' },
  { key: 'OCCUPATIONAL_ADMIN',  label: '직업건강 관리자' },
  { key: 'WORK_ENV_ADMIN',      label: '작업환경측정 관리자' },
  { key: 'ERGONOMICS_ADMIN',    label: '인체공학 관리자' },
  { key: 'CHEM_MASTER_ADMIN',   label: '화학물질 마스터·규제 관리자' },
  { key: 'CHEM_MSDS_RAW_ADMIN', label: '원료 MSDS 관리자' },
  { key: 'CHEM_MSDS_PROD_ADMIN',label: '제품 MSDS 관리자' },
  { key: 'CHEM_REG_ADMIN',      label: '해외 법규 관리자' },
  { key: 'CHEM_LIFECYCLE_ADMIN',label: '화학물질 Life-Cycle 관리자' },
  { key: 'ENV_MONITORING_ADMIN',label: '환경 모니터링 관리자' },
  { key: 'WASTE_ADMIN',         label: '폐기물 관리자' },
  { key: 'AIR_WATER_ADMIN',     label: '대기·수질 관리자' },
  { key: 'CARBON_ADMIN',        label: '탄소 관리자' },
  { key: 'COMPLIANCE_ADMIN',    label: '법규 준수 관리자' },
  { key: 'QNA_ADMIN',           label: 'Q&A 관리자' },
]

export interface ButtonRule {
  button: string
  roles: Record<Role, boolean>
  issue?: string
}

export interface StatusGroup {
  status: string
  statusLabel: string
  statusColor: 'default' | 'warning' | 'info' | 'success' | 'error' | 'primary'
  buttons: ButtonRule[]
  statusNote?: string
}

export interface MenuEntry {
  menuPath: string
  menuKey?: string   // 메뉴 관리의 MENU_TREE key — SYSTEM_ADMIN 숨김 여부 판단에 사용
  statuses: StatusGroup[]
}

// ─── 역할 컬럼 정의 ──────────────────────────────────────────────────────────
export const ROLES: { key: Role; label: string; desc: string }[] = [
  { key: 'guest',              label: '일반 사용자', desc: '로그인 사용자 (작성자·승인자·관리자 제외)' },
  { key: 'writer',             label: '작성자',      desc: '해당 레코드를 직접 작성한 사용자' },
  { key: 'auditor',            label: '감사원/점검자', desc: '감사 탭: 지정된 감사원 본인 / 점검 탭: 지정된 점검자 본인' },
  { key: 'superAdmin',         label: '슈퍼관리자',   desc: 'SYSTEM_ADMIN (Super Admin) 역할' },
  { key: 'planApprover',       label: '계획 승인자', desc: '레코드에 지정된 계획 승인자 본인' },
  { key: 'completionApprover', label: '완료 승인자', desc: '레코드에 지정된 완료 승인자 본인' },
]

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────
export const ALL_ON:        Record<Role, boolean> = { guest: true,  writer: true,  auditor: false, superAdmin: true,  planApprover: true,  completionApprover: true  }
export const ALL_OFF:       Record<Role, boolean> = { guest: false, writer: false, auditor: false, superAdmin: false, planApprover: false, completionApprover: false }
export const WRITER_ADMIN:  Record<Role, boolean> = { guest: false, writer: true,  auditor: false, superAdmin: true,  planApprover: false, completionApprover: false }
export const ADMIN_PLAN:    Record<Role, boolean> = { guest: false, writer: false, auditor: false, superAdmin: true,  planApprover: true,  completionApprover: false }
export const ADMIN_COMP:    Record<Role, boolean> = { guest: false, writer: false, auditor: false, superAdmin: true,  planApprover: false, completionApprover: true  }
export const WRITER_ONLY:   Record<Role, boolean> = { guest: false, writer: true,  auditor: false, superAdmin: false, planApprover: false, completionApprover: false }
export const AUDITOR_ADMIN: Record<Role, boolean> = { guest: false, writer: false, auditor: true,  superAdmin: true,  planApprover: false, completionApprover: false }

// ─── 셀 키 ───────────────────────────────────────────────────────────────────
export const cellKey = (mi: number, si: number, bi: number, role: Role) =>
  `${mi}_${si}_${bi}_${role}`

export function buildInitialState(): Record<string, boolean> {
  const state: Record<string, boolean> = {}
  DEFAULT_MENU_DATA.forEach((menu, mi) =>
    menu.statuses.forEach((sg, si) =>
      sg.buttons.forEach((btn, bi) =>
        ROLES.forEach(r => { state[cellKey(mi, si, bi, r.key)] = btn.roles[r.key] })
      )
    )
  )
  return state
}

// ─── 메뉴 데이터 (코드 분석 기반 — 버튼이 있는 상태만 표시) ─────────────────
export const DEFAULT_MENU_DATA: MenuEntry[] = [
  // ── EHS 경영 › 커뮤니케이션 › EHS 문서 ────────────────────────────────────
  {
    menuPath: 'EHS 경영 › 커뮤니케이션 › EHS 문서', menuKey: 'nav.ehsDocument',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: 'New (파일 업로드)', roles: WRITER_ADMIN }] },
    ],
  },

  // ── EHS 경영 › 커뮤니케이션 › EHS Plan ────────────────────────────────────
  {
    menuPath: 'EHS 경영 › 커뮤니케이션 › EHS Plan', menuKey: 'nav.ehsPlan',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: 'New', roles: WRITER_ADMIN }] },
      { status: 'DETAIL', statusLabel: '상세', statusColor: 'default',
        buttons: [
          { button: '수정', roles: WRITER_ADMIN },
          { button: '삭제', roles: WRITER_ADMIN },
        ] },
      { status: 'FORM', statusLabel: '등록/수정 폼', statusColor: 'default',
        buttons: [{ button: '저장', roles: WRITER_ADMIN }] },
    ],
  },

  // ── EHS 경영 › 커뮤니케이션 › EHS 직책자 명단 ────────────────────────────
  {
    menuPath: 'EHS 경영 › 커뮤니케이션 › EHS 직책자 명단', menuKey: 'nav.ehsOfficer',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: 'New', roles: WRITER_ADMIN }] },
      { status: 'DETAIL', statusLabel: '상세/편집', statusColor: 'default',
        buttons: [
          { button: '수정', roles: WRITER_ADMIN },
          { button: '삭제', roles: WRITER_ADMIN },
          { button: '저장', roles: WRITER_ADMIN },
        ] },
    ],
  },

  // ── EHS 경영 › 커뮤니케이션 › EHS 메시지 ─────────────────────────────────
  {
    menuPath: 'EHS 경영 › 커뮤니케이션 › EHS 메시지', menuKey: 'nav.ehsMessage',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: 'New', roles: WRITER_ADMIN }] },
      { status: 'DETAIL', statusLabel: '상세/편집', statusColor: 'default',
        buttons: [
          { button: '수정', roles: WRITER_ADMIN },
          { button: '삭제', roles: WRITER_ADMIN },
          { button: '저장', roles: WRITER_ADMIN },
        ] },
    ],
  },

  // ── EHS 경영 › 커뮤니케이션 › EHS 알림 ───────────────────────────────────
  {
    menuPath: 'EHS 경영 › 커뮤니케이션 › EHS 알림', menuKey: 'nav.ehsAlert',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: 'New', roles: WRITER_ADMIN }] },
      { status: 'DETAIL', statusLabel: '상세', statusColor: 'default',
        buttons: [
          { button: '수정', roles: WRITER_ADMIN },
          { button: '삭제', roles: WRITER_ADMIN },
        ] },
      { status: 'COMMENT', statusLabel: '댓글', statusColor: 'info',
        buttons: [
          { button: '댓글 등록', roles: ALL_ON },
          { button: '답글 등록', roles: ALL_ON },
          { button: '댓글 수정', roles: WRITER_ONLY },
          { button: '댓글 삭제', roles: WRITER_ONLY },
        ] },
    ],
  },

  // ── EHS 경영 › 커뮤니케이션 › 산업안전보건 위원회 ─────────────────────────
  {
    menuPath: 'EHS 경영 › 커뮤니케이션 › 산업안전보건 위원회', menuKey: 'nav.ehsOshCommittee',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: 'New', roles: WRITER_ADMIN }] },
      { status: 'DETAIL', statusLabel: '상세/편집', statusColor: 'default',
        buttons: [
          { button: '수정', roles: WRITER_ADMIN },
          { button: '삭제', roles: WRITER_ADMIN },
          { button: '참석자 서명 알림', roles: WRITER_ADMIN },
        ] },
    ],
  },

  // ── EHS 경영 › 커뮤니케이션 › 긴급 메일/문자 발송 ────────────────────────
  {
    menuPath: 'EHS 경영 › 커뮤니케이션 › 긴급 메일/문자 발송', menuKey: 'nav.ehsEmergency',
    statuses: [
      { status: 'FORM', statusLabel: '발송 폼', statusColor: 'default',
        buttons: [{ button: '긴급 발송', roles: WRITER_ADMIN }] },
    ],
  },

  // ── EHS 경영 › 커뮤니케이션 › Q&A ─────────────────────────────────────────
  {
    menuPath: 'EHS 경영 › 커뮤니케이션 › Q&A', menuKey: 'nav.ehsQna',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: 'New', roles: WRITER_ADMIN }] },
      { status: 'DETAIL', statusLabel: '상세', statusColor: 'default',
        buttons: [
          { button: '질문 수정', roles: WRITER_ADMIN },
          { button: '삭제',      roles: WRITER_ADMIN },
          { button: '답변 저장', roles: WRITER_ADMIN },
        ] },
    ],
  },

  // ── EHS 경영 › 커뮤니케이션 › 비상 연락망 ────────────────────────────────
  {
    menuPath: 'EHS 경영 › 커뮤니케이션 › 비상 연락망', menuKey: 'emr.tabs.contacts',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: 'New', roles: WRITER_ADMIN }] },
      { status: 'DETAIL', statusLabel: '상세/편집', statusColor: 'default',
        buttons: [
          { button: '수정', roles: WRITER_ADMIN },
          { button: '삭제', roles: WRITER_ADMIN },
          { button: '저장', roles: WRITER_ADMIN },
        ] },
    ],
  },

  // ── 연간계획 ──────────────────────────────────────────────────────────────
  {
    menuPath: 'EHS 경영 › KPI목표 › 연간계획', menuKey: 'pkg.annualPlan',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'DRAFT', statusLabel: '작성중', statusColor: 'default',
        buttons: [
          { button: '계획 결재 상신', roles: WRITER_ADMIN },
          { button: '수정',           roles: WRITER_ADMIN },
          { button: '삭제',           roles: WRITER_ADMIN },
        ] },
      { status: 'PENDING_APPROVAL', statusLabel: '승인대기', statusColor: 'warning',
        buttons: [
          { button: '반려',     roles: ADMIN_PLAN },
          { button: '계획 승인', roles: ADMIN_PLAN },
        ] },
    ],
  },

  // ── KPI 현황 ──────────────────────────────────────────────────────────────
  {
    menuPath: 'EHS 경영 › KPI목표 › KPI 현황', menuKey: 'pkg.kpiStatus',
    statuses: [
      { status: 'APPROVED', statusLabel: '작성중 (KPI 입력)', statusColor: 'default',
        statusNote: 'KPI현황 탭: 연간계획 APPROVED 상태를 "작성중"으로 표시',
        buttons: [
          { button: '저장 (KPI 값)',  roles: ALL_ON, issue: '권한 체크 없음 — 누구든 KPI 값 저장 가능' },
          { button: '완료 결재 상신', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 완료 결재 상신 가능' },
        ] },
      { status: 'COMPLETION_PENDING', statusLabel: '완료 결재 대기', statusColor: 'warning',
        buttons: [
          { button: '반려',     roles: ADMIN_COMP },
          { button: '완료 승인', roles: ADMIN_COMP },
        ] },
    ],
  },

  // ── 감사 계획 ─────────────────────────────────────────────────────────────
  {
    menuPath: 'EHS 경영 › 내부 감사 › 감사 계획', menuKey: 'audit.tabs.plan',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'PLAN', statusLabel: '작성중', statusColor: 'default',
        statusNote: '반려 시 PENDING_APPROVAL → PLAN 복귀 (별도 REJECTED 상태 없음)',
        buttons: [
          { button: '저장',           roles: WRITER_ADMIN },
          { button: '계획 결재 상신', roles: WRITER_ADMIN },
          { button: '수정',           roles: WRITER_ADMIN },
          { button: '삭제',           roles: WRITER_ADMIN },
        ] },
      { status: 'PENDING_APPROVAL', statusLabel: '계획 결재 상신', statusColor: 'info',
        buttons: [
          { button: '반려',     roles: ADMIN_PLAN },
          { button: '계획 승인', roles: ADMIN_PLAN },
        ] },
    ],
  },

  // ── 감사 실시 ─────────────────────────────────────────────────────────────
  {
    menuPath: 'EHS 경영 › 내부 감사 › 감사 실시', menuKey: 'audit.tabs.execution',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_OFF }] },
      { status: 'PREPARING', statusLabel: '준비중', statusColor: 'warning',
        buttons: [
          { button: '저장 (감사 정보)',   roles: AUDITOR_ADMIN },
          { button: '진행중 (상태 전환)', roles: AUDITOR_ADMIN },
        ] },
      { status: 'IN_PROGRESS', statusLabel: '진행중', statusColor: 'info',
        buttons: [
          { button: '저장 (감사 정보)', roles: AUDITOR_ADMIN },
          { button: '완료 결재 상신',   roles: AUDITOR_ADMIN },
        ] },
      { status: 'PENDING_CLOSE', statusLabel: '종료확인대기', statusColor: 'warning',
        buttons: [
          { button: '저장 (감사 정보)', roles: AUDITOR_ADMIN },
          { button: '반려',             roles: ADMIN_COMP },
          { button: '완료 승인',        roles: ADMIN_COMP },
        ] },
    ],
  },

  // ── 교육현황 (관리자) ──────────────────────────────────────────────────────
  {
    menuPath: 'EHS 경영 › 교육·훈련 › 교육현황 (관리자)', menuKey: 'training.tabs.statusAdmin',
    statuses: [
      { status: 'PENDING', statusLabel: '대기', statusColor: 'warning',
        buttons: [
          { button: '반려',      roles: ALL_ON, issue: '권한 체크 없음 — 누구든 반려 가능' },
          { button: '승인',      roles: ALL_ON, issue: '권한 체크 없음 — 누구든 승인 가능' },
          { button: '신청 취소', roles: ALL_ON, issue: '권한 체크 없음' },
        ] },
      { status: 'APPROVED', statusLabel: '확정', statusColor: 'primary',
        buttons: [
          { button: '수료',      roles: ALL_ON, issue: '권한 체크 없음 — 누구든 수료 처리 가능' },
          { button: '신청 취소', roles: ALL_ON, issue: '권한 체크 없음' },
        ] },
    ],
  },

  // ── 비상 계획 ─────────────────────────────────────────────────────────────
  {
    menuPath: 'EHS 경영 › 비상 훈련 › 비상 계획', menuKey: 'emr.tabs.plans',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'DRAFT', statusLabel: '작성중', statusColor: 'default',
        statusNote: '반려 시 PENDING_APPROVAL → DRAFT 복귀',
        buttons: [
          { button: '계획 결재 상신', roles: WRITER_ADMIN },
          { button: '수정',           roles: WRITER_ADMIN },
          { button: '삭제',           roles: WRITER_ADMIN },
        ] },
      { status: 'PENDING_APPROVAL', statusLabel: '승인대기', statusColor: 'warning',
        buttons: [
          { button: '반려',     roles: ADMIN_PLAN },
          { button: '계획 승인', roles: ADMIN_PLAN },
        ] },
    ],
  },

  // ── 비상 훈련 ─────────────────────────────────────────────────────────────
  {
    menuPath: 'EHS 경영 › 비상 훈련 › 비상 훈련', menuKey: 'emr.tabs.drills',
    statuses: [
      { status: 'SCHEDULED', statusLabel: '예정', statusColor: 'info',
        statusNote: '비상계획 승인 후 자동 생성 — 신규 등록 없음 / linkedPlan 상태에 따라 버튼 표시',
        buttons: [
          { button: '저장',           roles: ALL_ON, issue: '권한 체크 없음 — 누구든 저장 가능' },
          { button: '완료 결재 상신', roles: ALL_ON, issue: '권한 체크 없음 — linkedPlan=APPROVED 시 노출' },
          { button: '반려 (완료)',    roles: ADMIN_COMP },
          { button: '완료 승인',      roles: ADMIN_COMP },
        ] },
    ],
  },

  // ── 자원·장비 ─────────────────────────────────────────────────────────────
  {
    menuPath: 'EHS 경영 › 비상 훈련 › 자원·장비', menuKey: 'nav.emergencyResource',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: WRITER_ADMIN }] },
      { status: 'NORMAL',       statusLabel: '정상',   statusColor: 'success',
        buttons: [{ button: '수정', roles: WRITER_ADMIN }, { button: '삭제', roles: WRITER_ADMIN }] },
      { status: 'CHECK_NEEDED', statusLabel: '점검필요', statusColor: 'warning',
        buttons: [{ button: '수정', roles: WRITER_ADMIN }, { button: '삭제', roles: WRITER_ADMIN }] },
      { status: 'DEFECTIVE',    statusLabel: '불량',   statusColor: 'error',
        buttons: [{ button: '수정', roles: WRITER_ADMIN }, { button: '삭제', roles: WRITER_ADMIN }] },
      { status: 'DISPOSED',     statusLabel: '폐기',   statusColor: 'default',
        buttons: [{ button: '수정', roles: WRITER_ADMIN }, { button: '삭제', roles: WRITER_ADMIN }] },
    ],
  },

  // ── 법규검토시스템 ──────────────────────────────────────────────────────────
  {
    menuPath: 'EHS 경영 › 법규 대응 › 법규검토시스템', menuKey: 'lc.tabs.law',
    statuses: [
      { status: 'LIST',   statusLabel: '목록',   statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: WRITER_ADMIN }] },
      { status: 'DETAIL', statusLabel: '상세/편집', statusColor: 'default',
        buttons: [{ button: '수정', roles: WRITER_ADMIN }, { button: '삭제', roles: WRITER_ADMIN }] },
    ],
  },

  // ── 법규 대응 계획 ───────────────────────────────────────────────────────────
  {
    menuPath: 'EHS 경영 › 법규 대응 › 법규 대응 계획', menuKey: 'lc.tabs.plan',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'PLAN', statusLabel: '작성중', statusColor: 'default',
        statusNote: '반려 시 PENDING_APPROVAL → PLAN 복귀',
        buttons: [
          { button: '저장',           roles: WRITER_ADMIN },
          { button: '계획 결재 상신', roles: WRITER_ADMIN },
          { button: '수정',           roles: WRITER_ADMIN },
          { button: '삭제',           roles: WRITER_ADMIN },
        ] },
      { status: 'PENDING_APPROVAL', statusLabel: '계획 결재 상신', statusColor: 'info',
        buttons: [
          { button: '반려',     roles: ADMIN_PLAN },
          { button: '계획 승인', roles: ADMIN_PLAN },
        ] },
    ],
  },

  // ── 법규 대응 실시 ───────────────────────────────────────────────────────────
  {
    menuPath: 'EHS 경영 › 법규 대응 › 법규 대응 실시', menuKey: 'lc.tabs.execution',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_OFF }] },
      { status: 'PREPARING', statusLabel: '준비중', statusColor: 'warning',
        statusNote: '법규 대응 계획 승인 후 자동 생성',
        buttons: [
          { button: '저장 (감사 정보)',   roles: ALL_ON },
          { button: '진행중 (상태 전환)', roles: ALL_ON },
        ] },
      { status: 'IN_PROGRESS', statusLabel: '진행중', statusColor: 'info',
        buttons: [
          { button: '저장 (감사 정보)', roles: ALL_ON },
          { button: '완료 결재 상신',   roles: ALL_ON },
        ] },
      { status: 'PENDING_CLOSE', statusLabel: '종료확인대기', statusColor: 'warning',
        buttons: [
          { button: '저장 (감사 정보)', roles: ALL_ON },
          { button: '반려',             roles: ADMIN_COMP },
          { button: '완료 승인',        roles: ADMIN_COMP },
        ] },
    ],
  },

  // ── 위험성평가 ────────────────────────────────────────────────────────────
  {
    menuPath: '안전 관리 › 위험성 평가', menuKey: 'nav.riskAssessment',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: 'New', roles: ALL_ON }] },
      { status: 'DETAIL', statusLabel: '상세 (상태 무관)', statusColor: 'default',
        statusNote: 'RiskAssessmentTab은 canSee를 DETAIL로 호출, 실제 상태 조건은 컴포넌트에서 별도 체크',
        buttons: [
          { button: '수정', roles: WRITER_ADMIN },
          { button: '삭제', roles: WRITER_ADMIN },
        ] },
      { status: 'draft', statusLabel: '작성중', statusColor: 'default',
        buttons: [
          { button: '계획 결재 상신', roles: ALL_ON, issue: 'isAdmin = true 하드코딩' },
          { button: '수정', roles: WRITER_ADMIN },
          { button: '삭제', roles: WRITER_ADMIN },
        ] },
      { status: 'submitted', statusLabel: '승인대기', statusColor: 'warning',
        buttons: [
          { button: '반려',           roles: ALL_ON, issue: 'isAdmin = true → canApprovePlan 항상 true' },
          { button: '계획 결재 승인', roles: ALL_ON, issue: 'isAdmin = true → canApprovePlan 항상 true' },
        ] },
      { status: 'rejected', statusLabel: '반려', statusColor: 'error',
        statusNote: 'draft 상태와 동일한 버튼 노출',
        buttons: [
          { button: '계획 결재 상신', roles: ALL_ON, issue: 'isAdmin = true 하드코딩' },
          { button: '수정', roles: WRITER_ADMIN },
          { button: '삭제', roles: WRITER_ADMIN },
        ] },
      { status: 'approved', statusLabel: '작성중', statusColor: 'default',
        statusNote: '관리 모드에서는 approved 상태를 "작성중"으로 표시 (완료 결재 흐름)',
        buttons: [
          { button: '저장 (실시 내용)', roles: ALL_ON, issue: 'isAdmin = true 하드코딩' },
          { button: '완료 결재 상신',   roles: ALL_ON, issue: 'isAdmin = true 하드코딩' },
        ] },
      { status: 'completion_submitted', statusLabel: '완료 결재 대기', statusColor: 'warning',
        buttons: [
          { button: '반려 (완료)',     roles: ALL_ON, issue: 'isAdmin = true → canApproveCompletion 항상 true' },
          { button: '완료 결재 승인', roles: ALL_ON, issue: 'isAdmin = true → canApproveCompletion 항상 true' },
        ] },
    ],
  },

  // ── 작업허가 › 허가 신청 ──────────────────────────────────────────────────
  {
    menuPath: '안전 관리 › 작업 허가 › 허가 신청', menuKey: 'nav.permitToWork',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'DRAFT/REJECTED', statusLabel: '작성중 / 반려', statusColor: 'default',
        statusNote: 'DRAFT(신규) 또는 REJECTED(계획 반려 후) 상태 — 동일 버튼 노출',
        buttons: [
          { button: '계획 결재 상신', roles: ALL_ON, issue: '권한 체크 없음 — 내 허가 탭에서는 사실상 작성자만 보임' },
          { button: '수정', roles: WRITER_ADMIN },
          { button: '삭제', roles: WRITER_ADMIN },
        ] },
      { status: 'PENDING_APPROVAL/REQUESTED', statusLabel: '계획 결재 대기', statusColor: 'warning',
        statusNote: '전체 탭(mode=all)에서는 모든 사용자가 승인 가능 (⚠️ isAdminTab 체크)',
        buttons: [
          { button: '계획 결재 반려', roles: ADMIN_PLAN, issue: '전체 탭에서는 모든 사용자 승인 가능' },
          { button: '계획 결재 승인', roles: ADMIN_PLAN, issue: '전체 탭에서는 모든 사용자 승인 가능' },
        ] },
      { status: 'APPROVED', statusLabel: '승인완료', statusColor: 'info',
        statusNote: '완료 결재 흐름은 "작업 완료 후 점검" 탭에서 처리',
        buttons: [
          { button: '저장 (체크리스트)', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '완료 결재 상신',    roles: ALL_ON, issue: '권한 체크 없음' },
        ] },
      { status: 'COMPLETION_PENDING', statusLabel: '완료 결재 대기', statusColor: 'warning',
        statusNote: '완료승인자 미지정 시 모든 관리자 역할 사용자 승인 가능',
        buttons: [
          { button: '완료 결재 반려', roles: ADMIN_COMP },
          { button: '완료 결재 승인', roles: ADMIN_COMP },
        ] },
    ],
  },

  // ── 작업허가 › 작업 완료 후 점검 ────────────────────────────────────────────
  {
    menuPath: '안전 관리 › 작업 허가 › 작업 완료 후 점검', menuKey: 'nav.permitToWork',
    statuses: [
      { status: 'APPROVED', statusLabel: '점검 진행 중', statusColor: 'info',
        statusNote: '계획 결재 승인 후 체크리스트 점검 단계',
        buttons: [
          { button: '저장',           roles: AUDITOR_ADMIN },
          { button: '완료 결재 상신', roles: AUDITOR_ADMIN },
        ] },
      { status: 'COMPLETION_PENDING', statusLabel: '완료 결재 대기', statusColor: 'warning',
        statusNote: '완료승인자 미지정 시 isAdminRole 사용자에게도 completionApprover 역할 부여',
        buttons: [
          { button: '완료 결재 반려', roles: ADMIN_COMP },
          { button: '완료 결재 승인', roles: ADMIN_COMP },
        ] },
      { status: 'DONE', statusLabel: '완료', statusColor: 'success',
        buttons: [] },
    ],
  },

  // ── 안전 관리 › 보호구 장비 ───────────────────────────────────────────────────
  {
    menuPath: '안전 관리 › 보호구 장비 › 재고', menuKey: 'nav.ppeEquipment',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [
          { button: '신규 등록', roles: ALL_OFF },
        ] },
      { status: 'DETAIL', statusLabel: '상세', statusColor: 'default',
        buttons: [
          { button: '수정', roles: ALL_OFF },
          { button: '삭제', roles: ALL_OFF },
        ] },
    ],
  },
  {
    menuPath: '안전 관리 › 보호구 장비 › 지급 신청', menuKey: 'nav.ppeEquipment',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [
          { button: '신청 등록', roles: ALL_ON },
        ] },
      { status: 'REQUESTED', statusLabel: '신청', statusColor: 'info',
        buttons: [
          { button: '수정',   roles: WRITER_ONLY },
          { button: '취소',   roles: WRITER_ONLY },
          { button: '승인',   roles: ALL_OFF },
          { button: '반려',   roles: ALL_OFF },
          { button: '삭제',   roles: WRITER_ADMIN },
        ] },
      { status: 'APPROVED', statusLabel: '승인', statusColor: 'success',
        buttons: [
          { button: '지급완료', roles: ALL_OFF },
        ] },
      { status: 'ISSUED', statusLabel: '지급완료', statusColor: 'success',
        buttons: [
          { button: '반납', roles: ALL_OFF },
        ] },
    ],
  },

  // ── 협력 업체 관리 › 협력 업체 안전 관리 › 관리 탭 ──────────────────────────
  {
    menuPath: '협력 업체 관리 › 협력 업체 안전 관리 › 관리', menuKey: 'partner-safety.tab.manage',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'DRAFT', statusLabel: '작성중', statusColor: 'default',
        statusNote: '반려 시 PENDING_APPROVAL → DRAFT 복귀',
        buttons: [
          { button: '계획 결재 상신', roles: WRITER_ADMIN },
          { button: '수정',           roles: WRITER_ADMIN },
          { button: '삭제',           roles: WRITER_ADMIN },
        ] },
      { status: 'PENDING_APPROVAL', statusLabel: '계획 결재 대기', statusColor: 'warning',
        buttons: [
          { button: '반려',         roles: ADMIN_PLAN },
          { button: '계획 결재 승인', roles: ADMIN_PLAN },
        ] },
      { status: 'COMPLETION_PENDING', statusLabel: '완료 결재 대기', statusColor: 'warning',
        buttons: [
          { button: '완료 결재 반려', roles: ADMIN_COMP },
          { button: '완료 결재 승인', roles: ADMIN_COMP },
        ] },
    ],
  },

  // ── 협력 업체 관리 › 협력 업체 안전 관리 › 실행 탭 ──────────────────────────
  {
    menuPath: '협력 업체 관리 › 협력 업체 안전 관리 › 실행', menuKey: 'partner-safety.tab.execute',
    statuses: [
      { status: 'APPROVED', statusLabel: '승인완료', statusColor: 'info',
        statusNote: '계획 승인 후 이 탭에 노출 — 실행 URL 제공 / 작업자 서명 후 완료 결재 상신',
        buttons: [
          { button: '완료 결재 상신', roles: ALL_ON, issue: '권한 체크 없음 — 서명 데이터 있으면 누구든 상신 가능' },
        ] },
      { status: 'COMPLETION_PENDING', statusLabel: '완료 결재 대기', statusColor: 'warning',
        buttons: [
          { button: '완료 결재 반려', roles: ADMIN_COMP },
          { button: '완료 결재 승인', roles: ADMIN_COMP },
        ] },
    ],
  },

  // ── 협력 업체 관리 › 협력 업체 안전 관리 › 조회 탭 ──────────────────────────
  {
    menuPath: '협력 업체 관리 › 협력 업체 안전 관리 › 조회', menuKey: 'partner-safety.tab.view',
    statuses: [
      { status: 'COMPLETED', statusLabel: '완료', statusColor: 'success',
        statusNote: '완료 결재 승인된 실행 이력 조회 — 버튼 없음 (읽기 전용)',
        buttons: [] },
    ],
  },

  // ── 협력 업체 관리 › 협력 업체 위험성 평가 › 계획 ───────────────────────────
  {
    menuPath: '협력 업체 관리 › 협력 업체 위험성 평가 › 계획', menuKey: 'nav.partnerRiskAssessment',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: WRITER_ADMIN }] },
      { status: 'DRAFT/REJECTED', statusLabel: '작성중 / 반려', statusColor: 'default',
        statusNote: '반려 시 PENDING_APPROVAL → REJECTED 복귀',
        buttons: [
          { button: '계획 결재 상신', roles: WRITER_ADMIN },
          { button: '수정',           roles: WRITER_ADMIN },
          { button: '삭제',           roles: WRITER_ADMIN },
        ] },
      { status: 'PENDING_APPROVAL', statusLabel: '계획 결재 대기', statusColor: 'warning',
        statusNote: 'canApprove = SYSTEM_ADMIN · AUDIT_ADMIN · 지정 계획 승인자',
        buttons: [
          { button: '반려',           roles: ADMIN_PLAN },
          { button: '계획 결재 승인', roles: ADMIN_PLAN },
        ] },
    ],
  },

  // ── 협력 업체 관리 › 협력 업체 위험성 평가 › 평가서조회 담당승인자 ──────────
  {
    menuPath: '협력 업체 관리 › 협력 업체 위험성 평가 › 평가서조회 담당승인자', menuKey: 'nav.partnerRiskAssessment',
    statuses: [
      { status: 'APPROVED', statusLabel: '승인완료 (완료 결재 진행)', statusColor: 'info',
        statusNote: '계획 승인 후 이 탭에 노출 — 체크리스트 저장 후 완료 결재 상신',
        buttons: [
          { button: '저장',           roles: ALL_ON, issue: '권한 체크 없음 — 완료 결재 담당자만 접근하도록 개선 필요' },
          { button: '완료 결재 상신', roles: ALL_ON, issue: '권한 체크 없음' },
        ] },
      { status: 'COMPLETION_PENDING', statusLabel: '완료 결재 대기', statusColor: 'warning',
        statusNote: '완료 승인자 또는 SYSTEM_ADMIN · AUDIT_ADMIN',
        buttons: [
          { button: '반려',           roles: ADMIN_COMP },
          { button: '완료 결재 승인', roles: ADMIN_COMP },
        ] },
    ],
  },

  // ── 협력 업체 관리 › 협력 업체 위험성 평가 › 전체조회 (어드민) ───────────────
  {
    menuPath: '협력 업체 관리 › 협력 업체 위험성 평가 › 전체조회 (어드민)', menuKey: 'nav.partnerRiskAssessment',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: WRITER_ADMIN }] },
      { status: 'DRAFT/REJECTED', statusLabel: '작성중 / 반려', statusColor: 'default',
        buttons: [
          { button: '계획 결재 상신', roles: WRITER_ADMIN },
          { button: '수정',           roles: WRITER_ADMIN },
          { button: '삭제',           roles: WRITER_ADMIN },
        ] },
      { status: 'PENDING_APPROVAL', statusLabel: '계획 결재 대기', statusColor: 'warning',
        statusNote: '어드민 탭: canApprovePlan = isAdminMode(항상 true) — 설정 역할도 승인 가능',
        buttons: [
          { button: '반려',           roles: ADMIN_PLAN },
          { button: '계획 결재 승인', roles: ADMIN_PLAN },
        ] },
      { status: 'APPROVED', statusLabel: '승인완료 (완료 결재 진행)', statusColor: 'info',
        buttons: [
          { button: '저장',           roles: ALL_ON },
          { button: '완료 결재 상신', roles: ALL_ON },
        ] },
      { status: 'COMPLETION_PENDING', statusLabel: '완료 결재 대기', statusColor: 'warning',
        buttons: [
          { button: '반려',           roles: ADMIN_COMP },
          { button: '완료 결재 승인', roles: ADMIN_COMP },
        ] },
    ],
  },

  // ── 협력 업체 관리 › 협력 업체 작업 허가 ─────────────────────────────────────
  {
    menuPath: '협력 업체 관리 › 협력 업체 작업 허가', menuKey: 'nav.partnerPermit',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'DRAFT/REJECTED', statusLabel: '작성중 / 반려', statusColor: 'default',
        statusNote: '반려 시 PENDING_APPROVAL → REJECTED 복귀',
        buttons: [
          { button: '계획 결재 상신', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '수정', roles: WRITER_ADMIN },
          { button: '삭제', roles: WRITER_ADMIN },
        ] },
      { status: 'PENDING_APPROVAL/REQUESTED', statusLabel: '계획 결재 대기', statusColor: 'warning',
        buttons: [
          { button: '계획 결재 반려', roles: ADMIN_PLAN },
          { button: '계획 결재 승인', roles: ADMIN_PLAN },
        ] },
      { status: 'APPROVED', statusLabel: '승인완료', statusColor: 'info',
        buttons: [
          { button: '저장 (체크리스트)', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '완료 결재 상신',    roles: ALL_ON, issue: '권한 체크 없음' },
        ] },
      { status: 'COMPLETION_PENDING', statusLabel: '완료 결재 대기', statusColor: 'warning',
        buttons: [
          { button: '완료 결재 반려', roles: ADMIN_COMP },
          { button: '완료 결재 승인', roles: ADMIN_COMP },
        ] },
    ],
  },

  // ── 협력 업체 관리 › 협력 업체 평가 ──────────────────────────────────────────
  {
    menuPath: '협력 업체 관리 › 협력 업체 평가', menuKey: 'nav.partnerEval',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: WRITER_ADMIN }] },
      { status: '완료',   statusLabel: '완료',   statusColor: 'success',
        buttons: [{ button: '수정', roles: WRITER_ADMIN }, { button: '삭제', roles: WRITER_ADMIN }] },
      { status: '예정',   statusLabel: '예정',   statusColor: 'default',
        buttons: [{ button: '수정', roles: WRITER_ADMIN }, { button: '삭제', roles: WRITER_ADMIN }] },
      { status: '재평가', statusLabel: '재평가', statusColor: 'error',
        buttons: [{ button: '수정', roles: WRITER_ADMIN }, { button: '삭제', roles: WRITER_ADMIN }] },
    ],
  },

  // ── 협력 업체 관리 › EHS 협의체 ──────────────────────────────────────────────
  {
    menuPath: '협력 업체 관리 › EHS 협의체', menuKey: 'nav.partnerOshCommittee',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: 'New', roles: WRITER_ADMIN }] },
      { status: 'DETAIL', statusLabel: '상세/편집', statusColor: 'default',
        buttons: [
          { button: '수정', roles: WRITER_ADMIN },
          { button: '삭제', roles: WRITER_ADMIN },
          { button: '참석자 서명 알림', roles: WRITER_ADMIN },
        ] },
    ],
  },

  // ── 협력 업체 관리 › 협력 업체 등록 ──────────────────────────────────────────
  {
    menuPath: '협력 업체 관리 › 협력 업체 등록', menuKey: 'nav.partnerRegistration',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: 'New (신규 등록)', roles: WRITER_ADMIN }] },
      { status: 'DETAIL', statusLabel: '상세', statusColor: 'default',
        buttons: [
          { button: '수정', roles: WRITER_ADMIN },
          { button: '삭제', roles: WRITER_ADMIN },
        ] },
      { status: 'FORM', statusLabel: '등록/수정 폼', statusColor: 'default',
        buttons: [{ button: '등록 완료 / 저장', roles: WRITER_ADMIN }] },
    ],
  },

  // ── 건강검진 - 건강검진 계획 ───────────────────────────────────────────────────────
  {
    menuPath: '보건 관리 › 건강 검진 관리 › 건강검진 계획', menuKey: 'healthCheckup.tabs.plan',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'PLANNED', statusLabel: '계획', statusColor: 'default',
        buttons: [
          { button: '수정',           roles: WRITER_ADMIN },
          { button: '삭제',           roles: WRITER_ADMIN },
          { button: '계획 결재 상신', roles: WRITER_ADMIN },
        ] },
      { status: 'REJECTED', statusLabel: '반려', statusColor: 'error',
        buttons: [
          { button: '수정',           roles: WRITER_ADMIN },
          { button: '삭제',           roles: WRITER_ADMIN },
          { button: '계획 결재 상신', roles: WRITER_ADMIN },
        ] },
      { status: 'PENDING_APPROVAL', statusLabel: '승인대기', statusColor: 'warning',
        buttons: [
          { button: '반려',           roles: ADMIN_PLAN },
          { button: '계획 결재 승인', roles: ADMIN_PLAN },
        ] },
    ],
  },

  // ── 건강검진 - 검진 관리 ───────────────────────────────────────────────────────────
  {
    menuPath: '보건 관리 › 건강 검진 관리 › 검진 관리', menuKey: 'healthCheckup.tabs.admin',
    statuses: [
      { status: 'PENDING_COMPLETION', statusLabel: '완료 대기', statusColor: 'warning',
        buttons: [
          { button: '완료 승인', roles: ADMIN_COMP },
        ] },
    ],
  },

  // ── 건강검진 - 사후관리 ───────────────────────────────────────────────────────────
  {
    menuPath: '보건 관리 › 건강 검진 관리 › 사후관리', menuKey: 'healthCheckup.tabs.record',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: 'PDF 업로드', roles: WRITER_ADMIN }] },
      { status: 'DETAIL', statusLabel: '상세', statusColor: 'default',
        buttons: [
          { button: '삭제', roles: WRITER_ADMIN },
        ] },
    ],
  },

  // ── 건강검진 - 내 검진 이력 ──────────────────────────────────────────────────────────
  {
    menuPath: '보건 관리 › 건강 검진 관리 › 내 검진 이력', menuKey: 'healthCheckup.tabs.my',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'DETAIL', statusLabel: '상세', statusColor: 'default',
        buttons: [
          { button: '수정', roles: ALL_ON },
          { button: '삭제', roles: ALL_ON },
          { button: '저장', roles: ALL_ON },
        ] },
    ],
  },

  // ── 작업환경측정 › 유해인자 ──────────────────────────────────────────────
  {
    menuPath: '보건 관리 › 작업환경 측정 › 유해인자', menuKey: 'wem.factorTab',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'DETAIL', statusLabel: '상세/편집', statusColor: 'default',
        buttons: [
          { button: '수정', roles: WRITER_ADMIN },
          { button: '삭제', roles: WRITER_ADMIN },
          { button: '저장', roles: WRITER_ADMIN },
        ] },
    ],
  },

  // ── 작업환경측정 › 측정 계획 ──────────────────────────────────────────────
  {
    menuPath: '보건 관리 › 작업환경 측정 › 측정 계획', menuKey: 'wem.planTab',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'DETAIL', statusLabel: '상세/편집 (상태 무관)', statusColor: 'default',
        buttons: [
          { button: '수정', roles: WRITER_ADMIN },
          { button: '삭제', roles: WRITER_ADMIN },
          { button: '저장', roles: WRITER_ADMIN },
        ] },
    ],
  },

  // ── 작업환경측정 › 측정 결과 ──────────────────────────────────────────────
  {
    menuPath: '보건 관리 › 작업환경 측정 › 측정 결과', menuKey: 'wem.resultTab',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'DETAIL', statusLabel: '상세/편집', statusColor: 'default',
        buttons: [
          { button: '수정', roles: WRITER_ADMIN },
          { button: '삭제', roles: WRITER_ADMIN },
          { button: '저장', roles: WRITER_ADMIN },
        ] },
    ],
  },

  // ── 작업환경측정 › 개선 조치 ──────────────────────────────────────────────
  {
    menuPath: '보건 관리 › 작업환경 측정 › 개선 조치', menuKey: 'wem.improveTab',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'DETAIL', statusLabel: '상세/편집', statusColor: 'default',
        buttons: [
          { button: '수정', roles: WRITER_ADMIN },
          { button: '삭제', roles: WRITER_ADMIN },
          { button: '저장', roles: WRITER_ADMIN },
        ] },
    ],
  },

  // ── 직업병관리 - 검진계획 ────────────────────────────────────────────────
  {
    menuPath: '보건 관리 › 직업병 관리 › 검진계획', menuKey: 'od.tabs.plan',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: 'New', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'DETAIL', statusLabel: '상세/편집', statusColor: 'default',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '저장', roles: ALL_ON, issue: '권한 체크 없음' },
        ] },
    ],
  },

  // ── 직업병관리 - 검진현황 ────────────────────────────────────────────────
  {
    menuPath: '보건 관리 › 직업병 관리 › 검진현황', menuKey: 'od.tabs.status',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: 'New', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'DETAIL', statusLabel: '상세/편집', statusColor: 'default',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '저장', roles: ALL_ON, issue: '권한 체크 없음' },
        ] },
    ],
  },

  // ── 직업병관리 - 검진관리 ────────────────────────────────────────────────
  {
    menuPath: '보건 관리 › 직업병 관리 › 검진관리', menuKey: 'od.tabs.manage',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: 'New', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'DETAIL', statusLabel: '상세/편집', statusColor: 'default',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '저장', roles: ALL_ON, issue: '권한 체크 없음' },
        ] },
    ],
  },

  // ── 직업병관리 - 노출관리 ────────────────────────────────────────────────
  {
    menuPath: '보건 관리 › 직업병 관리 › 노출관리', menuKey: 'od.tabs.exposure',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: 'New', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'DETAIL', statusLabel: '상세/편집', statusColor: 'default',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '저장', roles: ALL_ON, issue: '권한 체크 없음' },
        ] },
    ],
  },

  // ── 직업병관리 - 사후관리 ─────────────────────────────────────────────────
  {
    menuPath: '보건 관리 › 직업병 관리 › 사후관리', menuKey: 'od.tabs.aftercare',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        statusNote: '사후관리 조치 및 업무적합성 평가 두 섹션에 각각 New 버튼',
        buttons: [
          { button: 'New (사후관리 조치)', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: 'New (업무적합성 평가)', roles: ALL_ON, issue: '권한 체크 없음' },
        ] },
      { status: 'DETAIL', statusLabel: '상세/편집', statusColor: 'default',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '저장', roles: ALL_ON, issue: '권한 체크 없음' },
        ] },
    ],
  },

  // ── 직업병관리 - 산재신청 ───────────────────────────────────────────
  {
    menuPath: '보건 관리 › 직업병 관리 › 산재신청', menuKey: 'od.tabs.sanjae',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'DRAFT', statusLabel: '작성중', statusColor: 'default',
        buttons: [
          { button: '수정', roles: WRITER_ADMIN },
          { button: '제출', roles: WRITER_ADMIN },
          { button: '삭제', roles: WRITER_ADMIN },
          { button: '저장', roles: WRITER_ADMIN },
        ] },
    ],
  },

  // ── 질병예방관리 - 근골격계 ──────────────────────────────────────────────
  {
    menuPath: '보건 관리 › 질병예방 관리 › 근골격계', menuKey: 'disease-prev.tab.msd',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'DETAIL', statusLabel: '상세/편집', statusColor: 'default',
        buttons: [
          { button: '수정', roles: ALL_ON },
          { button: '삭제', roles: ALL_ON },
          { button: '저장', roles: ALL_ON },
        ] },
    ],
  },

  // ── 질병예방관리 - 뇌심혈관 ──────────────────────────────────────────────
  {
    menuPath: '보건 관리 › 질병예방 관리 › 뇌심혈관', menuKey: 'disease-prev.tab.cvd',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'DETAIL', statusLabel: '상세/편집', statusColor: 'default',
        buttons: [
          { button: '수정', roles: ALL_ON },
          { button: '삭제', roles: ALL_ON },
          { button: '저장', roles: ALL_ON },
        ] },
    ],
  },

  // ── 질병예방관리 - 직무스트레스 ──────────────────────────────────────────────
  {
    menuPath: '보건 관리 › 질병예방 관리 › 직무스트레스', menuKey: 'disease-prev.tab.stress',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'DETAIL', statusLabel: '상세/편집', statusColor: 'default',
        buttons: [
          { button: '수정', roles: ALL_ON },
          { button: '삭제', roles: ALL_ON },
          { button: '저장', roles: ALL_ON },
        ] },
    ],
  },

  // ── 질병예방관리 - 호흡기피부 ──────────────────────────────────────────────
  {
    menuPath: '보건 관리 › 질병예방 관리 › 호흡기피부', menuKey: 'disease-prev.tab.resp',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'DETAIL', statusLabel: '상세/편집', statusColor: 'default',
        buttons: [
          { button: '수정', roles: ALL_ON },
          { button: '삭제', roles: ALL_ON },
          { button: '저장', roles: ALL_ON },
        ] },
    ],
  },

  // ── 질병예방관리 - 청력보존 ──────────────────────────────────────────────
  {
    menuPath: '보건 관리 › 질병예방 관리 › 청력보존', menuKey: 'disease-prev.tab.hearing',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'DETAIL', statusLabel: '상세/편집', statusColor: 'default',
        buttons: [
          { button: '수정', roles: ALL_ON },
          { button: '삭제', roles: ALL_ON },
          { button: '저장', roles: ALL_ON },
        ] },
    ],
  },

  // ── 질병예방관리 - 온열한랭 ──────────────────────────────────────────────
  {
    menuPath: '보건 관리 › 질병예방 관리 › 온열한랭', menuKey: 'disease-prev.tab.thermal',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'DETAIL', statusLabel: '상세/편집', statusColor: 'default',
        buttons: [
          { button: '수정', roles: ALL_ON },
          { button: '삭제', roles: ALL_ON },
          { button: '저장', roles: ALL_ON },
        ] },
    ],
  },

  // ── 질병예방관리 - 감염병 ──────────────────────────────────────────────
  {
    menuPath: '보건 관리 › 질병예방 관리 › 감염병', menuKey: 'disease-prev.tab.infect',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'DETAIL', statusLabel: '상세/편집', statusColor: 'default',
        buttons: [
          { button: '수정', roles: ALL_ON },
          { button: '삭제', roles: ALL_ON },
          { button: '저장', roles: ALL_ON },
        ] },
    ],
  },

  // ── 환경 › 폐기물 관리 ────────────────────────────────────────────────────
  {
    menuPath: '환경 관리 › 폐기물', menuKey: 'nav.envWaste',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'STORING',          statusLabel: '보관중',  statusColor: 'primary',
        buttons: [{ button: '수정', roles: WRITER_ADMIN }, { button: '삭제', roles: WRITER_ADMIN }] },
      { status: 'DISPOSAL_REQUEST', statusLabel: '처리요청', statusColor: 'warning',
        buttons: [{ button: '수정', roles: WRITER_ADMIN }, { button: '삭제', roles: WRITER_ADMIN }] },
      { status: 'PROCESSING',       statusLabel: '처리중',  statusColor: 'info',
        buttons: [{ button: '수정', roles: WRITER_ADMIN }, { button: '삭제', roles: WRITER_ADMIN }] },
    ],
  },

  // ── 방사선 › 사고·사건 ────────────────────────────────────────────────────
  {
    menuPath: '환경 관리 › 방사선관리 › 사고·사건', menuKey: 'nav.radiationMgmt',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '조사중',    statusLabel: '조사중',    statusColor: 'warning',
        buttons: [{ button: '수정', roles: WRITER_ADMIN }, { button: '삭제', roles: WRITER_ADMIN }] },
      { status: '재발방지중', statusLabel: '재발방지중', statusColor: 'info',
        buttons: [{ button: '수정', roles: WRITER_ADMIN }, { button: '삭제', roles: WRITER_ADMIN }] },
    ],
  },

  // ── 인허가 › 인허가 식별 ──────────────────────────────────────────────────
  {
    menuPath: '환경 관리 › 인허가 관리 › 인허가 식별', menuKey: 'permit-lc.tab.register',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '검토중', statusLabel: '검토중', statusColor: 'warning',
        buttons: [{ button: '수정', roles: WRITER_ADMIN }, { button: '삭제', roles: WRITER_ADMIN }] },
      { status: '미식별', statusLabel: '미식별', statusColor: 'error',
        buttons: [{ button: '수정', roles: WRITER_ADMIN }, { button: '삭제', roles: WRITER_ADMIN }] },
    ],
  },

  // ── 인허가 › 인허가 대장 ──────────────────────────────────────────────────
  {
    menuPath: '환경 관리 › 인허가 관리 › 인허가 대장', menuKey: 'permit-lc.tab.ledger',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '만료임박', statusLabel: '만료임박', statusColor: 'warning',
        buttons: [{ button: '수정', roles: WRITER_ADMIN }, { button: '삭제', roles: WRITER_ADMIN }] },
      { status: '만료',     statusLabel: '만료',     statusColor: 'error',
        buttons: [{ button: '수정', roles: WRITER_ADMIN }, { button: '삭제', roles: WRITER_ADMIN }] },
    ],
  },

  // ── 인허가 › 변경 관리 ────────────────────────────────────────────────────
  {
    menuPath: '환경 관리 › 인허가 관리 › 변경 관리', menuKey: 'permit-lc.tab.change',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '검토중/안전영향평가/허가신청/심사중', statusLabel: '진행 단계', statusColor: 'warning',
        statusNote: '검토중 → 안전영향평가 → 허가신청 → 심사중 → 승인 단계별 진행',
        buttons: [
          { button: '수정', roles: WRITER_ADMIN },
          { button: '삭제', roles: WRITER_ADMIN },
        ] },
    ],
  },

  // ── 인허가 › 법정 보고서 ──────────────────────────────────────────────────
  {
    menuPath: '환경 관리 › 인허가 관리 › 법정 보고서', menuKey: 'permit-lc.tab.report',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '준비중', statusLabel: '준비중', statusColor: 'info',
        buttons: [{ button: '수정', roles: WRITER_ADMIN }, { button: '삭제', roles: WRITER_ADMIN }] },
      { status: '임박',   statusLabel: '임박',   statusColor: 'warning',
        buttons: [{ button: '수정', roles: WRITER_ADMIN }, { button: '삭제', roles: WRITER_ADMIN }] },
      { status: '지연',   statusLabel: '지연',   statusColor: 'error',
        buttons: [{ button: '수정', roles: WRITER_ADMIN }, { button: '삭제', roles: WRITER_ADMIN }] },
    ],
  },


  // ── 화학물질 › 위해성 보고 ────────────────────────────────────────────────
  {
    menuPath: '화학물질 관리 › 위해성 보고',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'COLLECTING', statusLabel: '수집중', statusColor: 'primary',
        buttons: [{ button: '수정', roles: WRITER_ADMIN }, { button: '삭제', roles: WRITER_ADMIN }] },
    ],
  },
]
