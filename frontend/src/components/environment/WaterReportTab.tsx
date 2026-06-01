import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
} from '@mui/material'
import { waterQualityApi, waterStandardApi } from '../../api/environmentApi'
import { useThemeMode } from '../../context/ThemeContext'
import { WaterStandard } from '../../types/environment.types'
import ReportListWrapper, { ReportColumn } from '../common/ReportListWrapper'

const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

const todayIso = () => new Date().toISOString().substring(0, 10)
const monthsAgoIso = (months: number) => {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toISOString().substring(0, 10)
}

const ITEM_PAIRS = [
  { key: 'ph', name: 'pH' },
  { key: 'bod', name: 'BOD' },
  { key: 'cod', name: 'COD' },
  { key: 'ss', name: 'SS' },
  { key: 'tN', name: 'T-N' },
  { key: 'tP', name: 'T-P' },
]

const getStandard = (itemName: string, stdList: WaterStandard[]) =>
  stdList.find((s) => s.itemName.toUpperCase() === itemName.toUpperCase())

const isExceeded = (record: any, stdList: WaterStandard[]): boolean => {
  return ITEM_PAIRS.some(({ key, name }) => {
    const v = record[key]
    if (v == null) return false
    const std = getStandard(name, stdList)
    return std ? (v < std.minValue || v > std.maxValue) : false
  })
}

const getExceededItems = (record: any, stdList: WaterStandard[]) => {
  const items: { name: string; value: number; min: number; max: number }[] = []
  ITEM_PAIRS.forEach(({ key, name }) => {
    const v = record[key]
    if (v != null) {
      const std = getStandard(name, stdList)
      if (std && (v < std.minValue || v > std.maxValue)) {
        items.push({ name, value: v, min: std.minValue, max: std.maxValue })
      }
    }
  })
  return items
}

const WaterReportTab: React.FC = () => {
  const { t } = useTranslation()
  const { isDarkMode } = useThemeMode()

  const paperBg = isDarkMode ? '#18181b' : 'background.paper'

  const [startDate, setStartDate] = useState<string>(monthsAgoIso(6))
  const [endDate, setEndDate] = useState<string>(todayIso())

  const { data: measurementData, isLoading } = useQuery({
    queryKey: ['waterReportMeasurements'],
    queryFn: () => waterQualityApi.findAll(0, 1000),
  })

  const { data: standards } = useQuery({
    queryKey: ['waterReportStandards'],
    queryFn: () => waterStandardApi.findAllList(),
  })

  const stdList = standards || []

  const filtered = useMemo(() => {
    const list = measurementData?.content || []
    const s = startDate || ''
    const e = endDate || ''
    return list
      .filter((r: any) => {
        const d = (r.measurementDate || '').substring(0, 10)
        if (!d) return false
        if (s && d < s) return false
        if (e && d > e) return false
        return true
      })
      .sort((a: any, b: any) => (b.measurementDate || '').localeCompare(a.measurementDate || ''))
  }, [measurementData, startDate, endDate])

  const reportDate = todayIso()

  const renderReport = (item: any, idx: number, total: number) => {
    const exceeded = getExceededItems(item, stdList)
    const hasExceedance = exceeded.length > 0

    return (
      <Paper sx={{ p: 3, bgcolor: paperBg, '@media print': { pageBreakAfter: 'always', breakAfter: 'page' } }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
            {t('water.report.title', '수질 측정 레포트')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('water.report.reportDate', '보고일')}: {reportDate}
            {' · '}
            {t('common.no', 'No')}. {idx + 1} / {total}
          </Typography>
        </Box>

        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
          1. {t('water.report.measurementInfo', '측정 정보')}
        </Typography>
        <TableContainer sx={{ mb: 3 }}>
          <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('water.report.date', '측정일')}</TableCell>
                <TableCell sx={{ width: '30%', fontFamily: 'monospace' }}>{(item.measurementDate || '').substring(0, 10)}</TableCell>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('water.report.workplacePoint', '측정 지점')}</TableCell>
                <TableCell sx={{ width: '30%' }}>{item.measurementPoint || ''}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
          2. {t('water.report.measurementValues', '측정값')}
        </Typography>
        <TableContainer sx={{ mb: 3 }}>
          <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('water.report.itemName', '항목')}</TableCell>
                <TableCell align="center" sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('water.report.measuredValue', '측정값')}</TableCell>
                <TableCell align="center" sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('water.report.standardValue', '기준값')}</TableCell>
                <TableCell align="center" sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('water.report.status', '상태')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ITEM_PAIRS.map(({ key, name }) => {
                const v = item[key]
                const std = getStandard(name, stdList)
                const exc = v != null && std && (v < std.minValue || v > std.maxValue)
                return (
                  <TableRow key={key}>
                    <TableCell align="center">{name}</TableCell>
                    <TableCell align="center" sx={{ color: exc ? 'error.main' : 'inherit', fontWeight: exc ? 'bold' : 'normal' }}>
                      {v != null ? v : ''}
                    </TableCell>
                    <TableCell align="center">{std ? `${std.minValue} ~ ${std.maxValue}` : ''}</TableCell>
                    <TableCell align="center">
                      {v == null
                        ? ''
                        : exc
                          ? <Chip size="small" color="error" label={t('water.exceeded', '초과')} />
                          : <Chip size="small" color="success" label={t('water.normal', '정상')} />}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'grey.300', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {hasExceedance
              ? t('water.report.exceedanceNote', `※ ${exceeded.length}개 항목에서 기준 초과`)
              : t('water.report.allNormal', '모든 측정값이 기준 이내입니다.')}
          </Typography>
        </Box>
      </Paper>
    )
  }

  const columns: ReportColumn<any>[] = [
    { header: t('water.report.date', '측정일'), align: 'center', width: 110, render: (r) => (r.measurementDate || '').substring(0, 10) },
    { header: t('water.report.workplacePoint', '측정 지점'), render: (r) => r.measurementPoint || '' },
    { header: 'pH', align: 'center', width: 70, render: (r) => r.ph != null ? r.ph : '' },
    { header: 'BOD', align: 'center', width: 70, render: (r) => r.bod != null ? r.bod : '' },
    { header: 'COD', align: 'center', width: 70, render: (r) => r.cod != null ? r.cod : '' },
    { header: 'SS', align: 'center', width: 70, render: (r) => r.ss != null ? r.ss : '' },
    { header: t('water.report.status', '상태'), align: 'center', width: 90, render: (r) => isExceeded(r, stdList)
      ? <Chip size="small" color="error" label={t('water.exceeded', '초과')} />
      : <Chip size="small" color="success" label={t('water.normal', '정상')} /> },
  ]

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }} className="no-print">레포트</Typography>
    <ReportListWrapper<any>
      items={filtered}
      columns={columns}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      isLoading={isLoading}
      emptyMessage={t('water.report.noData', '레포트로 출력 가능한 측정 결과가 없습니다.')}
      renderReport={renderReport}
    />
    </Box>
  )
}

export default WaterReportTab
