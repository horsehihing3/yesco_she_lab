import { formatUserName } from '../../utils/userDisplay'
import { useMemo, useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip,
} from '@mui/material'
import { contractorPlanApi } from '../../api/contractorApi'
import { ContractorPlan, ContractorWorker } from '../../types/contractor.types'
import useCodeMap from '../../hooks/useCodeMap'
import ReportListWrapper, { ReportColumn } from '../common/ReportListWrapper'

const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

const todayIso = () => new Date().toISOString().substring(0, 10)
const monthsAgoIso = (months: number) => {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toISOString().substring(0, 10)
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '작성중',
  PENDING_APPROVAL: '계획 결재중',
  APPROVED: '계획 승인',
  COMPLETION_PENDING: '완료 결재중',
  DONE: '완료',
  REJECTED: '반려',
}
const STATUS_COLOR: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  DRAFT: 'default', PENDING_APPROVAL: 'warning', APPROVED: 'info',
  COMPLETION_PENDING: 'warning', DONE: 'success', REJECTED: 'error',
}

const RISK_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  LOW: 'success', MEDIUM: 'warning', HIGH: 'error', CRITICAL: 'error',
}

const ContractorReportTab: React.FC = () => {
  const { t } = useTranslation()
  const { getLabel: getRiskLabel } = useCodeMap('RISK_LEVEL')
  const { getLabel: getWorkTypeLabel } = useCodeMap('PERMIT_TYPE')

  const [startDate, setStartDate] = useState<string>(monthsAgoIso(3))
  const [endDate, setEndDate] = useState<string>(todayIso())

  const { data, isLoading } = useQuery({
    queryKey: ['contractorReportAll'],
    queryFn: () => contractorPlanApi.getAll(0, 1000),
  })

  const reports = useMemo(() => {
    const list = (data as any)?.content || []
    const s = startDate || ''
    const e = endDate || ''
    return list
      .filter((i: ContractorPlan) => i.status === 'DONE')
      .filter((i: ContractorPlan) => {
        const d = ((i as any).completionApprovedAt || i.workEndDate || i.createdAt || '').substring(0, 10)
        if (!d) return false
        if (s && d < s) return false
        if (e && d > e) return false
        return true
      })
      .sort((a: ContractorPlan, b: ContractorPlan) =>
        (((b as any).completionApprovedAt || '') as string).localeCompare(((a as any).completionApprovedAt || '') as string)
      )
  }, [data, startDate, endDate])

  const workerQueries = useQueries({
    queries: reports.map((r: ContractorPlan) => ({
      queryKey: ['contractorReportWorkers', r.id],
      queryFn: () => contractorPlanApi.getWorkers(r.id),
      enabled: !!r.id,
    })),
  })

  const reportDate = todayIso()

  const renderReport = (
    item: ContractorPlan,
    idx: number,
    total: number,
    workers: ContractorWorker[],
  ) => (
    <Paper
      key={item.id}
      sx={{
        p: 3, bgcolor: 'grey.50',
        '@media print': { pageBreakAfter: 'always', breakAfter: 'page' },
      }}
    >
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
          {t('contractor.report.title', '협력사 작업 레포트')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('audit.report.reportDate', '보고일')}: {reportDate}
          {' · '}
          {t('common.no', 'No')}. {idx + 1} / {total}
        </Typography>
      </Box>

      {/* 1. 작업 개요 */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        1. {t('contractor.report.overviewTitle', '작업 개요')}
      </Typography>
      <TableContainer sx={{ mb: 3 }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
          <TableBody>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('contractor.planId', '계획번호')}</TableCell>
              <TableCell sx={{ width: '30%', fontFamily: 'monospace' }}>{item.planId}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('common.status', '상태')}</TableCell>
              <TableCell sx={{ width: '30%' }}>
                <Chip label={STATUS_LABEL[item.status] || item.status} size="small" color={STATUS_COLOR[item.status] || 'default'} />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('contractor.title', '작업명')}</TableCell>
              <TableCell colSpan={3} sx={{ fontWeight: 600 }}>{item.title}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('contractor.workType', '작업 유형')}</TableCell>
              <TableCell>{item.workType ? getWorkTypeLabel(item.workType) : ''}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('contractor.riskLevel', '위험 등급')}</TableCell>
              <TableCell>
                {item.riskLevel ? (
                  <Chip label={getRiskLabel(item.riskLevel)} size="small" color={RISK_COLORS[item.riskLevel] || 'default'} />
                ) : ''}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('contractor.workLocation', '작업 위치')}</TableCell>
              <TableCell>{item.workLocation || ''}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('contractor.workersCount', '작업 인원')}</TableCell>
              <TableCell>{item.workersCount || 0}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('common.startDate', '시작일')}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{(item.workStartDate || '').substring(0, 10)}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('common.endDate', '종료일')}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{(item.workEndDate || '').substring(0, 10)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('common.planApprover', '계획 승인자')}</TableCell>
              <TableCell>{formatUserName(item.planApproverTeam, item.planApproverName, item.planApproverPosition) || ''}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('common.completionApprover', '완료 승인자')}</TableCell>
              <TableCell>{formatUserName(item.completionApproverTeam, item.completionApproverName, item.completionApproverPosition) || ''}</TableCell>
            </TableRow>
            {item.workDescription && (
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('contractor.workDescription', '작업 내용')}</TableCell>
                <TableCell colSpan={3} sx={{ whiteSpace: 'pre-wrap' }}>{item.workDescription}</TableCell>
              </TableRow>
            )}
            {item.safetyMeasures && (
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('contractor.safetyMeasures', '안전 조치')}</TableCell>
                <TableCell colSpan={3} sx={{ whiteSpace: 'pre-wrap' }}>{item.safetyMeasures}</TableCell>
              </TableRow>
            )}
            {item.hazardFactors && (
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('contractor.hazardFactors', '유해 위험 요인')}</TableCell>
                <TableCell colSpan={3} sx={{ whiteSpace: 'pre-wrap' }}>{item.hazardFactors}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 2. 작업자 명단 */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        2. {t('contractor.report.workersTitle', '작업자 명단')} ({workers.length}{t('audit.report.count', '건')})
      </Typography>
      {workers.length === 0 ? (
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 3, mb: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">{t('contractor.report.noWorkers', '등록된 작업자가 없습니다.')}</Typography>
        </Box>
      ) : (
        <TableContainer sx={{ mb: 3 }}>
          <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={headerCellSx}>{t('common.no', 'No')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('contractor.workerName', '작업자명')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('contractor.companyName', '소속사')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('contractor.workerPhone', '연락처')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workers.map((w, i) => (
                <TableRow key={w.id}>
                  <TableCell align="center">{i + 1}</TableCell>
                  <TableCell>{w.workerName}</TableCell>
                  <TableCell>{w.companyName || ''}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{w.workerPhone || ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 3. 점검 요약 */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        3. {t('contractor.report.checklistSummaryTitle', '점검 요약')}
      </Typography>
      <TableContainer sx={{ mb: 3 }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
          <TableBody>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('contractor.report.totalChecklist', '전체 항목')}</TableCell>
              <TableCell sx={{ width: '30%' }}>{item.totalChecklist || 0}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('contractor.report.completedChecklist', '완료 항목')}</TableCell>
              <TableCell sx={{ width: '30%' }}>{item.completedChecklist || 0}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('contractor.report.findingCount', '부적합 건수')}</TableCell>
              <TableCell sx={{ color: (item.findingCount || 0) > 0 ? 'error.main' : 'inherit', fontWeight: 'bold' }}>{item.findingCount || 0}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('contractor.report.completionDate', '완료일')}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{(item.completionApprovedAt || '').substring(0, 10)}</TableCell>
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

  const subQueriesLoading = workerQueries.some(q => q.isLoading)

  const columns: ReportColumn<ContractorPlan>[] = [
    { header: t('contractor.planId', '계획번호'), key: 'planId', align: 'center', width: 130 },
    { header: t('contractor.title', '작업명'), key: 'title' },
    { header: t('contractor.workType', '작업 유형'), align: 'center', width: 110, render: (r) => r.workType ? getWorkTypeLabel(r.workType) : '' },
    { header: t('contractor.riskLevel', '위험 등급'), align: 'center', width: 100, render: (r) => r.riskLevel ? <Chip size="small" label={getRiskLabel(r.riskLevel)} color={RISK_COLORS[r.riskLevel] || 'default'} /> : '' },
    { header: t('common.startDate', '시작일'), align: 'center', width: 110, render: (r) => (r.workStartDate || '').substring(0, 10) },
    { header: t('common.endDate', '종료일'), align: 'center', width: 110, render: (r) => (r.workEndDate || '').substring(0, 10) },
    { header: t('contractor.completionApprovedDate', '완료 승인일'), align: 'center', width: 130, render: (r) => (((r as any).completionApprovedAt || '') as string).substring(0, 10) },
  ]

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }} className="no-print">
        레포트
      </Typography>
      <ReportListWrapper<ContractorPlan>
        items={reports}
        columns={columns}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        isLoading={isLoading || subQueriesLoading}
        emptyMessage={t('contractor.report.noData', '레포트로 출력 가능한 협력사 작업이 없습니다.')}
        renderReport={(r, idx, total) => {
          const workerIndex = reports.findIndex((x: ContractorPlan) => x.id === r.id)
          const workers = (workerQueries[workerIndex]?.data as ContractorWorker[] | undefined) || []
          return renderReport(r, idx, total, workers)
        }}
      />
    </Box>
  )
}

export default ContractorReportTab
