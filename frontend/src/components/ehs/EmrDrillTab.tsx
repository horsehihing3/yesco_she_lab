import { formatUserName } from '../../utils/userDisplay'
import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, Select, MenuItem,
  FormControl, Chip, Chip as MuiChip, Pagination, CircularProgress, Alert, IconButton,
  LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import HistoryIcon from '@mui/icons-material/History'
import DatePickerField from '../common/DatePickerField'
import NumberField from '../common/NumberField'
import RejectReasonDialog from '../common/RejectReasonDialog'
import LoadingOverlay from '../common/LoadingOverlay'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'
import { emergencyDrillApi, emergencyPlanApi, emergencyResourceApi } from '../../api/emergencyExtendedApi'
import { fetchSafetyTemplateDetail } from '../../api/safetyChecklistApi'
import { EmergencyDrill, EmergencyDrillRequest, EmergencyResource } from '../../types/emergencyExtended.types'
import { SafetyChecklistTemplate } from '../../types/safetyChecklist.types'
import useCodeMap from '../../hooks/useCodeMap'
import SafetyChecklistTab, { SafetyChecklistTabRef } from './SafetyChecklistTab'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const statusColors: Record<string, 'info' | 'success' | 'error'> = {
  SCHEDULED: 'info', COMPLETED: 'success', CANCELLED: 'error',
}

