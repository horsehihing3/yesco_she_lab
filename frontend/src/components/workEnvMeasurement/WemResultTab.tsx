import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, TextField, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Typography, Pagination,
  IconButton, CircularProgress, Alert, Chip, Select, MenuItem,
  FormControl, Grid, Switch, FormControlLabel,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import axiosInstance from '../../api/axiosInstance'
import { WemResult, WemResultRequest } from '../../types/workEnvMeasurement.types'
import { ApiResponse, PageResponse } from '../../types/common.types'
import NumberField from '../common/NumberField'
import DatePickerField from '../common/DatePickerField'
import LoadingOverlay from '../common/LoadingOverlay'
import useCodeMap from '../../hooks/useCodeMap'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

// ===== API functions =====
const fetchResults = async (page: number, size: number): Promise<PageResponse<WemResult>> => {
  const res = await axiosInstance.get<ApiResponse<PageResponse<WemResult>>>(`/wem-results?page=${page}&size=${size}`)
  return res.data.data
}

const searchResults = async (keyword: string, page: number, size: number): Promise<PageResponse<WemResult>> => {
  const res = await axiosInstance.get<ApiResponse<PageResponse<WemResult>>>(`/wem-results/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`)
  return res.data.data
}

const fetchResultDetail = async (id: number): Promise<WemResult> => {
  const res = await axiosInstance.get<ApiResponse<WemResult>>(`/wem-results/${id}`)
  return res.data.data
}

const createResult = async (data: WemResultRequest): Promise<WemResult> => {
  const res = await axiosInstance.post<ApiResponse<WemResult>>('/wem-results', data)
  return res.data.data
}

const updateResult = async ({ id, data }: { id: number; data: WemResultRequest }): Promise<WemResult> => {
  const res = await axiosInstance.put<ApiResponse<WemResult>>(`/wem-results/${id}`, data)
  return res.data.data
}

