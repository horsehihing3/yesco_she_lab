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
  Switch,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import { useForm, Controller } from 'react-hook-form'
import DatePickerField from '../common/DatePickerField'
import { useAlert } from '../../contexts/AlertContext'
import axiosInstance from '../../api/axiosInstance'
import { ApiResponse, PageResponse } from '../../types/common.types'
import {
  PrePlacementExam,
  PrePlacementExamRequest,
  ExamResult,
  ExamStatus,
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
  borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider',
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
  borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider',
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
  borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider',
}

// ===== Helper Functions =====
type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const getExamResultColor = (result: ExamResult): 'success' | 'warning' | 'error' | 'default' => {
  switch (result) {
    case 'FIT': return 'success'
    case 'CONDITIONAL_FIT': return 'warning'
    case 'UNFIT': return 'error'
    case 'PENDING': return 'default'
    default: return 'default'
  }
}

const getStatusColor = (status: ExamStatus): 'default' | 'info' | 'success' | 'error' => {
  switch (status) {
    case 'PENDING': return 'default'
    case 'SCHEDULED': return 'info'
    case 'COMPLETED': return 'success'
    case 'EXPIRED': return 'error'
    default: return 'default'
  }
}


// ===== API Functions =====
const fetchExams = async (page: number, size: number): Promise<PageResponse<PrePlacementExam>> => {
  const response = await axiosInstance.get<ApiResponse<PageResponse<PrePlacementExam>>>('/pre-placement-exam', {
    params: { page, size, sort: 'createdAt,desc' },
  })
  return response.data.data
}

const fetchExamById = async (id: number): Promise<PrePlacementExam> => {
  const response = await axiosInstance.get<ApiResponse<PrePlacementExam>>(`/pre-placement-exam/${id}`)
  return response.data.data
}

const searchExams = async (name: string, page: number, size: number): Promise<PageResponse<PrePlacementExam>> => {
  const response = await axiosInstance.get<ApiResponse<PageResponse<PrePlacementExam>>>('/pre-placement-exam/search', {
    params: { name, page, size },
  })
  return response.data.data
}

const fetchByYear = async (year: number, page: number, size: number): Promise<PageResponse<PrePlacementExam>> => {
  const response = await axiosInstance.get<ApiResponse<PageResponse<PrePlacementExam>>>(`/pre-placement-exam/year/${year}`, {
    params: { page, size },
  })
  return response.data.data
}

const fetchByStatus = async (status: string, page: number, size: number): Promise<PageResponse<PrePlacementExam>> => {
  const response = await axiosInstance.get<ApiResponse<PageResponse<PrePlacementExam>>>(`/pre-placement-exam/status/${status}`, {
    params: { page, size },
  })
  return response.data.data
}

const createExam = async (data: PrePlacementExamRequest): Promise<PrePlacementExam> => {
  const response = await axiosInstance.post<ApiResponse<PrePlacementExam>>('/pre-placement-exam', data)
  return response.data.data
}

const updateExam = async (id: number, data: PrePlacementExamRequest): Promise<PrePlacementExam> => {
  const response = await axiosInstance.put<ApiResponse<PrePlacementExam>>(`/pre-placement-exam/${id}`, data)
  return response.data.data
}

