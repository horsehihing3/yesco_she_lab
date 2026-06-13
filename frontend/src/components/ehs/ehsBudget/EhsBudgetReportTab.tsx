import { formatDate } from '../../../utils/dateDefaults'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow,
} from '@mui/material'
import axiosInstance from '../../../api/axiosInstance'
import { ApiResponse } from '../../../types/common.types'
import { EhsBudgetPlan, EhsBudgetExpense } from '../../../types/ehsBudget.types'
import ReportListWrapper, { ReportColumn } from '../../common/ReportListWrapper'
import useCodeMap from '../../../hooks/useCodeMap'

const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

const todayIso = () => new Date().toISOString().substring(0, 10)
const monthsAgoIso = (months: number) => {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toISOString().substring(0, 10)
}

const toContent = <T,>(raw: any): T[] => Array.isArray(raw) ? raw : (raw?.content || [])

const fetchExpenses = async (year: number): Promise<EhsBudgetExpense[]> => {
  const res = await axiosInstance.get<ApiResponse<EhsBudgetExpense[] | { content: EhsBudgetExpense[] }>>(`/ehs-budget-expenses?year=${year}`)
  return toContent<EhsBudgetExpense>(res.data.data)
}
const fetchPlans = async (year: number): Promise<EhsBudgetPlan[]> => {
  const res = await axiosInstance.get<ApiResponse<EhsBudgetPlan[] | { content: EhsBudgetPlan[] }>>(`/ehs-budget-plans?year=${year}`)
  return toContent<EhsBudgetPlan>(res.data.data)
}

const formatKRW = (n?: number) => (n == null ? '' : `${n.toLocaleString()} 원`)

const EhsBudgetReportTab: React.FC = () => {
  const { t } = useTranslation()
  const { getLabel: getCategoryLabel } = useCodeMap('EHS_BUDGET_CATEGORY')

  const [startDate, setStartDate] = useState<string>(monthsAgoIso(12))
  const [endDate, setEndDate] = useState<string>(todayIso())

  const yearsInRange = useMemo(() => {
    const sy = startDate ? Number(startDate.substring(0, 4)) : new Date().getFullYear()
    const ey = endDate ? Number(endDate.substring(0, 4)) : new Date().getFullYear()
    const lo = Math.min(sy, ey); const hi = Math.max(sy, ey)
    const arr: number[] = []
    for (let y = lo; y <= hi; y++) arr.push(y)
    return arr
  }, [startDate, endDate])

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['ehsBudgetReportExpenses', yearsInRange.join(',')],
    queryFn: async () => {
      const lists = await Promise.all(yearsInRange.map(fetchExpenses))
      return lists.flat()
    },
  })
  const { data: plans = [] } = useQuery({
    queryKey: ['ehsBudgetReportPlans', yearsInRange.join(',')],
    queryFn: async () => {
      const lists = await Promise.all(yearsInRange.map(fetchPlans))
      return lists.flat()
    },
  })

  const reports = useMemo(() => {
    const s = startDate || ''
    const e = endDate || ''
    return [...expenses]
      .filter(i => {
        const d = formatDate(i.expenseDate || i.createdAt)
        if (!d) return false
        if (s && d < s) return false
        if (e && d > e) return false
        return true
      })
      .sort((a, b) => (b.expenseDate || '').localeCompare(a.expenseDate || ''))
  }, [expenses, startDate, endDate])

  const reportDate = todayIso()

  const renderReport = (item: EhsBudgetExpense, idx: number, total: number) => {
    const relatedPlan = plans.find(p =>
      p.budgetYear === item.budgetYear && p.category === item.category && p.itemName === item.itemName,
    )

    return (
      <Paper sx={{ p: 3, bgcolor: 'grey.50', '@media print': { pageBreakAfter: 'always', breakAfter: 'page' } }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
            {t('budget.report.title', 'EHS 예산 사용 레포트')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('audit.report.reportDate', '보고일')}: {reportDate}
            {' · '}
            {t('common.no', 'No')}. {idx + 1} / {total}
          </Typography>
        </Box>

        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
          1. {t('budget.report.expenseInfo', '사용 정보')}
        </Typography>
        <TableContainer sx={{ mb: 3 }}>
          <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('budget.year', '연도')}</TableCell>
                <TableCell sx={{ width: '30%' }}>{item.budgetYear}</TableCell>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('budget.expenseDate', '집행일')}</TableCell>
                <TableCell sx={{ width: '30%', fontFamily: 'monospace' }}>{formatDate(item.expenseDate)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('budget.category', '구분')}</TableCell>
                <TableCell>{getCategoryLabel(item.category) || item.category}</TableCell>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('budget.department', '부서')}</TableCell>
                <TableCell>{item.department || ''}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('budget.itemName', '항목')}</TableCell>
                <TableCell colSpan={3} sx={{ fontWeight: 600 }}>{item.itemName}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('budget.amount', '집행 금액')}</TableCell>
                <TableCell colSpan={3} sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{formatKRW(item.amount)}</TableCell>
              </TableRow>
              {item.note && (
                <TableRow>
                  <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('common.remarks', '비고')}</TableCell>
                  <TableCell colSpan={3} sx={{ whiteSpace: 'pre-wrap' }}>{item.note}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
          2. {t('budget.report.planVsActual', '계획 대비 실적')}
        </Typography>
        <TableContainer sx={{ mb: 3 }}>
          <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('budget.planAmount', '계획 금액')}</TableCell>
                <TableCell align="center" sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('budget.actualAmount', '집행 금액')}</TableCell>
                <TableCell align="center" sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('budget.executionRate', '집행률')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{formatKRW(relatedPlan?.planAmount)}</TableCell>
                <TableCell align="center" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{formatKRW(item.amount)}</TableCell>
                <TableCell align="center" sx={{ fontFamily: 'monospace' }}>
                  {relatedPlan?.planAmount ? `${Math.round((item.amount / relatedPlan.planAmount) * 100)}%` : '-'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {t('audit.report.footer', '본 보고서는 EHS 시스템에서 자동 생성되었습니다.')}
          </Typography>
        </Box>
      </Paper>
    )
  }

  const columns: ReportColumn<EhsBudgetExpense>[] = [
    { header: t('budget.year', '연도'), align: 'center', width: 80, render: (r) => r.budgetYear },
    { header: t('budget.expenseDate', '집행일'), align: 'center', width: 110, render: (r) => formatDate(r.expenseDate) },
    { header: t('budget.category', '구분'), align: 'center', width: 110, render: (r) => getCategoryLabel(r.category) || r.category },
    { header: t('budget.itemName', '항목'), render: (r) => r.itemName },
    { header: t('budget.department', '부서'), align: 'center', width: 120, render: (r) => r.department || '' },
    { header: t('budget.amount', '집행 금액'), align: 'right', width: 140, render: (r) => formatKRW(r.amount) },
  ]

  return (
    <ReportListWrapper<EhsBudgetExpense>
      items={reports}
      columns={columns}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      isLoading={isLoading}
      emptyMessage={t('budget.report.noData', '집행된 예산 내역이 없습니다.')}
      renderReport={renderReport}
    />
  )
}

export default EhsBudgetReportTab