const deleteResult = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/wem-results/${id}`)
}

// ===== Constants =====
const JUDGMENT_COLORS: Record<string, 'success' | 'warning' | 'error'> = {
  NORMAL: 'success',
  EXCEED_1X: 'warning',
  EXCEED_2X: 'error',
}

const MEASURED_VALUE_COLORS: Record<string, string> = {
  NORMAL: 'green',
  EXCEED_1X: 'orange',
  EXCEED_2X: 'red',
}

const labelSx = {
  width: 120, minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center',
}
const valSx = { flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'grey.300' }
const hSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'grey.300' }
const lastRowSx = { display: 'flex', borderColor: 'grey.300' }

const WemResultTab: React.FC = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const h = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${d} ${h}:${min}`
  }
  const { showWarning, showSuccess, showConfirm } = useAlert()
  const { codeList: sampleTypeCodes, getLabel: getSampleTypeLabel } = useCodeMap('WEM_SAMPLE_TYPE')
  const { codeList: judgmentCodes, getLabel: getJudgmentLabel } = useCodeMap('WEM_JUDGMENT')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<WemResult | null>(null)
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [judgmentFilter, setJudgmentFilter] = useState('')
  const [page, setPage] = useState(0)
  const rowsPerPage = 10

  const emptyForm: WemResultRequest = {
    processName: '',
    factorName: '',
  }
  const [formData, setFormData] = useState<WemResultRequest>(emptyForm)

  // ===== Queries =====
  const { data, isLoading } = useQuery({
    queryKey: ['wemResults', page, searchQuery],
    queryFn: () =>
      searchQuery
        ? searchResults(searchQuery, page, rowsPerPage)
        : fetchResults(page, rowsPerPage),
    enabled: viewMode === 'list',
  })

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['wemResultDetail', selectedItem?.id],
    queryFn: () => fetchResultDetail(selectedItem!.id),
    enabled: !!selectedItem?.id && (viewMode === 'detail' || viewMode === 'edit'),
  })

  // ===== Mutations =====
  const createMutation = useMutation({
    mutationFn: createResult,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['wemResults'] })
      await showSuccess(t('common.saved', '저장되었습니다'))
      handleBackToList()
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateResult,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['wemResults'] })
      queryClient.invalidateQueries({ queryKey: ['wemResultDetail'] })
      await showSuccess(t('common.saved', '저장되었습니다'))
      handleBackToList()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteResult,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['wemResults'] })
      await showSuccess(t('common.deleted', '삭제되었습니다'))
      handleBackToList()
    },
  })

  const isProcessing = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  // ===== Handlers =====
  const handleBackToList = () => {
    setViewMode('list')
    setSelectedItem(null)
    setFormData({ ...emptyForm })
  }

  const handleReset = () => {
    setSearchText('')
    setSearchQuery('')
    setJudgmentFilter('')
    setPage(0)
  }

  const handleSearch = () => {
    setSearchQuery(searchText)
    setPage(0)
  }

  const handleRowClick = (item: WemResult) => {
    setSelectedItem(item)
    setViewMode('detail')
  }

  const handleAddClick = () => {
    setSelectedItem(null)
    setFormData({ ...emptyForm })
    setViewMode('create')
  }

  const handleEditClick = () => {
    if (!detail) return
    setFormData({
      processName: detail.processName,
      factorName: detail.factorName,
      sampleType: detail.sampleType || '',
      measuredValue: detail.measuredValue || '',
      twaValue: detail.twaValue || '',
      stelValue: detail.stelValue || '',
      exposureStandard: detail.exposureStandard || '',
      exceedRate: detail.exceedRate ?? undefined,
      judgment: detail.judgment || '',
      hasReport: detail.hasReport,
      measurementDate: detail.measurementDate || '',
      measurementAgency: detail.measurementAgency || '',
      remarks: detail.remarks || '',
    })
    setViewMode('edit')
  }

  const handleDeleteClick = async () => {
    if (!selectedItem) return
    const confirmed = await showConfirm(
      `${t('common.confirmDeleteMessage', '삭제하시겠습니까?')}\n${t('common.deleteWarning', '이 작업은 되돌릴 수 없습니다.')}`,
      { title: t('common.delete', '삭제') }
    )
    if (confirmed) {
      deleteMutation.mutate(selectedItem.id)
    }
  }

  const handleSubmit = async () => {
    if (!formData.processName || !formData.factorName) {
      showWarning(t('wem.processName') + ', ' + t('wem.factorName') + ' ' + t('common.required', '필수입니다'))
      return
    }
    const confirmed = await showConfirm(t('common.confirmSave', '저장하시겠습니까?'))
    if (!confirmed) return

    if (viewMode === 'create') {
      createMutation.mutate(formData)
    } else if (viewMode === 'edit' && selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, data: formData })
    }
  }

  const items = data?.content || []
  const filteredItems = judgmentFilter ? items.filter(i => i.judgment === judgmentFilter) : items
  const totalPages = data?.totalPages || 0

  // KPI cards
  const totalCount = data?.totalElements ?? items.length
  const normalCount = items.filter(i => i.judgment === 'NORMAL').length
  const exceedCount = items.filter(i => i.judgment === 'EXCEED_1X' || i.judgment === 'EXCEED_2X').length
  const pendingCount = items.filter(i => !i.judgment).length

  const getMeasuredValueColor = (judgment: string | null) => {
    if (!judgment) return 'text.primary'
    return MEASURED_VALUE_COLORS[judgment] || 'text.primary'
  }

  const getExceedRateColor = (rate: number | null) => {
    if (rate === null) return 'text.secondary'
    if (rate > 200) return 'error.main'
    if (rate > 100) return 'warning.main'
    return 'success.main'
  }

  // ===== RENDER: List =====
  if (viewMode === 'list') {
    return (
      <Box>
        {/* KPI Cards */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {[
            { label: t('wem.monthlyMeasurements', '이번달 측정건수'), value: totalCount, color: '#3b82f6' },
            { label: t('wem.judgmentNormal'), value: normalCount, color: '#22c55e' },
            { label: t('wem.exceedCount', '기준초과'), value: exceedCount, color: '#ef4444' },
            { label: t('wem.pendingInput', '입력대기'), value: pendingCount, color: '#f59e0b' },
          ].map((card, idx) => (
            <Grid item xs={6} md={3} key={idx}>
              <Paper sx={{ p: 2, borderLeft: 4, borderColor: card.color }}>
                <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                <Typography variant="h5" fontWeight="bold">{card.value}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Toolbar - PC */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mb: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              value={judgmentFilter}
              onChange={(e) => setJudgmentFilter(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">{t('common.all')}</MenuItem>
              {judgmentCodes.map(c => (
                <MenuItem key={c.code} value={c.code}>{getJudgmentLabel(c.code)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            placeholder={t('common.search')}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ minWidth: 200 }}
          />
          <IconButton onClick={handleSearch} size="small"><SearchIcon /></IconButton>
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick} size="small">
            {t('common.new')}
          </Button>
        </Box>
        {/* Toolbar - Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={judgmentFilter}
                onChange={(e) => setJudgmentFilter(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                {judgmentCodes.map(c => (
                  <MenuItem key={c.code} value={c.code}>{getJudgmentLabel(c.code)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder={t('common.search')}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              sx={{ flex: 1 }}
            />
            <IconButton onClick={handleSearch} size="small"><SearchIcon /></IconButton>
            <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
          </Box>
          <Button variant="contained" fullWidth startIcon={<AddIcon />} onClick={handleAddClick} size="small">
            {t('common.new')}
          </Button>
        </Box>

        {/* Table */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : filteredItems.length === 0 ? (
          <Alert severity="info">{t('common.noData')}</Alert>
        ) : (
          <>
            <TableContainer sx={{ border: 1, borderColor: 'grey.300', borderRadius: 1, overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={hSx} align="center">{t('common.no')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('wem.grade', '등급')}</TableCell>
                    <TableCell sx={hSx}>{t('wem.processName')}</TableCell>
                    <TableCell sx={hSx}>{t('wem.factorName')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('wem.sampleType')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('wem.measuredValue')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('wem.exposureStandard')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('wem.exposureIndex', '노출지수')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('wem.judgment')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('wem.hasReport')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.map((item, idx) => {
                    const rate = item.exceedRate ?? 0
                    const grade = rate <= 10 ? 'Ⅰ' : rate <= 50 ? 'Ⅱ' : rate <= 100 ? 'Ⅲ' : 'Ⅳ'
                    const gradeColor: 'success' | 'warning' | 'error' = grade === 'Ⅰ' ? 'success' : grade === 'Ⅱ' ? 'warning' : grade === 'Ⅲ' ? 'warning' : 'error'
                    const eIndex = (rate / 100).toFixed(2)
                    return (
                    <TableRow
                      key={item.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleRowClick(item)}
                    >
                      <TableCell align="center">{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell align="center">
                        <Chip label={grade} color={gradeColor} size="small" sx={{ fontWeight: 700, minWidth: 32 }} />
                      </TableCell>
                      <TableCell>{item.processName}</TableCell>
                      <TableCell>{item.factorName}</TableCell>
                      <TableCell align="center">
                        {item.sampleType ? (
                          <Chip
                            label={getSampleTypeLabel(item.sampleType) || item.sampleType}
                            color={item.sampleType === 'PERSONAL' ? 'info' : 'default'}
                            size="small"
                          />
                        ) : ''}
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{ color: getMeasuredValueColor(item.judgment) }}
                        >
                          {item.measuredValue || ''}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{item.exposureStandard || ''}</TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color={getExceedRateColor(item.exceedRate)}
                        >
                          {eIndex}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {item.judgment ? (
                          <Chip
                            label={getJudgmentLabel(item.judgment) || item.judgment}
                            color={JUDGMENT_COLORS[item.judgment] || 'default'}
                            size="small"
                          />
                        ) : ''}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={item.hasReport ? t('wem.reportAttached') : t('wem.reportNone')}
                          color={item.hasReport ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </TableContainer>
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page + 1}
                  onChange={(_, p) => setPage(p - 1)}
                />
              </Box>
            )}
          </>
        )}
      </Box>
    )
  }

  // ===== RENDER: Detail =====
  if (viewMode === 'detail') {
    if (detailLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
    const d = detail
    if (!d) return <Alert severity="error">{t('common.noData')}</Alert>

    return (
      <Box>
        {/* PC */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('wem.processName')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.processName}</Typography></Box>
            <Box sx={labelSx}>{t('wem.factorName')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.factorName}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('wem.sampleType')}</Box>
            <Box sx={valBorderSx}>
              {d.sampleType ? (
                <Chip label={getSampleTypeLabel(d.sampleType) || d.sampleType} color={d.sampleType === 'PERSONAL' ? 'info' : 'default'} size="small" />
              ) : null}
            </Box>
            <Box sx={labelSx}>{t('wem.measuredValue')}</Box>
            <Box sx={valSx}>
              <Typography variant="body2" fontWeight="bold" sx={{ color: getMeasuredValueColor(d.judgment) }}>
                {d.measuredValue || ''}
              </Typography>
            </Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('wem.twa')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.twaValue || ''}</Typography></Box>
            <Box sx={labelSx}>{t('wem.stel')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.stelValue || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('wem.exposureStandard')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.exposureStandard || ''}</Typography></Box>
            <Box sx={labelSx}>{t('wem.exceedRate')}</Box>
            <Box sx={valSx}>
              <Typography variant="body2" fontWeight="bold" color={getExceedRateColor(d.exceedRate)}>
                {d.exceedRate !== null ? `${d.exceedRate}%` : ''}
              </Typography>
            </Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('wem.judgment')}</Box>
            <Box sx={valBorderSx}>
              {d.judgment ? (
                <Chip label={getJudgmentLabel(d.judgment) || d.judgment} color={JUDGMENT_COLORS[d.judgment] || 'default'} size="small" />
              ) : null}
            </Box>
            <Box sx={labelSx}>{t('wem.hasReport')}</Box>
            <Box sx={valSx}>
              <Chip
                label={d.hasReport ? t('wem.reportAttached') : t('wem.reportNone')}
                color={d.hasReport ? 'success' : 'default'}
                size="small"
              />
            </Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('wem.agency')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.measurementAgency || ''}</Typography></Box>
            <Box sx={labelSx}>{t('common.date', '날짜')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.measurementDate || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('common.remarks', '비고')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.remarks || ''}</Typography></Box>
          </Box>
          <Box sx={lastRowSx}>
            <Box sx={labelSx}>{t('common.registered')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{formatDate(d.createdAt)}</Typography></Box>
            <Box sx={labelSx}>{t('common.modified')}</Box>
            <Box sx={valSx}><Typography variant="body2">{formatDate(d.modifiedAt)}</Typography></Box>
          </Box>
        </Box>
        {/* Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
          {[
            [t('wem.processName'), d.processName],
            [t('wem.factorName'), d.factorName],
            [t('wem.sampleType'), d.sampleType ? (getSampleTypeLabel(d.sampleType) || d.sampleType) : ''],
            [t('wem.measuredValue'), d.measuredValue],
            [t('wem.twa'), d.twaValue],
            [t('wem.stel'), d.stelValue],
            [t('wem.exposureStandard'), d.exposureStandard],
            [t('wem.exceedRate'), d.exceedRate !== null ? `${d.exceedRate}%` : ''],
            [t('wem.judgment'), d.judgment ? (getJudgmentLabel(d.judgment) || d.judgment) : ''],
            [t('wem.hasReport'), d.hasReport ? t('wem.reportAttached') : t('wem.reportNone')],
            [t('wem.agency'), d.measurementAgency],
            [t('common.date', '날짜'), d.measurementDate],
            [t('common.remarks', '비고'), d.remarks],
            [t('common.registered'), formatDate(d.createdAt)],
            [t('common.modified'), formatDate(d.modifiedAt)],
          ].filter(([, v]) => v).map(([label, value], i) => (
            <Box key={i}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography>
              <Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>{value}</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: 1, sm: 'none' } }}>{t('common.backToList')}</Button>
          <Button variant="contained" onClick={handleEditClick} sx={{ flex: { xs: 1, sm: 'none' } }}>{t('common.edit')}</Button>
          <Button variant="contained" color="error" onClick={handleDeleteClick} sx={{ flex: { xs: 1, sm: 'none' } }}>{t('common.delete')}</Button>
        </Box>
      </Box>
    )
  }

  // ===== RENDER: Create / Edit =====
  const formFields = [
    { label: t('wem.processName'), node: <TextField size="small" fullWidth value={formData.processName} onChange={(e) => setFormData({ ...formData, processName: e.target.value })} /> },
    { label: t('wem.factorName'), node: <TextField size="small" fullWidth value={formData.factorName} onChange={(e) => setFormData({ ...formData, factorName: e.target.value })} /> },
    { label: t('wem.sampleType'), node: (
      <Select size="small" fullWidth value={formData.sampleType || ''} onChange={(e) => setFormData({ ...formData, sampleType: e.target.value })}>
        <MenuItem value=""></MenuItem>
        {sampleTypeCodes.map(c => <MenuItem key={c.code} value={c.code}>{getSampleTypeLabel(c.code)}</MenuItem>)}
      </Select>
    ) },
    { label: t('wem.measuredValue'), node: <TextField size="small" fullWidth value={formData.measuredValue || ''} onChange={(e) => setFormData({ ...formData, measuredValue: e.target.value })} /> },
    { label: t('wem.twa'), node: <TextField size="small" fullWidth value={formData.twaValue || ''} onChange={(e) => setFormData({ ...formData, twaValue: e.target.value })} /> },
    { label: t('wem.stel'), node: <TextField size="small" fullWidth value={formData.stelValue || ''} onChange={(e) => setFormData({ ...formData, stelValue: e.target.value })} /> },
    { label: t('wem.exposureStandard'), node: <TextField size="small" fullWidth value={formData.exposureStandard || ''} onChange={(e) => setFormData({ ...formData, exposureStandard: e.target.value })} /> },
    { label: t('wem.exceedRate'), node: <NumberField size="small" fullWidth value={formData.exceedRate} onChange={(v) => setFormData({ ...formData, exceedRate: v ?? undefined })} /> },
    { label: t('wem.judgment'), node: (
      <Select size="small" fullWidth value={formData.judgment || ''} onChange={(e) => setFormData({ ...formData, judgment: e.target.value })}>
        <MenuItem value=""></MenuItem>
        {judgmentCodes.map(c => <MenuItem key={c.code} value={c.code}>{getJudgmentLabel(c.code)}</MenuItem>)}
      </Select>
    ) },
    { label: t('wem.hasReport'), node: (
      <FormControlLabel
        control={
          <Switch
            checked={formData.hasReport || false}
            onChange={(e) => setFormData({ ...formData, hasReport: e.target.checked })}
          />
        }
        label={formData.hasReport ? t('wem.reportAttached') : t('wem.reportNone')}
      />
    ) },
    { label: t('wem.agency'), node: <TextField size="small" fullWidth value={formData.measurementAgency || ''} onChange={(e) => setFormData({ ...formData, measurementAgency: e.target.value })} /> },
    { label: t('common.date', '날짜'), node: <DatePickerField value={formData.measurementDate || ''} onChange={(v) => setFormData({ ...formData, measurementDate: v })} /> },
    { label: t('common.remarks', '비고'), node: <TextField size="small" fullWidth multiline rows={2} value={formData.remarks || ''} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} /> },
  ]
  return (
    <Box>
      <LoadingOverlay open={isProcessing} />
      {/* PC */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{formFields[0].label}</Box>
          <Box sx={valBorderSx}>{formFields[0].node}</Box>
          <Box sx={labelSx}>{formFields[1].label}</Box>
          <Box sx={valSx}>{formFields[1].node}</Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{formFields[2].label}</Box>
          <Box sx={valBorderSx}>{formFields[2].node}</Box>
          <Box sx={labelSx}>{formFields[3].label}</Box>
          <Box sx={valSx}>{formFields[3].node}</Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{formFields[4].label}</Box>
          <Box sx={valBorderSx}>{formFields[4].node}</Box>
          <Box sx={labelSx}>{formFields[5].label}</Box>
          <Box sx={valSx}>{formFields[5].node}</Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{formFields[6].label}</Box>
          <Box sx={valBorderSx}>{formFields[6].node}</Box>
          <Box sx={labelSx}>{formFields[7].label}</Box>
          <Box sx={valSx}>{formFields[7].node}</Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{formFields[8].label}</Box>
          <Box sx={valBorderSx}>{formFields[8].node}</Box>
          <Box sx={labelSx}>{formFields[9].label}</Box>
          <Box sx={valSx}>{formFields[9].node}</Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{formFields[10].label}</Box>
          <Box sx={valBorderSx}>{formFields[10].node}</Box>
          <Box sx={labelSx}>{formFields[11].label}</Box>
          <Box sx={valSx}>{formFields[11].node}</Box>
        </Box>
        <Box sx={lastRowSx}>
          <Box sx={labelSx}>{formFields[12].label}</Box>
          <Box sx={valSx}>{formFields[12].node}</Box>
        </Box>
      </Box>
      {/* Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
        {formFields.map((f, i) => (
          <Box key={i}>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{f.label}</Typography>
            {f.node}
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, gap: 1, mt: 2 }}>
        <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: 1, sm: 'none' } }}>
          {viewMode === 'edit' ? t('common.cancel') : t('common.backToList')}
        </Button>
        <Button variant="contained" onClick={handleSubmit} sx={{ flex: { xs: 1, sm: 'none' } }}>
          {viewMode === 'edit' ? t('common.save') : t('common.register')}
        </Button>
      </Box>
    </Box>
  )
}

export default WemResultTab
