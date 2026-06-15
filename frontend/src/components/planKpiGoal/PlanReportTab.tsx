import { formatDate } from '../../utils/dateDefaults'
import { formatUserName } from '../../utils/userDisplay'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableRow,
  Chip,
} from '@mui/material'
import axiosInstance from '../../api/axiosInstance'
import { ApiResponse } from '../../types/common.types'
import { EhsPlan } from '../../types/planKpiGoal.types'
import useCodeMap from '../../hooks/useCodeMap'
import GoalsTable, { GOAL_TEMPLATE } from './GoalsTable'
import ReportListWrapper, { ReportColumn } from '../common/ReportListWrapper'

const FORM_NO = 'IMS-100-1'

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'info' | 'error'> = {
  DRAFT: 'default',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'info',
  COMPLETION_PENDING: 'warning',
  DONE: 'success',
  REJECTED: 'error',
}

const STATUS_LABEL_DEFAULTS: Record<string, string> = {
  DRAFT: '작성중',
  PENDING_APPROVAL: '계획 결재중',
  APPROVED: '계획 승인',
  COMPLETION_PENDING: '완료 결재 대기',
  DONE: '완료',
  REJECTED: '반려',
}

const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

const fetchAllReportablePlans = async (years: number[]): Promise<EhsPlan[]> => {
  const responses = await Promise.all(
    years.map(y =>
      axiosInstance.get<ApiResponse<EhsPlan[]>>(`/ehs-plans/approved?year=${y}`)
        .then(r => r.data.data || [])
        .catch(() => [] as EhsPlan[])
    )
  )
  return responses.flat()
}

const formatDateOnly = (s?: string | null) => (s ? s.substring(0, 10) : '')
const formatDateTime = (s?: string | null) => {
  if (!s) return ''
  return s.replace('T', ' ').substring(0, 19)
}

const todayIso = () => new Date().toISOString().substring(0, 10)
const monthsAgoIso = (months: number) => {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toISOString().substring(0, 10)
}