const deleteExam = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/pre-placement-exam/${id}`)
}

// ===== Main Component =====
const PrePlacementExamTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showAlert, showConfirm, showSuccess } = useAlert()
  const { codeMap: examResultLabels, codeList: examResultCodes, getLocalizedName } = useCodeMap('EXAM_RESULT')
  const { codeMap: examStatusLabels, codeList: examStatusCodes } = useCodeMap('EXAM_STATUS')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [searchName, setSearchName] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filterYear, setFilterYear] = useState<number | ''>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  // ===== Queries =====
  const listQuery = useQuery({
    queryKey: ['prePlacementExams', page, pageSize, searchName, filterYear, filterStatus],
    queryFn: () => {
      if (searchName) return searchExams(searchName, page, pageSize)
      if (filterYear) return fetchByYear(filterYear as number, page, pageSize)
      if (filterStatus) return fetchByStatus(filterStatus, page, pageSize)
      return fetchExams(page, pageSize)
    },
    enabled: viewMode === 'list',
  })

  const detailQuery = useQuery({
    queryKey: ['prePlacementExam', selectedId],
    queryFn: () => fetchExamById(selectedId!),
    enabled: !!selectedId && (viewMode === 'detail' || viewMode === 'edit'),
  })

  // ===== Mutations =====
  const createMutation = useMutation({
    mutationFn: createExam,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['prePlacementExams'] })
      await showSuccess(t('common.saveSuccess'))
      setViewMode('list')
    },
    onError: () => showAlert('error', t('occupationalExposure.prePlacementExam.loadFailed')),
  })

  const updateMutation = useMutation({
    mutationFn: (data: PrePlacementExamRequest) => updateExam(selectedId!, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['prePlacementExams'] })
      queryClient.invalidateQueries({ queryKey: ['prePlacementExam', selectedId] })
      await showSuccess(t('common.saveSuccess'))
      setViewMode('list')
    },
    onError: () => showAlert('error', t('occupationalExposure.prePlacementExam.loadFailed')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteExam,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['prePlacementExams'] })
      await showSuccess(t('common.deleteSuccess'))
      setViewMode('list')
    },
    onError: () => showAlert('error', t('occupationalExposure.prePlacementExam.loadFailed')),
  })

  const isProcessing = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  // ===== Form =====
  const { control, handleSubmit, reset, getValues, setValue } = useForm<PrePlacementExamRequest>({
    defaultValues: {
      employeeId: '',
      employeeName: '',
      employeeDept: '',
      employeeEmail: '',
      examYear: currentYear,
      examDate: '',
      targetJob: '',
      hazardousFactors: '',
      hospital: '',
      examResult: 'PENDING',
      resultDetail: '',
      restrictionDetail: '',
      followUpRequired: false,
      followUpDate: '',
      status: 'PENDING',
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
      employeeId: '',
      employeeName: '',
      employeeDept: '',
      employeeEmail: '',
      examYear: currentYear,
      examDate: '',
      targetJob: '',
      hazardousFactors: '',
      hospital: '',
      examResult: 'PENDING',
      resultDetail: '',
      restrictionDetail: '',
      followUpRequired: false,
      followUpDate: '',
      status: 'PENDING',
      notes: '',
    })
    setViewMode('create')
  }

  const handleEdit = () => {
    if (detailQuery.data) {
      const d = detailQuery.data
      reset({
        employeeId: d.employeeId,
        employeeName: d.employeeName || '',
        employeeDept: d.employeeDept || '',
        employeeEmail: d.employeeEmail || '',
        examYear: d.examYear,
        examDate: d.examDate || '',
        targetJob: d.targetJob || '',
        hazardousFactors: d.hazardousFactors || '',
        hospital: d.hospital || '',
        examResult: d.examResult || 'PENDING',
        resultDetail: d.resultDetail || '',
        restrictionDetail: d.restrictionDetail || '',
        followUpRequired: d.followUpRequired ?? false,
        followUpDate: d.followUpDate || '',
        status: d.status || 'PENDING',
        notes: d.notes || '',
      })
      setViewMode('edit')
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm(t('occupationalExposure.prePlacementExam.confirmDelete'))
    if (confirmed) {
      deleteMutation.mutate(id)
    }
  }

  const handleBackToList = () => {
    setViewMode('list')
  }

  const handleSearch = () => {
    setSearchName(searchInput)
    setFilterYear('')
    setFilterStatus('')
    setPage(0)
  }

  const handleYearChange = (e: SelectChangeEvent<number | ''>) => {
    setFilterYear(e.target.value as number | '')
    setSearchName('')
    setSearchInput('')
    setFilterStatus('')
    setPage(0)
  }

  const handleStatusChange = (e: SelectChangeEvent<string>) => {
    setFilterStatus(e.target.value)
    setSearchName('')
    setSearchInput('')
    setFilterYear('')
    setPage(0)
  }

  const handleReset = () => {
    setSearchName('')
    setSearchInput('')
    setFilterYear('')
    setFilterStatus('')
    setPage(0)
  }

  const onSubmit = async (data: PrePlacementExamRequest) => {
    const confirmed = await showConfirm(t('common.confirmSave'))
    if (!confirmed) return

    const payload: PrePlacementExamRequest = {
      ...data,
      examDate: data.examDate || undefined,
      followUpDate: data.followUpDate || undefined,
    }
    if (viewMode === 'create') createMutation.mutate(payload)
    else if (viewMode === 'edit') updateMutation.mutate(payload)
  }

  // DEV ONLY — 비어있는 항목을 배치전건강진단 더미데이터로 채움 (입력값 보존)
  const fillTestData = () => {
    const v = getValues()
    if (!v.employeeId) setValue('employeeId', 'EMP-2001')
    if (!v.employeeName) setValue('employeeName', '이배치')
    if (!v.employeeDept) setValue('employeeDept', '생산2팀')
    if (!v.employeeEmail) setValue('employeeEmail', 'baechi.lee@yesco.co.kr')
    if (!v.examDate) setValue('examDate', new Date().toISOString().slice(0, 10))
    if (!v.targetJob) setValue('targetJob', '용접 작업')
    if (!v.hazardousFactors) setValue('hazardousFactors', '소음, 용접흄, 망간')
    if (!v.hospital) setValue('hospital', '서울근로자건강센터')
    if (!v.examResult || v.examResult === 'PENDING') setValue('examResult', 'FIT')
    if (!v.resultDetail) setValue('resultDetail', '해당 직무 수행에 의학적 이상 소견 없음')
    if (!v.restrictionDetail) setValue('restrictionDetail', '없음')
    if (!v.status || v.status === 'PENDING') setValue('status', 'COMPLETED')
    if (!v.notes) setValue('notes', '배치전건강진단 (테스트 데이터)')
  }

  // ==============================================
  // ===== LIST VIEW =====
  // ==============================================
  const renderListView = () => (
    <Box sx={{ overflow: 'hidden' }}>
      {/* Filters - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ListSearchBar
            placeholder={t('occupationalExposure.prePlacementExam.searchByName')}
            value={searchInput}
            onChange={setSearchInput}
            onSearch={handleSearch}
            sx={{ width: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select value={filterYear} onChange={handleYearChange} displayEmpty>
              <MenuItem value="">{t('occupationalExposure.prePlacementExam.filterByYear')}</MenuItem>
              {years.map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select value={filterStatus} onChange={handleStatusChange} displayEmpty>
              <MenuItem value="">{t('occupationalExposure.prePlacementExam.filterByStatus')}</MenuItem>
              {examStatusCodes.map((item) => (
                <MenuItem key={item.code} value={item.code}>{getLocalizedName(item)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton onClick={() => listQuery.refetch()} size="small">
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
          placeholder={t('occupationalExposure.prePlacementExam.searchByName')}
          value={searchInput}
          onChange={setSearchInput}
          onSearch={handleSearch}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <Select value={filterYear} onChange={handleYearChange} displayEmpty>
              <MenuItem value="">{t('occupationalExposure.prePlacementExam.filterByYear')}</MenuItem>
              {years.map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ flex: 1 }}>
            <Select value={filterStatus} onChange={handleStatusChange} displayEmpty>
              <MenuItem value="">{t('occupationalExposure.prePlacementExam.filterByStatus')}</MenuItem>
              {examStatusCodes.map((item) => (
                <MenuItem key={item.code} value={item.code}>{getLocalizedName(item)}</MenuItem>
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
        <Alert severity="error">{t('occupationalExposure.prePlacementExam.loadFailed')}</Alert>
      ) : (
        <>
          {/* Table - PC */}
          <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 900, '& .MuiTableCell-root': { borderColor: 'divider' } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold', width: 120, borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.prePlacementExam.employeeId')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 100, borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.prePlacementExam.employeeName')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 120, borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.prePlacementExam.employeeDept')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 100, borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.prePlacementExam.examYear')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.prePlacementExam.targetJob')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 100, borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.prePlacementExam.examResult')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 80, borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.prePlacementExam.status')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 110 }} align="center">{t('occupationalExposure.prePlacementExam.examDate')}</TableCell>
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
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{row.employeeId}</TableCell>
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{row.employeeName || ''}</TableCell>
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{row.employeeDept || ''}</TableCell>
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{row.examYear}</TableCell>
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{row.targetJob || ''}</TableCell>
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>
                        {row.examResult ? (
                          <Chip
                            label={examResultLabels[row.examResult] || row.examResult}
                            color={getExamResultColor(row.examResult)}
                            size="small"
                          />
                        ) : ''}
                      </TableCell>
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>
                        <Chip
                          label={examStatusLabels[row.status] || row.status}
                          color={getStatusColor(row.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">{formatDate(row.examDate)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">{t('occupationalExposure.prePlacementExam.noData')}</Typography>
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
                    <Typography fontWeight="bold" sx={{ flex: 1 }}>{row.employeeName || ''} ({row.employeeId})</Typography>
                    <Chip
                      label={examStatusLabels[row.status] || row.status}
                      color={getStatusColor(row.status)}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('occupationalExposure.prePlacementExam.employeeDept')}</Typography>
                      <Typography variant="body2">{row.employeeDept || ''}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('occupationalExposure.prePlacementExam.examYear')}</Typography>
                      <Typography variant="body2">{row.examYear}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('occupationalExposure.prePlacementExam.targetJob')}</Typography>
                      <Typography variant="body2">{row.targetJob || ''}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('occupationalExposure.prePlacementExam.examResult')}</Typography>
                      {row.examResult ? (
                        <Chip
                          label={examResultLabels[row.examResult] || row.examResult}
                          color={getExamResultColor(row.examResult)}
                          size="small"
                        />
                      ) : (
                        null
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('occupationalExposure.prePlacementExam.examDate')}</Typography>
                      <Typography variant="body2">{formatDate(row.examDate)}</Typography>
                    </Box>
                  </Box>
                </Paper>
              ))
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">{t('occupationalExposure.prePlacementExam.noData')}</Typography>
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
    if (!detailQuery.data) return <Alert severity="error">{t('occupationalExposure.prePlacementExam.loadFailed')}</Alert>

    const d = detailQuery.data

    return (
      <Box sx={{ overflow: 'hidden' }}>
        {/* ===== Detail Info - PC Table Form ===== */}
        <Paper sx={{ display: { xs: 'none', md: 'block' }, p: 3, bgcolor: 'grey.50', mb: 3 }}>
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={labelCellSx}>{t('occupationalExposure.prePlacementExam.employeeId')}</Typography>
            <Typography sx={valueCellBorderSx}>{d.employeeId}</Typography>
            <Typography sx={labelCellSx}>{t('occupationalExposure.prePlacementExam.employeeName')}</Typography>
            <Typography sx={valueCellSx}>{d.employeeName || ''}</Typography>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={labelCellSx}>{t('occupationalExposure.prePlacementExam.employeeDept')}</Typography>
            <Typography sx={valueCellBorderSx}>{d.employeeDept || ''}</Typography>
            <Typography sx={labelCellSx}>{t('occupationalExposure.prePlacementExam.employeeEmail')}</Typography>
            <Typography sx={valueCellSx}>{d.employeeEmail || ''}</Typography>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={labelCellSx}>{t('occupationalExposure.prePlacementExam.examYear')}</Typography>
            <Typography sx={valueCellBorderSx}>{d.examYear}</Typography>
            <Typography sx={labelCellSx}>{t('occupationalExposure.prePlacementExam.examDate')}</Typography>
            <Typography sx={valueCellSx}>{formatDate(d.examDate)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={labelCellSx}>{t('occupationalExposure.prePlacementExam.hospital')}</Typography>
            <Typography sx={valueCellBorderSx}>{d.hospital || ''}</Typography>
            <Typography sx={labelCellSx}>{t('occupationalExposure.prePlacementExam.targetJob')}</Typography>
            <Typography sx={valueCellSx}>{d.targetJob || ''}</Typography>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={labelCellSx}>{t('occupationalExposure.prePlacementExam.hazardousFactors')}</Typography>
            <Typography sx={{ ...valueCellSx, whiteSpace: 'pre-wrap' }}>{d.hazardousFactors || ''}</Typography>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={labelCellSx}>{t('occupationalExposure.prePlacementExam.examResult')}</Typography>
            <Box sx={valueCellBorderSx}>
              {d.examResult ? (
                <Chip
                  label={examResultLabels[d.examResult] || d.examResult}
                  color={getExamResultColor(d.examResult)}
                  size="small"
                />
              ) : ''}
            </Box>
            <Typography sx={labelCellSx}>{t('occupationalExposure.prePlacementExam.status')}</Typography>
            <Box sx={valueCellSx}>
              <Chip
                label={examStatusLabels[d.status] || d.status}
                color={getStatusColor(d.status)}
                size="small"
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={labelCellSx}>{t('occupationalExposure.prePlacementExam.resultDetail')}</Typography>
            <Typography sx={{ ...valueCellSx, whiteSpace: 'pre-wrap' }}>{d.resultDetail || ''}</Typography>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={labelCellSx}>{t('occupationalExposure.prePlacementExam.restrictionDetail')}</Typography>
            <Typography sx={{ ...valueCellSx, whiteSpace: 'pre-wrap' }}>{d.restrictionDetail || ''}</Typography>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={labelCellSx}>{t('occupationalExposure.prePlacementExam.followUpRequired')}</Typography>
            <Typography sx={valueCellBorderSx}>
              {d.followUpRequired ? t('common.yes') : t('common.no')}
            </Typography>
            <Typography sx={labelCellSx}>{t('occupationalExposure.prePlacementExam.followUpDate')}</Typography>
            <Typography sx={valueCellSx}>{formatDate(d.followUpDate)}</Typography>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Typography sx={labelCellSx}>{t('occupationalExposure.prePlacementExam.notes')}</Typography>
            <Typography sx={{ ...valueCellSx, whiteSpace: 'pre-wrap' }}>{d.notes || ''}</Typography>
          </Box>
        </Box>
        </Paper>

        {/* ===== Detail Info - Mobile ===== */}
        <Paper sx={{ display: { xs: 'block', md: 'none' }, p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { label: t('occupationalExposure.prePlacementExam.employeeId'), value: d.employeeId },
              { label: t('occupationalExposure.prePlacementExam.employeeName'), value: d.employeeName || '' },
              { label: t('occupationalExposure.prePlacementExam.employeeDept'), value: d.employeeDept || '' },
              { label: t('occupationalExposure.prePlacementExam.employeeEmail'), value: d.employeeEmail || '' },
              { label: t('occupationalExposure.prePlacementExam.examYear'), value: String(d.examYear) },
              { label: t('occupationalExposure.prePlacementExam.examDate'), value: formatDate(d.examDate) },
              { label: t('occupationalExposure.prePlacementExam.hospital'), value: d.hospital || '' },
              { label: t('occupationalExposure.prePlacementExam.targetJob'), value: d.targetJob || '' },
              { label: t('occupationalExposure.prePlacementExam.hazardousFactors'), value: d.hazardousFactors || '' },
              { label: t('occupationalExposure.prePlacementExam.resultDetail'), value: d.resultDetail || '' },
              { label: t('occupationalExposure.prePlacementExam.restrictionDetail'), value: d.restrictionDetail || '' },
              { label: t('occupationalExposure.prePlacementExam.followUpRequired'), value: d.followUpRequired ? t('common.yes') : t('common.no') },
              { label: t('occupationalExposure.prePlacementExam.followUpDate'), value: formatDate(d.followUpDate) },
              { label: t('occupationalExposure.prePlacementExam.notes'), value: d.notes || '' },
            ].map((item, idx) => (
              <Box key={idx}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                  {item.label}
                </Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>
                  {item.value}
                </Typography>
              </Box>
            ))}
            {/* Chips rendered separately for mobile */}
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('occupationalExposure.prePlacementExam.examResult')}
              </Typography>
              <Box sx={{ px: 1.5, py: 0.5 }}>
                {d.examResult ? (
                  <Chip
                    label={examResultLabels[d.examResult] || d.examResult}
                    color={getExamResultColor(d.examResult)}
                    size="small"
                  />
                ) : ''}
              </Box>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('occupationalExposure.prePlacementExam.status')}
              </Typography>
              <Box sx={{ px: 1.5, py: 0.5 }}>
                <Chip
                  label={examStatusLabels[d.status] || d.status}
                  color={getStatusColor(d.status)}
                  size="small"
                />
              </Box>
            </Box>
          </Box>
        </Paper>

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
          {/* Row 1: employeeId / employeeName */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={formLabelSx}>
              {t('occupationalExposure.prePlacementExam.employeeId')}
              <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={formValueSx}>
              <Controller
                name="employeeId"
                control={control}
                rules={{ required: true }}
                render={({ field, fieldState }) => (
                  <TextField {...field} size="small" fullWidth error={!!fieldState.error} placeholder={t('occupationalExposure.prePlacementExam.employeeId')} />
                )}
              />
            </Box>
            <Typography sx={formLabelSx}>{t('occupationalExposure.prePlacementExam.employeeName')}</Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller
                name="employeeName"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.prePlacementExam.employeeName')} />
                )}
              />
            </Box>
          </Box>
          {/* Row 2: employeeDept / employeeEmail */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={formLabelSx}>{t('occupationalExposure.prePlacementExam.employeeDept')}</Typography>
            <Box sx={formValueSx}>
              <Controller
                name="employeeDept"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.prePlacementExam.employeeDept')} />
                )}
              />
            </Box>
            <Typography sx={formLabelSx}>{t('occupationalExposure.prePlacementExam.employeeEmail')}</Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller
                name="employeeEmail"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.prePlacementExam.employeeEmail')} />
                )}
              />
            </Box>
          </Box>
          {/* Row 3: examYear / examDate */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={formLabelSx}>
              {t('occupationalExposure.prePlacementExam.examYear')}
              <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={formValueSx}>
              <Controller
                name="examYear"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    value={field.value || currentYear}
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
            <Typography sx={formLabelSx}>{t('occupationalExposure.prePlacementExam.examDate')}</Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller
                name="examDate"
                control={control}
                render={({ field }) => (
                  <DatePickerField value={field.value || ''} onChange={field.onChange} size="small" />
                )}
              />
            </Box>
          </Box>
          {/* Row 4: targetJob / hospital */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={formLabelSx}>{t('occupationalExposure.prePlacementExam.targetJob')}</Typography>
            <Box sx={formValueSx}>
              <Controller
                name="targetJob"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.prePlacementExam.targetJob')} />
                )}
              />
            </Box>
            <Typography sx={formLabelSx}>{t('occupationalExposure.prePlacementExam.hospital')}</Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller
                name="hospital"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.prePlacementExam.hospital')} />
                )}
              />
            </Box>
          </Box>
          {/* Row 5: hazardousFactors (full width) */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={formLabelSx}>{t('occupationalExposure.prePlacementExam.hazardousFactors')}</Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller
                name="hazardousFactors"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.prePlacementExam.hazardousFactors')} />
                )}
              />
            </Box>
          </Box>
          {/* Row 6: examResult / status */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={formLabelSx}>{t('occupationalExposure.prePlacementExam.examResult')}</Typography>
            <Box sx={formValueSx}>
              <Controller
                name="examResult"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || 'PENDING'}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    size="small"
                    fullWidth
                   displayEmpty>
                    <MenuItem value="" disabled>선택하세요</MenuItem>
                    {examResultCodes.map((item) => (
                      <MenuItem key={item.code} value={item.code}>{getLocalizedName(item)}</MenuItem>
                    ))}
                  </Select>
                )}
              />
            </Box>
            <Typography sx={formLabelSx}>{t('occupationalExposure.prePlacementExam.status')}</Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || 'PENDING'}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    size="small"
                    fullWidth
                   displayEmpty>
                    <MenuItem value="" disabled>선택하세요</MenuItem>
                    {examStatusCodes.map((item) => (
                      <MenuItem key={item.code} value={item.code}>{getLocalizedName(item)}</MenuItem>
                    ))}
                  </Select>
                )}
              />
            </Box>
          </Box>
          {/* Row 7: resultDetail (full width multiline) */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={formLabelSx}>{t('occupationalExposure.prePlacementExam.resultDetail')}</Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller
                name="resultDetail"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth multiline minRows={2} placeholder={t('occupationalExposure.prePlacementExam.resultDetail')} />
                )}
              />
            </Box>
          </Box>
          {/* Row 8: restrictionDetail (full width multiline) */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={formLabelSx}>{t('occupationalExposure.prePlacementExam.restrictionDetail')}</Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller
                name="restrictionDetail"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth multiline minRows={2} placeholder={t('occupationalExposure.prePlacementExam.restrictionDetail')} />
                )}
              />
            </Box>
          </Box>
          {/* Row 9: followUpRequired / followUpDate */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={formLabelSx}>{t('occupationalExposure.prePlacementExam.followUpRequired')}</Typography>
            <Box sx={{ ...formValueSx, display: 'flex', alignItems: 'center' }}>
              <Controller
                name="followUpRequired"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value ?? false} onChange={field.onChange} size="small" />
                )}
              />
            </Box>
            <Typography sx={formLabelSx}>{t('occupationalExposure.prePlacementExam.followUpDate')}</Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller
                name="followUpDate"
                control={control}
                render={({ field }) => (
                  <DatePickerField value={field.value || ''} onChange={field.onChange} size="small" />
                )}
              />
            </Box>
          </Box>
          {/* Row 10: notes (full width multiline) */}
          <Box sx={{ display: 'flex' }}>
            <Typography sx={formLabelSx}>{t('occupationalExposure.prePlacementExam.notes')}</Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth multiline minRows={2} placeholder={t('occupationalExposure.prePlacementExam.notes')} />
                )}
              />
            </Box>
          </Box>
        </Box>

        {/* Form - Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.prePlacementExam.employeeId')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Controller name="employeeId" control={control} rules={{ required: true }} render={({ field, fieldState }) => (
              <TextField {...field} size="small" fullWidth error={!!fieldState.error} placeholder={t('occupationalExposure.prePlacementExam.employeeId')} />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.prePlacementExam.employeeName')}
            </Typography>
            <Controller name="employeeName" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.prePlacementExam.employeeName')} />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.prePlacementExam.employeeDept')}
            </Typography>
            <Controller name="employeeDept" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.prePlacementExam.employeeDept')} />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.prePlacementExam.employeeEmail')}
            </Typography>
            <Controller name="employeeEmail" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.prePlacementExam.employeeEmail')} />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.prePlacementExam.examYear')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Controller name="examYear" control={control} rules={{ required: true }} render={({ field }) => (
              <Select value={field.value || currentYear} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} size="small" fullWidth displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {years.map((y) => (<MenuItem key={y} value={y}>{y}</MenuItem>))}
              </Select>
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.prePlacementExam.examDate')}
            </Typography>
            <Controller name="examDate" control={control} render={({ field }) => (
              <DatePickerField value={field.value || ''} onChange={field.onChange} size="small" />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.prePlacementExam.targetJob')}
            </Typography>
            <Controller name="targetJob" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.prePlacementExam.targetJob')} />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.prePlacementExam.hazardousFactors')}
            </Typography>
            <Controller name="hazardousFactors" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.prePlacementExam.hazardousFactors')} />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.prePlacementExam.hospital')}
            </Typography>
            <Controller name="hospital" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.prePlacementExam.hospital')} />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.prePlacementExam.examResult')}
            </Typography>
            <Controller name="examResult" control={control} render={({ field }) => (
              <Select value={field.value || 'PENDING'} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} size="small" fullWidth displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {examResultCodes.map((item) => (
                  <MenuItem key={item.code} value={item.code}>{getLocalizedName(item)}</MenuItem>
                ))}
              </Select>
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.prePlacementExam.resultDetail')}
            </Typography>
            <Controller name="resultDetail" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth multiline minRows={2} placeholder={t('occupationalExposure.prePlacementExam.resultDetail')} />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.prePlacementExam.restrictionDetail')}
            </Typography>
            <Controller name="restrictionDetail" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth multiline minRows={2} placeholder={t('occupationalExposure.prePlacementExam.restrictionDetail')} />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.prePlacementExam.followUpRequired')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Controller name="followUpRequired" control={control} render={({ field }) => (
                <Switch checked={field.value ?? false} onChange={field.onChange} size="small" />
              )} />
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.prePlacementExam.followUpDate')}
            </Typography>
            <Controller name="followUpDate" control={control} render={({ field }) => (
              <DatePickerField value={field.value || ''} onChange={field.onChange} size="small" />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.prePlacementExam.status')}
            </Typography>
            <Controller name="status" control={control} render={({ field }) => (
              <Select value={field.value || 'PENDING'} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} size="small" fullWidth displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {examStatusCodes.map((item) => (
                  <MenuItem key={item.code} value={item.code}>{getLocalizedName(item)}</MenuItem>
                ))}
              </Select>
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.prePlacementExam.notes')}
            </Typography>
            <Controller name="notes" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth multiline minRows={2} placeholder={t('occupationalExposure.prePlacementExam.notes')} />
            )} />
          </Box>
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

export default PrePlacementExamTab
