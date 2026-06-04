import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Box, Typography, Paper, Select, MenuItem, FormControl, CircularProgress, Chip, LinearProgress } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import { kpiApi } from '../api/kpiApi'
import useCodeMap from '../hooks/useCodeMap'

const KpiDashboardPage: React.FC = () => {
  const { t } = useTranslation()
  const [year, setYear] = useState(new Date().getFullYear())
  const { codeList: kpiTypes, getLabel: getKpiLabel } = useCodeMap('KPI_TYPE')

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['kpiRecords', year],
    queryFn: () => kpiApi.getByYear(year),
  })

  const grouped = useMemo(() => {
    const map: Record<string, { records: typeof records; latestActual: number; latestTarget: number; unit: string; trend: number }> = {}
    records.forEach((r) => {
      if (!map[r.kpiType]) map[r.kpiType] = { records: [], latestActual: 0, latestTarget: 0, unit: '%', trend: 0 }
      map[r.kpiType].records.push(r)
    })
    Object.keys(map).forEach((key) => {
      const sorted = map[key].records.sort((a, b) => a.recordMonth - b.recordMonth)
      const latest = sorted[sorted.length - 1]
      const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null
      map[key].latestActual = latest?.actualValue || 0
      map[key].latestTarget = latest?.targetValue || 0
      map[key].unit = latest?.unit || '%'
      map[key].trend = prev ? (latest?.actualValue || 0) - (prev?.actualValue || 0) : 0
    })
    return map
  }, [records])

  const isGoodTrend = (type: string, trend: number) => {
    if (['ACCIDENT_RATE', 'FREQUENCY_RATE', 'SEVERITY_RATE'].includes(type)) return trend <= 0
    return trend >= 0
  }

  const isTargetMet = (type: string, actual: number, target: number) => {
    if (['ACCIDENT_RATE', 'FREQUENCY_RATE', 'SEVERITY_RATE'].includes(type)) return actual <= target
    return actual >= target
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">{t('nav.kpiDashboard')}</Typography>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))} displayEmpty>
            <MenuItem value="" disabled>선택</MenuItem>
            {[2024, 2025, 2026].map((y) => <MenuItem key={y} value={y}>{y}년</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box> : (
        <>
          {/* KPI Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
            {kpiTypes.map((kpiCode) => {
              const key = kpiCode.code
              const data = grouped[key]
              if (!data) return null
              const met = isTargetMet(key, data.latestActual, data.latestTarget)
              const good = isGoodTrend(key, data.trend)
              return (
                <Paper key={key} sx={{ p: 2, borderTop: '3px solid', borderColor: met ? 'success.main' : 'warning.main' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>{getKpiLabel(key)}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Typography variant="h4" fontWeight="bold" color={met ? 'success.main' : 'warning.main'}>
                      {data.latestActual}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{data.unit}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    {good ? <TrendingUpIcon sx={{ fontSize: 14, color: 'success.main' }} /> : <TrendingDownIcon sx={{ fontSize: 14, color: 'error.main' }} />}
                    <Typography variant="caption" color={good ? 'success.main' : 'error.main'}>
                      {data.trend >= 0 ? '+' : ''}{data.trend.toFixed(2)}
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    {met ? <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} /> : <WarningIcon sx={{ fontSize: 14, color: 'warning.main' }} />}
                    <Typography variant="caption" color="text.secondary">{t('kpi.target')}: {data.latestTarget}{data.unit}</Typography>
                  </Box>
                </Paper>
              )
            })}
          </Box>

          {/* Monthly Trend Table */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>{t('kpi.monthlyTrend')}</Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>{t('kpi.indicator')}</th>
                    {Array.from({ length: 12 }, (_, i) => (
                      <th key={i} style={{ textAlign: 'center', padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>{i + 1}월</th>
                    ))}
                    <th style={{ textAlign: 'center', padding: '8px 12px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>{t('kpi.achievement')}</th>
                  </tr>
                </thead>
                <tbody>
                  {kpiTypes.map((kpiCode) => {
                    const key = kpiCode.code
                    const data = grouped[key]
                    if (!data) return null
                    const monthMap: Record<number, typeof records[0]> = {}
                    data.records.forEach((r) => { monthMap[r.recordMonth] = r })
                    const filledMonths = data.records.length
                    const metCount = data.records.filter((r) => isTargetMet(key, r.actualValue || 0, r.targetValue || 0)).length
                    const achieveRate = filledMonths > 0 ? Math.round((metCount / filledMonths) * 100) : 0
                    return (
                      <tr key={key}>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', fontWeight: 600, whiteSpace: 'nowrap' }}>{getKpiLabel(key)}</td>
                        {Array.from({ length: 12 }, (_, i) => {
                          const r = monthMap[i + 1]
                          const met = r ? isTargetMet(key, r.actualValue || 0, r.targetValue || 0) : true
                          return (
                            <td key={i} style={{ textAlign: 'center', padding: '6px', borderBottom: '1px solid #eee', fontFamily: 'monospace', color: r ? (met ? '#16a34a' : '#ea580c') : '#aaa' }}>
                              {r ? r.actualValue : ''}
                            </td>
                          )
                        })}
                        <td style={{ textAlign: 'center', padding: '6px 12px', borderBottom: '1px solid #eee' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                            <LinearProgress variant="determinate" value={achieveRate} color={achieveRate >= 80 ? 'success' : 'warning'} sx={{ width: 50, height: 6, borderRadius: 3 }} />
                            <Typography variant="caption" fontFamily="monospace" fontWeight="bold">{achieveRate}%</Typography>
                          </Box>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Box>
          </Paper>
        </>
      )}
    </Box>
  )
}

export default KpiDashboardPage
