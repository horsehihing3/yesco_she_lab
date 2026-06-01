import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Box, Paper, Typography, Grid } from '@mui/material'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts'
import { carbonEmissionApi } from '../../api/carbonApi'
import { CarbonEmission } from '../../types/carbon.types'
import { useThemeMode } from '../../context/ThemeContext'

const SCOPE_COLORS = ['#EF4444', '#F59E0B', '#10B981']
const SOURCE_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

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
          <span style={{ color: mutedFg, flex: 1 }}>{entry.name || entry.payload?.name}</span>
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

const CarbonStatsTab: React.FC = () => {
  const { t } = useTranslation()
  const { isDarkMode } = useThemeMode()

  const tickColor = isDarkMode ? '#a1a1a1' : '#737373'
  const gridColor = isDarkMode ? 'rgba(63,63,70,0.3)' : 'rgba(229,229,229,0.5)'
  const fg = isDarkMode ? '#fafafa' : '#0a0a0a'
  const mutedBg = isDarkMode ? '#27272a' : '#f5f5f5'

  const { data, isLoading } = useQuery({
    queryKey: ['carbonStatsList'],
    queryFn: () => carbonEmissionApi.findAllList(),
  })

  const records: CarbonEmission[] = data || []

  const stats = useMemo(() => {
    const totalEmission = records.reduce((sum, r) => sum + (r.co2Emission || 0), 0)
    const monthSet = new Set<string>()
    records.forEach((r) => { if (r.recordDate) monthSet.add(r.recordDate.substring(0, 7)) })
    const monthCount = monthSet.size || 1
    const monthlyAvg = totalEmission / monthCount

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentYearEmission = records.filter((r) => r.recordDate?.startsWith(String(currentYear))).reduce((sum, r) => sum + (r.co2Emission || 0), 0)
    const prevYearEmission = records.filter((r) => r.recordDate?.startsWith(String(currentYear - 1))).reduce((sum, r) => sum + (r.co2Emission || 0), 0)
    const reductionRate = prevYearEmission > 0 ? (((prevYearEmission - currentYearEmission) / prevYearEmission) * 100).toFixed(1) : '0.0'
    const intensity = records.length > 0 ? (totalEmission / records.length).toFixed(3) : '0.000'

    return { totalEmission, reductionRate, intensity, monthlyAvg }
  }, [records])

  // Scope별 - Radial (Donut) Chart
  const byScope = useMemo(() => {
    const map: Record<number, number> = {}
    records.forEach((r) => { map[r.scope || 0] = (map[r.scope || 0] || 0) + (r.co2Emission || 0) })
    return Object.entries(map)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([scope, emission]) => ({
        name: `Scope ${scope}`,
        value: parseFloat(emission.toFixed(3)),
      }))
  }, [records])

  // 배출원별
  const bySource = useMemo(() => {
    const map: Record<string, number> = {}
    records.forEach((r) => { map[r.sourceName || 'UNKNOWN'] = (map[r.sourceName || 'UNKNOWN'] || 0) + (r.co2Emission || 0) })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, emission], idx) => ({
        label: name,
        value: parseFloat(emission.toFixed(3)),
        fill: SOURCE_COLORS[idx % SOURCE_COLORS.length],
      }))
  }, [records])

  // 월별
  const byMonth = useMemo(() => {
    const map: Record<string, number> = {}
    records.forEach((r) => {
      if (r.recordDate) {
        const ym = r.recordDate.substring(0, 7)
        map[ym] = (map[ym] || 0) + (r.co2Emission || 0)
      }
    })
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, emission]) => ({ month: month.substring(5), emission: parseFloat(emission.toFixed(3)) }))
  }, [records])

  const statCards = [
    { label: t('carbon.stats.reductionRate'), value: `${stats.reductionRate}%`, color: '#EF4444' },
    { label: t('carbon.stats.intensity'), value: stats.intensity, color: '#10B981' },
    { label: t('carbon.stats.monthlyAvg'), value: stats.monthlyAvg.toFixed(3), color: '#3B82F6' },
  ]

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><Typography>{t('common.loading')}</Typography></Box>
  }

  const totalEmission = byScope.reduce((sum, s) => sum + s.value, 0)

  return (
    <Box>
      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((card, idx) => (
          <Grid item xs={6} md={4} key={idx}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, borderLeft: 4, borderColor: card.color }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{card.label}</Typography>
              <Typography variant="h5" fontWeight="bold">{card.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        {/* Scope별 배출량 - Donut (Radial) */}
        <Box sx={{ flex: '1 1 0', minWidth: 280 }}>
          <ChartCard title={t('carbon.stats.byScope')}>
            {byScope.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ value: 1 }]} dataKey="value" innerRadius={80} outerRadius={110} fill={mutedBg} stroke="none" isAnimationActive={false} />
                  <Pie data={byScope} dataKey="value" nameKey="name" innerRadius={80} outerRadius={110} stroke="none" animationDuration={400}>
                    {byScope.map((_, idx) => <Cell key={idx} fill={SCOPE_COLORS[idx % SCOPE_COLORS.length]} />)}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 8} style={{ fontSize: 28, fontWeight: 700, fill: fg }}>{totalEmission.toFixed(1)}</tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 16} style={{ fontSize: 12, fill: isDarkMode ? '#a1a1a1' : '#737373' }}>tCO₂eq</tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </Pie>
                  <Tooltip content={<ShadcnTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Typography align="center" color="text.secondary" sx={{ py: 8 }}>{t('common.noData')}</Typography>
            )}
          </ChartCard>
        </Box>

        {/* 배출원별 배출량 - Horizontal Bar */}
        <Box sx={{ flex: '1.5 1 0', minWidth: 350 }}>
          <ChartCard title={t('carbon.stats.bySource')}>
            {bySource.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySource} layout="vertical" margin={{ left: 16, right: 12 }} barCategoryGap="20%">
                  <YAxis dataKey="label" type="category" tickLine={false} tickMargin={10} axisLine={false} tick={{ fill: tickColor, fontSize: 12 }} width={100} />
                  <XAxis dataKey="value" type="number" hide />
                  <Tooltip content={<ShadcnTooltip />} cursor={false} />
                  <Bar dataKey="value" name={t('carbon.stats.emission')} radius={5}>
                    {bySource.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography align="center" color="text.secondary" sx={{ py: 8 }}>{t('common.noData')}</Typography>
            )}
          </ChartCard>
        </Box>
      </Box>

      {/* 월별 배출 추이 - Area */}
      <ChartCard title={t('carbon.stats.byMonth')} height={350}>
        {byMonth.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={byMonth} margin={{ left: -4, right: 12, top: 12 }}>
              <CartesianGrid vertical={false} stroke={gridColor} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: tickColor, fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: tickColor, fontSize: 12 }} />
              <Tooltip content={<ShadcnTooltip />} />
              <Area type="natural" dataKey="emission" name={t('carbon.stats.emission')} fill="#10B981" fillOpacity={0.4} stroke="#10B981" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Typography align="center" color="text.secondary" sx={{ py: 8 }}>{t('common.noData')}</Typography>
        )}
      </ChartCard>
    </Box>
  )
}

export default CarbonStatsTab
