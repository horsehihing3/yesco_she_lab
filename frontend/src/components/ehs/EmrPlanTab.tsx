import { formatUserName } from '../../utils/userDisplay'
import { useState } from 'react'
import { fmtPerson } from '../../utils/personFormat'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useButtonRules } from '../../hooks/useButtonRules'
import { Role } from '../../data/buttonManageData'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, Select, MenuItem,
  FormControl, Chip, Pagination, CircularProgress, Alert, IconButton, Checkbox,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import { Autocomplete, Chip as MuiChip } from '@mui/material'
import DatePickerField from '../common/DatePickerField'
import RejectReasonDialog from '../common/RejectReasonDialog'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import DepartmentSelectModal from '../common/DepartmentSelectModal'
import { emergencyPlanApi, emergencyResourceApi } from '../../api/emergencyExtendedApi'
import { fetchSafetyTemplates } from '../../api/safetyChecklistApi'
import SafetyChecklistTab from './SafetyChecklistTab'
import { SafetyChecklistTemplate } from '../../types/safetyChecklist.types'
import { EmergencyPlan, EmergencyPlanRequest, EmergencyResource } from '../../types/emergencyExtended.types'
import useCodeMap from '../../hooks/useCodeMap'
import { fetchTeamLeader } from '../../api/approvalApi'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'
type UserPickTarget = 'planApprover' | 'completionApprover' | null

