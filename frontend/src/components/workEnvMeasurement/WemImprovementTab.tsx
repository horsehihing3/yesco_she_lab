import { useState } from 'react'
import { isEhsManager } from '../../utils/auth'
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
import { WemImprovement, WemImprovementRequest } from '../../types/workEnvMeasurement.types'
import { ApiResponse, PageResponse } from '../../types/common.types'
import NumberField from '../common/NumberField'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import LoadingOverlay from '../common/LoadingOverlay'
import DepartmentSelectModal from '../common/DepartmentSelectModal'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import useCodeMap from '../../hooks/useCodeMap'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

// ===== API functions =====
const fetchImprovements = async (page: number, size: number): Promise<PageResponse<WemImprovement>> => {
  const res = await axiosInstance.get<ApiResponse<PageResponse<WemImprovement>>>(`/wem-improvements?page=${page}&size=${size}`)
  return res.data.data
}

const searchImprovements = async (keyword: string, page: number, size: number): Promise<PageResponse<WemImprovement>> => {
  const res = await axiosInstance.get<ApiResponse<PageResponse<WemImprovement>>>(`/wem-improvements/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`)
  return res.data.data
}

const fetchImprovementDetail = async (id: number): Promise<WemImprovement> => {
  const res = await axiosInstance.get<ApiResponse<WemImprovement>>(`/wem-improvements/${id}`)
  return res.data.data
}

const createImprovement = async (data: WemImprovementRequest): Promise<WemImprovement> => {
  const res = await axiosInstance.post<ApiResponse<WemImprovement>>('/wem-improvements', data)
  return res.data.data
}

const updateImprovement = async ({ id, data }: { id: number; data: WemImprovementRequest }): Promise<WemImprovement> => {
  const res = await axiosInstance.put<ApiResponse<WemImprovement>>(`/wem-improvements/${id}`, data)
  return res.data.data
}

