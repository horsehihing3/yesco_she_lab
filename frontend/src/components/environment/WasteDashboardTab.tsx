import { formatDate } from '../../utils/dateDefaults'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Grid,
} from '@mui/material'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LabelList,
  AreaChart, Area, CartesianGrid, XAxis, YAxis,
  BarChart, Bar,
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
            <span style={{ color: mutedFg }}>{entry.name || entry.payload?.name || entry.payload?.label}</span>
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

const WasteDashboardTab: React.FC = () => {
  const { t } = useTranslation()
  const { isDarkMode } = useThemeMode()
  const { getLabel: getWasteTypeLabel } = useCodeMap('WASTE_TYPE')
  const { getLabel: getWasteStatusLabel } = useCodeMap('WASTE_STATUS')
  const { getLabel: getWasteUnitLabel } = useCodeMap('WASTE_UNIT')
  const { getLabel: getDeptLabel } = useCodeMap('WASTE_DEPARTMENT')

  const tickColor = isDarkMode ? '#a1a1a1' : '#737373'
  const gridColor = isDarkMode ? 'rgba(63,63,70,0.3)' : 'rgba(229,229,229,0.5)'

  const { data: stats } = useQuery({
    queryKey: ['wasteDashboardStats'],
    queryFn: () => wasteManageApi.getDashboardStats(),
  })

  const { data: wasteData } = useQuery({
    queryKey: ['wasteDashboardList'],
    queryFn: () => wasteManageApi.findAll(0, 1000),
  })


  const calcDday = (disposalDate: string) => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const target = new Date(disposalDate)
    target.setHours(0, 0, 0, 0)
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getDdayColor = (dday: number): 'error' | 'warning' | 'info' => {
    if (dday <= 3) return 'error'
    if (dday <= 7) return 'warning'
    return 'info'
  }

  const records: WasteManage[] = wasteData?.content || []

  // Report stats
  const reportStats = useMemo(() => {
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

  const costByWasteType = useMemo(() => {
    const map: Record<string, number> = {}
    records.forEach((r) => {
      const wt = r.wasteType || 'UNKNOWN'
      map[wt] = (map[wt] || 0) + (r.disposalCost || 0)
    })
    return Object.entries(map)
      .filter(([, cost]) => cost > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([type, cost], idx) => ({
        label: getWasteTypeLabel(type),
        value: cost,
        fill: PIE_COLORS[idx % PIE_COLORS.length],
      }))
  }, [records, getWasteTypeLabel])

  const reportStatCards = [
    { label: `${t('waste.report.totalGeneration')} (kg)`, value: `${reportStats.totalGeneration.toLocaleString()}`, color: '#EF4444' },
    { label: t('waste.report.completedCount'), value: `${reportStats.completedCount}`, color: '#10B981' },
    { label: `${t('waste.report.totalDisposalCost')} (${t('waste.report.thousandWon')})`, value: `${Math.round(reportStats.totalDisposalCost / 1000).toLocaleString()}`, color: '#F59E0B' },
    { label: t('waste.report.complianceRate'), value: `${reportStats.complianceRate}%`, color: '#3B82F6' },
  ]

  const urgentWastes = useMemo(() => {
    return records.filter((item) => {
      if (!item.disposalDate) return false
      if (item.status === 'COMPLETED' || item.status === 'DISPOSED') return false
      const dday = calcDday(item.disposalDate)
      return dday >= 0 && dday <= 7
    }).sort((a, b) => calcDday(a.disposalDate!) - calcDday(b.disposalDate!))
  }, [records])

  // 폐기물 종류별 비율 (Pie)
  const byType = useMemo(() => {
    const map: Record<string, number> = {}
    records.forEach((r) => {
      const wt = r.wasteType || 'UNKNOWN'
      map[wt] = (map[wt] || 0) + 1
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count], idx) => ({
        label: getWasteTypeLabel(type) || type,
        value: count,
        fill: PIE_COLORS[idx % PIE_COLORS.length],
      }))
  }, [records, getWasteTypeLabel])

  // 월별 발생 추이 (Area) - 최근 6개월
  const byMonth = useMemo(() => {
    const now = new Date()
    const months: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    const map: Record<string, number> = {}
    months.forEach((m) => { map[m] = 0 })
    records.forEach((r) => {
      const dateStr = r.generationDate || r.createdAt
      if (dateStr) {
        const ym = dateStr.substring(0, 7)
        if (map[ym] !== undefined) map[ym] += (r.generationAmount || 0)
      }
    })
    return months.map((m) => ({ month: m.substring(5), amount: parseFloat((map[m] || 0).toFixed(1)) }))
  }, [records])

  const kpiCards = [
    { label: t('waste.dashboard.storing'), value: stats?.storingCount ?? 0, borderColor: '#3B82F6' },
    { label: t('waste.dashboard.disposalRequest'), value: stats?.disposalRequestCount ?? 0, borderColor: '#F59E0B' },
    { label: t('waste.dashboard.processing'), value: stats?.processingCount ?? 0, borderColor: '#8B5CF6' },
    { label: t('waste.dashboard.completed'), value: stats?.completedCount ?? 0, borderColor: '#10B981' },
  ]

  const cellSx = { borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' as const }

  return (
    <Box>
      {/* Report Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {reportStatCards.map((card, idx) => (
          <Grid item xs={6} md={3} key={idx}>
            <Paper variant="outlined" sx={(theme: any) => ({ p: 2.5, pl: 3, position: 'relative', overflow: 'hidden', ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }), '&::before': { content: '""', position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, backgroundColor: theme.isYesco ? '#E60012' : '#2563eb', borderTopLeftRadius: 'inherit', borderBottomLeftRadius: 'inherit' } })}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{card.label}</Typography>
              <Typography variant="h5" fontWeight="bold">{card.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Report Charts */}
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
            {costByWasteType.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<ShadcnTooltip />} />
                  <Pie data={costByWasteType} dataKey="value" nameKey="label" stroke="none" animationDuration={400}>
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

      {/* KPI Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        {kpiCards.map((card) => (
          <Paper
            key={card.label}
            variant="outlined"
            sx={(theme: any) => ({ p: 2.5, pl: 3, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }), '&::before': { content: '""', position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, backgroundColor: theme.isYesco ? '#E60012' : '#2563eb', borderTopLeftRadius: 'inherit', borderBottomLeftRadius: 'inherit' } })}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{card.label}</Typography>
            <Typography variant="h4" fontWeight="bold">{card.value}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Charts */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        {/* 폐기물 종류별 비율 - Pie */}
        <Box sx={{ flex: '1 1 0', minWidth: 300 }}>
          <ChartCard title={t('waste.dashboard.byWasteType')}>
            {byType.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<ShadcnTooltip />} />
                  <Pie data={byType} dataKey="value" nameKey="label" stroke="none" animationDuration={400}>
                    <LabelList dataKey="label" stroke="none" fontSize={11} fill="#fff" fontWeight={600} style={{ pointerEvents: 'none' }} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Typography align="center" color="text.secondary" sx={{ py: 8 }}>{t('common.noData')}</Typography>
            )}
          </ChartCard>
        </Box>

        {/* 월별 발생 추이 - Area */}
        <Box sx={{ flex: '1.5 1 0', minWidth: 350 }}>
          <ChartCard title={t('waste.dashboard.monthlyTrend')}>
            {byMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={byMonth} margin={{ left: -4, right: 12, top: 12 }}>
                  <CartesianGrid vertical={false} stroke={gridColor} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: tickColor, fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: tickColor, fontSize: 12 }} />
                  <Tooltip content={<ShadcnTooltip />} />
                  <Area type="natural" dataKey="amount" name={t('waste.dashboard.generationAmount')} fill="#3B82F6" fillOpacity={0.4} stroke="#3B82F6" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Typography align="center" color="text.secondary" sx={{ py: 8 }}>{t('common.noData')}</Typography>
            )}
          </ChartCard>
        </Box>
      </Box>

      {/* 처리 임박 폐기물 */}
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        {t('waste.dashboard.urgentTitle')}
      </Typography>

      {/* PC Table */}
      <Paper variant="outlined" sx={{ display: { xs: 'none', md: 'block' }, borderRadius: 2, overflow: 'hidden', mb: 2 }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 650, '& .MuiTableCell-root': { borderColor: 'divider' }, '& .MuiTableBody-root .MuiTableRow-root:hover': { backgroundColor: isDarkMode ? '#1e293b !important' : '#f9fafb !important' } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: isDarkMode ? '#27272a' : 'grey.100' }}>
                <TableCell align="center" sx={{ fontWeight: 'bold', ...cellSx }}>{t('common.no')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', ...cellSx }}>{t('environment.wasteType')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', ...cellSx }}>{t('environment.wasteName')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', ...cellSx }}>{t('environment.generationAmount')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', ...cellSx }}>{t('environment.disposalDate')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', ...cellSx }}>D-Day</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', wordBreak: 'keep-all' }}>{t('environment.manager')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {urgentWastes.length > 0 ? urgentWastes.map((item, idx) => {
                const dday = calcDday(item.disposalDate!)
                return (
                  <TableRow key={item.id}>
                    <TableCell align="center" sx={cellSx}>{idx + 1}</TableCell>
                    <TableCell align="center" sx={cellSx}>{getWasteTypeLabel(item.wasteType || '') || ''}</TableCell>
                    <TableCell sx={cellSx}>{item.wasteName || ''}</TableCell>
                    <TableCell align="center" sx={cellSx}>
                      {item.generationAmount != null ? `${item.generationAmount} ${getWasteUnitLabel(item.unit || '')}` : ''}
                    </TableCell>
                    <TableCell align="center" sx={cellSx}>{formatDate(item.disposalDate)}</TableCell>
                    <TableCell align="center" sx={cellSx}>
                      <Chip
                        label={dday === 0 ? 'D-Day' : `D-${dday}`}
                        color={getDdayColor(dday)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">{item.manager || ''}</TableCell>
                  </TableRow>
                )
              }) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1 }}>
        {urgentWastes.length > 0 ? urgentWastes.map((item) => {
          const dday = calcDday(item.disposalDate!)
          return (
            <Paper key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="subtitle2" fontWeight="bold">{item.wasteName || ''}</Typography>
                <Chip
                  label={dday === 0 ? 'D-Day' : `D-${dday}`}
                  color={getDdayColor(dday)}
                  size="small"
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {getWasteTypeLabel(item.wasteType || '')} | {item.generationAmount != null ? `${item.generationAmount} ${getWasteUnitLabel(item.unit || '')}` : ''} | {formatDate(item.disposalDate)}
              </Typography>
            </Paper>
          )
        }) : (
          <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
            {t('common.noData')}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default WasteDashboardTab
