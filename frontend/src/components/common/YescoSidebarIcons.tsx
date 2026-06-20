import React from 'react'

// YESCO 모드 사이드바 전용 2-tone 커스텀 SVG 아이콘 세트
// 디자인 원칙 (lsyesco.com 푸터 패턴):
//  - 흰색 메인 글리프 (#fff)
//  - 붉은색 강조 디테일 (#E60012) — 받침대 / 포인트 / 라벨
//  - 사각 박스 형태 (네이비 배경 위에 떠 있는 느낌)
//  - viewBox 32×32

const WHITE = '#ffffff'
const RED = '#E60012'

type IconProps = { size?: number }

const wrapSvg = (children: React.ReactNode, size = 26) => (
  <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'block' }}>
    {children}
  </svg>
)

// ── Dashboard: 계산기 (요금조회 모티프) ──
export const YescoDashboard: React.FC<IconProps> = ({ size }) => wrapSvg(
  <>
    <rect x="6" y="4" width="20" height="24" rx="2" fill={WHITE} />
    <rect x="8" y="6.5" width="16" height="4" rx="1" fill={RED} />
    <circle cx="11" cy="15" r="1.5" fill={RED} />
    <circle cx="16" cy="15" r="1.5" fill={RED} />
    <circle cx="21" cy="15" r="1.5" fill={RED} />
    <circle cx="11" cy="20" r="1.5" fill={RED} />
    <circle cx="16" cy="20" r="1.5" fill={RED} />
    <circle cx="21" cy="20" r="1.5" fill={RED} />
    <rect x="9.5" y="23.5" width="13" height="2.5" rx="0.5" fill={RED} />
  </>, size,
)

// ── SHE: 방패 + 붉은 체크 ──
export const YescoEhs: React.FC<IconProps> = ({ size }) => wrapSvg(
  <>
    <path d="M16 3 L26 7 V16 C26 22 21 27 16 29 C11 27 6 22 6 16 V7 Z" fill={WHITE} />
    <path d="M11.5 16 L14.5 19 L20.5 13" stroke={RED} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </>, size,
)

// ── 안전관리: 안전모 + 붉은 띠 ──
export const YescoSafety: React.FC<IconProps> = ({ size }) => wrapSvg(
  <>
    <path d="M6 22 V19 C6 13 10 9 16 9 C22 9 26 13 26 19 V22 Z" fill={WHITE} />
    <rect x="5" y="22" width="22" height="3" rx="1" fill={RED} />
    <rect x="14.5" y="6" width="3" height="4" rx="0.5" fill={WHITE} />
    <rect x="6" y="18" width="20" height="2" fill={RED} />
  </>, size,
)

// ── 협력업체관리: 두 인물 + 붉은 악수선 ──
export const YescoPartner: React.FC<IconProps> = ({ size }) => wrapSvg(
  <>
    <circle cx="10" cy="10" r="3.5" fill={WHITE} />
    <circle cx="22" cy="10" r="3.5" fill={WHITE} />
    <path d="M4 25 V22 C4 19 6.5 17 10 17 C12 17 13.5 17.7 14.5 18.7" fill={WHITE} />
    <path d="M28 25 V22 C28 19 25.5 17 22 17 C20 17 18.5 17.7 17.5 18.7" fill={WHITE} />
    <rect x="13" y="20" width="6" height="3" rx="0.5" fill={RED} />
  </>, size,
)

// ── 건강관리: 십자 + 붉은 하트 ──
export const YescoHealth: React.FC<IconProps> = ({ size }) => wrapSvg(
  <>
    <rect x="6" y="6" width="20" height="20" rx="2" fill={WHITE} />
    <path d="M16 22 C12 19 10 16.5 10 14 C10 12 11.5 10.5 13.5 10.5 C14.7 10.5 15.7 11 16 12 C16.3 11 17.3 10.5 18.5 10.5 C20.5 10.5 22 12 22 14 C22 16.5 20 19 16 22 Z" fill={RED} />
  </>, size,
)

// ── 환경관리: 잎 + 붉은 물방울 ──
export const YescoEnv: React.FC<IconProps> = ({ size }) => wrapSvg(
  <>
    <path d="M6 22 C6 14 12 6 24 6 C24 18 18 24 10 24 Z" fill={WHITE} />
    <path d="M8 24 L18 14" stroke={RED} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M22 18 C22 16.5 23 14.5 24 13 C25 14.5 26 16.5 26 18 C26 19.5 25 21 24 21 C23 21 22 19.5 22 18 Z" fill={RED} />
  </>, size,
)

// ── 방사선: 방사능 심볼 ──
export const YescoRadiation: React.FC<IconProps> = ({ size }) => wrapSvg(
  <>
    <circle cx="16" cy="16" r="13" fill={WHITE} />
    <circle cx="16" cy="16" r="3" fill={RED} />
    <path d="M16 13 L13 7.5 A 9.5 9.5 0 0 1 19 7.5 Z" fill={RED} />
    <path d="M18.5 17.5 L24 15 A 9.5 9.5 0 0 1 21 23 Z" fill={RED} />
    <path d="M13.5 17.5 L11 23 A 9.5 9.5 0 0 1 8 15 Z" fill={RED} />
  </>, size,
)

