import { useState } from 'react'
import { fmtPerson } from '../../utils/personFormat'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, TextField, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Typography, Pagination,
  IconButton, CircularProgress, Alert, Chip, Select, MenuItem,
  FormControl, Grid,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'
import axiosInstance from '../../api/axiosInstance'
import { WemPlan, WemPlanRequest } from '../../types/workEnvMeasurement.types'
import { ApiResponse, PageResponse } from '../../types/common.types'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import LoadingOverlay from '../common/LoadingOverlay'
import DevTestFillButton from '../common/DevTestFillButton'
import useCodeMap from '../../hooks/useCodeMap'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const currentYear = new Date().getFullYear()

// ===== API functions =====
const fetchPlans = async (page: number, size: number): Promise<PageResponse<WemPlan>> => {
  const res = await axiosInstance.get<ApiResponse<PageResponse<WemPlan>>>(`/wem-plans?page=${page}&size=${size}`)
  return res.data.data
}

const searchPlans = async (keyword: string, page: number, size: number): Promise<PageResponse<WemPlan>> => {
  const res = await axiosInstance.get<ApiResponse<PageResponse<WemPlan>>>(`/wem-plans/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`)
  return res.data.data
}

const fetchPlanDetail = async (id: number): Promise<WemPlan> => {
  const res = await axiosInstance.get<ApiResponse<WemPlan>>(`/wem-plans/${id}`)
  return res.data.data
}

const createPlan = async (data: WemPlanRequest): Promise<WemPlan> => {
  const res = await axiosInstance.post<ApiResponse<WemPlan>>('/wem-plans', data)
  return res.data.data
}

const updatePlan = async ({ id, data }: { id: number; data: WemPlanRequest }): Promise<WemPlan> => {
  const res = await axiosInstance.put<ApiResponse<WemPlan>>(`/wem-plans/${id}`, data)
  return res.data.data
}

