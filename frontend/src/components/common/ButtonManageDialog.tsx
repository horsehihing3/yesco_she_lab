import { useRef, useState, useEffect, useCallback } from 'react'
import {
  Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Typography, Box, Chip, Tooltip,
  IconButton, Checkbox,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import CloseIcon from '@mui/icons-material/Close'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import OpenInFullIcon from '@mui/icons-material/OpenInFull'
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen'
import RestartAltIcon from '@mui/icons-material/RestartAlt'

// ─── 타입 ───────────────────────────────────────────────────────────────────
type Role = 'guest' | 'writer' | 'admin' | 'planApprover' | 'completionApprover'

interface ButtonRule {
  button: string
  roles: Record<Role, boolean>
  issue?: string
}

interface StatusGroup {
  status: string
  statusLabel: string
  statusColor: 'default' | 'warning' | 'info' | 'success' | 'error' | 'primary'
  buttons: ButtonRule[]        // 빈 배열이면 "버튼 없음" 행으로 표시
  statusNote?: string          // 상태 설명 (탭 분리 안내 등)
}

interface MenuEntry {
  menuPath: string
  statuses: StatusGroup[]
}

// ─── 역할 컬럼 정의 ──────────────────────────────────────────────────────────
const ROLES: { key: Role; label: string; desc: string }[] = [
  { key: 'guest',              label: '일반 사용자', desc: '로그인 사용자 (작성자·승인자·관리자 제외)' },
  { key: 'writer',             label: '작성자',      desc: '해당 레코드를 직접 작성한 사용자' },
  { key: 'admin',              label: '관리자',      desc: 'SYSTEM_ADMIN / EHS_ADMIN / AUDIT_ADMIN 역할' },
  { key: 'planApprover',       label: '계획 승인자', desc: '레코드에 지정된 계획 승인자 본인' },
  { key: 'completionApprover', label: '완료 승인자', desc: '레코드에 지정된 완료 승인자 본인' },
]

// ─── 헬퍼: 전체 노출 / 전체 숨김 role 객체 ──────────────────────────────────
const ALL_ON:  Record<Role, boolean> = { guest: true,  writer: true,  admin: true,  planApprover: true,  completionApprover: true  }
const ALL_OFF: Record<Role, boolean> = { guest: false, writer: false, admin: false, planApprover: false, completionApprover: false }
const WRITER_ADMIN: Record<Role, boolean> = { guest: false, writer: true, admin: true, planApprover: false, completionApprover: false }
const ADMIN_PLAN:   Record<Role, boolean> = { guest: false, writer: false, admin: true, planApprover: true,  completionApprover: false }
const ADMIN_COMP:   Record<Role, boolean> = { guest: false, writer: false, admin: true, planApprover: false, completionApprover: true  }

// ─── 기본 데이터 (코드 분석 기반 — 버튼이 있는 상태만 표시) ─────────────────
const DEFAULT_MENU_DATA: MenuEntry[] = [
  // ── 연간계획 ──────────────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 계획KPI목표 › 연간계획',
    statuses: [
      {
        status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [
          { button: '신규 등록', roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true } },
        ],
      },
      {
        status: 'DRAFT', statusLabel: '작성중', statusColor: 'default',
        buttons: [
          { button: '계획 결재 상신', roles: { guest: false, writer: true,  admin: true,  planApprover: false, completionApprover: false } },
          { button: '수정',           roles: { guest: false, writer: true,  admin: true,  planApprover: false, completionApprover: false } },
          { button: '삭제',           roles: { guest: false, writer: true,  admin: true,  planApprover: false, completionApprover: false } },
        ],
      },
      {
        status: 'PENDING_APPROVAL', statusLabel: '승인대기', statusColor: 'warning',
        buttons: [
          { button: '반려',    roles: { guest: false, writer: false, admin: true, planApprover: true, completionApprover: false } },
          { button: '계획 승인', roles: { guest: false, writer: false, admin: true, planApprover: true, completionApprover: false } },
        ],
      },
    ],
  },

  // ── KPI 현황 ──────────────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 계획KPI목표 › KPI 현황',
    statuses: [
      {
        status: 'APPROVED', statusLabel: '작성중 (KPI 입력)', statusColor: 'default',
        statusNote: 'KPI현황 탭: 연간계획 APPROVED 상태를 "작성중"으로 표시',
        buttons: [
          { button: '저장 (KPI 값)', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 KPI 값 저장 가능' },
          { button: '완료 결재 상신', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 완료 결재 상신 가능' },
        ],
      },
      {
        status: 'COMPLETION_PENDING', statusLabel: '완료 결재 대기', statusColor: 'warning',
        buttons: [
          { button: '반려',    roles: ADMIN_COMP },
          { button: '완료 승인', roles: ADMIN_COMP },
        ],
      },
    ],
  },

  // ── 감사 계획 ─────────────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 감사 › 감사 계획',
    statuses: [
      {
        status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [
          { button: '신규 등록', roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true } },
        ],
      },
      {
        status: 'PLAN', statusLabel: '작성중', statusColor: 'default',
        statusNote: '반려 시 PENDING_APPROVAL → PLAN 복귀 (별도 REJECTED 상태 없음)',
        buttons: [
          { button: '계획 결재 상신', roles: { guest: false, writer: true,  admin: true,  planApprover: false, completionApprover: false } },
          { button: '수정',           roles: { guest: false, writer: true,  admin: true,  planApprover: false, completionApprover: false } },
          { button: '삭제',           roles: { guest: false, writer: true,  admin: true,  planApprover: false, completionApprover: false } },
        ],
      },
      {
        status: 'PENDING_APPROVAL', statusLabel: '계획 결재 상신', statusColor: 'info',
        buttons: [
          { button: '반려',    roles: { guest: false, writer: false, admin: true, planApprover: true, completionApprover: false } },
          { button: '계획 승인', roles: { guest: false, writer: false, admin: true, planApprover: true, completionApprover: false } },
        ],
      },
    ],
  },

  // ── 감사 실시 ─────────────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 감사 › 감사 실시',
    statuses: [
      {
        status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [
          { button: '신규 등록', roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true } },
        ],
      },
      {
        status: 'PREPARING', statusLabel: '준비중', statusColor: 'warning',
        buttons: [
          { button: '저장 (감사 정보)', roles: { guest: true,  writer: true,  admin: true,  planApprover: true,  completionApprover: true  } },
          { button: '진행중 (상태 전환)', roles: { guest: true, writer: true,  admin: true,  planApprover: true,  completionApprover: true  } },
        ],
      },
      {
        status: 'IN_PROGRESS', statusLabel: '진행중', statusColor: 'info',
        buttons: [
          { button: '저장 (감사 정보)', roles: { guest: true,  writer: true,  admin: true,  planApprover: true,  completionApprover: true  } },
          { button: '완료 결재 상신',   roles: { guest: true,  writer: true,  admin: true,  planApprover: true,  completionApprover: true  }, issue: '권한 체크 없음 — 누구든 완료 결재 상신 가능' },
        ],
      },
      {
        status: 'PENDING_CLOSE', statusLabel: '종료확인대기', statusColor: 'warning',
        buttons: [
          { button: '저장 (감사 정보)', roles: { guest: true,  writer: true,  admin: true,  planApprover: true,  completionApprover: true  } },
          { button: '반려',             roles: { guest: false, writer: false, admin: true,  planApprover: false, completionApprover: true  } },
          { button: '완료 승인',        roles: { guest: false, writer: false, admin: true,  planApprover: false, completionApprover: true  } },
        ],
      },
    ],
  },

  // ── 감사 부적합 ───────────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 감사 › 감사 부적합',
    statuses: [
      {
        status: 'PLAN/PREPARING', statusLabel: '준비중', statusColor: 'default',
        statusNote: '감사 실시 승인 후 자동 연결 — 별도 신규 등록 없음',
        buttons: [
          { button: '저장 (체크리스트)', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 저장 가능' },
        ],
      },
      {
        status: 'IN_PROGRESS', statusLabel: '진행중', statusColor: 'info',
        buttons: [
          { button: '저장 (체크리스트)', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
    ],
  },

  // ── 시정 조치 ─────────────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 감사 › 시정 조치',
    statuses: [
      {
        status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [
          { button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: 'PENDING', statusLabel: '대기', statusColor: 'default',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 수정 가능' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 삭제 가능' },
        ],
      },
      {
        status: 'IN_PROGRESS', statusLabel: '조치중', statusColor: 'info',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: 'DEMONSTRATION', statusLabel: '지연', statusColor: 'error',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
    ],
  },

  // ── 교육현황 (관리자) ──────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 교육훈련 › 교육현황 (관리자)',
    statuses: [
      {
        status: 'PENDING', statusLabel: '대기', statusColor: 'warning',
        buttons: [
          { button: '반려',      roles: ALL_ON, issue: '권한 체크 없음 — 누구든 반려 가능' },
          { button: '승인',      roles: ALL_ON, issue: '권한 체크 없음 — 누구든 승인 가능' },
          { button: '신청 취소', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: 'APPROVED', statusLabel: '확정', statusColor: 'primary',
        buttons: [
          { button: '수료',      roles: ALL_ON, issue: '권한 체크 없음 — 누구든 수료 처리 가능' },
          { button: '신청 취소', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
    ],
  },

  // ── 안전교육 신청 ─────────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 교육훈련 › 안전교육 신청',
    statuses: [
      {
        status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [
          { button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: 'PLANNED', statusLabel: '예정', statusColor: 'primary',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 수정 가능' },
          { button: '취소', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 취소 가능' },
        ],
      },
    ],
  },

  // ── 비상 계획 ─────────────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 비상 훈련 › 비상 계획',
    statuses: [
      {
        status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [
          { button: '신규 등록', roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true } },
        ],
      },
      {
        status: 'DRAFT', statusLabel: '작성중', statusColor: 'default',
        statusNote: '반려 시 PENDING_APPROVAL → DRAFT 복귀',
        buttons: [
          { button: '계획 결재 상신', roles: { guest: false, writer: true,  admin: true,  planApprover: false, completionApprover: false } },
          { button: '수정',           roles: { guest: false, writer: true,  admin: true,  planApprover: false, completionApprover: false } },
          { button: '삭제',           roles: { guest: false, writer: true,  admin: true,  planApprover: false, completionApprover: false } },
        ],
      },
      {
        status: 'PENDING_APPROVAL', statusLabel: '승인대기', statusColor: 'warning',
        buttons: [
          { button: '반려',    roles: { guest: false, writer: false, admin: true, planApprover: true, completionApprover: false } },
          { button: '계획 승인', roles: { guest: false, writer: false, admin: true, planApprover: true, completionApprover: false } },
        ],
      },
    ],
  },

  // ── 비상 훈련 ─────────────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 비상 훈련 › 비상 훈련',
    statuses: [
      {
        status: 'SCHEDULED', statusLabel: '예정', statusColor: 'info',
        statusNote: '비상계획 승인 후 자동 생성 — 신규 등록 없음 / linkedPlan 상태에 따라 버튼 표시',
        buttons: [
          { button: '저장',           roles: ALL_ON, issue: '권한 체크 없음 — 누구든 저장 가능' },
          { button: '완료 결재 상신', roles: ALL_ON, issue: '권한 체크 없음 — linkedPlan=APPROVED 시 노출, 누구든 상신 가능' },
          { button: '반려 (완료)',    roles: ADMIN_COMP },
          { button: '완료 승인',      roles: ADMIN_COMP },
        ],
      },
    ],
  },

  // ── 법규검토시스템 ──────────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 법규 대응 › 법규검토시스템',
    statuses: [
      {
        status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [
          { button: '신규 등록', roles: WRITER_ADMIN },
        ],
      },
      {
        status: 'DETAIL', statusLabel: '상세/편집', statusColor: 'default',
        buttons: [
          { button: '수정', roles: WRITER_ADMIN },
          { button: '삭제', roles: WRITER_ADMIN },
        ],
      },
    ],
  },

  // ── 자원·장비 ─────────────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 비상 훈련 › 자원·장비',
    statuses: [
      {
        status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [
          { button: '신규 등록', roles: WRITER_ADMIN },
        ],
      },
      {
        status: 'NORMAL', statusLabel: '정상', statusColor: 'success',
        buttons: [
          { button: '수정', roles: WRITER_ADMIN },
          { button: '삭제', roles: WRITER_ADMIN },
        ],
      },
      {
        status: 'CHECK_NEEDED', statusLabel: '점검필요', statusColor: 'warning',
        buttons: [
          { button: '수정', roles: WRITER_ADMIN },
          { button: '삭제', roles: WRITER_ADMIN },
        ],
      },
      {
        status: 'DEFECTIVE', statusLabel: '불량', statusColor: 'error',
        buttons: [
          { button: '수정', roles: WRITER_ADMIN },
          { button: '삭제', roles: WRITER_ADMIN },
        ],
      },
      {
        status: 'DISPOSED', statusLabel: '폐기', statusColor: 'default',
        buttons: [
          { button: '수정', roles: WRITER_ADMIN },
          { button: '삭제', roles: WRITER_ADMIN },
        ],
      },
    ],
  },

  // ── 건강검진 계획 ─────────────────────────────────────────────────────────
  {
    menuPath: 'EHS경영 › 건강관리 › 건강검진 계획',
    statuses: [
      {
        status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [
          { button: '신규 등록', roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true } },
        ],
      },
      {
        status: 'PLANNED', statusLabel: '계획', statusColor: 'default',
        buttons: [
          { button: '계획 결재 상신', roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true }, issue: '권한 체크 없음 — 작성자/관리자 체크 추가 필요' },
          { button: '수정',           roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true }, issue: '권한 체크 없음 — 작성자/관리자 체크 추가 필요' },
          { button: '삭제',           roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true }, issue: '권한 체크 없음 — 작성자/관리자 체크 추가 필요' },
        ],
      },
      {
        status: 'PENDING_APPROVAL', statusLabel: '결재대기', statusColor: 'warning',
        buttons: [
          { button: '반려',    roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true }, issue: '권한 체크 없음 — 계획 승인자/관리자 체크 추가 필요' },
          { button: '계획 승인', roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true }, issue: '권한 체크 없음 — 계획 승인자/관리자 체크 추가 필요' },
        ],
      },
      {
        status: 'REJECTED', statusLabel: '반려', statusColor: 'error',
        buttons: [
          { button: '계획 결재 상신', roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true }, issue: '권한 체크 없음' },
          { button: '수정',           roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true }, issue: '권한 체크 없음' },
          { button: '삭제',           roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true }, issue: '권한 체크 없음' },
        ],
      },
    ],
  },

  // ── 위험성평가 ────────────────────────────────────────────────────────────
  {
    menuPath: '위험성평가 (계획 / 관리 모드)',
    statuses: [
      {
        status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [
          { button: '신규 등록', roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true }, issue: 'isAdmin = true 하드코딩 — 모든 사용자가 관리자로 처리됨' },
        ],
      },
      {
        status: 'draft', statusLabel: '작성중', statusColor: 'default',
        buttons: [
          { button: '계획 결재 상신', roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true }, issue: 'isAdmin = true 하드코딩' },
          { button: '수정',           roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true }, issue: 'isAdmin = true 하드코딩' },
          { button: '삭제',           roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true }, issue: 'isAdmin = true 하드코딩' },
        ],
      },
      {
        status: 'submitted', statusLabel: '승인대기', statusColor: 'warning',
        buttons: [
          { button: '반려',        roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true }, issue: 'isAdmin = true → canApprovePlan 항상 true' },
          { button: '계획 결재 승인', roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true }, issue: 'isAdmin = true → canApprovePlan 항상 true' },
        ],
      },
      {
        status: 'rejected', statusLabel: '반려', statusColor: 'error',
        statusNote: 'draft 상태와 동일한 버튼 노출',
        buttons: [
          { button: '계획 결재 상신', roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true }, issue: 'isAdmin = true 하드코딩' },
          { button: '수정',           roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true }, issue: 'isAdmin = true 하드코딩' },
          { button: '삭제',           roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true }, issue: 'isAdmin = true 하드코딩' },
        ],
      },
      {
        status: 'approved', statusLabel: '작성중', statusColor: 'default',
        statusNote: '관리 모드에서는 approved 상태를 "작성중"으로 표시 (완료 결재 흐름)',
        buttons: [
          { button: '저장 (실시 내용)',  roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true }, issue: 'isAdmin = true 하드코딩' },
          { button: '완료 결재 상신', roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true }, issue: 'isAdmin = true 하드코딩' },
        ],
      },
      {
        status: 'completion_submitted', statusLabel: '완료 결재 대기', statusColor: 'warning',
        buttons: [
          { button: '반려 (완료)',     roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true }, issue: 'isAdmin = true → canApproveCompletion 항상 true' },
          { button: '완료 결재 승인', roles: { guest: true, writer: true, admin: true, planApprover: true, completionApprover: true }, issue: 'isAdmin = true → canApproveCompletion 항상 true' },
        ],
      },
    ],
  },

  // ── 작업허가 › 허가 신청 ──────────────────────────────────────────────────
  {
    menuPath: '작업허가 › 허가 신청',
    statuses: [
      {
        status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [
          { button: '신규 등록', roles: ALL_ON },
        ],
      },
      {
        status: 'DRAFT/REJECTED', statusLabel: '작성중 / 반려', statusColor: 'default',
        statusNote: 'DRAFT(신규) 또는 REJECTED(계획 반려 후) 상태 — 동일 버튼 노출',
        buttons: [
          { button: '계획 결재 상신', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 상신 가능 (내 허가 탭에서는 사실상 작성자만 보임)' },
          { button: '수정',           roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제',           roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: 'PENDING_APPROVAL/REQUESTED', statusLabel: '계획 결재 대기', statusColor: 'warning',
        statusNote: 'PENDING_APPROVAL 또는 REQUESTED — 동일 처리. 전체 탭(mode=all)에서는 모든 사용자가 승인 가능 (⚠️)',
        buttons: [
          { button: '계획 결재 반려', roles: ADMIN_PLAN, issue: '전체 탭(관리자 탭)에서는 모든 사용자 승인 가능 — isAdminTab 체크' },
          { button: '계획 결재 승인', roles: ADMIN_PLAN, issue: '전체 탭(관리자 탭)에서는 모든 사용자 승인 가능 — isAdminTab 체크' },
        ],
      },
      {
        status: 'APPROVED', statusLabel: '승인완료', statusColor: 'info',
        statusNote: '완료 결재 흐름은 "작업 완료 후 점검" 탭에서 처리',
        buttons: [
          { button: '저장 (체크리스트)', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '완료 결재 상신',    roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: 'COMPLETION_PENDING', statusLabel: '완료 결재 대기', statusColor: 'warning',
        statusNote: '완료승인자 미지정 시 모든 관리자 역할 사용자 승인 가능',
        buttons: [
          { button: '완료 결재 반려', roles: ADMIN_COMP },
          { button: '완료 결재 승인', roles: ADMIN_COMP },
        ],
      },
    ],
  },

  // ── 작업환경측정 › 측정 계획 ──────────────────────────────────────────────
  {
    menuPath: '작업환경측정 › 측정 계획',
    statuses: [
      {
        status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [
          { button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 신규 등록 가능' },
        ],
      },
      {
        status: 'PLANNED/IN_PROGRESS/OVERDUE/UNMEASURED', statusLabel: '측정 전 (진행/지연/미측정 포함)', statusColor: 'default',
        statusNote: 'PLANNED·IN_PROGRESS·OVERDUE·UNMEASURED 상태 모두 동일 버튼 노출 (상태 조건 없음)',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 수정 가능' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 삭제 가능' },
        ],
      },
      {
        status: 'COMPLETED', statusLabel: '측정 완료', statusColor: 'success',
        statusNote: '완료 상태에서도 수정/삭제 조건 없으므로 동일 버튼 노출됨',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음 — 완료 후에도 수정 가능' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음 — 완료 후에도 삭제 가능' },
        ],
      },
    ],
  },

  // ── 산업재해/직업병 › 재해 청구 ───────────────────────────────────────────
  {
    menuPath: '산업재해/직업병 › 재해 청구',
    statuses: [
      {
        status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [
          { button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: 'DRAFT', statusLabel: '작성중', statusColor: 'default',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 수정 가능' },
          { button: '제출', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 제출 가능' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음 — 누구든 삭제 가능' },
        ],
      },
    ],
  },

  // ── 협력업체 › 협력사 위험성 평가 ───────────────────────────────────────────
  {
    menuPath: '협력업체 › 협력사 위험성 평가',
    statuses: [
      {
        status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        statusNote: '계획 탭 / 어드민 탭에서만 신규 등록 가능 (관리 탭 제외)',
        buttons: [
          { button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: 'DRAFT/REJECTED', statusLabel: '작성중 / 반려', statusColor: 'default',
        statusNote: '반려 시 PENDING_APPROVAL → REJECTED 복귀 (계획 탭에서 표시)',
        buttons: [
          { button: '계획 결재 상신', roles: ALL_ON, issue: '권한 체크 없음 — 계획 탭에서 누구든 상신 가능' },
          { button: '수정',           roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제',           roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: 'PENDING_APPROVAL', statusLabel: '계획 결재 대기', statusColor: 'warning',
        statusNote: '어드민 탭에서는 모든 사용자 승인 가능 / canApprove = SYSTEM_ADMIN·AUDIT_ADMIN (EHS_ADMIN 제외)',
        buttons: [
          { button: '반려',         roles: ADMIN_PLAN, issue: '어드민 탭에서는 모든 사용자 가능 / EHS_ADMIN은 어드민 탭에서만' },
          { button: '계획 결재 승인', roles: ADMIN_PLAN, issue: '어드민 탭에서는 모든 사용자 가능 / EHS_ADMIN은 어드민 탭에서만' },
        ],
      },
      {
        status: 'APPROVED', statusLabel: '승인완료', statusColor: 'info',
        statusNote: '관리 탭(approval mode)에서 표시 — 완료 결재 상신/승인 흐름',
        buttons: [
          { button: '저장',          roles: ALL_ON, issue: '권한 체크 없음 — 관리 탭 누구든 저장 가능' },
          { button: '완료 결재 상신', roles: ALL_ON, issue: '권한 체크 없음 — 관리 탭 누구든 상신 가능' },
        ],
      },
      {
        status: 'COMPLETION_PENDING', statusLabel: '완료 결재 대기', statusColor: 'warning',
        buttons: [
          { button: '반려',         roles: ADMIN_COMP, issue: '어드민 탭에서는 모든 사용자 가능' },
          { button: '완료 결재 승인', roles: ADMIN_COMP, issue: '어드민 탭에서는 모든 사용자 가능' },
        ],
      },
    ],
  },

  // ── 협력업체 › 평가 ───────────────────────────────────────────────────────
  {
    menuPath: '협력업체 › 협력업체 평가',
    statuses: [
      {
        status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [
          { button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: '예정', statusLabel: '예정', statusColor: 'default',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: '재평가', statusLabel: '재평가', statusColor: 'error',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
    ],
  },

  // ── 협력업체 › 방문자 관리 ────────────────────────────────────────────────
  {
    menuPath: '협력업체 › 방문자 관리',
    statuses: [
      {
        status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [
          { button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: '입장중', statusLabel: '입장중', statusColor: 'info',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: '교육미이수', statusLabel: '교육미이수', statusColor: 'warning',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: '출입금지', statusLabel: '출입금지', statusColor: 'error',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
    ],
  },

  // ── 화학물질 › 위해성 보고 ────────────────────────────────────────────────
  {
    menuPath: '화학물질 › 위해성 보고',
    statuses: [
      {
        status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [
          { button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: 'COLLECTING', statusLabel: '수집중', statusColor: 'primary',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
    ],
  },

  // ── 환경 › 폐기물 관리 ────────────────────────────────────────────────────
  {
    menuPath: '환경 › 폐기물 관리',
    statuses: [
      {
        status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [
          { button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: 'STORING', statusLabel: '보관중', statusColor: 'primary',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: 'DISPOSAL_REQUEST', statusLabel: '처리요청', statusColor: 'warning',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: 'PROCESSING', statusLabel: '처리중', statusColor: 'info',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
    ],
  },

  // ── 방사선 › 사고·사건 ────────────────────────────────────────────────────
  {
    menuPath: '방사선 › 사고·사건',
    statuses: [
      {
        status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [
          { button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: '조사중', statusLabel: '조사중', statusColor: 'warning',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: '재발방지중', statusLabel: '재발방지중', statusColor: 'info',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
    ],
  },

  // ── 인허가 › 인허가 식별 ──────────────────────────────────────────────────
  {
    menuPath: '인허가 › 인허가 식별',
    statuses: [
      {
        status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [
          { button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: '검토중', statusLabel: '검토중', statusColor: 'warning',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: '미식별', statusLabel: '미식별', statusColor: 'error',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
    ],
  },

  // ── 인허가 › 인허가 대장 ──────────────────────────────────────────────────
  {
    menuPath: '인허가 › 인허가 대장',
    statuses: [
      {
        status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [
          { button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: '만료임박', statusLabel: '만료임박', statusColor: 'warning',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: '만료', statusLabel: '만료', statusColor: 'error',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
    ],
  },

  // ── 인허가 › 변경 관리 ────────────────────────────────────────────────────
  {
    menuPath: '인허가 › 변경 관리',
    statuses: [
      {
        status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [
          { button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: '검토중/안전영향평가/허가신청/심사중', statusLabel: '진행 단계', statusColor: 'warning',
        statusNote: '검토중 → 안전영향평가 → 허가신청 → 심사중 → 승인 단계별 진행',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
    ],
  },

  // ── 인허가 › 법정 보고서 ──────────────────────────────────────────────────
  {
    menuPath: '인허가 › 법정 보고서',
    statuses: [
      {
        status: 'LIST', statusLabel: '목록', statusColor: 'primary',
        buttons: [
          { button: '신규 등록', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: '준비중', statusLabel: '준비중', statusColor: 'info',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: '임박', statusLabel: '임박', statusColor: 'warning',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
      {
        status: '지연', statusLabel: '지연', statusColor: 'error',
        buttons: [
          { button: '수정', roles: ALL_ON, issue: '권한 체크 없음' },
          { button: '삭제', roles: ALL_ON, issue: '권한 체크 없음' },
        ],
      },
    ],
  },
]

// ─── 셀 키 생성 ──────────────────────────────────────────────────────────────
const cellKey = (mi: number, si: number, bi: number, role: Role) => `${mi}_${si}_${bi}_${role}`

// 초기 상태 맵 생성
function buildInitialState(): Record<string, boolean> {
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

// ─── 드래그/리사이즈 상수 ────────────────────────────────────────────────────
const DEFAULT_W = 1000
const DEFAULT_H  = 600
const MIN_W = 520
const MIN_H = 320

type ResizeDir = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'
const RESIZE_CURSORS: Record<ResizeDir, string> = {
  n: 'n-resize', ne: 'ne-resize', e: 'e-resize', se: 'se-resize',
  s: 's-resize', sw: 'sw-resize', w: 'w-resize', nw: 'nw-resize',
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
interface Props { open: boolean; onClose: () => void }

const ButtonManageDialog: React.FC<Props> = ({ open, onClose }) => {
  const [pos,       setPos]       = useState({ x: 0, y: 0 })
  const [size,      setSize]      = useState({ w: DEFAULT_W, h: DEFAULT_H })
  const [maximized, setMaximized] = useState(false)
  const [cellState, setCellState] = useState<Record<string, boolean>>(buildInitialState)

  const dragging    = useRef(false)
  const dragStart   = useRef({ mx: 0, my: 0, px: 0, py: 0 })
  const resizing    = useRef(false)
  const resizeDir   = useRef<ResizeDir>('se')
  const resizeStart = useRef({ mx: 0, my: 0, px: 0, py: 0, w: 0, h: 0 })

  useEffect(() => {
    if (open) {
      setPos({ x: (window.innerWidth - DEFAULT_W) / 2, y: (window.innerHeight - DEFAULT_H) / 2 })
      setSize({ w: DEFAULT_W, h: DEFAULT_H })
      setMaximized(false)
    }
  }, [open])

  const onTitleMouseDown = useCallback((e: React.MouseEvent) => {
    if (maximized) return
    dragging.current = true
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y }
    e.preventDefault()
  }, [maximized, pos])

  const onResizeMouseDown = useCallback((dir: ResizeDir) => (e: React.MouseEvent) => {
    if (maximized) return
    resizing.current  = true
    resizeDir.current = dir
    resizeStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y, w: size.w, h: size.h }
    e.preventDefault()
    e.stopPropagation()
  }, [maximized, pos, size])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragging.current) {
        const dx = e.clientX - dragStart.current.mx
        const dy = e.clientY - dragStart.current.my
        setPos({ x: dragStart.current.px + dx, y: dragStart.current.py + dy })
        return
      }
      if (resizing.current) {
        const dx  = e.clientX - resizeStart.current.mx
        const dy  = e.clientY - resizeStart.current.my
        const dir = resizeDir.current
        const { px, py, w, h } = resizeStart.current
        let nx = px, ny = py, nw = w, nh = h
        if (dir.includes('e'))  nw = Math.max(MIN_W, w + dx)
        if (dir.includes('s'))  nh = Math.max(MIN_H, h + dy)
        if (dir.includes('w')) { nw = Math.max(MIN_W, w - dx); nx = px + (w - nw) }
        if (dir.includes('n')) { nh = Math.max(MIN_H, h - dy); ny = py + (h - nh) }
        if (dir.includes('w') || dir.includes('n')) setPos({ x: nx, y: ny })
        setSize({ w: nw, h: nh })
      }
    }
    const onUp = () => { dragging.current = false; resizing.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  const toggleMaximize = () => {
    if (maximized) {
      setSize({ w: DEFAULT_W, h: DEFAULT_H })
      setPos({ x: (window.innerWidth - DEFAULT_W) / 2, y: (window.innerHeight - DEFAULT_H) / 2 })
    }
    setMaximized(v => !v)
  }

  const toggleCell = (key: string) => setCellState(prev => ({ ...prev, [key]: !prev[key] }))
  const resetAll   = () => setCellState(buildInitialState())

  if (!open) return null

  const issueCount = DEFAULT_MENU_DATA
    .flatMap(m => m.statuses.flatMap(s => s.buttons))
    .filter(b => b.issue).length

  const changedCount = (() => {
    const init = buildInitialState()
    return Object.keys(cellState).filter(k => cellState[k] !== init[k]).length
  })()

  const panelStyle: React.CSSProperties = maximized
    ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1400 }
    : { position: 'fixed', top: pos.y, left: pos.x, width: size.w, height: size.h, zIndex: 1400 }

  const rh = (dir: ResizeDir, sx: object) => (
    <Box key={dir} onMouseDown={onResizeMouseDown(dir)}
      sx={{ position: 'absolute', zIndex: 10, cursor: RESIZE_CURSORS[dir], ...sx }} />
  )

  return (
    <Box sx={{ ...panelStyle, display: 'flex', flexDirection: 'column',
      bgcolor: 'background.paper', borderRadius: maximized ? 0 : 1,
      boxShadow: 24, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>

      {/* ── 리사이즈 핸들 8방향 ─────────────────────────────────────────── */}
      {!maximized && (<>
        {rh('n',  { top: 0,    left: 8,    right: 8,   height: 5 })}
        {rh('s',  { bottom: 0, left: 8,    right: 8,   height: 5 })}
        {rh('e',  { top: 8,    right: 0,   bottom: 8,  width: 5  })}
        {rh('w',  { top: 8,    left: 0,    bottom: 8,  width: 5  })}
        {rh('nw', { top: 0,    left: 0,    width: 12,  height: 12 })}
        {rh('ne', { top: 0,    right: 0,   width: 12,  height: 12 })}
        {rh('sw', { bottom: 0, left: 0,    width: 12,  height: 12 })}
        {rh('se', { bottom: 0, right: 0,   width: 12,  height: 12 })}
      </>)}

      {/* ── 타이틀바 ──────────────────────────────────────────────────── */}
      <Box onMouseDown={onTitleMouseDown} sx={{
        display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75,
        bgcolor: 'primary.main', color: 'white',
        cursor: maximized ? 'default' : 'grab', '&:active': { cursor: maximized ? 'default' : 'grabbing' },
        flexShrink: 0,
      }}>
        <DragIndicatorIcon fontSize="small" sx={{ opacity: 0.7 }} />
        <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 'bold', fontSize: '0.85rem' }}>
          버튼 노출 조건 관리
        </Typography>
        {issueCount > 0 && (
          <Chip icon={<WarningAmberIcon sx={{ fontSize: '0.85rem !important' }} />}
            label={`이슈 ${issueCount}건`} size="small"
            sx={{ bgcolor: 'warning.main', color: 'white', height: 20, fontSize: '0.7rem',
              '& .MuiChip-icon': { color: 'white' } }} />
        )}
        {changedCount > 0 && (
          <Tooltip title="초기값으로 되돌리기">
            <Chip label={`${changedCount}개 수정됨`} size="small" onClick={resetAll}
              icon={<RestartAltIcon sx={{ fontSize: '0.85rem !important' }} />}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', height: 20, fontSize: '0.7rem', cursor: 'pointer',
                '& .MuiChip-icon': { color: 'white' }, '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }} />
          </Tooltip>
        )}
        <Tooltip title={maximized ? '원래 크기' : '최대화'}>
          <IconButton size="small" onClick={toggleMaximize}
            sx={{ color: 'white', p: 0.25, '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
            {maximized ? <CloseFullscreenIcon sx={{ fontSize: 16 }} /> : <OpenInFullIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        </Tooltip>
        <Tooltip title="닫기">
          <IconButton size="small" onClick={onClose}
            sx={{ color: 'white', p: 0.25, '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── 범례 ──────────────────────────────────────────────────────── */}
      <Box sx={{ px: 2, py: 0.6, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'grey.200',
        display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
          <Typography variant="caption">노출</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CheckCircleIcon sx={{ fontSize: 14, color: 'warning.main' }} />
          <Typography variant="caption">노출 (이슈)</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CancelIcon sx={{ fontSize: 14, color: 'grey.300' }} />
          <Typography variant="caption">숨김</Typography>
        </Box>
        <Typography variant="caption" color="text.disabled">| 셀 클릭으로 직접 수정 가능</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
          관리자 = SYSTEM_ADMIN / EHS_ADMIN / AUDIT_ADMIN
        </Typography>
      </Box>

      {/* ── 테이블 ────────────────────────────────────────────────────── */}
      <TableContainer component={Paper} elevation={0} sx={{ flex: 1, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ '& th': { bgcolor: 'grey.100', fontWeight: 'bold', fontSize: '0.75rem', whiteSpace: 'nowrap', py: 0.75 } }}>
              <TableCell sx={{ minWidth: 210 }}>메뉴</TableCell>
              <TableCell sx={{ minWidth: 115 }}>상태</TableCell>
              <TableCell sx={{ minWidth: 130 }}>버튼</TableCell>
              {ROLES.map(r => (
                <Tooltip key={r.key} title={r.desc} arrow>
                  <TableCell align="center" sx={{ minWidth: 66 }}>{r.label}</TableCell>
                </Tooltip>
              ))}
              <TableCell sx={{ minWidth: 180 }}>비고 / 이슈</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {DEFAULT_MENU_DATA.map((menu, mi) => {
              // 메뉴 총 행수 계산 (버튼 없음 상태도 1행)
              const totalRows = menu.statuses.reduce((acc, sg) => acc + Math.max(sg.buttons.length, 1), 0)
              let menuPrinted = false

              return menu.statuses.map((sg, si) => {
                const noButtons = sg.buttons.length === 0
                const sgRowSpan = Math.max(sg.buttons.length, 1)

                if (noButtons) {
                  const showMenu = !menuPrinted
                  if (showMenu) menuPrinted = true
                  return (
                    <TableRow key={`${mi}-${si}-empty`}
                      sx={{ bgcolor: 'grey.50', '& td': { borderColor: 'grey.200', py: 0.5 } }}>
                      {showMenu && (
                        <TableCell rowSpan={totalRows} sx={{
                          verticalAlign: 'top', pt: 1.5, borderRight: 1, borderColor: 'divider',
                          fontSize: '0.78rem', wordBreak: 'keep-all',
                        }}>
                          {menu.menuPath.split(' › ').map((seg, i, arr) =>
                            i < arr.length - 1
                              ? <Typography key={i} component="span" variant="caption" color="text.secondary">{seg} › </Typography>
                              : <Typography key={i} component="span" variant="body2" fontWeight="bold">{seg}</Typography>
                          )}
                        </TableCell>
                      )}
                      <TableCell sx={{ verticalAlign: 'middle', textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>
                        <Chip label={sg.statusLabel} color={sg.statusColor} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                      </TableCell>
                      <TableCell colSpan={ROLES.length + 2}
                        sx={{ color: 'text.disabled', fontSize: '0.75rem', fontStyle: 'italic' }}>
                        버튼 없음{sg.statusNote ? ` — ${sg.statusNote}` : ''}
                      </TableCell>
                    </TableRow>
                  )
                }

                return sg.buttons.map((btn, bi) => {
                  const showMenu   = !menuPrinted && bi === 0
                  const showStatus = bi === 0
                  if (showMenu) menuPrinted = true

                  return (
                    <TableRow key={`${mi}-${si}-${bi}`}
                      sx={{ bgcolor: btn.issue ? 'warning.lighter' : 'inherit',
                        '&:hover': { bgcolor: btn.issue ? 'warning.light' : 'action.hover' },
                        '& td': { borderColor: 'grey.200', py: 0.4 } }}>

                      {showMenu && (
                        <TableCell rowSpan={totalRows} sx={{
                          verticalAlign: 'top', pt: 1.5, borderRight: 1, borderColor: 'divider',
                          fontSize: '0.78rem', wordBreak: 'keep-all',
                        }}>
                          {menu.menuPath.split(' › ').map((seg, i, arr) =>
                            i < arr.length - 1
                              ? <Typography key={i} component="span" variant="caption" color="text.secondary">{seg} › </Typography>
                              : <Typography key={i} component="span" variant="body2" fontWeight="bold">{seg}</Typography>
                          )}
                        </TableCell>
                      )}

                      {showStatus && (
                        <TableCell rowSpan={sgRowSpan} sx={{
                          verticalAlign: 'middle', textAlign: 'center',
                          borderRight: 1, borderColor: 'divider',
                        }}>
                          <Chip label={sg.statusLabel} color={sg.statusColor} size="small"
                            sx={{ fontSize: '0.65rem', height: 20 }} />
                          {sg.statusNote && (
                            <Typography variant="caption" color="text.disabled" display="block"
                              sx={{ mt: 0.5, fontSize: '0.6rem', lineHeight: 1.2, whiteSpace: 'normal', wordBreak: 'keep-all', px: 0.5 }}>
                              {sg.statusNote}
                            </Typography>
                          )}
                        </TableCell>
                      )}

                      <TableCell sx={{ fontSize: '0.8rem', borderRight: 1, borderColor: 'divider' }}>
                        {btn.button}
                      </TableCell>

                      {ROLES.map(r => {
                        const key     = cellKey(mi, si, bi, r.key)
                        const visible = cellState[key] ?? btn.roles[r.key]
                        const init    = btn.roles[r.key]
                        const changed = visible !== init
                        return (
                          <TableCell key={r.key} align="center"
                            sx={{ px: 0.5, py: 0.4, cursor: 'pointer',
                              bgcolor: changed ? '#fffde7' : undefined }}
                            onClick={() => toggleCell(key)}>
                            <Tooltip title={`클릭하여 ${visible ? '숨김' : '노출'}으로 변경${changed ? ' (수정됨)' : ''}`} arrow>
                              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                                {visible
                                  ? <CheckCircleIcon fontSize="small"
                                      sx={{ color: btn.issue ? 'warning.main' : 'success.main',
                                        opacity: changed ? 1 : 0.85 }} />
                                  : <CancelIcon fontSize="small" sx={{ color: 'grey.300' }} />
                                }
                                {changed && (
                                  <Box sx={{ position: 'absolute', top: -2, right: -2, width: 6, height: 6,
                                    borderRadius: '50%', bgcolor: 'secondary.main' }} />
                                )}
                              </Box>
                            </Tooltip>
                          </TableCell>
                        )
                      })}

                      <TableCell sx={{ fontSize: '0.7rem', color: 'warning.dark' }}>
                        {btn.issue && (
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                            <WarningAmberIcon sx={{ fontSize: 13, mt: 0.2, flexShrink: 0, color: 'warning.main' }} />
                            <span>{btn.issue}</span>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              })
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── 하단 바 ────────────────────────────────────────────────────── */}
      <Box sx={{ px: 2, py: 0.75, borderTop: 1, borderColor: 'grey.200',
        display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          * 코드 직접 분석 기반 — 셀 클릭으로 수정 후 페이지 새로고침 시 초기화됨
        </Typography>
        {changedCount > 0 && (
          <Button size="small" startIcon={<RestartAltIcon />} onClick={resetAll} color="warning">
            초기화
          </Button>
        )}
        <Button variant="outlined" size="small" onClick={onClose}>닫기</Button>
      </Box>
    </Box>
  )
}

export default ButtonManageDialog