const labelSx = {
  width: 140, minWidth: 140, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: 'divider',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center',
}
const valueSx = { flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem' }
const valueBorderSx = { ...valueSx, borderRight: 1, borderColor: 'divider' }
const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

const emptyForm: EmergencyDrillRequest = { drillName: '', drillType: '' }

const EmrDrillTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { user: authUser } = useAuth()
  const isAdmin = authUser?.role === 'SYSTEM_ADMIN'
  const { canSee } = useButtonRules()
  const MENU = 'EHS 경영 › 비상 훈련 › 비상 훈련'
  const myRoles: string[] = ['guest', ...(isAdmin ? ['superAdmin'] : [authUser?.role ?? ''].filter(Boolean))]
  const getDrillRoles = (plan: { writerUserId?: number|null; writerName?: string|null; completionApproverUserId?: number|null; completionApproverName?: string|null } | null | undefined): string[] => {
    const roles = [...myRoles]
    if (plan && ((plan.writerUserId && authUser?.id && plan.writerUserId === authUser.id) ||
                 (plan.writerName && authUser?.name && plan.writerName === authUser.name))) roles.push('writer')
    if (plan && ((plan.completionApproverUserId && authUser?.id && plan.completionApproverUserId === authUser.id) ||
                 (plan.completionApproverName && authUser?.name && plan.completionApproverName === authUser.name))) roles.push('completionApprover')
    return roles
  }
  const { codeList: drillTypeCodes, getLabel: getDrillTypeLabel } = useCodeMap('EMERGENCY_PLAN_TYPE')
  const { codeList: drillStatusCodes, getLabel: getDrillStatusLabel } = useCodeMap('DRILL_STATUS')
  const { codeList: drillScoreCodes, getLabel: getDrillScoreLabel } = useCodeMap('DRILL_SCORE')

  const checklistRef = useRef<SafetyChecklistTabRef>(null)
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [logModalItems, setLogModalItems] = useState<any[]>([])
  const [logModalTitle, setLogModalTitle] = useState('')
  const [logModalLoading, setLogModalLoading] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<EmergencyDrill | null>(null)
  const [form, setForm] = useState<EmergencyDrillRequest>({ ...emptyForm })
  const [page, setPage] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const pageSize = 10

  const queryKey = statusFilter
    ? ['emrDrillStatus', statusFilter, page]
    : ['emrDrills', page]

  const queryFn = () => {
    if (statusFilter) return emergencyDrillApi.getByStatus(statusFilter, page, pageSize)
    return emergencyDrillApi.getAll(page, pageSize)
  }

  const { data, isLoading } = useQuery({ queryKey, queryFn, enabled: viewMode === 'list' })

  // 자원·장비 목록
  const { data: resourceData } = useQuery({
    queryKey: ['emrResourcesForDrill'],
    queryFn: () => emergencyResourceApi.getAll(0, 200),
  })
  const allResources: EmergencyResource[] = resourceData?.content || []

  // 연결된 비상 계획 조회 (자원·장비 표시용 + checklistTemplateId)
  const { data: linkedPlan, isLoading: linkedPlanLoading, isFetching: linkedPlanFetching } = useQuery({
    queryKey: ['emrLinkedPlan', selectedItem?.planId],
    queryFn: () => emergencyPlanApi.getById(selectedItem!.planId!),
    enabled: !!selectedItem?.planId && (viewMode === 'detail' || viewMode === 'edit'),
  })

  // 연결된 체크리스트 템플릿 조회
  const checklistTemplateId = linkedPlan?.checklistTemplateId
  const { data: checklistTemplate, isLoading: checklistLoading, isFetching: checklistFetching } = useQuery<SafetyChecklistTemplate>({
    queryKey: ['safetyTemplate', checklistTemplateId],
    queryFn: () => fetchSafetyTemplateDetail(checklistTemplateId!),
    enabled: !!checklistTemplateId && (viewMode === 'detail' || viewMode === 'edit'),
  })

  // 상세 진입 시 linkedPlan / 체크리스트 템플릿 모두 로드 완료까지 LoadingOverlay 노출
  const detailLoading = viewMode === 'detail' && !!selectedItem && (
    (!!selectedItem.planId && (linkedPlanLoading || linkedPlanFetching || !linkedPlan)) ||
    (!!checklistTemplateId && (checklistLoading || checklistFetching || !checklistTemplate))
  )

  // 변경 이력 조회
  const { data: drillLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['emrDrillLogs', selectedItem?.id],
    queryFn: () => emergencyDrillApi.getLogs(selectedItem!.id),
    enabled: !!selectedItem?.id && viewMode === 'detail',
  })

  const createMutation = useMutation({
    mutationFn: (req: EmergencyDrillRequest) => emergencyDrillApi.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emrDrills'] })
      queryClient.invalidateQueries({ queryKey: ['emrDrillStatus'] })
      showSuccess(t('common.saved'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: number; req: EmergencyDrillRequest }) => emergencyDrillApi.update(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emrDrills'] })
      queryClient.invalidateQueries({ queryKey: ['emrDrillStatus'] })
      showSuccess(t('common.saved'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => emergencyDrillApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emrDrills'] })
      queryClient.invalidateQueries({ queryKey: ['emrDrillStatus'] })
      showSuccess(t('common.deleted'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm({ ...emptyForm }) }
  const handleOpenCreate = () => { setSelectedItem(null); setForm({ ...emptyForm }); setViewMode('create') }
  const handleOpenDetail = (item: EmergencyDrill) => { setSelectedItem(item); setViewMode('detail') }
  const handleOpenEdit = (item?: EmergencyDrill) => {
    const target = item || selectedItem
    if (!target) return
    setSelectedItem(target)
    setForm({
      planId: target.planId,
      drillName: target.drillName, drillType: target.drillType,
      targetDept: target.targetDept, scheduledDate: target.scheduledDate,
      participantCount: target.participantCount, evacuationTime: target.evacuationTime,
      status: target.status, score: target.score,
      location: target.location, targetTime: target.targetTime,
      scenario: target.scenario, notes: target.notes,
    })
    setViewMode('edit')
  }
  const handleSave = async () => {
    if (selectedItem && viewMode === 'detail') {
      // 체크리스트 항목/서명 저장
      if (checklistRef.current) {
        await checklistRef.current.save()
      }
      // 저장 후 drill 데이터 다시 조회하여 카운트 반영 + linkedPlan 도 강제 refetch (완료 결재 상신 버튼 노출 조건 재평가)
      try {
        const updated = await emergencyDrillApi.getById(selectedItem.id)
        setSelectedItem(updated)
        queryClient.invalidateQueries({ queryKey: ['emrDrills'] })
        queryClient.invalidateQueries({ queryKey: ['emrDrillStatus'] })
        queryClient.invalidateQueries({ queryKey: ['emrLinkedPlan'] })
        queryClient.invalidateQueries({ queryKey: ['emrPlans'] })
        refetchLogs()
        showSuccess(t('common.saved'))
      } catch { showError(t('common.error')) }
      return
    }
    if (selectedItem) updateMutation.mutate({ id: selectedItem.id, req: form })
    else createMutation.mutate(form)
  }
  const handleDelete = async (item: EmergencyDrill) => {
    const confirmed = await showConfirm(t('common.confirmDelete', '정말로 삭제하시겠습니까?'))
    if (confirmed) deleteMutation.mutate(item.id)
  }
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedItem) return
    if (newStatus === 'COMPLETED') {
      if (!checklistRef.current?.isAllChecked()) {
        showError(t('emr.allChecklistMustBeChecked', '모든 체크리스트 항목이 체크되어야 완료할 수 있습니다.'))
        return
      }
      const ok = await showConfirm(t('emr.confirmComplete', '훈련을 완료 처리하시겠습니까?'))
      if (!ok) return
    }
    try {
      await emergencyDrillApi.update(selectedItem.id, {
        planId: selectedItem.planId,
        drillName: selectedItem.drillName, drillType: selectedItem.drillType,
        targetDept: selectedItem.targetDept || '', scheduledDate: selectedItem.scheduledDate,
        participantCount: selectedItem.participantCount, evacuationTime: selectedItem.evacuationTime,
        status: newStatus, score: selectedItem.score, location: selectedItem.location,
        targetTime: selectedItem.targetTime, scenario: selectedItem.scenario, notes: selectedItem.notes,
      } as EmergencyDrillRequest)
      const updated = await emergencyDrillApi.getById(selectedItem.id)
      setSelectedItem(updated)
      queryClient.invalidateQueries({ queryKey: ['emrDrills'] })
      queryClient.invalidateQueries({ queryKey: ['emrDrillStatus'] })
      refetchLogs()
      showSuccess(t('common.saved'))
    } catch { showError(t('common.error')) }
  }

  // 완료 승인: drill 상태 COMPLETED + 연결된 plan 을 DONE 으로 전이 (지정된 완료 승인자 또는 admin 만)
  const canApproveCompletion = () => {
    if (isAdmin) return true
    if (!linkedPlan) return false
    if (linkedPlan.completionApproverUserId && authUser?.id && linkedPlan.completionApproverUserId === authUser.id) return true
    if (linkedPlan.completionApproverName && authUser?.name && linkedPlan.completionApproverName === authUser.name) return true
    return false
  }

  // 완료 결재 상신: linkedPlan APPROVED → COMPLETION_PENDING (작성자/admin)
  const handleCompletionSubmit = async () => {
    if (!selectedItem || !linkedPlan) return
    const ok = await showConfirm(t('emr.confirmCompletionSubmit', '완료 결재를 상신하시겠습니까?'))
    if (!ok) return
    try {
      await emergencyPlanApi.transition(linkedPlan.id, 'completionSubmit')
      queryClient.invalidateQueries({ queryKey: ['emrLinkedPlan'] })
      queryClient.invalidateQueries({ queryKey: ['emrPlans'] })
      showSuccess(t('common.saved'))
    } catch (e: any) {
      showError(e?.response?.data?.message || t('common.error'))
    }
  }

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const handleRejectConfirm = async (reason: string) => {
    if (!linkedPlan) return
    try {
      await emergencyPlanApi.transition(linkedPlan.id, 'reject', reason)
      queryClient.invalidateQueries({ queryKey: ['emrLinkedPlan'] })
      queryClient.invalidateQueries({ queryKey: ['emrPlans'] })
      setRejectDialogOpen(false)
      showSuccess(t('common.saved'))
    } catch (e: any) {
      showError(e?.response?.data?.message || t('common.error'))
    }
  }

  const handleCompletionApprove = async () => {
    if (!selectedItem || !linkedPlan) return
    if (!checklistRef.current?.isAllChecked()) {
      showError(t('emr.allChecklistMustBeChecked', '모든 체크리스트 항목이 체크되어야 완료할 수 있습니다.'))
      return
    }
    const ok = await showConfirm(t('emr.confirmCompletion', '완료 결재를 승인하시겠습니까?'))
    if (!ok) return
    try {
      // 1) drill 상태 → COMPLETED
      await emergencyDrillApi.update(selectedItem.id, {
        planId: selectedItem.planId,
        drillName: selectedItem.drillName, drillType: selectedItem.drillType,
        targetDept: selectedItem.targetDept || '', scheduledDate: selectedItem.scheduledDate,
        participantCount: selectedItem.participantCount, evacuationTime: selectedItem.evacuationTime,
        status: 'COMPLETED', score: selectedItem.score, location: selectedItem.location,
        targetTime: selectedItem.targetTime, scenario: selectedItem.scenario, notes: selectedItem.notes,
      } as EmergencyDrillRequest)
      // 2) 연결된 plan → DONE (완료 승인 stamp 기록)
      await emergencyPlanApi.transition(linkedPlan.id, 'complete')

      const updated = await emergencyDrillApi.getById(selectedItem.id)
      setSelectedItem(updated)
      queryClient.invalidateQueries({ queryKey: ['emrDrills'] })
      queryClient.invalidateQueries({ queryKey: ['emrDrillStatus'] })
      queryClient.invalidateQueries({ queryKey: ['emrLinkedPlan'] })
      queryClient.invalidateQueries({ queryKey: ['emrPlans'] })
      refetchLogs()
      showSuccess(t('common.saved'))
    } catch (e: any) {
      const msg = e?.response?.data?.message || t('emr.notCompletionApprover', '지정된 완료 승인자만 완료 처리할 수 있습니다.')
      showError(msg)
    }
  }
  const handleLogClick = async (log: { id: number; action: string; createdAt: string }) => {
    if (log.action !== 'CHECKLIST_SAVE') return
    setLogModalLoading(true)
    setLogModalTitle(log.createdAt?.replace('T', ' ').substring(0, 19))
    setLogModalOpen(true)
    try {
      const items = await emergencyDrillApi.getLogItems(log.id)
      setLogModalItems(items)
    } catch { setLogModalItems([]) }
    setLogModalLoading(false)
  }

  let items = data?.content || []
  const totalPages = data?.totalPages || 0

  if (searchText) {
    const s = searchText.toLowerCase()
    items = items.filter((i) =>
      i.drillName.toLowerCase().includes(s) ||
      i.drillId?.toLowerCase().includes(s) ||
      i.targetDept?.toLowerCase().includes(s) ||
      i.location?.toLowerCase().includes(s)
    )
  }
  if (typeFilter) {
    items = items.filter((i) => i.drillType === typeFilter)
  }

  // ──────────────────── LIST VIEW ────────────────────
  if (viewMode === 'list') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* PC Search */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField size="small" placeholder={t('emr.searchPlaceholder')} value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setPage(0) }}
              sx={{ minWidth: 200 }} />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select displayEmpty value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('emr.allTypes')}</MenuItem>
                {drillTypeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getDrillTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); setSearchText('') }}>
                <MenuItem value="">{t('emr.allStatus')}</MenuItem>
                {drillStatusCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getDrillStatusLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <IconButton onClick={() => { setSearchText(''); setTypeFilter(''); setStatusFilter(''); setPage(0) }} size="small"><RefreshIcon /></IconButton>
          </Box>
        </Box>
        {/* Mobile Search */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <TextField size="small" fullWidth placeholder={t('emr.searchPlaceholder')} value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setPage(0) }} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select displayEmpty value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('emr.allTypes')}</MenuItem>
                {drillTypeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getDrillTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); setSearchText('') }}>
                <MenuItem value="">{t('emr.allStatus')}</MenuItem>
                {drillStatusCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getDrillStatusLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : items.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>{t('common.noData')}</Alert>
        ) : (
          <>
            {/* PC Table */}
            <Paper sx={{ display: { xs: 'none', md: 'block' } }}>
              <TableContainer>
                <Table size="small" stickyHeader sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headerCellSx} align="center">{t('emr.drillId')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('emr.drillName')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('emr.drillType')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('emr.targetDept')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('emr.scheduledDate')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('emr.participantCount')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('emr.evacuationTime')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('audit.checklistProgress')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('audit.findingCount')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('common.modifiedAt', '수정일자')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('common.modifiedBy', '수정자')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('common.status')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('emr.score')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => {
                      const progress = item.totalChecklist > 0 ? Math.round((item.completedChecklist / item.totalChecklist) * 100) : 0
                      return (
                        <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleOpenDetail(item)}>
                          <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.drillId}</TableCell>
                          <TableCell><Typography fontWeight={600} variant="body2">{item.drillName}</Typography></TableCell>
                          <TableCell align="center">{getDrillTypeLabel(item.drillType)}</TableCell>
                          <TableCell align="center">{item.targetDept || ''}</TableCell>
                          <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.scheduledDate || ''}</TableCell>
                          <TableCell align="center">{item.participantCount ?? ''}</TableCell>
                          <TableCell align="center">{item.evacuationTime || ''}</TableCell>
                          <TableCell align="center" sx={{ minWidth: 180 }}>
                            {item.totalChecklist > 0 ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress variant="determinate" value={progress} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                                <Typography variant="caption" fontWeight="bold" sx={{ minWidth: 60, textAlign: 'right' }}>
                                  {item.completedChecklist}/{item.totalChecklist}
                                </Typography>
                              </Box>
                            ) : (
                              null
                            )}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.85rem', color: item.findingCount > 0 ? 'error.main' : 'inherit', fontWeight: item.findingCount > 0 ? 600 : 400 }}>
                            {item.findingCount}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                            {item.modifiedAt?.replace('T', ' ').substring(0, 16) || ''}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.85rem' }}>
                            {item.modifiedBy || ''}
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={getDrillStatusLabel(item.status)} color={statusColors[item.status] || 'default'} size="small" />
                          </TableCell>
                          <TableCell align="center">{item.score ? getDrillScoreLabel(item.score) : ''}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
            {/* Mobile Card List */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              {items.map((item) => (
                <Paper key={item.id} sx={{ p: 2, border: 1, borderColor: 'divider', cursor: 'pointer' }} onClick={() => handleOpenDetail(item)}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography fontWeight="bold">{item.drillName}</Typography>
                    <Chip label={getDrillStatusLabel(item.status)} color={statusColors[item.status] || 'default'} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {getDrillTypeLabel(item.drillType)} | {item.targetDept || ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.scheduledDate || ''} | {t('emr.participantCount')}: {item.participantCount ?? ''}
                  </Typography>
                  {item.score && (
                    <Typography variant="body2" color="text.secondary">
                      {t('emr.score')}: {getDrillScoreLabel(item.score)}
                    </Typography>
                  )}
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
    return (
      <Box>
        <LoadingOverlay open={detailLoading} message={t('common.loading', '체크리스트 정보를 불러오는 중...')} />
        {/* PC Detail — 상단 항목은 비상 계획 상세와 동일한 레이아웃 (linkedPlan 기준) */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
          {/* 1: 계획번호 / 유형 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.planId')}</Typography>
            <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" fontFamily="monospace">{linkedPlan?.planId || ''}</Typography>
            </Box>
            <Typography sx={labelSx}>{t('emr.planType')}</Typography>
            <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2">{linkedPlan?.planType ? getDrillTypeLabel(linkedPlan.planType) : ''}</Typography>
            </Box>
          </Box>
          {/* 2: 계획명 / 상태 (드릴 상태) */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.planName')}</Typography>
            <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" fontWeight={600}>{linkedPlan?.planName || selectedItem.drillName}</Typography>
            </Box>
            <Typography sx={labelSx}>{t('common.status')}</Typography>
            <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
              <Chip label={getDrillStatusLabel(selectedItem.status)} color={statusColors[selectedItem.status] || 'default'} size="small" />
            </Box>
          </Box>
          {/* 3: 담당부서 / 담당자 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.responsibleDept')}</Typography>
            <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2">{linkedPlan?.responsibleDept || ''}</Typography>
            </Box>
            <Typography sx={labelSx}>{t('emr.responsibleName')}</Typography>
            <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2">{linkedPlan?.responsibleName || ''}</Typography>
            </Box>
          </Box>
          {/* 4: 훈련 시작일 / 종료일 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.trainingStartDate')}</Typography>
            <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" fontFamily="monospace">{linkedPlan?.trainingStartDate || ''}</Typography>
            </Box>
            <Typography sx={labelSx}>{t('emr.trainingEndDate')}</Typography>
            <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" fontFamily="monospace">{linkedPlan?.trainingEndDate || ''}</Typography>
            </Box>
          </Box>
          {/* 5: 작성자 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.writer')}</Typography>
            <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2">
                {formatUserName(linkedPlan?.writerTeam, linkedPlan?.writerName, linkedPlan?.writerPosition) || ''}
              </Typography>
            </Box>
          </Box>
          {/* 6: 계획 승인자 / 완료 승인자 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.planApprover')}</Typography>
            <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">
                {formatUserName(linkedPlan?.planApproverTeam, linkedPlan?.planApproverName, linkedPlan?.planApproverPosition) || ''}
              </Typography>
              {linkedPlan?.planApprovedAt && (
                <Typography variant="caption" color="text.secondary">
                  ({linkedPlan.planApprovedBy} | {linkedPlan.planApprovedAt.replace('T', ' ').substring(0, 19)})
                </Typography>
              )}
            </Box>
            <Typography sx={labelSx}>{t('emr.completionApprover')}</Typography>
            <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">
                {formatUserName(linkedPlan?.completionApproverTeam, linkedPlan?.completionApproverName, linkedPlan?.completionApproverPosition) || ''}
              </Typography>
              {linkedPlan?.completionApprovedAt && (
                <Typography variant="caption" color="text.secondary">
                  ({linkedPlan.completionApprovedBy} | {linkedPlan.completionApprovedAt.replace('T', ' ').substring(0, 19)})
                </Typography>
              )}
            </Box>
          </Box>
          {/* 7: 설명 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('common.description')}</Typography>
            <Box sx={valueSx}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{linkedPlan?.description || ''}</Typography>
            </Box>
          </Box>
          {/* 8: 대응 절차 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.responseSteps')}</Typography>
            <Box sx={valueSx}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{linkedPlan?.responseSteps || ''}</Typography>
            </Box>
          </Box>
          {/* 9: 자원·장비 */}
          {linkedPlan?.resourceIds && (
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('emr.resources', '자원·장비')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {allResources.filter(r => linkedPlan.resourceIds!.split(',').map(Number).includes(r.id)).map(r => (
                  <MuiChip key={r.id} label={r.resourceName} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}
          {/* 10: 비고 (드릴 자체) */}
          <Box sx={{ display: 'flex' }}>
            <Typography sx={labelSx}>{t('common.notes')}</Typography>
            <Box sx={valueSx}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedItem.notes || ''}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Mobile Detail */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
          {[
            [t('emr.drillId'), selectedItem.drillId],
            [t('common.status'), getDrillStatusLabel(selectedItem.status)],
            [t('emr.drillName'), selectedItem.drillName],
            [t('emr.drillType'), getDrillTypeLabel(selectedItem.drillType)],
            [t('emr.targetDept'), selectedItem.targetDept || ''],
            [t('emr.location'), selectedItem.location || ''],
            [t('emr.scheduledDate'), selectedItem.scheduledDate || ''],
            [t('emr.participantCount'), String(selectedItem.participantCount ?? '')],
            [t('emr.targetTime'), selectedItem.targetTime || ''],
            [t('emr.evacuationTime'), selectedItem.evacuationTime || ''],
            [t('emr.score'), selectedItem.score ? getDrillScoreLabel(selectedItem.score) : ''],
            [t('common.modifiedBy', '수정자'), selectedItem.modifiedBy || ''],
            [t('common.modifiedAt', '수정일자'), selectedItem.modifiedAt?.replace('T', ' ').substring(0, 16) || ''],
            ...(checklistTemplateId ? [
              [t('audit.checklistProgress'), `${selectedItem.completedChecklist}/${selectedItem.totalChecklist}`],
              [t('audit.findingCount'), String(selectedItem.findingCount)],
            ] : []),
            [t('emr.scenario'), selectedItem.scenario || ''],
            [t('common.notes'), selectedItem.notes || ''],
          ].filter(([, v]) => v).map(([label, value], i) => (
            <Box key={i}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography>
              <Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>{value}</Typography>
            </Box>
          ))}
          {linkedPlan?.resourceIds && (
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.resources', '자원·장비')}</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', px: 1.5, py: 0.5 }}>
                {allResources.filter(r => linkedPlan.resourceIds!.split(',').map(Number).includes(r.id)).map(r => (
                  <MuiChip key={r.id} label={r.resourceName} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {/* ===== 체크리스트 섹션 ===== */}
        {checklistTemplateId ? (
          <Box sx={{ mb: 3 }}>
            <SafetyChecklistTab ref={checklistRef} templateId={checklistTemplateId} embedded showSummary hideSignatures
              locked={linkedPlan?.status === 'COMPLETION_PENDING' || selectedItem?.status === 'COMPLETED'} />
          </Box>
        ) : (
          <Paper sx={{ p: 3, bgcolor: 'grey.50', mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              {t('emr.noChecklistLinked', '연결된 체크리스트가 없습니다. 비상 계획에서 체크리스트를 연결하세요.')}
            </Typography>
          </Paper>
        )}

        {/* ===== 변경 이력 ===== */}
        {drillLogs && drillLogs.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <HistoryIcon fontSize="small" />{t('audit.changeHistory', '변경 이력')}
            </Typography>
            {/* PC 테이블 */}
            <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: '1px solid', borderColor: 'divider' }}>
              <Table size="small" sx={{ '& td, & th': { borderRight: '1px solid', borderColor: 'divider', px: 1.5, py: 1 }, '& td:last-child, & th:last-child': { borderRight: 'none' } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 'bold', width: 160, textAlign: 'center' }}>{t('common.date', '일시')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 80, textAlign: 'center' }}>{t('common.modifiedBy', '수정자')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 120, textAlign: 'center' }}>{t('audit.logAction', '구분')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>{t('audit.logDetail', '내용')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {drillLogs.map((log) => (
                    <TableRow key={log.id} hover sx={{ cursor: log.action === 'CHECKLIST_SAVE' ? 'pointer' : 'default' }} onClick={() => handleLogClick(log)}>
                      <TableCell sx={{ textAlign: 'center', fontSize: '0.8rem', fontFamily: 'monospace' }}>{log.createdAt?.replace('T', ' ').substring(0, 19)}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontSize: '0.85rem' }}>{log.changedBy || ''}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip size="small" label={
                          log.action === 'CHECKLIST_SAVE' ? t('audit.logChecklist', '체크리스트 저장') :
                          log.action === 'STATUS_CHANGE' ? t('audit.logStatus', '상태 변경') : log.action
                        } color={log.action === 'STATUS_CHANGE' ? 'info' : 'default'} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{log.detail}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {/* Mobile 카드 */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              {drillLogs.map((log) => (
                <Paper key={log.id} sx={{ p: 2, border: 1, borderColor: 'divider', cursor: log.action === 'CHECKLIST_SAVE' ? 'pointer' : 'default' }} onClick={() => handleLogClick(log)}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{log.createdAt?.replace('T', ' ').substring(0, 19)}</Typography>
                    <Chip size="small" label={
                      log.action === 'CHECKLIST_SAVE' ? t('audit.logChecklist', '체크리스트 저장') :
                      log.action === 'STATUS_CHANGE' ? t('audit.logStatus', '상태 변경') : log.action
                    } color={log.action === 'STATUS_CHANGE' ? 'info' : 'default'} />
                  </Box>
                  {log.changedBy && <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{t('common.modifiedBy', '수정자')}: {log.changedBy}</Typography>}
                  <Typography variant="body2">{log.detail}</Typography>
                </Paper>
              ))}
            </Box>
          </Box>
        )}

        {/* 우하단 버튼 — 순서: 목록 / 저장 / 완료 결재 상신 / 반려 / 완료 승인
            (KPI 현황 톤과 일치 — 작성중(APPROVED) → 결재 상신 → COMPLETION_PENDING → 승인/반려) */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list')}</Button>
          {/* 저장 — 미완료(COMPLETED 아님) + 완료 결재 상신 중이 아닐 때만 */}
          {selectedItem.status !== 'COMPLETED' && linkedPlan?.status !== 'COMPLETION_PENDING' && canSee(MENU, 'SCHEDULED', '저장', getDrillRoles(linkedPlan)) && (
            <Button variant="contained" color="primary" onClick={handleSave} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save')}</Button>
          )}
          {selectedItem.status !== 'COMPLETED' && linkedPlan?.status === 'APPROVED' && canSee(MENU, 'SCHEDULED', '완료 결재 상신', getDrillRoles(linkedPlan)) && (
            <Button variant="contained" color="info" onClick={handleCompletionSubmit} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
              {t('emr.completionSubmit', '완료 결재 상신')}
            </Button>
          )}
          {selectedItem.status !== 'COMPLETED' && linkedPlan?.status === 'COMPLETION_PENDING' && canApproveCompletion() && canSee(MENU, 'SCHEDULED', '반려 (완료)', getDrillRoles(linkedPlan)) && (
            <Button variant="contained" color="warning" onClick={() => setRejectDialogOpen(true)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
              {t('common.reject', '반려')}
            </Button>
          )}
          {selectedItem.status !== 'COMPLETED' && linkedPlan?.status === 'COMPLETION_PENDING' && canApproveCompletion() && canSee(MENU, 'SCHEDULED', '완료 승인', getDrillRoles(linkedPlan)) && (
            <Button variant="contained" color="success" onClick={handleCompletionApprove} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
              {t('emr.completionApprove', '완료 승인')}
            </Button>
          )}
        </Box>

        {/* 완료 결재 반려 사유 입력 다이얼로그 */}
        <RejectReasonDialog
          open={rejectDialogOpen}
          stage={t('emr.completionReject', '완료 결재 반려')}
          onClose={() => setRejectDialogOpen(false)}
          onConfirm={handleRejectConfirm}
        />

        {/* 이력 상세 모달 */}
        <Dialog open={logModalOpen} onClose={() => setLogModalOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography fontWeight="bold">{t('audit.logSnapshotTitle', '체크리스트 상태')} — {logModalTitle}</Typography>
            <IconButton onClick={() => setLogModalOpen(false)} size="small"><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {logModalLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : logModalItems.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>{t('common.noData')}</Typography>
            ) : (
              <TableContainer>
                <Table size="small" sx={{ '& td, & th': { borderRight: '1px solid', borderColor: 'divider', px: 1, py: 0.75 }, '& td:last-child, & th:last-child': { borderRight: 'none' } }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 40, textAlign: 'center' }}>No</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 100, textAlign: 'center' }}>{t('safetyChecklist.category', '카테고리')}</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 60, textAlign: 'center' }}>{t('safetyChecklist.classification', '분류')}</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>{t('safetyChecklist.checkItem', '점검 항목')}</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 60, textAlign: 'center' }}>{t('safetyChecklist.pass', '적합')}</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 60, textAlign: 'center' }}>{t('safetyChecklist.fail', '부적합')}</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 60, textAlign: 'center' }}>{t('safetyChecklist.na', '해당없음')}</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 180, textAlign: 'center' }}>{t('safetyChecklist.finding', '지적사항')}</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 100, textAlign: 'center' }}>{t('safetyChecklist.actionDeadline', '조치기한')}</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 60, textAlign: 'center' }}>{t('safetyChecklist.actionComplete', '조치완료')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logModalItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell sx={{ textAlign: 'center' }}>{item.itemNo}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontSize: '0.8rem' }}>{item.categoryName || ''}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontSize: '0.75rem', color: item.classification === '필수' ? 'error.main' : 'info.main', fontWeight: 'bold' }}>{item.classification || ''}</TableCell>
                        <TableCell sx={{ fontSize: '0.85rem' }}>{item.checkItem || ''}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography sx={{ fontSize: '1.2rem', color: item.checkResult === 'PASS' ? 'success.main' : 'grey.300', fontWeight: 'bold' }}>○</Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography sx={{ fontSize: '1.2rem', color: item.checkResult === 'FAIL' ? 'error.main' : 'grey.300', fontWeight: 'bold' }}>✕</Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography sx={{ fontSize: '1.2rem', color: item.checkResult === 'NA' ? 'text.primary' : 'grey.300', fontWeight: 'bold' }}>-</Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>{item.finding || ''}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontSize: '0.8rem' }}>{item.actionDeadline || ''}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography sx={{ fontSize: '1rem', color: item.actionComplete ? 'success.main' : 'grey.300' }}>{item.actionComplete ? '✔' : '—'}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLogModalOpen(false)}>{t('common.close', '닫기')}</Button>
          </DialogActions>
        </Dialog>
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
            <Typography sx={labelSx}>{t('emr.drillName')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valueBorderSx}>
              <TextField fullWidth size="small" value={form.drillName} onChange={(e) => setForm({ ...form, drillName: e.target.value })} />
            </Box>
            <Typography sx={labelSx}>{t('emr.drillType')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valueSx}>
              <Select fullWidth size="small" value={form.drillType} onChange={(e) => setForm({ ...form, drillType: e.target.value })}>
                {drillTypeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getDrillTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.targetDept')}</Typography>
            <Box sx={valueBorderSx}>
              <TextField fullWidth size="small" value={form.targetDept || ''} onChange={(e) => setForm({ ...form, targetDept: e.target.value })} />
            </Box>
            <Typography sx={labelSx}>{t('emr.location')}</Typography>
            <Box sx={valueSx}>
              <TextField fullWidth size="small" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.scheduledDate')}</Typography>
            <Box sx={valueBorderSx}>
              <DatePickerField value={form.scheduledDate || null} onChange={(v) => setForm({ ...form, scheduledDate: v })} size="small" />
            </Box>
            <Typography sx={labelSx}>{t('emr.participantCount')}</Typography>
            <Box sx={valueSx}>
              <NumberField fullWidth size="small" value={form.participantCount ?? ''} onChange={(v) => setForm({ ...form, participantCount: (v ?? undefined) as number | undefined })} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.targetTime')}</Typography>
            <Box sx={valueBorderSx}>
              <TextField fullWidth size="small" value={form.targetTime || ''} onChange={(e) => setForm({ ...form, targetTime: e.target.value })} />
            </Box>
            <Typography sx={labelSx}>{t('common.status')}</Typography>
            <Box sx={valueSx}>
              <Select fullWidth size="small" value={form.status || 'SCHEDULED'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {drillStatusCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getDrillStatusLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          </Box>
          {viewMode === 'edit' && (
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('emr.evacuationTime')}</Typography>
              <Box sx={valueBorderSx}>
                <TextField fullWidth size="small" value={form.evacuationTime || ''} onChange={(e) => setForm({ ...form, evacuationTime: e.target.value })} />
              </Box>
              <Typography sx={labelSx}>{t('emr.score')}</Typography>
              <Box sx={valueSx}>
                <Select fullWidth size="small" value={form.score || ''} onChange={(e) => setForm({ ...form, score: e.target.value })}>
                  <MenuItem value=""></MenuItem>
                  {drillScoreCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getDrillScoreLabel(c.code)}</MenuItem>)}
                </Select>
              </Box>
            </Box>
          )}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.scenario')}</Typography>
            <Box sx={valueSx}>
              <TextField fullWidth size="small" multiline rows={4} value={form.scenario || ''} onChange={(e) => setForm({ ...form, scenario: e.target.value })} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Typography sx={labelSx}>{t('common.notes')}</Typography>
            <Box sx={valueSx}>
              <TextField fullWidth size="small" multiline rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Box>
          </Box>
        </Paper>

        {/* Mobile Form */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('emr.drillName')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.drillName} onChange={(e) => setForm({ ...form, drillName: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('emr.drillType')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <FormControl fullWidth size="small">
              <Select value={form.drillType} onChange={(e) => setForm({ ...form, drillType: e.target.value })}>
                {drillTypeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getDrillTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.targetDept')}</Typography>
            <TextField size="small" fullWidth value={form.targetDept || ''} onChange={(e) => setForm({ ...form, targetDept: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.location')}</Typography>
            <TextField size="small" fullWidth value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Box>
          <DatePickerField value={form.scheduledDate || null} onChange={(v) => setForm({ ...form, scheduledDate: v })} size="small" label={t('emr.scheduledDate')} />
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.participantCount')}</Typography>
            <NumberField size="small" fullWidth value={form.participantCount ?? ''} onChange={(v) => setForm({ ...form, participantCount: (v ?? undefined) as number | undefined })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.targetTime')}</Typography>
            <TextField size="small" fullWidth value={form.targetTime || ''} onChange={(e) => setForm({ ...form, targetTime: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.status')}</Typography>
            <FormControl fullWidth size="small">
              <Select value={form.status || 'SCHEDULED'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {drillStatusCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getDrillStatusLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          {viewMode === 'edit' && (
            <>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.evacuationTime')}</Typography>
                <TextField size="small" fullWidth value={form.evacuationTime || ''} onChange={(e) => setForm({ ...form, evacuationTime: e.target.value })} />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.score')}</Typography>
                <FormControl fullWidth size="small">
                  <Select value={form.score || ''} onChange={(e) => setForm({ ...form, score: e.target.value })}>
                    <MenuItem value=""></MenuItem>
                    {drillScoreCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getDrillScoreLabel(c.code)}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
            </>
          )}
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.scenario')}</Typography>
            <TextField size="small" fullWidth multiline rows={4} value={form.scenario || ''} onChange={(e) => setForm({ ...form, scenario: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.notes')}</Typography>
            <TextField size="small" fullWidth multiline rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Box>
        </Box>

        {/* ===== 비상 계획에 연결된 체크리스트 (수정 모드) ===== */}
        {viewMode === 'edit' && checklistTemplateId && (
          <Box sx={{ mt: 3 }}>
            <SafetyChecklistTab ref={checklistRef} templateId={checklistTemplateId} embedded showSummary hideSignatures
              locked={linkedPlan?.status === 'COMPLETION_PENDING' || selectedItem?.status === 'COMPLETED'} />
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={() => viewMode === 'edit' ? setViewMode('detail') : handleBackToList()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save')}</Button>
        </Box>
      </Box>
    )
  }

  return null
}

export default EmrDrillTab
