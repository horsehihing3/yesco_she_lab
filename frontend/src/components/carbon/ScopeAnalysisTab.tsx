import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid,
} from '@mui/material'
import { carbonEmissionApi } from '../../api/carbonApi'
import { useThemeMode } from '../../context/ThemeContext'
import { CarbonEmission } from '../../types/carbon.types'

const SCOPE_COLORS: Record<number, string> = {
  1: '#2e7d32',
  2: '#00bcd4',
  3: '#ff9800',
}

const ScopeAnalysisTab: React.FC = () => {
  const { t } = useTranslation()
  const { isDarkMode } = useThemeMode()

  const paperBg = isDarkMode ? '#18181b' : 'background.paper'

  const { data, isLoading } = useQuery({
    queryKey: ['carbonScopeAnalysis'],
    queryFn: () => carbonEmissionApi.findAllList(),
  })

  const records: CarbonEmission[] = data || []

  // Scope summary cards
  const scopeSummary = useMemo(() => {
    const totalEmission = records.reduce((sum, r) => sum + (r.co2Emission || 0), 0)
    const scope1 = records.filter((r) => r.scope === 1).reduce((sum, r) => sum + (r.co2Emission || 0), 0)
    const scope2 = records.filter((r) => r.scope === 2).reduce((sum, r) => sum + (r.co2Emission || 0), 0)
    const scope3 = records.filter((r) => r.scope === 3).reduce((sum, r) => sum + (r.co2Emission || 0), 0)
    return {
      totalEmission,
      scopes: [
        { scope: 1, label: t('carbon.scope.scope1'), sub: t('carbon.scope.directEmission'), emission: scope1, percentage: totalEmission > 0 ? ((scope1 / totalEmission) * 100).toFixed(1) : '0.0' },
        { scope: 2, label: t('carbon.scope.scope2'), sub: t('carbon.scope.indirectEnergy'), emission: scope2, percentage: totalEmission > 0 ? ((scope2 / totalEmission) * 100).toFixed(1) : '0.0' },
        { scope: 3, label: t('carbon.scope.scope3'), sub: t('carbon.scope.otherIndirect'), emission: scope3, percentage: totalEmission > 0 ? ((scope3 / totalEmission) * 100).toFixed(1) : '0.0' },
      ],
    }
  }, [records, t])

  // Group by source name
  const bySource = useMemo(() => {
    const totalEmission = records.reduce((sum, r) => sum + (r.co2Emission || 0), 0)
    const map: Record<string, { sourceName: string; scope: number; totalEmission: number }> = {}
    records.forEach((r) => {
      const key = `${r.sourceName}_${r.scope}`
      if (!map[key]) {
        map[key] = { sourceName: r.sourceName, scope: r.scope, totalEmission: 0 }
      }
      map[key].totalEmission += r.co2Emission || 0
    })
    return Object.values(map)
      .sort((a, b) => b.totalEmission - a.totalEmission)
      .map((item) => ({
        ...item,
        percentage: totalEmission > 0 ? ((item.totalEmission / totalEmission) * 100).toFixed(1) : '0.0',
      }))
  }, [records])

  const headerCellSx = { fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' as const }
  const lastHeaderCellSx = { fontWeight: 'bold', wordBreak: 'keep-all' as const }
  const cellSx = { borderRight: 1, borderColor: 'divider' }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Typography>{t('common.loading')}</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Scope Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {scopeSummary.scopes.map((card) => (
          <Grid item xs={6} md={4} key={card.scope}>
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
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                {card.sub}
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {card.emission.toLocaleString(undefined, { maximumFractionDigits: 2 })} tCO₂eq
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {card.percentage}%
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* By Source Table */}
      <Paper sx={{ p: 2, bgcolor: paperBg }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
          {t('carbon.scope.bySource')}
        </Typography>

        {/* PC Table */}
        <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
          <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={headerCellSx}>{t('common.no')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('carbon.scope.bySource')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('carbon.factor.scope')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('carbon.scope.totalEmission')}</TableCell>
                <TableCell align="center" sx={lastHeaderCellSx}>{t('carbon.scope.percentage')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bySource.length > 0 ? bySource.map((row, idx) => (
                <TableRow key={`${row.sourceName}_${row.scope}`}>
                  <TableCell align="center" sx={cellSx}>{idx + 1}</TableCell>
                  <TableCell sx={cellSx}>{row.sourceName}</TableCell>
                  <TableCell align="center" sx={cellSx}>
                    <Box
                      component="span"
                      sx={{
                        px: 1, py: 0.25, borderRadius: 1, fontSize: '0.75rem', fontWeight: 'bold',
                        bgcolor: SCOPE_COLORS[row.scope] + '20',
                        color: SCOPE_COLORS[row.scope],
                      }}
                    >
                      Scope {row.scope}
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={cellSx}>{row.totalEmission.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                  <TableCell align="center">{row.percentage}%</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>{t('common.noData')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Mobile Card List */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
          {bySource.length > 0 ? bySource.map((row, idx) => (
            <Paper
              key={`${row.sourceName}_${row.scope}`}
              variant="outlined"
              sx={{ p: 2 }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography fontWeight="bold" variant="body2">
                  {idx + 1}. {row.sourceName}
                </Typography>
                <Box
                  component="span"
                  sx={{
                    px: 1, py: 0.25, borderRadius: 1, fontSize: '0.75rem', fontWeight: 'bold',
                    bgcolor: SCOPE_COLORS[row.scope] + '20',
                    color: SCOPE_COLORS[row.scope],
                  }}
                >
                  Scope {row.scope}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">{t('carbon.scope.totalEmission')}</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {row.totalEmission.toLocaleString(undefined, { maximumFractionDigits: 2 })} tCO₂eq
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">{t('carbon.scope.percentage')}</Typography>
                <Typography variant="body2">{row.percentage}%</Typography>
              </Box>
            </Paper>
          )) : (
            <Typography align="center" color="text.secondary" sx={{ py: 3 }}>{t('common.noData')}</Typography>
          )}
        </Box>
      </Paper>
    </Box>
  )
}

export default ScopeAnalysisTab
