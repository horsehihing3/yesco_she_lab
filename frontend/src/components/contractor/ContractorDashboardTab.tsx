import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Box, Typography, Paper, CircularProgress } from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList,
} from 'recharts'
import { contractorPlanApi } from '../../api/contractorApi'
import { ContractorPlan } from '../../types/contractor.types'
import useCodeMap from '../../hooks/useCodeMap'
import { useThemeMode } from '../../context/ThemeContext'
import { ChartCard, ShadcnTooltip, STATUS_COLOR_HEX, RISK_COLOR_HEX, CHART_COLORS } from '../common/DashboardChartHelpers'

const STATUS_DEFAULTS: Record<string, string> = {
  DRAFT: '작성중', PENDING_APPROVAL: '계획 결재중', APPROVED: '계획 승인',
  COMPLETION_PENDING: '완료 결재중', DONE: '완료', REJECTED: '반려',
}

const KpiCard: React.FC<{ label: string; value: number | string; color?: string }> = ({ label, value, color: _color = CHART_COLORS.blue }) => (
  <Paper sx={(theme: any) => ({ p: 2.5, pl: 3, position: 'relative', overflow: 'hidden', ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }), '&::before': { content: '""', position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, backgroundColor: theme.isYesco ? '#E60012' : '#2563eb', borderTopLeftRadius: 'inherit', borderBottomLeftRadius: 'inherit' } })}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5 }}>{value}</Typography>
  </Paper>
)

const ContractorDashboardTab: React.FC = () => {
  const { t } = useTranslation()
  const { isDarkMode } = useThemeMode()
  const tickColor = isDarkMode ? '#a1a1a1' : '#737373'
  const { getLabel: getRiskLabel } = useCodeMap('RISK_LEVEL')

  const { data, isLoading } = useQuery({
    queryKey: ['contractorDashAll'],
    queryFn: () => contractorPlanApi.getAll(0, 1000),
  })

  const list: ContractorPlan[] = useMemo(() => (data as any)?.content || [], [data])

  const kpi = useMemo(() => {
    const total = list.length
    const draft = list.filter(i => i.status === 'DRAFT').length
    const inApproval = list.filter(i => i.status === 'PENDING_APPROVAL' || i.status === 'COMPLETION_PENDING').length
    const done = list.filter(i => i.status === 'DONE').length
    const rejected = list.filter(i => i.status === 'REJECTED').length
    const highRisk = list.filter(i => i.riskLevel === 'HIGH' || i.riskLevel === 'CRITICAL').length
    return { total, draft, inApproval, done, rejected, highRisk }
  }, [list])

  const statusData = useMemo(() => {
    const map: Record<string, number> = {}
    list.forEach(i => { map[i.status] = (map[i.status] || 0) + 1 })
    return Object.entries(map).map(([status, value]) => ({
      label: t(`contractor.status.${status}`, STATUS_DEFAULTS[status] || status),
      status, value,
      fill: STATUS_COLOR_HEX[status] || CHART_COLORS.purple,
    }))
  }, [list, t])

  const riskData = useMemo(() => {
    const map: Record<string, number> = {}
    list.forEach(i => {
      const k = i.riskLevel || 'UNKNOWN'
      map[k] = (map[k] || 0) + 1
    })
    return Object.entries(map).map(([level, value]) => ({
      label: level === 'UNKNOWN' ? t('common.unset', '미지정') : (getRiskLabel(level) || level),
      level, value,
      fill: RISK_COLOR_HEX[level] || CHART_COLORS.purple,
    }))
  }, [list, getRiskLabel, t])

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2 }}>
        <KpiCard label={t('common.total', '전체')} value={kpi.total} color={CHART_COLORS.blue} />
        <KpiCard label={t('common.draft', '작성중')} value={kpi.draft} color={CHART_COLORS.purple} />
        <KpiCard label={t('contractor.dashboard.inApproval', '결재중')} value={kpi.inApproval} color={CHART_COLORS.amber} />
        <KpiCard label={t('common.completed', '완료')} value={kpi.done} color={CHART_COLORS.green} />
        <KpiCard label={t('contractor.dashboard.highRisk', '고위험')} value={kpi.highRisk} color={CHART_COLORS.red} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <ChartCard title={t('contractor.dashboard.byStatus', '상태 분포')} description={t('contractor.dashboard.byStatusDesc', '협력사 작업 현황')}>
          {statusData.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>{t('common.noData', '데이터가 없습니다')}</Typography>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<ShadcnTooltip />} />
                <Pie data={statusData} dataKey="value" nameKey="label" stroke="none" animationDuration={400}>
                  <LabelList dataKey="label" stroke="none" fontSize={11} fill="#fff" fontWeight={600} style={{ pointerEvents: 'none' }} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title={t('contractor.dashboard.byRisk', '위험 등급 분포')} description={t('contractor.dashboard.byRiskDesc', '등급별 건수')}>
          {riskData.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>{t('common.noData', '데이터가 없습니다')}</Typography>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData} layout="vertical" margin={{ left: 16, right: 12 }}>
                <YAxis dataKey="label" type="category" tickLine={false} tickMargin={10} axisLine={false} tick={{ fill: tickColor, fontSize: 12 }} />
                <XAxis dataKey="value" type="number" hide />
                <Tooltip content={<ShadcnTooltip />} cursor={false} />
                <Bar dataKey="value" radius={5}>
                  {riskData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </Box>
    </Box>
  )
}

export default ContractorDashboardTab
