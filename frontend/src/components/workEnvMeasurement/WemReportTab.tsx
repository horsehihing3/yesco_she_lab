import { formatDate } from '../../utils/dateDefaults'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip,
} from '@mui/material'
import axiosInstance from '../../api/axiosInstance'
import { ApiResponse, PageResponse } from '../../types/common.types'
import { WemResult, WemImprovement } from '../../types/workEnvMeasurement.types'
import useCodeMap from '../../hooks/useCodeMap'
import ReportListWrapper, { ReportColumn } from '../common/ReportListWrapper'

const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

const todayIso = () => new Date().toISOString().substring(0, 10)
const monthsAgoIso = (months: number) => {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toISOString().substring(0, 10)
}

const JUDGMENT_COLOR: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  PASS: 'success', WARNING: 'warning', FAIL: 'error',
  '적합': 'success', '경고': 'warning', '부적합': 'error',
}

const IMPROVEMENT_STATUS_COLOR: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  PLANNED: 'info', IN_PROGRESS: 'warning', COMPLETED: 'success', OVERDUE: 'error',
}

const fetchAll = async <T,>(url: string): Promise<T[]> => {
  const res = await axiosInstance.get<ApiResponse<PageResponse<T>>>(`${url}?page=0&size=1000`)
  return res.data.data.content || []
}

