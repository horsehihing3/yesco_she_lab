import { formatDate } from '../../utils/dateDefaults'
import { useMemo, useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip,
} from '@mui/material'
import { auditApi, auditFindingApi } from '../../api/auditApi'
import { Audit, AuditFinding } from '../../types/audit.types'
import useCodeMap from '../../hooks/useCodeMap'
import ReportListWrapper, { ReportColumn } from '../common/ReportListWrapper'

const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

const todayIso = () => new Date().toISOString().substring(0, 10)
const monthsAgoIso = (months: number) => {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toISOString().substring(0, 10)
}

const AuditReportTab: React.FC = () => {
  const { t } = useTranslation()
  const { getLabel: getAuditTypeLabel } = useCodeMap('AUDIT_TYPE')
  const { getLabel: getSeverityLabel } = useCodeMap('FINDING_SEVERITY')

  // 기본 범위: 최근 3개월 (오늘 - 3개월 ~ 오늘)
  const [startDate, setStartDate] = useState<string>(monthsAgoIso(3))
  const [endDate, setEndDate] = useState<string>(todayIso())

  // 감사 전체 조회 (백엔드에 날짜 필터가 없어 클라이언트에서 거름)
  const { data, isLoading } = useQuery({
    queryKey: ['auditReportAll'],
    queryFn: () => auditApi.getAll(0, 1000),
  })

  // 완료 결재 승인된 (COMPLETED) 감사만 + completionApprovedAt 기준 날짜 필터
  const reports = useMemo(() => {
    const list = data?.content || []
    const s = startDate || ''
    const e = endDate || ''
    const pickDate = (i: any) =>
      formatDate(i.completionApprovedAt || i.auditDate || i.createdAt)
    return list
      .filter(i => i.status === 'COMPLETED')
      .filter(i => {
        const d = pickDate(i)
        if (!d) return false
        if (s && d < s) return false
        if (e && d > e) return false
        return true
      })
      .sort((a, b) => pickDate(b).localeCompare(pickDate(a)))
  }, [data, startDate, endDate])

  // 각 audit 별 부적합 사항 병렬 조회
  const findingQueries = useQueries({
    queries: reports.map(r => ({
      queryKey: ['auditReportFindings', r.id],
      queryFn: () => auditFindingApi.getByAudit(r.id, 0, 100),
    })),
  })

  const reportDate = todayIso()

  const renderReport = (item: Audit, idx: number, total: number, findings: AuditFinding[]) => (
    <Paper
      key={item.id}
      sx={{
        p: 3, bgcolor: 'grey.50',
        '@media print': { pageBreakAfter: 'always', breakAfter: 'page' },
      }}
    >
      {/* Report Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
          {t('audit.report.title', '감사 레포트')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('audit.report.reportDate', '보고일')}: {reportDate}
          {' · '}
          {t('common.no', 'No')}. {idx + 1} / {total}
        </Typography>
      </Box>

      {/* 1. 감사 개요 */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        1. {t('audit.report.overviewTitle', '감사 개요')}
      </Typography>
      <TableContainer sx={{ mb: 3 }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
          <TableBody>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('audit.auditId')}</TableCell>
              <TableCell sx={{ width: '30%', fontFamily: 'monospace' }}>{item.auditId}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('audit.auditName')}</TableCell>
              <TableCell sx={{ width: '30%', fontWeight: 600 }}>{item.auditName}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('audit.auditType')}</TableCell>
              <TableCell>{getAuditTypeLabel(item.auditType)}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('audit.targetDept')}</TableCell>
              <TableCell>{item.targetDept || ''}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('audit.auditor')}</TableCell>
              <TableCell>{item.auditor || ''}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('audit.auditDate', '감사일')}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{item.auditDate || ''}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('audit.findingCount')}</TableCell>
              <TableCell colSpan={3} sx={{ color: item.findingCount > 0 ? 'error.main' : 'inherit', fontWeight: 'bold' }}>{item.findingCount}</TableCell>
            </TableRow>
            {item.summary && (
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('audit.summary', '요약')}</TableCell>
                <TableCell colSpan={3} sx={{ whiteSpace: 'pre-wrap' }}>{item.summary}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 2. 부적합 사항 */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        2. {t('audit.report.findingsTitle', '부적합 사항')} ({findings.length}{t('audit.report.count', '건')})
      </Typography>
      {findings.length === 0 ? (
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 3, mb: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">{t('audit.report.noFindings', '부적합 사항이 없습니다.')}</Typography>
        </Box>
      ) : (
        <TableContainer sx={{ mb: 3 }}>
          <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={headerCellSx}>{t('common.no')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('audit.findingId')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('audit.severity')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('audit.description', '부적합 내용')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {findings.map((f, i) => (
                <TableRow key={f.id}>
                  <TableCell align="center">{i + 1}</TableCell>
                  <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{f.findingId}</TableCell>
                  <TableCell align="center">{getSeverityLabel(f.severity)}</TableCell>
                  <TableCell>{f.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Footer */}
      <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('audit.report.footer', '본 보고서는 EHS 시스템에서 자동 생성되었습니다.')}
        </Typography>
      </Box>
    </Paper>
  )

  const subQueriesLoading = findingQueries.some(q => q.isLoading)

  const columns: ReportColumn<Audit>[] = [
    { header: t('audit.auditId', '감사번호'), key: 'auditId' as keyof Audit, align: 'center', width: 130 },
    { header: t('audit.title', '제목'), key: 'title' as keyof Audit },
    { header: t('audit.auditDate', '감사일'), align: 'center', width: 110, render: (r) => formatDate((r as any).auditDate) },
    { header: t('audit.auditor', '감사자'), key: 'auditor' as keyof Audit, align: 'center', width: 100 },
    { header: t('common.status', '상태'), align: 'center', width: 110, render: (r) => <Chip size="small" label={(r as any).status} /> },
  ]

  return (
    <ReportListWrapper<Audit>
      items={reports}
      columns={columns}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      isLoading={isLoading || subQueriesLoading}
      emptyMessage={t('audit.report.noData', '레포트로 출력 가능한 감사가 없습니다.')}
      renderReport={(r, idx, total) => {
        const i = reports.findIndex((x: Audit) => x.id === r.id)
        return renderReport(r, idx, total, findingQueries[i]?.data?.content || [])
      }}
    />
  )
}

export default AuditReportTab
