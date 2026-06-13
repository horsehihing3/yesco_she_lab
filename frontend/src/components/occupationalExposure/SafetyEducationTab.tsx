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
import EditNoteIcon from '@mui/icons-material/EditNote'
import { useForm, Controller } from 'react-hook-form'
import DatePickerField from '../common/DatePickerField'
import NumberField from '../common/NumberField'
import { useAlert } from '../../contexts/AlertContext'
import axiosInstance from '../../api/axiosInstance'
import { ApiResponse, PageResponse } from '../../types/common.types'
import {
  SafetyEducation,
  SafetyEducationAttendee,
  SafetyEducationRequest,
  SafetyEducationAttendeeRequest,
  EducationType,
  EducationStatus,
} from '../../types/occupationalExposure.types'
import useCodeMap from '../../hooks/useCodeMap'
import LoadingOverlay from '../common/LoadingOverlay'
import DevTestFillButton from '../common/DevTestFillButton'

// ===== Style Constants =====
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


// ===== Helper Functions =====
type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const getStatusColor = (status: EducationStatus): 'info' | 'success' | 'default' => {
  switch (status) {
    case 'PLANNED': return 'info'
    case 'COMPLETED': return 'success'
    case 'CANCELLED': return 'default'
    default: return 'default'
  }
}


// ===== API Functions =====
const fetchEducations = async (page: number, size: number): Promise<PageResponse<SafetyEducation>> => {
  const response = await axiosInstance.get<ApiResponse<PageResponse<SafetyEducation>>>('/safety-education', {
    params: { page, size, sort: 'createdAt,desc' },
  })
  return response.data.data
}

const fetchEducationById = async (id: number): Promise<SafetyEducation> => {
  const response = await axiosInstance.get<ApiResponse<SafetyEducation>>(`/safety-education/${id}`)
  return response.data.data
}

const searchEducations = async (title: string, page: number, size: number): Promise<PageResponse<SafetyEducation>> => {
  const response = await axiosInstance.get<ApiResponse<PageResponse<SafetyEducation>>>('/safety-education/search', {
    params: { title, page, size },
  })
  return response.data.data
}

const fetchByYear = async (year: number, page: number, size: number): Promise<PageResponse<SafetyEducation>> => {
  const response = await axiosInstance.get<ApiResponse<PageResponse<SafetyEducation>>>(`/safety-education/year/${year}`, {
    params: { page, size },
  })
  return response.data.data
}

const fetchByType = async (type: EducationType, page: number, size: number): Promise<PageResponse<SafetyEducation>> => {
  const response = await axiosInstance.get<ApiResponse<PageResponse<SafetyEducation>>>(`/safety-education/type/${type}`, {
    params: { page, size },
  })
  return response.data.data
}

const createEducation = async (data: SafetyEducationRequest): Promise<SafetyEducation> => {
  const response = await axiosInstance.post<ApiResponse<SafetyEducation>>('/safety-education', data)
  return response.data.data
}

const updateEducation = async (id: number, data: SafetyEducationRequest): Promise<SafetyEducation> => {
  const response = await axiosInstance.put<ApiResponse<SafetyEducation>>(`/safety-education/${id}`, data)
  return response.data.data
}

