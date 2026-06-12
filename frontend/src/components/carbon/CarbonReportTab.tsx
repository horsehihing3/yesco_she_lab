import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid,
} from '@mui/material'
import { carbonEmissionApi } from '../../api/carbonApi'
import { useThemeMode } from '../../context/ThemeContext'
import { CarbonEmission } from '../../types/carbon.types'

const CarbonReportTab: React.FC = () => {
  const { t } = useTranslation()
  const { isDarkMode } = useThemeMode()

  const paperBg = isDarkMode ? '#18181b' : 'background.paper'

  const { data, isLoading } = useQuery({
    queryKey: ['carbonReport'],
    queryFn: () => carbonEmissionApi.findAllList(),
  })

  const records: CarbonEmission[] = data || []

  // Summary stats
  const stats = useMemo(() => {
    const totalEmission = records.reduce((sum, r) => sum + (r.co2Emission || 0), 0)
    const scope1 = records.filter((r) => r.scope === 1).reduce((sum, r) => sum + (r.co2Emission || 0), 0)
    const scope2 = records.filter((r) => r.scope === 2).reduce((sum, r) => sum + (r.co2Emission || 0), 0)
    const scope3 = records.filter((r) => r.scope === 3).reduce((sum, r) => sum + (r.co2Emission || 0), 0)
    return { totalEmission, scope1, scope2, scope3 }
  }, [records])

  // Group by source name
  const bySource = useMemo(() => {
    const totalEmission = records.reduce((sum, r) => sum + (r.co2Emission || 0), 0)
    const map: Record<string, number> = {}
    records.forEach((r) => {
      const name = r.sourceName || 'UNKNOWN'
      map[name] = (map[name] || 0) + (r.co2Emission || 0)
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([sourceName, emission]) => ({
        sourceName,
        totalEmission: emission,
        percentage: totalEmission > 0 ? ((emission / totalEmission) * 100).toFixed(1) : '0.0',
      }))
  }, [records])

  // Monthly trend (recent 6 months)
  const byMonth = useMemo(() => {
    const now = new Date()
    const months: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    const map: Record<string, { scope1: number; scope2: number; scope3: number }> = {}
    months.forEach((m) => { map[m] = { scope1: 0, scope2: 0, scope3: 0 } })
    records.forEach((r) => {
      const dateStr = r.recordDate || r.createdAt
      if (dateStr) {
        const ym = dateStr.substring(0, 7)
        if (map[ym]) {
          if (r.scope === 1) map[ym].scope1 += r.co2Emission || 0
          else if (r.scope === 2) map[ym].scope2 += r.co2Emission || 0
          else if (r.scope === 3) map[ym].scope3 += r.co2Emission || 0
        }
      }
    })
    return months.map((m) => ({
      month: m,
      scope1: map[m].scope1,
      scope2: map[m].scope2,
      scope3: map[m].scope3,
      total: map[m].scope1 + map[m].scope2 + map[m].scope3,
    }))
  }, [records])

  const headerCellSx = { fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' as const }
  const lastHeaderCellSx = { fontWeight: 'bold', wordBreak: 'keep-all' as const }
  const cellSx = { borderRight: 1, borderColor: 'divider' }

  const statCards = [
    { label: t('carbon.report.totalEmission'), value: `${stats.totalEmission.toLocaleString(undefined, { maximumFractionDigits: 2 })} tCO₂eq`, color: '#1976d2' },
    { label: t('carbon.report.scope1Emission'), value: `${stats.scope1.toLocaleString(undefined, { maximumFractionDigits: 2 })} tCO₂eq`, color: '#2e7d32' },
    { label: t('carbon.report.scope2Emission'), value: `${stats.scope2.toLocaleString(undefined, { maximumFractionDigits: 2 })} tCO₂eq`, color: '#00bcd4' },
    { label: t('carbon.report.scope3Emission'), value: `${stats.scope3.toLocaleString(undefined, { maximumFractionDigits: 2 })} tCO₂eq`, color: '#ff9800' },
  ]

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Typography>{t('common.loading')}</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((card, idx) => (
          <Grid item xs={6} md={3} key={idx}>
            <Paper
              sx={(theme: any) => ({
                p: 2.5,
                pl: 3,
                position: 'relative',
                overflow: 'hidden',
                bgcolor: paperBg,
                ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }),
                '&::before': { content: '""', position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, backgroundColor: theme.isYesco ? '#E60012' : '#2563eb', borderTopLeftRadius: 'inherit', borderBottomLeftRadius: 'inherit' },
              })}
            >
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {card.label}
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {card.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        {/* By Source */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, bgcolor: paperBg }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
              {t('carbon.report.bySource')}
            </Typography>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 400, '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell align="center" sx={headerCellSx}>{t('carbon.report.source')}</TableCell>
                    <TableCell align="center" sx={headerCellSx}>{t('carbon.report.emission')}</TableCell>
                    <TableCell align="center" sx={lastHeaderCellSx}>{t('carbon.report.percentage')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bySource.length > 0 ? bySource.map((row) => (
                    <TableRow key={row.sourceName}>
                      <TableCell sx={cellSx}>{row.sourceName}</TableCell>
                      <TableCell align="right" sx={cellSx}>{row.totalEmission.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell align="center">{row.percentage}%</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 3 }}>{t('common.noData')}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Monthly Trend */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, bgcolor: paperBg }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
              {t('carbon.report.monthlyTrend')}
            </Typography>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 560, '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell align="center" sx={headerCellSx}>{t('carbon.report.month')}</TableCell>
                    <TableCell align="center" sx={headerCellSx}>Scope 1</TableCell>
                    <TableCell align="center" sx={headerCellSx}>Scope 2</TableCell>
                    <TableCell align="center" sx={headerCellSx}>Scope 3</TableCell>
                    <TableCell align="center" sx={lastHeaderCellSx}>{t('carbon.report.total')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {byMonth.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell align="center" sx={cellSx}>{row.month}</TableCell>
                      <TableCell align="right" sx={cellSx}>{row.scope1.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell align="right" sx={cellSx}>{row.scope2.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell align="right" sx={cellSx}>{row.scope3.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell align="right">{row.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default CarbonReportTab
