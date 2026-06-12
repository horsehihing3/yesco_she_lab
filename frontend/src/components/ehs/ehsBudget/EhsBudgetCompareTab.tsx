import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Paper, Typography, Grid, LinearProgress,
  Select, MenuItem, FormControl, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import axiosInstance from '../../../api/axiosInstance'
import { EhsBudgetPlan, EhsBudgetExpense } from '../../../types/ehsBudget.types'
import { ApiResponse } from '../../../types/common.types'
import useCodeMap from '../../../hooks/useCodeMap'

const currentYear = new Date().getFullYear()

const fetchPlansByYear = async (year: number): Promise<EhsBudgetPlan[]> => {
  const res = await axiosInstance.get<ApiResponse<EhsBudgetPlan[] | { content: EhsBudgetPlan[] }>>(`/ehs-budget-plans/by-year/${year}`)
  const data = res.data.data
  return Array.isArray(data) ? data : (data?.content || [])
}

const fetchExpensesByYear = async (year: number): Promise<EhsBudgetExpense[]> => {
  const res = await axiosInstance.get<ApiResponse<EhsBudgetExpense[] | { content: EhsBudgetExpense[] }>>(`/ehs-budget-expenses/by-year/${year}`)
  const data = res.data.data
  return Array.isArray(data) ? data : (data?.content || [])
}

const formatNumber = (n: number | null | undefined): string => {
  if (n == null) return '0'
  return Number(n).toLocaleString()
}

const getRateColor = (rate: number): string => {
  if (rate >= 100) return '#ef4444' // red
  if (rate >= 80) return '#f59e0b' // yellow
  return '#22c55e' // green
}

const hSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

