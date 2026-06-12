import { formatUserName } from '../../utils/userDisplay'
import { useMemo, useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip,
} from '@mui/material'
import { riskAssessmentApi } from '../../api/riskAssessmentApi'
import { RiskAssessment, RiskAssessmentDetail, RiskRegister } from '../../types/riskAssessment.types'
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
  SUBMITTED: '제출',
  APPROVED: '승인',
  COMPLETION_SUBMITTED: '완료 상신',
  REJECTED: '반려',
  completed: '완료',
}

const RiskAssessmentReportTab: React.FC = () => {
  const { t } = useTranslation()

  const [startDate, setStartDate] = useState<string>(monthsAgoIso(3))
  const [endDate, setEndDate] = useState<string>(todayIso())

  const { data, isLoading } = useQuery({
    queryKey: ['riskAssessmentReportAll'],
    queryFn: () => riskAssessmentApi.getAll({ page: 0, size: 1000 }),
  })

  const reports = useMemo(() => {
    const list = (data as any)?.content || []
    const s = startDate || ''
    const e = endDate || ''
    const pickDate = (i: any) =>
      (i.completionApprovedAt || i.completedDate || i.modifiedAt || i.createdAt || '').substring(0, 10)
    return list
      .filter((i: RiskAssessment) => i.status === 'COMPLETED')
      .filter((i: RiskAssessment) => {
        const d = pickDate(i)
        if (!d) return false
        if (s && d < s) return false
        if (e && d > e) return false
        return true
      })
      .sort((a: RiskAssessment, b: RiskAssessment) => pickDate(b).localeCompare(pickDate(a)))
  }, [data, startDate, endDate])

  const detailQueries = useQueries({
    queries: reports.map((r: RiskAssessment) => ({
      queryKey: ['riskReportDetails', r.riskId],
      queryFn: () => riskAssessmentApi.getAssessmentDetails(r.riskId),
      enabled: !!r.riskId,
    })),
  })
  const registerQueries = useQueries({
    queries: reports.map((r: RiskAssessment) => ({
      queryKey: ['riskReportRegisters', r.riskId],
      queryFn: () => riskAssessmentApi.getRiskRegisters(r.riskId),
      enabled: !!r.riskId,
    })),
  })

  const reportDate = todayIso()

  const renderReport = (
    item: RiskAssessment,
    idx: number,
    total: number,
    details: RiskAssessmentDetail[],
    registers: RiskRegister[],
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
          {t('riskAssessment.report.title', '위험성 평가 레포트')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('audit.report.reportDate', '보고일')}: {reportDate}
          {' · '}
          {t('common.no', 'No')}. {idx + 1} / {total}
        </Typography>
      </Box>

      {/* 1. 평가 개요 */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        1. {t('riskAssessment.report.overviewTitle', '평가 개요')}
      </Typography>
      <TableContainer sx={{ mb: 3 }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
          <TableBody>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('riskAssessment.riskId', '평가번호')}</TableCell>
              <TableCell sx={{ width: '30%', fontFamily: 'monospace' }}>{item.riskId}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('riskAssessment.title', '제목')}</TableCell>
              <TableCell sx={{ width: '30%', fontWeight: 600 }}>{item.title}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('riskAssessment.site', '사업장')}</TableCell>
              <TableCell>{item.site || ''}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('common.status', '상태')}</TableCell>
              <TableCell>
                <Chip label={STATUS_LABEL[item.status] || item.status} size="small" color={
                  item.status === 'APPROVED' ? 'success'
                  : item.status === 'COMPLETION_SUBMITTED' ? 'info'
                  : item.status === 'COMPLETED' ? 'primary'
                  : 'default'
                } />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('riskAssessment.author', '작성자')}</TableCell>
              <TableCell>{item.authorName || ''}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('riskAssessment.authorDept', '작성부서')}</TableCell>
              <TableCell>{item.authorDept || ''}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('common.planApprover', '계획 승인자')}</TableCell>
              <TableCell>{formatUserName(item.planApproverTeam, item.planApproverName, item.planApproverPosition) || ''}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('common.completionApprover', '완료 승인자')}</TableCell>
              <TableCell>{formatUserName(item.completionApproverTeam, item.completionApproverName, item.completionApproverPosition) || ''}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('common.createdAt', '등록일')}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{(item.createdAt || '').substring(0, 10)}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('riskAssessment.completedDate', '완료일')}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{(item.completedDate || '').substring(0, 10)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* 2. 위험성 평가 항목 */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        2. {t('riskAssessment.report.detailsTitle', '위험성 평가 항목')} ({details.length}{t('audit.report.count', '건')})
      </Typography>
      {details.length === 0 ? (
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 3, mb: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">{t('riskAssessment.report.noDetails', '평가 항목이 없습니다.')}</Typography>
        </Box>
      ) : (
        <TableContainer sx={{ mb: 3 }}>
          <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={headerCellSx}>{t('common.no', 'No')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('riskAssessment.detailAction', '세부 활동공정')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('riskAssessment.danger', '위험')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('riskAssessment.expectedDisaster', '예상재해')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('riskAssessment.riskGrade', '등급')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('riskAssessment.reductionMeasures', '감소대책')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {details.map((d, i) => (
                <TableRow key={d.id}>
                  <TableCell align="center">{i + 1}</TableCell>
                  <TableCell>{d.detailAction || ''}</TableCell>
                  <TableCell>{d.danger || ''}</TableCell>
                  <TableCell>{d.expectedDisaster || ''}</TableCell>
                  <TableCell align="center">
                    <Chip label={d.riskGrade} size="small" color={d.riskGrade === 'A' ? 'error' : d.riskGrade === 'B' ? 'warning' : 'success'} sx={{ fontWeight: 'bold' }} />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'pre-wrap' }}>{d.reductionMeasures || ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 3. 위험성 등록부 */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        3. {t('riskAssessment.report.registerTitle', '위험성 등록부')} ({registers.length}{t('audit.report.count', '건')})
      </Typography>
      {registers.length === 0 ? (
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 3, mb: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">{t('riskAssessment.report.noRegisters', '등록된 위험성이 없습니다.')}</Typography>
        </Box>
      ) : (
        <TableContainer sx={{ mb: 3 }}>
          <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={headerCellSx}>{t('common.no', 'No')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('riskAssessment.categoryNum', '분류번호')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('riskAssessment.detailAction', '세부 활동공정')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('riskAssessment.danger', '위험')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('riskAssessment.riskGrade', '등급')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('riskAssessment.approver', '승인자')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {registers.map((r, i) => (
                <TableRow key={r.id}>
                  <TableCell align="center">{r.registerNum || i + 1}</TableCell>
                  <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.categoryNum || ''}</TableCell>
                  <TableCell>{r.detailAction || ''}</TableCell>
                  <TableCell>{r.danger || ''}</TableCell>
                  <TableCell align="center">
                    <Chip label={r.riskGrade} size="small" color={r.riskGrade === 'A' ? 'error' : r.riskGrade === 'B' ? 'warning' : 'success'} sx={{ fontWeight: 'bold' }} />
                  </TableCell>
                  <TableCell align="center">{r.approverName || ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('audit.report.footer', '본 보고서는 EHS 시스템에서 자동 생성되었습니다.')}
        </Typography>
      </Box>
    </Paper>
  )

  const subQueriesLoading = detailQueries.some(q => q.isLoading) || registerQueries.some(q => q.isLoading)

  const columns: ReportColumn<RiskAssessment>[] = [
    { header: '제목', render: (r) => (r as any).title || '' },
    { header: '완료일', align: 'center', width: 130, render: (r) => (((r as any).completionApprovedAt || (r as any).completedDate || (r as any).modifiedAt || '') as string).substring(0, 10) },
  ]

  return (
    <ReportListWrapper<RiskAssessment>
      items={reports}
      columns={columns}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      isLoading={isLoading || subQueriesLoading}
      emptyMessage={t('riskAssessment.report.noData', '레포트로 출력 가능한 위험성 평가가 없습니다.')}
      renderReport={(r, idx, total) => {
        const i = reports.findIndex((x: RiskAssessment) => x.id === r.id)
        return renderReport(
          r, idx, total,
          (detailQueries[i]?.data as RiskAssessmentDetail[] | undefined) || [],
          (registerQueries[i]?.data as RiskRegister[] | undefined) || []
        )
      }}
    />
  )
}

export default RiskAssessmentReportTab
