import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Paper, Typography, Grid,
  Select, MenuItem, FormControl, CircularProgress, Alert,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import PlayCircleIcon from '@mui/icons-material/PlayCircle'
import ErrorIcon from '@mui/icons-material/Error'
import { useTranslation } from 'react-i18next'
import axiosInstance from '../../api/axiosInstance'
import { EhsPlan, KpiQuarterStatus } from '../../types/planKpiGoal.types'
import { ApiResponse } from '../../types/common.types'
import { KPI_STATUS_COLOR, KPI_STATUS_LABEL } from './GoalsTable'
import SafetyGoalProgressTable from './SafetyGoalProgressTable'

const currentYear = new Date().getFullYear()

const fetchApprovedPlans = async (year: number): Promise<EhsPlan[]> => {
  const res = await axiosInstance.get<ApiResponse<EhsPlan[]>>(`/ehs-plans/approved?year=${year}`)
  return res.data.data || []
}

const PlanOverviewTab: React.FC = () => {
  const { t } = useTranslation()
  const [year, setYear] = useState(currentYear)

  const { data: approved = [], isLoading } = useQuery({
    queryKey: ['planOverview-approved', year],
    queryFn: () => fetchApprovedPlans(year),
  })

  // KPI 분기별 달성상태 집계 — 승인된 plan 의 goals 의 q?_status 기준
  const quarterCounts: Record<KpiQuarterStatus, number> = {
    ACHIEVED: 0, IN_PROGRESS: 0, REVIEW: 0, NOT_ACHIEVED: 0,
  }
  let totalCheckedQuarters = 0
  approved.forEach(p => {
    (p.goals || []).forEach(g => {
      const pairs: Array<[boolean | undefined, string | null | undefined]> = [
        [g.q1, g.q1Status], [g.q2, g.q2Status], [g.q3, g.q3Status], [g.q4, g.q4Status],
      ]
      pairs.forEach(([checked, status]) => {
        if (checked) {
          totalCheckedQuarters += 1
          if (status && (status as KpiQuarterStatus) in quarterCounts) {
            quarterCounts[status as KpiQuarterStatus] += 1
          }
        }
      })
    })
  })
  const kpiAchievementRate = totalCheckedQuarters > 0
    ? Math.round((quarterCounts.ACHIEVED / totalCheckedQuarters) * 100)
    : 0

  // KPI 현황(=승인된 plan) 기반 통계
  const totalApproved = approved.length
  const doneApproved = approved.filter(p => p.status === 'DONE').length
  const implementationRate = totalApproved > 0 ? Math.round((doneApproved / totalApproved) * 100) : 0
  // 진행 / 지연 — 분기 셀 단위 카운트 (KPI 현황 하단 도넛 항목과 일치)
  const inProgressCount = quarterCounts.IN_PROGRESS
  const delayedCount = quarterCounts.NOT_ACHIEVED

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }

  const kpiCards = [
    { label: t('pkg.implementationRate'), value: `${implementationRate}%`, icon: <CheckCircleIcon />, color: '#22c55e' },
    { label: t('pkg.kpiAchievement'), value: `${kpiAchievementRate}%`, icon: <TrendingUpIcon />, color: '#3b82f6' },
    { label: t('pkg.inProgressTasks'), value: String(inProgressCount), icon: <PlayCircleIcon />, color: '#f59e0b' },
    { label: t('pkg.delayedTasks'), value: String(delayedCount), icon: <ErrorIcon />, color: '#ef4444' },
  ]

  const kpiStatusItems: Array<{ key: KpiQuarterStatus; label: string }> = [
    { key: 'ACHIEVED',     label: t('pkg.achieved',     KPI_STATUS_LABEL.ACHIEVED) },
    { key: 'IN_PROGRESS',  label: t('pkg.inProgress',   KPI_STATUS_LABEL.IN_PROGRESS) },
    { key: 'REVIEW',       label: t('pkg.review',       KPI_STATUS_LABEL.REVIEW) },
    { key: 'NOT_ACHIEVED', label: t('pkg.notAchieved',  KPI_STATUS_LABEL.NOT_ACHIEVED) },
  ]

  return (
    <Box>
      {/* Year selector */}
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, mb: 2 }}>
        <FormControl size="small" sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 100 } }}>
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))} displayEmpty>
            <MenuItem value="" disabled>선택하세요</MenuItem>
            {[currentYear - 1, currentYear, currentYear + 1].map(y => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* KPI Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpiCards.map((card, idx) => (
          <Grid item xs={6} md={3} key={idx}>
            <Paper sx={(theme: any) => ({ p: 2, display: 'flex', alignItems: 'center', gap: 2, ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }) })}>
              <Box sx={{ color: card.color, display: 'flex', alignItems: 'center' }}>
                {card.icon}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                <Typography variant="h5" fontWeight="bold">{card.value}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Two-column grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Left: KPI Achievement Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={(theme: any) => ({ p: 2, height: '100%', ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }) })}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              {t('pkg.kpiAchievementStatus')}
            </Typography>
            {kpiStatusItems.map(item => (
              <Box key={item.key} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: KPI_STATUS_COLOR[item.key], flexShrink: 0 }} />
                <Typography variant="body2" sx={{ flex: 1 }}>{item.label}</Typography>
                <Typography variant="body2" fontWeight="bold">{quarterCounts[item.key]}{t('common.cases')}</Typography>
              </Box>
            ))}
            {totalCheckedQuarters === 0 && (
              <Alert severity="info" sx={{ mt: 1 }}>{t('common.noData')}</Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* 안전 목표 */}
      <Box>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          {t('generalDashboard.safetyGoal', '안전 목표')}
        </Typography>
        <SafetyGoalProgressTable />
      </Box>
    </Box>
  )
}

export default PlanOverviewTab