const labelSx = {
  width: 140, minWidth: 140, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: 'divider',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center',
}
const valueSx = { flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem' }
const valueBorderSx = { ...valueSx, borderRight: 1, borderColor: 'divider' }
const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'success' | 'primary'> = {
  DRAFT: 'default',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'info',
  DONE: 'success',
}

const buildEmptyForm = (authUser: ReturnType<typeof useAuth>['user']): EmergencyPlanRequest => ({
  planType: '',
  planName: '',
  status: 'DRAFT',
  createdByUserId: authUser?.id ?? null,
  createdByTeam: authUser?.department || '',
  createdByPosition: authUser?.position || '',
  createdByName: authUser?.name || '',
  planApproverUserId: null, planApproverTeam: '', planApproverPosition: '', planApproverName: '',
  completionApproverUserId: null, completionApproverTeam: '', completionApproverPosition: '', completionApproverName: '',
})

const EmrPlanTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm, showWarning } = useAlert()
  const { user: authUser } = useAuth()
  const isAdmin = authUser?.role === 'SYSTEM_ADMIN'
  const canEditDraft = (item: { createdByUserId?: number | null }) => isAdmin || item.createdByUserId === authUser?.id
  const { canSee } = useButtonRules()
  const MENU = 'EHS 경영 › 비상 훈련 › 비상 계획'
  const getRoles = (item: { createdByUserId?: number|null; planApproverUserId?: number|null; planApproverName?: string|null; completionApproverUserId?: number|null; completionApproverName?: string|null }): string[] => {
    const roles: string[] = ['guest']
    if (isAdmin) roles.push('superAdmin')
    else if (authUser?.role) roles.push(authUser.role)
    if (item.createdByUserId === authUser?.id) roles.push('writer')
    if ((item.planApproverUserId && authUser?.id && item.planApproverUserId === authUser.id) ||
        (item.planApproverName && authUser?.name && item.planApproverName === authUser.name)) roles.push('planApprover')
    if ((item.completionApproverUserId && authUser?.id && item.completionApproverUserId === authUser.id) ||
        (item.completionApproverName && authUser?.name && item.completionApproverName === authUser.name)) roles.push('completionApprover')
    return roles
  }
  const myRoles: string[] = ['guest', ...(isAdmin ? ['superAdmin'] : [authUser?.role ?? ''].filter(Boolean))]
  const { codeList: planTypeCodes, getLabel: getPlanTypeLabel } = useCodeMap('EMERGENCY_PLAN_TYPE')
  const { getLabel: getStatusLabel } = useCodeMap('PLAN_STATUS')

  // 비상대응 체크리스트 목록
  const { data: allTemplates } = useQuery({
    queryKey: ['safetyTemplates', 'EMERGENCY'],
    queryFn: fetchSafetyTemplates,
  })
  const emrChecklists = (allTemplates || []).filter((t: SafetyChecklistTemplate) => t.categoryType === 'EMERGENCY')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<EmergencyPlan | null>(null)
  const [form, setForm] = useState<EmergencyPlanRequest>(buildEmptyForm(authUser))
  const [page, setPage] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const pageSize = 10

  // 모달 상태
  const [userPickTarget, setUserPickTarget] = useState<UserPickTarget>(null)
  const [showDeptModal, setShowDeptModal] = useState(false)
  const [showResponsibleUserModal, setShowResponsibleUserModal] = useState(false)

  const handleApproverPick = (users: UserInfo[]) => {
    if (users.length > 0 && userPickTarget) {
      const u = users[0]
      if (userPickTarget === 'planApprover') {
        setForm(f => ({ ...f, planApproverUserId: u.id, planApproverTeam: u.department || '', planApproverPosition: u.position || '', planApproverName: u.name }))
      } else if (userPickTarget === 'completionApprover') {
        setForm(f => ({ ...f, completionApproverUserId: u.id, completionApproverTeam: u.department || '', completionApproverPosition: u.position || '', completionApproverName: u.name }))
      }
    }
    setUserPickTarget(null)
  }

  const handleResponsibleUserPick = (users: UserInfo[]) => {
    if (users.length > 0) setForm(f => ({ ...f, responsibleName: users[0].name }))
    setShowResponsibleUserModal(false)
  }

  // 자원·장비 목록
  const { data: resourceData } = useQuery({
    queryKey: ['emrResourcesForSelect'],
    queryFn: () => emergencyResourceApi.getAll(0, 200),
  })
  const allResources: EmergencyResource[] = resourceData?.content || []
  const selectedResourceIds = (form.resourceIds || '').split(',').filter(Boolean).map(Number)
  const selectedResources = allResources.filter(r => selectedResourceIds.includes(r.id))

  const queryKey = ['emrPlans', page]
  const queryFn = () => emergencyPlanApi.getAll(page, pageSize)

  const { data, isLoading } = useQuery({ queryKey, queryFn, enabled: viewMode === 'list' })

  const createMutation = useMutation({
    mutationFn: (req: EmergencyPlanRequest) => emergencyPlanApi.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emrPlans'] })
      showSuccess(t('common.saved'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: number; req: EmergencyPlanRequest }) => emergencyPlanApi.update(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emrPlans'] })
      showSuccess(t('common.saved'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => emergencyPlanApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emrPlans'] })
      showSuccess(t('common.deleted'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const transitionMutation = useMutation({
    mutationFn: ({ id, action, rejectReason }: { id: number; action: 'submit' | 'approve' | 'reject' | 'complete'; rejectReason?: string }) =>
      emergencyPlanApi.transition(id, action, rejectReason),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['emrPlans'] })
      queryClient.invalidateQueries({ queryKey: ['emrDrills'] })
      setSelectedItem(updated)
      showSuccess(t('common.saved'))
    },
    onError: () => showError(t('common.error')),
  })

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm(buildEmptyForm(authUser)) }
  const handleOpenCreate = async () => {
    setSelectedItem(null)
    const leader = await fetchTeamLeader(authUser?.deptCode)
    setForm({
      ...buildEmptyForm(authUser),
      ...(leader ? {
        planApproverName: leader.name, planApproverPosition: leader.position, planApproverTeam: leader.team,
        completionApproverName: leader.name, completionApproverPosition: leader.position, completionApproverTeam: leader.team,
      } : {}),
    })
    setViewMode('create')
  }
  const handleOpenDetail = (item: EmergencyPlan) => { setSelectedItem(item); setViewMode('detail') }
  const handleOpenEdit = (item?: EmergencyPlan) => {
    const target = item || selectedItem
    if (!target) return
    setSelectedItem(target)
    setForm({
      planName: target.planName, planType: target.planType,
      description: target.description, responseSteps: target.responseSteps,
      responsibleDept: target.responsibleDept, responsibleName: target.responsibleName,
      trainingStartDate: target.trainingStartDate, trainingEndDate: target.trainingEndDate,
      resourceIds: target.resourceIds, notes: target.notes,
      checklistTemplateId: target.checklistTemplateId,
      status: target.status,
      createdByUserId: target.createdByUserId, createdByTeam: target.createdByTeam,
      createdByPosition: target.createdByPosition, createdByName: target.createdByName,
      planApproverUserId: target.planApproverUserId, planApproverTeam: target.planApproverTeam,
      planApproverPosition: target.planApproverPosition, planApproverName: target.planApproverName,
      completionApproverUserId: target.completionApproverUserId, completionApproverTeam: target.completionApproverTeam,
      completionApproverPosition: target.completionApproverPosition, completionApproverName: target.completionApproverName,
    })
    setViewMode('edit')
  }

  const handleSave = async () => {
    if (!form.planName?.trim()) { showWarning(t('emr.planName') + ' ' + t('common.required', '필수입니다')); return }
    if (!form.planType) { showWarning(t('emr.planType') + ' ' + t('common.required', '필수입니다')); return }
    if (!form.planApproverName?.trim()) { showWarning(t('emr.planApprover') + ' ' + t('common.required', '필수입니다')); return }
    if (!form.completionApproverName?.trim()) { showWarning(t('emr.completionApprover') + ' ' + t('common.required', '필수입니다')); return }
    if (!form.checklistTemplateId) { showWarning(t('audit.checklist', '체크리스트') + ' ' + t('common.required', '필수입니다')); return }
    const ok = await showConfirm(t('common.confirmSave', '저장하시겠습니까?'))
    if (!ok) return
    if (selectedItem) updateMutation.mutate({ id: selectedItem.id, req: form })
    else createMutation.mutate(form)
  }

  const handleDelete = async (item: EmergencyPlan) => {
    const confirmed = await showConfirm(t('common.confirmDelete', '정말로 삭제하시겠습니까?'))
    if (confirmed) deleteMutation.mutate(item.id)
  }

  // 결재 권한 체크: 지정된 승인자 본인 또는 admin
  const canApprovePlan = (d: EmergencyPlan) => {
    if (isAdmin) return true
    if (d.planApproverUserId && authUser?.id && d.planApproverUserId === authUser.id) return true
    if (d.planApproverName && authUser?.name && d.planApproverName === authUser.name) return true
    return false
  }

  let items = data?.content || []
  const totalPages = data?.totalPages || 0

  // 계획 탭은 계획 승인 완료 이후(APPROVED / COMPLETION_PENDING / DONE) 건은 숨김 — 훈련 관리 탭에서 처리
  items = items.filter((i) => {
    const s = i.status || (i.approved ? 'DONE' : 'DRAFT')
    return s !== 'APPROVED' && s !== 'COMPLETION_PENDING' && s !== 'DONE'
  })

  if (searchText) {
    const s = searchText.toLowerCase()
    items = items.filter((i) =>
      i.planName.toLowerCase().includes(s) ||
      i.planId?.toLowerCase().includes(s) ||
      i.responsibleDept?.toLowerCase().includes(s) ||
      i.responsibleName?.toLowerCase().includes(s)
    )
  }
  if (typeFilter) {
    items = items.filter((i) => i.planType === typeFilter)
  }

  const statusChip = (item: { status?: string; approved?: boolean }) => {
    const status = item.status || (item.approved ? 'DONE' : 'DRAFT')
    return <Chip label={getStatusLabel(status) || status} color={STATUS_COLORS[status] || 'default'} size="small" />
  }

  // ──────────────────── LIST VIEW ────────────────────
  if (viewMode === 'list') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField size="small" placeholder={t('emr.searchPlaceholder')} value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setPage(0) }}
              sx={{ minWidth: 200 }} />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select displayEmpty value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('emr.allTypes')}</MenuItem>
                {planTypeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getPlanTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <IconButton onClick={() => { setSearchText(''); setTypeFilter(''); setPage(0) }} size="small"><RefreshIcon /></IconButton>
          </Box>
          {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>{t('common.new')}</Button>
          )}
        </Box>
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <TextField size="small" fullWidth placeholder={t('emr.searchPlaceholder')} value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setPage(0) }} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select displayEmpty value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('emr.allTypes')}</MenuItem>
                {planTypeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getPlanTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ flex: 1 }}>{t('common.new')}</Button>
            )}
          </Box>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : items.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>{t('common.noData')}</Alert>
        ) : (
          <>
            <Paper sx={{ display: { xs: 'none', md: 'block' } }}>
              <TableContainer>
                <Table size="small" stickyHeader sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headerCellSx}>{t('emr.planId')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('emr.planName')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('emr.planType')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('emr.responsibleDept')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('emr.trainingStartDate')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('emr.trainingEndDate')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('emr.planApprover')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('emr.completionApprover')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('common.status')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleOpenDetail(item)}>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.planId}</TableCell>
                        <TableCell><Typography fontWeight={600} variant="body2">{item.planName}</Typography></TableCell>
                        <TableCell>{getPlanTypeLabel(item.planType)}</TableCell>
                        <TableCell align="center">{item.responsibleDept || ''}</TableCell>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.trainingStartDate || ''}</TableCell>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.trainingEndDate || ''}</TableCell>
                        <TableCell align="center">{item.planApproverName || ''}</TableCell>
                        <TableCell align="center">{item.completionApproverName || ''}</TableCell>
                        <TableCell align="center">{statusChip(item)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              {items.map((item) => (
                <Paper key={item.id} sx={{ p: 2, border: 1, borderColor: 'divider', cursor: 'pointer' }} onClick={() => handleOpenDetail(item)}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography fontWeight="bold">{item.planName}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {statusChip(item)}
                      <Chip label={getPlanTypeLabel(item.planType)} color="default" size="small" />
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {item.responsibleDept || ''} | {item.trainingStartDate || ''} ~ {item.trainingEndDate || ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('emr.planApprover')}: {item.planApproverName || ''} / {t('emr.completionApprover')}: {item.completionApproverName || ''}
                  </Typography>
                </Paper>
              ))}
            </Box>
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <Pagination count={totalPages} page={page + 1} onChange={(_, p) => setPage(p - 1)} color="primary" />
              </Box>
            )}
          </>
        )}
      </Box>
    )
  }

  // ──────────────────── DETAIL VIEW ────────────────────
  if (viewMode === 'detail' && selectedItem) {
    const status = selectedItem.status || (selectedItem.approved ? 'DONE' : 'DRAFT')
    const isDraft = status === 'DRAFT'
    const isPending = status === 'PENDING_APPROVAL'
    const rejected = selectedItem.rejectReason
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {/* 반려 사유 배너 — DRAFT 상태로 되돌아온 경우 사유 노출 */}
          {isDraft && rejected && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'error.lighter', border: 1, borderColor: 'error.light', borderRadius: 1 }}>
              <Typography variant="body2" color="error.main" fontWeight="bold" sx={{ mb: 0.5 }}>
                {t('common.rejectReasonTitle', '반려 사유')}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{rejected}</Typography>
            </Box>
          )}
          <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('emr.planId')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" fontFamily="monospace">{selectedItem.planId}</Typography>
              </Box>
              <Typography sx={labelSx}>{t('emr.planType')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{getPlanTypeLabel(selectedItem.planType)}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('emr.planName')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" fontWeight={600}>{selectedItem.planName}</Typography>
              </Box>
              <Typography sx={labelSx}>{t('common.status')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                {statusChip(selectedItem)}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('emr.responsibleName')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{selectedItem.responsibleName || ''}</Typography>
              </Box>
              <Typography sx={labelSx}>{t('emr.responsibleDept')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{selectedItem.responsibleDept || ''}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('emr.trainingStartDate')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" fontFamily="monospace">{selectedItem.trainingStartDate || ''}</Typography>
              </Box>
              <Typography sx={labelSx}>{t('emr.trainingEndDate')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" fontFamily="monospace">{selectedItem.trainingEndDate || ''}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('common.description')}</Typography>
              <Box sx={valueSx}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedItem.description || ''}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('emr.responseSteps')}</Typography>
              <Box sx={valueSx}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedItem.responseSteps || ''}</Typography>
              </Box>
            </Box>
            {selectedItem.resourceIds && (
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={labelSx}>{t('emr.resources', '자원·장비')}</Typography>
                <Box sx={{ ...valueSx, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {allResources.filter(r => selectedItem.resourceIds!.split(',').map(Number).includes(r.id)).map(r => (
                    <MuiChip key={r.id} label={r.resourceName} size="small" variant="outlined" />
                  ))}
                  {allResources.filter(r => selectedItem.resourceIds!.split(',').map(Number).includes(r.id)).length === 0 && null}
                </Box>
              </Box>
            )}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('common.notes')}</Typography>
              <Box sx={valueSx}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedItem.notes || ''}</Typography>
              </Box>
            </Box>
            {/* 작성자 | 작성일자 */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('common.creator', '작성자')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{formatUserName(selectedItem.createdByTeam, selectedItem.createdByName, selectedItem.createdByPosition) || ''}</Typography>
              </Box>
              <Typography sx={labelSx}>{t('audit.createdAt', '작성일자')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">
                  {selectedItem.createdAt ? selectedItem.createdAt.replace('T', ' ').substring(0, 16) : ''}
                </Typography>
              </Box>
            </Box>
            {/* 수정자 | 수정일자 — 수정 이력 있을 때만 */}
            {selectedItem.modifiedAt && selectedItem.modifiedAt !== selectedItem.createdAt && (
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={labelSx}>{t('common.modifier', '수정자')}</Typography>
                <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2">{formatUserName(selectedItem.modifiedByTeam, selectedItem.modifiedByName, selectedItem.modifiedByPosition) || ''}</Typography>
                </Box>
                <Typography sx={labelSx}>{t('common.modifiedAt', '수정일자')}</Typography>
                <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2">{selectedItem.modifiedAt.replace('T', ' ').substring(0, 16)}</Typography>
                </Box>
              </Box>
            )}
            {/* 계획승인자 | 완료승인자 — 체크리스트 바로 위 */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('emr.planApprover')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">
                  {formatUserName(selectedItem.planApproverTeam, selectedItem.planApproverName, selectedItem.planApproverPosition) || ''}
                </Typography>
                {selectedItem.planApprovedAt && (
                  <Typography variant="caption" color="text.secondary">
                    ({selectedItem.planApprovedBy} | {selectedItem.planApprovedAt.replace('T', ' ').substring(0, 19)})
                  </Typography>
                )}
              </Box>
              <Typography sx={labelSx}>{t('emr.completionApprover')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">
                  {formatUserName(selectedItem.completionApproverTeam, selectedItem.completionApproverName, selectedItem.completionApproverPosition) || ''}
                </Typography>
                {selectedItem.completionApprovedAt && (
                  <Typography variant="caption" color="text.secondary">
                    ({selectedItem.completionApprovedBy} | {selectedItem.completionApprovedAt.replace('T', ' ').substring(0, 19)})
                  </Typography>
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex' }}>
              <Typography sx={labelSx}>{t('audit.checklist', '체크리스트')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">
                  {selectedItem.checklistTemplateId
                    ? emrChecklists.find((t: SafetyChecklistTemplate) => t.id === selectedItem.checklistTemplateId)?.templateName || ''
                    : t('audit.noChecklist', '미연결')}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Mobile Detail */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
            {[
              [t('emr.planId'), selectedItem.planId],
              [t('emr.planName'), selectedItem.planName],
              [t('emr.planType'), getPlanTypeLabel(selectedItem.planType)],
              [t('emr.responsibleName'), selectedItem.responsibleName || ''],
              [t('emr.responsibleDept'), selectedItem.responsibleDept || ''],
              [t('emr.trainingStartDate'), selectedItem.trainingStartDate || ''],
              [t('emr.trainingEndDate'), selectedItem.trainingEndDate || ''],
              [t('common.description'), selectedItem.description || ''],
              [t('emr.responseSteps'), selectedItem.responseSteps || ''],
              [t('common.notes'), selectedItem.notes || ''],
              [t('common.creator', '작성자'), formatUserName(selectedItem.createdByTeam, selectedItem.createdByName, selectedItem.createdByPosition) || ''],
              [t('audit.createdAt', '작성일자'),
                selectedItem.createdAt ? selectedItem.createdAt.replace('T', ' ').substring(0, 16) : ''],
              ...(selectedItem.modifiedAt && selectedItem.modifiedAt !== selectedItem.createdAt ? [
                [t('common.modifier', '수정자'), formatUserName(selectedItem.modifiedByTeam, selectedItem.modifiedByName, selectedItem.modifiedByPosition) || ''],
                [t('common.modifiedAt', '수정일자'), selectedItem.modifiedAt.replace('T', ' ').substring(0, 16)],
              ] as Array<[string, string]> : []),
              [t('emr.planApprover'), formatUserName(selectedItem.planApproverTeam, selectedItem.planApproverName, selectedItem.planApproverPosition)],
              [t('emr.completionApprover'), formatUserName(selectedItem.completionApproverTeam, selectedItem.completionApproverName, selectedItem.completionApproverPosition)],
            ].map(([label, value], i) => (
              <Box key={i}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>{value}</Typography>
              </Box>
            ))}
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.status')}</Typography>
              <Box sx={{ px: 1.5, py: 0.5 }}>{statusChip(selectedItem)}</Box>
            </Box>
          </Box>

        {selectedItem.checklistTemplateId && (
          <SafetyChecklistTab templateId={selectedItem.checklistTemplateId} embedded />
        )}

        {/* 우하단 버튼 — 순서: 목록 / 결재 상신·승인·반려 / 수정 / 삭제
            (계획 KPI 목표 - 연간 계획 톤과 일치) */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list')}</Button>
          {/* DRAFT → 계획 결재 상신 */}
          {isDraft && !getRoles(selectedItem).includes('planApprover') && !getRoles(selectedItem).includes('completionApprover') && canSee(MENU, 'DRAFT', '계획 결재 상신', getRoles(selectedItem)) && (
            <Button variant="contained" color="info"
              onClick={async () => {
                const ok = await showConfirm(t('emr.confirmSubmit', '계획 결재를 상신하시겠습니까?'))
                if (ok) transitionMutation.mutate({ id: selectedItem.id, action: 'submit' })
              }}
              sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
              {t('emr.planSubmit', '계획 결재 상신')}
            </Button>
          )}
          {/* PENDING_APPROVAL → 반려 / 계획 승인 (계획 승인자 · 슈퍼관리자만) */}
          {isPending && (getRoles(selectedItem).includes('planApprover') || getRoles(selectedItem).includes('superAdmin')) && canSee(MENU, 'PENDING_APPROVAL', '반려', getRoles(selectedItem)) && (
            <Button variant="contained" color="warning"
              onClick={() => setRejectDialogOpen(true)}
              sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
              {t('common.reject', '반려')}
            </Button>
          )}
          {isPending && (getRoles(selectedItem).includes('planApprover') || getRoles(selectedItem).includes('superAdmin')) && canSee(MENU, 'PENDING_APPROVAL', '계획 승인', getRoles(selectedItem)) && (
            <Button variant="contained" color="success"
              onClick={async () => {
                const ok = await showConfirm(t('emr.confirmPlanApprove', '계획 결재를 승인하시겠습니까?'))
                if (ok) transitionMutation.mutate({ id: selectedItem.id, action: 'approve' })
              }}
              sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
              {t('emr.planApprove', '계획 승인')}
            </Button>
          )}
          {/* DRAFT 상태 — 수정/삭제 */}
          {isDraft && !getRoles(selectedItem).includes('planApprover') && !getRoles(selectedItem).includes('completionApprover') && canSee(MENU, 'DRAFT', '수정', getRoles(selectedItem)) && (
            <Button variant="contained" color="primary" onClick={() => handleOpenEdit()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.edit')}</Button>
          )}
          {isDraft && !getRoles(selectedItem).includes('planApprover') && !getRoles(selectedItem).includes('completionApprover') && canSee(MENU, 'DRAFT', '삭제', getRoles(selectedItem)) && (
            <Button variant="contained" color="error" onClick={() => handleDelete(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.delete')}</Button>
          )}
        </Box>

        {/* 계획 결재 반려 사유 입력 다이얼로그 */}
        <RejectReasonDialog
          open={rejectDialogOpen}
          stage={t('emr.planReject', '계획 결재 반려')}
          onClose={() => setRejectDialogOpen(false)}
          onConfirm={(reason) => {
            transitionMutation.mutate({ id: selectedItem.id, action: 'reject', rejectReason: reason })
            setRejectDialogOpen(false)
          }}
          loading={transitionMutation.isPending}
        />
      </Box>
    )
  }

  // ──────────────────── CREATE / EDIT VIEW ────────────────────
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* PC Form */}
        <Paper sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.planName')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valueBorderSx}>
              <TextField fullWidth size="small" value={form.planName} onChange={(e) => setForm({ ...form, planName: e.target.value })} />
            </Box>
            <Typography sx={labelSx}>{t('emr.planType')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valueSx}>
              <Select fullWidth size="small" displayEmpty value={form.planType} onChange={(e) => setForm({ ...form, planType: e.target.value })}>
                <MenuItem value="" disabled>{t('common.select', '선택하세요')}</MenuItem>
                {planTypeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getPlanTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.responsibleName')}</Typography>
            <Box sx={{ ...valueBorderSx, display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField fullWidth size="small" value={form.responsibleName || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowResponsibleUserModal(true)}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
            <Typography sx={labelSx}>{t('emr.responsibleDept')}</Typography>
            <Box sx={{ ...valueSx, display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField fullWidth size="small" value={form.responsibleDept || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowDeptModal(true)}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.trainingStartDate')}</Typography>
            <Box sx={valueBorderSx}>
              <DatePickerField value={form.trainingStartDate || null} onChange={(v) => setForm({ ...form, trainingStartDate: v })} size="small" />
            </Box>
            <Typography sx={labelSx}>{t('emr.trainingEndDate')}</Typography>
            <Box sx={valueSx}>
              <DatePickerField value={form.trainingEndDate || null} onChange={(v) => setForm({ ...form, trainingEndDate: v })} size="small" />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.resources', '자원·장비')}</Typography>
            <Box sx={valueSx}>
              <Autocomplete
                multiple size="small" fullWidth
                options={allResources}
                getOptionLabel={(o) => `${o.resourceId} - ${o.resourceName}`}
                value={selectedResources}
                onChange={(_, selected) => setForm({ ...form, resourceIds: selected.map(s => String(s.id)).join(',') })}
                renderTags={(value, getTagProps) => value.map((option, index) => <MuiChip {...getTagProps({ index })} key={option.id} label={option.resourceName} size="small" />)}
                renderInput={(params) => <TextField {...params} size="small" placeholder={t('emr.selectResources', '장비 선택')} />}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('common.description')}</Typography>
            <Box sx={valueSx}>
              <TextField fullWidth size="small" multiline rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.responseSteps')}</Typography>
            <Box sx={valueSx}>
              <TextField fullWidth size="small" multiline rows={4} value={form.responseSteps || ''} onChange={(e) => setForm({ ...form, responseSteps: e.target.value })} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('common.notes')}</Typography>
            <Box sx={valueSx}>
              <TextField fullWidth size="small" multiline rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Box>
          </Box>
          {/* 작성자 | 작성일자 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('common.creator', '작성자')}</Typography>
            <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2">{formatUserName(form.createdByTeam || authUser?.department, form.createdByName || authUser?.name, form.createdByPosition || authUser?.position) || ''}</Typography>
            </Box>
            <Typography sx={labelSx}>{t('audit.createdAt', '작성일자')}</Typography>
            <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2">
                {viewMode === 'edit' && selectedItem?.createdAt
                  ? selectedItem.createdAt.replace('T', ' ').substring(0, 16)
                  : new Date().toISOString().substring(0, 10)}
              </Typography>
            </Box>
          </Box>
          {/* 수정자 | 수정일자 — 수정 모드 + 이력 있을 때만 */}
          {viewMode === 'edit' && selectedItem && selectedItem.modifiedAt && selectedItem.modifiedAt !== selectedItem.createdAt && (
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('common.modifier', '수정자')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{formatUserName(selectedItem.modifiedByTeam, selectedItem.modifiedByName, selectedItem.modifiedByPosition) || ''}</Typography>
              </Box>
              <Typography sx={labelSx}>{t('common.modifiedAt', '수정일자')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{selectedItem.modifiedAt.replace('T', ' ').substring(0, 16)}</Typography>
              </Box>
            </Box>
          )}
          {/* 계획승인자 | 완료승인자 — 체크리스트 바로 위 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.planApprover')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={{ ...valueBorderSx, gap: 1, display: 'flex', alignItems: 'center' }}>
              <TextField size="small" fullWidth placeholder={t('common.selectFromOrg', '조직도에서 선택')} value={formatUserName(form.planApproverTeam, form.planApproverName, form.planApproverPosition) || ''} InputProps={{ readOnly: true }} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setUserPickTarget('planApprover')}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
            <Typography sx={labelSx}>{t('emr.completionApprover')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={{ ...valueSx, gap: 0.5, display: 'flex', alignItems: 'center' }}>
              <TextField size="small" sx={{ flex: 1, minWidth: 0 }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} value={formatUserName(form.completionApproverTeam, form.completionApproverName, form.completionApproverPosition) || ''} InputProps={{ readOnly: true }} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setUserPickTarget('completionApprover')}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Typography sx={labelSx}>{t('audit.checklist', '체크리스트')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valueSx}>
              <Select fullWidth size="small" displayEmpty value={form.checklistTemplateId || ''} onChange={(e) => setForm({ ...form, checklistTemplateId: e.target.value ? Number(e.target.value) : undefined })}>
                <MenuItem value="">{t('audit.noChecklist', '체크리스트 미연결')}</MenuItem>
                {emrChecklists.map((tpl: SafetyChecklistTemplate) => (
                  <MenuItem key={tpl.id} value={tpl.id}>{tpl.templateName} ({tpl.itemCount || 0}개 항목)</MenuItem>
                ))}
              </Select>
            </Box>
          </Box>
        </Paper>

        {/* Mobile Form */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('emr.planName')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.planName} onChange={(e) => setForm({ ...form, planName: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('emr.planType')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <FormControl fullWidth size="small">
              <Select displayEmpty value={form.planType} onChange={(e) => setForm({ ...form, planType: e.target.value })}>
                <MenuItem value="" disabled>{t('common.select', '선택하세요')}</MenuItem>
                {planTypeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getPlanTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.responsibleName')}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" fullWidth value={form.responsibleName || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowResponsibleUserModal(true)}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.responsibleDept')}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" fullWidth value={form.responsibleDept || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowDeptModal(true)}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <DatePickerField value={form.trainingStartDate || null} onChange={(v) => setForm({ ...form, trainingStartDate: v })} size="small" label={t('emr.trainingStartDate')} />
          <DatePickerField value={form.trainingEndDate || null} onChange={(v) => setForm({ ...form, trainingEndDate: v })} size="small" label={t('emr.trainingEndDate')} />
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.resources', '자원·장비')}</Typography>
            <Autocomplete
              multiple size="small" fullWidth
              options={allResources}
              getOptionLabel={(o) => `${o.resourceId} - ${o.resourceName}`}
              value={selectedResources}
              onChange={(_, selected) => setForm({ ...form, resourceIds: selected.map(s => String(s.id)).join(',') })}
              renderTags={(value, getTagProps) => value.map((option, index) => <MuiChip {...getTagProps({ index })} key={option.id} label={option.resourceName} size="small" />)}
              renderInput={(params) => <TextField {...params} size="small" placeholder={t('emr.selectResources', '장비 선택')} />}
            />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.description')}</Typography>
            <TextField size="small" fullWidth multiline rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.responseSteps')}</Typography>
            <TextField size="small" fullWidth multiline rows={4} value={form.responseSteps || ''} onChange={(e) => setForm({ ...form, responseSteps: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.notes')}</Typography>
            <TextField size="small" fullWidth multiline rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Box>
          {/* 작성자 / 작성일자 */}
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.creator', '작성자')}</Typography>
            <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{formatUserName(form.createdByTeam || authUser?.department, form.createdByName || authUser?.name, form.createdByPosition || authUser?.position) || ''}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('audit.createdAt', '작성일자')}</Typography>
            <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>
              {viewMode === 'edit' && selectedItem?.createdAt
                ? selectedItem.createdAt.replace('T', ' ').substring(0, 16)
                : new Date().toISOString().substring(0, 10)}
            </Typography>
          </Box>
          {/* 수정자 / 수정일자 — 수정 모드 + 이력 있을 때만 */}
          {viewMode === 'edit' && selectedItem && selectedItem.modifiedAt && selectedItem.modifiedAt !== selectedItem.createdAt && (
            <>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.modifier', '수정자')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{formatUserName(selectedItem.modifiedByTeam, selectedItem.modifiedByName, selectedItem.modifiedByPosition) || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.modifiedAt', '수정일자')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{selectedItem.modifiedAt.replace('T', ' ').substring(0, 16)}</Typography>
              </Box>
            </>
          )}
          {/* 계획승인자 — 체크리스트 바로 위 */}
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('emr.planApprover')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" fullWidth placeholder={t('common.selectFromOrg', '조직도에서 선택')} value={formatUserName(form.planApproverTeam, form.planApproverName, form.planApproverPosition) || ''} InputProps={{ readOnly: true }} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setUserPickTarget('planApprover')}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('emr.completionApprover')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" fullWidth placeholder={t('common.selectFromOrg', '조직도에서 선택')} value={formatUserName(form.completionApproverTeam, form.completionApproverName, form.completionApproverPosition) || ''} InputProps={{ readOnly: true }} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setUserPickTarget('completionApprover')}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('audit.checklist', '체크리스트')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <FormControl fullWidth size="small">
              <Select displayEmpty value={form.checklistTemplateId || ''} onChange={(e) => setForm({ ...form, checklistTemplateId: e.target.value ? Number(e.target.value) : undefined })}>
                <MenuItem value="">{t('audit.noChecklist', '체크리스트 미연결')}</MenuItem>
                {emrChecklists.map((tpl: SafetyChecklistTemplate) => (
                  <MenuItem key={tpl.id} value={tpl.id}>{tpl.templateName} ({tpl.itemCount || 0}개 항목)</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {form.checklistTemplateId && (
          <Box sx={{ mt: 3 }}>
            <SafetyChecklistTab templateId={form.checklistTemplateId} embedded />
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={() => viewMode === 'edit' ? setViewMode('detail') : handleBackToList()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save')}</Button>
        </Box>

        {/* 모달들 */}
        <UserSelectModal
          open={userPickTarget !== null}
          onClose={() => setUserPickTarget(null)}
          selectedUsers={[]}
          onConfirm={handleApproverPick}
          singleSelect
          useCompanyTree
          title={userPickTarget === 'planApprover'
            ? t('emr.selectPlanApprover', '계획 승인자 지정')
            : userPickTarget === 'completionApprover'
              ? t('emr.selectCompletionApprover', '완료 승인자 지정')
              : t('common.selectEmployee', '담당자 지정')}
        />
        <UserSelectModal
          open={showResponsibleUserModal}
          onClose={() => setShowResponsibleUserModal(false)}
          selectedUsers={[]}
          onConfirm={handleResponsibleUserPick}
          singleSelect
          useCompanyTree
          title={t('environment.selectManager')}
        />
        <DepartmentSelectModal
          open={showDeptModal}
          onClose={() => setShowDeptModal(false)}
          onConfirm={(department) => { setForm(f => ({ ...f, responsibleDept: department })); setShowDeptModal(false) }}
          initialDepartment={form.responsibleDept}
          title={t('emr.selectDept', '담당부서 선택')}
        />
      </Box>
    )
  }

  return null
}

export default EmrPlanTab
