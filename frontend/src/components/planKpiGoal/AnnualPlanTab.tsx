import { formatDate } from '../../utils/dateDefaults'
import { useState, useEffect } from 'react'
import { isSystemAdmin } from '../../utils/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useButtonRules } from '../../hooks/useButtonRules'
import {
  Box, TextField, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Typography, Pagination,
  IconButton, CircularProgress, Alert, Chip, Select, MenuItem,
  FormControl,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import axiosInstance from '../../api/axiosInstance'
import { fetchTeamLeader } from '../../api/approvalApi'
import { EhsPlan, EhsPlanRequest, EhsPlanGoal } from '../../types/planKpiGoal.types'
import { ApiResponse, PageResponse } from '../../types/common.types'
import NumberField from '../common/NumberField'
import LoadingOverlay from '../common/LoadingOverlay'
import RejectReasonDialog from '../common/RejectReasonDialog'
import ListSearchBar from '../common/ListSearchBar'
import useCodeMap from '../../hooks/useCodeMap'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import GoalsTable, { GOAL_TEMPLATE, buildTemplateGoals } from './GoalsTable'
import { formatUserName } from '../../utils/userDisplay'
import DevTestFillButton from '../common/DevTestFillButton'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const currentYear = new Date().getFullYear()
const FORM_NO = 'IMS-100-1'

// ===== API functions =====
const fetchPlans = async (year: number, page: number, size: number): Promise<PageResponse<EhsPlan>> => {
  const res = await axiosInstance.get<ApiResponse<PageResponse<EhsPlan>>>(`/ehs-plans?year=${year}&page=${page}&size=${size}`)
  return res.data.data
}

const searchPlans = async (year: number, keyword: string, page: number, size: number): Promise<PageResponse<EhsPlan>> => {
  const res = await axiosInstance.get<ApiResponse<PageResponse<EhsPlan>>>(`/ehs-plans/search?year=${year}&keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`)
  return res.data.data
}

const fetchPlanDetail = async (id: number): Promise<EhsPlan> => {
  const res = await axiosInstance.get<ApiResponse<EhsPlan>>(`/ehs-plans/${id}`)
  return res.data.data
}

const createPlan = async (data: EhsPlanRequest): Promise<EhsPlan> => {
  const res = await axiosInstance.post<ApiResponse<EhsPlan>>('/ehs-plans', data)
  return res.data.data
}

const updatePlan = async ({ id, data }: { id: number; data: EhsPlanRequest }): Promise<EhsPlan> => {
  const res = await axiosInstance.put<ApiResponse<EhsPlan>>(`/ehs-plans/${id}`, data)
  return res.data.data
}

const deletePlan = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/ehs-plans/${id}`)
}

type TransitionAction = 'submit' | 'approve' | 'reject' | 'complete'
const transitionPlan = async ({ id, action, rejectReason }: { id: number; action: TransitionAction; rejectReason?: string }): Promise<EhsPlan> => {
  const res = await axiosInstance.patch<ApiResponse<EhsPlan>>(`/ehs-plans/${id}/transition`, { action, rejectReason })
  return res.data.data
}

// ===== Constants =====
const STATUS_COLORS: Record<string, 'success' | 'info' | 'warning' | 'default' | 'primary'> = {
  DRAFT: 'default',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'info',
  DONE: 'success',
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

const AnnualPlanTab: React.FC = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { user: authUser } = useAuth()

  const formatDateOnly = (dateString?: string | null) => {
    if (!dateString) return ''
    return formatDate(dateString)
  }
  const todayIso = () => new Date().toISOString().substring(0, 10)
  const { showWarning, showSuccess, showConfirm, showError } = useAlert()
  const { getLabel: getStatusLabel } = useCodeMap('PLAN_STATUS')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<EhsPlan | null>(null)
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [year, setYear] = useState(currentYear)
  const [page, setPage] = useState(0)
  const rowsPerPage = 10

  const buildEmptyForm = (yearVal: number): EhsPlanRequest => ({
    planYear: yearVal,
    planName: '',
    description: '',
    createdByUserId: authUser?.id ?? null,
    createdByTeam: authUser?.department || '',
    createdByPosition: authUser?.position || '',
    createdByName: authUser?.name || '',
    planApproverUserId: null,
    planApproverTeam: '',
    planApproverPosition: '',
    planApproverName: '',
    completionApproverUserId: null,
    completionApproverTeam: '',
    completionApproverPosition: '',
    completionApproverName: '',
    goals: buildTemplateGoals(),
  })
  const [formData, setFormData] = useState<EhsPlanRequest>(buildEmptyForm(year))
  type UserPickTarget = 'planApprover' | 'completionApprover' | { kind: 'goalOwner'; index: number }
  const [userPickTarget, setUserPickTarget] = useState<UserPickTarget | null>(null)
  // 결재 반려 사유 입력 다이얼로그
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

  // ===== Queries =====
  const { data, isLoading } = useQuery({
    queryKey: ['ehsPlans', year, page, searchQuery],
    queryFn: () =>
      searchQuery
        ? searchPlans(year, searchQuery, page, rowsPerPage)
        : fetchPlans(year, page, rowsPerPage),
    enabled: viewMode === 'list',
  })

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['ehsPlanDetail', selectedItem?.id],
    queryFn: () => fetchPlanDetail(selectedItem!.id),
    enabled: !!selectedItem?.id && (viewMode === 'detail' || viewMode === 'edit'),
  })

  // ===== Mutations =====
  const createMutation = useMutation({
    mutationFn: createPlan,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['ehsPlans'] })
      await showSuccess(t('common.saved', '저장되었습니다'))
      handleBackToList()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      showError(msg || t('common.saveFailed', '저장에 실패했습니다'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: updatePlan,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['ehsPlans'] })
      queryClient.invalidateQueries({ queryKey: ['ehsPlanDetail'] })
      await showSuccess(t('common.saved', '저장되었습니다'))
      handleBackToList()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      showError(msg || t('common.saveFailed', '저장에 실패했습니다'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deletePlan,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['ehsPlans'] })
      await showSuccess(t('common.deleted', '삭제되었습니다'))
      handleBackToList()
    },
  })

  const transitionMutation = useMutation({
    mutationFn: transitionPlan,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['ehsPlans'] })
      queryClient.invalidateQueries({ queryKey: ['ehsPlanDetail'] })
      queryClient.invalidateQueries({ queryKey: ['kpiApprovedPlans'] })
      await showSuccess(t('common.saved', '저장되었습니다'))
    },
  })

  const isProcessing = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || transitionMutation.isPending

  // ===== Handlers =====
  const handleBackToList = () => {
    setViewMode('list')
    setSelectedItem(null)
    setFormData(buildEmptyForm(year))
  }

  const handleReset = () => {
    setSearchText('')
    setSearchQuery('')
    setPage(0)
  }

  const handleSearch = () => {
    setSearchQuery(searchText)
    setPage(0)
  }

  const handleRowClick = (item: EhsPlan) => {
    setSelectedItem(item)
    setViewMode('detail')
  }

  const handleAddClick = async () => {
    setSelectedItem(null)
    const leader = await fetchTeamLeader(authUser?.deptCode)
    setFormData({
      ...buildEmptyForm(year),
      ...(leader ? {
        planApproverName: leader.name, planApproverPosition: leader.position, planApproverTeam: leader.team,
        completionApproverName: leader.name, completionApproverPosition: leader.position, completionApproverTeam: leader.team,
      } : {}),
    })
    setViewMode('create')
  }

  useEffect(() => {
    if (viewMode === 'edit' && detail) {
      // 템플릿 기준으로 4행 보장: 저장된 goals 가 있으면 index 매칭, 없으면 템플릿 기본값
      const saved = detail.goals || []
      const goals: EhsPlanGoal[] = GOAL_TEMPLATE.map((tpl, idx) => {
        const s = saved[idx]
        return {
          ...(s || {}),
          goalText: tpl.goalText || '',  // 항상 템플릿 값 강제
          subGoal: tpl.subGoal,           // 항상 템플릿 값 강제
          sortOrder: (idx + 1) * 10,
        }
      })
      setFormData({
        planYear: detail.planYear,
        planName: detail.planName,
        description: detail.description || '',
        status: detail.status || '',
        remarks: detail.remarks || '',
        createdByUserId: detail.createdByUserId,
        createdByTeam: detail.createdByTeam || '',
        createdByPosition: detail.createdByPosition || '',
        createdByName: detail.createdByName || '',
        planApproverUserId: detail.planApproverUserId,
        planApproverTeam: detail.planApproverTeam || '',
        planApproverPosition: detail.planApproverPosition || '',
        planApproverName: detail.planApproverName || '',
        completionApproverUserId: detail.completionApproverUserId,
        completionApproverTeam: detail.completionApproverTeam || '',
        completionApproverPosition: detail.completionApproverPosition || '',
        completionApproverName: detail.completionApproverName || '',
        goals,
      })
    }
  }, [viewMode, detail])

  const handleEditClick = () => setViewMode('edit')

  const handleDeleteClick = async () => {
    if (!selectedItem) return
    const confirmed = await showConfirm(
      `${t('common.confirmDeleteMessage', '삭제하시겠습니까?')}\n${t('common.deleteWarning', '이 작업은 되돌릴 수 없습니다.')}`,
      { title: t('common.delete', '삭제') }
    )
    if (confirmed) deleteMutation.mutate(selectedItem.id)
  }

  const handleSubmit = async () => {
    // 필수값 검증
    if (!formData.planName?.trim()) {
      showWarning(t('pkg.planName', '계획명') + ' ' + t('common.required', '필수입니다'))
      return
    }
    if (!formData.description?.trim()) {
      showWarning(t('pkg.description', '설명') + ' ' + t('common.required', '필수입니다'))
      return
    }
    if (!formData.planApproverName?.trim()) {
      showWarning(t('pkg.planApprover', '계획 승인자') + ' ' + t('common.required', '필수입니다'))
      return
    }
    if (!formData.completionApproverName?.trim()) {
      showWarning(t('pkg.completionApprover', '완료 승인자') + ' ' + t('common.required', '필수입니다'))
      return
    }
    const confirmed = await showConfirm(t('common.confirmSave', '저장하시겠습니까?'))
    if (!confirmed) return

    if (viewMode === 'create') createMutation.mutate(formData)
    else if (viewMode === 'edit' && selectedItem) updateMutation.mutate({ id: selectedItem.id, data: formData })
  }

  const handleUserPick = (users: UserInfo[]) => {
    if (users.length > 0 && userPickTarget) {
      const u = users[0]
      if (userPickTarget === 'planApprover') {
        setFormData(f => ({
          ...f,
          planApproverUserId: u.id,
          planApproverTeam: u.department || '',
          planApproverPosition: u.position || '',
          planApproverName: u.name,
        }))
      } else if (userPickTarget === 'completionApprover') {
        setFormData(f => ({
          ...f,
          completionApproverUserId: u.id,
          completionApproverTeam: u.department || '',
          completionApproverPosition: u.position || '',
          completionApproverName: u.name,
        }))
      } else if (typeof userPickTarget === 'object' && userPickTarget.kind === 'goalOwner') {
        const idx = userPickTarget.index
        setFormData(f => {
          const next = [...(f.goals || [])]
          next[idx] = { ...next[idx], ownerUserId: u.id, ownerTeam: u.department || '', ownerName: u.name }
          return { ...f, goals: next }
        })
      }
    }
    setUserPickTarget(null)
  }

  // 권한 헬퍼: 계획 승인자 본인 또는 admin 만 계획 승인/반려 가능
  const isAdmin = isSystemAdmin(authUser)
  const { canSee } = useButtonRules()
  const MENU_ANNUAL = 'EHS 경영 › KPI목표 › 연간계획'
  const getRoles = (d: { createdByUserId?: number|null; createdByName?: string|null; planApproverUserId?: number|null; planApproverName?: string|null; completionApproverUserId?: number|null; completionApproverName?: string|null }): string[] => {
    const roles: string[] = ['guest']
    if (isAdmin) roles.push('superAdmin')
    else if (authUser?.role) roles.push(authUser.role)
    if ((d.createdByUserId != null && d.createdByUserId === authUser?.id) ||
        (!d.createdByUserId && d.createdByName && d.createdByName === authUser?.name)) roles.push('writer')
    if ((d.planApproverUserId && authUser?.id && d.planApproverUserId === authUser.id) ||
        (d.planApproverName && authUser?.name && d.planApproverName === authUser.name)) roles.push('planApprover')
    if ((d.completionApproverUserId && authUser?.id && d.completionApproverUserId === authUser.id) ||
        (d.completionApproverName && authUser?.name && d.completionApproverName === authUser.name)) roles.push('completionApprover')
    return roles
  }
  const myRoles: string[] = ['guest', ...(authUser?.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : (authUser?.role ? [authUser.role] : []))]

  const updateGoal = (idx: number, patch: Partial<EhsPlanGoal>) => {
    setFormData(f => {
      const next = [...(f.goals || [])]
      next[idx] = { ...next[idx], ...patch }
      return { ...f, goals: next }
    })
  }

  // DEV ONLY — 비어있는 항목을 연간 계획 더미데이터로 채움 (입력값·승인자·작성자 보존)
  const fillTestData = () => {
    setFormData(f => ({
      ...f,
      planName: f.planName || `${f.planYear}년 EHS 연간 안전보건계획`,
      description: f.description || '산업재해 예방 및 안전보건경영시스템 강화를 위한 연간 추진 계획',
      remarks: f.remarks || '정기 연간계획 (테스트 데이터)',
    }))
  }

  const items = data?.content || []
  const filteredItems = items
  const totalPages = data?.totalPages || 0

  const getStatusChipLabel = (status: string) => getStatusLabel(status) || status

  // ===== RENDER: List =====
  if (viewMode === 'list') {
    return (
      <Box>
        {/* Toolbar - PC */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mb: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select value={year} onChange={(e) => { setYear(Number(e.target.value)); setPage(0) }}>
              {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <ListSearchBar
            value={searchText}
            onChange={setSearchText}
            onSearch={handleSearch}
            placeholder={t('annualPlan.searchPlaceholder', '계획명으로 검색')}
            sx={{ minWidth: 240 }}
          />
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
          <Box sx={{ flex: 1 }} />
          {canSee(MENU_ANNUAL, 'LIST', '신규 등록', myRoles) && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick} size="small">
              {t('common.new')}
            </Button>
          )}
        </Box>
        {/* Toolbar - Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <FormControl size="small" fullWidth>
            <Select value={year} onChange={(e) => { setYear(Number(e.target.value)); setPage(0) }}>
              {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ListSearchBar
              fullWidth
              value={searchText}
              onChange={setSearchText}
              onSearch={handleSearch}
              placeholder={t('annualPlan.searchPlaceholder', '계획명으로 검색')}
            />
            <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
          </Box>
          {canSee(MENU_ANNUAL, 'LIST', '신규 등록', myRoles) && (
            <Button variant="contained" fullWidth startIcon={<AddIcon />} onClick={handleAddClick} size="small">
              {t('common.new')}
            </Button>
          )}
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : filteredItems.length === 0 ? (
          <Alert severity="info">{t('common.noData')}</Alert>
        ) : (
          <>
            <TableContainer sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={hSx} align="center">{t('common.no')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('pkg.formNo', '서식번호')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('pkg.planYear')}</TableCell>
                    <TableCell sx={hSx}>{t('pkg.planName')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('pkg.writer', '작성자')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('pkg.planApprover', '계획 승인자')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('pkg.completionApprover', '완료 승인자')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('pkg.status')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.map((item, idx) => (
                    <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                      <TableCell align="center">{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell align="center">{FORM_NO}</TableCell>
                      <TableCell align="center">{item.planYear}</TableCell>
                      <TableCell>{item.planName}</TableCell>
                      <TableCell align="center">{item.createdByName || ''}</TableCell>
                      <TableCell align="center">{item.planApproverName || ''}</TableCell>
                      <TableCell align="center">{item.completionApproverName || ''}</TableCell>
                      <TableCell align="center">
                        <Chip label={getStatusChipLabel(item.status)} color={STATUS_COLORS[item.status] || 'default'} size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {/* Mobile Cards */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              {filteredItems.map((item) => (
                <Paper key={item.id} sx={{ p: 2, cursor: 'pointer', border: 1, borderColor: 'divider' }} onClick={() => handleRowClick(item)}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                    <Chip label={getStatusChipLabel(item.status)} color={STATUS_COLORS[item.status] || 'default'} size="small" />
                    <Typography variant="caption" color="text.secondary">{FORM_NO} · {item.planYear}</Typography>
                  </Box>
                  <Typography fontWeight="bold" color="primary" sx={{ mb: 0.5 }}>{item.planName}</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 90 }}>{t('pkg.writer', '작성자')}</Typography>
                      <Typography variant="body2">{item.createdByName || ''}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 90 }}>{t('pkg.planApprover', '계획 승인')}</Typography>
                      <Typography variant="body2">{item.planApproverName || ''}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 90 }}>{t('pkg.completionApprover', '완료 승인')}</Typography>
                      <Typography variant="body2">{item.completionApproverName || ''}</Typography>
                    </Box>
                  </Box>
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

  // ===== RENDER: Detail =====
  if (viewMode === 'detail') {
    if (detailLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
    const d = detail
    if (!d) return <Alert severity="error">{t('common.noData')}</Alert>

    return (
      <Box>
       {/* 반려 사유 배너 — DRAFT/REJECTED 상태에서 rejectReason 이 있을 때 강조 표시 */}
       {d.rejectReason && (d.status === 'DRAFT' || d.status === 'REJECTED') && (
         <Box sx={{ mb: 2, p: 2, bgcolor: 'error.lighter', border: 1, borderColor: 'error.light', borderRadius: 1 }}>
           <Typography variant="body2" color="error.main" fontWeight="bold" sx={{ mb: 0.5 }}>
             {t('common.rejectReasonTitle', '반려 사유')}
           </Typography>
           <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{d.rejectReason}</Typography>
         </Box>
       )}

       <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ minWidth: 720, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('pkg.formNo', '서식번호')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{FORM_NO}</Typography></Box>
            <Box sx={labelSx}>{t('pkg.planYear')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.planYear}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('pkg.planName')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.planName}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('pkg.description')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.description || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('common.remarks', '비고')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.remarks || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('pkg.writer', '작성자')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{formatUserName(d.createdByTeam, d.createdByName, d.createdByPosition)}</Typography></Box>
            <Box sx={labelSx}>{t('pkg.createdDate', '작성일자')}</Box>
            <Box sx={valSx}><Typography variant="body2">{formatDateOnly(d.createdAt)}</Typography></Box>
          </Box>
          {d.modifiedAt && d.modifiedAt !== d.createdAt && (
            <Box sx={rowSx}>
              <Box sx={labelSx}>{t('pkg.modifier', '수정자')}</Box>
              <Box sx={valBorderSx}><Typography variant="body2">{formatUserName(d.modifiedByTeam, d.modifiedByName, d.modifiedByPosition)}</Typography></Box>
              <Box sx={labelSx}>{t('pkg.modifiedDate', '수정일자')}</Box>
              <Box sx={valSx}><Typography variant="body2">{formatDateOnly(d.modifiedAt)}</Typography></Box>
            </Box>
          )}
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('pkg.planApprover', '계획 승인자')}</Box>
            <Box sx={valBorderSx}>
              <Typography variant="body2">{formatUserName(d.planApproverTeam, d.planApproverName, d.planApproverPosition)}</Typography>
            </Box>
            <Box sx={labelSx}>{t('pkg.completionApprover', '완료 승인자')}</Box>
            <Box sx={valSx}>
              <Typography variant="body2">{formatUserName(d.completionApproverTeam, d.completionApproverName, d.completionApproverPosition)}</Typography>
            </Box>
          </Box>
          <Box sx={{ ...rowSx, borderBottom: 0 }}>
            <Box sx={labelSx}>{t('pkg.status')}</Box>
            <Box sx={valSx}>
              <Chip label={getStatusChipLabel(d.status)} color={STATUS_COLORS[d.status] || 'default'} size="small" />
            </Box>
          </Box>
        </Box>
       </Box>

        <GoalsTable goals={d.goals || []} mode="readOnly" />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ width: 'auto' }}>{t('common.backToList')}</Button>
          {selectedItem && d.status === 'DRAFT' && canSee(MENU_ANNUAL, 'DRAFT', '계획 결재 상신', getRoles(d)) && (
            <Button variant="contained" color="info"
              onClick={() => transitionMutation.mutate({ id: selectedItem.id, action: 'submit' })}
              sx={{ width: 'auto' }}>
              {t('pkg.planSubmit', '계획 결재 상신')}
            </Button>
          )}
          {selectedItem && d.status === 'PENDING_APPROVAL' && !(authUser?.id && d.createdByUserId === authUser.id) && canSee(MENU_ANNUAL, 'PENDING_APPROVAL', '반려', getRoles(d)) && (
            <Button variant="contained" color="warning"
              onClick={() => setRejectDialogOpen(true)}
              sx={{ width: 'auto' }}>
              {t('pkg.reject', '반려')}
            </Button>
          )}
          {selectedItem && d.status === 'PENDING_APPROVAL' && !(authUser?.id && d.createdByUserId === authUser.id) && canSee(MENU_ANNUAL, 'PENDING_APPROVAL', '계획 승인', getRoles(d)) && (
            <Button variant="contained" color="success"
              onClick={async () => {
                const ok = await showConfirm(t('pkg.confirmApprove', '승인 하시겠습니까?'))
                if (ok) transitionMutation.mutate({ id: selectedItem.id, action: 'approve' })
              }}
              sx={{ width: 'auto' }}>
              {t('pkg.planApprove', '계획 승인')}
            </Button>
          )}
          {/* 완료 승인은 KPI현황 탭에서 처리하도록 분리됨 */}
          {d.status === 'DRAFT' && canSee(MENU_ANNUAL, 'DRAFT', '수정', getRoles(d)) && (
            <Button variant="contained" onClick={handleEditClick} sx={{ width: 'auto' }}>{t('common.edit')}</Button>
          )}
          {d.status === 'DRAFT' && canSee(MENU_ANNUAL, 'DRAFT', '삭제', getRoles(d)) && (
            <Button variant="contained" color="error" onClick={handleDeleteClick} sx={{ width: 'auto' }}>{t('common.delete')}</Button>
          )}
        </Box>

        <RejectReasonDialog
          open={rejectDialogOpen}
          stage={t('pkg.planReject', '계획 결재 반려')}
          onClose={() => setRejectDialogOpen(false)}
          onConfirm={(reason) => {
            if (selectedItem) {
              transitionMutation.mutate({ id: selectedItem.id, action: 'reject', rejectReason: reason })
            }
            setRejectDialogOpen(false)
          }}
          loading={transitionMutation.isPending}
        />
      </Box>
    )
  }

  // ===== RENDER: Create / Edit =====
  return (
    <Box>
      <LoadingOverlay open={isProcessing} />
     <Box sx={{ overflowX: 'auto' }}>
      <Box sx={{ minWidth: 720, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('pkg.formNo', '서식번호')}</Box>
          <Box sx={valBorderSx}><Typography variant="body2">{FORM_NO}</Typography></Box>
          <Box sx={labelSx}>{t('pkg.planYear')}</Box>
          <Box sx={valSx}>
            <NumberField size="small" fullWidth thousandSeparator={false}
              value={formData.planYear}
              onChange={(v) => setFormData({ ...formData, planYear: v ?? currentYear })} />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('pkg.planName', '계획명')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Box>
          <Box sx={valSx}>
            <TextField size="small" fullWidth
              value={formData.planName}
              onChange={(e) => setFormData({ ...formData, planName: e.target.value })} />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('pkg.description', '설명')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Box>
          <Box sx={valSx}>
            <TextField size="small" fullWidth multiline rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('common.remarks', '비고')}</Box>
          <Box sx={valSx}>
            <TextField size="small" fullWidth multiline rows={3}
              value={formData.remarks || ''}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('pkg.writer', '작성자')}</Box>
          <Box sx={valBorderSx}>
            <Typography variant="body2">{formatUserName(formData.createdByTeam, formData.createdByName, formData.createdByPosition)}</Typography>
          </Box>
          <Box sx={labelSx}>{t('pkg.createdDate', '작성일자')}</Box>
          <Box sx={valSx}>
            <Typography variant="body2">
              {viewMode === 'edit' && detail ? formatDateOnly(detail.createdAt) : todayIso()}
            </Typography>
          </Box>
        </Box>
        {viewMode === 'edit' && detail && detail.modifiedAt && detail.modifiedAt !== detail.createdAt && (
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('pkg.modifier', '수정자')}</Box>
            <Box sx={valBorderSx}>
              <Typography variant="body2">{formatUserName(detail.modifiedByTeam, detail.modifiedByName, detail.modifiedByPosition)}</Typography>
            </Box>
            <Box sx={labelSx}>{t('pkg.modifiedDate', '수정일자')}</Box>
            <Box sx={valSx}>
              <Typography variant="body2">{formatDateOnly(detail.modifiedAt)}</Typography>
            </Box>
          </Box>
        )}
        <Box sx={{ ...rowSx, borderBottom: 0 }}>
          <Box sx={labelSx}>{t('pkg.planApprover', '계획 승인자')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Box>
          <Box sx={valBorderSx}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
              <TextField size="small" fullWidth InputProps={{ readOnly: true }}
                value={formatUserName(formData.planApproverTeam, formData.planApproverName, formData.planApproverPosition) || ''} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setUserPickTarget('planApprover')}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          </Box>
          <Box sx={labelSx}>{t('pkg.completionApprover', '완료 승인자')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Box>
          <Box sx={valSx}>
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', width: '100%' }}>
              <TextField size="small" sx={{ flex: 1, minWidth: 0 }} InputProps={{ readOnly: true }}
                value={formatUserName(formData.completionApproverTeam, formData.completionApproverName, formData.completionApproverPosition) || ''} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setUserPickTarget('completionApprover')}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
     </Box>

      <GoalsTable
        goals={formData.goals || []}
        mode="plan"
        onChange={updateGoal}
        onPickOwner={(idx) => setUserPickTarget({ kind: 'goalOwner', index: idx })}
      />

      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, gap: 1, mt: 2 }}>
        {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
        <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: 1, sm: 'none' } }}>
          {viewMode === 'edit' ? t('common.cancel') : t('common.backToList')}
        </Button>
        <Button variant="contained" onClick={handleSubmit} sx={{ flex: { xs: 1, sm: 'none' } }}>
          {viewMode === 'edit' ? t('common.save') : t('common.register')}
        </Button>
      </Box>

      <UserSelectModal
        open={userPickTarget !== null}
        onClose={() => setUserPickTarget(null)}
        selectedUsers={[]}
        onConfirm={handleUserPick}
        singleSelect
        useCompanyTree
        title={userPickTarget === 'planApprover'
          ? t('pkg.selectPlanApprover', '계획 승인자 지정')
          : userPickTarget === 'completionApprover'
          ? t('pkg.selectCompletionApprover', '완료 승인자 지정')
          : t('common.selectEmployee', '담당자 지정')}
      />

      {/* 결재 반려 사유 입력 다이얼로그 — 사유 필수 */}
      <RejectReasonDialog
        open={rejectDialogOpen}
        stage={t('pkg.planReject', '계획 결재 반려')}
        onClose={() => setRejectDialogOpen(false)}
        onConfirm={(reason) => {
          if (selectedItem) {
            transitionMutation.mutate({ id: selectedItem.id, action: 'reject', rejectReason: reason })
          }
          setRejectDialogOpen(false)
        }}
        loading={transitionMutation.isPending}
      />
    </Box>
  )
}

export default AnnualPlanTab
