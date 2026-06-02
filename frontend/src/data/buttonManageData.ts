// ─── 타입 ───────────────────────────────────────────────────────────────────
export type Role = 'guest' | 'writer' | 'admin' | 'planApprover' | 'completionApprover'

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
  statuses: StatusGroup[]
}

// ─── 역할 컬럼 정의 ──────────────────────────────────────────────────────────
export const ROLES: { key: Role; label: string; desc: string }[] = [
  { key: 'guest',              label: '일반 사용자', desc: '로그인 사용자 (작성자·승인자·관리자 제외)' },
  { key: 'writer',             label: '작성자',      desc: '해당 레코드를 직접 작성한 사용자' },
  { key: 'admin',              label: '관리자',      desc: 'SYSTEM_ADMIN / EHS_ADMIN / AUDIT_ADMIN 역할' },
  { key: 'planApprover',       label: '계획 승인자', desc: '레코드에 지정된 계획 승인자 본인' },
  { key: 'completionApprover', label: '완료 승인자', desc: '레코드에 지정된 완료 승인자 본인' },
]

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────
export const ALL_ON:      Record<Role, boolean> = { guest: true,  writer: true,  admin: true,  planApprover: true,  completionApprover: true  }
export const ALL_OFF:     Record<Role, boolean> = { guest: false, writer: false, admin: false, planApprover: false, completionApprover: false }
export const WRITER_ADMIN: Record<Role, boolean> = { guest: false, writer: true,  admin: true,  planApprover: false, completionApprover: false }
export const ADMIN_PLAN:   Record<Role, boolean> = { guest: false, writer: false, admin: true,  planApprover: true,  completionApprover: false }
export const ADMIN_COMP:   Record<Role, boolean> = { guest: false, writer: false, admin: true,  planApprover: false, completionApprover: true  }

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

