import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Box, Paper, Typography, Grid } from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, LabelList,
} from 'recharts'
import { wasteManageApi } from '../../api/environmentApi'
import { useCodeMap } from '../../hooks/useCodeMap'
import { useThemeMode } from '../../context/ThemeContext'
import { WasteManage } from '../../types/environment.types'

const PIE_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
const BAR_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ShadcnTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string | number }) => {
  const { isDarkMode } = useThemeMode()
  if (!active || !payload?.length) return null
  const bg = isDarkMode ? '#0a0a0a' : '#ffffff'
  const fg = isDarkMode ? '#fafafa' : '#0a0a0a'
  const mutedFg = isDarkMode ? '#a1a1a1' : '#737373'
  const borderColor = isDarkMode ? 'rgba(63,63,70,0.5)' : 'rgba(229,229,229,0.5)'
  return (
    <div style={{ minWidth: '8rem', borderRadius: 8, border: `1px solid ${borderColor}`, backgroundColor: bg, padding: '6px 10px', fontSize: 12, color: fg, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
      {label && <div style={{ fontWeight: 500, color: fg, marginBottom: 4 }}>{label}</div>}
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: entry.payload?.fill || entry.color }} />
          <span style={{ color: mutedFg, flex: 1 }}>{entry.name}</span>
          <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</span>
        </div>
      ))}
    </div>
  )
}

const ChartCard: React.FC<{ title: string; description?: string; children: React.ReactNode; height?: number }> = ({ title, description, children, height = 420 }) => (
  <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height, borderRadius: 2, overflow: 'hidden' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 2.5, px: 3 }}>
      <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1 }}>{title}</Typography>
      {description && <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1 }}>{description}</Typography>}
    </Box>
    <Box sx={{ flex: 1, px: 2, py: 1 }}>{children}</Box>
  </Paper>
)

const WasteReportTab: React.FC = () => {
  const { t } = useTranslation()
  const { isDarkMode } = useThemeMode()
  const { getLabel: getDeptLabel } = useCodeMap('WASTE_DEPARTMENT')
  const { getLabel: getTypeLabel } = useCodeMap('WASTE_TYPE')

  const tickColor = isDarkMode ? '#a1a1a1' : '#737373'

  const { data, isLoading } = useQuery({
    queryKey: ['wasteReport'],
    queryFn: () => wasteManageApi.findAll(0, 1000),
  })

  const records: WasteManage[] = data?.content || []

  const stats = useMemo(() => {
    const totalGeneration = records.reduce((sum, r) => sum + (r.generationAmount || 0), 0)
    const completedCount = records.filter((r) => r.status === 'COMPLETED' || r.status === 'DISPOSED').length
    const totalDisposalCost = records.reduce((sum, r) => sum + (r.disposalCost || 0), 0)
    const total = records.length
    const complianceRate = total > 0 ? Math.round((completedCount / total) * 100) : 0
    return { totalGeneration, completedCount, totalDisposalCost, complianceRate }
  }, [records])

  const byDepartment = useMemo(() => {
    const map: Record<string, { count: number; totalAmount: number }> = {}
    records.forEach((r) => {
      const dept = r.department || 'UNKNOWN'
      if (!map[dept]) map[dept] = { count: 0, totalAmount: 0 }
      map[dept].count += 1
      map[dept].totalAmount += r.generationAmount || 0
    })
    return Object.entries(map)
      .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
      .map(([dept, info], idx) => ({
        label: getDeptLabel(dept),
        value: info.totalAmount,
        fill: BAR_COLORS[idx % BAR_COLORS.length],
      }))
  }, [records, getDeptLabel])

  const byWasteType = useMemo(() => {
    const map: Record<string, number> = {}
    records.forEach((r) => {
      const wt = r.wasteType || 'UNKNOWN'
      map[wt] = (map[wt] || 0) + (r.disposalCost || 0)
    })
    return Object.entries(map)
      .filter(([, cost]) => cost > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([type, cost], idx) => ({
        label: getTypeLabel(type),
        value: cost,
        fill: PIE_COLORS[idx % PIE_COLORS.length],
      }))
  }, [records, getTypeLabel])

  const statCards = [
    { label: `${t('waste.report.totalGeneration')} (kg)`, value: `${stats.totalGeneration.toLocaleString()}`, color: '#EF4444' },
    { label: t('waste.report.completedCount'), value: `${stats.completedCount}`, color: '#10B981' },
    { label: `${t('waste.report.totalDisposalCost')} (${t('waste.report.thousandWon')})`, value: `${Math.round(stats.totalDisposalCost / 1000).toLocaleString()}`, color: '#F59E0B' },
    { label: t('waste.report.complianceRate'), value: `${stats.complianceRate}%`, color: '#3B82F6' },
  ]

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><Typography>{t('common.loading')}</Typography></Box>
  }

  return (
    <Box>
      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((card, idx) => (
          <Grid item xs={6} md={3} key={idx}>
            <Paper variant="outlined" sx={(theme: any) => ({ p: 2.5, pl: 3, position: 'relative', overflow: 'hidden', ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }), '&::before': { content: '""', position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, backgroundColor: theme.isYesco ? '#E60012' : '#2563eb', borderTopLeftRadius: 'inherit', borderBottomLeftRadius: 'inherit' } })}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{card.label}</Typography>
              <Typography variant="h5" fontWeight="bold">{card.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        {/* 부서별 발생 현황 - Horizontal Bar */}
        <Box sx={{ flex: '1 1 0', minWidth: 300 }}>
          <ChartCard title={t('waste.report.byDepartment')}>
            {byDepartment.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDepartment} layout="vertical" margin={{ left: 16, right: 12 }}>
                  <YAxis dataKey="label" type="category" tickLine={false} tickMargin={10} axisLine={false} tick={{ fill: tickColor, fontSize: 12 }} />
                  <XAxis dataKey="value" type="number" hide />
                  <Tooltip content={<ShadcnTooltip />} cursor={false} />
                  <Bar dataKey="value" name={t('waste.report.totalAmount')} radius={5}>
                    {byDepartment.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography align="center" color="text.secondary" sx={{ py: 8 }}>{t('common.noData')}</Typography>
            )}
          </ChartCard>
        </Box>

        {/* 종류별 처리 비용 - Pie */}
        <Box sx={{ flex: '1 1 0', minWidth: 300 }}>
          <ChartCard title={t('waste.report.costByWasteType')}>
            {byWasteType.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<ShadcnTooltip />} />
                  <Pie data={byWasteType} dataKey="value" nameKey="label" stroke="none" animationDuration={400}>
                    <LabelList dataKey="label" stroke="none" fontSize={11} fill="#fff" fontWeight={600} style={{ pointerEvents: 'none' }} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Typography align="center" color="text.secondary" sx={{ py: 8 }}>{t('common.noData')}</Typography>
            )}
          </ChartCard>
        </Box>
      </Box>
    </Box>
  )
}

export default WasteReportTab