const EhsBudgetCompareTab: React.FC = () => {
  const { t } = useTranslation()
  const [year, setYear] = useState(currentYear)
  const { getLabel: getCategoryLabel } = useCodeMap('EHS_BUDGET_CATEGORY')

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['ehsBudgetPlans-byYear', year],
    queryFn: () => fetchPlansByYear(year),
  })

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['ehsBudgetExpenses-byYear', year],
    queryFn: () => fetchExpensesByYear(year),
  })

  const isLoading = plansLoading || expensesLoading

  const aggregates = useMemo(() => {
    const planTotal = plans.reduce((s, p) => s + (p.planAmount || 0), 0)
    const usedTotal = expenses.reduce((s, e) => s + (e.amount || 0), 0)
    const executionRate = planTotal > 0 ? Math.round((usedTotal / planTotal) * 100) : 0
    const remaining = planTotal - usedTotal

    const categories = Array.from(new Set([...plans.map(p => p.category), ...expenses.map(e => e.category)]))
    const categoryStats = categories.map((cat) => {
      const planSum = plans
        .filter(p => p.category === cat)
        .reduce((s, p) => s + (p.planAmount || 0), 0)
      const usedSum = expenses
        .filter(e => e.category === cat)
        .reduce((s, e) => s + (e.amount || 0), 0)
      const rate = planSum > 0 ? Math.round((usedSum / planSum) * 100) : 0
      return {
        category: cat,
        plan: planSum,
        used: usedSum,
        rate,
        remaining: planSum - usedSum,
      }
    }).sort((a, b) => b.plan - a.plan)

    return {
      planTotal,
      usedTotal,
      executionRate,
      remaining,
      distinctCategories: categories.length,
      categoryStats,
    }
  }, [plans, expenses])

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }

  const kpiCards = [
    { label: t('budget.totalPlanned', '계획 예산 총액'), value: formatNumber(aggregates.planTotal), color: '#3b82f6' },
    { label: t('budget.totalUsed', '실집행 총액'), value: formatNumber(aggregates.usedTotal), color: '#22c55e' },
    { label: t('budget.executionRate', '집행률'), value: `${aggregates.executionRate}%`, color: getRateColor(aggregates.executionRate) },
    { label: t('budget.remaining', '잔여 예산'), value: formatNumber(aggregates.remaining), color: '#f59e0b' },
    { label: t('budget.category', '분류') + ' ' + t('common.count', '수'), value: aggregates.distinctCategories, color: '#8b5cf6' },
  ]

  // Max value for normalizing bars in left chart
  const maxBarValue = Math.max(
    1,
    ...aggregates.categoryStats.flatMap(c => [c.plan, c.used])
  )

  return (
    <Box>
      {/* Year selector */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))} displayEmpty>
            <MenuItem value="" disabled>선택하세요</MenuItem>
            {[currentYear - 1, currentYear, currentYear + 1].map(y => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpiCards.map((card, idx) => (
          <Grid item xs={12} md={2.4} key={idx}>
            <Paper sx={(theme: any) => ({ p: 2.5, pl: 3, position: 'relative', overflow: 'hidden', ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }), '&::before': { content: '""', position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, backgroundColor: theme.isYesco ? '#E60012' : '#2563eb', borderTopLeftRadius: 'inherit', borderBottomLeftRadius: 'inherit' } })}>
              <Typography variant="body2" color="text.secondary">{card.label}</Typography>
              <Typography fontWeight="bold" sx={{ mt: 0.75, fontSize: { xs: '1.75rem', md: '2.25rem' }, lineHeight: 1.2 }}>
                {card.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Single category bar chart (분기별 누적 차트는 분기 폐기로 제거) */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Paper sx={(theme: any) => ({ p: 2, height: '100%', ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }) })}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              {t('budget.compareTitle', '분류별 집행 현황')}
            </Typography>
            {aggregates.categoryStats.length === 0 ? (
              <Alert severity="info">{t('common.noData', '데이터가 없습니다')}</Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {aggregates.categoryStats.map((c) => {
                  const planPct = (c.plan / maxBarValue) * 100
                  const usedPct = (c.used / maxBarValue) * 100
                  return (
                    <Box key={c.category}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {getCategoryLabel(c.category) || c.category}
                        </Typography>
                        <Typography variant="body2" sx={{ color: getRateColor(c.rate), fontWeight: 'bold' }}>
                          {c.rate}%
                        </Typography>
                      </Box>
                      {/* Plan bar */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="caption" sx={{ minWidth: 40, color: 'text.secondary' }}>
                          {t('budget.totalPlanned', '계획')}
                        </Typography>
                        <Box sx={{ flex: 1, height: 14, bgcolor: 'grey.100', borderRadius: 0.5, overflow: 'hidden' }}>
                          <Box sx={{ width: `${planPct}%`, height: '100%', bgcolor: '#3b82f6' }} />
                        </Box>
                        <Typography variant="caption" sx={{ minWidth: 80, textAlign: 'right' }}>
                          {formatNumber(c.plan)}
                        </Typography>
                      </Box>
                      {/* Used bar */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ minWidth: 40, color: 'text.secondary' }}>
                          {t('budget.totalUsed', '실집행')}
                        </Typography>
                        <Box sx={{ flex: 1, height: 14, bgcolor: 'grey.100', borderRadius: 0.5, overflow: 'hidden' }}>
                          <Box sx={{ width: `${usedPct}%`, height: '100%', bgcolor: getRateColor(c.rate) }} />
                        </Box>
                        <Typography variant="caption" sx={{ minWidth: 80, textAlign: 'right' }}>
                          {formatNumber(c.used)}
                        </Typography>
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            )}
          </Paper>
        </Grid>

      </Grid>

      {/* Detail Table */}
      <Paper sx={{ p: { xs: 1, md: 2 } }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          {t('budget.compareTitle', '분류별 집행 현황')}
        </Typography>

        {aggregates.categoryStats.length === 0 ? (
          <Alert severity="info">{t('common.noData', '데이터가 없습니다')}</Alert>
        ) : (
          <>
            {/* PC Table */}
            <TableContainer sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
              <Table size="small" sx={{
                '& td, & th': { borderRight: '1px solid', borderColor: 'divider' },
                '& td:last-child, & th:last-child': { borderRight: 'none' },
              }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={hSx} align="center">{t('budget.category', '분류')}</TableCell>
                    <TableCell sx={hSx} align="right">{t('budget.totalPlanned', '계획')}</TableCell>
                    <TableCell sx={hSx} align="right">{t('budget.totalUsed', '실집행')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('budget.executionRate', '집행률')}</TableCell>
                    <TableCell sx={hSx} align="right">{t('budget.remaining', '잔여')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {aggregates.categoryStats.map((c) => (
                    <TableRow key={c.category} hover>
                      <TableCell align="center">
                        <Chip label={getCategoryLabel(c.category) || c.category} size="small" />
                      </TableCell>
                      <TableCell align="right">{formatNumber(c.plan)}</TableCell>
                      <TableCell align="right">{formatNumber(c.used)}</TableCell>
                      <TableCell align="center" sx={{ minWidth: 200 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(100, c.rate)}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                bgcolor: 'grey.200',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: getRateColor(c.rate),
                                  borderRadius: 4,
                                },
                              }}
                            />
                          </Box>
                          <Typography variant="body2" fontWeight="bold" sx={{ color: getRateColor(c.rate), minWidth: 45, textAlign: 'right' }}>
                            {c.rate}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ color: c.remaining < 0 ? 'error.main' : 'inherit', fontWeight: 'bold' }}>
                        {formatNumber(c.remaining)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Mobile Card List */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              {aggregates.categoryStats.map((c) => (
                <Paper key={c.category} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Chip label={getCategoryLabel(c.category) || c.category} size="small" />
                    <Typography variant="body2" fontWeight="bold" sx={{ color: getRateColor(c.rate) }}>
                      {c.rate}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">{t('budget.totalPlanned', '계획')}</Typography>
                      <Typography variant="body2">{formatNumber(c.plan)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">{t('budget.totalUsed', '실집행')}</Typography>
                      <Typography variant="body2">{formatNumber(c.used)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">{t('budget.remaining', '잔여')}</Typography>
                      <Typography variant="body2" sx={{ color: c.remaining < 0 ? 'error.main' : 'inherit', fontWeight: 'bold' }}>
                        {formatNumber(c.remaining)}
                      </Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, c.rate)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getRateColor(c.rate),
                        borderRadius: 4,
                      },
                    }}
                  />
                </Paper>
              ))}
            </Box>
          </>
        )}
      </Paper>
    </Box>
  )
}

export default EhsBudgetCompareTab