// ── 소방/방재: 불꽃 + 붉은 받침 ──
export const YescoFire: React.FC<IconProps> = ({ size }) => wrapSvg(
  <>
    <path d="M16 4 C18 8 22 10 22 16 C22 21 19 25 16 25 C13 25 10 21 10 16 C10 13 12 12 13 13 C12 9 14 6 16 4 Z" fill={WHITE} />
    <rect x="6" y="25" width="20" height="3" rx="1" fill={RED} />
    <circle cx="16" cy="19" r="2.5" fill={RED} />
  </>, size,
)

// ── 법정시설: 건물 ──
export const YescoFacility: React.FC<IconProps> = ({ size }) => wrapSvg(
  <>
    <path d="M5 28 V13 L16 6 L27 13 V28 Z" fill={WHITE} />
    <rect x="5" y="11" width="22" height="3" fill={RED} />
    <rect x="10" y="16" width="3" height="3" fill={RED} />
    <rect x="15" y="16" width="3" height="3" fill={RED} />
    <rect x="20" y="16" width="3" height="3" fill={RED} />
    <rect x="13" y="22" width="6" height="6" fill={RED} />
  </>, size,
)

// ── 인허가: 문서 + 붉은 도장 ──
export const YescoPermit: React.FC<IconProps> = ({ size }) => wrapSvg(
  <>
    <path d="M8 4 H20 L26 10 V28 H8 Z" fill={WHITE} />
    <path d="M20 4 V10 H26" fill="none" stroke={RED} strokeWidth="1.5" />
    <rect x="11" y="14" width="10" height="1.5" fill={RED} />
    <rect x="11" y="17" width="10" height="1.5" fill={RED} />
    <circle cx="21" cy="23" r="3.5" fill={RED} />
    <path d="M19 23 L20.5 24.5 L23 22" stroke={WHITE} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </>, size,
)

// ── 화학물질: 플라스크 ──
export const YescoChem: React.FC<IconProps> = ({ size }) => wrapSvg(
  <>
    <path d="M12 4 H20 V11 L25 24 C25.5 25.5 24.5 27 23 27 H9 C7.5 27 6.5 25.5 7 24 L12 11 Z" fill={WHITE} />
    <rect x="11" y="3" width="10" height="2" rx="0.5" fill={WHITE} />
    <path d="M9.5 18 L22.5 18 L24.5 24 C25 25.5 24 27 22.5 27 H9.5 C8 27 7 25.5 7.5 24 Z" fill={RED} />
    <circle cx="13" cy="22" r="1" fill={WHITE} />
    <circle cx="18" cy="24" r="1.2" fill={WHITE} />
  </>, size,
)

// ── 공정안전 (PSM): 톱니바퀴 + 붉은 중심 ──
export const YescoPsm: React.FC<IconProps> = ({ size }) => wrapSvg(
  <>
    <path d="M16 4 L18 7 L21 6 L22 9.5 L25 10 L24 13.5 L26 16 L24 18.5 L25 22 L22 22.5 L21 26 L18 25 L16 28 L14 25 L11 26 L10 22.5 L7 22 L8 18.5 L6 16 L8 13.5 L7 10 L10 9.5 L11 6 L14 7 Z" fill={WHITE} />
    <circle cx="16" cy="16" r="5" fill={RED} />
    <circle cx="16" cy="16" r="2" fill={WHITE} />
  </>, size,
)

// ── 결재 (승인): 클립보드 + 붉은 체크 ──
export const YescoApproval: React.FC<IconProps> = ({ size }) => wrapSvg(
  <>
    <rect x="7" y="6" width="18" height="22" rx="2" fill={WHITE} />
    <rect x="11" y="3" width="10" height="5" rx="1" fill={RED} />
    <path d="M11 16 L14 19 L21 12" stroke={RED} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="11" y="22" width="10" height="1.5" fill={RED} />
  </>, size,
)

// ── 체크리스트: 체크박스 리스트 ──
export const YescoChecklist: React.FC<IconProps> = ({ size }) => wrapSvg(
  <>
    <rect x="5" y="5" width="22" height="22" rx="2" fill={WHITE} />
    <rect x="8" y="9" width="3" height="3" rx="0.5" fill={RED} />
    <rect x="13" y="9.5" width="11" height="2" fill={RED} />
    <rect x="8" y="14.5" width="3" height="3" rx="0.5" fill={RED} />
    <rect x="13" y="15" width="11" height="2" fill={RED} />
    <rect x="8" y="20" width="3" height="3" rx="0.5" fill={RED} />
    <rect x="13" y="20.5" width="11" height="2" fill={RED} />
  </>, size,
)

// textKey → 컴포넌트 매핑
const ICON_MAP: Record<string, React.FC<IconProps>> = {
  'nav.dashboard':           YescoDashboard,
  'nav.ehs':                 YescoEhs,
  'nav.safetyManage':        YescoSafety,
  'nav.partnerGroupMgmt':    YescoPartner,
  'nav.healthManage':        YescoHealth,
  'nav.chemicalMgmt':        YescoChem,
  'nav.approval':            YescoApproval,
  'nav.checklist':           YescoChecklist,
}

export const getYescoIcon = (textKey: string): React.FC<IconProps> | null =>
  ICON_MAP[textKey] || null
