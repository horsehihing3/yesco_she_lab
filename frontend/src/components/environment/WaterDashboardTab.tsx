import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Box, Paper, Typography, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'
import { waterQualityApi, waterStandardApi } from '../../api/environmentApi'
import { useThemeMode } from '../../context/ThemeContext'
import { WaterQuality, WaterStandard } from '../../types/environment.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ShadcnTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string | number }) => {
  const { isDarkMode } = useThemeMode()
  if (!active || !payload?.length) return null
  const bg = isDarkMode ? '#0a0a0a' : '#ffffff'
  const fg = isDarkMode ? '#fafafa' : '#0a0a0a'
  const mutedFg = isDarkMode ? '#a1a1a1' : '#737373'
  const borderColor = isDarkMode ? 'rgba(63,63,70,0.5)' : 'rgba(229,229,229,0.5)'
  return (
    <div style={{
      minWidth: '8rem',
      display: 'grid',
      alignItems: 'start',
      gap: 6,
      borderRadius: 8,
      border: `1px solid ${borderColor}`,
      backgroundColor: bg,
      padding: '6px 10px',
      fontSize: 12,
      lineHeight: '16px',
      color: fg,
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
    }}>
      {label && <div style={{ fontWeight: 500, color: fg }}>{label}</div>}
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 10,
            height: 10,
            flexShrink: 0,
            borderRadius: 2,
            border: `1px solid ${borderColor}`,
            backgroundColor: entry.payload?.fill || entry.color,
          }} />
          <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <span style={{ color: mutedFg }}>{entry.name}</span>
            <span style={{
              color: fg,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontWeight: 500,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
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

const WaterDashboardTab: React.FC = () => {
  const { t } = useTranslation()
  const { isDarkMode } = useThemeMode()

  const tickColor = isDarkMode ? '#a1a1a1' : '#737373'
  const gridColor = isDarkMode ? 'rgba(63,63,70,0.3)' : 'rgba(229,229,229,0.5)'

  const { data: measurementData } = useQuery({
    queryKey: ['waterDashboardMeasurements'],
    queryFn: () => waterQualityApi.findAll(0, 100),
  })

  const { data: standards } = useQuery({
    queryKey: ['waterDashboardStandards'],
    queryFn: () => waterStandardApi.findAllList(),
  })

  const formatDate = (dateStr?: string) => dateStr ? dateStr.substring(0, 10) : ''

  const isExceeded = (record: WaterQuality, standardList: WaterStandard[]): boolean => {
    const checkValue = (value: number | undefined, itemName: string): boolean => {
      if (value == null) return false
      const std = standardList.find((s) => s.itemName.toUpperCase() === itemName.toUpperCase())
      if (!std) return false
      return value < std.minValue || value > std.maxValue
    }
    return (
      checkValue(record.ph, 'pH') ||
      checkValue(record.bod, 'BOD') ||
      checkValue(record.cod, 'COD') ||
      checkValue(record.ss, 'SS') ||
      checkValue(record.tN, 'T-N') ||
      checkValue(record.tP, 'T-P')
    )
  }

  const stats = useMemo(() => {
    const records = measurementData?.content || []
    const stdList = standards || []
    const total = records.length
    const exceedCount = records.filter((r) => isExceeded(r, stdList)).length
    const normalRatio = total > 0 ? Math.round(((total - exceedCount) / total) * 100) : 0
    return { total, exceedCount, normalRatio }
  }, [measurementData, standards])

  const recentRecords = useMemo(() => {
    return (measurementData?.content || []).slice(0, 10)
  }, [measurementData])

  const chartData = useMemo(() => {
    return recentRecords.map((r) => ({
      name: formatDate(r.measurementDate)?.substring(5) || '',
      pH: r.ph ?? 0,
      BOD: r.bod ?? 0,
      COD: r.cod ?? 0,
      SS: r.ss ?? 0,
    })).reverse()
  }, [recentRecords])

  const bodStd = standards?.find((s) => s.itemName.toUpperCase() === 'BOD')

  const kpiCards = [
    { label: t('water.dashboard.totalMeasurements'), value: stats.total, borderColor: '#3B82F6' },
    { label: t('water.dashboard.exceedCount'), value: stats.exceedCount, borderColor: '#EF4444' },
    { label: t('water.dashboard.normalRatio'), value: `${stats.normalRatio}%`, borderColor: '#10B981' },
  ]

  const cellSx = {}
  const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }
  const lastCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

  return (
    <Box>
      {/* KPI Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        {kpiCards.map((card) => (
          <Paper
            key={card.label}
            variant="outlined"
            sx={{ p: 3, borderRadius: 2, display: 'flex', flexDirection: 'column', borderLeft: 4, borderColor: card.borderColor }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{card.label}</Typography>
            <Typography variant="h4" fontWeight="bold">{card.value}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Chart */}
      <Box sx={{ mb: 3 }}>
        <ChartCard title={t('water.dashboard.recentRecords')}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: -4, right: 12, top: 12, bottom: 5 }}>
                <CartesianGrid vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: tickColor, fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: tickColor, fontSize: 12 }} />
                <Tooltip content={<ShadcnTooltip />} cursor={{ fill: isDarkMode ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.06)' }} />
                <Legend />
                <Bar dataKey="pH" name="pH" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="BOD" name="BOD" fill="#10B981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="COD" name="COD" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                <Bar dataKey="SS" name="SS" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
                {bodStd && (
                  <ReferenceLine y={bodStd.maxValue} stroke="#EF4444" strokeDasharray="5 5" label={{ value: `BOD ${t('water.dashboard.standardLimit')}`, fill: '#EF4444', fontSize: 11 }} />
                )}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Typography align="center" color="text.secondary" sx={{ py: 8 }}>{t('common.noData')}</Typography>
          )}
        </ChartCard>
      </Box>

      {/* Detail Table */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <Table size="small" sx={{ minWidth: 600, '& .MuiTableBody-root .MuiTableRow-root:hover': { backgroundColor: isDarkMode ? '#1e293b !important' : '#f9fafb !important' } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: isDarkMode ? '#27272a' : 'grey.100' }}>
                <TableCell align="center" sx={headerCellSx}>{t('water.dashboard.measurementDate')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('water.dashboard.measurementPoint')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>pH</TableCell>
                <TableCell align="center" sx={headerCellSx}>BOD</TableCell>
                <TableCell align="center" sx={headerCellSx}>COD</TableCell>
                <TableCell align="center" sx={headerCellSx}>SS</TableCell>
                <TableCell align="center" sx={lastCellSx}>{t('water.dashboard.status')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentRecords.length > 0 ? recentRecords.map((item) => {
                const exceeded = isExceeded(item, standards || [])
                return (
                  <TableRow key={item.id} sx={{ '&:hover': { backgroundColor: isDarkMode ? '#1e293b' : '#f9fafb' } }}>
                    <TableCell align="center" sx={{ ...cellSx, whiteSpace: 'nowrap' }}>{formatDate(item.measurementDate)}</TableCell>
                    <TableCell align="center" sx={cellSx}>{item.measurementPoint || ''}</TableCell>
                    <TableCell align="center" sx={cellSx}>{item.ph ?? ''}</TableCell>
                    <TableCell align="center" sx={cellSx}>{item.bod ?? ''}</TableCell>
                    <TableCell align="center" sx={cellSx}>{item.cod ?? ''}</TableCell>
                    <TableCell align="center" sx={cellSx}>{item.ss ?? ''}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={exceeded ? t('water.dashboard.exceeded') : t('water.dashboard.normal')}
                        color={exceeded ? 'error' : 'success'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                )
              }) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>{t('common.noData')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}

export default WaterDashboardTab
