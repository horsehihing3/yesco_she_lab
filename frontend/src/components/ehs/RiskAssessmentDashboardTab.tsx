import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Box, Typography, Paper, CircularProgress } from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList,
} from 'recharts'
import { riskAssessmentApi } from '../../api/riskAssessmentApi'
import { RiskAssessment } from '../../types/riskAssessment.types'
import { useThemeMode } from '../../context/ThemeContext'
import { ChartCard, ShadcnTooltip, STATUS_COLOR_HEX, CHART_COLORS } from '../common/DashboardChartHelpers'

const STATUS_DEFAULTS: Record<string, string> = {
  draft: '작성중',
  submitted: '승인대기',
  approved: '계획 승인',
  completion_submitted: '완료 결재 대기',
  rejected: '반려',
  completed: '완료',
}

const KpiCard: React.FC<{ label: string; value: number | string; color?: string }> = ({ label, value, color = CHART_COLORS.blue }) => (
  <Paper sx={(theme: any) => ({ p: 2.5, pl: 3, position: 'relative', overflow: 'hidden', ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }), '&::before': { content: '""', position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, backgroundColor: theme.isYesco ? '#E60012' : '#2563eb', borderTopLeftRadius: 'inherit', borderBottomLeftRadius: 'inherit' } })}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5 }}>{value}</Typography>
  </Paper>
)

const monthKey = (iso?: string) => (iso || '').substring(0, 7)

const RiskAssessmentDashboardTab: React.FC = () => {
  const { t } = useTranslation()
  const { isDarkMode } = useThemeMode()
  const tickColor = isDarkMode ? '#a1a1a1' : '#737373'

  const { data, isLoading } = useQuery({
    queryKey: ['riskAssessmentDashAll'],
    queryFn: () => riskAssessmentApi.getAll({ page: 0, size: 1000 }),
  })

  const list: RiskAssessment[] = useMemo(() => (data as any)?.content || [], [data])

  const kpi = useMemo(() => {
    const total = list.length
    const draft = list.filter(i => i.status === 'draft').length
    const inApproval = list.filter(i => i.status === 'submitted' || i.status === 'completion_submitted').length
    const completed = list.filter(i => i.status === 'completed').length
    const rejected = list.filter(i => i.status === 'rejected').length
    return { total, draft, inApproval, completed, rejected }
  }, [list])

  const statusData = useMemo(() => {
    const map: Record<string, number> = {}
    list.forEach(i => {
      const key = (i.status || '').toLowerCase()
      map[key] = (map[key] || 0) + 1
    })
    return Object.entries(map).map(([status, value]) => ({
      label: t(`riskAssessment.status.${status}`, STATUS_DEFAULTS[status] || status),
      status, value,
      fill: STATUS_COLOR_HEX[status] || CHART_COLORS.purple,
    }))
  }, [list, t])

  const monthly = useMemo(() => {
    const map: Record<string, number> = {}
    list.forEach(i => {
      const k = monthKey(i.createdAt)
      if (k) map[k] = (map[k] || 0) + 1
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([month, value]) => ({
      label: month, value, fill: CHART_COLORS.blue,
    }))
  }, [list])

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2 }}>
        <KpiCard label={t('common.total', '전체')} value={kpi.total} color={CHART_COLORS.blue} />
        <KpiCard label={t('common.draft', '작성중')} value={kpi.draft} color={CHART_COLORS.purple} />
        <KpiCard label={t('ra.dashboard.inApproval', '결재중')} value={kpi.inApproval} color={CHART_COLORS.amber} />
        <KpiCard label={t('common.completed', '완료')} value={kpi.completed} color={CHART_COLORS.green} />
        <KpiCard label={t('common.rejected', '반려')} value={kpi.rejected} color={CHART_COLORS.red} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <ChartCard title={t('ra.dashboard.byStatus', '상태 분포')} description={t('ra.dashboard.byStatusDesc', '위험성 평가 현황')}>
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

        <ChartCard title={t('ra.dashboard.monthly', '월별 등록 추이')} description={t('ra.dashboard.monthlyDesc', '최근 12개월')}>
          {monthly.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>{t('common.noData', '데이터가 없습니다')}</Typography>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} layout="vertical" margin={{ left: 16, right: 12 }}>
                <YAxis dataKey="label" type="category" tickLine={false} tickMargin={10} axisLine={false} tick={{ fill: tickColor, fontSize: 12 }} />
                <XAxis dataKey="value" type="number" hide />
                <Tooltip content={<ShadcnTooltip />} cursor={false} />
                <Bar dataKey="value" radius={5}>
                  {monthly.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </Box>
    </Box>
  )
}

export default RiskAssessmentDashboardTab
