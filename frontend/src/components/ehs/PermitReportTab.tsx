import { useMemo, useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip,
} from '@mui/material'
import { permitToWorkApi } from '../../api/permitToWorkApi'
import { PermitToWork, PermitWorker } from '../../types/permitToWork.types'
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
  PENDING: '결재중',
  PENDING_APPROVAL: '계획 결재중',
  REQUESTED: '요청됨',
  APPROVED: '계획 승인',
  COMPLETION_PENDING: '완료 결재중',
  DONE: '완료',
  COMPLETED: '완료',
  REJECTED: '반려',
  CANCELLED: '취소',
}
const STATUS_COLOR: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  DRAFT: 'default', PENDING: 'warning', PENDING_APPROVAL: 'warning',
  REQUESTED: 'info', APPROVED: 'info',
  COMPLETION_PENDING: 'warning', DONE: 'success', COMPLETED: 'success',
  REJECTED: 'error', CANCELLED: 'default',
}

const RISK_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  LOW: 'success', MEDIUM: 'warning', HIGH: 'error', CRITICAL: 'error',
}

const PermitReportTab: React.FC = () => {
  const { t } = useTranslation()
  const { getLabel: getPermitTypeLabel } = useCodeMap('PERMIT_TYPE')
  const { getLabel: getRiskLabel } = useCodeMap('RISK_LEVEL')

  const [startDate, setStartDate] = useState<string>(monthsAgoIso(3))
  const [endDate, setEndDate] = useState<string>(todayIso())

  const { data, isLoading } = useQuery({
    queryKey: ['permitReportAll'],
    queryFn: () => permitToWorkApi.getAll(0, 1000),
  })

  const reports = useMemo(() => {
    const list = (data as any)?.content || []
    const s = startDate || ''
    const e = endDate || ''
    const pickDate = (i: any) =>
      (i.completionApprovedAt || i.completedAt || i.workEndDate || i.createdAt || '').substring(0, 10)
    return list
      .filter((i: PermitToWork) => i.status === 'DONE')
      .filter((i: PermitToWork) => {
        const d = pickDate(i)
        if (!d) return false
        if (s && d < s) return false
        if (e && d > e) return false
        return true
      })
      .sort((a: PermitToWork, b: PermitToWork) => pickDate(b).localeCompare(pickDate(a)))
  }, [data, startDate, endDate])

  const workerQueries = useQueries({
    queries: reports.map((r: PermitToWork) => ({
      queryKey: ['permitReportWorkers', r.id],
      queryFn: () => permitToWorkApi.getWorkers(r.id),
      enabled: !!r.id,
    })),
  })

  const reportDate = todayIso()

  const renderReport = (
    item: PermitToWork,
    idx: number,
    total: number,
    workers: PermitWorker[],
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
          {t('permit.report.title', '작업 허가 레포트')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('audit.report.reportDate', '보고일')}: {reportDate}
          {' · '}
          {t('common.no', 'No')}. {idx + 1} / {total}
        </Typography>
      </Box>

      {/* 1. 허가 개요 */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        1. {t('permit.report.overviewTitle', '허가 개요')}
      </Typography>
      <TableContainer sx={{ mb: 3 }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
          <TableBody>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('permit.permitId', '허가번호')}</TableCell>
              <TableCell sx={{ width: '30%', fontFamily: 'monospace' }}>{item.permitId}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('common.status', '상태')}</TableCell>
              <TableCell sx={{ width: '30%' }}>
                <Chip label={STATUS_LABEL[item.status] || item.status} size="small" color={STATUS_COLOR[item.status] || 'default'} />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('permit.title', '작업명')}</TableCell>
              <TableCell colSpan={3} sx={{ fontWeight: 600 }}>{item.title}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('permit.permitType', '허가 유형')}</TableCell>
              <TableCell>{item.permitType ? getPermitTypeLabel(item.permitType) : ''}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('permit.riskLevel', '위험 등급')}</TableCell>
              <TableCell>
                {item.riskLevel ? (
                  <Chip label={getRiskLabel(item.riskLevel)} size="small" color={RISK_COLORS[item.riskLevel] || 'default'} />
                ) : ''}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('permit.workLocation', '작업 위치')}</TableCell>
              <TableCell>{item.workLocation || ''}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('permit.workersCount', '작업 인원')}</TableCell>
              <TableCell>{item.workersCount || 0}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('common.startDate', '시작일')}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{(item.workStartDate || '').substring(0, 16).replace('T', ' ')}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('common.endDate', '종료일')}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{(item.workEndDate || '').substring(0, 16).replace('T', ' ')}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('permit.requester', '신청자')}</TableCell>
              <TableCell>{[item.requesterDept, item.requesterName].filter(Boolean).join(' / ') || ''}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('permit.approver', '승인자')}</TableCell>
              <TableCell>{[item.approverDept, item.approverName].filter(Boolean).join(' / ') || ''}</TableCell>
            </TableRow>
            {item.description && (
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('permit.description', '작업 설명')}</TableCell>
                <TableCell colSpan={3} sx={{ whiteSpace: 'pre-wrap' }}>{item.description}</TableCell>
              </TableRow>
            )}
            {item.safetyMeasures && (
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('permit.safetyMeasures', '안전 조치')}</TableCell>
                <TableCell colSpan={3} sx={{ whiteSpace: 'pre-wrap' }}>{item.safetyMeasures}</TableCell>
              </TableRow>
            )}
            {item.hazardFactors && (
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('permit.hazardFactors', '유해 위험 요인')}</TableCell>
                <TableCell colSpan={3} sx={{ whiteSpace: 'pre-wrap' }}>{item.hazardFactors}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 2. 작업자 명단 */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        2. {t('permit.report.workersTitle', '작업자 명단')} ({workers.length}{t('audit.report.count', '건')})
      </Typography>
      {workers.length === 0 ? (
        <Box sx={{ border: 1, borderColor: 'grey.300', borderRadius: 1, p: 3, mb: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">{t('permit.report.noWorkers', '등록된 작업자가 없습니다.')}</Typography>
        </Box>
      ) : (
        <TableContainer sx={{ mb: 3 }}>
          <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={headerCellSx}>{t('common.no', 'No')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('permit.workerName', '작업자명')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('permit.workerCompany', '소속업체')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('permit.workerPhone', '연락처')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('permit.workerType', '구분')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workers.map((w, i) => (
                <TableRow key={w.id}>
                  <TableCell align="center">{i + 1}</TableCell>
                  <TableCell>{w.workerName}</TableCell>
                  <TableCell>{w.workerCompany || ''}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{w.workerPhone || ''}</TableCell>
                  <TableCell align="center">{w.workerType || ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 3. 점검 요약 */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        3. {t('permit.report.checklistSummaryTitle', '점검 요약')}
      </Typography>
      <TableContainer sx={{ mb: 3 }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
          <TableBody>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('permit.report.totalChecklist', '전체 항목')}</TableCell>
              <TableCell sx={{ width: '30%' }}>{item.totalChecklist || 0}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('permit.report.completedChecklist', '완료 항목')}</TableCell>
              <TableCell sx={{ width: '30%' }}>{item.completedChecklist || 0}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('permit.report.findingCount', '부적합 건수')}</TableCell>
              <TableCell sx={{ color: (item.findingCount || 0) > 0 ? 'error.main' : 'inherit', fontWeight: 'bold' }}>{item.findingCount || 0}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('permit.report.completionDate', '완료일')}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{(item.completedAt || '').substring(0, 10)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'grey.300', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('audit.report.footer', '본 보고서는 EHS 시스템에서 자동 생성되었습니다.')}
        </Typography>
      </Box>
    </Paper>
  )

  const subQueriesLoading = workerQueries.some(q => q.isLoading)

  const columns: ReportColumn<PermitToWork>[] = [
    { header: t('permit.permitId', '허가번호'), align: 'center', width: 130, render: (r) => (r as any).permitId || '' },
    { header: t('permit.title', '제목'), render: (r) => (r as any).title || '' },
    { header: t('permit.permitType', '작업 유형'), align: 'center', width: 120, render: (r) => (r as any).permitType ? getPermitTypeLabel((r as any).permitType) : '' },
    { header: t('common.startDate', '시작일'), align: 'center', width: 110, render: (r) => ((r as any).workStartDate || '').substring(0, 10) },
    { header: t('common.endDate', '종료일'), align: 'center', width: 110, render: (r) => ((r as any).workEndDate || '').substring(0, 10) },
    { header: t('permit.completionApprovedDate', '완료 승인일'), align: 'center', width: 130, render: (r) => (((r as any).completionApprovedAt || (r as any).completedAt || '') as string).substring(0, 10) },
  ]

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }} className="no-print">레포트</Typography>
    <ReportListWrapper<PermitToWork>
      items={reports}
      columns={columns}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      isLoading={isLoading || subQueriesLoading}
      emptyMessage={t('permit.report.noData', '레포트로 출력 가능한 작업 허가가 없습니다.')}
      renderReport={(r, idx, total) => {
        const i = reports.findIndex((x: PermitToWork) => x.id === r.id)
        const workers = (workerQueries[i]?.data as PermitWorker[] | undefined) || []
        return renderReport(r, idx, total, workers)
      }}
    />
    </Box>
  )
}

export default PermitReportTab
