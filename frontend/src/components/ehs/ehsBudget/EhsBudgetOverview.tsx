import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Paper, Typography, Grid,
  Select, MenuItem, FormControl, CircularProgress, Alert,
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
  if (rate >= 100) return '#ef4444'
  if (rate >= 80) return '#f59e0b'
  return '#22c55e'
}

// 상단 계획 바 = 붉은색, 하단 실집행 바 = 푸른색
const CHART_PLANNED_COLOR = '#ef4444'
const CHART_USED_COLOR = '#3B82F6'

interface EhsBudgetOverviewProps {
  showYearSelector?: boolean
  year?: number
  onYearChange?: (year: number) => void
}

const EhsBudgetOverview: React.FC<EhsBudgetOverviewProps> = ({
  showYearSelector = true,
  year: externalYear,
  onYearChange,
}) => {
  const { t } = useTranslation()
  const [internalYear, setInternalYear] = useState(currentYear)
  const year = externalYear ?? internalYear
  const setYear = onYearChange ?? setInternalYear
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
      return { category: cat, plan: planSum, used: usedSum, rate, remaining: planSum - usedSum }
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
    { label: t('budget.executionRate', '집행률'), value: `${aggregates.executionRate}%`, color: '#ef4444' },
    { label: t('budget.remaining', '잔여 예산'), value: formatNumber(aggregates.remaining), color: '#f59e0b' },
    { label: t('budget.category', '분류') + ' ' + t('common.count', '수'), value: aggregates.distinctCategories, color: '#8b5cf6' },
  ]

  const maxBarValue = Math.max(1, ...aggregates.categoryStats.flatMap(c => [c.plan, c.used]))

  return (
    <Box>
      {showYearSelector && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpiCards.map((card, idx) => (
          <Grid item xs={6} md={2.4} key={idx}>
            <Paper sx={{ p: 2.5, borderLeft: 4, borderColor: card.color }}>
              <Typography variant="body2" color="text.secondary">{card.label}</Typography>
              <Typography fontWeight="bold" sx={{ mt: 0.75, fontSize: { xs: '1.75rem', md: '2.25rem' }, lineHeight: 1.2 }}>
                {card.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              {t('budget.compareTitle', '분류별 집행 현황')}
            </Typography>
            {aggregates.categoryStats.length === 0 ? (
              <Alert severity="info">{t('common.noData', '데이터가 없습니다')}</Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {aggregates.categoryStats.map((c) => {
                  const planPct = (c.plan / maxBarValue) * 100
                  const usedPct = (c.used / maxBarValue) * 100
                  return (
                    <Box key={c.category}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {getCategoryLabel(c.category) || c.category}
                        </Typography>
                        <Typography variant="body2" sx={{ color: getRateColor(c.rate), fontWeight: 'bold' }}>
                          {c.rate}%
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                        <Typography variant="caption" sx={{ minWidth: 40, color: 'text.secondary' }}>
                          {t('budget.totalPlanned', '계획')}
                        </Typography>
                        <Box sx={{ flex: 1, height: 10, bgcolor: 'grey.100', borderRadius: 0.5, overflow: 'hidden' }}>
                          <Box sx={{ width: `${planPct}%`, height: '100%', bgcolor: CHART_PLANNED_COLOR }} />
                        </Box>
                        <Typography variant="caption" sx={{ minWidth: 80, textAlign: 'right' }}>
                          {formatNumber(c.plan)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ minWidth: 40, color: 'text.secondary' }}>
                          {t('budget.totalUsed', '실집행')}
                        </Typography>
                        <Box sx={{ flex: 1, height: 10, bgcolor: 'grey.100', borderRadius: 0.5, overflow: 'hidden' }}>
                          <Box sx={{ width: `${usedPct}%`, height: '100%', bgcolor: CHART_USED_COLOR }} />
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
    </Box>
  )
}

export default EhsBudgetOverview
