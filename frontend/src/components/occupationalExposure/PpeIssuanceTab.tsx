import { useState, useEffect, useCallback } from 'react'
import { isSystemAdmin } from '../../utils/auth'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import {
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Pagination,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Radio,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import axiosInstance from '../../api/axiosInstance'
import { PpeIssuance, PpeIssuanceRequest } from '../../types/occupationalExposure.types'
import { ApiResponse, PageResponse, FileMetadata } from '../../types/common.types'
import DatePickerField from '../common/DatePickerField'
import NumberField from '../common/NumberField'
import useCodeMap from '../../hooks/useCodeMap'
import LoadingOverlay from '../common/LoadingOverlay'
import DevTestFillButton from '../common/DevTestFillButton'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

// Style constants
const labelCellSx = {
  width: 128, minWidth: 128, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: 'divider',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center',
}
const valueCellSx = { flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem' }
const valueCellBorderSx = { ...valueCellSx, borderRight: 1, borderColor: 'divider' }
const formLabelSx = { ...labelCellSx, width: 100, minWidth: 100 }
const formValueSx = { flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }

// API functions
const fetchIssuances = async (params: { page: number; size: number; name?: string }): Promise<PageResponse<PpeIssuance>> => {
  const { page, size, name } = params
  let url = '/ppe-issuance'
  const queryParams = new URLSearchParams()
  queryParams.append('page', String(page))
  queryParams.append('size', String(size))

  if (name) {
    url = '/ppe-issuance/search'
    queryParams.append('name', name)
  }

  const response = await axiosInstance.get<ApiResponse<PageResponse<PpeIssuance>>>(`${url}?${queryParams.toString()}`)
  return response.data.data
}

const fetchIssuanceDetail = async (id: number): Promise<PpeIssuance> => {
  const response = await axiosInstance.get<ApiResponse<PpeIssuance>>(`/ppe-issuance/${id}`)
  return response.data.data
}

const createIssuance = async (data: PpeIssuanceRequest): Promise<PpeIssuance> => {
  const response = await axiosInstance.post<ApiResponse<PpeIssuance>>('/ppe-issuance', data)
  return response.data.data
}

const updateIssuance = async ({ id, data }: { id: number; data: PpeIssuanceRequest }): Promise<PpeIssuance> => {
  const response = await axiosInstance.put<ApiResponse<PpeIssuance>>(`/ppe-issuance/${id}`, data)
  return response.data.data
}

const signIssuance = async (id: number): Promise<PpeIssuance> => {
  const response = await axiosInstance.patch<ApiResponse<PpeIssuance>>(`/ppe-issuance/${id}/sign`)
  return response.data.data
}

const deleteIssuance = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/ppe-issuance/${id}`)
}

const PpeIssuanceTab: React.FC = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { showSuccess, showConfirm } = useAlert()
  const { codeList: ppeTypeCodes, getLabel: getPpeTypeLabel, getLocalizedName } = useCodeMap('PPE_TYPE')

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedIssuance, setSelectedIssuance] = useState<PpeIssuance | null>(null)

  // List filters
  const [searchName, setSearchName] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(0)
  const rowsPerPage = 10

  const { user } = useAuth()
  const isAdmin = isSystemAdmin(user)
  const { canSee } = useButtonRules()
  const MENU = '안전 관리 › 보호구 장비 › 지급 신청'
  const getItemRoles = (item: { authorName?: string } | null): string[] => {
    const roles: string[] = ['guest']
    if (isAdmin) roles.push('superAdmin')
    else if (user?.role) roles.push(user.role)
    if (item?.authorName && user?.name && item.authorName === user.name) roles.push('writer')
    return roles
  }

  // PC/모바일 레이아웃을 CSS(display)로만 토글하면 두 레이아웃이 동시에 마운트돼
  // react-hook-form register/Controller가 같은 name으로 2번 등록 → 숨겨진(빈) 입력을 읽어
  // 입력값이 빈값으로 저장되는 데이터 손실 버그. 화면 폭에 따라 한 레이아웃만 마운트한다.
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true })

  // Form
  const { control, handleSubmit, reset, watch, setValue, getValues } = useForm<PpeIssuanceRequest>({
    defaultValues: {
      employeeId: '',
      employeeName: '',
      employeeDept: '',
      employeeEmail: '',
      ppeType: '',
      ppeName: '',
      ppeModel: '',
      ppeImageFileId: undefined,
      quantity: 1,
      issuanceDate: '',
      expiryDate: '',
      hazardousFactor: '',
      issuanceReason: '',
      notes: '',
    },
  })

  // PPE Image states
  const [ppeImageOptions, setPpeImageOptions] = useState<FileMetadata[]>([])
  const [imageThumbnails, setImageThumbnails] = useState<Record<number, string>>({})

  const watchedPpeType = watch('ppeType')

  const loadPpeTypeImages = useCallback(async (ppeTypeCode: string) => {
    if (!ppeTypeCode) {
      setPpeImageOptions([])
      setImageThumbnails({})
      return
    }
    const codeDetail = ppeTypeCodes.find((item) => item.code === ppeTypeCode)
    if (!codeDetail) {
      setPpeImageOptions([])
      setImageThumbnails({})
      return
    }
    try {
      const res = await axiosInstance.get<ApiResponse<FileMetadata[]>>(
        `/files/by-entity/CODE_DETAIL_IMAGE/${codeDetail.id}`
      )
      const files = res.data.data || []
      setPpeImageOptions(files)
      // Load all thumbnails
      const thumbMap: Record<number, string> = {}
      await Promise.all(
        files.map(async (f) => {
          try {
            const r = await axiosInstance.get<ApiResponse<{ filename: string; contentType: string; content: string }>>(
              `/files/${f.id}/base64`
            )
            thumbMap[f.id] = `data:${r.data.data.contentType};base64,${r.data.data.content}`
          } catch { /* ignore */ }
        })
      )
      setImageThumbnails(thumbMap)
    } catch {
      setPpeImageOptions([])
      setImageThumbnails({})
    }
  }, [ppeTypeCodes])

  useEffect(() => {
    if (watchedPpeType && (viewMode === 'create' || viewMode === 'edit')) {
      loadPpeTypeImages(watchedPpeType)
    }
  }, [watchedPpeType, viewMode, loadPpeTypeImages])

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: ['ppeIssuances', page, searchName],
    queryFn: () =>
      fetchIssuances({
        page,
        size: rowsPerPage,
        name: searchName || undefined,
      }),
    enabled: viewMode === 'list',
  })

  const { data: issuanceDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['ppeIssuanceDetail', selectedIssuance?.id],
    queryFn: () => fetchIssuanceDetail(selectedIssuance!.id),
    enabled: !!selectedIssuance?.id && (viewMode === 'detail' || viewMode === 'edit'),
  })

  // Load image preview for detail view
  useEffect(() => {
    if (viewMode === 'detail' && issuanceDetail?.ppeImageFileId && !imageThumbnails[issuanceDetail.ppeImageFileId]) {
      const loadDetailImage = async () => {
        try {
          const r = await axiosInstance.get<ApiResponse<{ filename: string; contentType: string; content: string }>>(
            `/files/${issuanceDetail.ppeImageFileId}/base64`
          )
          setImageThumbnails((prev) => ({ ...prev, [issuanceDetail.ppeImageFileId!]: `data:${r.data.data.contentType};base64,${r.data.data.content}` }))
        } catch { /* ignore */ }
      }
      loadDetailImage()
    }
  }, [viewMode, issuanceDetail?.ppeImageFileId, imageThumbnails])

  // Mutations
  const createMutation = useMutation({
    mutationFn: createIssuance,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['ppeIssuances'] })
      await showSuccess(t('common.saveSuccess'))
      handleBackToList()
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateIssuance,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['ppeIssuances'] })
      queryClient.invalidateQueries({ queryKey: ['ppeIssuanceDetail'] })
      await showSuccess(t('common.saveSuccess'))
      handleBackToList()
    },
  })

  const signMutation = useMutation({
    mutationFn: signIssuance,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['ppeIssuanceDetail'] })
      queryClient.invalidateQueries({ queryKey: ['ppeIssuances'] })
      await showSuccess(t('occupationalExposure.ppeIssuance.signSuccess'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteIssuance,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['ppeIssuances'] })
      await showSuccess(t('common.deleteSuccess'))
      handleBackToList()
    },
  })

  const isProcessing = signMutation.isPending || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  // Handlers
  const handleBackToList = () => {
    setViewMode('list')
    setSelectedIssuance(null)
    setPpeImageOptions([])
    setImageThumbnails({})
    reset({
      employeeId: '',
      employeeName: '',
      employeeDept: '',
      employeeEmail: '',
      ppeType: '',
      ppeName: '',
      ppeModel: '',
      ppeImageFileId: undefined,
      quantity: 1,
      issuanceDate: '',
      expiryDate: '',
      hazardousFactor: '',
      issuanceReason: '',
      notes: '',
    })
  }

  const handleSearch = () => {
    setSearchName(searchInput)
    setPage(0)
  }

  const handleReset = () => {
    setSearchInput('')
    setSearchName('')
    setPage(0)
  }

  const handleRowClick = (issuance: PpeIssuance) => {
    setSelectedIssuance(issuance)
    setViewMode('detail')
  }

  const handleAddClick = () => {
    setSelectedIssuance(null)
    setPpeImageOptions([])
    setImageThumbnails({})
    reset({
      employeeId: '',
      employeeName: '',
      employeeDept: '',
      employeeEmail: '',
      ppeType: '',
      ppeName: '',
      ppeModel: '',
      ppeImageFileId: undefined,
      quantity: 1,
      issuanceDate: '',
      expiryDate: '',
      hazardousFactor: '',
      issuanceReason: '',
      notes: '',
    })
    setViewMode('create')
  }

  const handleEditClick = () => {
    if (!issuanceDetail) return
    reset({
      employeeId: issuanceDetail.employeeId || '',
      employeeName: issuanceDetail.employeeName || '',
      employeeDept: issuanceDetail.employeeDept || '',
      employeeEmail: issuanceDetail.employeeEmail || '',
      ppeType: issuanceDetail.ppeType || '',
      ppeName: issuanceDetail.ppeName || '',
      ppeModel: issuanceDetail.ppeModel || '',
      ppeImageFileId: issuanceDetail.ppeImageFileId || undefined,
      quantity: issuanceDetail.quantity || 1,
      issuanceDate: issuanceDetail.issuanceDate || '',
      expiryDate: issuanceDetail.expiryDate || '',
      hazardousFactor: issuanceDetail.hazardousFactor || '',
      issuanceReason: issuanceDetail.issuanceReason || '',
      notes: issuanceDetail.notes || '',
    })
    setViewMode('edit')
  }

  const handleDeleteClick = async () => {
    const confirmed = await showConfirm(
      `${t('common.confirmDeleteMessage')}\n${t('common.deleteWarning')}`,
      { title: `${t('occupationalExposure.ppeIssuance.title')} ${t('common.delete')}` }
    )
    if (confirmed && selectedIssuance) {
      deleteMutation.mutate(selectedIssuance.id)
    }
  }

  const handleSignClick = async () => {
    const confirmed = await showConfirm(
      t('occupationalExposure.ppeIssuance.signConfirm'),
      { title: t('occupationalExposure.ppeIssuance.signReceipt') }
    )
    if (confirmed && selectedIssuance) {
      signMutation.mutate(selectedIssuance.id)
    }
  }

  const onSubmit = async (formValues: PpeIssuanceRequest) => {
    const confirmed = await showConfirm(t('common.confirmSave'))
    if (!confirmed) return

    if (viewMode === 'create') {
      createMutation.mutate(formValues)
    } else if (viewMode === 'edit' && selectedIssuance) {
      updateMutation.mutate({ id: selectedIssuance.id, data: formValues })
    }
  }

  // DEV ONLY — 비어있는 항목을 보호구 지급 더미데이터로 채움 (입력값 보존)
  const fillTestData = () => {
    const v = getValues()
    const today = new Date().toISOString().slice(0, 10)
    if (!v.employeeId) setValue('employeeId', 'EMP-3001')
    if (!v.employeeName) setValue('employeeName', '박보호')
    if (!v.employeeDept) setValue('employeeDept', '생산3팀')
    if (!v.employeeEmail) setValue('employeeEmail', 'boho.park@yesco.co.kr')
    if (!v.ppeType && ppeTypeCodes[0]?.code) setValue('ppeType', ppeTypeCodes[0].code)
    if (!v.ppeName) setValue('ppeName', '안전모')
    if (!v.ppeModel) setValue('ppeModel', 'SH-100')
    if (!v.quantity) setValue('quantity', 1)
    if (!v.issuanceDate) setValue('issuanceDate', today)
    if (!v.hazardousFactor) setValue('hazardousFactor', '낙하물, 충격')
    if (!v.issuanceReason) setValue('issuanceReason', '신규 작업자 배치에 따른 보호구 지급')
    if (!v.notes) setValue('notes', '보호구 지급 (테스트 데이터)')
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getPpeLabel = (ppeType?: string) => {
    if (!ppeType) return ''
    return getPpeTypeLabel(ppeType)
  }

  const issuances = data?.content || []
  const totalPages = data?.totalPages || 0

  // ===== Render Functions =====

  const renderListView = () => (
    <>
      {/* Filters - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder={t('occupationalExposure.ppeIssuance.searchByName')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
            sx={{ minWidth: 200 }}
          />
          <IconButton onClick={handleSearch} size="small"><SearchIcon /></IconButton>
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
        </Box>
        {isAdmin && (
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick}>
            New
          </Button>
        )}
      </Box>

      {/* Filters - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            placeholder={t('occupationalExposure.ppeIssuance.searchByName')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
            fullWidth
          />
          <IconButton onClick={handleSearch} size="small"><SearchIcon /></IconButton>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" onClick={handleReset} startIcon={<RefreshIcon />} sx={{ flex: 1 }}>{t('common.reset')}</Button>
          {isAdmin && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick} sx={{ flex: 1 }}>New</Button>
          )}
        </Box>
      </Box>

      {/* Table - PC */}
      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 800, '& .MuiTableCell-root': { borderColor: 'divider' } }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold', width: 120, borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.ppeIssuance.employeeId')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 100, borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.ppeIssuance.employeeName')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 120, borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.ppeIssuance.employeeDept')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.ppeIssuance.ppeType')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.ppeIssuance.ppeName')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 60, borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.ppeIssuance.quantity')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 110, borderRight: 1, borderColor: 'divider' }} align="center">{t('occupationalExposure.ppeIssuance.issuanceDate')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 80 }} align="center">{t('occupationalExposure.ppeIssuance.receivedSignature')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {issuances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">{t('common.noData')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              issuances.map((item) => (
                <TableRow key={item.id} hover onClick={() => handleRowClick(item)} sx={{ cursor: 'pointer' }}>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{item.employeeId}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{item.employeeName || ''}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{item.employeeDept || ''}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{getPpeLabel(item.ppeType)}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{item.ppeName || ''}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{item.quantity}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{formatDate(item.issuanceDate)}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={item.receivedSignature ? t('occupationalExposure.ppeIssuance.signed') : t('occupationalExposure.ppeIssuance.unsigned')}
                      size="small"
                      color={item.receivedSignature ? 'success' : 'default'}
                      variant={item.receivedSignature ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile Card List */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
        {issuances.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">{t('common.noData')}</Typography>
          </Paper>
        ) : (
          issuances.map((item) => (
            <Paper key={item.id} sx={{ p: 2, cursor: 'pointer', border: 1, borderColor: 'divider' }} onClick={() => handleRowClick(item)}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography fontWeight="bold">{item.employeeName || item.employeeId}</Typography>
                <Chip
                  label={item.receivedSignature ? t('occupationalExposure.ppeIssuance.signed') : t('occupationalExposure.ppeIssuance.unsigned')}
                  size="small"
                  color={item.receivedSignature ? 'success' : 'default'}
                  variant={item.receivedSignature ? 'filled' : 'outlined'}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('occupationalExposure.ppeIssuance.employeeDept')}</Typography>
                  <Typography variant="body2">{item.employeeDept || ''}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('occupationalExposure.ppeIssuance.ppeType')}</Typography>
                  <Typography variant="body2">{getPpeLabel(item.ppeType)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('occupationalExposure.ppeIssuance.ppeName')}</Typography>
                  <Typography variant="body2">{item.ppeName || ''}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('occupationalExposure.ppeIssuance.quantity')}</Typography>
                  <Typography variant="body2">{item.quantity}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('occupationalExposure.ppeIssuance.issuanceDate')}</Typography>
                  <Typography variant="body2">{formatDate(item.issuanceDate)}</Typography>
                </Box>
              </Box>
            </Paper>
          ))
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination count={totalPages || 1} page={page + 1} onChange={(_, newPage) => setPage(newPage - 1)} color="primary" />
      </Box>
    </>
  )

  const renderDetailView = () => (
    <>
      {detailLoading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      ) : issuanceDetail ? (
        <>
          {/* PC Detail Layout */}
          {isDesktop && (
          <Paper sx={{ display: { xs: 'none', md: 'block' }, p: 3, bgcolor: 'grey.50' }}>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
              {/* Row 1: employeeId | employeeName */}
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={labelCellSx}>{t('occupationalExposure.ppeIssuance.employeeId')}</Typography>
                <Box sx={valueCellBorderSx}><Typography variant="body2">{issuanceDetail.employeeId || ''}</Typography></Box>
                <Typography sx={labelCellSx}>{t('occupationalExposure.ppeIssuance.employeeName')}</Typography>
                <Box sx={valueCellSx}><Typography variant="body2">{issuanceDetail.employeeName || ''}</Typography></Box>
              </Box>
              {/* Row 2: employeeDept | employeeEmail */}
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={labelCellSx}>{t('occupationalExposure.ppeIssuance.employeeDept')}</Typography>
                <Box sx={valueCellBorderSx}><Typography variant="body2">{issuanceDetail.employeeDept || ''}</Typography></Box>
                <Typography sx={labelCellSx}>{t('occupationalExposure.ppeIssuance.employeeEmail')}</Typography>
                <Box sx={valueCellSx}><Typography variant="body2">{issuanceDetail.employeeEmail || ''}</Typography></Box>
              </Box>
              {/* Row 3: ppeType | ppeName */}
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={labelCellSx}>{t('occupationalExposure.ppeIssuance.ppeType')}</Typography>
                <Box sx={valueCellBorderSx}>
                  {issuanceDetail.ppeImageFileId && imageThumbnails[issuanceDetail.ppeImageFileId] ? (
                    <Tooltip
                      title={
                        <Box component="img" src={imageThumbnails[issuanceDetail.ppeImageFileId]} alt="PPE" sx={{ width: 200, height: 200, objectFit: 'contain', display: 'block' }} />
                      }
                      placement="top"
                      arrow
                      slotProps={{
                        tooltip: { sx: { bgcolor: 'white', p: 1, border: 1, borderColor: 'divider', boxShadow: 3, maxWidth: 'none', display: 'flex', justifyContent: 'center' } },
                        arrow: { sx: { color: 'white' } },
                      }}
                    >
                      <Typography variant="body2" component="span" sx={{ cursor: 'pointer', textDecoration: 'none', '&:hover': { color: 'primary.main', textDecoration: 'underline solid', textUnderlineOffset: 3 } }}>{getPpeLabel(issuanceDetail.ppeType)}</Typography>
                    </Tooltip>
                  ) : (
                    <Typography variant="body2">{getPpeLabel(issuanceDetail.ppeType)}</Typography>
                  )}
                </Box>
                <Typography sx={labelCellSx}>{t('occupationalExposure.ppeIssuance.ppeName')}</Typography>
                <Box sx={valueCellSx}><Typography variant="body2">{issuanceDetail.ppeName || ''}</Typography></Box>
              </Box>
              {/* Row 4: ppeModel | quantity */}
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={labelCellSx}>{t('occupationalExposure.ppeIssuance.ppeModel')}</Typography>
                <Box sx={valueCellBorderSx}><Typography variant="body2">{issuanceDetail.ppeModel || ''}</Typography></Box>
                <Typography sx={labelCellSx}>{t('occupationalExposure.ppeIssuance.quantity')}</Typography>
                <Box sx={valueCellSx}><Typography variant="body2">{issuanceDetail.quantity}</Typography></Box>
              </Box>
              {/* Row 5: issuanceDate | expiryDate */}
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={labelCellSx}>{t('occupationalExposure.ppeIssuance.issuanceDate')}</Typography>
                <Box sx={valueCellBorderSx}><Typography variant="body2">{formatDate(issuanceDetail.issuanceDate)}</Typography></Box>
                <Typography sx={labelCellSx}>{t('occupationalExposure.ppeIssuance.expiryDate')}</Typography>
                <Box sx={valueCellSx}><Typography variant="body2">{formatDate(issuanceDetail.expiryDate)}</Typography></Box>
              </Box>
              {/* Row 6: hazardousFactor | issuanceReason */}
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={labelCellSx}>{t('occupationalExposure.ppeIssuance.hazardousFactor')}</Typography>
                <Box sx={valueCellBorderSx}><Typography variant="body2">{issuanceDetail.hazardousFactor || ''}</Typography></Box>
                <Typography sx={labelCellSx}>{t('occupationalExposure.ppeIssuance.issuanceReason')}</Typography>
                <Box sx={valueCellSx}><Typography variant="body2">{issuanceDetail.issuanceReason || ''}</Typography></Box>
              </Box>
              {/* Row 7: receivedSignature | signatureDate */}
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={labelCellSx}>{t('occupationalExposure.ppeIssuance.receivedSignature')}</Typography>
                <Box sx={valueCellBorderSx}>
                  <Chip
                    label={issuanceDetail.receivedSignature ? t('occupationalExposure.ppeIssuance.signed') : t('occupationalExposure.ppeIssuance.unsigned')}
                    size="small"
                    color={issuanceDetail.receivedSignature ? 'success' : 'default'}
                    variant={issuanceDetail.receivedSignature ? 'filled' : 'outlined'}
                  />
                </Box>
                <Typography sx={labelCellSx}>{t('occupationalExposure.ppeIssuance.signatureDate')}</Typography>
                <Box sx={valueCellSx}><Typography variant="body2">{formatDate(issuanceDetail.signatureDate)}</Typography></Box>
              </Box>
              {/* Row 8: notes */}
              <Box sx={{ display: 'flex' }}>
                <Typography sx={labelCellSx}>{t('occupationalExposure.ppeIssuance.notes')}</Typography>
                <Box sx={{ ...valueCellSx, whiteSpace: 'pre-wrap' }}><Typography variant="body2">{issuanceDetail.notes || ''}</Typography></Box>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
              <Button variant="outlined" onClick={handleBackToList} sx={{ width: 'auto' }}>{t('common.backToList')}</Button>
              {!issuanceDetail.receivedSignature && (
                <Button
                  variant="contained"
                  color="info"
                  onClick={handleSignClick}
                  disabled={isProcessing}
                  sx={{ width: 'auto' }}
                >
                  {t('occupationalExposure.ppeIssuance.signReceipt')}
                </Button>
              )}
              {canSee(MENU, 'REQUESTED', '수정', getItemRoles(issuanceDetail)) && (
                <Button variant="contained" onClick={handleEditClick} sx={{ width: 'auto' }}>{t('common.edit')}</Button>
              )}
              {canSee(MENU, 'REQUESTED', '삭제', getItemRoles(issuanceDetail)) && (
                <Button variant="contained" color="error" onClick={handleDeleteClick} sx={{ width: 'auto' }}>{t('common.delete')}</Button>
              )}
            </Box>
          </Paper>
          )}

          {/* Mobile Detail Layout */}
          {!isDesktop && (
          <Paper sx={{ display: { xs: 'block', md: 'none' }, p: 2, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.employeeId')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{issuanceDetail.employeeId || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.employeeName')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{issuanceDetail.employeeName || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.employeeDept')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{issuanceDetail.employeeDept || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.employeeEmail')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{issuanceDetail.employeeEmail || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.ppeType')}</Typography>
                <Box sx={{ px: 1.5, py: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">{getPpeLabel(issuanceDetail.ppeType)}</Typography>
                  {issuanceDetail.ppeImageFileId && imageThumbnails[issuanceDetail.ppeImageFileId] && (
                    <Box component="img" src={imageThumbnails[issuanceDetail.ppeImageFileId]} alt="PPE" sx={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 0.5, border: 1, borderColor: 'divider' }} />
                  )}
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.ppeName')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{issuanceDetail.ppeName || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.ppeModel')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{issuanceDetail.ppeModel || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.quantity')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{issuanceDetail.quantity}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.issuanceDate')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{formatDate(issuanceDetail.issuanceDate)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.expiryDate')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{formatDate(issuanceDetail.expiryDate)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.hazardousFactor')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{issuanceDetail.hazardousFactor || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.issuanceReason')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{issuanceDetail.issuanceReason || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.receivedSignature')}</Typography>
                <Box sx={{ px: 1.5, py: 0.5 }}>
                  <Chip
                    label={issuanceDetail.receivedSignature ? t('occupationalExposure.ppeIssuance.signed') : t('occupationalExposure.ppeIssuance.unsigned')}
                    size="small"
                    color={issuanceDetail.receivedSignature ? 'success' : 'default'}
                    variant={issuanceDetail.receivedSignature ? 'filled' : 'outlined'}
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.signatureDate')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{formatDate(issuanceDetail.signatureDate)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.notes')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>{issuanceDetail.notes || ''}</Typography>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
              <Button variant="outlined" onClick={handleBackToList} sx={{ flex: 1 }}>{t('common.backToList')}</Button>
              {!issuanceDetail.receivedSignature && (
                <Button
                  variant="contained"
                  color="info"
                  onClick={handleSignClick}
                  disabled={isProcessing}
                  sx={{ flex: 1 }}
                >
                  {t('occupationalExposure.ppeIssuance.signReceipt')}
                </Button>
              )}
              {canSee(MENU, 'REQUESTED', '수정', getItemRoles(issuanceDetail)) && (
                <Button variant="contained" onClick={handleEditClick} sx={{ flex: 1 }}>{t('common.edit')}</Button>
              )}
              {canSee(MENU, 'REQUESTED', '삭제', getItemRoles(issuanceDetail)) && (
                <Button variant="contained" color="error" onClick={handleDeleteClick} sx={{ flex: 1 }}>{t('common.delete')}</Button>
              )}
            </Box>
          </Paper>
          )}
        </>
      ) : null}
    </>
  )

  const renderFormView = () => (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Paper sx={{ p: { xs: 2, md: 3 }, bgcolor: 'grey.50', mb: 3 }}>
          {/* PC Form Layout */}
          {isDesktop && (
          <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
            {/* Row 1: employeeId | employeeName */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={formLabelSx}>
                {t('occupationalExposure.ppeIssuance.employeeId')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
              </Typography>
              <Box sx={formValueSx}>
                <Controller
                  name="employeeId"
                  control={control}
                  rules={{ required: t('occupationalExposure.ppeIssuance.employeeIdRequired') }}
                  render={({ field, fieldState }) => (
                    <TextField {...field} size="small" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} placeholder={t('occupationalExposure.ppeIssuance.employeeId')} />
                  )}
                />
              </Box>
              <Typography sx={formLabelSx}>{t('occupationalExposure.ppeIssuance.employeeName')}</Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                <Controller
                  name="employeeName"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.ppeIssuance.employeeName')} />
                  )}
                />
              </Box>
            </Box>
            {/* Row 2: employeeDept | employeeEmail */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={formLabelSx}>{t('occupationalExposure.ppeIssuance.employeeDept')}</Typography>
              <Box sx={formValueSx}>
                <Controller
                  name="employeeDept"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.ppeIssuance.employeeDept')} />
                  )}
                />
              </Box>
              <Typography sx={formLabelSx}>{t('occupationalExposure.ppeIssuance.employeeEmail')}</Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                <Controller
                  name="employeeEmail"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.ppeIssuance.employeeEmail')} />
                  )}
                />
              </Box>
            </Box>
            {/* Row 3: ppeType | ppeImage */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={formLabelSx}>
                {t('occupationalExposure.ppeIssuance.ppeType')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
              </Typography>
              <Box sx={formValueSx}>
                <Controller
                  name="ppeType"
                  control={control}
                  rules={{ required: t('occupationalExposure.ppeIssuance.ppeTypeRequired') }}
                  render={({ field, fieldState }) => (
                    <FormControl fullWidth size="small" error={!!fieldState.error}>
                      <Select
                        {...field}
                        displayEmpty
                        onChange={(e) => {
                          field.onChange(e)
                          setValue('ppeImageFileId', undefined)
                          setImageThumbnails({})
                        }}
                      >
                        <MenuItem value="" disabled>{t('common.select')}</MenuItem>
                        {ppeTypeCodes.map((item) => (
                          <MenuItem key={item.code} value={item.code}>{getLocalizedName(item)}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>
              <Typography sx={formLabelSx}>{t('occupationalExposure.ppeIssuance.ppeImage')}</Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                <Controller
                  name="ppeImageFileId"
                  control={control}
                  render={({ field }) => (
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <Box
                        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => field.onChange(undefined)}
                      >
                        <Box sx={{ width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 1, borderColor: !field.value ? 'primary.main' : 'grey.300', borderRadius: 0.5, borderWidth: !field.value ? 2 : 1 }}>
                          <Typography variant="body2" color="text.secondary">{t('common.none')}</Typography>
                        </Box>
                        <Radio checked={!field.value} onChange={() => field.onChange(undefined)} size="small" sx={{ p: 0.5 }} />
                      </Box>
                      {ppeImageOptions.map((img) => (
                        <Box
                          key={img.id}
                          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                          onClick={() => field.onChange(img.id)}
                        >
                          <Box sx={{ width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 1, borderColor: field.value === img.id ? 'primary.main' : 'grey.300', borderRadius: 0.5, borderWidth: field.value === img.id ? 2 : 1 }}>
                            {imageThumbnails[img.id] ? (
                              <Box component="img" src={imageThumbnails[img.id]} alt={img.originalFilename} sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            ) : (
                              <CircularProgress size={20} />
                            )}
                          </Box>
                          <Radio checked={field.value === img.id} onChange={() => field.onChange(img.id)} size="small" sx={{ p: 0.5 }} />
                        </Box>
                      ))}
                    </Box>
                  )}
                />
              </Box>
            </Box>
            {/* Row 4: ppeName | ppeModel */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={formLabelSx}>{t('occupationalExposure.ppeIssuance.ppeName')}</Typography>
              <Box sx={formValueSx}>
                <Controller
                  name="ppeName"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.ppeIssuance.ppeName')} />
                  )}
                />
              </Box>
              <Typography sx={formLabelSx}>{t('occupationalExposure.ppeIssuance.ppeModel')}</Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                <Controller
                  name="ppeModel"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.ppeIssuance.ppeModel')} />
                  )}
                />
              </Box>
            </Box>
            {/* Row 5: quantity | issuanceDate */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={formLabelSx}>{t('occupationalExposure.ppeIssuance.quantity')}</Typography>
              <Box sx={formValueSx}>
                <Controller
                  name="quantity"
                  control={control}
                  render={({ field }) => (
                    <NumberField
                      value={field.value}
                      size="small"
                      fullWidth
                      onChange={(v) => field.onChange(v ?? 0)}
                      placeholder={t('occupationalExposure.ppeIssuance.quantity')}
                    />
                  )}
                />
              </Box>
              <Typography sx={formLabelSx}>
                {t('occupationalExposure.ppeIssuance.issuanceDate')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                <Controller
                  name="issuanceDate"
                  control={control}
                  rules={{ required: t('occupationalExposure.ppeIssuance.issuanceDateRequired') }}
                  render={({ field, fieldState }) => (
                    <DatePickerField
                      value={field.value}
                      onChange={field.onChange}
                      error={!!fieldState.error}
                    />
                  )}
                />
              </Box>
            </Box>
            {/* Row 6: expiryDate | hazardousFactor */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={formLabelSx}>{t('occupationalExposure.ppeIssuance.expiryDate')}</Typography>
              <Box sx={formValueSx}>
                <Controller
                  name="expiryDate"
                  control={control}
                  render={({ field }) => (
                    <DatePickerField
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Box>
              <Typography sx={formLabelSx}>{t('occupationalExposure.ppeIssuance.hazardousFactor')}</Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                <Controller
                  name="hazardousFactor"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.ppeIssuance.hazardousFactor')} />
                  )}
                />
              </Box>
            </Box>
            {/* Row 7: issuanceReason */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={formLabelSx}>{t('occupationalExposure.ppeIssuance.issuanceReason')}</Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                <Controller
                  name="issuanceReason"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.ppeIssuance.issuanceReason')} />
                  )}
                />
              </Box>
            </Box>
            {/* Row 8: notes */}
            <Box sx={{ display: 'flex' }}>
              <Typography sx={{ ...formLabelSx, alignItems: 'flex-start', pt: 2 }}>{t('occupationalExposure.ppeIssuance.notes')}</Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} size="small" fullWidth multiline rows={3} placeholder={t('occupationalExposure.ppeIssuance.notes')} />
                  )}
                />
              </Box>
            </Box>
          </Box>
          )}

          {/* Mobile Form Layout */}
          {!isDesktop && (
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('occupationalExposure.ppeIssuance.employeeId')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
              </Typography>
              <Controller
                name="employeeId"
                control={control}
                rules={{ required: t('occupationalExposure.ppeIssuance.employeeIdRequired') }}
                render={({ field, fieldState }) => (
                  <TextField {...field} size="small" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} placeholder={t('occupationalExposure.ppeIssuance.employeeId')} />
                )}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.employeeName')}</Typography>
              <Controller
                name="employeeName"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.ppeIssuance.employeeName')} />
                )}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.employeeDept')}</Typography>
              <Controller
                name="employeeDept"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.ppeIssuance.employeeDept')} />
                )}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.employeeEmail')}</Typography>
              <Controller
                name="employeeEmail"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.ppeIssuance.employeeEmail')} />
                )}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('occupationalExposure.ppeIssuance.ppeType')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
              </Typography>
              <Controller
                name="ppeType"
                control={control}
                rules={{ required: t('occupationalExposure.ppeIssuance.ppeTypeRequired') }}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth size="small" error={!!fieldState.error}>
                    <Select
                      {...field}
                      displayEmpty
                      onChange={(e) => {
                        field.onChange(e)
                        setValue('ppeImageFileId', undefined)
                        setImageThumbnails({})
                      }}
                    >
                      <MenuItem value="" disabled>{t('common.select')}</MenuItem>
                      {ppeTypeCodes.map((item) => (
                        <MenuItem key={item.code} value={item.code}>{getLocalizedName(item)}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.ppeImage')}</Typography>
              <Controller
                name="ppeImageFileId"
                control={control}
                render={({ field }) => (
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', px: 1.5, py: 0.5, alignItems: 'flex-end' }}>
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => field.onChange(undefined)}
                    >
                      <Box sx={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 1, borderColor: !field.value ? 'primary.main' : 'grey.300', borderRadius: 0.5, borderWidth: !field.value ? 2 : 1 }}>
                        <Typography variant="body2" color="text.secondary">{t('common.none')}</Typography>
                      </Box>
                      <Radio checked={!field.value} onChange={() => field.onChange(undefined)} size="small" sx={{ p: 0.5 }} />
                    </Box>
                    {ppeImageOptions.map((img) => (
                      <Box
                        key={img.id}
                        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => field.onChange(img.id)}
                      >
                        <Box sx={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 1, borderColor: field.value === img.id ? 'primary.main' : 'grey.300', borderRadius: 0.5, borderWidth: field.value === img.id ? 2 : 1 }}>
                          {imageThumbnails[img.id] ? (
                            <Box component="img" src={imageThumbnails[img.id]} alt={img.originalFilename} sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                          ) : (
                            <CircularProgress size={16} />
                          )}
                        </Box>
                        <Radio checked={field.value === img.id} onChange={() => field.onChange(img.id)} size="small" sx={{ p: 0.5 }} />
                      </Box>
                    ))}
                  </Box>
                )}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.ppeName')}</Typography>
              <Controller
                name="ppeName"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.ppeIssuance.ppeName')} />
                )}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.ppeModel')}</Typography>
              <Controller
                name="ppeModel"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.ppeIssuance.ppeModel')} />
                )}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.quantity')}</Typography>
              <Controller
                name="quantity"
                control={control}
                render={({ field }) => (
                  <NumberField
                    value={field.value}
                    size="small"
                    fullWidth
                    onChange={(v) => field.onChange(v ?? 0)}
                    placeholder={t('occupationalExposure.ppeIssuance.quantity')}
                  />
                )}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('occupationalExposure.ppeIssuance.issuanceDate')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
              </Typography>
              <Controller
                name="issuanceDate"
                control={control}
                rules={{ required: t('occupationalExposure.ppeIssuance.issuanceDateRequired') }}
                render={({ field, fieldState }) => (
                  <DatePickerField
                    value={field.value}
                    onChange={field.onChange}
                    error={!!fieldState.error}
                  />
                )}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.expiryDate')}</Typography>
              <Controller
                name="expiryDate"
                control={control}
                render={({ field }) => (
                  <DatePickerField
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.hazardousFactor')}</Typography>
              <Controller
                name="hazardousFactor"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.ppeIssuance.hazardousFactor')} />
                )}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.issuanceReason')}</Typography>
              <Controller
                name="issuanceReason"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth placeholder={t('occupationalExposure.ppeIssuance.issuanceReason')} />
                )}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('occupationalExposure.ppeIssuance.notes')}</Typography>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField {...field} size="small" fullWidth multiline rows={3} placeholder={t('occupationalExposure.ppeIssuance.notes')} />
                )}
              />
            </Box>
          </Box>
          )}
        </Paper>

        {/* Form Actions */}
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, gap: 1 }}>
          {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
          <Button
            variant="outlined"
            onClick={viewMode === 'edit' ? () => setViewMode('detail') : handleBackToList}
            sx={{ flex: { xs: 1, sm: 'none' } }}
          >
            {viewMode === 'edit' ? t('common.cancel') : t('common.backToList')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isProcessing}
            sx={{ flex: { xs: 1, sm: 'none' } }}
          >
            {viewMode === 'edit' ? t('common.save') : t('common.register')}
          </Button>
        </Box>
      </form>
    </>
  )

  // ===== Main Render =====

  if (isLoading && viewMode === 'list') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error && viewMode === 'list') {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{t('common.loadError')}</Alert>
      </Box>
    )
  }

  return (
    <Box>
      <LoadingOverlay open={isProcessing} message="처리 중..." />
      {viewMode === 'list' && renderListView()}
      {viewMode === 'detail' && renderDetailView()}
      {(viewMode === 'create' || viewMode === 'edit') && renderFormView()}
    </Box>
  )
}

export default PpeIssuanceTab
