import { useState, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Button, Alert, CircularProgress,
  Paper, Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material'
import DatePickerField from './DatePickerField'

export interface ReportColumn<T> {
  header: string
  /** key 또는 render — 둘 중 하나 */
  key?: keyof T
  render?: (item: T, idx: number) => ReactNode
  align?: 'left' | 'center' | 'right'
  width?: number | string
}

interface ReportListWrapperProps<T> {
  items: T[]
  columns: ReportColumn<T>[]
  /** 상세 (인쇄 영역) 렌더 — items 의 한 row 클릭 시 표시 */
  renderReport: (item: T, idx: number, total: number) => ReactNode
  /** 날짜 필터 */
  startDate: string
  endDate: string
  onStartDateChange: (v: string) => void
  onEndDateChange: (v: string) => void
  isLoading?: boolean
  emptyMessage?: string
  /** row key (default: item.id) */
  getKey?: (item: T) => string | number
}

function ReportListWrapper<T extends { id?: string | number }>({
  items, columns, renderReport,
  startDate, endDate, onStartDateChange, onEndDateChange,
  isLoading, emptyMessage, getKey,
}: ReportListWrapperProps<T>) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<T | null>(null)
  const [selectedIdx, setSelectedIdx] = useState<number>(-1)

  const handleRowClick = (item: T, idx: number) => {
    setSelected(item)
    setSelectedIdx(idx)
  }

  const handleBackToList = () => {
    setSelected(null)
    setSelectedIdx(-1)
  }

  const keyOf = (item: T, idx: number): string | number =>
    getKey ? getKey(item) : (item.id !== undefined ? item.id : idx)

  // 셀 값 렌더 헬퍼
  const renderCell = (c: ReportColumn<T>, item: T, idx: number): ReactNode =>
    c.render ? c.render(item, idx) : c.key ? String((item as any)[c.key] ?? '') : ''

  // ====== DETAIL VIEW (인쇄용) ======
  if (selected) {
    return (
      <Box sx={{ pb: { xs: 4, md: 0 } }}>
        <Box className="no-print" sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, mb: 2 }}>
          <Button variant="contained" onClick={() => window.print()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
            {t('audit.report.printPdf', '브라우저 인쇄 / PDF 저장')}
          </Button>
        </Box>
        <Box id="report-printable-area" sx={{
          // 모바일(<900px)에서 헤더(TableHead) 가 없는 라벨/값 테이블만 블록으로 풀어 스택.
          // 헤더가 있는 데이터 테이블(작업자 명단 등)은 그대로 가로 스크롤 유지.
          // 인쇄 시(@media print)에는 항상 기본 table 레이아웃.
          '@media screen and (max-width: 899.95px)': {
            '& .MuiTable-root:not(:has(.MuiTableHead-root))': {
              display: 'block',
              '& .MuiTableBody-root': { display: 'block' },
              '& .MuiTableRow-root': {
                display: 'block',
                borderBottom: '1px solid',
                borderColor: 'grey.300',
              },
              '& .MuiTableRow-root:last-child': { borderBottom: 'none' },
              '& .MuiTableCell-root': {
                display: 'block',
                width: '100% !important',
                minWidth: 0,
                borderRight: 'none !important',
                borderBottom: '1px solid',
                borderColor: 'grey.200 !important',
                boxSizing: 'border-box',
                whiteSpace: 'normal',
                wordBreak: 'break-word',
              },
              '& .MuiTableRow-root:last-child .MuiTableCell-root:last-child': {
                borderBottom: 'none',
              },
            },
            // 헤더 있는 데이터 테이블은 가로 스크롤 (TableContainer 가 자동 처리)
            '& .MuiTable-root:has(.MuiTableHead-root)': {
              minWidth: 'max-content',
            },
          },
        }}>
          {renderReport(selected, selectedIdx, items.length)}
        </Box>
        <Box className="no-print" sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, mt: 2 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
            {t('common.backToList', '목록')}
          </Button>
        </Box>
      </Box>
    )
  }

  // ====== LIST VIEW ======
  return (
    <Box>
      {/* ─── 날짜 필터 (데스크탑: 한 줄, 모바일: 두 줄) ─── */}
      <Box className="no-print" sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'center' },
        gap: 1.5, mb: 2, flexWrap: 'wrap',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 56 }}>
            {t('common.startDate', '시작일')}
          </Typography>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <DatePickerField value={startDate} onChange={(v) => onStartDateChange(v || '')} maxDate={endDate || undefined} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 56 }}>
            {t('common.endDate', '종료일')}
          </Typography>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <DatePickerField value={endDate} onChange={(v) => onEndDateChange(v || '')} minDate={startDate || undefined} />
          </Box>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Alert severity="info">{emptyMessage || t('common.noData', '데이터가 없습니다')}</Alert>
      ) : (
        <>
          {/* ─── 데스크탑(md+) : 테이블 ─── */}
          <Paper variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell align="center" sx={{ fontWeight: 'bold', width: 60 }}>No</TableCell>
                    {columns.map((c, i) => (
                      <TableCell key={i} align={c.align || 'left'} sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', width: c.width }}>
                        {c.header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={keyOf(item, idx)} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item, idx)}>
                      <TableCell align="center" sx={{ color: 'text.secondary' }}>{idx + 1}</TableCell>
                      {columns.map((c, i) => (
                        <TableCell key={i} align={c.align || 'left'}>{renderCell(c, item, idx)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* ─── 모바일(xs/sm) : 카드 ─── */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1 }}>
            {items.map((item, idx) => (
              <Paper key={keyOf(item, idx)} variant="outlined" onClick={() => handleRowClick(item, idx)}
                sx={{ p: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                {/* 카드 헤더: No + 첫 컬럼(보통 가장 중요한 식별자) */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                  <Box sx={{
                    width: 28, height: 28, borderRadius: '50%',
                    bgcolor: 'action.selected', color: 'text.primary',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                  }}>
                    {idx + 1}
                  </Box>
                  {columns[0] && (
                    <Box sx={{ flex: 1, minWidth: 0, fontSize: '0.9rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {renderCell(columns[0], item, idx)}
                    </Box>
                  )}
                </Box>
                {/* 나머지 컬럼: 라벨 / 값 그리드 */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(72px, auto) 1fr', columnGap: 1.5, rowGap: 0.5 }}>
                  {columns.slice(1).map((c, i) => (
                    <Box key={i} sx={{ display: 'contents' }}>
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', alignSelf: 'flex-start' }}>{c.header}</Typography>
                      <Box sx={{ fontSize: '0.8rem', wordBreak: 'break-word' }}>{renderCell(c, item, idx)}</Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            ))}
          </Box>
        </>
      )}
    </Box>
  )
}

export default ReportListWrapper