// ─── 메뉴 데이터 (코드 분석 기반) ────────────────────────────────────────────
export const DEFAULT_MENU_DATA: MenuEntry[] = [
  // ── 연간계획 ──────────────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 계획KPI목표 › 연간계획',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'DRAFT', statusLabel: '작성중', statusColor: 'default',
        buttons: [
          { button: '계획 결재 상신', roles: WRITER_ADMIN },
          { button: '수정',           roles: WRITER_ADMIN },
          { button: '삭제',           roles: WRITER_ADMIN },
        ] },
      { status: 'PENDING_APPROVAL', statusLabel: '계획 결재 대기', statusColor: 'warning',
        buttons: [
          { button: '반려',     roles: ADMIN_PLAN },
          { button: '계획 승인', roles: ADMIN_PLAN },
        ] },
      { status: 'APPROVED',          statusLabel: '계획 승인',      statusColor: 'info',    buttons: [], statusNote: '완료 결재 상신/승인은 KPI현황 탭에서 처리' },
      { status: 'COMPLETION_PENDING', statusLabel: '완료 결재 대기', statusColor: 'warning', buttons: [], statusNote: 'KPI현황 탭에서 처리' },
      { status: 'DONE',              statusLabel: '완료',           statusColor: 'success', buttons: [] },
    ],
  },

  // ── KPI 현황 ──────────────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 계획KPI목표 › KPI 현황',
    statuses: [
      { status: 'LIST',    statusLabel: '목록', statusColor: 'primary', buttons: [], statusNote: '신규 등록 없음 — 연간계획 승인 후 자동 표시' },
      { status: 'APPROVED', statusLabel: '작성중 (KPI 입력)', statusColor: 'default',
        statusNote: 'KPI현황 탭에서는 APPROVED를 "작성중"으로 표시',
        buttons: [
          { button: '저장 (KPI 값)',  roles: ALL_ON, issue: '권한 체크 없음 — 누구든 KPI 값 저장 가능' },
          { button: '완료 결재 상신', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 완료 결재 상신 가능' },
        ] },
      { status: 'COMPLETION_PENDING', statusLabel: '완료 결재 대기', statusColor: 'warning',
        buttons: [
          { button: '반려',     roles: ADMIN_COMP },
          { button: '완료 승인', roles: ADMIN_COMP },
        ] },
      { status: 'DONE', statusLabel: '완료', statusColor: 'success', buttons: [] },
    ],
  },

  // ── 감사 계획 ─────────────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 감사 › 감사 계획',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'PLAN', statusLabel: '작성중 (반려 포함)', statusColor: 'default',
        statusNote: '반려 시 PENDING_APPROVAL → PLAN 복귀 (별도 REJECTED 상태 없음)',
        buttons: [
          { button: '계획 결재 상신', roles: WRITER_ADMIN },
          { button: '수정',           roles: WRITER_ADMIN },
          { button: '삭제',           roles: WRITER_ADMIN },
        ] },
      { status: 'PENDING_APPROVAL', statusLabel: '계획 결재 대기', statusColor: 'warning',
        buttons: [
          { button: '반려',     roles: ADMIN_PLAN },
          { button: '계획 승인', roles: ADMIN_PLAN },
        ] },
      { status: 'APPROVED', statusLabel: '계획 승인', statusColor: 'info',
        buttons: [], statusNote: '승인 시 감사 실시(IN_PROGRESS) 자동 생성 — 계획 탭에서 추가 버튼 없음' },
    ],
  },

  // ── 감사 실시 ─────────────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 감사 › 감사 실시',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'PREPARING', statusLabel: '준비중', statusColor: 'warning',
        buttons: [
          { button: '저장 (감사 정보)',  roles: ALL_ON },
          { button: '진행중 (상태 전환)', roles: ALL_ON },
        ] },
      { status: 'IN_PROGRESS', statusLabel: '진행중', statusColor: 'info',
        buttons: [
          { button: '저장 (감사 정보)', roles: ALL_ON },
          { button: '완료 결재 상신',   roles: ALL_ON, issue: '권한 체크 없음 — 누구든 완료 결재 상신 가능' },
        ] },
      { status: 'PENDING_CLOSE', statusLabel: '완료 결재 대기', statusColor: 'warning',
        buttons: [
          { button: '저장 (감사 정보)', roles: ALL_ON },
          { button: '반려',             roles: ADMIN_COMP },
          { button: '완료 승인',        roles: ADMIN_COMP },
        ] },
      { status: 'COMPLETED', statusLabel: '완료', statusColor: 'success', buttons: [] },
    ],
  },

  // ── 감사 부적합 ───────────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 감사 › 감사 부적합',
    statuses: [
      { status: 'LIST',          statusLabel: '목록',   statusColor: 'primary', buttons: [], statusNote: '감사 실시 승인 후 자동 연결 — 별도 신규 등록 없음' },
      { status: 'PLAN/PREPARING', statusLabel: '준비중', statusColor: 'default',
        buttons: [{ button: '저장 (체크리스트)', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 저장 가능' }] },
      { status: 'IN_PROGRESS',   statusLabel: '진행중', statusColor: 'info',
        buttons: [{ button: '저장 (체크리스트)', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'PENDING_CLOSE', statusLabel: '완료 결재 대기', statusColor: 'warning', buttons: [] },
      { status: 'COMPLETED',     statusLabel: '완료',           statusColor: 'success', buttons: [] },
    ],
  },

  // ── 시정 조치 ─────────────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 감사 › 시정 조치',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'PENDING', statusLabel: '대기', statusColor: 'default',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 수정 가능' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 삭제 가능' },
        ] },
      { status: 'IN_PROGRESS',   statusLabel: '진행중', statusColor: 'info',    buttons: [{ button: '수정', roles: ALL_ON, issue: '권한 체크 없음' }, { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'DEMONSTRATION', statusLabel: '실증',   statusColor: 'warning', buttons: [{ button: '수정', roles: ALL_ON, issue: '권한 체크 없음' }, { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'OVERDUE',   statusLabel: '지연',    statusColor: 'error',   buttons: [] },
      { status: 'COMPLETED', statusLabel: '완료',    statusColor: 'success', buttons: [] },
      { status: 'NA',        statusLabel: '해당없음', statusColor: 'default', buttons: [] },
    ],
  },

  // ── 교육현황 (관리자) ──────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 교육훈련 › 교육현황 (관리자)',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'PENDING', statusLabel: '대기', statusColor: 'warning',
        buttons: [
          { button: '반려',      roles: ALL_ON, issue: '권한 체크 없음 — 누구든 반려 가능' },
          { button: '승인',      roles: ALL_ON, issue: '권한 체크 없음 — 누구든 승인 가능' },
          { button: '신청 취소', roles: ALL_ON, issue: '권한 체크 없음' },
        ] },
      { status: 'APPROVED', statusLabel: '승인', statusColor: 'primary',
        buttons: [
          { button: '수료',      roles: ALL_ON, issue: '권한 체크 없음 — 누구든 수료 처리 가능' },
          { button: '신청 취소', roles: ALL_ON, issue: '권한 체크 없음' },
        ] },
      { status: 'COMPLETED', statusLabel: '수료',   statusColor: 'success', buttons: [] },
      { status: 'REJECTED',  statusLabel: '반려',   statusColor: 'error',   buttons: [] },
      { status: 'CANCELLED', statusLabel: '취소',   statusColor: 'default', buttons: [] },
    ],
  },

  // ── 안전교육 신청 ─────────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 교육훈련 › 안전교육 신청',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'PLANNED', statusLabel: '예정', statusColor: 'primary',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 수정 가능' },
          { button: '취소', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 취소 가능' },
        ] },
      { status: 'COMPLETED', statusLabel: '완료', statusColor: 'success', buttons: [] },
      { status: 'CANCELLED', statusLabel: '취소', statusColor: 'error',   buttons: [] },
    ],
  },

  // ── 비상 계획 ─────────────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 비상대응 › 비상 계획',
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
          { button: '반려',     roles: ADMIN_PLAN },
          { button: '계획 승인', roles: ADMIN_PLAN },
        ] },
      { status: 'APPROVED',           statusLabel: '계획 승인',      statusColor: 'info',    buttons: [], statusNote: '완료 결재 상신/승인은 훈련관리 탭에서 처리' },
      { status: 'COMPLETION_PENDING', statusLabel: '완료 결재 대기', statusColor: 'warning', buttons: [], statusNote: '훈련관리 탭에서 처리' },
      { status: 'DONE',               statusLabel: '완료',           statusColor: 'success', buttons: [] },
    ],
  },

  // ── 비상 훈련 ─────────────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 비상대응 › 비상 훈련',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'SCHEDULED', statusLabel: '훈련 예정', statusColor: 'info',
        statusNote: '연결된 비상계획(linkedPlan)의 상태에 따라 추가 버튼 표시',
        buttons: [
          { button: '수정',           roles: ALL_ON },
          { button: '저장',           roles: ALL_ON, issue: '권한 체크 없음 — 누구든 저장 가능' },
          { button: '완료 결재 상신', roles: ALL_ON, issue: '권한 체크 없음 — linkedPlan=APPROVED 시 노출' },
          { button: '반려 (완료)',    roles: ADMIN_COMP },
          { button: '완료 승인',      roles: ADMIN_COMP },
        ] },
      { status: 'COMPLETED', statusLabel: '훈련 완료', statusColor: 'success', buttons: [] },
      { status: 'CANCELLED', statusLabel: '취소',       statusColor: 'error',   buttons: [] },
    ],
  },

  // ── 사고·사건 ─────────────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 비상대응 › 사고·사건',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'STANDBY',   statusLabel: '대기',   statusColor: 'default', buttons: [{ button: '수정', roles: ALL_ON, issue: '권한 체크 없음' }, { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'ISSUED',    statusLabel: '발생',   statusColor: 'warning', buttons: [{ button: '수정', roles: ALL_ON, issue: '권한 체크 없음' }, { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'RESPONDING',statusLabel: '대응중', statusColor: 'primary', buttons: [{ button: '수정', roles: ALL_ON, issue: '권한 체크 없음' }, { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'RESOLVED',  statusLabel: '해결',   statusColor: 'success', buttons: [] },
      { status: 'DRILL',     statusLabel: '훈련',   statusColor: 'info',    buttons: [] },
    ],
  },

  // ── 건강검진 계획 ─────────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 건강관리 › 건강검진 계획',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'PLANNED', statusLabel: '작성중', statusColor: 'default',
        buttons: [
          { button: '계획 결재 상신', roles: ALL_ON, issue: '권한 체크 없음 — 작성자/관리자 체크 추가 필요' },
          { button: '수정',           roles: ALL_ON, issue: '권한 체크 없음 — 작성자/관리자 체크 추가 필요' },
          { button: '삭제',           roles: ALL_ON, issue: '권한 체크 없음 — 작성자/관리자 체크 추가 필요' },
        ] },
      { status: 'PENDING_APPROVAL', statusLabel: '계획 결재 대기', statusColor: 'warning',
        buttons: [
          { button: '반려',     roles: ALL_ON, issue: '권한 체크 없음 — 계획 승인자/관리자 체크 추가 필요' },
          { button: '계획 승인', roles: ALL_ON, issue: '권한 체크 없음 — 계획 승인자/관리자 체크 추가 필요' },
        ] },
      { status: 'REJECTED', statusLabel: '반려', statusColor: 'error',
        buttons: [
          { button: '계획 결재 상신', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '수정',           roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제',           roles: ALL_ON, issue: '권한 체크 없음' },
        ] },
      { status: 'IN_PROGRESS', statusLabel: '검진 진행중', statusColor: 'info',    buttons: [] },
      { status: 'COMPLETED',   statusLabel: '완료',        statusColor: 'success', buttons: [] },
    ],
  },

  // ── 위험성평가 ────────────────────────────────────────────────────────────
  {
    menuPath: '위험성평가 (계획 / 관리 모드)',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON, issue: 'isAdmin = true 하드코딩 — 모든 사용자가 관리자로 처리됨' }] },
      { status: 'draft', statusLabel: '작성중 [계획]', statusColor: 'default',
        buttons: [
          { button: '계획 결재 상신', roles: ALL_ON, issue: 'isAdmin = true 하드코딩' },
          { button: '수정',           roles: ALL_ON, issue: 'isAdmin = true 하드코딩' },
          { button: '삭제',           roles: ALL_ON, issue: 'isAdmin = true 하드코딩' },
        ] },
      { status: 'submitted', statusLabel: '계획 결재 대기', statusColor: 'warning',
        buttons: [
          { button: '반려',           roles: ALL_ON, issue: 'isAdmin = true → canApprovePlan 항상 true' },
          { button: '계획 결재 승인', roles: ALL_ON, issue: 'isAdmin = true → canApprovePlan 항상 true' },
        ] },
      { status: 'rejected', statusLabel: '반려 [계획]', statusColor: 'error',
        statusNote: 'draft 상태와 동일한 버튼 노출',
        buttons: [
          { button: '계획 결재 상신', roles: ALL_ON, issue: 'isAdmin = true 하드코딩' },
          { button: '수정',           roles: ALL_ON, issue: 'isAdmin = true 하드코딩' },
          { button: '삭제',           roles: ALL_ON, issue: 'isAdmin = true 하드코딩' },
        ] },
      { status: 'approved', statusLabel: '계획 승인 [관리 모드]', statusColor: 'info',
        buttons: [
          { button: '저장 (실시 내용)', roles: ALL_ON, issue: 'isAdmin = true 하드코딩' },
          { button: '완료 결재 상신',   roles: ALL_ON, issue: 'isAdmin = true 하드코딩' },
        ] },
      { status: 'completion_submitted', statusLabel: '완료 결재 대기', statusColor: 'warning',
        buttons: [
          { button: '반려 (완료)',     roles: ALL_ON, issue: 'isAdmin = true → canApproveCompletion 항상 true' },
          { button: '완료 결재 승인', roles: ALL_ON, issue: 'isAdmin = true → canApproveCompletion 항상 true' },
        ] },
      { status: 'completed', statusLabel: '완료', statusColor: 'success', buttons: [] },
    ],
  },

  // ── 작업허가 › 허가 신청 ──────────────────────────────────────────────────
  {
    menuPath: '작업허가 › 허가 신청',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON }] },
      { status: 'DRAFT/REJECTED', statusLabel: '작성중 / 반려', statusColor: 'default',
        statusNote: 'DRAFT(신규) 또는 REJECTED(계획 반려 후) 상태 — 동일 버튼 노출',
        buttons: [
          { button: '계획 결재 상신', roles: ALL_ON, issue: '권한 체크 없음 — 내 허가 탭에서는 사실상 작성자만 보임' },
          { button: '수정',           roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제',           roles: ALL_ON, issue: '권한 체크 없음' },
        ] },
      { status: 'PENDING_APPROVAL/REQUESTED', statusLabel: '계획 결재 대기', statusColor: 'warning',
        statusNote: '전체 탭(mode=all)에서는 모든 사용자가 승인 가능 (⚠️ isAdminTab 체크)',
        buttons: [
          { button: '계획 결재 반려', roles: ADMIN_PLAN, issue: '전체 탭에서는 모든 사용자 승인 가능' },
          { button: '계획 결재 승인', roles: ADMIN_PLAN, issue: '전체 탭에서는 모든 사용자 승인 가능' },
        ] },
      { status: 'APPROVED', statusLabel: '계획 승인 (완료점검 탭)', statusColor: 'info',
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
      { status: 'DONE/COMPLETED', statusLabel: '완료',   statusColor: 'success', buttons: [] },
      { status: 'CANCELLED',      statusLabel: '취소',   statusColor: 'error',   buttons: [] },
    ],
  },

  // ── 작업환경측정 › 측정 계획 ──────────────────────────────────────────────
  {
    menuPath: '작업환경측정 › 측정 계획',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'PLANNED/IN_PROGRESS/OVERDUE/UNMEASURED', statusLabel: '측정 전 (진행/지연/미측정 포함)', statusColor: 'default',
        statusNote: '해당 상태 모두 동일 버튼 노출 (상태 조건 없음)',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 수정 가능' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 삭제 가능' },
        ] },
      { status: 'COMPLETED', statusLabel: '측정 완료', statusColor: 'success',
        statusNote: '완료 상태에서도 수정/삭제 조건 없음',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음 — 완료 후에도 수정 가능' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음 — 완료 후에도 삭제 가능' },
        ] },
    ],
  },

  // ── 산업재해/직업병 › 재해 청구 ───────────────────────────────────────────
  {
    menuPath: '산업재해/직업병 › 재해 청구',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'DRAFT', statusLabel: '작성중', statusColor: 'default',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 수정 가능' },
          { button: '제출', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 제출 가능' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 삭제 가능' },
        ] },
      { status: 'SUBMITTED', statusLabel: '제출됨', statusColor: 'info',    buttons: [] },
      { status: 'REVIEWING', statusLabel: '검토중', statusColor: 'warning', buttons: [] },
      { status: 'APPROVED',  statusLabel: '승인',   statusColor: 'success', buttons: [] },
      { status: 'REJECTED',  statusLabel: '반려',   statusColor: 'error',   buttons: [] },
      { status: 'COMPLETED', statusLabel: '완료',   statusColor: 'success', buttons: [] },
    ],
  },

  // ── 협력업체 › 평가 ───────────────────────────────────────────────────────
  {
    menuPath: '협력업체 › 협력업체 평가',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '예정',   statusLabel: '예정',   statusColor: 'default', buttons: [{ button: '수정', roles: ALL_ON, issue: '권한 체크 없음' }, { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '재평가', statusLabel: '재평가', statusColor: 'error',   buttons: [{ button: '수정', roles: ALL_ON, issue: '권한 체크 없음' }, { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '완료',   statusLabel: '완료',   statusColor: 'success', buttons: [] },
    ],
  },

  // ── 협력업체 › 방문자 관리 ────────────────────────────────────────────────
  {
    menuPath: '협력업체 › 방문자 관리',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '입장중',   statusLabel: '입장중',   statusColor: 'info',    buttons: [{ button: '수정', roles: ALL_ON, issue: '권한 체크 없음' }, { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '교육미이수', statusLabel: '교육미이수', statusColor: 'warning', buttons: [{ button: '수정', roles: ALL_ON, issue: '권한 체크 없음' }, { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '출입금지', statusLabel: '출입금지', statusColor: 'error',   buttons: [{ button: '수정', roles: ALL_ON, issue: '권한 체크 없음' }, { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '퇴장',     statusLabel: '퇴장',     statusColor: 'success', buttons: [] },
    ],
  },

  // ── 화학물질 › 위해성 보고 ────────────────────────────────────────────────
  {
    menuPath: '화학물질 › 위해성 보고',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'COLLECTING', statusLabel: '수집중',  statusColor: 'primary', buttons: [{ button: '수정', roles: ALL_ON, issue: '권한 체크 없음' }, { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'SUBMITTED',  statusLabel: '제출완료', statusColor: 'success', buttons: [] },
    ],
  },

  // ── 환경 › 폐기물 관리 ────────────────────────────────────────────────────
  {
    menuPath: '환경 › 폐기물 관리',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'STORING',          statusLabel: '보관중',  statusColor: 'primary', buttons: [{ button: '수정', roles: ALL_ON, issue: '권한 체크 없음' }, { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'DISPOSAL_REQUEST', statusLabel: '처리요청', statusColor: 'warning', buttons: [{ button: '수정', roles: ALL_ON, issue: '권한 체크 없음' }, { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'PROCESSING',       statusLabel: '처리중',  statusColor: 'info',    buttons: [{ button: '수정', roles: ALL_ON, issue: '권한 체크 없음' }, { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: 'COMPLETED',        statusLabel: '처리완료', statusColor: 'success', buttons: [] },
    ],
  },

  // ── 방사선 › 사고·사건 ────────────────────────────────────────────────────
  {
    menuPath: '방사선 › 사고·사건',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '조사중',   statusLabel: '조사중',   statusColor: 'warning', buttons: [{ button: '수정', roles: ALL_ON, issue: '권한 체크 없음' }, { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '재발방지중', statusLabel: '재발방지중', statusColor: 'info',  buttons: [{ button: '수정', roles: ALL_ON, issue: '권한 체크 없음' }, { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '종결',     statusLabel: '종결',     statusColor: 'success', buttons: [] },
    ],
  },

  // ── 인허가 › 인허가 식별 ──────────────────────────────────────────────────
  {
    menuPath: '인허가 › 인허가 식별',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '검토중', statusLabel: '검토중', statusColor: 'warning', buttons: [{ button: '수정', roles: ALL_ON, issue: '권한 체크 없음' }, { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '미식별', statusLabel: '미식별', statusColor: 'error',   buttons: [{ button: '수정', roles: ALL_ON, issue: '권한 체크 없음' }, { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '식별완료', statusLabel: '식별완료', statusColor: 'success', buttons: [] },
      { status: '미대상',   statusLabel: '미대상',   statusColor: 'default', buttons: [] },
    ],
  },

  // ── 인허가 › 인허가 대장 ──────────────────────────────────────────────────
  {
    menuPath: '인허가 › 인허가 대장',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '만료임박', statusLabel: '만료임박', statusColor: 'warning', buttons: [{ button: '수정', roles: ALL_ON, issue: '권한 체크 없음' }, { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '만료',     statusLabel: '만료',     statusColor: 'error',   buttons: [{ button: '수정', roles: ALL_ON, issue: '권한 체크 없음' }, { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '유효',   statusLabel: '유효',   statusColor: 'success', buttons: [] },
      { status: '무기한', statusLabel: '무기한', statusColor: 'default', buttons: [] },
    ],
  },

  // ── 인허가 › 변경 관리 ────────────────────────────────────────────────────
  {
    menuPath: '인허가 › 변경 관리',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '검토중/안전영향평가/허가신청/심사중', statusLabel: '진행 단계', statusColor: 'warning',
        statusNote: '검토중 → 안전영향평가 → 허가신청 → 심사중 → 승인 단계별 진행',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
        ] },
      { status: '이행완료', statusLabel: '이행완료', statusColor: 'success', buttons: [] },
      { status: '반려',     statusLabel: '반려',     statusColor: 'error',   buttons: [] },
    ],
  },

  // ── 인허가 › 법정 보고서 ──────────────────────────────────────────────────
  {
    menuPath: '인허가 › 법정 보고서',
    statuses: [
      { status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [{ button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '준비중', statusLabel: '준비중', statusColor: 'info',    buttons: [{ button: '수정', roles: ALL_ON, issue: '권한 체크 없음' }, { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '임박',   statusLabel: '임박',   statusColor: 'warning', buttons: [{ button: '수정', roles: ALL_ON, issue: '권한 체크 없음' }, { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '지연',   statusLabel: '지연',   statusColor: 'error',   buttons: [{ button: '수정', roles: ALL_ON, issue: '권한 체크 없음' }, { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' }] },
      { status: '제출완료', statusLabel: '제출완료', statusColor: 'success', buttons: [] },
    ],
  },
]
