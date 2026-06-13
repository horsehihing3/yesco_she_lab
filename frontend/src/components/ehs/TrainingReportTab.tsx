import { formatDate } from '../../utils/dateDefaults'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableRow,
} from '@mui/material'
import { trainingApplicationApi } from '../../api/trainingApi'
import { TrainingApplication } from '../../types/trainingApplication.types'
import ReportListWrapper, { ReportColumn } from '../common/ReportListWrapper'

const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

const todayIso = () => new Date().toISOString().substring(0, 10)
const monthsAgoIso = (months: number) => {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toISOString().substring(0, 10)
}

const TrainingReportTab: React.FC = () => {
  const { t } = useTranslation()

  const [startDate, setStartDate] = useState<string>(monthsAgoIso(3))
  const [endDate, setEndDate] = useState<string>(todayIso())

  const { data, isLoading } = useQuery({
    queryKey: ['trainingReportAll'],
    queryFn: () => trainingApplicationApi.list({ page: 0, size: 1000 }),
  })

  const reports = useMemo(() => {
    const list = data?.content || []
    const s = startDate || ''
    const e = endDate || ''
    const pickDate = (i: TrainingApplication) => formatDate(i.completionDate || i.approvedAt || i.createdAt)
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

  const reportDate = todayIso()

  const renderReport = (item: TrainingApplication, idx: number, total: number) => (
    <Paper sx={{ p: 3, bgcolor: 'grey.50', '@media print': { pageBreakAfter: 'always', breakAfter: 'page' } }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
          {t('training.report.title', '교육 이수 레포트')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('audit.report.reportDate', '보고일')}: {reportDate}
          {' · '}
          {t('common.no', 'No')}. {idx + 1} / {total}
        </Typography>
      </Box>

      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        1. {t('training.report.applicantInfo', '신청자 정보')}
      </Typography>
      <TableContainer sx={{ mb: 3 }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
          <TableBody>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('training.applicationNo', '신청번호')}</TableCell>
              <TableCell sx={{ width: '30%', fontFamily: 'monospace' }}>{item.applicationNo}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('training.applyDate', '신청일')}</TableCell>
              <TableCell sx={{ width: '30%', fontFamily: 'monospace' }}>{formatDate(item.applyDate)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('training.applicantName', '신청자')}</TableCell>
              <TableCell>{item.applicantName}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('training.applicantDept', '소속')}</TableCell>
              <TableCell>{item.applicantDept || ''}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        2. {t('training.report.courseInfo', '교육 과정 정보')}
      </Typography>
      <TableContainer sx={{ mb: 3 }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
          <TableBody>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('training.courseName', '교육명')}</TableCell>
              <TableCell colSpan={3} sx={{ fontWeight: 600 }}>{item.courseName}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('training.courseDate', '교육일')}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{formatDate(item.courseDate)}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('training.completionDate', '이수일')}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{formatDate(item.completionDate)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('training.approvedBy', '승인자')}</TableCell>
              <TableCell>{item.approvedBy || ''}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('training.completionScore', '평가')}</TableCell>
              <TableCell>{item.completionScore || ''}</TableCell>
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

  const columns: ReportColumn<TrainingApplication>[] = [
    { header: t('training.applicationNo', '신청번호'), align: 'center', width: 130, render: (r) => r.applicationNo },
    { header: t('training.courseName', '교육명'), render: (r) => r.courseName },
    { header: t('training.applicantName', '신청자'), align: 'center', width: 100, render: (r) => r.applicantName },
    { header: t('training.applicantDept', '소속'), align: 'center', width: 130, render: (r) => r.applicantDept || '' },
    { header: t('training.courseDate', '교육일'), align: 'center', width: 110, render: (r) => formatDate(r.courseDate) },
    { header: t('training.completionDate', '이수일'), align: 'center', width: 110, render: (r) => formatDate(r.completionDate) },
  ]

  return (
    <ReportListWrapper<TrainingApplication>
      items={reports}
      columns={columns}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      isLoading={isLoading}
      emptyMessage={t('training.report.noData', '이수 완료된 교육 이력이 없습니다.')}
      renderReport={renderReport}
    />
  )
}

export default TrainingReportTab
