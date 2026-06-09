import { formatUserName } from '../../utils/userDisplay'
import { useState, useMemo } from 'react'
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
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DeleteIcon from '@mui/icons-material/Delete'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import axiosInstance from '../../api/axiosInstance'
import { fetchTeamLeader } from '../../api/approvalApi'
import { HealthCheckupPlan, HealthCheckupPlanRequest } from '../../types/healthCheckupPlan.types'
import { ApiResponse, PageResponse, FileMetadata } from '../../types/common.types'
import DatePickerField from '../common/DatePickerField'
import LoadingOverlay from '../common/LoadingOverlay'
import NumberField from '../common/NumberField'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import DepartmentSelectModal from '../common/DepartmentSelectModal'
import useCodeMap from '../../hooks/useCodeMap'
import { useButtonRules } from '../../hooks/useButtonRules'
import { Role } from '../../data/buttonManageData'

const FILE_ENTITY_TYPE = 'health_checkup_plan'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

interface HealthCheckupPlanTabProps {
  // 이 탭에서 노출할 검진 종류. ['GENERAL','SPECIAL'] 이면 일반/특수만, ['OCCUPATIONAL'] 이면 직업병만.
  allowedTypes: string[]
}

// ===== API =====
const fetchPlans = async (
  checkupTypes: string[],
  planYear: string,
  status: string,
  page: number,
  size: number,
): Promise<PageResponse<HealthCheckupPlan>> => {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('size', String(size))
  if (planYear) params.set('planYear', planYear)
  if (status) params.set('status', status)
  // 백엔드는 단일 checkupType만 받으므로, allowedTypes가 1개일 때만 서버 필터링.
  if (checkupTypes.length === 1) params.set('checkupType', checkupTypes[0])
  const res = await axiosInstance.get<ApiResponse<PageResponse<HealthCheckupPlan>>>(
    `/health-checkup-plan?${params.toString()}`,
  )
  return res.data.data
}

const fetchPlanDetail = async (id: number): Promise<HealthCheckupPlan> => {
  const res = await axiosInstance.get<ApiResponse<HealthCheckupPlan>>(`/health-checkup-plan/${id}`)
  return res.data.data
}

const createPlan = async (data: HealthCheckupPlanRequest): Promise<HealthCheckupPlan> => {
  const res = await axiosInstance.post<ApiResponse<HealthCheckupPlan>>('/health-checkup-plan', data)
  return res.data.data
}

const updatePlan = async ({ id, data }: { id: number; data: HealthCheckupPlanRequest }): Promise<HealthCheckupPlan> => {
  const res = await axiosInstance.put<ApiResponse<HealthCheckupPlan>>(`/health-checkup-plan/${id}`, data)
  return res.data.data
}