const deletePlan = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/wem-plans/${id}`)
}

// ===== Constants =====
const HAZARD_TYPE_COLORS: Record<string, 'info' | 'warning' | 'secondary' | 'default'> = {
  ORGANIC: 'info',
  METAL: 'warning',
  PHYSICAL: 'secondary',
  DUST: 'default',
}

const STATUS_COLORS: Record<string, 'success' | 'info' | 'default' | 'error' | 'warning'> = {
  COMPLETED: 'success',
  IN_PROGRESS: 'info',
  PLANNED: 'default',
  OVERDUE: 'error',
  UNMEASURED: 'warning',
}

const labelSx = {
  width: 140, minWidth: 140, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: 'divider',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', whiteSpace: 'nowrap' as const, textAlign: 'center',
}
const valSx = { flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'divider' }
const hSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'divider' }
const lastRowSx = { display: 'flex', borderColor: 'divider' }

const MENU = '보건 관리 › 작업환경 측정 › 측정 계획'

const WemPlanTab: React.FC = () => {
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
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const myRoles: string[] = ['guest', ...(user?.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : (user?.role ? [user.role] : []))]
  const getRoles = (item: { createdByUserId?: number | null }): string[] => {
    const roles = [...myRoles]
    if (item.createdByUserId != null && user?.id != null && item.createdByUserId === user.id) roles.push('writer')
    return roles
  }
  const { codeList: hazardTypeCodes, getLabel: getHazardTypeLabel } = useCodeMap('WEM_HAZARD_TYPE')
  const { codeList: cycleCodes, getLabel: getCycleLabel } = useCodeMap('WEM_CYCLE')
  const { codeList: statusCodes, getLabel: getStatusLabel } = useCodeMap('WEM_PLAN_STATUS')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<WemPlan | null>(null)
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const rowsPerPage = 10

  const emptyForm: WemPlanRequest = {
    planYear: currentYear,
    processName: '',
  }
  const [formData, setFormData] = useState<WemPlanRequest>(emptyForm)

  // ===== Queries =====
  const { data, isLoading } = useQuery({
    queryKey: ['wemPlans', page, searchQuery],
    queryFn: () =>
      searchQuery
        ? searchPlans(searchQuery, page, rowsPerPage)
        : fetchPlans(page, rowsPerPage),
    enabled: viewMode === 'list',
  })

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['wemPlanDetail', selectedItem?.id],
    queryFn: () => fetchPlanDetail(selectedItem!.id),
    enabled: !!selectedItem?.id && (viewMode === 'detail' || viewMode === 'edit'),
  })

  // ===== Mutations =====
  const createMutation = useMutation({
    mutationFn: createPlan,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['wemPlans'] })
      await showSuccess(t('common.saved', '저장되었습니다'))
      handleBackToList()
    },
  })

  const updateMutation = useMutation({
    mutationFn: updatePlan,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['wemPlans'] })
      queryClient.invalidateQueries({ queryKey: ['wemPlanDetail'] })
      await showSuccess(t('common.saved', '저장되었습니다'))
      handleBackToList()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deletePlan,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['wemPlans'] })
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
    setStatusFilter('')
    setPage(0)
  }

  const handleSearch = () => {
    setSearchQuery(searchText)
    setPage(0)
  }

  const handleRowClick = (item: WemPlan) => {
    setSelectedItem(item)
    setViewMode('detail')
  }

  const handleAddClick = () => {
    setSelectedItem(null)
    setFormData({ ...emptyForm, lastMeasurementDate: todayStr(), nextMeasurementDate: todayStr() })
    setViewMode('create')
  }

  const handleEditClick = () => {
    if (!detail) return
    setFormData({
      planYear: detail.planYear,
      processName: detail.processName,
      department: detail.department || '',
      hazardType: detail.hazardType || '',
      measurementCycle: detail.measurementCycle || '',
      lastMeasurementDate: detail.lastMeasurementDate || '',
      nextMeasurementDate: detail.nextMeasurementDate || '',
      status: detail.status || '',
      measurementAgency: detail.measurementAgency || '',
      agencyCode: detail.agencyCode || '',
      contractPeriod: detail.contractPeriod || '',
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

  // DEV ONLY — 비어있는 항목을 측정 계획 더미데이터로 채움 (입력값 보존)
  const fillTestData = () => setFormData(prev => ({
    ...prev,
    processName: prev.processName || '도장 공정 (제2공장)',
    department: prev.department || '생산기술팀',
    hazardType: prev.hazardType || hazardTypeCodes[0]?.code || '',
    measurementCycle: prev.measurementCycle || cycleCodes[0]?.code || '',
    lastMeasurementDate: prev.lastMeasurementDate || todayStr(),
    nextMeasurementDate: prev.nextMeasurementDate || todayStr(),
    status: prev.status || statusCodes[0]?.code || '',
    measurementAgency: prev.measurementAgency || '한국산업안전보건공단',
    agencyCode: prev.agencyCode || 'WEM-2026-001',
    remarks: prev.remarks || '연간 정기 측정 계획 (테스트 데이터)',
  }))

  const handleSubmit = async () => {
    if (!formData.processName) {
      showWarning(t('wem.processName') + ' ' + t('common.required', '필수입니다'))
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
  const filteredItems = statusFilter ? items.filter(i => i.status === statusFilter) : items
  const totalPages = data?.totalPages || 0

  // KPI cards
  const totalCount = data?.totalElements ?? items.length
  const completedCount = items.filter(i => i.status === 'COMPLETED').length
  const plannedCount = items.filter(i => i.status === 'PLANNED' || i.status === 'IN_PROGRESS').length
  const unmeasuredCount = items.filter(i => i.status === 'UNMEASURED' || i.status === 'OVERDUE').length

  const getHazardTypeChipLabel = (type: string | null) => {
    if (!type) return ''
    return getHazardTypeLabel(type) || type
  }

  // ===== RENDER: List =====
  if (viewMode === 'list') {
    return (
      <Box>
        {/* KPI Cards */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {[
            { label: t('wem.registeredProcesses', '등록 공정 수'), value: totalCount, color: '#3b82f6' },
            { label: t('wem.annualPlanCount', '연간 계획 건수'), value: plannedCount, color: '#f59e0b' },
            { label: t('common.completed', '완료'), value: completedCount, color: '#22c55e' },
            { label: t('wem.newProcessAlert', '신규공정 알림'), value: unmeasuredCount, color: '#ef4444' },
          ].map((card, idx) => (
            <Grid item xs={6} md={3} key={idx}>
              <Paper sx={(theme: any) => ({ p: 2.5, pl: 3, position: 'relative', overflow: 'hidden', ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }), '&::before': { content: '""', position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, backgroundColor: theme.isYesco ? '#E60012' : '#2563eb', borderTopLeftRadius: 'inherit', borderBottomLeftRadius: 'inherit' } })}>
                <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                <Typography variant="h5" fontWeight="bold">{card.value}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Alert */}
        {unmeasuredCount > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('wem.unmeasuredAlert', '미측정 또는 측정 초과 공정이 있습니다.')}
          </Alert>
        )}

        {/* Toolbar - PC */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mb: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">{t('common.all')}</MenuItem>
              {statusCodes.map(c => (
                <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <ListSearchBar placeholder={t('common.search')} value={searchText} onChange={setSearchText} onSearch={handleSearch} sx={{ minWidth: 200 }} />
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
          <Box sx={{ flex: 1 }} />
          {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick} size="small">
            {t('common.new')}
          </Button>
          )}
        </Box>
        {/* Toolbar - Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                {statusCodes.map(c => (
                  <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <ListSearchBar placeholder={t('common.search')} value={searchText} onChange={setSearchText} onSearch={handleSearch} sx={{ flex: 1 }} />
            <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
          </Box>
          {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
          <Button variant="contained" fullWidth startIcon={<AddIcon />} onClick={handleAddClick} size="small">
            {t('common.new')}
          </Button>
          )}
        </Box>

        {/* Table */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : filteredItems.length === 0 ? (
          <Alert severity="info">{t('common.noData')}</Alert>
        ) : (
          <>
            <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={hSx} align="center">{t('common.no')}</TableCell>
                    <TableCell sx={hSx}>{t('wem.processName')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('wem.department')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('wem.hazardType')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('wem.cycle')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('wem.lastMeasurement')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('wem.nextMeasurement')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('common.status', '상태')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleRowClick(item)}
                    >
                      <TableCell align="center">{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell>{item.processName}</TableCell>
                      <TableCell align="center">{item.department || ''}</TableCell>
                      <TableCell align="center">
                        {item.hazardType ? (
                          <Chip
                            label={getHazardTypeChipLabel(item.hazardType)}
                            color={HAZARD_TYPE_COLORS[item.hazardType] || 'default'}
                            size="small"
                          />
                        ) : ''}
                      </TableCell>
                      <TableCell align="center">{getCycleLabel(item.measurementCycle || '') || item.measurementCycle || ''}</TableCell>
                      <TableCell align="center">{item.lastMeasurementDate || ''}</TableCell>
                      <TableCell align="center">{item.nextMeasurementDate || ''}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getStatusLabel(item.status) || item.status}
                          color={STATUS_COLORS[item.status] || 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
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
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('wem.processName')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.processName}</Typography></Box>
            <Box sx={labelSx}>{t('wem.department')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.department || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('wem.hazardType')}</Box>
            <Box sx={valBorderSx}>
              {d.hazardType ? (
                <Chip label={getHazardTypeChipLabel(d.hazardType)} color={HAZARD_TYPE_COLORS[d.hazardType] || 'default'} size="small" />
              ) : null}
            </Box>
            <Box sx={labelSx}>{t('wem.cycle')}</Box>
            <Box sx={valSx}><Typography variant="body2">{getCycleLabel(d.measurementCycle || '') || d.measurementCycle || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('wem.lastMeasurement')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.lastMeasurementDate || ''}</Typography></Box>
            <Box sx={labelSx}>{t('wem.nextMeasurement')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.nextMeasurementDate || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('wem.agency')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.measurementAgency || ''}</Typography></Box>
            <Box sx={labelSx}>{t('wem.agencyCode')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.agencyCode || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('wem.contractPeriod')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.contractPeriod || ''}</Typography></Box>
            <Box sx={labelSx}>{t('common.status', '상태')}</Box>
            <Box sx={valSx}>
              <Chip label={getStatusLabel(d.status) || d.status} color={STATUS_COLORS[d.status] || 'default'} size="small" />
            </Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('common.remarks', '비고')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.remarks || ''}</Typography></Box>
          </Box>
          {/* 작성자 | 작성일자 */}
          <Box sx={d.modifiedAt && d.modifiedAt !== d.createdAt ? rowSx : lastRowSx}>
            <Box sx={labelSx}>{t('common.creator', '작성자')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{fmtPerson(d.createdByName, d.createdByTeam, d.createdByPosition)}</Typography></Box>
            <Box sx={labelSx}>{t('audit.createdAt', '작성일자')}</Box>
            <Box sx={valSx}><Typography variant="body2">{formatDate(d.createdAt)}</Typography></Box>
          </Box>
          {/* 수정자 | 수정일자 — 수정 이력 있을 때만 */}
          {d.modifiedAt && d.modifiedAt !== d.createdAt && (
            <Box sx={lastRowSx}>
              <Box sx={labelSx}>{t('common.modifier', '수정자')}</Box>
              <Box sx={valBorderSx}><Typography variant="body2">{fmtPerson(d.modifiedByName, d.modifiedByTeam, d.modifiedByPosition)}</Typography></Box>
              <Box sx={labelSx}>{t('common.modifiedAt', '수정일자')}</Box>
              <Box sx={valSx}><Typography variant="body2">{formatDate(d.modifiedAt)}</Typography></Box>
            </Box>
          )}
        </Box>
        {/* Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
          {[
            [t('wem.processName'), d.processName],
            [t('wem.department'), d.department],
            [t('wem.hazardType'), d.hazardType ? getHazardTypeChipLabel(d.hazardType) : null],
            [t('wem.cycle'), getCycleLabel(d.measurementCycle || '') || d.measurementCycle],
            [t('wem.lastMeasurement'), d.lastMeasurementDate],
            [t('wem.nextMeasurement'), d.nextMeasurementDate],
            [t('wem.agency'), d.measurementAgency],
            [t('wem.agencyCode'), d.agencyCode],
            [t('wem.contractPeriod'), d.contractPeriod],
            [t('common.status', '상태'), d.status ? (getStatusLabel(d.status) || d.status) : null],
            [t('common.remarks', '비고'), d.remarks],
            [t('common.creator', '작성자'), fmtPerson(d.createdByName, d.createdByTeam, d.createdByPosition)],
            [t('audit.createdAt', '작성일자'), formatDate(d.createdAt)],
            ...(d.modifiedAt && d.modifiedAt !== d.createdAt ? [
              [t('common.modifier', '수정자'), fmtPerson(d.modifiedByName, d.modifiedByTeam, d.modifiedByPosition)],
              [t('common.modifiedAt', '수정일자'), formatDate(d.modifiedAt)],
            ] : []),
          ].filter(([, v]) => v).map(([label, value], i) => (
            <Box key={i}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography>
              <Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>{value}</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: 1, sm: 'none' } }}>{t('common.backToList')}</Button>
          {canSee(MENU, 'DETAIL', '수정', getRoles(detail ?? {})) && (
            <Button variant="contained" onClick={handleEditClick} sx={{ flex: { xs: 1, sm: 'none' } }}>{t('common.edit')}</Button>
          )}
          {canSee(MENU, 'DETAIL', '삭제', getRoles(detail ?? {})) && (
            <Button variant="contained" color="error" onClick={handleDeleteClick} sx={{ flex: { xs: 1, sm: 'none' } }}>{t('common.delete')}</Button>
          )}
        </Box>
      </Box>
    )
  }

  // ===== RENDER: Create / Edit =====
  const formFields = [
    { label: t('wem.processName'), node: <TextField size="small" fullWidth value={formData.processName} onChange={(e) => setFormData({ ...formData, processName: e.target.value })} /> },
    { label: t('wem.department'), node: <TextField size="small" fullWidth value={formData.department || ''} onChange={(e) => setFormData({ ...formData, department: e.target.value })} /> },
    { label: t('wem.hazardType'), node: (
      <Select size="small" fullWidth value={formData.hazardType || ''} onChange={(e) => setFormData({ ...formData, hazardType: e.target.value })} displayEmpty>
        <MenuItem value="" disabled>선택하세요</MenuItem>
        {hazardTypeCodes.map(c => <MenuItem key={c.code} value={c.code}>{getHazardTypeLabel(c.code)}</MenuItem>)}
      </Select>
    ) },
    { label: t('wem.cycle'), node: (
      <Select size="small" fullWidth value={formData.measurementCycle || ''} onChange={(e) => setFormData({ ...formData, measurementCycle: e.target.value })} displayEmpty>
        <MenuItem value="" disabled>선택하세요</MenuItem>
        {cycleCodes.map(c => <MenuItem key={c.code} value={c.code}>{getCycleLabel(c.code)}</MenuItem>)}
      </Select>
    ) },
    { label: t('wem.lastMeasurement'), node: <DatePickerField value={formData.lastMeasurementDate || ''} onChange={(v) => setFormData({ ...formData, lastMeasurementDate: v })} /> },
    { label: t('wem.nextMeasurement'), node: <DatePickerField value={formData.nextMeasurementDate || ''} onChange={(v) => setFormData({ ...formData, nextMeasurementDate: v })} /> },
    { label: t('wem.agency'), node: <TextField size="small" fullWidth value={formData.measurementAgency || ''} onChange={(e) => setFormData({ ...formData, measurementAgency: e.target.value })} /> },
    { label: t('wem.agencyCode'), node: <TextField size="small" fullWidth value={formData.agencyCode || ''} onChange={(e) => setFormData({ ...formData, agencyCode: e.target.value })} /> },
    { label: t('wem.contractPeriod'), node: (() => {
      const parts = (formData.contractPeriod || '').split('~').map(s => s.trim())
      const start = parts[0] || ''
      const end = parts[1] || ''
      const update = (s: string, e: string) => {
        const v = !s && !e ? '' : `${s}${s && e ? ' ~ ' : (s || e ? '' : '')}${e}`
        setFormData({ ...formData, contractPeriod: v })
      }
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <Box sx={{ flex: 1 }}>
            <DatePickerField value={start} onChange={(v) => update(v || '', end)} maxDate={end || undefined} />
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>~</Typography>
          <Box sx={{ flex: 1 }}>
            <DatePickerField value={end} onChange={(v) => update(start, v || '')} minDate={start || undefined} />
          </Box>
        </Box>
      )
    })() },
    { label: t('common.status', '상태'), node: (
      <Select size="small" fullWidth value={formData.status || ''} onChange={(e) => setFormData({ ...formData, status: e.target.value })} displayEmpty>
        <MenuItem value="" disabled>선택하세요</MenuItem>
        {statusCodes.map(c => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
      </Select>
    ) },
    { label: t('common.remarks', '비고'), node: <TextField size="small" fullWidth multiline rows={2} value={formData.remarks || ''} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} /> },
  ]
  return (
    <Box>
      <LoadingOverlay open={isProcessing} />
      {/* PC */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
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
          <Box sx={valSx}>{formFields[10].node}</Box>
        </Box>
        {/* 작성자 | 작성일자 */}
        <Box sx={viewMode === 'edit' ? rowSx : lastRowSx}>
          <Box sx={labelSx}>{t('common.creator', '작성자')}</Box>
          <Box sx={valBorderSx}><Typography variant="body2">{fmtPerson(detail?.createdByName || user?.name, detail?.createdByTeam || user?.department, detail?.createdByPosition || user?.position)}</Typography></Box>
          <Box sx={labelSx}>{t('audit.createdAt', '작성일자')}</Box>
          <Box sx={valSx}><Typography variant="body2">{viewMode === 'edit' ? formatDate(detail?.createdAt) : todayStr()}</Typography></Box>
        </Box>
        {/* 수정자 | 수정일자 — 수정 모드만 */}
        {viewMode === 'edit' && (
          <Box sx={lastRowSx}>
            <Box sx={labelSx}>{t('common.modifier', '수정자')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{fmtPerson(user?.name, user?.department, user?.position)}</Typography></Box>
            <Box sx={labelSx}>{t('common.modifiedAt', '수정일자')}</Box>
            <Box sx={valSx}><Typography variant="body2">{todayStr()}</Typography></Box>
          </Box>
        )}
      </Box>
      {/* Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
        {formFields.map((f, i) => (
          <Box key={i}>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{f.label}</Typography>
            {f.node}
          </Box>
        ))}
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.creator', '작성자')}</Typography>
          <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{fmtPerson(detail?.createdByName || user?.name, detail?.createdByTeam || user?.department, detail?.createdByPosition || user?.position)}</Typography>
        </Box>
        {viewMode === 'edit' && (
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.modifier', '수정자')}</Typography>
            <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{fmtPerson(user?.name, user?.department, user?.position)}</Typography>
          </Box>
        )}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, gap: 1, mt: 2 }}>
        {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
        <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: 1, sm: 'none' } }}>
          {t('common.cancel', '취소')}
        </Button>
        {canSee(MENU, 'DETAIL', '저장', getRoles(detail ?? {})) && (
        <Button variant="contained" onClick={handleSubmit} sx={{ flex: { xs: 1, sm: 'none' } }}>
          {t('common.save', '저장')}
        </Button>
        )}
      </Box>
    </Box>
  )
}

export default WemPlanTab
