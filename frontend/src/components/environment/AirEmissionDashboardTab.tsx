import { formatDate } from '../../utils/dateDefaults'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Grid,
} from '@mui/material'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LabelList,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts'
import { airEmissionApi } from '../../api/environmentApi'
import { useCodeMap } from '../../hooks/useCodeMap'
import { useThemeMode } from '../../context/ThemeContext'
import { AirEmission } from '../../types/environment.types'

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
          <span style={{ color: mutedFg, flex: 1 }}>{entry.name || entry.payload?.name || entry.payload?.label}</span>
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

const AirEmissionDashboardTab: React.FC = () => {
  const { t } = useTranslation()
  const { isDarkMode } = useThemeMode()
  const { getLabel: getPollutantLabel } = useCodeMap('POLLUTANT')
  const { getLabel: getEmissionUnitLabel } = useCodeMap('EMISSION_UNIT')

  const tickColor = isDarkMode ? '#a1a1a1' : '#737373'
  const gridColor = isDarkMode ? 'rgba(63,63,70,0.3)' : 'rgba(229,229,229,0.5)'

  const { data: allData } = useQuery({
    queryKey: ['airEmissionDashboardList'],
    queryFn: () => airEmissionApi.findAllList(),
  })

  const records: AirEmission[] = allData || []

  // Stats
  const stats = useMemo(() => {
    const total = records.length
    const compliant = records.filter((r) => r.compliance === 'COMPLIANT').length
    const nonCompliant = records.filter((r) => r.compliance === 'NON_COMPLIANT').length
    const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0
    return { total, compliant, nonCompliant, complianceRate }
  }, [records])

  // 오염물질별 측정 건수
  const byPollutant = useMemo(() => {
    const map: Record<string, number> = {}
    records.forEach((r) => {
      const p = r.pollutant || 'UNKNOWN'
      map[p] = (map[p] || 0) + 1
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([pollutant, count], idx) => ({
        label: getPollutantLabel(pollutant) || pollutant,
        value: count,
        fill: PIE_COLORS[idx % PIE_COLORS.length],
      }))
  }, [records, getPollutantLabel])

  // 시설별 부적합 건수
  const nonCompliantByFacility = useMemo(() => {
    const map: Record<string, number> = {}
    records.filter((r) => r.compliance === 'NON_COMPLIANT').forEach((r) => {
      const f = r.facility || 'UNKNOWN'
      map[f] = (map[f] || 0) + 1
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([facility, count], idx) => ({
        label: facility,
        value: count,
        fill: BAR_COLORS[idx % BAR_COLORS.length],
      }))
  }, [records])

  // 월별 측정 추이
  const byMonth = useMemo(() => {
    const map: Record<string, { total: number; nonCompliant: number }> = {}
    records.forEach((r) => {
      if (r.measurementDate) {
        const ym = r.measurementDate.substring(0, 7)
        if (!map[ym]) map[ym] = { total: 0, nonCompliant: 0 }
        map[ym].total += 1
        if (r.compliance === 'NON_COMPLIANT') map[ym].nonCompliant += 1
      }
    })
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({ month: month.substring(5), ...data }))
  }, [records])

  const statCards = [
    { label: t('airEmission.dashboard.totalMeasurements'), value: `${stats.total}`, color: '#3B82F6' },
    { label: t('airEmission.dashboard.compliantCount'), value: `${stats.compliant}`, color: '#10B981' },
    { label: t('airEmission.dashboard.nonCompliantCount'), value: `${stats.nonCompliant}`, color: '#EF4444' },
    { label: t('airEmission.dashboard.complianceRate'), value: `${stats.complianceRate}%`, color: '#8B5CF6' },
  ]

  // 최근 부적합 기록
  const recentNonCompliant = useMemo(() => {
    return records
      .filter((r) => r.compliance === 'NON_COMPLIANT')
      .sort((a, b) => (b.measurementDate || '').localeCompare(a.measurementDate || ''))
      .slice(0, 5)
  }, [records])

  const cellSx = { wordBreak: 'keep-all' as const }

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

      {/* Charts */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        {/* 오염물질별 측정 건수 - Pie */}
        <Box sx={{ flex: '1 1 0', minWidth: 300 }}>
          <ChartCard title={t('airEmission.dashboard.byPollutant')}>
            {byPollutant.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<ShadcnTooltip />} />
                  <Pie data={byPollutant} dataKey="value" nameKey="label" stroke="none" animationDuration={400}>
                    <LabelList dataKey="label" stroke="none" fontSize={11} fill="#fff" fontWeight={600} style={{ pointerEvents: 'none' }} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Typography align="center" color="text.secondary" sx={{ py: 8 }}>{t('common.noData')}</Typography>
            )}
          </ChartCard>
        </Box>

        {/* 시설별 부적합 건수 - Horizontal Bar */}
        <Box sx={{ flex: '1 1 0', minWidth: 300 }}>
          <ChartCard title={t('airEmission.dashboard.nonCompliantByFacility')}>
            {nonCompliantByFacility.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nonCompliantByFacility} layout="vertical" margin={{ left: 16, right: 12 }}>
                  <YAxis dataKey="label" type="category" tickLine={false} tickMargin={10} axisLine={false} tick={{ fill: tickColor, fontSize: 12 }} />
                  <XAxis dataKey="value" type="number" hide />
                  <Tooltip content={<ShadcnTooltip />} cursor={false} />
                  <Bar dataKey="value" name={t('airEmission.dashboard.nonCompliantCount')} radius={5}>
                    {nonCompliantByFacility.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography align="center" color="text.secondary" sx={{ py: 8 }}>{t('common.noData')}</Typography>
            )}
          </ChartCard>
        </Box>
      </Box>

      {/* 월별 측정 추이 - Area */}
      <Box sx={{ mb: 3 }}>
        <ChartCard title={t('airEmission.dashboard.monthlyTrend')} height={350}>
          {byMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={byMonth} margin={{ left: -4, right: 12, top: 12 }}>
                <CartesianGrid vertical={false} stroke={gridColor} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: tickColor, fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: tickColor, fontSize: 12 }} />
                <Tooltip content={<ShadcnTooltip />} />
                <Area type="natural" dataKey="total" name={t('airEmission.dashboard.totalMeasurements')} fill="#3B82F6" fillOpacity={0.4} stroke="#3B82F6" strokeWidth={2} />
                <Area type="natural" dataKey="nonCompliant" name={t('airEmission.dashboard.nonCompliantCount')} fill="#EF4444" fillOpacity={0.3} stroke="#EF4444" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Typography align="center" color="text.secondary" sx={{ py: 8 }}>{t('common.noData')}</Typography>
          )}
        </ChartCard>
      </Box>

      {/* 최근 부적합 기록 */}
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        {t('airEmission.dashboard.recentNonCompliant')}
      </Typography>

      {/* PC Table */}
      <Paper variant="outlined" sx={{ display: { xs: 'none', md: 'block' }, borderRadius: 2, overflow: 'hidden', mb: 2 }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: isDarkMode ? '#27272a' : 'grey.100' }}>
                <TableCell align="center" sx={{ fontWeight: 'bold', ...cellSx }}>{t('common.no')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', ...cellSx }}>{t('environment.measurementDate')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', ...cellSx }}>{t('environment.facility')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', ...cellSx }}>{t('environment.pollutant')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', ...cellSx }}>{t('environment.emissionConcentration')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', ...cellSx }}>{t('environment.emissionStandard')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', wordBreak: 'keep-all' }}>{t('environment.manager')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentNonCompliant.length > 0 ? recentNonCompliant.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell align="center" sx={cellSx}>{idx + 1}</TableCell>
                  <TableCell align="center" sx={cellSx}>{formatDate(item.measurementDate)}</TableCell>
                  <TableCell sx={cellSx}>{item.facility || ''}</TableCell>
                  <TableCell align="center" sx={cellSx}>{getPollutantLabel(item.pollutant || '') || ''}</TableCell>
                  <TableCell align="center" sx={cellSx}>
                    <Chip label={`${item.emissionConcentration ?? ''} ${getEmissionUnitLabel(item.unit || '')}`} color="error" size="small" />
                  </TableCell>
                  <TableCell align="center" sx={cellSx}>{item.emissionStandard != null ? `${item.emissionStandard} ${getEmissionUnitLabel(item.unit || '')}` : ''}</TableCell>
                  <TableCell align="center">{item.manager || ''}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>{t('common.noData')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1 }}>
        {recentNonCompliant.length > 0 ? recentNonCompliant.map((item) => (
          <Paper key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="subtitle2" fontWeight="bold">{item.facility || ''}</Typography>
              <Chip label={t('airEmission.dashboard.nonCompliant')} color="error" size="small" />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {formatDate(item.measurementDate)} | {getPollutantLabel(item.pollutant || '')} | {item.emissionConcentration ?? ''} {getEmissionUnitLabel(item.unit || '')}
            </Typography>
          </Paper>
        )) : (
          <Typography align="center" color="text.secondary" sx={{ py: 4 }}>{t('common.noData')}</Typography>
        )}
      </Box>
    </Box>
  )
}

export default AirEmissionDashboardTab
