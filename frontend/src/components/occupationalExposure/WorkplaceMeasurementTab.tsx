import { formatDate } from '../../utils/dateDefaults'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  MenuItem,
  Pagination,
  FormControl,
  Select,
  SelectChangeEvent,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import { useForm, Controller } from 'react-hook-form'
import DatePickerField from '../common/DatePickerField'
import NumberField from '../common/NumberField'
import { useAlert } from '../../contexts/AlertContext'
import axiosInstance from '../../api/axiosInstance'
import { ApiResponse, PageResponse } from '../../types/common.types'
import {
  WorkplaceMeasurement,
  WorkplaceMeasurementDetail,
  WorkplaceMeasurementRequest,
  WorkplaceMeasurementDetailRequest,
  MeasurementStatus,
  MeasurementHalf,
  FactorType,
  MeasurementResultStatus,
  OverallMeasurementResult,
} from '../../types/occupationalExposure.types'
import useCodeMap from '../../hooks/useCodeMap'
import LoadingOverlay from '../common/LoadingOverlay'
import DevTestFillButton from '../common/DevTestFillButton'

// ===== Common Table Styles =====
const labelCellSx = {
  width: 128,
  minWidth: 128,
  fontWeight: 'bold',
  bgcolor: 'grey.100',
  px: 2,
  py: 1.5,
  borderRight: 1,
  borderColor: 'divider',
  display: 'flex',
  alignItems: 'center',
  fontSize: '0.875rem',
  justifyContent: 'center',
  wordBreak: 'keep-all',
  textAlign: 'center',
}

const valueCellSx = {
  flex: 1,
  px: 2,
  py: 1.5,
  bgcolor: 'background.paper',
  fontSize: '0.875rem',
}

const valueCellBorderSx = {
  ...valueCellSx,
  borderRight: 1,
  borderColor: 'divider',
}

const formLabelSx = {
  ...labelCellSx,
  width: 100,
  minWidth: 100,
}

const formValueSx = {
  flex: 1,
  px: 2,
  py: 1,
  bgcolor: 'background.paper',
  borderRight: 1,
  borderColor: 'divider',
}

// ===== API Functions =====
const fetchMeasurements = async (page: number, size: number): Promise<PageResponse<WorkplaceMeasurement>> => {
  const response = await axiosInstance.get<ApiResponse<PageResponse<WorkplaceMeasurement>>>('/workplace-measurement', {
    params: { page, size, sort: 'createdAt,desc' },
  })
  return response.data.data
}

const fetchMeasurementById = async (id: number): Promise<WorkplaceMeasurement> => {
  const response = await axiosInstance.get<ApiResponse<WorkplaceMeasurement>>(`/workplace-measurement/${id}`)
  return response.data.data
}

const searchMeasurements = async (keyword: string, page: number, size: number): Promise<PageResponse<WorkplaceMeasurement>> => {
  const response = await axiosInstance.get<ApiResponse<PageResponse<WorkplaceMeasurement>>>('/workplace-measurement/search', {
    params: { keyword, page, size },
  })
  return response.data.data
}

const fetchByYear = async (year: number, page: number, size: number): Promise<PageResponse<WorkplaceMeasurement>> => {
  const response = await axiosInstance.get<ApiResponse<PageResponse<WorkplaceMeasurement>>>(`/workplace-measurement/year/${year}`, {
    params: { page, size },
  })
  return response.data.data
}

const createMeasurement = async (data: WorkplaceMeasurementRequest): Promise<WorkplaceMeasurement> => {
  const response = await axiosInstance.post<ApiResponse<WorkplaceMeasurement>>('/workplace-measurement', data)
  return response.data.data
}

const updateMeasurement = async (id: number, data: WorkplaceMeasurementRequest): Promise<WorkplaceMeasurement> => {
  const response = await axiosInstance.put<ApiResponse<WorkplaceMeasurement>>(`/workplace-measurement/${id}`, data)
  return response.data.data
}