const deleteEducation = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/safety-education/${id}`)
}

const signAttendee = async (educationId: number, attendeeId: number): Promise<SafetyEducationAttendee> => {
  const response = await axiosInstance.patch<ApiResponse<SafetyEducationAttendee>>(
    `/safety-education/${educationId}/attendees/${attendeeId}/sign`
  )
  return response.data.data
}

const removeAttendee = async (educationId: number, attendeeId: number): Promise<void> => {
  await axiosInstance.delete(`/safety-education/${educationId}/attendees/${attendeeId}`)
}

const addAttendeeBulk = async (educationId: number, attendees: SafetyEducationAttendeeRequest[]): Promise<SafetyEducationAttendee[]> => {
  const response = await axiosInstance.post<ApiResponse<SafetyEducationAttendee[]>>(
    `/safety-education/${educationId}/attendees/bulk`,
    attendees
  )
  return response.data.data
}

// ===== Empty Attendee Row =====
const emptyAttendeeRow = (): SafetyEducationAttendeeRequest => ({
  attendeeName: '',
  attendeeEmail: '',
  attendeeDept: '',
  attendeeCompany: '',
  employeeId: '',
})

// ===== Main Component =====
const SafetyEducationTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showAlert, showConfirm, showSuccess } = useAlert()
  const { codeMap: educationTypeLabels, codeList: educationTypeCodes, getLocalizedName } = useCodeMap('EDUCATION_TYPE')
  const { codeMap: statusLabels, codeList: statusCodes } = useCodeMap('EDUCATION_STATUS')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [searchTitle, setSearchTitle] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filterYear, setFilterYear] = useState<number | ''>('')
  const [filterType, setFilterType] = useState<string>('')
  const [attendeeRows, setAttendeeRows] = useState<SafetyEducationAttendeeRequest[]>([])

  // ===== Queries =====
  const listQuery = useQuery({
    queryKey: ['safetyEducations', page, pageSize, searchTitle, filterYear, filterType],
    queryFn: () => {
      if (searchTitle) return searchEducations(searchTitle, page, pageSize)
      if (filterYear) return fetchByYear(filterYear as number, page, pageSize)
      if (filterType) return fetchByType(filterType as EducationType, page, pageSize)
      return fetchEducations(page, pageSize)
    },
    enabled: viewMode === 'list',
  })

  const detailQuery = useQuery({
    queryKey: ['safetyEducation', selectedId],
    queryFn: () => fetchEducationById(selectedId!),
    enabled: !!selectedId && (viewMode === 'detail' || viewMode === 'edit'),
  })

  // ===== Mutations =====
  const createMutation = useMutation({
    mutationFn: createEducation,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['safetyEducations'] })
      await showSuccess(t('common.saveSuccess'))
      setViewMode('list')
    },
    onError: () => showAlert('error', t('occupationalExposure.safetyEducation.loadFailed')),
  })

  const updateMutation = useMutation({
    mutationFn: (data: SafetyEducationRequest) => updateEducation(selectedId!, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['safetyEducations'] })
      queryClient.invalidateQueries({ queryKey: ['safetyEducation', selectedId] })
      await showSuccess(t('common.saveSuccess'))
      setViewMode('list')
    },
    onError: () => showAlert('error', t('occupationalExposure.safetyEducation.loadFailed')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEducation,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['safetyEducations'] })
      await showSuccess(t('common.deleteSuccess'))
      setViewMode('list')
    },
    onError: () => showAlert('error', t('occupationalExposure.safetyEducation.loadFailed')),
  })

  const signAttendeeMutation = useMutation({
    mutationFn: ({ educationId, attendeeId }: { educationId: number; attendeeId: number }) =>
      signAttendee(educationId, attendeeId),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['safetyEducation', selectedId] })
      await showSuccess(t('occupationalExposure.safetyEducation.signSuccess'))
    },
    onError: () => showAlert('error', t('occupationalExposure.safetyEducation.signFailed')),
  })

  const removeAttendeeMutation = useMutation({
    mutationFn: ({ educationId, attendeeId }: { educationId: number; attendeeId: number }) =>
      removeAttendee(educationId, attendeeId),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['safetyEducation', selectedId] })
      await showSuccess(t('common.deleteSuccess'))
    },
    onError: () => showAlert('error', t('occupationalExposure.safetyEducation.loadFailed')),
  })

  const isProcessing = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  // ===== Form =====
  const { control, handleSubmit, reset, getValues, setValue } = useForm<SafetyEducationRequest>({
    defaultValues: {
      title: '',
      educationType: 'REGULAR',
      educationCategory: '',
      educationDate: '',
      educationHours: undefined,
      location: '',
      instructorName: '',
      instructorOrg: '',
      hazardousFactors: '',
      educationContent: '',
      status: 'PLANNED',
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
      title: '',
      educationType: 'REGULAR',
      educationCategory: '',
      educationDate: '',
      educationHours: undefined,
      location: '',
      instructorName: '',
      instructorOrg: '',
      hazardousFactors: '',
      educationContent: '',
      status: 'PLANNED',
      notes: '',
    })
    setAttendeeRows([])
    setViewMode('create')
  }

  const handleEdit = () => {
    if (detailQuery.data) {
      const d = detailQuery.data
      reset({
        title: d.title,
        educationType: d.educationType,
        educationCategory: d.educationCategory || '',
        educationDate: d.educationDate || '',
        educationHours: d.educationHours,
        location: d.location || '',
        instructorName: d.instructorName || '',
        instructorOrg: d.instructorOrg || '',
        hazardousFactors: d.hazardousFactors || '',
        educationContent: d.educationContent || '',
        status: d.status,
        notes: d.notes || '',
      })
      setAttendeeRows(
        (d.attendees || []).map((a) => ({
          attendeeName: a.attendeeName || '',
          attendeeEmail: a.attendeeEmail || '',
          attendeeDept: a.attendeeDept || '',
          attendeeCompany: a.attendeeCompany || '',
          employeeId: a.employeeId || '',
        }))
      )
      setViewMode('edit')
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm(t('occupationalExposure.safetyEducation.confirmDelete'))
    if (confirmed) {
      deleteMutation.mutate(id)
    }
  }

  const handleBackToList = () => {
    setViewMode('list')
  }

  const handleSearch = () => {
    setSearchTitle(searchInput)
    setFilterYear('')
    setFilterType('')
    setPage(0)
  }

  const handleYearChange = (e: SelectChangeEvent<number | ''>) => {
    setFilterYear(e.target.value as number | '')
    setSearchTitle('')
    setSearchInput('')
    setFilterType('')
    setPage(0)
  }

  const handleTypeChange = (e: SelectChangeEvent<string>) => {
    setFilterType(e.target.value)
    setSearchTitle('')
    setSearchInput('')
    setFilterYear('')
    setPage(0)
  }

  const handleReset = () => {
    setSearchTitle('')
    setSearchInput('')
    setFilterYear('')
    setFilterType('')
    setPage(0)
  }

  const handleSignAttendee = async (attendeeId: number) => {
    if (!selectedId) return
    const confirmed = await showConfirm(t('occupationalExposure.safetyEducation.confirmSign'))
    if (confirmed) {
      signAttendeeMutation.mutate({ educationId: selectedId, attendeeId })
    }
  }

  const handleRemoveAttendee = async (attendeeId: number) => {
    if (!selectedId) return
    const confirmed = await showConfirm(t('occupationalExposure.safetyEducation.confirmRemoveAttendee'))
    if (confirmed) {
      removeAttendeeMutation.mutate({ educationId: selectedId, attendeeId })
    }
  }

  const handleAttendeeRowChange = (index: number, field: keyof SafetyEducationAttendeeRequest, value: string) => {
    setAttendeeRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const handleAddAttendeeRow = () => {
    setAttendeeRows((prev) => [...prev, emptyAttendeeRow()])
  }

  const handleRemoveAttendeeRow = (index: number) => {
    setAttendeeRows((prev) => prev.filter((_, i) => i !== index))
  }

  // DEV ONLY — 비어있는 항목을 안전보건교육 더미데이터로 채움 (입력값 보존)
  const fillTestData = () => {
    const v = getValues()
    if (!v.title) setValue('title', '2026년 상반기 정기 안전보건교육')
    if (!v.educationType) setValue('educationType', 'REGULAR')
    if (!v.educationCategory) setValue('educationCategory', '작업장 안전수칙')
    if (!v.educationDate) setValue('educationDate', new Date().toISOString().slice(0, 10))
    if (v.educationHours == null) setValue('educationHours', 6)
    if (!v.location) setValue('location', '본사 대강당')
    if (!v.instructorName) setValue('instructorName', '김안전')
    if (!v.instructorOrg) setValue('instructorOrg', '한국산업안전보건공단')
    if (!v.hazardousFactors) setValue('hazardousFactors', '소음, 분진, 추락')
    if (!v.educationContent) setValue('educationContent', '산업안전보건법 주요 내용 및 작업장 안전수칙 교육')
    if (!v.status) setValue('status', 'COMPLETED')
    if (!v.notes) setValue('notes', '정기 안전보건교육 (테스트 데이터)')
    setAttendeeRows((prev) => prev.length > 0 ? prev : [{
      attendeeName: '홍길동',
      attendeeEmail: 'gildong.hong@yesco.co.kr',
      attendeeDept: '생산1팀',
      attendeeCompany: '예스코',
      employeeId: 'EMP-1001',
    }])
  }

  const onSubmit = async (data: SafetyEducationRequest) => {
    const confirmed = await showConfirm(t('common.confirmSave'))
    if (!confirmed) return

    const validAttendees = attendeeRows.filter((r) => r.attendeeName)
    const payload: SafetyEducationRequest = {
      ...data,
      educationDate: data.educationDate || '',
      attendees: validAttendees.length > 0 ? validAttendees : undefined,
    }
    if (viewMode === 'create') createMutation.mutate(payload)
    else if (viewMode === 'edit') updateMutation.mutate(payload)
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
            placeholder={t('occupationalExposure.safetyEducation.searchByTitle')}
            value={searchInput}
            onChange={setSearchInput}
            onSearch={handleSearch}
            sx={{ width: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select value={filterYear} onChange={handleYearChange} displayEmpty>
              <MenuItem value="">{t('occupationalExposure.safetyEducation.filterByYear')}</MenuItem>
              {years.map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select value={filterType} onChange={handleTypeChange} displayEmpty>
              <MenuItem value="">{t('occupationalExposure.safetyEducation.filterByType')}</MenuItem>
              {educationTypeCodes.map((item) => (
                <MenuItem key={item.code} value={item.code}>{getLocalizedName(item)}</MenuItem>
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
          placeholder={t('occupationalExposure.safetyEducation.searchByTitle')}
          value={searchInput}
          onChange={setSearchInput}
          onSearch={handleSearch}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <Select value={filterYear} onChange={handleYearChange} displayEmpty>
              <MenuItem value="">{t('occupationalExposure.safetyEducation.filterByYear')}</MenuItem>
              {years.map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ flex: 1 }}>
            <Select value={filterType} onChange={handleTypeChange} displayEmpty>
              <MenuItem value="">{t('occupationalExposure.safetyEducation.filterByType')}</MenuItem>
              {educationTypeCodes.map((item) => (
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
        <Alert severity="error">{t('occupationalExposure.safetyEducation.loadFailed')}</Alert>
      ) : (
        <>
          {/* Table - PC */}
          <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 800, '& .MuiTableCell-root': { borderColor: 'divider' } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.safetyEducation.title')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 140, borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.safetyEducation.educationType')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 110, borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.safetyEducation.educationDate')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 100, borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.safetyEducation.educationHours')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 100, borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.safetyEducation.instructorName')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 100, borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.safetyEducation.attendeeCount')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 80 }} align="center">{t('occupationalExposure.safetyEducation.status')}</TableCell>
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
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{row.title}</TableCell>
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{educationTypeLabels[row.educationType] || row.educationType}</TableCell>
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{formatDate(row.educationDate)}</TableCell>
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{row.educationHours ?? ''}</TableCell>
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{row.instructorName || ''}</TableCell>
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{row.attendeeCount}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={statusLabels[row.status] || row.status}
                          color={getStatusColor(row.status)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">{t('occupationalExposure.safetyEducation.noData')}</Typography>
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
                    <Typography fontWeight="bold" sx={{ flex: 1 }}>{row.title}</Typography>
                    <Chip
                      label={statusLabels[row.status] || row.status}
                      color={getStatusColor(row.status)}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('occupationalExposure.safetyEducation.educationType')}</Typography>
                      <Typography variant="body2">{educationTypeLabels[row.educationType] || row.educationType}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('occupationalExposure.safetyEducation.educationDate')}</Typography>
                      <Typography variant="body2">{formatDate(row.educationDate)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('occupationalExposure.safetyEducation.instructorName')}</Typography>
                      <Typography variant="body2">{row.instructorName || ''}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('occupationalExposure.safetyEducation.attendeeCount')}</Typography>
                      <Typography variant="body2">{row.attendeeCount}</Typography>
                    </Box>
                  </Box>
                </Paper>
              ))
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">{t('occupationalExposure.safetyEducation.noData')}</Typography>
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
    if (!detailQuery.data) return <Alert severity="error">{t('occupationalExposure.safetyEducation.loadFailed')}</Alert>

    const d = detailQuery.data

    return (
      <Box sx={{ overflow: 'hidden' }}>
        {/* ===== Education Info - PC Table Form ===== */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'text.primary' }}>
          {t('occupationalExposure.safetyEducation.educationInfo')}
        </Typography>
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelCellSx}>{t('occupationalExposure.safetyEducation.title')}</Typography>
            <Typography sx={valueCellBorderSx}>{d.title}</Typography>
            <Typography sx={labelCellSx}>{t('occupationalExposure.safetyEducation.educationType')}</Typography>
            <Typography sx={valueCellSx}>{educationTypeLabels[d.educationType] || d.educationType}</Typography>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelCellSx}>{t('occupationalExposure.safetyEducation.educationCategory')}</Typography>
            <Typography sx={valueCellBorderSx}>{d.educationCategory || ''}</Typography>
            <Typography sx={labelCellSx}>{t('occupationalExposure.safetyEducation.educationDate')}</Typography>
            <Typography sx={valueCellSx}>{formatDate(d.educationDate)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelCellSx}>{t('occupationalExposure.safetyEducation.educationHours')}</Typography>
            <Typography sx={valueCellBorderSx}>{d.educationHours ?? ''}</Typography>
            <Typography sx={labelCellSx}>{t('occupationalExposure.safetyEducation.location')}</Typography>
            <Typography sx={valueCellSx}>{d.location || ''}</Typography>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelCellSx}>{t('occupationalExposure.safetyEducation.instructorName')}</Typography>
            <Typography sx={valueCellBorderSx}>{d.instructorName || ''}</Typography>
            <Typography sx={labelCellSx}>{t('occupationalExposure.safetyEducation.instructorOrg')}</Typography>
            <Typography sx={valueCellSx}>{d.instructorOrg || ''}</Typography>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelCellSx}>{t('occupationalExposure.safetyEducation.hazardousFactors')}</Typography>
            <Typography sx={{ ...valueCellSx, whiteSpace: 'pre-wrap' }}>{d.hazardousFactors || ''}</Typography>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelCellSx}>{t('occupationalExposure.safetyEducation.educationContent')}</Typography>
            <Typography sx={{ ...valueCellSx, whiteSpace: 'pre-wrap' }}>{d.educationContent || ''}</Typography>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelCellSx}>{t('occupationalExposure.safetyEducation.attendeeCount')}</Typography>
            <Typography sx={valueCellBorderSx}>{d.attendeeCount}</Typography>
            <Typography sx={labelCellSx}>{t('occupationalExposure.safetyEducation.status')}</Typography>
            <Box sx={valueCellSx}>
              <Chip label={statusLabels[d.status] || d.status} color={getStatusColor(d.status)} size="small" />
            </Box>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Typography sx={labelCellSx}>{t('occupationalExposure.safetyEducation.notes')}</Typography>
            <Typography sx={{ ...valueCellSx, whiteSpace: 'pre-wrap' }}>{d.notes || ''}</Typography>
          </Box>
        </Box>

        {/* ===== Education Info - Mobile ===== */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { label: t('occupationalExposure.safetyEducation.title'), value: d.title },
              { label: t('occupationalExposure.safetyEducation.educationType'), value: educationTypeLabels[d.educationType] || d.educationType },
              { label: t('occupationalExposure.safetyEducation.educationCategory'), value: d.educationCategory || '' },
              { label: t('occupationalExposure.safetyEducation.educationDate'), value: formatDate(d.educationDate) },
              { label: t('occupationalExposure.safetyEducation.educationHours'), value: String(d.educationHours ?? '') },
              { label: t('occupationalExposure.safetyEducation.location'), value: d.location || '' },
              { label: t('occupationalExposure.safetyEducation.instructorName'), value: d.instructorName || '' },
              { label: t('occupationalExposure.safetyEducation.instructorOrg'), value: d.instructorOrg || '' },
              { label: t('occupationalExposure.safetyEducation.hazardousFactors'), value: d.hazardousFactors || '' },
              { label: t('occupationalExposure.safetyEducation.educationContent'), value: d.educationContent || '' },
              { label: t('occupationalExposure.safetyEducation.attendeeCount'), value: String(d.attendeeCount) },
              { label: t('occupationalExposure.safetyEducation.notes'), value: d.notes || '' },
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
          </Box>
        </Box>

        {/* ===== Attendees Section ===== */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          {t('occupationalExposure.safetyEducation.attendeesSection')}
        </Typography>

        <Box sx={{ mb: 3 }}>
        {/* Attendees - PC Table */}
        <TableContainer sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <Table size="small" sx={{ minWidth: 800, '& .MuiTableCell-root': { borderColor: 'divider' } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.safetyEducation.attendeeName')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.safetyEducation.attendeeEmail')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', width: 120 }} align="center">{t('occupationalExposure.safetyEducation.attendeeDept')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', width: 120 }} align="center">{t('occupationalExposure.safetyEducation.attendeeCompany')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', width: 100 }} align="center">{t('occupationalExposure.safetyEducation.isSigned')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', width: 110 }} align="center">{t('occupationalExposure.safetyEducation.signatureDate')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 160 }} align="center">{t('occupationalExposure.safetyEducation.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {d.attendees && d.attendees.length > 0 ? (
                d.attendees.map((attendee) => (
                  <TableRow key={attendee.id} hover>
                    <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{attendee.attendeeName || ''}</TableCell>
                    <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{attendee.attendeeEmail || ''}</TableCell>
                    <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{attendee.attendeeDept || ''}</TableCell>
                    <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{attendee.attendeeCompany || ''}</TableCell>
                    <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>
                      <Chip
                        label={attendee.isSigned
                          ? t('occupationalExposure.safetyEducation.signed')
                          : t('occupationalExposure.safetyEducation.unsigned')}
                        color={attendee.isSigned ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{formatDate(attendee.signatureDate)}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        {!attendee.isSigned && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleSignAttendee(attendee.id)}
                            disabled={signAttendeeMutation.isPending}
                            startIcon={<EditNoteIcon />}
                          >
                            {t('occupationalExposure.safetyEducation.sign')}
                          </Button>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveAttendee(attendee.id)}
                          disabled={removeAttendeeMutation.isPending}
                          sx={{ color: 'text.primary' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">{t('occupationalExposure.safetyEducation.noAttendees')}</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Attendees - Mobile Cards */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, mb: 3 }}>
          {d.attendees && d.attendees.length > 0 ? (
            d.attendees.map((attendee) => (
              <Paper key={attendee.id} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography fontWeight="bold">{attendee.attendeeName || ''}</Typography>
                  <Chip
                    label={attendee.isSigned
                      ? t('occupationalExposure.safetyEducation.signed')
                      : t('occupationalExposure.safetyEducation.unsigned')}
                    color={attendee.isSigned ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('occupationalExposure.safetyEducation.attendeeEmail')}</Typography>
                    <Typography variant="body2">{attendee.attendeeEmail || ''}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('occupationalExposure.safetyEducation.attendeeDept')}</Typography>
                    <Typography variant="body2">{attendee.attendeeDept || ''}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('occupationalExposure.safetyEducation.attendeeCompany')}</Typography>
                    <Typography variant="body2">{attendee.attendeeCompany || ''}</Typography>
                  </Box>
                  {attendee.signatureDate && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('occupationalExposure.safetyEducation.signatureDate')}</Typography>
                      <Typography variant="body2">{formatDate(attendee.signatureDate)}</Typography>
                    </Box>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 1.5, justifyContent: 'flex-end' }}>
                  {!attendee.isSigned && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleSignAttendee(attendee.id)}
                      disabled={signAttendeeMutation.isPending}
                      startIcon={<EditNoteIcon />}
                    >
                      {t('occupationalExposure.safetyEducation.sign')}
                    </Button>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveAttendee(attendee.id)}
                    disabled={removeAttendeeMutation.isPending}
                    sx={{ color: 'text.primary' }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Paper>
            ))
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">{t('occupationalExposure.safetyEducation.noAttendees')}</Typography>
            </Paper>
          )}
        </Box>
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
              {t('occupationalExposure.safetyEducation.title')}
              <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={formValueSx}>
              <Controller
                name="title"
                control={control}
                rules={{ required: true }}
                render={({ field, fieldState }) => (
                  <TextField {...field} size="small" fullWidth error={!!fieldState.error} placeholder={t('occupationalExposure.safetyEducation.title')} />
                )}
              />
            </Box>
            <Typography sx={formLabelSx}>
              {t('occupationalExposure.safetyEducation.educationType')}
              <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller
                name="educationType"
                control={control}
                rules={{ required: true }}
                render={({ field, fieldState }) => (
                  <Select
                    value={field.value || 'REGULAR'}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    size="small"
                    fullWidth
                    error={!!fieldState.error}
                   displayEmpty>
                    <MenuItem value="" disabled>선택하세요</MenuItem>
                    {educationTypeCodes.map((item) => (
                      <MenuItem key={item.code} value={item.code}>{getLocalizedName(item)}</MenuItem>
                    ))}
                  </Select>
                )}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={formLabelSx}>{t('occupationalExposure.safetyEducation.educationCategory')}</Typography>
            <Box sx={formValueSx}>
              <Controller
                name="educationCategory"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.safetyEducation.educationCategory')} />
                )}
              />
            </Box>
            <Typography sx={formLabelSx}>
              {t('occupationalExposure.safetyEducation.educationDate')}
              <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller
                name="educationDate"
                control={control}
                rules={{ required: true }}
                render={({ field, fieldState }) => (
                  <DatePickerField value={field.value || ''} onChange={field.onChange} size="small" error={!!fieldState.error} />
                )}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={formLabelSx}>{t('occupationalExposure.safetyEducation.educationHours')}</Typography>
            <Box sx={formValueSx}>
              <Controller
                name="educationHours"
                control={control}
                render={({ field }) => (
                  <NumberField
                    value={field.value ?? ''}
                    onChange={(v) => field.onChange(v ?? undefined)}
                    size="small"
                    fullWidth
                    placeholder={t('occupationalExposure.safetyEducation.educationHours')}
                  />
                )}
              />
            </Box>
            <Typography sx={formLabelSx}>{t('occupationalExposure.safetyEducation.location')}</Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.safetyEducation.location')} />
                )}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={formLabelSx}>{t('occupationalExposure.safetyEducation.instructorName')}</Typography>
            <Box sx={formValueSx}>
              <Controller
                name="instructorName"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.safetyEducation.instructorName')} />
                )}
              />
            </Box>
            <Typography sx={formLabelSx}>{t('occupationalExposure.safetyEducation.instructorOrg')}</Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller
                name="instructorOrg"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.safetyEducation.instructorOrg')} />
                )}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={formLabelSx}>{t('occupationalExposure.safetyEducation.hazardousFactors')}</Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller
                name="hazardousFactors"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.safetyEducation.hazardousFactors')} />
                )}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={formLabelSx}>{t('occupationalExposure.safetyEducation.educationContent')}</Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller
                name="educationContent"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth multiline minRows={3} placeholder={t('occupationalExposure.safetyEducation.educationContent')} />
                )}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={formLabelSx}>{t('occupationalExposure.safetyEducation.status')}</Typography>
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
            <Typography sx={formLabelSx}>{t('occupationalExposure.safetyEducation.notes')}</Typography>
            <Box sx={{ ...formValueSx, borderRight: 0 }}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth multiline minRows={2} placeholder={t('occupationalExposure.safetyEducation.notes')} />
                )}
              />
            </Box>
          </Box>
        </Box>

        {/* Form - Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.safetyEducation.title')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Controller name="title" control={control} rules={{ required: true }} render={({ field, fieldState }) => (
              <TextField {...field} size="small" fullWidth error={!!fieldState.error} placeholder={t('occupationalExposure.safetyEducation.title')} />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.safetyEducation.educationType')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Controller name="educationType" control={control} rules={{ required: true }} render={({ field, fieldState }) => (
              <Select value={field.value || 'REGULAR'} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} size="small" fullWidth error={!!fieldState.error} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {educationTypeCodes.map((item) => (
                  <MenuItem key={item.code} value={item.code}>{getLocalizedName(item)}</MenuItem>
                ))}
              </Select>
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.safetyEducation.educationCategory')}
            </Typography>
            <Controller name="educationCategory" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.safetyEducation.educationCategory')} />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.safetyEducation.educationDate')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Controller name="educationDate" control={control} rules={{ required: true }} render={({ field, fieldState }) => (
              <DatePickerField value={field.value || ''} onChange={field.onChange} size="small" error={!!fieldState.error} />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.safetyEducation.educationHours')}
            </Typography>
            <Controller name="educationHours" control={control} render={({ field }) => (
              <NumberField
                value={field.value ?? ''}
                onChange={(v) => field.onChange(v ?? undefined)}
                size="small"
                fullWidth
                placeholder={t('occupationalExposure.safetyEducation.educationHours')}
              />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.safetyEducation.location')}
            </Typography>
            <Controller name="location" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.safetyEducation.location')} />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.safetyEducation.instructorName')}
            </Typography>
            <Controller name="instructorName" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.safetyEducation.instructorName')} />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.safetyEducation.instructorOrg')}
            </Typography>
            <Controller name="instructorOrg" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.safetyEducation.instructorOrg')} />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.safetyEducation.hazardousFactors')}
            </Typography>
            <Controller name="hazardousFactors" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.safetyEducation.hazardousFactors')} />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.safetyEducation.educationContent')}
            </Typography>
            <Controller name="educationContent" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth multiline minRows={3} placeholder={t('occupationalExposure.safetyEducation.educationContent')} />
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.safetyEducation.status')}
            </Typography>
            <Controller name="status" control={control} render={({ field }) => (
              <Select value={field.value || 'PLANNED'} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} size="small" fullWidth displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {statusCodes.map((item) => (
                  <MenuItem key={item.code} value={item.code}>{getLocalizedName(item)}</MenuItem>
                ))}
              </Select>
            )} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('occupationalExposure.safetyEducation.notes')}
            </Typography>
            <Controller name="notes" control={control} render={({ field }) => (
              <TextField {...field} size="small" fullWidth multiline minRows={2} placeholder={t('occupationalExposure.safetyEducation.notes')} />
            )} />
          </Box>
        </Box>

        {/* ===== Attendees Section (Editable) ===== */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {t('occupationalExposure.safetyEducation.attendeesSection')}
          </Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={handleAddAttendeeRow}>
            {t('occupationalExposure.safetyEducation.addAttendee')}
          </Button>
        </Box>

        {/* Attendees Editable Table - PC */}
        <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', overflowX: 'auto', mb: 3 }}>
          <Table size="small" sx={{ minWidth: 700, '& .MuiTableCell-root': { borderColor: 'divider' } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.safetyEducation.attendeeName')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.safetyEducation.attendeeEmail')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', width: 120 }} align="center">{t('occupationalExposure.safetyEducation.attendeeDept')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', width: 120 }} align="center">{t('occupationalExposure.safetyEducation.attendeeCompany')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', width: 120 }} align="center">{t('occupationalExposure.safetyEducation.employeeId')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 60 }} align="center">{t('common.delete')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendeeRows.length > 0 ? (
                attendeeRows.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ borderRight: 1, borderColor: 'divider', p: 0.5 }}>
                      <TextField
                        value={row.attendeeName}
                        onChange={(e) => handleAttendeeRowChange(idx, 'attendeeName', e.target.value)}
                        size="small"
                        fullWidth
                        placeholder={t('occupationalExposure.safetyEducation.attendeeName')}
                      />
                    </TableCell>
                    <TableCell sx={{ borderRight: 1, borderColor: 'divider', p: 0.5 }}>
                      <TextField
                        value={row.attendeeEmail}
                        onChange={(e) => handleAttendeeRowChange(idx, 'attendeeEmail', e.target.value)}
                        size="small"
                        fullWidth
                        placeholder={t('occupationalExposure.safetyEducation.attendeeEmail')}
                      />
                    </TableCell>
                    <TableCell sx={{ borderRight: 1, borderColor: 'divider', p: 0.5 }}>
                      <TextField
                        value={row.attendeeDept}
                        onChange={(e) => handleAttendeeRowChange(idx, 'attendeeDept', e.target.value)}
                        size="small"
                        fullWidth
                        placeholder={t('occupationalExposure.safetyEducation.attendeeDept')}
                      />
                    </TableCell>
                    <TableCell sx={{ borderRight: 1, borderColor: 'divider', p: 0.5 }}>
                      <TextField
                        value={row.attendeeCompany}
                        onChange={(e) => handleAttendeeRowChange(idx, 'attendeeCompany', e.target.value)}
                        size="small"
                        fullWidth
                        placeholder={t('occupationalExposure.safetyEducation.attendeeCompany')}
                      />
                    </TableCell>
                    <TableCell sx={{ borderRight: 1, borderColor: 'divider', p: 0.5 }}>
                      <TextField
                        value={row.employeeId}
                        onChange={(e) => handleAttendeeRowChange(idx, 'employeeId', e.target.value)}
                        size="small"
                        fullWidth
                        placeholder={t('occupationalExposure.safetyEducation.employeeId')}
                      />
                    </TableCell>
                    <TableCell sx={{ p: 0.5 }} align="center">
                      <IconButton size="small" onClick={() => handleRemoveAttendeeRow(idx)} sx={{ color: 'text.primary' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">{t('occupationalExposure.safetyEducation.noAttendees')}</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Attendees Editable - Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, mb: 3 }}>
          {attendeeRows.length > 0 ? (
            attendeeRows.map((row, idx) => (
              <Paper key={idx} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="body2" fontWeight="bold">
                    {t('occupationalExposure.safetyEducation.attendee')} #{idx + 1}
                  </Typography>
                  <IconButton size="small" onClick={() => handleRemoveAttendeeRow(idx)} sx={{ color: 'text.primary' }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <TextField
                    value={row.attendeeName}
                    onChange={(e) => handleAttendeeRowChange(idx, 'attendeeName', e.target.value)}
                    size="small"
                    fullWidth
                    label={t('occupationalExposure.safetyEducation.attendeeName')}
                  />
                  <TextField
                    value={row.attendeeEmail}
                    onChange={(e) => handleAttendeeRowChange(idx, 'attendeeEmail', e.target.value)}
                    size="small"
                    fullWidth
                    label={t('occupationalExposure.safetyEducation.attendeeEmail')}
                  />
                  <TextField
                    value={row.attendeeDept}
                    onChange={(e) => handleAttendeeRowChange(idx, 'attendeeDept', e.target.value)}
                    size="small"
                    fullWidth
                    label={t('occupationalExposure.safetyEducation.attendeeDept')}
                  />
                  <TextField
                    value={row.attendeeCompany}
                    onChange={(e) => handleAttendeeRowChange(idx, 'attendeeCompany', e.target.value)}
                    size="small"
                    fullWidth
                    label={t('occupationalExposure.safetyEducation.attendeeCompany')}
                  />
                  <TextField
                    value={row.employeeId}
                    onChange={(e) => handleAttendeeRowChange(idx, 'employeeId', e.target.value)}
                    size="small"
                    fullWidth
                    label={t('occupationalExposure.safetyEducation.employeeId')}
                  />
                </Box>
              </Paper>
            ))
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">{t('occupationalExposure.safetyEducation.noAttendees')}</Typography>
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

export default SafetyEducationTab