const deletePlan = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/health-checkup-plan/${id}`)
}

const transitionPlan = async ({ id, action, rejectReason }: { id: number; action: string; rejectReason?: string }): Promise<HealthCheckupPlan> => {
  const res = await axiosInstance.patch<ApiResponse<HealthCheckupPlan>>(`/health-checkup-plan/${id}/transition`, { action, rejectReason })
  return res.data.data
}

const fetchFiles = async (planId: number): Promise<FileMetadata[]> => {
  const res = await axiosInstance.get<ApiResponse<FileMetadata[]>>(`/files/by-entity/${FILE_ENTITY_TYPE}/${planId}`)
  return res.data.data || []
}

const uploadFile = async ({ file, planId }: { file: File; planId: number }): Promise<FileMetadata> => {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('entityType', FILE_ENTITY_TYPE)
  fd.append('entityId', String(planId))
  const res = await axiosInstance.post<ApiResponse<FileMetadata>>('/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  return res.data.data
}

const deleteFile = async (fileId: number): Promise<void> => {
  await axiosInstance.delete(`/files/${fileId}`)
}

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'warning' | 'success' | 'error' | 'info'> = {
  PLANNED: 'default',
  PENDING_APPROVAL: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  REJECTED: 'error',
  CANCELLED: 'default',
}

const TYPE_COLORS: Record<string, 'primary' | 'info' | 'error'> = {
  GENERAL: 'primary',
  SPECIAL: 'info',
  OCCUPATIONAL: 'error',
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

const HealthCheckupPlanTab: React.FC<HealthCheckupPlanTabProps> = ({ allowedTypes }) => {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { showWarning, showSuccess, showConfirm, showError } = useAlert()
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const MENU = '보건 관리 › 건강 검진 관리 › 건강검진 계획'
  const isAdmin = user?.role === 'SYSTEM_ADMIN'
  const myRoles: string[] = ['guest', ...(isAdmin ? ['superAdmin'] : [user?.role ?? ''].filter(Boolean))]
  const currentWriter = user?.name || user?.username || ''
  const { codeList: typeCodes, getLabel: getTypeLabel } = useCodeMap('HEALTH_CHECKUP_TYPE')
  const { codeList: statusCodes, getLabel: getStatusLabel } = useCodeMap('HEALTH_CHECKUP_PLAN_STATUS')

  const filteredTypeCodes = useMemo(
    () => typeCodes.filter(c => allowedTypes.includes(c.code)),
    [typeCodes, allowedTypes],
  )

  const formatDate = (s?: string | null) => {
    if (!s) return ''
    const d = new Date(s)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${dd} ${h}:${min}`
  }

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<HealthCheckupPlan | null>(null)
  const [typeFilter, setTypeFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(0)
  const rowsPerPage = 10

  const currentYear = new Date().getFullYear()
  const emptyForm: HealthCheckupPlanRequest = {
    planYear: currentYear,
    checkupType: allowedTypes[0],
    planName: '',
    targetCount: 0,
    status: 'PLANNED',
    writer: currentWriter,
  }
  const [formData, setFormData] = useState<HealthCheckupPlanRequest>(emptyForm)
  const [approverPickTarget, setApproverPickTarget] = useState<'plan' | 'completion' | null>(null)
  const [deptModalOpen, setDeptModalOpen] = useState(false)
  // 등록(create) 모드에서는 plan id 가 없어 즉시 업로드 불가 — 클라이언트에서 staging 후 저장 직후 일괄 업로드
  const [pendingFiles, setPendingFiles] = useState<File[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ['healthCheckupPlan', allowedTypes.join(','), typeFilter, yearFilter, statusFilter, page],
    queryFn: () => {
      // 사용자가 typeFilter를 선택했으면 그것만, 아니면 allowedTypes 전체
      const types = typeFilter ? [typeFilter] : allowedTypes
      return fetchPlans(types, yearFilter, statusFilter, page, rowsPerPage)
    },
    enabled: viewMode === 'list',
  })

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['healthCheckupPlanDetail', selectedItem?.id],
    queryFn: () => fetchPlanDetail(selectedItem!.id),
    enabled: !!selectedItem?.id && (viewMode === 'detail' || viewMode === 'edit'),
  })

  const createMutation = useMutation({
    mutationFn: createPlan,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['healthCheckupPlan'] })
      await showSuccess(t('common.saved', '저장되었습니다'))
      handleBackToList()
    },
  })
  const updateMutation = useMutation({
    mutationFn: updatePlan,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['healthCheckupPlan'] })
      queryClient.invalidateQueries({ queryKey: ['healthCheckupPlanDetail'] })
      await showSuccess(t('common.saved', '저장되었습니다'))
      handleBackToList()
    },
  })
  const deleteMutation = useMutation({
    mutationFn: deletePlan,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['healthCheckupPlan'] })
      await showSuccess(t('common.deleted', '삭제되었습니다'))
      handleBackToList()
    },
  })

  const transitionMutation = useMutation({
    mutationFn: transitionPlan,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['healthCheckupPlan'] })
      queryClient.invalidateQueries({ queryKey: ['healthCheckupPlanDetail'] })
      await showSuccess(t('common.processed', '처리되었습니다.'))
      handleBackToList()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || t('common.error', '오류가 발생했습니다.')
      showError(msg)
    },
  })

  // 첨부파일
  const { data: files = [] } = useQuery({
    queryKey: ['healthCheckupPlanFiles', selectedItem?.id],
    queryFn: () => fetchFiles(selectedItem!.id),
    enabled: !!selectedItem?.id && (viewMode === 'detail' || viewMode === 'edit'),
  })
  const uploadFileMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthCheckupPlanFiles'] })
      showSuccess(t('common.uploaded', '업로드되었습니다.'))
    },
    onError: () => showError(t('common.error', '오류가 발생했습니다.')),
  })
  const deleteFileMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthCheckupPlanFiles'] })
      showSuccess(t('common.deleted', '삭제되었습니다'))
    },
    onError: () => showError(t('common.error', '오류가 발생했습니다.')),
  })

  const isProcessing = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || transitionMutation.isPending

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedItem(null)
    setFormData({ ...emptyForm })
    setPendingFiles([])
  }
  const handleReset = () => {
    setSearchText(''); setTypeFilter(''); setYearFilter(''); setStatusFilter(''); setPage(0)
  }
  const handleRowClick = (item: HealthCheckupPlan) => {
    setSelectedItem(item); setViewMode('detail')
  }
  const handleAddClick = async () => {
    setSelectedItem(null)
    const leader = await fetchTeamLeader(user?.deptCode)
    setFormData({
      ...emptyForm,
      writer: currentWriter,
      ...(leader ? {
        planApproverName: leader.name, planApproverPosition: leader.position, planApproverTeam: leader.team,
        completionApproverName: leader.name, completionApproverPosition: leader.position, completionApproverTeam: leader.team,
      } : {}),
    })
    setPendingFiles([])
    setViewMode('create')
  }
  const handleEditClick = () => {
    if (!detail) return
    setFormData({
      planYear: detail.planYear,
      checkupType: detail.checkupType,
      planName: detail.planName,
      targetDept: detail.targetDept || '',
      targetCount: detail.targetCount,
      hazardFactors: detail.hazardFactors || '',
      hospital: detail.hospital || '',
      planStartDate: detail.planStartDate || '',
      planEndDate: detail.planEndDate || '',
      status: detail.status,
      notes: detail.notes || '',
      planApproverUserId: detail.planApproverUserId ?? undefined,
      planApproverTeam: detail.planApproverTeam || '',
      planApproverPosition: detail.planApproverPosition || '',
      planApproverName: detail.planApproverName || '',
      completionApproverUserId: detail.completionApproverUserId ?? undefined,
      completionApproverTeam: detail.completionApproverTeam || '',
      completionApproverPosition: detail.completionApproverPosition || '',
      completionApproverName: detail.completionApproverName || '',
      writer: detail.writer || currentWriter,
    })
    setViewMode('edit')
  }

  const handleApproverPick = (users: UserInfo[]) => {
    if (users[0]) {
      const u = users[0]
      if (approverPickTarget === 'plan') {
        setFormData(f => ({ ...f, planApproverUserId: u.id, planApproverName: u.name, planApproverTeam: u.department || '', planApproverPosition: '' }))
      } else if (approverPickTarget === 'completion') {
        setFormData(f => ({ ...f, completionApproverUserId: u.id, completionApproverName: u.name, completionApproverTeam: u.department || '', completionApproverPosition: '' }))
      }
    }
    setApproverPickTarget(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (viewMode === 'edit' && selectedItem) {
      uploadFileMutation.mutate({ file: f, planId: selectedItem.id })
    } else if (viewMode === 'create') {
      // 등록 모드: 클라이언트 staging — 저장 직후 일괄 업로드
      setPendingFiles(prev => [...prev, f])
    }
    e.target.value = ''
  }
  const handleRemovePending = (idx: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== idx))
  }
  const handleDeleteClick = async () => {
    if (!selectedItem) return
    const ok = await showConfirm(
      `${t('common.confirmDeleteMessage', '삭제하시겠습니까?')}\n${t('common.deleteWarning', '이 작업은 되돌릴 수 없습니다.')}`,
      { title: t('common.delete', '삭제') }
    )
    if (ok) deleteMutation.mutate(selectedItem.id)
  }
  const handleSubmit = async () => {
    if (!formData.planName?.trim()) {
      showWarning(t('healthCheckupPlan.planName', '계획명') + ' ' + t('common.required', '필수입니다'))
      return
    }
    if (!formData.planYear) {
      showWarning(t('healthCheckupPlan.planYear', '연도') + ' ' + t('common.required', '필수입니다'))
      return
    }
    if (!formData.checkupType) {
      showWarning(t('healthCheckupPlan.checkupType', '검진종류') + ' ' + t('common.required', '필수입니다'))
      return
    }
    const ok = await showConfirm(t('common.confirmSave', '저장하시겠습니까?'))
    if (!ok) return
    if (viewMode === 'create') {
      try {
        const created = await createMutation.mutateAsync(formData)
        // 스테이징된 파일 일괄 업로드 후 정리
        if (pendingFiles.length > 0 && created?.id) {
          for (const f of pendingFiles) {
            try { await uploadFile({ file: f, planId: created.id }) } catch { /* 개별 실패 무시 */ }
          }
          queryClient.invalidateQueries({ queryKey: ['healthCheckupPlanFiles'] })
        }
        setPendingFiles([])
      } catch { /* createMutation onError 가 처리 */ }
    } else if (viewMode === 'edit' && selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, data: formData })
    }
  }

  const items = data?.content || []
  const filteredItems = searchText
    ? items.filter(i =>
        (i.planName || '').includes(searchText) ||
        (i.targetDept || '').includes(searchText) ||
        (i.hospital || '').includes(searchText),
      )
    : items
  const totalPages = data?.totalPages || 0

  const totalCount = data?.totalElements ?? items.length
  const inProgressCount = items.filter(i => i.status === 'IN_PROGRESS').length
  const completedCount = items.filter(i => i.status === 'COMPLETED').length
  const plannedCount = items.filter(i => i.status === 'PLANNED').length

  // ===== LIST =====
  if (viewMode === 'list') {
    return (
      <Box>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {[
            { label: t('healthCheckupPlan.kpiTotal', '전체 계획'), value: totalCount, color: '#3b82f6' },
            { label: t('healthCheckupPlan.kpiPlanned', '계획'),     value: plannedCount, color: '#64748b' },
            { label: t('healthCheckupPlan.kpiInProgress', '진행중'), value: inProgressCount, color: '#f59e0b' },
            { label: t('healthCheckupPlan.kpiCompleted', '완료'),    value: completedCount, color: '#22c55e' },
          ].map((card, idx) => (
            <Grid item xs={6} md={3} key={idx}>
              <Paper sx={{ p: 2, borderLeft: 4, borderColor: card.color }}>
                <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                <Typography variant="h5" fontWeight="bold">{card.value}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, alignItems: 'center' }}>
          {allowedTypes.length > 1 && (
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }} displayEmpty>
                <MenuItem value="">{t('common.all', '전체')}</MenuItem>
                {filteredTypeCodes.map(c => (
                  <MenuItem key={c.code} value={c.code}>{getTypeLabel(c.code)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <FormControl size="small" sx={{ minWidth: 90 }}>
            <Select value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setPage(0) }} displayEmpty>
              <MenuItem value="">{t('common.allYears', '전체연도')}</MenuItem>
              {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                <MenuItem key={y} value={String(y)}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }} displayEmpty>
              <MenuItem value="">{t('common.allStatus', '전체상태')}</MenuItem>
              {statusCodes.map(c => (
                <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <ListSearchBar
            value={searchText}
            onChange={setSearchText}
            onSearch={() => setPage(0)}
            placeholder={t('common.search', '검색')}
            sx={{ width: { xs: '100%', sm: 240 } }}
          />
          {/* 액션 버튼 — 모바일에서 한 줄 100% 폭, PC 에서는 우측 정렬 */}
          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', md: 'auto' }, ml: { md: 'auto' } }}>
            <Button onClick={handleReset} startIcon={<RefreshIcon />} variant="outlined" size="small"
              sx={{ flex: { xs: 1, md: 'none' } }}>
              {t('common.reset', '초기화')}
            </Button>
            {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick} size="small"
                sx={{ flex: { xs: 1, md: 'none' } }}>
                {t('common.new', '신규')}
              </Button>
            )}
          </Box>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : filteredItems.length === 0 ? (
          <Alert severity="info">{t('common.noData', '데이터가 없습니다')}</Alert>
        ) : (
          <>
            {/* PC 테이블 */}
            <TableContainer sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={hSx} align="center">{t('common.no', 'No')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('healthCheckupPlan.planYear', '연도')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('healthCheckupPlan.checkupType', '종류')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('healthCheckupPlan.planName', '계획명')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('healthCheckupPlan.targetDept', '대상부서')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('healthCheckupPlan.target', '대상/완료')}</TableCell>
                    <TableCell sx={{ ...hSx, whiteSpace: 'nowrap', minWidth: 200 }} align="center">{t('healthCheckupPlan.period', '기간')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('healthCheckupPlan.status', '상태')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.map((item, idx) => (
                    <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                      <TableCell align="center">{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell align="center">{item.planYear}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getTypeLabel(item.checkupType) || item.checkupType}
                          color={TYPE_COLORS[item.checkupType] || 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{item.planName}</TableCell>
                      <TableCell align="center">{item.targetDept || ''}</TableCell>
                      <TableCell align="center">{item.completedCount}/{item.targetCount}</TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {item.planStartDate || ''} ~ {item.planEndDate || ''}
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

            {/* 모바일 카드 */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1 }}>
              {filteredItems.map(item => (
                <Paper key={item.id} variant="outlined" onClick={() => handleRowClick(item)}
                  sx={{ p: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.planName}
                    </Typography>
                    <Chip size="small" label={getStatusLabel(item.status) || item.status} color={STATUS_COLORS[item.status] || 'default'} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                    <Chip size="small" variant="outlined" label={`${item.planYear}`} />
                    <Chip size="small" variant="outlined" label={getTypeLabel(item.checkupType) || item.checkupType} color={TYPE_COLORS[item.checkupType] || 'default'} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {item.targetDept || '-'} · 완료 {item.completedCount}/{item.targetCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', display: 'block' }}>
                    {item.planStartDate || ''} ~ {item.planEndDate || ''}
                  </Typography>
                </Paper>
              ))}
            </Box>
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination count={totalPages} page={page + 1} onChange={(_, p) => setPage(p - 1)} />
              </Box>
            )}
          </>
        )}
      </Box>
    )
  }

  // ===== DETAIL =====
  if (viewMode === 'detail') {
    if (detailLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
    const d = detail
    if (!d) return <Alert severity="error">{t('common.noData', '데이터가 없습니다')}</Alert>

    return (
      <Box>
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          {/* 계획명 (맨 위) */}
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('healthCheckupPlan.planName', '계획명')}</Box>
            <Box sx={{ ...valSx, flex: 3 }}><Typography variant="body2" fontWeight={600}>{d.planName}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('healthCheckupPlan.planYear', '연도')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.planYear}</Typography></Box>
            <Box sx={labelSx}>{t('healthCheckupPlan.checkupType', '종류')}</Box>
            <Box sx={valSx}>
              <Chip label={getTypeLabel(d.checkupType) || d.checkupType} color={TYPE_COLORS[d.checkupType] || 'default'} size="small" variant="outlined"/>
            </Box>
          </Box>
          {/* 대상부서 | 대상인원 */}
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('healthCheckupPlan.targetDept', '대상부서')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.targetDept || ''}</Typography></Box>
            <Box sx={labelSx}>{t('healthCheckupPlan.targetCount', '대상인원')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.targetCount}</Typography></Box>
          </Box>
          {/* 검진기관 | 상태 */}
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('healthCheckupPlan.hospital', '검진기관')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.hospital || ''}</Typography></Box>
            <Box sx={labelSx}>{t('healthCheckupPlan.status', '상태')}</Box>
            <Box sx={valSx}>
              <Chip label={getStatusLabel(d.status) || d.status} color={STATUS_COLORS[d.status] || 'default'} size="small"/>
            </Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('healthCheckupPlan.startDate', '시작일')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.planStartDate || ''}</Typography></Box>
            <Box sx={labelSx}>{t('healthCheckupPlan.endDate', '종료일')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.planEndDate || ''}</Typography></Box>
          </Box>
          {(d.checkupType !== 'GENERAL') && (
            <Box sx={rowSx}>
              <Box sx={labelSx}>{t('healthCheckupPlan.hazardFactors', '유해인자')}</Box>
              <Box sx={{ ...valSx, flex: 3 }}><Typography variant="body2">{d.hazardFactors || ''}</Typography></Box>
            </Box>
          )}
          {/* 비고 */}
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('common.remarks', '비고')}</Box>
            <Box sx={{ ...valSx, flex: 3 }}><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{d.notes || ''}</Typography></Box>
          </Box>
          {/* 작성자 | 작성일자 */}
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('common.creator', '작성자')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.writer || d.createdByName || ''}</Typography></Box>
            <Box sx={labelSx}>{t('audit.createdAt', '작성일자')}</Box>
            <Box sx={valSx}><Typography variant="body2">{formatDate(d.createdAt)}</Typography></Box>
          </Box>
          {/* 수정자 | 수정일자 — 수정 이력 있을 때만 */}
          {d.modifiedAt && d.modifiedAt !== d.createdAt && (
            <Box sx={rowSx}>
              <Box sx={labelSx}>{t('common.modifier', '수정자')}</Box>
              <Box sx={valBorderSx}><Typography variant="body2">{d.modifiedByName || ''}</Typography></Box>
              <Box sx={labelSx}>{t('common.modifiedAt', '수정일자')}</Box>
              <Box sx={valSx}><Typography variant="body2">{formatDate(d.modifiedAt)}</Typography></Box>
            </Box>
          )}
          {/* 계획 승인자 | 완료 승인자 */}
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('healthCheckupPlan.planApprover', '계획 승인자')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{formatUserName(d.planApproverTeam, d.planApproverName, d.planApproverPosition) || '-'}</Typography></Box>
            <Box sx={labelSx}>{t('healthCheckupPlan.completionApprover', '완료 승인자')}</Box>
            <Box sx={valSx}><Typography variant="body2">{formatUserName(d.completionApproverTeam, d.completionApproverName, d.completionApproverPosition) || '-'}</Typography></Box>
          </Box>
          {/* 첨부파일 — 맨 아래 */}
          <Box sx={lastRowSx}>
            <Box sx={labelSx}>{t('common.attachments', '첨부파일')}</Box>
            <Box sx={{ ...valSx, flex: 3, flexDirection: 'column', alignItems: 'stretch', gap: 0.5, py: 1 }}>
              {files.length === 0 ? (
                <Typography variant="body2" color="text.disabled">{t('common.noAttachments', '첨부파일이 없습니다')}</Typography>
              ) : (
                files.map(f => (
                  <Box key={f.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <AttachFileIcon fontSize="small" />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      <a href={`${axiosInstance.defaults.baseURL}/files/${f.id}`} target="_blank" rel="noopener noreferrer">{f.fileName}</a>
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </Box>

        {/* 반려 사유 */}
        {d.status === 'REJECTED' && d.rejectReason && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <strong>{t('healthCheckupPlan.rejectReason', '반려 사유')}:</strong> {d.rejectReason}
          </Alert>
        )}

        {(() => {
          const statusCode = d.status === 'PLANNED' || d.status === 'REJECTED' ? d.status : d.status
          const itemRoles: string[] = [...myRoles]
          if ((d.planApproverUserId && user?.id && d.planApproverUserId === user.id) ||
              (d.planApproverName && user?.name && d.planApproverName === user.name)) itemRoles.push('planApprover')
          if ((d.completionApproverUserId && user?.id && d.completionApproverUserId === user.id) ||
              (d.completionApproverName && user?.name && d.completionApproverName === user.name)) itemRoles.push('completionApprover')
          if (d.createdByName === user?.name) itemRoles.push('writer')
          return (
            <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, gap: 1, mt: 2, flexWrap: 'wrap' }}>
              <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: 1, sm: 'none' } }}>{t('common.backToList', '목록')}</Button>
              {(d.status === 'PLANNED' || d.status === 'REJECTED') && canSee(MENU, statusCode, '수정', itemRoles) && (
                <Button variant="contained" onClick={handleEditClick} sx={{ flex: { xs: 1, sm: 'none' } }}>{t('common.edit', '수정')}</Button>
              )}
              {(d.status === 'PLANNED' || d.status === 'REJECTED') && canSee(MENU, statusCode, '삭제', itemRoles) && (
                <Button variant="contained" color="error" onClick={handleDeleteClick} sx={{ flex: { xs: 1, sm: 'none' } }}>{t('common.delete', '삭제')}</Button>
              )}
              {(d.status === 'PLANNED' || d.status === 'REJECTED') && canSee(MENU, statusCode, '계획 결재 상신', itemRoles) && (
                <Button variant="contained" color="info" onClick={async () => {
                  if (await showConfirm(t('healthCheckupPlan.confirmSubmit', '계획 결재를 상신하시겠습니까?'))) {
                    transitionMutation.mutate({ id: d.id, action: 'submit' })
                  }
                }} sx={{ flex: { xs: 1, sm: 'none' } }}>{t('healthCheckupPlan.submitForApproval', '계획 결재 상신')}</Button>
              )}
              {d.status === 'PENDING_APPROVAL' && canSee(MENU, 'PENDING_APPROVAL', '반려', itemRoles) && (
                <Button variant="contained" color="warning" onClick={async () => {
                  const reason = window.prompt(t('healthCheckupPlan.enterRejectReason', '반려 사유를 입력하세요.'))
                  if (reason) transitionMutation.mutate({ id: d.id, action: 'reject', rejectReason: reason })
                }} sx={{ flex: { xs: 1, sm: 'none' } }}>{t('common.reject', '반려')}</Button>
              )}
              {d.status === 'PENDING_APPROVAL' && canSee(MENU, 'PENDING_APPROVAL', '계획 결재 승인', itemRoles) && (
                <Button variant="contained" color="success" onClick={async () => {
                  if (await showConfirm(t('healthCheckupPlan.confirmApprove', '계획 결재를 승인하시겠습니까?'))) {
                    transitionMutation.mutate({ id: d.id, action: 'approve' })
                  }
                }} sx={{ flex: { xs: 1, sm: 'none' } }}>{t('healthCheckupPlan.approvePlan', '계획 결재 승인')}</Button>
              )}
            </Box>
          )
        })()}
      </Box>
    )
  }

  // ===== CREATE / EDIT =====
  return (
    <Box>
      <LoadingOverlay open={isProcessing} />
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        {/* 계획명 — 맨 위 */}
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('healthCheckupPlan.planName', '계획명')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Box>
          <Box sx={{ ...valSx, flex: 3 }}>
            <TextField size="small" fullWidth value={formData.planName}
              onChange={(e) => setFormData({ ...formData, planName: e.target.value })}/>
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('healthCheckupPlan.planYear', '연도')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Box>
          <Box sx={valBorderSx}>
            <NumberField size="small" thousandSeparator={false} value={formData.planYear ?? null}
              onChange={(v) => setFormData({ ...formData, planYear: v ?? currentYear })}/>
          </Box>
          <Box sx={labelSx}>{t('healthCheckupPlan.checkupType', '종류')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Box>
          <Box sx={valSx}>
            <Select size="small" fullWidth value={formData.checkupType}
              onChange={(e) => setFormData({ ...formData, checkupType: e.target.value })}>
              {filteredTypeCodes.map(c => <MenuItem key={c.code} value={c.code}>{getTypeLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
        </Box>
        {/* 대상부서 | 대상인원 */}
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('healthCheckupPlan.targetDept', '대상부서')}</Box>
          <Box sx={valBorderSx}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
              <TextField size="small" fullWidth InputProps={{ readOnly: true }}
                value={formData.targetDept || ''}
                placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setDeptModalOpen(true)}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          </Box>
          <Box sx={labelSx}>{t('healthCheckupPlan.targetCount', '대상인원')}</Box>
          <Box sx={valSx}>
            <NumberField size="small" min={0} value={formData.targetCount ?? 0}
              onChange={(v) => setFormData({ ...formData, targetCount: v ?? 0 })}/>
          </Box>
        </Box>
        {/* 검진기관 | 상태 */}
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('healthCheckupPlan.hospital', '검진기관')}</Box>
          <Box sx={valBorderSx}>
            <TextField size="small" fullWidth value={formData.hospital || ''}
              onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}/>
          </Box>
          <Box sx={labelSx}>{t('healthCheckupPlan.status', '상태')}</Box>
          <Box sx={valSx}>
            <Select size="small" fullWidth value={formData.status || 'PLANNED'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
              {statusCodes.map(c => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('healthCheckupPlan.startDate', '시작일')}</Box>
          <Box sx={valBorderSx}>
            <DatePickerField value={formData.planStartDate || ''} onChange={(v) => setFormData({ ...formData, planStartDate: v })}/>
          </Box>
          <Box sx={labelSx}>{t('healthCheckupPlan.endDate', '종료일')}</Box>
          <Box sx={valSx}>
            <DatePickerField value={formData.planEndDate || ''} onChange={(v) => setFormData({ ...formData, planEndDate: v })}/>
          </Box>
        </Box>
        {formData.checkupType !== 'GENERAL' && (
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('healthCheckupPlan.hazardFactors', '유해인자')}</Box>
            <Box sx={{ ...valSx, flex: 3 }}>
              <TextField size="small" fullWidth value={formData.hazardFactors || ''}
                placeholder={t('healthCheckupPlan.hazardFactorsHint', '예: 소음, 분진, 유기용제')}
                onChange={(e) => setFormData({ ...formData, hazardFactors: e.target.value })}/>
            </Box>
          </Box>
        )}
        {/* 비고 */}
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('common.remarks', '비고')}</Box>
          <Box sx={{ ...valSx, flex: 3 }}>
            <TextField size="small" fullWidth multiline rows={3} value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}/>
          </Box>
        </Box>
        {/* 작성자 | 작성일자 — 작성자는 단순 텍스트 */}
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('common.creator', '작성자')}</Box>
          <Box sx={valBorderSx}>
            <Typography variant="body2">{formData.writer || ''}</Typography>
          </Box>
          <Box sx={labelSx}>{t('audit.createdAt', '작성일자')}</Box>
          <Box sx={valSx}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {viewMode === 'edit' && selectedItem ? formatDate(selectedItem.createdAt) : '-'}
            </Typography>
          </Box>
        </Box>
        {/* 수정자 | 수정일자 — 수정 모드에서 이력이 있을 때만 */}
        {viewMode === 'edit' && selectedItem?.modifiedAt && selectedItem.modifiedAt !== selectedItem.createdAt && (
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('common.modifier', '수정자')}</Box>
            <Box sx={valBorderSx}>
              <Typography variant="body2">{selectedItem.modifiedByName || ''}</Typography>
            </Box>
            <Box sx={labelSx}>{t('common.modifiedAt', '수정일자')}</Box>
            <Box sx={valSx}>
              <Typography variant="body2">{formatDate(selectedItem.modifiedAt)}</Typography>
            </Box>
          </Box>
        )}
        {/* 계획 승인자 | 완료 승인자 */}
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('healthCheckupPlan.planApprover', '계획 승인자')}</Box>
          <Box sx={valBorderSx}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
              <TextField fullWidth size="small" InputProps={{ readOnly: true }}
                value={formData.planApproverName || ''} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setApproverPickTarget('plan')}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          </Box>
          <Box sx={labelSx}>{t('healthCheckupPlan.completionApprover', '완료 승인자')}</Box>
          <Box sx={valSx}>
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', width: '100%' }}>
              <TextField size="small" sx={{ flex: 1, minWidth: 0 }} InputProps={{ readOnly: true }}
                value={formData.completionApproverName || ''} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setApproverPickTarget('completion')}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          </Box>
        </Box>
        {/* 첨부파일 — 맨 아래 */}
        <Box sx={lastRowSx}>
          <Box sx={labelSx}>{t('common.attachments', '첨부파일')}</Box>
          <Box sx={{ ...valSx, flex: 3, flexDirection: 'column', alignItems: 'stretch', gap: 0.5, py: 1 }}>
            <Box>
              <Button variant="outlined" component="label" size="small" startIcon={<CloudUploadIcon />}>
                {t('common.upload', '업로드')}
                <input type="file" hidden onChange={handleFileChange} />
              </Button>
            </Box>
            {viewMode === 'create' && pendingFiles.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {pendingFiles.map((f, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <AttachFileIcon fontSize="small" />
                    <Typography variant="body2" sx={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</Typography>
                    <IconButton size="small" color="error" onClick={() => handleRemovePending(idx)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
            {viewMode === 'edit' && files.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {files.map(f => (
                  <Box key={f.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <AttachFileIcon fontSize="small" />
                    <Typography variant="body2" sx={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.fileName}</Typography>
                    <IconButton size="small" color="error" onClick={() => deleteFileMutation.mutate(f.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, gap: 1, mt: 2 }}>
        <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: 1, sm: 'none' } }}>
          {viewMode === 'edit' ? t('common.cancel', '취소') : t('common.backToList', '목록')}
        </Button>
        <Button variant="contained" onClick={handleSubmit} sx={{ flex: { xs: 1, sm: 'none' } }}>
          {viewMode === 'edit' ? t('common.save', '저장') : t('common.register', '등록')}
        </Button>
      </Box>

      <UserSelectModal open={approverPickTarget !== null} onClose={() => setApproverPickTarget(null)}
        selectedUsers={[]} onConfirm={handleApproverPick} singleSelect useCompanyTree
        title={approverPickTarget === 'plan' ? t('healthCheckupPlan.selectPlanApprover', '계획 승인자 선택') : t('healthCheckupPlan.selectCompletionApprover', '완료 승인자 선택')} />

      <DepartmentSelectModal
        open={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        onConfirm={(deptName) => { setFormData({ ...formData, targetDept: deptName }); setDeptModalOpen(false) }}
        initialDepartment={formData.targetDept || ''}
        title={t('healthCheckupPlan.selectTargetDept', '대상부서 선택')}
      />
    </Box>
  )
}

export default HealthCheckupPlanTab