const deleteMeasurement = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/workplace-measurement/${id}`)
}

// ===== Helper Functions =====
type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const getStatusColor = (status: MeasurementStatus): 'default' | 'info' | 'success' | 'error' => {
  switch (status) {
    case 'PLANNED': return 'default'
    case 'IN_PROGRESS': return 'info'
    case 'COMPLETED': return 'success'
    case 'OVERDUE': return 'error'
    default: return 'default'
  }
}

const getResultColor = (result: OverallMeasurementResult): 'success' | 'error' | 'warning' => {
  switch (result) {
    case 'PASS': return 'success'
    case 'FAIL': return 'error'
    case 'PARTIAL': return 'warning'
    default: return 'warning'
  }
}

const getResultStatusColor = (status: MeasurementResultStatus): 'success' | 'warning' | 'error' => {
  switch (status) {
    case 'normal': return 'success'
    case 'caution': return 'warning'
    case 'exceeded': return 'error'
    default: return 'success'
  }
}


const emptyDetailRow = (): WorkplaceMeasurementDetailRequest => ({
  hazardousFactor: '',
  factorType: 'CHEMICAL',
  workProcess: '',
  measurementValue: '',
  exposureStandard: '',
  unit: '',
  resultRatio: undefined,
  resultStatus: 'normal',
  employeeCount: undefined,
  notes: '',
})

// ===== Main Component =====
const WorkplaceMeasurementTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showAlert, showConfirm, showSuccess } = useAlert()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filterYear, setFilterYear] = useState<number | ''>('')
  const [detailRows, setDetailRows] = useState<WorkplaceMeasurementDetailRequest[]>([])

  // Code management label maps
  const { codeMap: halfLabels, codeList: halfCodes, getLocalizedName } = useCodeMap('MEASUREMENT_HALF')
  const { codeMap: statusLabels, codeList: statusCodes } = useCodeMap('MEASUREMENT_STATUS')
  const { codeMap: resultLabels } = useCodeMap('OVERALL_MEASUREMENT_RESULT')
  const { codeMap: factorTypeLabels, codeList: factorTypeCodes } = useCodeMap('FACTOR_TYPE')
  const { codeMap: resultStatusLabels, codeList: resultStatusCodes } = useCodeMap('MEASUREMENT_RESULT_STATUS')
  const { codeList: unitCodes, getLabel: getUnitLabel } = useCodeMap('MEASUREMENT_UNIT')

  // ===== Queries =====
  const listQuery = useQuery({
    queryKey: ['workplaceMeasurements', page, pageSize, searchKeyword, filterYear],
    queryFn: () => {
      if (searchKeyword) return searchMeasurements(searchKeyword, page, pageSize)
      if (filterYear) return fetchByYear(filterYear as number, page, pageSize)
      return fetchMeasurements(page, pageSize)
    },
    enabled: viewMode === 'list',
  })

  const detailQuery = useQuery({
    queryKey: ['workplaceMeasurement', selectedId],
    queryFn: () => fetchMeasurementById(selectedId!),
    enabled: !!selectedId && (viewMode === 'detail' || viewMode === 'edit'),
  })

  // ===== Mutations =====
  const createMutation = useMutation({
    mutationFn: createMeasurement,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['workplaceMeasurements'] })
      await showSuccess(t('common.saveSuccess'))
      setViewMode('list')
    },
    onError: () => showAlert('error', t('occupationalExposure.measurement.loadFailed')),
  })

  const updateMutation = useMutation({
    mutationFn: (data: WorkplaceMeasurementRequest) => updateMeasurement(selectedId!, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['workplaceMeasurements'] })
      queryClient.invalidateQueries({ queryKey: ['workplaceMeasurement', selectedId] })
      await showSuccess(t('common.saveSuccess'))
      setViewMode('list')
    },
    onError: () => showAlert('error', t('occupationalExposure.measurement.loadFailed')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMeasurement,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['workplaceMeasurements'] })
      await showSuccess(t('common.deleteSuccess'))
      setViewMode('list')
    },
    onError: () => showAlert('error', t('occupationalExposure.measurement.loadFailed')),
  })

  const isProcessing = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  // ===== Form =====
  const { control, handleSubmit, reset, getValues, setValue } = useForm<WorkplaceMeasurementRequest>({
    defaultValues: {
      measurementYear: new Date().getFullYear(),
      measurementHalf: 'FIRST',
      measurementDate: '',
      measurementAgency: '',
      measurementSite: '',
      measurementSiteDetail: '',
      status: 'PLANNED',
      overallResult: undefined,
      notes: '',
    },
  })

  // ===== Handlers =====
  const handleViewDetail = (id: number) => {
    setSelectedId(id)
    setViewMode('detail')
  }

  const handleCreate = () => {
    reset({
      measurementYear: new Date().getFullYear(),
      measurementHalf: 'FIRST',
      measurementDate: '',
      measurementAgency: '',
      measurementSite: '',
      measurementSiteDetail: '',
      status: 'PLANNED',
      overallResult: undefined,
      notes: '',
    })
    setDetailRows([])
    setViewMode('create')
  }

  const handleEdit = () => {
    if (detailQuery.data) {
      const d = detailQuery.data
      reset({
        measurementYear: d.measurementYear,
        measurementHalf: d.measurementHalf,
        measurementDate: d.measurementDate || '',
        measurementAgency: d.measurementAgency || '',
        measurementSite: d.measurementSite || '',
        measurementSiteDetail: d.measurementSiteDetail || '',
        status: d.status,
        overallResult: d.overallResult || undefined,
        notes: d.notes || '',
      })
      setDetailRows(
        (d.details || []).map((dt) => ({
          hazardousFactor: dt.hazardousFactor,
          factorType: dt.factorType,
          workProcess: dt.workProcess || '',
          measurementValue: dt.measurementValue || '',
          exposureStandard: dt.exposureStandard || '',
          unit: dt.unit || '',
          resultRatio: dt.resultRatio,
          resultStatus: dt.resultStatus || 'normal',
          employeeCount: dt.employeeCount,
          notes: dt.notes || '',
        }))
      )
      setViewMode('edit')
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm(t('occupationalExposure.measurement.confirmDelete'))
    if (confirmed) {
      deleteMutation.mutate(id)
    }
  }

  const handleBackToList = () => {
    setViewMode('list')
  }

  const handleSearch = () => {
    setSearchKeyword(searchInput)
    setFilterYear('')
    setPage(0)
  }

  const handleYearChange = (e: SelectChangeEvent<number | ''>) => {
    setFilterYear(e.target.value as number | '')
    setSearchKeyword('')
    setSearchInput('')
    setPage(0)
  }

  const handleReset = () => {
    setSearchKeyword('')
    setSearchInput('')
    setFilterYear('')
    setPage(0)
  }

  const onSubmit = async (data: WorkplaceMeasurementRequest) => {
    const confirmed = await showConfirm(t('common.confirmSave'))
    if (!confirmed) return

    const validDetails = detailRows.filter((r) => r.hazardousFactor)
    const payload: WorkplaceMeasurementRequest = {
      ...data,
      measurementDate: data.measurementDate || undefined,
      details: validDetails.length > 0 ? validDetails : undefined,
    }
    if (viewMode === 'create') createMutation.mutate(payload)
    else if (viewMode === 'edit') updateMutation.mutate(payload)
  }

  const handleDetailRowChange = (index: number, field: keyof WorkplaceMeasurementDetailRequest, value: string | number | undefined) => {
    setDetailRows((prev) => prev.map((row, i) => i === index ? { ...row, [field]: value } : row))
  }

  const handleAddDetailRow = () => {
    setDetailRows((prev) => [...prev, emptyDetailRow()])
  }

  const handleRemoveDetailRow = (index: number) => {
    setDetailRows((prev) => prev.filter((_, i) => i !== index))
  }

  // DEV ONLY — 비어있는 항목을 작업환경측정 더미데이터로 채움 (입력값 보존)
  const fillTestData = () => {
    const v = getValues()
    if (!v.measurementHalf) setValue('measurementHalf', 'FIRST')
    if (!v.measurementDate) setValue('measurementDate', new Date().toISOString().slice(0, 10))
    if (!v.measurementAgency) setValue('measurementAgency', '한국산업안전보건공단')
    if (!v.measurementSite) setValue('measurementSite', '제1공장 생산동')
    if (!v.measurementSiteDetail) setValue('measurementSiteDetail', '용접 작업장 (2층)')
    if (!v.status) setValue('status', 'COMPLETED')
    if (!v.overallResult) setValue('overallResult', 'PASS')
    if (!v.notes) setValue('notes', '정기 작업환경측정 (테스트 데이터)')
    setDetailRows((prev) => prev.length > 0 ? prev : [{
      hazardousFactor: '소음',
      factorType: 'PHYSICAL',
      workProcess: '용접 공정',
      measurementValue: '82.5',
      exposureStandard: '90',
      unit: unitCodes[0]?.codeValue || unitCodes[0]?.code || '',
      resultRatio: 0.92,
      resultStatus: 'normal',
      employeeCount: 5,
      notes: '',
    }])
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  // ==============================================
  // ===== LIST VIEW =====
  // ==============================================
  const renderListView = () => (
    <Box sx={{ overflow: 'hidden' }}>
      {/* Filters - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ListSearchBar
            placeholder={t('occupationalExposure.measurement.searchPlaceholder')}
            value={searchInput}
            onChange={setSearchInput}
            onSearch={handleSearch}
            sx={{ width: 300 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select value={filterYear} onChange={handleYearChange} displayEmpty>
              <MenuItem value="">{t('occupationalExposure.measurement.filterByYear')}</MenuItem>
              {years.map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton onClick={() => { handleReset(); listQuery.refetch() }} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleCreate}>
          New
        </Button>
      </Box>

      {/* Filters - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, mb: 2 }}>
        <ListSearchBar
          fullWidth
          placeholder={t('occupationalExposure.measurement.searchPlaceholder')}
          value={searchInput}
          onChange={setSearchInput}
          onSearch={handleSearch}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <Select value={filterYear} onChange={handleYearChange} displayEmpty>
              <MenuItem value="">{t('occupationalExposure.measurement.filterByYear')}</MenuItem>
              {years.map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button variant="outlined" size="small" onClick={handleReset} startIcon={<RefreshIcon />} sx={{ flex: 1 }}>
            {t('common.reset')}
          </Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleCreate} sx={{ flex: 1 }}>
            New
          </Button>
        </Box>
      </Box>

      {/* Table */}
      {listQuery.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : listQuery.isError ? (
        <Alert severity="error">{t('occupationalExposure.measurement.loadFailed')}</Alert>
      ) : (
        <>
          {/* Table - PC */}
          <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 900, '& .MuiTableCell-root': { borderColor: 'divider' } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold', width: 200, borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.measurement.measurementId')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 100, borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.measurement.measurementYear')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 100, borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.measurement.measurementHalf')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 100, borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.measurement.measurementSite')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 200, width: 200, borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.measurement.measurementAgency')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 80, borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.measurement.status')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 100, borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.measurement.overallResult')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 110, width: 110 }} align="center">{t('occupationalExposure.measurement.measurementDate')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {listQuery.data?.content?.length ? (
                  listQuery.data.content.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleViewDetail(row.id)}
                    >
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{row.measurementId}</TableCell>
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{row.measurementYear}</TableCell>
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{halfLabels[row.measurementHalf]}</TableCell>
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{row.measurementSite || ''}</TableCell>
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{row.measurementAgency || ''}</TableCell>
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>
                        <Chip
                          label={statusLabels[row.status]}
                          color={getStatusColor(row.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>
                        {row.overallResult ? (
                          <Chip
                            label={resultLabels[row.overallResult]}
                            color={getResultColor(row.overallResult)}
                            size="small"
                          />
                        ) : ''}
                      </TableCell>
                      <TableCell align="center">{formatDate(row.measurementDate)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">{t('occupationalExposure.measurement.noData')}</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobile Card List */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
            {listQuery.data?.content?.length ? (
              listQuery.data.content.map((row) => (
                <Paper key={row.id} sx={{ p: 2, cursor: 'pointer', border: 1, borderColor: 'divider' }} onClick={() => handleViewDetail(row.id)}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography fontWeight="bold" sx={{ flex: 1 }}>{row.measurementId}</Typography>
                    <Chip
                      label={statusLabels[row.status]}
                      color={getStatusColor(row.status)}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('occupationalExposure.measurement.measurementYear')}</Typography>
                      <Typography variant="body2">{row.measurementYear} / {halfLabels[row.measurementHalf]}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('occupationalExposure.measurement.measurementSite')}</Typography>
                      <Typography variant="body2">{row.measurementSite || ''}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('occupationalExposure.measurement.measurementAgency')}</Typography>
                      <Typography variant="body2">{row.measurementAgency || ''}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('occupationalExposure.measurement.overallResult')}</Typography>
                      <Typography variant="body2">
                        {row.overallResult ? resultLabels[row.overallResult] : ''}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('occupationalExposure.measurement.measurementDate')}</Typography>
                      <Typography variant="body2">{formatDate(row.measurementDate)}</Typography>
                    </Box>
                  </Box>
                </Paper>
              ))
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">{t('occupationalExposure.measurement.noData')}</Typography>
              </Paper>
            )}
          </Box>

          {listQuery.data && listQuery.data.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={listQuery.data.totalPages}
                page={page + 1}
                onChange={(_, val) => setPage(val - 1)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  )

  // ==============================================
  // ===== DETAIL VIEW =====
  // ==============================================
  const renderDetailView = () => {
    if (detailQuery.isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )
    }
    if (!detailQuery.data) return <Alert severity="error">{t('occupationalExposure.measurement.loadFailed')}</Alert>

    const d = detailQuery.data

    return (
      <Box sx={{ overflow: 'hidden' }}>
        {/* ===== Measurement Info - PC Table Form ===== */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'text.primary' }}>
          {t('occupationalExposure.measurement.measurementInfo')}
        </Typography>
        <Paper sx={{ display: { xs: 'none', md: 'block' }, p: 3, bgcolor: 'grey.50', mb: 3 }}>
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelCellSx}>{t('occupationalExposure.measurement.measurementId')}</Typography>
            <Typography sx={valueCellBorderSx}>{d.measurementId}</Typography>
            <Typography sx={labelCellSx}>{t('occupationalExposure.measurement.measurementYear')}</Typography>
            <Typography sx={valueCellSx}>{d.measurementYear}</Typography>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelCellSx}>{t('occupationalExposure.measurement.measurementHalf')}</Typography>
            <Typography sx={valueCellBorderSx}>{halfLabels[d.measurementHalf]}</Typography>
            <Typography sx={labelCellSx}>{t('occupationalExposure.measurement.measurementDate')}</Typography>
            <Typography sx={valueCellSx}>{formatDate(d.measurementDate)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelCellSx}>{t('occupationalExposure.measurement.measurementAgency')}</Typography>
            <Typography sx={valueCellBorderSx}>{d.measurementAgency || ''}</Typography>
            <Typography sx={labelCellSx}>{t('occupationalExposure.measurement.measurementSite')}</Typography>
            <Typography sx={valueCellSx}>{d.measurementSite || ''}</Typography>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelCellSx}>{t('occupationalExposure.measurement.measurementSiteDetail')}</Typography>
            <Typography sx={{ ...valueCellSx, flex: 3 }}>{d.measurementSiteDetail || ''}</Typography>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelCellSx}>{t('occupationalExposure.measurement.status')}</Typography>
            <Box sx={valueCellBorderSx}>
              <Chip label={statusLabels[d.status]} color={getStatusColor(d.status)} size="small" />
            </Box>
            <Typography sx={labelCellSx}>{t('occupationalExposure.measurement.overallResult')}</Typography>
            <Box sx={valueCellSx}>
              {d.overallResult ? (
                <Chip label={resultLabels[d.overallResult]} color={getResultColor(d.overallResult)} size="small" />
              ) : ''}
            </Box>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Typography sx={labelCellSx}>{t('occupationalExposure.measurement.notes')}</Typography>
            <Typography sx={{ ...valueCellSx, whiteSpace: 'pre-wrap' }}>{d.notes || ''}</Typography>
          </Box>
        </Box>
        </Paper>

        {/* ===== Measurement Info - Mobile ===== */}
        <Paper sx={{ display: { xs: 'block', md: 'none' }, p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { label: t('occupationalExposure.measurement.measurementId'), value: d.measurementId },
              { label: t('occupationalExposure.measurement.measurementYear'), value: String(d.measurementYear) },
              { label: t('occupationalExposure.measurement.measurementHalf'), value: halfLabels[d.measurementHalf] },
              { label: t('occupationalExposure.measurement.measurementDate'), value: formatDate(d.measurementDate) },
              { label: t('occupationalExposure.measurement.measurementAgency'), value: d.measurementAgency || '' },
              { label: t('occupationalExposure.measurement.measurementSite'), value: d.measurementSite || '' },
              { label: t('occupationalExposure.measurement.measurementSiteDetail'), value: d.measurementSiteDetail || '' },
              { label: t('occupationalExposure.measurement.overallResult'), value: d.overallResult ? resultLabels[d.overallResult] : '' },
              { label: t('occupationalExposure.measurement.notes'), value: d.notes || '' },
            ].map((item, idx) => (
              <Box key={idx}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                  {item.label}
                </Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* ===== Detail Results Table ===== */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          {t('occupationalExposure.measurement.detailList')}
        </Typography>

        {/* Detail Table - PC */}
        <Paper sx={{ display: { xs: 'none', md: 'block' }, mb: 3 }}>
          <TableContainer>
            <Table size="small" stickyHeader sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} align="center">{t('occupationalExposure.measurement.hazardousFactor')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} align="center">{t('occupationalExposure.measurement.factorType')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} align="center">{t('occupationalExposure.measurement.workProcess')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} align="center">{t('occupationalExposure.measurement.measurementValue')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} align="center">{t('occupationalExposure.measurement.exposureStandard')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} align="center">{t('occupationalExposure.measurement.unit')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} align="center">{t('occupationalExposure.measurement.resultRatio')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} align="center">{t('occupationalExposure.measurement.resultStatus')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} align="center">{t('occupationalExposure.measurement.employeeCount')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} align="center">{t('occupationalExposure.measurement.notes')}</TableCell>
                </TableRow>
              </TableHead>
            <TableBody>
              {d.details && d.details.length > 0 ? (
                d.details.map((detail, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell align="center">{detail.hazardousFactor}</TableCell>
                    <TableCell align="center">{factorTypeLabels[detail.factorType]}</TableCell>
                    <TableCell align="center">{detail.workProcess || ''}</TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{detail.measurementValue || ''}</TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{detail.exposureStandard || ''}</TableCell>
                    <TableCell align="center">{detail.unit || ''}</TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{detail.resultRatio != null ? detail.resultRatio : ''}</TableCell>
                    <TableCell align="center">
                      <Chip label={resultStatusLabels[detail.resultStatus]} color={getResultStatusColor(detail.resultStatus)} size="small" />
                    </TableCell>
                    <TableCell align="center">{detail.employeeCount != null ? detail.employeeCount : ''}</TableCell>
                    <TableCell align={detail.notes ? undefined : 'center'}>{detail.notes || ''}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">{t('occupationalExposure.measurement.noDetailData')}</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        </Paper>

        {/* Detail Cards - Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, mb: 3 }}>
          {d.details && d.details.length > 0 ? (
            d.details.map((detail, idx) => (
              <Paper key={idx} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography fontWeight="bold" sx={{ flex: 1 }}>{detail.hazardousFactor}</Typography>
                  <Chip
                    label={resultStatusLabels[detail.resultStatus]}
                    color={getResultStatusColor(detail.resultStatus)}
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 70 }}>{t('occupationalExposure.measurement.factorType')}</Typography>
                    <Typography variant="body2">{factorTypeLabels[detail.factorType]}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 70 }}>{t('occupationalExposure.measurement.workProcess')}</Typography>
                    <Typography variant="body2">{detail.workProcess || ''}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 70 }}>{t('occupationalExposure.measurement.measurementValue')}</Typography>
                    <Typography variant="body2">{detail.measurementValue || ''} {detail.unit || ''}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 70 }}>{t('occupationalExposure.measurement.exposureStandard')}</Typography>
                    <Typography variant="body2">{detail.exposureStandard || ''}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 70 }}>{t('occupationalExposure.measurement.resultRatio')}</Typography>
                    <Typography variant="body2">{detail.resultRatio != null ? detail.resultRatio : ''}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 70 }}>{t('occupationalExposure.measurement.employeeCount')}</Typography>
                    <Typography variant="body2">{detail.employeeCount != null ? detail.employeeCount : ''}</Typography>
                  </Box>
                </Box>
              </Paper>
            ))
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">{t('occupationalExposure.measurement.noDetailData')}</Typography>
            </Paper>
          )}
        </Box>

        {/* Bottom Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
            {t('common.list')}
          </Button>
          <Button variant="contained" onClick={handleEdit} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
            {t('common.edit')}
          </Button>
          <Button variant="contained" color="error" onClick={() => handleDelete(d.id)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
            {t('common.delete')}
          </Button>
        </Box>
      </Box>
    )
  }

  // ==============================================
  // ===== CREATE / EDIT VIEW =====
  // ==============================================
  const renderFormView = () => (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Form - PC */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={formLabelSx}>
              {t('occupationalExposure.measurement.measurementYear')}
              <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={formValueSx}>
              <Controller
                name="measurementYear"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    value={field.value || new Date().getFullYear()}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    size="small"
                    fullWidth
                   displayEmpty>
                    <MenuItem value="" disabled>선택하세요</MenuItem>
                    {years.map((y) => (
                      <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                  </Select>
                )}
              />
            </Box>
            <Typography sx={formLabelSx}>
              {t('occupationalExposure.measurement.measurementHalf')}
              <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller
                name="measurementHalf"
                control={control}
                rules={{ required: true }}
                render={({ field, fieldState }) => (
                  <Select
                    value={field.value || 'FIRST'}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    size="small"
                    fullWidth
                    error={!!fieldState.error}
                   displayEmpty>
                    <MenuItem value="" disabled>선택하세요</MenuItem>
                    <MenuItem value="FIRST">{halfLabels.FIRST}</MenuItem>
                    <MenuItem value="SECOND">{halfLabels.SECOND}</MenuItem>
                  </Select>
                )}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={formLabelSx}>{t('occupationalExposure.measurement.measurementDate')}</Typography>
            <Box sx={formValueSx}>
              <Controller
                name="measurementDate"
                control={control}
                render={({ field }) => (
                  <DatePickerField value={field.value || ''} onChange={field.onChange} size="small" />
                )}
              />
            </Box>
            <Typography sx={formLabelSx}>{t('occupationalExposure.measurement.measurementAgency')}</Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller
                name="measurementAgency"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.measurement.measurementAgency')} />
                )}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={formLabelSx}>{t('occupationalExposure.measurement.measurementSite')}</Typography>
            <Box sx={formValueSx}>
              <Controller
                name="measurementSite"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.measurement.measurementSite')} />
                )}
              />
            </Box>
            <Typography sx={formLabelSx}>{t('occupationalExposure.measurement.measurementSiteDetail')}</Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller
                name="measurementSiteDetail"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.measurement.measurementSiteDetail')} />
                )}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={formLabelSx}>
              {t('occupationalExposure.measurement.status')}
            </Typography>
            <Box sx={formValueSx}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || 'PLANNED'}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    size="small"
                    fullWidth
                   displayEmpty>
                    <MenuItem value="" disabled>선택하세요</MenuItem>
                    {statusCodes.map((item) => (
                      <MenuItem key={item.code} value={item.code}>{getLocalizedName(item)}</MenuItem>
                    ))}
                  </Select>
                )}
              />
            </Box>
            <Typography sx={formLabelSx}>{t('occupationalExposure.measurement.overallResult')}</Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller
                name="overallResult"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    size="small"
                    fullWidth
                    displayEmpty
                  >
                    <MenuItem value="" disabled>선택하세요</MenuItem>
                    {(['PASS', 'FAIL', 'PARTIAL'] as OverallMeasurementResult[]).map((r) => (
                      <MenuItem key={r} value={r}>{resultLabels[r]}</MenuItem>
                    ))}
                  </Select>
                )}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Typography sx={formLabelSx}>{t('occupationalExposure.measurement.notes')}</Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth multiline minRows={2} placeholder={t('occupationalExposure.measurement.notes')} />
                )}
              />
            </Box>
          </Box>
        </Box>

        {/* Form - Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.measurement.measurementYear')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Controller name="measurementYear" control={control} rules={{ required: true }} render={({ field }) => (
              <Select value={field.value || new Date().getFullYear()} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} size="small" fullWidth displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {years.map((y) => (<MenuItem key={y} value={y}>{y}</MenuItem>))}
              </Select>
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.measurement.measurementHalf')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Controller name="measurementHalf" control={control} rules={{ required: true }} render={({ field, fieldState }) => (
              <Select value={field.value || 'FIRST'} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} size="small" fullWidth error={!!fieldState.error} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                <MenuItem value="FIRST">{halfLabels.FIRST}</MenuItem>
                <MenuItem value="SECOND">{halfLabels.SECOND}</MenuItem>
              </Select>
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.measurement.measurementDate')}
            </Typography>
            <Controller name="measurementDate" control={control} render={({ field }) => (
              <DatePickerField value={field.value || ''} onChange={field.onChange} size="small" />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.measurement.measurementAgency')}
            </Typography>
            <Controller name="measurementAgency" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.measurement.measurementAgency')} />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.measurement.measurementSite')}
            </Typography>
            <Controller name="measurementSite" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.measurement.measurementSite')} />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.measurement.measurementSiteDetail')}
            </Typography>
            <Controller name="measurementSiteDetail" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.measurement.measurementSiteDetail')} />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.measurement.status')}
            </Typography>
            <Controller name="status" control={control} render={({ field }) => (
              <Select value={field.value || 'PLANNED'} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} size="small" fullWidth displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'] as MeasurementStatus[]).map((s) => (
                  <MenuItem key={s} value={s}>{statusLabels[s]}</MenuItem>
                ))}
              </Select>
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.measurement.overallResult')}
            </Typography>
            <Controller name="overallResult" control={control} render={({ field }) => (
              <Select value={field.value || ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} size="small" fullWidth displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {(['PASS', 'FAIL', 'PARTIAL'] as OverallMeasurementResult[]).map((r) => (
                  <MenuItem key={r} value={r}>{resultLabels[r]}</MenuItem>
                ))}
              </Select>
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.measurement.notes')}
            </Typography>
            <Controller name="notes" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth multiline minRows={2} placeholder={t('occupationalExposure.measurement.notes')} />
            )} />
          </Box>
        </Box>

        {/* ===== Detail Rows Section (Editable Table) ===== */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          {t('occupationalExposure.measurement.detailList')}
        </Typography>

        {/* Detail Editable Table - PC */}
        <Paper sx={{ display: { xs: 'none', md: 'block' }, p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 1 }}>
            <Button size="small" startIcon={<AddIcon />} onClick={handleAddDetailRow}>
              {t('occupationalExposure.measurement.addRow')}
            </Button>
          </Box>
          <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 1100, '& .MuiTableCell-root': { borderColor: 'divider' } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.measurement.hazardousFactor')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', width: 120, whiteSpace: 'nowrap' }} align="center">{t('occupationalExposure.measurement.factorType')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.measurement.workProcess')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', width: 90 }} align="center">{t('occupationalExposure.measurement.measurementValue')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', width: 90 }} align="center">{t('occupationalExposure.measurement.exposureStandard')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', width: 60 }} align="center">{t('occupationalExposure.measurement.unit')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', width: 130, whiteSpace: 'nowrap' }} align="center">{t('occupationalExposure.measurement.resultRatio')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', width: 100 }} align="center">{t('occupationalExposure.measurement.resultStatus')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', width: 100, whiteSpace: 'nowrap' }} align="center">{t('occupationalExposure.measurement.employeeCount')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.measurement.notes')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 60, minWidth: 60, whiteSpace: 'nowrap' }} align="center">{t('common.delete')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detailRows.length > 0 ? (
                  detailRows.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider', p: 0.5 }}>
                        <TextField
                          value={row.hazardousFactor}
                          onChange={(e) => handleDetailRowChange(idx, 'hazardousFactor', e.target.value)}
                          size="small"
                          fullWidth
                          placeholder={t('occupationalExposure.measurement.hazardousFactor')}
                        />
                      </TableCell>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider', p: 0.5 }}>
                        <Select
                          value={row.factorType || 'CHEMICAL'}
                          onChange={(e) => handleDetailRowChange(idx, 'factorType', e.target.value)}
                          size="small"
                          fullWidth
                         displayEmpty>
                          <MenuItem value="" disabled>선택하세요</MenuItem>
                          {factorTypeCodes.map((ft) => (
                            <MenuItem key={ft.code} value={ft.code}>{getLocalizedName(ft)}</MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider', p: 0.5 }}>
                        <TextField
                          value={row.workProcess}
                          onChange={(e) => handleDetailRowChange(idx, 'workProcess', e.target.value)}
                          size="small"
                          fullWidth
                          placeholder={t('occupationalExposure.measurement.workProcess')}
                        />
                      </TableCell>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider', p: 0.5 }}>
                        <TextField
                          value={row.measurementValue}
                          onChange={(e) => handleDetailRowChange(idx, 'measurementValue', e.target.value)}
                          size="small"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider', p: 0.5 }}>
                        <TextField
                          value={row.exposureStandard}
                          onChange={(e) => handleDetailRowChange(idx, 'exposureStandard', e.target.value)}
                          size="small"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider', p: 0.5 }}>
                        <Select
                          value={row.unit || ''}
                          onChange={(e) => handleDetailRowChange(idx, 'unit', e.target.value)}
                          size="small"
                          fullWidth
                          displayEmpty
                        >
                          <MenuItem value="" disabled>선택하세요</MenuItem>
                          {unitCodes.map((c) => <MenuItem key={c.code} value={c.codeValue || c.code}>{getUnitLabel(c.code)}</MenuItem>)}
                        </Select>
                      </TableCell>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider', p: 0.5 }}>
                        <NumberField
                          value={row.resultRatio ?? ''}
                          onChange={(v) => handleDetailRowChange(idx, 'resultRatio', v ?? undefined)}
                          size="small"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider', p: 0.5 }}>
                        <Select
                          value={row.resultStatus || 'normal'}
                          onChange={(e) => handleDetailRowChange(idx, 'resultStatus', e.target.value)}
                          size="small"
                          fullWidth
                         displayEmpty>
                          <MenuItem value="" disabled>선택하세요</MenuItem>
                          {resultStatusCodes.map((rs) => (
                            <MenuItem key={rs.code} value={rs.code}>{getLocalizedName(rs)}</MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider', p: 0.5 }}>
                        <NumberField
                          value={row.employeeCount ?? ''}
                          onChange={(v) => handleDetailRowChange(idx, 'employeeCount', v ?? undefined)}
                          size="small"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider', p: 0.5 }}>
                        <TextField
                          value={row.notes}
                          onChange={(e) => handleDetailRowChange(idx, 'notes', e.target.value)}
                          size="small"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell sx={{ p: 0.5 }} align="center">
                        <IconButton size="small" onClick={() => handleRemoveDetailRow(idx)} sx={{ color: 'text.primary' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">{t('occupationalExposure.measurement.noDetailData')}</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Detail Editable Cards - Mobile */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 1 }}>
            <Button size="small" startIcon={<AddIcon />} onClick={handleAddDetailRow}>
              {t('occupationalExposure.measurement.addRow')}
            </Button>
          </Box>
          {detailRows.length > 0 ? (
            detailRows.map((row, idx) => (
              <Paper key={idx} sx={{ p: 2, mb: 1.5, border: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="body2" fontWeight="bold">#{idx + 1}</Typography>
                  <IconButton size="small" onClick={() => handleRemoveDetailRow(idx)} sx={{ color: 'text.primary' }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">{t('occupationalExposure.measurement.hazardousFactor')}</Typography>
                    <TextField
                      value={row.hazardousFactor}
                      onChange={(e) => handleDetailRowChange(idx, 'hazardousFactor', e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">{t('occupationalExposure.measurement.factorType')}</Typography>
                    <Select
                      value={row.factorType || 'CHEMICAL'}
                      onChange={(e) => handleDetailRowChange(idx, 'factorType', e.target.value)}
                      size="small"
                      fullWidth
                     displayEmpty>
                      <MenuItem value="" disabled>선택하세요</MenuItem>
                      {factorTypeCodes.map((ft) => (
                        <MenuItem key={ft.code} value={ft.code}>{getLocalizedName(ft)}</MenuItem>
                      ))}
                    </Select>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">{t('occupationalExposure.measurement.workProcess')}</Typography>
                    <TextField
                      value={row.workProcess}
                      onChange={(e) => handleDetailRowChange(idx, 'workProcess', e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">{t('occupationalExposure.measurement.measurementValue')}</Typography>
                      <TextField
                        value={row.measurementValue}
                        onChange={(e) => handleDetailRowChange(idx, 'measurementValue', e.target.value)}
                        size="small"
                        fullWidth
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">{t('occupationalExposure.measurement.unit')}</Typography>
                      <Select
                        value={row.unit || ''}
                        onChange={(e) => handleDetailRowChange(idx, 'unit', e.target.value)}
                        size="small"
                        fullWidth
                        displayEmpty
                      >
                        <MenuItem value="" disabled>선택하세요</MenuItem>
                        {unitCodes.map((c) => <MenuItem key={c.code} value={c.codeValue || c.code}>{getUnitLabel(c.code)}</MenuItem>)}
                      </Select>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">{t('occupationalExposure.measurement.exposureStandard')}</Typography>
                      <TextField
                        value={row.exposureStandard}
                        onChange={(e) => handleDetailRowChange(idx, 'exposureStandard', e.target.value)}
                        size="small"
                        fullWidth
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">{t('occupationalExposure.measurement.resultRatio')}</Typography>
                      <NumberField
                        value={row.resultRatio ?? ''}
                        onChange={(v) => handleDetailRowChange(idx, 'resultRatio', v ?? undefined)}
                        size="small"
                        fullWidth
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">{t('occupationalExposure.measurement.resultStatus')}</Typography>
                      <Select
                        value={row.resultStatus || 'normal'}
                        onChange={(e) => handleDetailRowChange(idx, 'resultStatus', e.target.value)}
                        size="small"
                        fullWidth
                       displayEmpty>
                        <MenuItem value="" disabled>선택하세요</MenuItem>
                        {resultStatusCodes.map((rs) => (
                          <MenuItem key={rs.code} value={rs.code}>{getLocalizedName(rs)}</MenuItem>
                        ))}
                      </Select>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">{t('occupationalExposure.measurement.employeeCount')}</Typography>
                      <NumberField
                        value={row.employeeCount ?? ''}
                        onChange={(v) => handleDetailRowChange(idx, 'employeeCount', v ?? undefined)}
                        size="small"
                        fullWidth
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">{t('occupationalExposure.measurement.notes')}</Typography>
                    <TextField
                      value={row.notes}
                      onChange={(e) => handleDetailRowChange(idx, 'notes', e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </Box>
                </Box>
              </Paper>
            ))
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">{t('occupationalExposure.measurement.noDetailData')}</Typography>
            </Paper>
          )}
        </Box>

        {/* Form Actions */}
        <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
          <Button variant="outlined" onClick={() => setViewMode(viewMode === 'edit' ? 'detail' : 'list')} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
            {viewMode === 'edit' ? t('common.cancel') : t('common.list')}
          </Button>
          <Button type="submit" variant="contained" disabled={isProcessing} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
            {t('common.save')}
          </Button>
        </Box>
      </form>
    </>
  )

  // ===== RENDER =====
  return (
    <Box>
      <LoadingOverlay open={isProcessing} message="처리 중..." />
      {viewMode === 'list' && renderListView()}
      {viewMode === 'detail' && renderDetailView()}
      {(viewMode === 'create' || viewMode === 'edit') && renderFormView()}
    </Box>
  )
}

export default WorkplaceMeasurementTab