const deleteImprovement = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/wem-improvements/${id}`)
}

// ===== Constants =====
const EXCEED_LEVEL_COLORS: Record<string, 'error' | 'warning'> = {
  EXCEED_2X: 'error',
  EXCEED_1X: 'warning',
}

const STATUS_COLORS: Record<string, 'success' | 'info' | 'default' | 'error'> = {
  COMPLETED: 'success',
  IN_PROGRESS: 'info',
  PLANNED: 'default',
  DELAYED: 'error',
}

const labelSx = {
  width: 120, minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: 'divider',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center',
}
const valSx = { flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'divider' }
const hSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'divider' }
const lastRowSx = { display: 'flex', borderColor: 'divider' }

const MENU = '보건 관리 › 작업환경 측정 › 개선 조치'

const WemImprovementTab: React.FC = () => {
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
  const isAdmin = isEhsManager(user)
  const myRoles: string[] = ['guest', ...(user?.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : (user?.role ? [user.role] : []))]
  const getRoles = (item: { createdByUserId?: number | null }): string[] => {
    const roles = [...myRoles]
    if (item.createdByUserId != null && user?.id != null && item.createdByUserId === user.id) roles.push('writer')
    return roles
  }
  const { codeList: statusCodes, getLabel: getStatusLabel } = useCodeMap('WEM_IMPROVE_STATUS')
  const { codeList: exceedLevelCodes, getLabel: getExceedLevelCodeLabel } = useCodeMap('WEM_EXCEED_LEVEL')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<WemImprovement | null>(null)
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const rowsPerPage = 10

  const emptyForm: WemImprovementRequest = {
    processName: '',
    factorName: '',
  }
  const [formData, setFormData] = useState<WemImprovementRequest>(emptyForm)
  const [deptModalOpen, setDeptModalOpen] = useState(false)

  // 측정값 / 노출기준 문자열 ↔ 숫자 변환 헬퍼 (DB·DTO 는 string 유지)
  const parseNumber = (s?: string): number | null => {
    if (s === undefined || s === null || s === '') return null
    const n = Number(s)
    return Number.isFinite(n) ? n : null
  }

  // ===== Queries =====
  const { data, isLoading } = useQuery({
    queryKey: ['wemImprovements', page, searchQuery],
    queryFn: () =>
      searchQuery
        ? searchImprovements(searchQuery, page, rowsPerPage)
        : fetchImprovements(page, rowsPerPage),
    enabled: viewMode === 'list',
  })

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['wemImprovementDetail', selectedItem?.id],
    queryFn: () => fetchImprovementDetail(selectedItem!.id),
    enabled: !!selectedItem?.id && (viewMode === 'detail' || viewMode === 'edit'),
  })

  // ===== Mutations =====
  const createMutation = useMutation({
    mutationFn: createImprovement,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['wemImprovements'] })
      await showSuccess(t('common.saved', '저장되었습니다'))
      handleBackToList()
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateImprovement,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['wemImprovements'] })
      queryClient.invalidateQueries({ queryKey: ['wemImprovementDetail'] })
      await showSuccess(t('common.saved', '저장되었습니다'))
      handleBackToList()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteImprovement,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['wemImprovements'] })
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

  const handleRowClick = (item: WemImprovement) => {
    setSelectedItem(item)
    setViewMode('detail')
  }

  const handleAddClick = () => {
    setSelectedItem(null)
    setFormData({ ...emptyForm, deadline: todayStr(), completionDate: todayStr() })
    setViewMode('create')
  }

  const handleEditClick = () => {
    if (!detail) return
    setFormData({
      processName: detail.processName,
      factorName: detail.factorName,
      measuredValue: detail.measuredValue || '',
      exposureStandard: detail.exposureStandard || '',
      exceedRate: detail.exceedRate ?? undefined,
      exceedLevel: detail.exceedLevel || '',
      department: detail.department || '',
      measurementDate: detail.measurementDate || '',
      measurementAgency: detail.measurementAgency || '',
      deadline: detail.deadline || '',
      improvementPlan: detail.improvementPlan || '',
      status: detail.status || '',
      completionDate: detail.completionDate || '',
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
  const filteredItems = statusFilter ? items.filter(i => i.status === statusFilter) : items
  const totalPages = data?.totalPages || 0

  // KPI cards
  const exceed2xCount = items.filter(i => i.exceedLevel === 'EXCEED_2X').length
  const exceed1xCount = items.filter(i => i.exceedLevel === 'EXCEED_1X').length
  const plannedCount = items.filter(i => i.status === 'PLANNED' || i.status === 'IN_PROGRESS').length
  const completedCount = items.filter(i => i.status === 'COMPLETED').length

  const getRemainingDaysColor = (days: number | null) => {
    if (days === null) return 'text.secondary'
    if (days < 14) return 'error.main'
    if (days < 30) return 'warning.main'
    return 'text.secondary'
  }

  const getExceedRateColor = (rate: number | null) => {
    if (rate === null) return 'text.secondary'
    if (rate > 200) return 'error.main'
    if (rate > 100) return 'warning.main'
    return 'text.secondary'
  }

  const getExceedLevelLabel = (level: string | null) => {
    if (!level) return ''
    return getExceedLevelCodeLabel(level)
  }

  // ===== RENDER: List =====
  if (viewMode === 'list') {
    return (
      <Box>
        {/* KPI Cards */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {[
            { label: t('wem.exceed2xCount', '2배이상 초과'), value: exceed2xCount, color: '#ef4444' },
            { label: t('wem.exceed1xCount', '1배이상 초과'), value: exceed1xCount, color: '#f59e0b' },
            { label: t('wem.improvePlanCount', '개선계획 수립'), value: plannedCount, color: '#3b82f6' },
            { label: t('wem.improveCompleted', '개선 완료'), value: completedCount, color: '#22c55e' },
          ].map((card, idx) => (
            <Grid item xs={6} md={3} key={idx}>
              <Paper sx={{ p: 2, borderLeft: 4, borderColor: card.color, borderLeftColor: card.color}}>
                <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                <Typography variant="h5" fontWeight="bold">{card.value}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Alert */}
        {exceed2xCount > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('wem.exceed2xAlert', '2배 이상 초과 항목이 있습니다. 즉시 개선이 필요합니다.')}
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
                    <TableCell sx={hSx}>{t('wem.processName')} / {t('wem.factorName')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('wem.measuredValue')} / {t('wem.exposureStandard')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('wem.exceedRate')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('wem.exceedLevel')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('wem.department')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('wem.deadline')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('wem.remainingDays')}</TableCell>
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
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">{item.processName}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.factorName}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{item.measuredValue || ''} / {item.exposureStandard || ''}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color={getExceedRateColor(item.exceedRate)}
                        >
                          {item.exceedRate !== null ? `${item.exceedRate}%` : ''}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {item.exceedLevel ? (
                          <Chip
                            label={getExceedLevelLabel(item.exceedLevel)}
                            color={EXCEED_LEVEL_COLORS[item.exceedLevel] || 'default'}
                            size="small"
                          />
                        ) : ''}
                      </TableCell>
                      <TableCell align="center">{item.department || ''}</TableCell>
                      <TableCell align="center">{item.deadline || ''}</TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color={getRemainingDaysColor(item.remainingDays)}
                        >
                          {item.remainingDays !== null ? `${item.remainingDays}${t('common.day', '일')}` : ''}
                        </Typography>
                      </TableCell>
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
            <Box sx={labelSx}>{t('wem.factorName')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.factorName}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('wem.measuredValue')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.measuredValue || ''}</Typography></Box>
            <Box sx={labelSx}>{t('wem.exposureStandard')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.exposureStandard || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('wem.exceedRate')}</Box>
            <Box sx={valBorderSx}>
              <Typography variant="body2" fontWeight="bold" color={getExceedRateColor(d.exceedRate)}>
                {d.exceedRate !== null ? `${d.exceedRate}%` : ''}
              </Typography>
            </Box>
            <Box sx={labelSx}>{t('wem.exceedLevel')}</Box>
            <Box sx={valSx}>
              {d.exceedLevel ? (
                <Chip label={getExceedLevelLabel(d.exceedLevel)} color={EXCEED_LEVEL_COLORS[d.exceedLevel] || 'default'} size="small" />
              ) : null}
            </Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('wem.department')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.department || ''}</Typography></Box>
            <Box sx={labelSx}>{t('wem.agency')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.measurementAgency || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('wem.deadline')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.deadline || ''}</Typography></Box>
            <Box sx={labelSx}>{t('wem.remainingDays')}</Box>
            <Box sx={valSx}>
              <Typography variant="body2" fontWeight="bold" color={getRemainingDaysColor(d.remainingDays)}>
                {d.remainingDays !== null ? `${d.remainingDays}${t('common.day', '일')}` : ''}
              </Typography>
            </Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('wem.improvementPlan')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.improvementPlan || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('common.status', '상태')}</Box>
            <Box sx={valBorderSx}>
              <Chip label={getStatusLabel(d.status) || d.status} color={STATUS_COLORS[d.status] || 'default'} size="small" />
            </Box>
            <Box sx={labelSx}>{t('wem.completionDate')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.completionDate || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('common.remarks', '비고')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.remarks || ''}</Typography></Box>
          </Box>
          {/* 작성자 | 작성일자 */}
          <Box sx={d.modifiedAt && d.modifiedAt !== d.createdAt ? rowSx : lastRowSx}>
            <Box sx={labelSx}>{t('common.creator', '작성자')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.createdByName || ''}</Typography></Box>
            <Box sx={labelSx}>{t('audit.createdAt', '작성일자')}</Box>
            <Box sx={valSx}><Typography variant="body2">{formatDate(d.createdAt)}</Typography></Box>
          </Box>
          {/* 수정자 | 수정일자 — 수정 이력 있을 때만 */}
          {d.modifiedAt && d.modifiedAt !== d.createdAt && (
            <Box sx={lastRowSx}>
              <Box sx={labelSx}>{t('common.modifier', '수정자')}</Box>
              <Box sx={valBorderSx}><Typography variant="body2">{d.modifiedByName || ''}</Typography></Box>
              <Box sx={labelSx}>{t('common.modifiedAt', '수정일자')}</Box>
              <Box sx={valSx}><Typography variant="body2">{formatDate(d.modifiedAt)}</Typography></Box>
            </Box>
          )}
        </Box>
        {/* Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
          {[
            [t('wem.processName'), d.processName],
            [t('wem.factorName'), d.factorName],
            [t('wem.measuredValue'), d.measuredValue],
            [t('wem.exposureStandard'), d.exposureStandard],
            [t('wem.exceedRate'), d.exceedRate !== null ? `${d.exceedRate}%` : ''],
            [t('wem.exceedLevel'), d.exceedLevel ? getExceedLevelLabel(d.exceedLevel) : ''],
            [t('wem.department'), d.department],
            [t('wem.agency'), d.measurementAgency],
            [t('wem.deadline'), d.deadline],
            [t('wem.remainingDays'), d.remainingDays !== null ? `${d.remainingDays}${t('common.day', '일')}` : ''],
            [t('wem.improvementPlan'), d.improvementPlan],
            [t('common.status', '상태'), getStatusLabel(d.status) || d.status],
            [t('wem.completionDate'), d.completionDate],
            [t('common.remarks', '비고'), d.remarks],
            [t('common.creator', '작성자'), d.createdByName || ''],
            [t('audit.createdAt', '작성일자'), formatDate(d.createdAt)],
            ...(d.modifiedAt && d.modifiedAt !== d.createdAt ? [
              [t('common.modifier', '수정자'), d.modifiedByName || ''],
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
    { label: t('wem.factorName'), node: <TextField size="small" fullWidth value={formData.factorName} onChange={(e) => setFormData({ ...formData, factorName: e.target.value })} /> },
    { label: t('wem.measuredValue'), node: (
      <NumberField size="small" fullWidth step={0.1}
        value={parseNumber(formData.measuredValue)}
        onChange={(v) => setFormData({ ...formData, measuredValue: v == null ? '' : String(v) })} />
    ) },
    { label: t('wem.exposureStandard'), node: (
      <NumberField size="small" fullWidth step={0.1}
        value={parseNumber(formData.exposureStandard)}
        onChange={(v) => setFormData({ ...formData, exposureStandard: v == null ? '' : String(v) })} />
    ) },
    { label: t('wem.exceedRate'), node: <NumberField size="small" fullWidth value={formData.exceedRate} onChange={(v) => setFormData({ ...formData, exceedRate: v ?? undefined })} /> },
    { label: t('wem.exceedLevel'), node: (
      <Select size="small" fullWidth value={formData.exceedLevel || ''} onChange={(e) => setFormData({ ...formData, exceedLevel: e.target.value })} displayEmpty>
        <MenuItem value="" disabled>선택하세요</MenuItem>
        {exceedLevelCodes.map(c => <MenuItem key={c.code} value={c.code}>{getExceedLevelCodeLabel(c.code)}</MenuItem>)}
      </Select>
    ) },
    { label: t('wem.department'), node: (
      <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
        <TextField size="small" fullWidth value={formData.department || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
        <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setDeptModalOpen(true)}>
          <PersonSearchIcon fontSize="small" />
        </Button>
      </Box>
    ) },
    { label: t('wem.agency'), node: <TextField size="small" fullWidth value={formData.measurementAgency || ''} onChange={(e) => setFormData({ ...formData, measurementAgency: e.target.value })} /> },
    { label: t('wem.deadline'), node: <DatePickerField value={formData.deadline || ''} onChange={(v) => setFormData({ ...formData, deadline: v })} /> },
    { label: t('wem.completionDate'), node: <DatePickerField value={formData.completionDate || ''} onChange={(v) => setFormData({ ...formData, completionDate: v })} /> },
    { label: t('wem.improvementPlan'), node: <TextField size="small" fullWidth multiline rows={3} value={formData.improvementPlan || ''} onChange={(e) => setFormData({ ...formData, improvementPlan: e.target.value })} /> },
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
        <Box sx={rowSx}>
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
          {t('common.cancel', '취소')}
        </Button>
        {canSee(MENU, 'DETAIL', '저장', getRoles(detail ?? {})) && (
        <Button variant="contained" onClick={handleSubmit} sx={{ flex: { xs: 1, sm: 'none' } }}>
          {t('common.save', '저장')}
        </Button>
        )}
      </Box>
      <DepartmentSelectModal
        open={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        initialDepartment={formData.department || ''}
        onConfirm={(dept) => {
          setFormData({ ...formData, department: dept })
          setDeptModalOpen(false)
        }}
      />
    </Box>
  )
}

export default WemImprovementTab