const WemReportTab: React.FC = () => {
  const { t } = useTranslation()
  const { getLabel: getJudgmentLabel } = useCodeMap('WEM_JUDGMENT')
  const { getLabel: getExceedLevelLabel } = useCodeMap('WEM_EXCEED_LEVEL')
  const { getLabel: getStatusLabel } = useCodeMap('WEM_IMPROVE_STATUS')

  const [startDate, setStartDate] = useState<string>(monthsAgoIso(6))
  const [endDate, setEndDate] = useState<string>(todayIso())

  const { data: results = [], isLoading: resultsLoading } = useQuery({
    queryKey: ['wemReportResults'],
    queryFn: () => fetchAll<WemResult>('/wem-results'),
  })
  const { data: improvements = [], isLoading: improveLoading } = useQuery({
    queryKey: ['wemReportImprovements'],
    queryFn: () => fetchAll<WemImprovement>('/wem-improvements'),
  })

  const filteredResults = useMemo(() => {
    const s = startDate || ''
    const e = endDate || ''
    return [...results]
      .filter((r) => {
        const d = formatDate(r.measurementDate || r.createdAt)
        if (!d) return false
        if (s && d < s) return false
        if (e && d > e) return false
        return true
      })
      .sort((a, b) => (b.measurementDate || b.createdAt || '').localeCompare(a.measurementDate || a.createdAt || ''))
  }, [results, startDate, endDate])

  // 측정 결과 1건당 동일 공정 + 동일 유해인자의 개선조치 매칭
  const improvementsByKey = useMemo(() => {
    const map = new Map<string, WemImprovement[]>()
    improvements.forEach((imp) => {
      const k = `${imp.processName || ''}__${imp.factorName || ''}`
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(imp)
    })
    return map
  }, [improvements])

  const reportDate = todayIso()
  const isLoading = resultsLoading || improveLoading

  const renderReport = (item: WemResult, idx: number, total: number, linkedImprovements: WemImprovement[]) => (
    <Paper
      key={item.id}
      sx={{
        p: 3, bgcolor: 'grey.50',
        '@media print': { pageBreakAfter: 'always', breakAfter: 'page' },
      }}
    >
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
          {t('wem.report.title', '작업환경 측정 레포트')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('audit.report.reportDate', '보고일')}: {reportDate}
          {' · '}
          {t('common.no', 'No')}. {idx + 1} / {total}
        </Typography>
      </Box>

      {/* 1. 측정 개요 */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        1. {t('wem.report.overviewTitle', '측정 개요')}
      </Typography>
      <TableContainer sx={{ mb: 3 }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', borderBottomColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
          <TableBody>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('wem.processName', '공정명')}</TableCell>
              <TableCell sx={{ width: '30%', fontWeight: 600 }}>{item.processName || ''}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('wem.factorName', '유해인자')}</TableCell>
              <TableCell sx={{ width: '30%' }}>{item.factorName || ''}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('wem.measurementDate', '측정일')}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{formatDate(item.measurementDate)}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('wem.sampleType', '시료유형')}</TableCell>
              <TableCell>{item.sampleType || ''}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('wem.measurementAgency', '측정기관')}</TableCell>
              <TableCell>{item.measurementAgency || ''}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('wem.judgment', '판정')}</TableCell>
              <TableCell>
                {item.judgment ? (
                  <Chip
                    label={getJudgmentLabel(item.judgment) || item.judgment}
                    size="small"
                    color={JUDGMENT_COLOR[item.judgment] || 'default'}
                  />
                ) : ''}
              </TableCell>
            </TableRow>
            {item.remarks && (
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('common.remarks', '비고')}</TableCell>
                <TableCell colSpan={3} sx={{ whiteSpace: 'pre-wrap' }}>{item.remarks}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 2. 측정값 / 노출기준 */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        2. {t('wem.report.measurementTitle', '측정값 / 노출기준')}
      </Typography>
      <TableContainer sx={{ mb: 3 }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', borderBottomColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
          <TableBody>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('wem.measuredValue', '측정값')}</TableCell>
              <TableCell sx={{ width: '30%', fontWeight: 600 }}>{item.measuredValue || ''}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('wem.exposureStandard', '노출기준')}</TableCell>
              <TableCell sx={{ width: '30%' }}>{item.exposureStandard || ''}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('wem.twaValue', 'TWA')}</TableCell>
              <TableCell>{item.twaValue || ''}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('wem.stelValue', 'STEL')}</TableCell>
              <TableCell>{item.stelValue || ''}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('wem.exceedRate', '초과율')}</TableCell>
              <TableCell sx={{ color: (item.exceedRate || 0) > 1 ? 'error.main' : 'inherit', fontWeight: 600 }}>
                {item.exceedRate != null ? `${item.exceedRate}` : ''}
              </TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('wem.hasReport', '보고서')}</TableCell>
              <TableCell>{item.hasReport ? 'O' : '-'}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* 3. 개선 조치 */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        3. {t('wem.report.improvementsTitle', '개선 조치')} ({linkedImprovements.length}{t('audit.report.count', '건')})
      </Typography>
      {linkedImprovements.length === 0 ? (
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 3, mb: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {t('wem.report.noImprovements', '연결된 개선 조치가 없습니다.')}
          </Typography>
        </Box>
      ) : (
        <TableContainer sx={{ mb: 3 }}>
          <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={headerCellSx}>{t('common.no', 'No')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('wem.exceedLevel', '초과 등급')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('wem.department', '부서')}</TableCell>
                <TableCell sx={headerCellSx}>{t('wem.improvementPlan', '개선 계획')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('wem.deadline', '완료 기한')}</TableCell>
                <TableCell align="center" sx={headerCellSx}>{t('common.status', '상태')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {linkedImprovements.map((imp, i) => (
                <TableRow key={imp.id}>
                  <TableCell align="center">{i + 1}</TableCell>
                  <TableCell align="center">
                    {imp.exceedLevel ? (getExceedLevelLabel(imp.exceedLevel) || imp.exceedLevel) : ''}
                  </TableCell>
                  <TableCell align="center">{imp.department || ''}</TableCell>
                  <TableCell sx={{ whiteSpace: 'pre-wrap' }}>{imp.improvementPlan || ''}</TableCell>
                  <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{formatDate(imp.deadline)}</TableCell>
                  <TableCell align="center">
                    {imp.status ? (
                      <Chip
                        label={getStatusLabel(imp.status) || imp.status}
                        size="small"
                        color={IMPROVEMENT_STATUS_COLOR[imp.status] || 'default'}
                      />
                    ) : ''}
                  </TableCell>
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

  const columns: ReportColumn<WemResult>[] = [
    { header: t('wem.measurementDate', '측정일'), align: 'center', width: 110, render: (r) => formatDate((r as any).measurementDate) },
    { header: t('wem.processName', '공정명'), key: 'processName' as keyof WemResult },
    { header: t('wem.factorName', '유해인자'), key: 'factorName' as keyof WemResult },
    { header: t('wem.measuredValue', '측정값'), align: 'center', width: 100, render: (r) => (r as any).measuredValue || '' },
    { header: t('wem.judgment', '판정'), align: 'center', width: 100, render: (r) => (r as any).judgment ? (
      <Chip
        label={getJudgmentLabel((r as any).judgment) || (r as any).judgment}
        size="small"
        color={JUDGMENT_COLOR[(r as any).judgment] || 'default'}
      />
    ) : '' },
  ]

  return (
    <Box>
    <ReportListWrapper<WemResult>
      items={filteredResults}
      columns={columns}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      isLoading={isLoading}
      emptyMessage={t('wem.report.noData', '레포트로 출력 가능한 측정 결과가 없습니다.')}
      renderReport={(r, idx, total) => {
        const key = `${r.processName || ''}__${r.factorName || ''}`
        const linked = improvementsByKey.get(key) || []
        return renderReport(r, idx, total, linked)
      }}
    />
    </Box>
  )
}

export default WemReportTab