const PlanReportTab: React.FC = () => {
  const { t } = useTranslation()
  const { getLabel: getStatusLabel } = useCodeMap('PLAN_STATUS')

  const [startDate, setStartDate] = useState<string>(monthsAgoIso(3))
  const [endDate, setEndDate] = useState<string>(todayIso())

  const yearsInRange = useMemo(() => {
    const sy = startDate ? Number(startDate.substring(0, 4)) : new Date().getFullYear()
    const ey = endDate ? Number(endDate.substring(0, 4)) : new Date().getFullYear()
    const lo = Math.min(sy, ey)
    const hi = Math.max(sy, ey)
    const arr: number[] = []
    for (let y = lo; y <= hi; y++) arr.push(y)
    return arr
  }, [startDate, endDate])

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['planReportAll', yearsInRange.join(',')],
    queryFn: () => fetchAllReportablePlans(yearsInRange),
  })

  const filtered = useMemo(() => {
    const s = startDate || ''
    const e = endDate || ''
    return items
      .filter(p => {
        const c = formatDate(p.createdAt)
        if (s && c < s) return false
        if (e && c > e) return false
        return true
      })
      .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
  }, [items, startDate, endDate])

  const reportDate = todayIso()

  const renderReport = (d: EhsPlan, idx: number, total: number) => {
    const goalsForReport = GOAL_TEMPLATE.map((tpl, i) => {
      const s = (d.goals || [])[i]
      return {
        ...(s || {}),
        goalText: tpl.goalText || '',
        subGoal: tpl.subGoal,
        sortOrder: (i + 1) * 10,
      }
    })

    return (
      <Paper
        key={d.id}
        sx={{
          p: 3,
          bgcolor: 'grey.50',
          '@media print': { pageBreakAfter: 'always', breakAfter: 'page' },
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
            {t('pkg.reportTitle', '연간 계획 레포트')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('audit.report.reportDate', '보고일')}: {reportDate}
            {' · '}
            {t('common.no', 'No')}. {idx + 1} / {total}
          </Typography>
        </Box>

        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
          1. {t('pkg.reportOverviewTitle', '계획 개요')}
        </Typography>
        <TableContainer sx={{ mb: 3 }}>
          <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('pkg.formNo', '서식번호')}</TableCell>
                <TableCell sx={{ width: '30%', fontFamily: 'monospace' }}>{FORM_NO}</TableCell>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('pkg.planYear', '연도')}</TableCell>
                <TableCell sx={{ width: '30%' }}>{d.planYear}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('pkg.planName', '계획명')}</TableCell>
                <TableCell colSpan={3} sx={{ fontWeight: 600 }}>{d.planName}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('pkg.description', '설명')}</TableCell>
                <TableCell colSpan={3} sx={{ whiteSpace: 'pre-wrap' }}>{d.description || ''}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('pkg.createdDate', '작성일자')}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{formatDateOnly(d.createdAt)}</TableCell>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('pkg.status', '상태')}</TableCell>
                <TableCell>
                  <Chip size="small" label={STATUS_LABEL_DEFAULTS[d.status] || getStatusLabel(d.status) || d.status} color={STATUS_COLORS[d.status] || 'default'} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('pkg.writer', '작성')}</TableCell>
                <TableCell colSpan={3}>
                  {d.createdByName || ''}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('pkg.planApprover', '계획 승인자')}</TableCell>
                <TableCell>
                  {formatUserName(d.planApproverTeam, d.planApproverName, d.planApproverPosition) || ''}
                </TableCell>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('pkg.reportPlanApprovedAt', '계획 승인일')}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{formatDateTime(d.planApprovedAt)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('pkg.completionApprover', '완료 승인자')}</TableCell>
                <TableCell>
                  {formatUserName(d.completionApproverTeam, d.completionApproverName, d.completionApproverPosition) || ''}
                </TableCell>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('pkg.reportCompletionApprovedAt', '완료 승인일')}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{formatDateTime(d.completionApprovedAt)}</TableCell>
              </TableRow>
              {d.remarks && (
                <TableRow>
                  <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('common.remarks', '비고')}</TableCell>
                  <TableCell colSpan={3} sx={{ whiteSpace: 'pre-wrap' }}>{d.remarks}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
          2. {t('pkg.reportGoalsTitle', '목표 추진 결과')}
        </Typography>
        <Box sx={{ mb: 1 }}>
          <GoalsTable
            goals={goalsForReport}
            mode={d.status === 'DONE' ? 'kpiReadOnly' : 'readOnly'}
          />
        </Box>

        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {t('audit.report.footer', '본 보고서는 EHS 시스템에서 자동 생성되었습니다.')}
          </Typography>
        </Box>
      </Paper>
    )
  }

  const columns: ReportColumn<EhsPlan>[] = [
    { header: t('pkg.planYear', '연도'), key: 'planYear' as keyof EhsPlan, align: 'center', width: 80 },
    { header: t('pkg.planName', '계획명'), key: 'planName' as keyof EhsPlan },
    { header: t('pkg.writer', '작성'), align: 'center', width: 120, render: (r) => (r as any).createdByName || '' },
    { header: t('pkg.createdDate', '작성일자'), align: 'center', width: 110, render: (r) => formatDateOnly((r as any).createdAt) },
    { header: t('pkg.status', '상태'), align: 'center', width: 130, render: (r) => <Chip size="small" label={STATUS_LABEL_DEFAULTS[(r as any).status] || getStatusLabel((r as any).status) || (r as any).status} color={STATUS_COLORS[(r as any).status] || 'default'} /> },
  ]

  return (
    <ReportListWrapper<EhsPlan>
      items={filtered}
      columns={columns}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      isLoading={isLoading}
      emptyMessage={t('pkg.reportNoData', '레포트로 출력 가능한 계획이 없습니다.')}
      renderReport={renderReport}
    />
  )
}

export default PlanReportTab
