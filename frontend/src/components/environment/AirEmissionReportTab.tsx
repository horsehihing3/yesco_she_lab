import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableRow, Chip,
} from '@mui/material'
import { airEmissionApi, airEmissionStandardApi } from '../../api/environmentApi'
import { useCodeMap } from '../../hooks/useCodeMap'
import { useThemeMode } from '../../context/ThemeContext'
import { AirEmission, AirEmissionStandard } from '../../types/environment.types'
import ReportListWrapper, { ReportColumn } from '../common/ReportListWrapper'

const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

const todayIso = () => new Date().toISOString().substring(0, 10)
const monthsAgoIso = (months: number) => {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toISOString().substring(0, 10)
}

const AirEmissionReportTab: React.FC = () => {
  const { t } = useTranslation()
  const { isDarkMode } = useThemeMode()
  const { getLabel: getPollutantLabel } = useCodeMap('POLLUTANT')
  const { getLabel: getEmissionUnitLabel } = useCodeMap('EMISSION_UNIT')

  const paperBg = isDarkMode ? '#18181b' : 'background.paper'

  const [startDate, setStartDate] = useState<string>(monthsAgoIso(6))
  const [endDate, setEndDate] = useState<string>(todayIso())

  const { data: allData, isLoading } = useQuery({
    queryKey: ['airEmissionReportAll'],
    queryFn: () => airEmissionApi.findAllList(),
  })

  const { data: standards } = useQuery({
    queryKey: ['airEmissionReportStandards'],
    queryFn: () => airEmissionStandardApi.findAllList(),
  })

  const records: AirEmission[] = allData || []
  const stdList: AirEmissionStandard[] = standards || []

  const filtered = useMemo(() => {
    const s = startDate || ''
    const e = endDate || ''
    return records
      .filter((r) => {
        const d = (r.measurementDate || '').substring(0, 10)
        if (!d) return false
        if (s && d < s) return false
        if (e && d > e) return false
        return true
      })
      .sort((a, b) => (b.measurementDate || '').localeCompare(a.measurementDate || ''))
  }, [records, startDate, endDate])

  const reportDate = todayIso()

  const renderReport = (item: AirEmission, idx: number, total: number) => {
    const std = stdList.find((s) => s.itemName.toUpperCase() === (item.pollutant || '').toUpperCase())
    const pollutantName = getPollutantLabel(item.pollutant || '') || item.pollutant || ''
    const unitLabel = getEmissionUnitLabel(item.unit || '') || item.unit || ''
    const standardRange = std ? `${std.minValue} ~ ${std.maxValue}` : (item.emissionStandard != null ? `≤ ${item.emissionStandard}` : '')
    const isNonCompliant = item.compliance === 'NON_COMPLIANT'

    return (
      <Paper sx={{ p: 3, bgcolor: paperBg, '@media print': { pageBreakAfter: 'always', breakAfter: 'page' } }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
            {t('airEmission.report.title', '대기 배출 측정 레포트')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('airEmission.report.reportDate', '보고일')}: {reportDate}
            {' · '}
            {t('common.no', 'No')}. {idx + 1} / {total}
          </Typography>
        </Box>

        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
          1. {t('airEmission.report.measurementInfo', '측정 정보')}
        </Typography>
        <TableContainer sx={{ mb: 3 }}>
          <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('airEmission.report.date', '측정일')}</TableCell>
                <TableCell sx={{ width: '30%', fontFamily: 'monospace' }}>{(item.measurementDate || '').substring(0, 10)}</TableCell>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('airEmission.report.facility', '시설')}</TableCell>
                <TableCell sx={{ width: '30%' }}>{item.facility || ''}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('airEmission.report.pollutant', '오염물질')}</TableCell>
                <TableCell>{pollutantName}</TableCell>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('airEmission.unit', '단위')}</TableCell>
                <TableCell>{unitLabel}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('airEmission.report.measuredValue', '측정값')}</TableCell>
                <TableCell sx={{ color: isNonCompliant ? 'error.main' : 'inherit', fontWeight: 600 }}>
                  {item.emissionConcentration != null ? `${item.emissionConcentration} ${unitLabel}` : ''}
                </TableCell>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('airEmission.report.standardValue', '기준값')}</TableCell>
                <TableCell>{standardRange} {unitLabel}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('airEmission.compliance', '준수 여부')}</TableCell>
                <TableCell colSpan={3}>
                  <Chip
                    size="small"
                    label={isNonCompliant ? t('airEmission.nonCompliant', '부적합') : t('airEmission.compliant', '적합')}
                    color={isNonCompliant ? 'error' : 'success'}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'grey.300', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {t('airEmission.report.reportFooter', '본 보고서는 EHS 시스템에서 자동 생성되었습니다.')}
          </Typography>
        </Box>
      </Paper>
    )
  }

  const columns: ReportColumn<AirEmission>[] = [
    { header: t('airEmission.report.date', '측정일'), align: 'center', width: 110, render: (r) => (r.measurementDate || '').substring(0, 10) },
    { header: t('airEmission.report.facility', '시설'), key: 'facility' as keyof AirEmission },
    { header: t('airEmission.report.pollutant', '오염물질'), align: 'center', width: 120, render: (r) => getPollutantLabel(r.pollutant || '') || r.pollutant || '' },
    { header: t('airEmission.report.measuredValue', '측정값'), align: 'center', width: 120, render: (r) => r.emissionConcentration != null ? `${r.emissionConcentration} ${getEmissionUnitLabel(r.unit || '') || r.unit || ''}` : '' },
    { header: t('airEmission.compliance', '준수'), align: 'center', width: 90, render: (r) => (
      <Chip
        size="small"
        label={r.compliance === 'NON_COMPLIANT' ? t('airEmission.nonCompliant', '부적합') : t('airEmission.compliant', '적합')}
        color={r.compliance === 'NON_COMPLIANT' ? 'error' : 'success'}
      />
    ) },
  ]

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }} className="no-print">레포트</Typography>
    <ReportListWrapper<AirEmission>
      items={filtered}
      columns={columns}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      isLoading={isLoading}
      emptyMessage={t('airEmission.report.noData', '레포트로 출력 가능한 측정 결과가 없습니다.')}
      renderReport={renderReport}
    />
    </Box>
  )
}

export default AirEmissionReportTab
