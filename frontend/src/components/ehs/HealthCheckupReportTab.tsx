import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Box, Paper, Typography, Grid, CircularProgress } from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import axiosInstance from '../../api/axiosInstance'
import { HealthCheckupPlan } from '../../types/healthCheckupPlan.types'
import { ApiResponse, PageResponse } from '../../types/common.types'
import useCodeMap from '../../hooks/useCodeMap'

interface Props {
  allowedTypes: string[]
  title?: string
}

const STATUS_COLORS_HEX: Record<string, string> = {
  PLANNED: '#94a3b8',
  IN_PROGRESS: '#f59e0b',
  COMPLETED: '#22c55e',
  CANCELLED: '#ef4444',
}

const TYPE_COLORS: Record<string, string> = {
  GENERAL: '#3b82f6',
  SPECIAL: '#0ea5e9',
  OCCUPATIONAL: '#ef4444',
}

const fetchAll = async (allowedTypes: string[]): Promise<HealthCheckupPlan[]> => {
  const params = new URLSearchParams()
  params.set('page', '0')
  params.set('size', '500')
  if (allowedTypes.length === 1) params.set('checkupType', allowedTypes[0])
  const res = await axiosInstance.get<ApiResponse<PageResponse<HealthCheckupPlan>>>(
    `/health-checkup-plan?${params.toString()}`,
  )
  return (res.data.data.content || []).filter(p => allowedTypes.includes(p.checkupType))
}

const HealthCheckupReportTab: React.FC<Props> = ({ allowedTypes, title }) => {
  const { t } = useTranslation()
  const { getLabel: getTypeLabel } = useCodeMap('HEALTH_CHECKUP_TYPE')
  const { getLabel: getStatusLabel } = useCodeMap('HEALTH_CHECKUP_PLAN_STATUS')

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['healthCheckupReport', allowedTypes.join(',')],
    queryFn: () => fetchAll(allowedTypes),
  })

  const yearly = useMemo(() => {
    const map: Record<number, { year: number; target: number; completed: number; planCount: number }> = {}
    plans.forEach(p => {
      if (!map[p.planYear]) map[p.planYear] = { year: p.planYear, target: 0, completed: 0, planCount: 0 }
      map[p.planYear].target += p.targetCount || 0
      map[p.planYear].completed += p.completedCount || 0
      map[p.planYear].planCount += 1
    })
    return Object.values(map).sort((a, b) => a.year - b.year).map(r => ({
      ...r,
      rate: r.target > 0 ? Math.round((r.completed / r.target) * 100) : 0,
    }))
  }, [plans])

  const byStatus = useMemo(() => {
    const map: Record<string, number> = {}
    plans.forEach(p => { map[p.status] = (map[p.status] || 0) + 1 })
    return Object.entries(map).map(([status, value]) => ({
      name: getStatusLabel(status) || status, value, status,
    }))
  }, [plans, getStatusLabel])

  const byType = useMemo(() => {
    const map: Record<string, number> = {}
    plans.forEach(p => { map[p.checkupType] = (map[p.checkupType] || 0) + (p.targetCount || 0) })
    return Object.entries(map).map(([type, value]) => ({
      name: getTypeLabel(type) || type, value, type,
    }))
  }, [plans, getTypeLabel])

  const totals = useMemo(() => {
    const totalPlans = plans.length
    const totalTarget = plans.reduce((s, p) => s + (p.targetCount || 0), 0)
    const totalCompleted = plans.reduce((s, p) => s + (p.completedCount || 0), 0)
    const overallRate = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0
    return { totalPlans, totalTarget, totalCompleted, overallRate }
  }, [plans])

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>

  return (
    <Box>
      {title && <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>{title}</Typography>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: t('healthCheckupReport.totalPlans', '전체 계획'), value: totals.totalPlans, color: '#6366f1' },
          { label: t('healthCheckupReport.totalTarget', '대상 인원'), value: totals.totalTarget, color: '#3b82f6' },
          { label: t('healthCheckupReport.totalCompleted', '완료 인원'), value: totals.totalCompleted, color: '#22c55e' },
          { label: t('healthCheckupReport.overallRate', '전체 수검률'), value: `${totals.overallRate}%`, color: '#f59e0b' },
        ].map((c, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Paper sx={{ p: 2, borderLeft: 4, borderColor: c.color, borderLeftColor: c.color}}>
              <Typography variant="caption" color="text.secondary">{c.label}</Typography>
              <Typography variant="h5" fontWeight="bold">{c.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 360 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              {t('healthCheckupReport.yearlyTrend', '연도별 대상 vs 완료')}
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={yearly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="target"    name={t('healthCheckupPlan.targetCount', '대상')} fill="#3b82f6" />
                <Bar dataKey="completed" name={t('healthCheckupPlan.completedCount', '완료')} fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 360 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              {t('healthCheckupReport.byStatus', '상태 분포')}
            </Typography>
            {byStatus.length === 0 ? (
              <Typography variant="body2" color="text.secondary">{t('common.noData', '데이터가 없습니다')}</Typography>
            ) : (
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={110} label>
                    {byStatus.map((e, i) => (
                      <Cell key={i} fill={STATUS_COLORS_HEX[e.status] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {allowedTypes.length > 1 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 360 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                {t('healthCheckupReport.byType', '검진 종류별 대상 인원')}
              </Typography>
              {byType.length === 0 ? (
                <Typography variant="body2" color="text.secondary">{t('common.noData', '데이터가 없습니다')}</Typography>
              ) : (
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie data={byType} dataKey="value" nameKey="name" outerRadius={110} label>
                      {byType.map((e, i) => (
                        <Cell key={i} fill={TYPE_COLORS[e.type] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Paper>
          </Grid>
        )}

        <Grid item xs={12} md={allowedTypes.length > 1 ? 6 : 12}>
          <Paper sx={{ p: 2, height: 360 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              {t('healthCheckupReport.yearlyRate', '연도별 수검률 (%)')}
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={yearly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="rate" name={t('healthCheckupReport.rate', '수검률')} fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default HealthCheckupReportTab
