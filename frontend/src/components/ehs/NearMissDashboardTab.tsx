import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Box, Typography, Paper, CircularProgress } from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LabelList,
} from 'recharts'
import axiosInstance from '../../api/axiosInstance'
import { ApiResponse, PageResponse } from '../../types/common.types'
import { NearMiss } from '../../types/nearMiss.types'
import { useThemeMode } from '../../context/ThemeContext'
import { ChartCard, ShadcnTooltip, STATUS_COLOR_HEX, CHART_COLORS } from '../common/DashboardChartHelpers'

const STATUS_DEFAULTS: Record<string, string> = {
  PENDING: '대기', IN_PROGRESS: '진행중', COMPLETED: '완료', REJECTED: '반려',
}

const KpiCard: React.FC<{ label: string; value: number | string; color?: string }> = ({ label, value, color = CHART_COLORS.blue }) => (
  <Paper sx={(theme: any) => ({ p: 2.5, borderLeft: 4, borderColor: color, borderLeftColor: color, ...(theme.isYesco && { borderTop: 1, borderRight: 1, borderBottom: 1, borderColor: '#0F2147', borderLeftColor: color }) })}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5 }}>{value}</Typography>
  </Paper>
)

const fetchByType = async (incidentType: 'NEAR_MISS' | 'ACCIDENT'): Promise<NearMiss[]> => {
  const res = await axiosInstance.get<ApiResponse<PageResponse<NearMiss>>>(`/near-miss/type/${incidentType}`, {
    params: { page: 0, size: 1000 },
  })
  return res.data.data?.content || []
}

const monthKey = (iso?: string) => (iso || '').substring(0, 7)

const NearMissDashboardTab: React.FC = () => {
  const { t } = useTranslation()
  const { isDarkMode } = useThemeMode()
  const tickColor = isDarkMode ? '#a1a1a1' : '#737373'

  const { data: nearMissList = [], isLoading: l1 } = useQuery({
    queryKey: ['nearMissDashNm'],
    queryFn: () => fetchByType('NEAR_MISS'),
  })
  const { data: accidentList = [], isLoading: l2 } = useQuery({
    queryKey: ['nearMissDashAcc'],
    queryFn: () => fetchByType('ACCIDENT'),
  })

  const all = useMemo(() => [...nearMissList, ...accidentList], [nearMissList, accidentList])

  const kpi = useMemo(() => {
    const total = all.length
    const nm = nearMissList.length
    const ac = accidentList.length
    const pending = all.filter(i => i.status === 'PENDING' || i.status === 'IN_PROGRESS').length
    const completed = all.filter(i => i.status === 'COMPLETED').length
    return { total, nm, ac, pending, completed }
  }, [all, nearMissList, accidentList])

  const typeData = useMemo(() => ([
    { label: t('nearMiss.incidentTypes.nearMiss', '아차사고'), value: nearMissList.length, fill: CHART_COLORS.blue },
    { label: t('nearMiss.incidentTypes.accident', '사고'), value: accidentList.length, fill: CHART_COLORS.red },
  ].filter(d => d.value > 0)), [nearMissList, accidentList, t])

  const statusData = useMemo(() => {
    const map: Record<string, number> = {}
    all.forEach(i => { map[i.status] = (map[i.status] || 0) + 1 })
    return Object.entries(map).map(([status, value]) => ({
      label: t(`nearMiss.status.${status}`, STATUS_DEFAULTS[status] || status),
      status, value,
      fill: STATUS_COLOR_HEX[status] || CHART_COLORS.purple,
    }))
  }, [all, t])

  const monthly = useMemo(() => {
    const mapNm: Record<string, number> = {}
    const mapAc: Record<string, number> = {}
    nearMissList.forEach(i => { const k = monthKey(i.occDate || i.createdAt); if (k) mapNm[k] = (mapNm[k] || 0) + 1 })
    accidentList.forEach(i => { const k = monthKey(i.occDate || i.createdAt); if (k) mapAc[k] = (mapAc[k] || 0) + 1 })
    const keys = Array.from(new Set([...Object.keys(mapNm), ...Object.keys(mapAc)])).sort().slice(-12)
    return keys.map(k => ({ month: k, nearMiss: mapNm[k] || 0, accident: mapAc[k] || 0 }))
  }, [nearMissList, accidentList])

  if (l1 || l2) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2 }}>
        <KpiCard label={t('common.total', '전체')} value={kpi.total} color={CHART_COLORS.blue} />
        <KpiCard label={t('nearMiss.incidentTypes.nearMiss', '아차사고')} value={kpi.nm} color={CHART_COLORS.amber} />
        <KpiCard label={t('nearMiss.incidentTypes.accident', '사고')} value={kpi.ac} color={CHART_COLORS.red} />
        <KpiCard label={t('nearMiss.dashboard.inProgress', '진행/대기')} value={kpi.pending} color={CHART_COLORS.purple} />
        <KpiCard label={t('common.completed', '완료')} value={kpi.completed} color={CHART_COLORS.green} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <ChartCard title={t('nearMiss.dashboard.byType', '구분 분포')} description={t('nearMiss.dashboard.byTypeDesc', '사고 vs 아차사고')}>
          {typeData.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>{t('common.noData', '데이터가 없습니다')}</Typography>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<ShadcnTooltip />} />
                <Pie data={typeData} dataKey="value" nameKey="label" stroke="none" animationDuration={400}>
                  <LabelList dataKey="label" stroke="none" fontSize={11} fill="#fff" fontWeight={600} style={{ pointerEvents: 'none' }} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title={t('nearMiss.dashboard.byStatus', '상태 분포')} description={t('nearMiss.dashboard.byStatusDesc', '처리 현황')}>
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
      </Box>

      <ChartCard title={t('nearMiss.dashboard.monthly', '월별 발생 추이')} description={t('nearMiss.dashboard.monthlyDesc', '최근 12개월')}>
        {monthly.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>{t('common.noData', '데이터가 없습니다')}</Typography>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} margin={{ left: 0, right: 12, top: 12, bottom: 12 }}>
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: tickColor, fontSize: 12 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: tickColor, fontSize: 12 }} />
              <Tooltip content={<ShadcnTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Legend />
              <Bar dataKey="nearMiss" name={t('nearMiss.incidentTypes.nearMiss', '아차사고')} fill={CHART_COLORS.amber} radius={[4, 4, 0, 0]} />
              <Bar dataKey="accident" name={t('nearMiss.incidentTypes.accident', '사고')} fill={CHART_COLORS.red} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </Box>
  )
}

export default NearMissDashboardTab
