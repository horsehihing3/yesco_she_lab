import { formatDate } from '../../utils/dateDefaults'
import { formatUserName } from '../../utils/userDisplay'
import { useMemo, useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip,
} from '@mui/material'
import { siteSafetyPlanApi } from '../../api/siteSafetyApi'
import { SiteSafetyPlan, SiteSafetyWorker } from '../../types/siteSafety.types'
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
  PENDING_APPROVAL: '결재중',
  APPROVED: '승인',
  DONE: '완료',
  REJECTED: '반려',
}
const STATUS_COLOR: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  DRAFT: 'default', PENDING_APPROVAL: 'warning', APPROVED: 'info', DONE: 'success', REJECTED: 'error',
}
const RISK_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  LOW: 'success', MEDIUM: 'warning', HIGH: 'error', CRITICAL: 'error',
}
const RISK_LABEL: Record<string, string> = { LOW: '낮음', MEDIUM: '중간', HIGH: '높음', CRITICAL: '심각' }

const SiteSafetyReportTab: React.FC = () => {
  const { t } = useTranslation()

  const [startDate, setStartDate] = useState<string>(monthsAgoIso(3))
  const [endDate, setEndDate] = useState<string>(todayIso())

  const { data, isLoading } = useQuery({
    queryKey: ['siteSafetyReportAll'],
    queryFn: () => siteSafetyPlanApi.getAll(0, 1000),
  })

  const reports = useMemo(() => {
    const list = (data as any)?.content || []
    const s = startDate || ''
    const e = endDate || ''
    return list
      .filter((i: SiteSafetyPlan) =>
        i.status === 'APPROVED' || i.status === 'DONE'
      )
      .filter((i: SiteSafetyPlan) => {
        const d = formatDate(i.workStartDate || i.createdAt)
        if (!d) return false
        if (s && d < s) return false
        if (e && d > e) return false
        return true
      })
      .sort((a: SiteSafetyPlan, b: SiteSafetyPlan) =>
        (a.workStartDate || a.createdAt || '').localeCompare(b.workStartDate || b.createdAt || '')
      )
  }, [data, startDate, endDate])

  const workerQueries = useQueries({
    queries: reports.map((r: SiteSafetyPlan) => ({
      queryKey: ['siteSafetyReportWorkers', r.id],
      queryFn: () => siteSafetyPlanApi.getWorkers(r.id),
      enabled: !!r.id,
    })),
  })

  const reportDate = todayIso()

  const renderReport = (
    item: SiteSafetyPlan,
    idx: number,
    total: number,
    workers: SiteSafetyWorker[],
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
          현장 안전 작업 레포트
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('audit.report.reportDate', '보고일')}: {reportDate}
          {' · '}
          {t('common.no', 'No')}. {idx + 1} / {total}
        </Typography>
      </Box>

      {/* 1. 작업 개요 */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        1. 작업 개요
      </Typography>
      <TableContainer sx={{ mb: 3 }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
          <TableBody>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>계획번호</TableCell>
              <TableCell sx={{ width: '30%', fontFamily: 'monospace' }}>{item.planId}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('common.status', '상태')}</TableCell>
              <TableCell sx={{ width: '30%' }}>
                <Chip label={STATUS_LABEL[item.status] || item.status} size="small" color={STATUS_COLOR[item.status] || 'default'} />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>작업명</TableCell>
              <TableCell colSpan={3} sx={{ fontWeight: 600 }}>{item.title}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>작업 유형</TableCell>
              <TableCell>{item.workType || ''}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>위험 등급</TableCell>
              <TableCell>
                {item.riskLevel ? (
                  <Chip label={RISK_LABEL[item.riskLevel] || item.riskLevel} size="small" color={RISK_COLORS[item.riskLevel] || 'default'} />
                ) : ''}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>작업 위치</TableCell>
              <TableCell>{item.workLocation || ''}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>작업 인원</TableCell>
              <TableCell>{item.workersCount || 0}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('common.startDate', '시작일')}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{formatDate(item.workStartDate)}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('common.endDate', '종료일')}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{formatDate(item.workEndDate)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>계획 승인자</TableCell>
              <TableCell colSpan={3}>{formatUserName(item.planApproverTeam, item.planApproverName, item.planApproverPosition) || ''}</TableCell>
            </TableRow>
            {item.workDescription && (
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>작업 내용</TableCell>
                <TableCell colSpan={3} sx={{ whiteSpace: 'pre-wrap' }}>{item.workDescription}</TableCell>
              </TableRow>
            )}
            {item.safetyMeasures && (
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>안전 조치</TableCell>
                <TableCell colSpan={3} sx={{ whiteSpace: 'pre-wrap' }}>{item.safetyMeasures}</TableCell>
              </TableRow>
            )}
            {item.hazardFactors && (
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>유해 위험 요인</TableCell>
                <TableCell colSpan={3} sx={{ whiteSpace: 'pre-wrap' }}>{item.hazardFactors}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 2. 작업자 명단 */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        2. 작업자 명단 ({workers.length}건)
      </Typography>
      {workers.length === 0 ? (
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 3, mb: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">등록된 작업자가 없습니다.</Typography>
        </Box>
      ) : (
        <TableContainer sx={{ mb: 3 }}>
          <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={headerCellSx}>{t('common.no', 'No')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>작업자명</TableCell>
                <TableCell align="center" sx={headerCellSx}>소속사</TableCell>
                <TableCell align="center" sx={headerCellSx}>연락처</TableCell>
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


      {/* 4. 점검 요약 */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        4. 점검 요약
      </Typography>
      <TableContainer sx={{ mb: 3 }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
          <TableBody>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>전체 항목</TableCell>
              <TableCell sx={{ width: '30%' }}>{item.totalChecklist || 0}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>완료 항목</TableCell>
              <TableCell sx={{ width: '30%' }}>{item.completedChecklist || 0}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>부적합 건수</TableCell>
              <TableCell sx={{ color: (item.findingCount || 0) > 0 ? 'error.main' : 'inherit', fontWeight: 'bold' }}>{item.findingCount || 0}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>완료일</TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>
                {item.status === 'DONE' && item.modifiedAt ? formatDate(item.modifiedAt) : ''}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('audit.report.footer', '본 보고서는 SHE 시스템에서 자동 생성되었습니다.')}
        </Typography>
      </Box>
    </Paper>
  )

  const subQueriesLoading = workerQueries.some(q => q.isLoading)

  const columns: ReportColumn<SiteSafetyPlan>[] = [
    { header: '계획번호', key: 'planId', align: 'center', width: 130 },
    { header: '작업명', key: 'title' },
    { header: '작업 유형', align: 'center', width: 110, render: (r) => r.workType || '' },
    { header: '위험 등급', align: 'center', width: 100, render: (r) => r.riskLevel ? <Chip size="small" label={RISK_LABEL[r.riskLevel] || r.riskLevel} color={RISK_COLORS[r.riskLevel] || 'default'} /> : '' },
    { header: t('common.startDate', '시작일'), align: 'center', width: 110, render: (r) => formatDate(r.workStartDate) },
    { header: t('common.endDate', '종료일'), align: 'center', width: 110, render: (r) => formatDate(r.workEndDate) },
    { header: t('common.status', '상태'), align: 'center', width: 100, render: (r) => <Chip size="small" label={STATUS_LABEL[r.status] || r.status} color={STATUS_COLOR[r.status] || 'default'} /> },
  ]

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }} className="no-print">{t('common.report', '레포트')}</Typography>
    <ReportListWrapper<SiteSafetyPlan>
      items={reports}
      columns={columns}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      isLoading={isLoading || subQueriesLoading}
      emptyMessage="레포트로 출력 가능한 현장 안전 작업이 없습니다."
      renderReport={(r, idx, total) => {
        const workerIndex = reports.findIndex((x: SiteSafetyPlan) => x.id === r.id)
        const workers = (workerQueries[workerIndex]?.data as SiteSafetyWorker[] | undefined) || []
        return renderReport(r, idx, total, workers)
      }}
    />
    </Box>
  )
}

export default SiteSafetyReportTab
