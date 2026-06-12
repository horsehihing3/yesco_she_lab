import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Box, Typography, Paper, CircularProgress } from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LabelList,
} from 'recharts'
import { emergencyPlanApi, emergencyDrillApi } from '../../api/emergencyExtendedApi'
import { EmergencyPlan, EmergencyDrill } from '../../types/emergencyExtended.types'
import { useThemeMode } from '../../context/ThemeContext'
import useCodeMap from '../../hooks/useCodeMap'
import { ChartCard, ShadcnTooltip, STATUS_COLOR_HEX, CHART_COLORS } from '../common/DashboardChartHelpers'

// 결재 워크플로우 상태 — DRILL_STATUS 코드 그룹에 없는 코드들의 한국어 fallback
const STATUS_DEFAULTS: Record<string, string> = {
  DRAFT: '작성중', PENDING_APPROVAL: '계획 결재중', APPROVED: '계획 승인',
  COMPLETION_PENDING: '완료 결재중', DONE: '완료', REJECTED: '반려',
  SCHEDULED: '예정',
}

const KpiCard: React.FC<{ label: string; value: number | string; color?: string }> = ({ label, value, color = CHART_COLORS.blue }) => (
  <Paper sx={(theme: any) => ({ p: 2.5, pl: 3, position: 'relative', overflow: 'hidden', ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }), '&::before': { content: '""', position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, backgroundColor: theme.isYesco ? '#E60012' : '#2563eb', borderTopLeftRadius: 'inherit', borderBottomLeftRadius: 'inherit' } })}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5 }}>{value}</Typography>
  </Paper>
)

const monthKey = (iso?: string) => (iso || '').substring(0, 7)

const EmrDashboardTab: React.FC = () => {
  const { t } = useTranslation()
  const { isDarkMode } = useThemeMode()
  const tickColor = isDarkMode ? '#a1a1a1' : '#737373'
  const { getLabel: getDrillStatusLabel } = useCodeMap('DRILL_STATUS')

  const { data: planData, isLoading: l1 } = useQuery({
    queryKey: ['emrDashPlans'],
    queryFn: () => emergencyPlanApi.getAll(0, 1000),
  })
  const { data: drillData, isLoading: l2 } = useQuery({
    queryKey: ['emrDashDrills'],
    queryFn: () => emergencyDrillApi.getAll(0, 1000),
  })

  const plans: EmergencyPlan[] = useMemo(() => (planData as any)?.content || [], [planData])
  const drills: EmergencyDrill[] = useMemo(() => (drillData as any)?.content || [], [drillData])

  const kpi = useMemo(() => ({
    plans: plans.length,
    drills: drills.length,
    drillCompleted: drills.filter((d: any) => d.status === 'COMPLETED' || d.status === 'DONE').length,
    drillInApproval: drills.filter((d: any) => d.status === 'PENDING_APPROVAL' || d.status === 'COMPLETION_PENDING').length,
    drillDraft: drills.filter((d: any) => d.status === 'DRAFT').length,
  }), [plans, drills])

  const drillStatusData = useMemo(() => {
    const map: Record<string, number> = {}
    drills.forEach((d: any) => { map[d.status || 'UNKNOWN'] = (map[d.status || 'UNKNOWN'] || 0) + 1 })
    return Object.entries(map).map(([status, value]) => {
      const codeLabel = getDrillStatusLabel(status)
      // useCodeMap.getLabel은 코드그룹에 없으면 raw code를 반환 → 그 경우 local fallback 사용
      const isCodeKnown = codeLabel && codeLabel !== status
      return {
        label: isCodeKnown ? codeLabel : (STATUS_DEFAULTS[status] || status),
        status, value,
        fill: STATUS_COLOR_HEX[status] || CHART_COLORS.purple,
      }
    })
  }, [drills, getDrillStatusLabel])

  const monthly = useMemo(() => {
    const mapPlan: Record<string, number> = {}
    const mapDrill: Record<string, number> = {}
    plans.forEach((p: any) => { const k = monthKey(p.createdAt); if (k) mapPlan[k] = (mapPlan[k] || 0) + 1 })
    drills.forEach((d: any) => { const k = monthKey(d.trainingStartDate || d.createdAt); if (k) mapDrill[k] = (mapDrill[k] || 0) + 1 })
    const keys = Array.from(new Set([...Object.keys(mapPlan), ...Object.keys(mapDrill)])).sort().slice(-12)
    return keys.map(k => ({ month: k, plan: mapPlan[k] || 0, drill: mapDrill[k] || 0 }))
  }, [plans, drills])

  if (l1 || l2) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2 }}>
        <KpiCard label={t('emr.dashboard.plans', '비상 계획')} value={kpi.plans} color={CHART_COLORS.blue} />
        <KpiCard label={t('emr.dashboard.drills', '비상 훈련')} value={kpi.drills} color={CHART_COLORS.cyan} />
        <KpiCard label={t('emr.dashboard.drillDraft', '훈련 작성중')} value={kpi.drillDraft} color={CHART_COLORS.purple} />
        <KpiCard label={t('emr.dashboard.drillInApproval', '훈련 결재중')} value={kpi.drillInApproval} color={CHART_COLORS.amber} />
        <KpiCard label={t('emr.dashboard.drillCompleted', '훈련 완료')} value={kpi.drillCompleted} color={CHART_COLORS.green} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <ChartCard title={t('emr.dashboard.drillByStatus', '훈련 상태 분포')} description={t('emr.dashboard.drillByStatusDesc', '비상 훈련 현황')}>
          {drillStatusData.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>{t('common.noData', '데이터가 없습니다')}</Typography>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<ShadcnTooltip />} />
                <Pie data={drillStatusData} dataKey="value" nameKey="label" stroke="none" animationDuration={400}>
                  <LabelList dataKey="label" stroke="none" fontSize={11} fill="#fff" fontWeight={600} style={{ pointerEvents: 'none' }} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title={t('emr.dashboard.monthly', '월별 등록 추이')} description={t('emr.dashboard.monthlyDesc', '최근 12개월')}>
          {monthly.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>{t('common.noData', '데이터가 없습니다')}</Typography>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ left: 0, right: 12, top: 12, bottom: 12 }}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: tickColor, fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: tickColor, fontSize: 12 }} />
                <Tooltip content={<ShadcnTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Legend />
                <Bar dataKey="plan" name={t('emr.dashboard.plans', '비상 계획')} fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} />
                <Bar dataKey="drill" name={t('emr.dashboard.drills', '비상 훈련')} fill={CHART_COLORS.cyan} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </Box>
    </Box>
  )
}

export default EmrDashboardTab
