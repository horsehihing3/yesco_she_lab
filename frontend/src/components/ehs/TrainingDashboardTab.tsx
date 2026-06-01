import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Box, Typography, Paper, CircularProgress } from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList,
} from 'recharts'
import { trainingApplicationApi, trainingCourseApi } from '../../api/trainingApi'
import { TrainingApplication } from '../../types/trainingApplication.types'
import { useThemeMode } from '../../context/ThemeContext'
import { ChartCard, ShadcnTooltip, STATUS_COLOR_HEX, CHART_COLORS, CHART_PALETTE } from '../common/DashboardChartHelpers'

const STATUS_DEFAULTS: Record<string, string> = {
  PENDING: '신청 대기', APPROVED: '승인', COMPLETED: '완료', REJECTED: '반려', CANCELLED: '취소',
}

const KpiCard: React.FC<{ label: string; value: number | string; color?: string }> = ({ label, value, color = CHART_COLORS.blue }) => (
  <Paper sx={{ p: 2.5, borderLeft: 4, borderColor: color }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5 }}>{value}</Typography>
  </Paper>
)

const TrainingDashboardTab: React.FC = () => {
  const { t } = useTranslation()
  const { isDarkMode } = useThemeMode()
  const tickColor = isDarkMode ? '#a1a1a1' : '#737373'

  const { data: appData, isLoading: l1 } = useQuery({
    queryKey: ['trainingDashApps'],
    queryFn: () => trainingApplicationApi.list({ page: 0, size: 1000 }),
  })
  const { data: courseData, isLoading: l2 } = useQuery({
    queryKey: ['trainingDashCourses'],
    queryFn: () => trainingCourseApi.list({ page: 0, size: 1000 }),
  })

  const apps: TrainingApplication[] = useMemo(() => appData?.content || [], [appData])
  const courseMap = useMemo(() => {
    const map = new Map<number, string>()
    ;(courseData?.content || []).forEach(c => map.set(c.id, c.courseName))
    return map
  }, [courseData])

  const kpi = useMemo(() => {
    const total = apps.length
    const pending = apps.filter(a => a.status === 'PENDING').length
    const approved = apps.filter(a => a.status === 'APPROVED').length
    const completed = apps.filter(a => a.status === 'COMPLETED').length
    const rejected = apps.filter(a => a.status === 'REJECTED').length
    return { total, pending, approved, completed, rejected }
  }, [apps])

  const statusData = useMemo(() => {
    const map: Record<string, number> = {}
    apps.forEach(a => { map[a.status] = (map[a.status] || 0) + 1 })
    return Object.entries(map).map(([status, value]) => ({
      label: t(`training.status.${status}`, STATUS_DEFAULTS[status] || status),
      status, value,
      fill: STATUS_COLOR_HEX[status] || CHART_COLORS.purple,
    }))
  }, [apps, t])

  const byCourse = useMemo(() => {
    const map: Record<string, number> = {}
    apps.forEach(a => {
      const name = a.courseName || courseMap.get(a.courseId) || '미지정'
      map[name] = (map[name] || 0) + 1
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value], idx) => ({ label, value, fill: CHART_PALETTE[idx % CHART_PALETTE.length] }))
  }, [apps, courseMap])

  if (l1 || l2) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2 }}>
        <KpiCard label={t('common.total', '전체')} value={kpi.total} color={CHART_COLORS.blue} />
        <KpiCard label={t('training.status.PENDING', '신청 대기')} value={kpi.pending} color={CHART_COLORS.amber} />
        <KpiCard label={t('training.status.APPROVED', '승인')} value={kpi.approved} color={CHART_COLORS.cyan} />
        <KpiCard label={t('training.status.COMPLETED', '완료')} value={kpi.completed} color={CHART_COLORS.green} />
        <KpiCard label={t('training.status.REJECTED', '반려')} value={kpi.rejected} color={CHART_COLORS.red} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <ChartCard title={t('training.dashboard.byStatus', '신청 상태 분포')} description={t('training.dashboard.byStatusDesc', '교육 신청 현황')}>
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

        <ChartCard title={t('training.dashboard.byCourse', '교육 과정 TOP 8')} description={t('training.dashboard.byCourseDesc', '신청자 수')}>
          {byCourse.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>{t('common.noData', '데이터가 없습니다')}</Typography>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCourse} layout="vertical" margin={{ left: 16, right: 12 }}>
                <YAxis dataKey="label" type="category" tickLine={false} tickMargin={10} axisLine={false} tick={{ fill: tickColor, fontSize: 12 }} width={140} />
                <XAxis dataKey="value" type="number" hide />
                <Tooltip content={<ShadcnTooltip />} cursor={false} />
                <Bar dataKey="value" radius={5}>
                  {byCourse.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </Box>
    </Box>
  )
}

export default TrainingDashboardTab
