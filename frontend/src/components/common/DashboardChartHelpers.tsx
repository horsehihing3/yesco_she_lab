import { ReactNode } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import { useThemeMode } from '../../context/ThemeContext'

/** 일반 대시보드(GeneralDashboard) categorical 5색 팔레트 */
export const CHART_COLORS = {
  red: '#EF4444',
  amber: '#F59E0B',
  green: '#10B981',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
}
export const CHART_PALETTE = [
  CHART_COLORS.red, CHART_COLORS.amber, CHART_COLORS.green,
  CHART_COLORS.blue, CHART_COLORS.purple, CHART_COLORS.cyan,
]

// 상태별 의미 색상 — GeneralDashboard 팔레트와 일치
export const STATUS_COLOR_HEX: Record<string, string> = {
  // 작성중 / pending / draft → 보라
  draft: '#8B5CF6', DRAFT: '#8B5CF6',
  // 결재중 → 노랑
  submitted: '#F59E0B', SUBMITTED: '#F59E0B', PENDING: '#F59E0B', PENDING_APPROVAL: '#F59E0B',
  REQUESTED: '#F59E0B', completion_submitted: '#F59E0B', COMPLETION_SUBMITTED: '#F59E0B', COMPLETION_PENDING: '#F59E0B',
  // 승인 → 파랑
  approved: '#3B82F6', APPROVED: '#3B82F6', IN_PROGRESS: '#3B82F6',
  // 완료 → 초록
  completed: '#10B981', COMPLETED: '#10B981', DONE: '#10B981',
  // 반려 → 빨강 / 취소 → 회색
  rejected: '#EF4444', REJECTED: '#EF4444', CANCELLED: '#A3A3A3',
}

// 위험 등급별 색상
export const RISK_COLOR_HEX: Record<string, string> = {
  LOW: '#10B981', MEDIUM: '#F59E0B', HIGH: '#EF4444', CRITICAL: '#B91C1C',
}

/** shadcn-style tooltip with dark mode support */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ShadcnTooltip = ({ active, payload, label, hideLabel }: { active?: boolean; payload?: any[]; label?: string | number; hideLabel?: boolean }) => {
  const { isDarkMode } = useThemeMode()
  if (!active || !payload?.length) return null
  const bg = isDarkMode ? '#0a0a0a' : '#ffffff'
  const fg = isDarkMode ? '#fafafa' : '#0a0a0a'
  const mutedFg = isDarkMode ? '#a1a1a1' : '#737373'
  const borderColor = isDarkMode ? 'rgba(63,63,70,0.5)' : 'rgba(229,229,229,0.5)'
  return (
    <div style={{
      minWidth: '8rem', display: 'grid', alignItems: 'start', gap: 6,
      borderRadius: 8, border: `1px solid ${borderColor}`, backgroundColor: bg,
      padding: '6px 10px', fontSize: 12, lineHeight: '16px', color: fg,
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
    }}>
      {label && !hideLabel && <div style={{ fontWeight: 500, color: fg }}>{label}</div>}
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 10, height: 10, flexShrink: 0, borderRadius: 2,
            border: `1px solid ${borderColor}`,
            backgroundColor: entry.payload?.fill || entry.color,
          }} />
          <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <span style={{ color: mutedFg }}>{entry.name}</span>
            <span style={{ fontWeight: 600, fontFamily: 'monospace', color: fg }}>
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

/** shadcn-style outlined card wrapper used in GeneralDashboard */
export const ChartCard: React.FC<{
  title: string
  description?: string
  children: ReactNode
  height?: number
}> = ({ title, description, children, height = 420 }) => (
  <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height, borderRadius: 2, overflow: 'hidden' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 2.5, px: 3 }}>
      <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1 }}>{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1 }}>
          {description}
        </Typography>
      )}
    </Box>
    <Box sx={{ flex: 1, px: 2, py: 1 }}>{children}</Box>
  </Paper>
)
