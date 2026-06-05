import { useState, useRef, useEffect, useMemo } from 'react'
import { useButtonRules } from '../hooks/useButtonRules'
import { Role } from '../data/buttonManageData'
import { fmtPhone } from '../utils/phoneFormat'
import { contractorRegistrationApi } from '../api/contractorRegistrationApi'
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, Select, MenuItem,
  FormControl, Chip, Pagination, CircularProgress, Alert, Tabs, Tab,
  Checkbox, ListItemText, OutlinedInput,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import IconButton from '@mui/material/IconButton'
import DatePickerField from '../components/common/DatePickerField'
import NumberField from '../components/common/NumberField'
import { useAlert } from '../contexts/AlertContext'
import { useAuth } from '../context/AuthContext'
import { permitToWorkApi } from '../api/permitToWorkApi'
import { fetchTeamLeader } from '../api/approvalApi'
import { ppeEquipmentApi } from '../api/ppeEquipmentApi'
import { PpeEquipment } from '../types/ppeEquipment.types'
import { fetchSafetyTemplates, fetchSafetyTemplateDetail } from '../api/safetyChecklistApi'
import SafetyChecklistTab, { SafetyChecklistTabRef } from '../components/ehs/SafetyChecklistTab'
import PermitReportTab from '../components/ehs/PermitReportTab'
import PermitDashboardTab from '../components/ehs/PermitDashboardTab'
import RejectReasonDialog from '../components/common/RejectReasonDialog'
import UserSelectModal, { UserInfo } from '../components/common/UserSelectModal'
import axiosInstance from '../api/axiosInstance'
import { ApiResponse } from '../types/common.types'

interface FileMetadata {
  id: number
  fileName: string
  fileSize: number
  contentType: string
  entityType: string
  entityId: string
}
import { PermitToWork, PermitToWorkRequest } from '../types/permitToWork.types'
import { SafetyChecklistTemplate } from '../types/safetyChecklist.types'
import useCodeMap from '../hooks/useCodeMap'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

// 승인요청(=대기) 과 승인완료(=승인됨) 시각 구분:
//   DRAFT(작성중)=default · REQUESTED(승인요청)=warning · APPROVED(승인완료)=info
//   DONE/COMPLETED=success · REJECTED=error
const STATUS_COLORS: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  DRAFT: 'default', PENDING: 'warning', REQUESTED: 'warning', APPROVED: 'info',
  PENDING_APPROVAL: 'warning', COMPLETION_PENDING: 'warning', DONE: 'success',
  COMPLETED: 'success', REJECTED: 'error', CANCELLED: 'default',
}

const RISK_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  LOW: 'success', MEDIUM: 'warning', HIGH: 'error', CRITICAL: 'error',
}

// Style constants
const labelSx = {
  width: 128, minWidth: 128, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center',
}
const valSx = { flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem' }
const valSxBorder = { ...valSx, borderRight: 1, borderColor: 'grey.300' }
const hSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

// =============================================
// Tab 1: 작업 허가 신청 (My Permit Applications)
// mode 'external' — 협력 업체 작업 허가 (PartnerPermitPage 에서 재사용)
// =============================================
export const PermitApplicationContent: React.FC<{ mode: 'my' | 'all' | 'external' }> = ({ mode }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { codeList: permitTypes, getLabel: getPermitTypeLabel } = useCodeMap('PERMIT_TYPE')
  const { codeList: permitStatuses, getLabel: getStatusLabel } = useCodeMap('PERMIT_STATUS')
  const { codeList: riskLevels, getLabel: getRiskLabel } = useCodeMap('RISK_LEVEL')

  const myId = user?.username || user?.email || ''
  const isExternalMode = mode === 'external'
  const { canSee } = useButtonRules()
  const MENU = '작업허가 › 허가 신청'
  const isAdminUser = user?.role === 'SYSTEM_ADMIN'
  const myRoles: string[] = ['guest', ...(isAdminUser ? ['superAdmin'] : [user?.role ?? ''].filter(Boolean))]
  const getItemRoles = (item: { planApproverUserId?: number|null; planApproverName?: string|null; completionApproverUserId?: number|null; completionApproverName?: string|null }): string[] => {
    const normalizeName = (s?: string | null) => (s || '').trim()
    const roles: string[] = [...myRoles]
    if (mode === 'all') { if (!roles.includes('planApprover')) roles.push('planApprover', 'completionApprover') }
    else {
      if ((item.planApproverUserId && item.planApproverUserId === user?.id) || (item.planApproverName && normalizeName(item.planApproverName) === normalizeName(user?.name))) roles.push('planApprover')
      if ((item.completionApproverUserId && item.completionApproverUserId === user?.id) || (item.completionApproverName && normalizeName(item.completionApproverName) === normalizeName(user?.name))) roles.push('completionApprover')
    }
    return roles
  }

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<PermitToWork | null>(null)

  // List filters
  const [page, setPage] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Form state
  const [form, setForm] = useState<PermitToWorkRequest>({ permitType: '', riskLevel: '', title: '', isExternal: isExternalMode })
  const [attachFiles, setAttachFiles] = useState<File[]>([])
  const [existingFiles, setExistingFiles] = useState<FileMetadata[]>([])
  const [deletedFileIds, setDeletedFileIds] = useState<number[]>([])

  // Checklist template & inspector
  const [templates, setTemplates] = useState<SafetyChecklistTemplate[]>([])
  const [showUserModal, setShowUserModal] = useState(false)
  // 계획/완료 결재자 선택 모달 (target: 'planApprover' | 'completionApprover' | 'inspector')
  const [userPickTarget, setUserPickTarget] = useState<'planApprover' | 'completionApprover' | 'inspector' | null>(null)
  // 결재 반려 사유 입력 다이얼로그
  const [rejectDialogStage, setRejectDialogStage] = useState<'plan' | 'completion' | null>(null)

  // PPE inventory list for multi-select
  const [ppeList, setPpeList] = useState<PpeEquipment[]>([])

  // External worker fields
  const [workers, setWorkers] = useState<Array<{ workerName: string; workerCompany: string; workerPhone: string }>>([])

  useEffect(() => {
    // 템플릿은 전체를 저장해 둠 — 이름 lookup 은 종류와 무관해야
    // (스냅샷·삭제된 템플릿도 #ID 가 아니라 이름으로 표시 가능).
    // 드롭다운에서만 categoryType 으로 필터링.
    fetchSafetyTemplates().then(all => {
      setTemplates(all)
    }).catch(() => {})
    ppeEquipmentApi.getAll(0, 200).then(res => {
      setPpeList(res.content || [])
    }).catch(() => {})
  }, [])

  const loadExistingFiles = async (permitId: string) => {
    try {
      const res = await axiosInstance.get<ApiResponse<FileMetadata[]>>(`/files/by-entity/PERMIT_TO_WORK/${permitId}`)
      setExistingFiles(res.data.data || [])
    } catch { setExistingFiles([]) }
  }

  const uploadFiles = async (permitId: string) => {
    for (const fileId of deletedFileIds) {
      try { await axiosInstance.delete(`/files/${fileId}`) } catch { /* ignore */ }
    }
    for (const file of attachFiles) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('entityType', 'PERMIT_TO_WORK')
      fd.append('entityId', permitId)
      await axiosInstance.post('/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    }
  }

  const queryKey = isExternalMode
    ? ['ptwExternal', page]
    : searchText ? ['ptwSearch', searchText, page]
    : statusFilter ? ['ptwStatus', statusFilter, page]
    : typeFilter ? ['ptwType', typeFilter, page]
    : ['ptw', page]

  const queryFn = () => {
    if (isExternalMode) return permitToWorkApi.getExternal(page, 10)
    if (searchText) return permitToWorkApi.search(searchText, page, 10)
    if (statusFilter) return permitToWorkApi.getByStatus(statusFilter, page, 10)
    if (typeFilter) return permitToWorkApi.getByType(typeFilter, page, 10)
    return permitToWorkApi.getAll(page, 10)
  }

  const { data, isLoading } = useQuery({ queryKey, queryFn, enabled: viewMode === 'list' })

  // 등록된 협력업체 (소속업체 셀렉박스 옵션)
  const { data: contractorRegPage } = useQuery({
    queryKey: ['contractorRegistrationsForPermitWorker'],
    queryFn: () => contractorRegistrationApi.search({ regStatus: 'APPROVED', size: 200 }),
    staleTime: 1000 * 60 * 5,
  })
  const contractorRegs = contractorRegPage?.content || []

  const createMutation = useMutation({
    mutationFn: (req: PermitToWorkRequest) => permitToWorkApi.create(req),
    onSuccess: async (created) => {
      if (created?.permitId) await uploadFiles(created.permitId)
      // Save external workers
      if (isExternalMode && created?.id && workers.length > 0) {
        for (const w of workers) {
          await permitToWorkApi.addWorker(created.id, { workerName: w.workerName, workerCompany: w.workerCompany, workerPhone: w.workerPhone, workerType: 'EXTERNAL' })
        }
      }
      queryClient.invalidateQueries({ queryKey: ['ptw'] })
      queryClient.invalidateQueries({ queryKey: ['ptwExternal'] })
      queryClient.invalidateQueries({ queryKey: ['ptwMy'] })
      showSuccess(t('common.saved'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: number; req: PermitToWorkRequest }) => permitToWorkApi.update(id, req),
    onSuccess: async (updated) => {
      if (updated?.permitId) await uploadFiles(updated.permitId)
      // Save external workers (delete old + re-add)
      if (isExternalMode && updated?.id && workers.length > 0) {
        await permitToWorkApi.deleteWorkers(updated.id)
        for (const w of workers) {
          await permitToWorkApi.addWorker(updated.id, { workerName: w.workerName, workerCompany: w.workerCompany, workerPhone: w.workerPhone, workerType: 'EXTERNAL' })
        }
      }
      queryClient.invalidateQueries({ queryKey: ['ptw'] })
      queryClient.invalidateQueries({ queryKey: ['ptwExternal'] })
      queryClient.invalidateQueries({ queryKey: ['ptwMy'] })
      showSuccess(t('common.saved'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })
  // 계획/완료 결재 흐름 전이 — 협력사·EMR 패턴과 동일
  const transitionMutation = useMutation({
    mutationFn: ({ id, action, rejectReason }: { id: number; action: 'submit' | 'approve' | 'reject' | 'completionSubmit' | 'complete'; rejectReason?: string }) =>
      permitToWorkApi.transition(id, action, rejectReason),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['ptw'] })
      queryClient.invalidateQueries({ queryKey: ['ptwExternal'] })
      queryClient.invalidateQueries({ queryKey: ['ptwMy'] })
      queryClient.invalidateQueries({ queryKey: ['ptwApproved'] })
      queryClient.invalidateQueries({ queryKey: ['ptwStatus'] })
      if (updated) setSelectedItem(updated)
      showSuccess(t('common.saved'))
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message
      showError(msg || t('common.error'))
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => permitToWorkApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ptw'] })
      queryClient.invalidateQueries({ queryKey: ['ptwExternal'] })
      queryClient.invalidateQueries({ queryKey: ['ptwMy'] })
      showSuccess(t('common.deleted'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  // Handlers
  const handleBackToList = () => {
    setViewMode('list')
    setSelectedItem(null)
    setForm({ permitType: '', riskLevel: '', title: '', isExternal: isExternalMode })
    setAttachFiles([])
    setExistingFiles([])
    setDeletedFileIds([])
    setWorkers([])
  }

  const handleRowClick = (item: PermitToWork) => {
    setSelectedItem(item)
    setViewMode('detail')
    if (item.permitId) loadExistingFiles(item.permitId)
  }

  const handleOpenCreate = async () => {
    setSelectedItem(null)
    const leader = await fetchTeamLeader(user?.deptCode)
    setForm({
      permitType: '', riskLevel: '', title: '', isExternal: isExternalMode,
      ...(leader ? {
        planApproverName: leader.name, planApproverPosition: leader.position, planApproverTeam: leader.team,
        completionApproverName: leader.name, completionApproverPosition: leader.position, completionApproverTeam: leader.team,
      } : {}),
    })
    setAttachFiles([])
    setExistingFiles([])
    setDeletedFileIds([])
    setWorkers([])
    setViewMode('create')
  }

  const handleOpenEdit = async (item: PermitToWork) => {
    setSelectedItem(item)
    setForm({
      permitType: item.permitType, riskLevel: item.riskLevel, status: item.status,
      title: item.title, description: item.description, workLocation: item.workLocation,
      workStartDate: item.workStartDate, workEndDate: item.workEndDate,
      requesterName: item.requesterName, requesterDept: item.requesterDept,
      approverName: item.approverName, approverDept: item.approverDept,
      safetyMeasures: item.safetyMeasures, requiredPpe: item.requiredPpe,
      hazardFactors: item.hazardFactors, emergencyContact: item.emergencyContact,
      workersCount: item.workersCount, notes: item.notes,
      checklistTemplateId: item.checklistTemplateId,
      inspectorName: item.inspectorName,
      isExternal: item.isExternal,
      planApproverUserId: item.planApproverUserId,
      planApproverTeam: item.planApproverTeam || '',
      planApproverPosition: item.planApproverPosition || '',
      planApproverName: item.planApproverName || '',
      completionApproverUserId: item.completionApproverUserId,
      completionApproverTeam: item.completionApproverTeam || '',
      completionApproverPosition: item.completionApproverPosition || '',
      completionApproverName: item.completionApproverName || '',
    })
    setAttachFiles([])
    setDeletedFileIds([])
    if (item.permitId) loadExistingFiles(item.permitId)
    // Load workers for external mode
    if (isExternalMode && item.id) {
      try {
        const existingWorkers = await permitToWorkApi.getWorkers(item.id)
        setWorkers((existingWorkers || []).map(w => ({ workerName: w.workerName, workerCompany: w.workerCompany || '', workerPhone: w.workerPhone || '' })))
      } catch { setWorkers([]) }
    }
    setViewMode('edit')
  }

  const handleSave = () => {
    const saveForm = { ...form, isExternal: isExternalMode }
    if (selectedItem) updateMutation.mutate({ id: selectedItem.id, req: saveForm })
    else createMutation.mutate(saveForm)
  }

  const handleDelete = async (item: PermitToWork) => {
    const ok = await showConfirm(`${item.title}\n${t('common.delete')}하시겠습니까?`)
    if (ok) deleteMutation.mutate(item.id)
  }

  const handleUserSelect = (users: UserInfo[]) => {
    if (users.length > 0) {
      const u = users[0]
      if (userPickTarget === 'planApprover') {
        setForm(f => ({ ...f, planApproverUserId: u.id, planApproverTeam: u.department || '', planApproverName: u.name }))
      } else if (userPickTarget === 'completionApprover') {
        setForm(f => ({ ...f, completionApproverUserId: u.id, completionApproverTeam: u.department || '', completionApproverName: u.name }))
      } else {
        // 기본은 inspector (이전 동작 유지)
        setForm(f => ({ ...f, inspectorName: u.name }))
      }
    }
    setShowUserModal(false)
    setUserPickTarget(null)
  }

  // 마스터 목록에 없는 templateId(=스냅샷)는 상세 조회로 이름 lookup
  const items = data?.content || []
  const unknownTemplateIds = useMemo(() => {
    const all = new Set<number>()
    items.forEach(i => { if (i.checklistTemplateId) all.add(i.checklistTemplateId) })
    if (selectedItem?.checklistTemplateId) all.add(selectedItem.checklistTemplateId)
    return Array.from(all).filter(id => !templates.find(t => t.id === id))
  }, [items, selectedItem, templates])

  const snapshotQueries = useQueries({
    queries: unknownTemplateIds.map(id => ({
      queryKey: ['safetyTemplateDetail', id],
      queryFn: () => fetchSafetyTemplateDetail(id),
      staleTime: 60_000,
    })),
  })
  const snapshotNameMap = useMemo(() => {
    const m = new Map<number, string>()
    unknownTemplateIds.forEach((id, idx) => {
      const data = snapshotQueries[idx]?.data
      if (data?.templateName) m.set(id, data.templateName)
    })
    return m
  }, [unknownTemplateIds, snapshotQueries])

  const getTemplateName = (templateId?: number) => {
    if (!templateId) return ''
    const tmpl = templates.find(t => t.id === templateId)
    if (tmpl?.templateName) return tmpl.templateName
    const snap = snapshotNameMap.get(templateId)
    if (snap) return snap
    // 아직 로딩 중이면 빈 문자열(스피너 대신), 정말 없으면 삭제 메시지
    const stillLoading = snapshotQueries.some(q => q.isLoading)
    return stillLoading ? '' : (templates.length === 0 ? '' : t('common.deletedTemplate', '삭제된 체크리스트'))
  }
  const totalPages = data?.totalPages || 0

  // ==================== LIST VIEW ====================
  if (viewMode === 'list') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {!isExternalMode && (
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            {t('permit.myApplication', '작업 허가 신청')}
          </Typography>
        )}

        {/* Search / Filter bar - PC */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField size="small" placeholder={t('ptw.searchPlaceholder')} value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setPage(0); setStatusFilter(''); setTypeFilter('') }}
              sx={{ minWidth: 200 }} />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); setSearchText(''); setTypeFilter('') }}>
                <MenuItem value="">{t('ptw.allStatus')}</MenuItem>
                {permitStatuses.map((c) => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select displayEmpty value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); setSearchText(''); setStatusFilter('') }}>
                <MenuItem value="">{t('ptw.allTypes')}</MenuItem>
                {permitTypes.map((c) => <MenuItem key={c.code} value={c.code}>{getPermitTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <IconButton onClick={() => { setSearchText(''); setStatusFilter(''); setTypeFilter(''); setPage(0) }} size="small"><RefreshIcon /></IconButton>
          </Box>
          {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>New</Button>
          )}
        </Box>
        {/* Search / Filter bar - Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <TextField size="small" fullWidth placeholder={t('ptw.searchPlaceholder')} value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setPage(0); setStatusFilter(''); setTypeFilter('') }} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); setSearchText(''); setTypeFilter('') }}>
                <MenuItem value="">{t('ptw.allStatus')}</MenuItem>
                {permitStatuses.map((c) => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select displayEmpty value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); setSearchText(''); setStatusFilter('') }}>
                <MenuItem value="">{t('ptw.allTypes')}</MenuItem>
                {permitTypes.map((c) => <MenuItem key={c.code} value={c.code}>{getPermitTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ flex: 1 }}>New</Button>
            )}
          </Box>
        </Box>

        {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        : items.length === 0 ? <Alert severity="info" sx={{ m: 2 }}>{t('common.noData')}</Alert>
        : <>
          {/* PC Table */}
          <Paper sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={hSx}>{t('ptw.permitId')}</TableCell>
                    <TableCell sx={hSx}>{t('ptw.type')}</TableCell>
                    <TableCell sx={hSx}>{t('ptw.title')}</TableCell>
                    <TableCell sx={hSx}>{t('ptw.riskLevel')}</TableCell>
                    <TableCell sx={hSx}>{t('ptw.workPeriod')}</TableCell>
                    <TableCell sx={hSx}>{t('ptw.requester')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('ptw.status')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.permitId}</TableCell>
                      <TableCell align="center">{getPermitTypeLabel(item.permitType)}</TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>{item.title}</Typography></TableCell>
                      <TableCell align="center"><Chip label={getRiskLabel(item.riskLevel)} color={RISK_COLORS[item.riskLevel] || 'default'} size="small" /></TableCell>
                      <TableCell align="center">
                        {item.workStartDate?.substring(0, 10) || ''} ~ {item.workEndDate?.substring(0, 10) || ''}
                      </TableCell>
                      <TableCell align="center">{item.requesterName || ''}</TableCell>
                      <TableCell align="center"><Chip label={getStatusLabel(item.status)} color={STATUS_COLORS[item.status] || 'default'} variant="outlined" size="small" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Mobile Card List */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
            {items.map((item) => (
              <Paper key={item.id} sx={{ p: 2, border: 1, borderColor: 'grey.300', cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography fontWeight="bold">{item.title}</Typography>
                  <Chip label={getStatusLabel(item.status)} color={STATUS_COLORS[item.status] || 'default'} variant="outlined" size="small" />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {getPermitTypeLabel(item.permitType)} | {item.requesterName || ''}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.workStartDate?.substring(0, 10) || ''} ~ {item.workEndDate?.substring(0, 10) || ''}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                  <Chip label={getRiskLabel(item.riskLevel)} color={RISK_COLORS[item.riskLevel] || 'default'} size="small" />
                </Box>
              </Paper>
            ))}
          </Box>

          {totalPages > 1 && <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><Pagination count={totalPages} page={page + 1} onChange={(_, p) => setPage(p - 1)} color="primary" /></Box>}
        </>}
      </Box>
    )
  }

  // ==================== DETAIL VIEW ====================
  if (viewMode === 'detail' && selectedItem) {
    const dLabelSx = { ...labelSx, width: 140, minWidth: 140 }
    const dValSx = { flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper' }
    const dValBorderSx = { ...dValSx, borderRight: 1, borderColor: 'grey.300' }
    const dRowSx = { display: 'flex', borderBottom: 1, borderColor: 'grey.300' }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {!isExternalMode && (
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            {t('permit.myApplication', '작업 허가 신청')}
          </Typography>
        )}

          {/* PC 2열 */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
            <Box sx={dRowSx}><Typography sx={dLabelSx}>{t('ptw.permitId')}</Typography><Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.permitId}</Typography></Box><Typography sx={dLabelSx}>{t('ptw.status')}</Typography><Box sx={dValSx}><Chip label={getStatusLabel(selectedItem.status)} color={STATUS_COLORS[selectedItem.status] || 'default'} variant="outlined" size="small" /></Box></Box>
            <Box sx={dRowSx}><Typography sx={dLabelSx}>{t('ptw.type')}</Typography><Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{getPermitTypeLabel(selectedItem.permitType)}</Typography></Box><Typography sx={dLabelSx}>{t('ptw.riskLevel')}</Typography><Box sx={dValSx}><Chip label={getRiskLabel(selectedItem.riskLevel)} color={RISK_COLORS[selectedItem.riskLevel] || 'default'} size="small" /></Box></Box>
            <Box sx={dRowSx}><Typography sx={dLabelSx}>{t('ptw.title')}</Typography><Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.title}</Typography></Box><Typography sx={dLabelSx}>{t('ptw.workersCount')}</Typography><Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.workersCount || 0}명</Typography></Box></Box>
            <Box sx={dRowSx}><Typography sx={dLabelSx}>{t('ptw.workLocation')}</Typography><Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.workLocation || ''}</Typography></Box><Typography sx={dLabelSx}>{t('ptw.workPeriod')}</Typography><Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.workStartDate?.replace('T', ' ').substring(0, 16) || ''} ~ {selectedItem.workEndDate?.replace('T', ' ').substring(0, 16) || ''}</Typography></Box></Box>
            <Box sx={dRowSx}><Typography sx={dLabelSx}>{t('ptw.requester')}</Typography><Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.requesterName || ''} ({selectedItem.requesterDept || ''})</Typography></Box><Typography sx={dLabelSx}>{t('ptw.approver')}</Typography><Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.approverName || ''} ({selectedItem.approverDept || ''})</Typography></Box></Box>
            {/* 계획 / 완료 결재자 표시 */}
            <Box sx={dRowSx}>
              <Typography sx={dLabelSx}>{t('common.planApprover', '계획 승인자')}</Typography>
              <Box sx={dValBorderSx}>
                <Typography variant="body2" sx={{ py: 0.5 }}>
                  {[selectedItem.planApproverTeam, selectedItem.planApproverPosition, selectedItem.planApproverName].filter(Boolean).join(' / ') || ''}
                  {selectedItem.planApprovedAt && (
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      ({selectedItem.planApprovedBy} | {selectedItem.planApprovedAt.replace('T', ' ').substring(0, 19)})
                    </Typography>
                  )}
                </Typography>
              </Box>
              <Typography sx={dLabelSx}>{t('common.completionApprover', '완료 승인자')}</Typography>
              <Box sx={dValSx}>
                <Typography variant="body2" sx={{ py: 0.5 }}>
                  {[selectedItem.completionApproverTeam, selectedItem.completionApproverPosition, selectedItem.completionApproverName].filter(Boolean).join(' / ') || ''}
                  {selectedItem.completionApprovedAt && (
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      ({selectedItem.completionApprovedBy} | {selectedItem.completionApprovedAt.replace('T', ' ').substring(0, 19)})
                    </Typography>
                  )}
                </Typography>
              </Box>
            </Box>
            <Box sx={dRowSx}><Typography sx={dLabelSx}>{t('ptw.requiredPpe')}</Typography><Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.requiredPpe || ''}</Typography></Box><Typography sx={dLabelSx}>{t('ptw.emergencyContact')}</Typography><Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.emergencyContact || ''}</Typography></Box></Box>
            {/* Checklist template & inspector */}
            <Box sx={dRowSx}><Typography sx={dLabelSx}>{t('ptw.checklist', '체크리스트')}</Typography><Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{getTemplateName(selectedItem.checklistTemplateId)}</Typography></Box><Typography sx={dLabelSx}>{t('ptw.inspectorName', '점검자')}</Typography><Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.inspectorName || ''}</Typography></Box></Box>
            {selectedItem.description && <Box sx={dRowSx}><Typography sx={dLabelSx}>{t('ptw.description')}</Typography><Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5, whiteSpace: 'pre-wrap' }}>{selectedItem.description}</Typography></Box></Box>}
            {selectedItem.safetyMeasures && <Box sx={dRowSx}><Typography sx={dLabelSx}>{t('ptw.safetyMeasures')}</Typography><Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5, whiteSpace: 'pre-wrap' }}>{selectedItem.safetyMeasures}</Typography></Box></Box>}
            {selectedItem.hazardFactors && <Box sx={dRowSx}><Typography sx={dLabelSx}>{t('ptw.hazardFactors')}</Typography><Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5, whiteSpace: 'pre-wrap' }}>{selectedItem.hazardFactors}</Typography></Box></Box>}
            {selectedItem.rejectionReason && <Box sx={dRowSx}><Typography sx={dLabelSx}>{t('ptw.rejectionReason')}</Typography><Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5, whiteSpace: 'pre-wrap' }}>{selectedItem.rejectionReason}</Typography></Box></Box>}
            {selectedItem.notes && <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}><Typography sx={dLabelSx}>{t('common.notes')}</Typography><Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5, whiteSpace: 'pre-wrap' }}>{selectedItem.notes}</Typography></Box></Box>}
            {existingFiles.length > 0 && (
              <Box sx={{ display: 'flex' }}>
                <Typography sx={dLabelSx}>{t('common.attachments', '첨부파일')}</Typography>
                <Box sx={{ ...dValSx, flexDirection: 'column', gap: 0.5 }}>
                  {existingFiles.map(f => (
                    <Box key={f.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">{f.fileName}</Typography>
                      <IconButton size="small" href={`/api/files/${f.id}`} target="_blank"><DownloadIcon fontSize="small" /></IconButton>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          {/* Mobile 1열 */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
            {[
              [t('ptw.permitId'), selectedItem.permitId],
              [t('ptw.status'), getStatusLabel(selectedItem.status)],
              [t('ptw.type'), getPermitTypeLabel(selectedItem.permitType)],
              [t('ptw.riskLevel'), getRiskLabel(selectedItem.riskLevel)],
              [t('ptw.title'), selectedItem.title],
              [t('ptw.workLocation'), selectedItem.workLocation],
              [t('ptw.workPeriod'), `${selectedItem.workStartDate?.replace('T', ' ').substring(0, 16) || ''} ~ ${selectedItem.workEndDate?.replace('T', ' ').substring(0, 16) || ''}`],
              [t('ptw.requester'), `${selectedItem.requesterName || ''} (${selectedItem.requesterDept || ''})`],
              [t('ptw.approver'), `${selectedItem.approverName || ''} (${selectedItem.approverDept || ''})`],
              [t('ptw.workersCount'), `${selectedItem.workersCount || 0}명`],
              [t('ptw.requiredPpe'), selectedItem.requiredPpe],
              [t('ptw.emergencyContact'), selectedItem.emergencyContact],
              [t('ptw.checklist', '체크리스트'), getTemplateName(selectedItem.checklistTemplateId)],
              [t('ptw.inspectorName', '점검자'), selectedItem.inspectorName],
              [t('ptw.description'), selectedItem.description],
              [t('ptw.safetyMeasures'), selectedItem.safetyMeasures],
              [t('ptw.hazardFactors'), selectedItem.hazardFactors],
              [t('ptw.rejectionReason'), selectedItem.rejectionReason],
              [t('common.notes'), selectedItem.notes],
            ].filter(([, v]) => v).map(([label, value], i) => (
              <Box key={i}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>{value}</Typography>
              </Box>
            ))}
          </Box>

        {/* Embedded checklist in detail */}
        {selectedItem.checklistTemplateId && (
          <Box sx={{ mb: 3 }}>
            <SafetyChecklistTab templateId={selectedItem.checklistTemplateId} embedded />
          </Box>
        )}

        {/* 반려 사유 표시 (REJECTED 상태에서) */}
        {selectedItem.status === 'REJECTED' && selectedItem.rejectReason && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'error.lighter', border: 1, borderColor: 'error.light', borderRadius: 1 }}>
            <Typography variant="body2" color="error.main" fontWeight="bold" sx={{ mb: 0.5 }}>
              {t('common.rejectReasonTitle', '반려 사유')}
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedItem.rejectReason}</Typography>
          </Box>
        )}

        {/* 하단 버튼 — 계획/완료 결재 흐름: 6개 버튼 (계획 결재 상신/승인/반려, 완료 결재 상신/승인/반려) */}
        {(() => {
          const status = selectedItem.status
          const itemR = getItemRoles(selectedItem)
          return (
            <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' }, flexWrap: 'wrap' }}>
              <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list')}</Button>

              {(status === 'DRAFT' || status === 'REJECTED') && canSee(MENU, 'DRAFT/REJECTED', '계획 결재 상신', itemR) && (
                <Button variant="contained" color="info" sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}
                  onClick={async () => {
                    const ok = await showConfirm(t('permit.confirmPlanSubmit', '계획 결재를 상신하시겠습니까?'))
                    if (ok) transitionMutation.mutate({ id: selectedItem.id, action: 'submit' })
                  }}>{t('permit.planSubmit', '계획 결재 상신')}</Button>
              )}
              {(status === 'PENDING_APPROVAL' || status === 'REQUESTED') && canSee(MENU, 'PENDING_APPROVAL/REQUESTED', '계획 결재 반려', itemR) && (
                <Button variant="contained" color="warning" sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}
                  onClick={() => setRejectDialogStage('plan')}>
                  {t('permit.planReject', '계획 결재 반려')}
                </Button>
              )}
              {(status === 'PENDING_APPROVAL' || status === 'REQUESTED') && canSee(MENU, 'PENDING_APPROVAL/REQUESTED', '계획 결재 승인', itemR) && (
                <Button variant="contained" color="success" sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}
                  onClick={async () => {
                    const ok = await showConfirm(t('permit.confirmPlanApprove', '계획 결재를 승인하시겠습니까?'))
                    if (ok) transitionMutation.mutate({ id: selectedItem.id, action: 'approve' })
                  }}>{t('permit.planApprove', '계획 결재 승인')}</Button>
              )}
              {(status === 'DRAFT' || status === 'REJECTED') && canSee(MENU, 'DRAFT/REJECTED', '수정', itemR) && (
                <Button variant="contained" onClick={() => handleOpenEdit(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.edit')}</Button>
              )}
              {(status === 'DRAFT' || status === 'REJECTED') && canSee(MENU, 'DRAFT/REJECTED', '삭제', itemR) && (
                <Button variant="contained" color="error" onClick={() => handleDelete(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.delete')}</Button>
              )}
            </Box>
          )
        })()}

        {/* 결재 반려 사유 입력 다이얼로그 */}
        <RejectReasonDialog
          open={rejectDialogStage !== null}
          stage={rejectDialogStage === 'plan' ? t('permit.planReject', '계획 결재 반려') : rejectDialogStage === 'completion' ? t('permit.completionReject', '완료 결재 반려') : ''}
          onClose={() => setRejectDialogStage(null)}
          onConfirm={(reason) => {
            transitionMutation.mutate({ id: selectedItem.id, action: 'reject', rejectReason: reason })
            setRejectDialogStage(null)
          }}
          loading={transitionMutation.isPending}
        />
      </Box>
    )
  }

  // ==================== CREATE / EDIT VIEW ====================
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {!isExternalMode && (
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            {t('permit.myApplication', '작업 허가 신청')}
          </Typography>
        )}

        {/* Desktop form - table-style layout */}
        <Paper sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
          {/* Row: title */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>{t('ptw.title')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Box>
          </Box>
          {/* Row: type + risk */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>{t('ptw.type')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valSxBorder}>
              <Select fullWidth size="small" displayEmpty value={form.permitType} onChange={(e) => setForm({ ...form, permitType: e.target.value })}>
                <MenuItem value="" disabled>{t('ptw.selectType')}</MenuItem>
                {permitTypes.map((c) => <MenuItem key={c.code} value={c.code}>{getPermitTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
            <Typography sx={labelSx}>{t('ptw.riskLevel')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" displayEmpty value={form.riskLevel} onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}>
                <MenuItem value="" disabled>{t('ptw.selectRisk')}</MenuItem>
                {riskLevels.map((c) => <MenuItem key={c.code} value={c.code}>{getRiskLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          </Box>
          {/* Row: location + workers */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>{t('ptw.workLocation')}</Typography>
            <Box sx={valSxBorder}>
              <TextField fullWidth size="small" value={form.workLocation || ''} onChange={(e) => setForm({ ...form, workLocation: e.target.value })} />
            </Box>
            <Typography sx={labelSx}>{t('ptw.workersCount')}</Typography>
            <Box sx={valSx}>
              <NumberField fullWidth size="small" value={form.workersCount || 0} onChange={(v) => setForm({ ...form, workersCount: v ?? 0 })} />
            </Box>
          </Box>
          {/* Row: start date + end date */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>{t('ptw.startDate')}</Typography>
            <Box sx={valSxBorder}>
              <DatePickerField value={form.workStartDate?.substring(0, 10) || null} onChange={(v) => setForm({ ...form, workStartDate: v + 'T08:00:00' })} size="small" maxDate={form.workEndDate?.substring(0, 10)} />
            </Box>
            <Typography sx={labelSx}>{t('ptw.endDate')}</Typography>
            <Box sx={valSx}>
              <DatePickerField value={form.workEndDate?.substring(0, 10) || null} onChange={(v) => setForm({ ...form, workEndDate: v + 'T17:00:00' })} size="small" minDate={form.workStartDate?.substring(0, 10)} />
            </Box>
          </Box>
          {/* Row: description */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>{t('ptw.description')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" multiline rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Box>
          </Box>
          {/* Row: safety measures */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>{t('ptw.safetyMeasures')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" multiline rows={2} value={form.safetyMeasures || ''} onChange={(e) => setForm({ ...form, safetyMeasures: e.target.value })} /></Box>
          </Box>
          {/* Row: required PPE + hazard factors */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>{t('ptw.requiredPpe')}</Typography>
            <Box sx={valSxBorder}>
              <Select fullWidth size="small" multiple
                value={form.requiredPpe ? form.requiredPpe.split(', ').filter(Boolean) : []}
                onChange={(e) => setForm({ ...form, requiredPpe: (e.target.value as string[]).join(', ') })}
                input={<OutlinedInput />}
                renderValue={(selected) => (selected as string[]).join(', ')}>
                {ppeList.map(ppe => (
                  <MenuItem key={ppe.id} value={ppe.name}>
                    <Checkbox checked={(form.requiredPpe || '').split(', ').includes(ppe.name)} size="small" />
                    <ListItemText primary={ppe.name} secondary={ppe.category} />
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <Typography sx={labelSx}>{t('ptw.hazardFactors')}</Typography>
            <Box sx={valSx}>
              <TextField fullWidth size="small" value={form.hazardFactors || ''} onChange={(e) => setForm({ ...form, hazardFactors: e.target.value })} />
            </Box>
          </Box>
          {/* Row: emergency contact + notes */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>{t('ptw.emergencyContact')}</Typography>
            <Box sx={valSxBorder}>
              <TextField fullWidth size="small" value={form.emergencyContact || ''} onChange={(e) => setForm({ ...form, emergencyContact: fmtPhone(e.target.value) })} />
            </Box>
            <Typography sx={labelSx}>{t('ppe.notes')}</Typography>
            <Box sx={valSx}>
              <TextField fullWidth size="small" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Box>
          </Box>
          {/* Row: attachments */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>{t('common.attachments', '첨부파일')}</Typography>
            <Box sx={{ ...valSx, flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" size="small" component="label" startIcon={<AttachFileIcon />}>
                {t('common.selectFile', '파일 선택')}
                <input type="file" hidden multiple onChange={(e) => { if (e.target.files) setAttachFiles(prev => [...prev, ...Array.from(e.target.files!)]) }} />
              </Button>
              {existingFiles.filter(f => !deletedFileIds.includes(f.id)).map(f => (
                <Box key={f.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">{f.fileName}</Typography>
                  <IconButton size="small" onClick={() => setDeletedFileIds(prev => [...prev, f.id])} color="error"><DeleteIcon fontSize="small" /></IconButton>
                </Box>
              ))}
              {attachFiles.map((f, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="primary">{f.name}</Typography>
                  <IconButton size="small" onClick={() => setAttachFiles(prev => prev.filter((_, i) => i !== idx))} color="error"><DeleteIcon fontSize="small" /></IconButton>
                </Box>
              ))}
            </Box>
          </Box>
          {/* External worker rows */}
          {isExternalMode && (
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('permit.workerInfo', '작업자 정보')}</Typography>
              <Box sx={{ ...valSx, display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
                {workers.map((w, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
                    <TextField size="small" placeholder={t('permit.workerName', '성명')} value={w.workerName} onChange={(e) => { const nw = [...workers]; nw[idx] = { ...nw[idx], workerName: e.target.value }; setWorkers(nw) }} sx={{ flex: 1 }} />
                    <TextField select size="small" value={w.workerCompany || ''}
                      SelectProps={{ displayEmpty: true }}
                      onChange={(e) => { const nw = [...workers]; nw[idx] = { ...nw[idx], workerCompany: e.target.value }; setWorkers(nw) }}
                      sx={{ flex: 1 }}>
                      <MenuItem value="">{t('permit.workerCompany', '소속업체')}</MenuItem>
                      {contractorRegs.map(r => (
                        <MenuItem key={r.id} value={r.companyName}>{r.companyName}</MenuItem>
                      ))}
                    </TextField>
                    <TextField size="small" placeholder={t('permit.workerPhone', '연락처')} value={w.workerPhone} onChange={(e) => { const nw = [...workers]; nw[idx] = { ...nw[idx], workerPhone: fmtPhone(e.target.value) }; setWorkers(nw) }} inputProps={{ inputMode: 'numeric', maxLength: 13 }} sx={{ flex: 1 }} />
                    <IconButton size="small" onClick={() => setWorkers(prev => prev.filter((_, i) => i !== idx))} color="error"><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                ))}
                <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => setWorkers(prev => [...prev, { workerName: '', workerCompany: '', workerPhone: '' }])}>
                  {t('permit.addWorker', '작업자 추가')}
                </Button>
              </Box>
            </Box>
          )}
          {/* Row: checklist + inspector */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>{t('ptw.checklist', '체크리스트')}</Typography>
            <Box sx={valSxBorder}>
              <Select fullWidth size="small" displayEmpty value={form.checklistTemplateId || ''} onChange={(e) => setForm({ ...form, checklistTemplateId: e.target.value ? Number(e.target.value) : undefined })}>
                <MenuItem value="">{t('common.select', '선택하세요')}</MenuItem>
                {templates.filter(tmpl => tmpl.categoryType === 'WORK_PERMIT').map(tmpl => <MenuItem key={tmpl.id} value={tmpl.id}>{tmpl.templateName}</MenuItem>)}
              </Select>
            </Box>
            <Typography sx={labelSx}>{t('ptw.inspectorName', '점검자')}</Typography>
            <Box sx={{ ...valSx, display: 'flex', gap: 0 }}>
              <TextField fullWidth size="small" value={form.inspectorName || ''} InputProps={{ readOnly: true }} placeholder={t('ptw.selectInspector', '점검자 선택')} />
              <Button variant="outlined" size="small" sx={{ ml: 1, minWidth: 40 }} onClick={() => { setUserPickTarget('inspector'); setShowUserModal(true) }}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          {/* 계획 / 완료 결재자 선택 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>{t('common.planApprover', '계획 승인자')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={{ ...valSxBorder, display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField size="small" fullWidth InputProps={{ readOnly: true }}
                placeholder={t('common.selectFromOrg', '조직도에서 선택')}
                value={form.planApproverName || ''} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => { setUserPickTarget('planApprover'); setShowUserModal(true) }}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
            <Typography sx={labelSx}>{t('common.completionApprover', '완료 승인자')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={{ ...valSx, display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <TextField size="small" sx={{ flex: 1, minWidth: 0 }} InputProps={{ readOnly: true }}
                placeholder={t('common.selectFromOrg', '조직도에서 선택')}
                value={form.completionApproverName || ''} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => { setUserPickTarget('completionApprover'); setShowUserModal(true) }}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
        </Paper>
        {form.checklistTemplateId && (
          <Box sx={{ display: { xs: 'none', md: 'block' }, mt: 3 }}>
            <SafetyChecklistTab templateId={form.checklistTemplateId} embedded />
          </Box>
        )}

        {/* Mobile form */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('ptw.title')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('ptw.type')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <FormControl fullWidth size="small">
              <Select displayEmpty value={form.permitType} onChange={(e) => setForm({ ...form, permitType: e.target.value })}>
                <MenuItem value="" disabled>{t('ptw.selectType')}</MenuItem>
                {permitTypes.map((c) => <MenuItem key={c.code} value={c.code}>{getPermitTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('ptw.riskLevel')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <FormControl fullWidth size="small">
              <Select displayEmpty value={form.riskLevel} onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}>
                <MenuItem value="" disabled>{t('ptw.selectRisk')}</MenuItem>
                {riskLevels.map((c) => <MenuItem key={c.code} value={c.code}>{getRiskLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('ptw.workLocation')}
            </Typography>
            <TextField size="small" fullWidth value={form.workLocation || ''} onChange={(e) => setForm({ ...form, workLocation: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('ptw.workersCount')}
            </Typography>
            <NumberField size="small" fullWidth value={form.workersCount || 0} onChange={(v) => setForm({ ...form, workersCount: v ?? 0 })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('ptw.startDate')}
            </Typography>
            <DatePickerField value={form.workStartDate?.substring(0, 10) || null} onChange={(v) => setForm({ ...form, workStartDate: v + 'T08:00:00' })} size="small" maxDate={form.workEndDate?.substring(0, 10)} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('ptw.endDate')}
            </Typography>
            <DatePickerField value={form.workEndDate?.substring(0, 10) || null} onChange={(v) => setForm({ ...form, workEndDate: v + 'T17:00:00' })} size="small" minDate={form.workStartDate?.substring(0, 10)} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('ptw.description')}
            </Typography>
            <TextField size="small" fullWidth multiline rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('ptw.safetyMeasures')}
            </Typography>
            <TextField size="small" fullWidth multiline rows={2} value={form.safetyMeasures || ''} onChange={(e) => setForm({ ...form, safetyMeasures: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('ptw.requiredPpe')}
            </Typography>
            <Select fullWidth size="small" multiple
              value={form.requiredPpe ? form.requiredPpe.split(', ').filter(Boolean) : []}
              onChange={(e) => setForm({ ...form, requiredPpe: (e.target.value as string[]).join(', ') })}
              input={<OutlinedInput />}
              renderValue={(selected) => (selected as string[]).join(', ')}>
              {ppeList.map(ppe => (
                <MenuItem key={ppe.id} value={ppe.name}>
                  <Checkbox checked={(form.requiredPpe || '').split(', ').includes(ppe.name)} size="small" />
                  <ListItemText primary={ppe.name} secondary={ppe.category} />
                </MenuItem>
              ))}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('ptw.hazardFactors')}
            </Typography>
            <TextField size="small" fullWidth value={form.hazardFactors || ''} onChange={(e) => setForm({ ...form, hazardFactors: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('ptw.emergencyContact')}
            </Typography>
            <TextField size="small" fullWidth value={form.emergencyContact || ''} onChange={(e) => setForm({ ...form, emergencyContact: fmtPhone(e.target.value) })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('ppe.notes')}
            </Typography>
            <TextField size="small" fullWidth value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('common.attachments', '첨부파일')}
            </Typography>
            <Button variant="outlined" size="small" component="label" startIcon={<AttachFileIcon />}>
              {t('common.selectFile', '파일 선택')}
              <input type="file" hidden multiple onChange={(e) => { if (e.target.files) setAttachFiles(prev => [...prev, ...Array.from(e.target.files!)]) }} />
            </Button>
            {existingFiles.filter(f => !deletedFileIds.includes(f.id)).map(f => (
              <Box key={f.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="body2">{f.fileName}</Typography>
                <IconButton size="small" onClick={() => setDeletedFileIds(prev => [...prev, f.id])} color="error"><DeleteIcon fontSize="small" /></IconButton>
              </Box>
            ))}
            {attachFiles.map((f, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="body2" color="primary">{f.name}</Typography>
                <IconButton size="small" onClick={() => setAttachFiles(prev => prev.filter((_, i) => i !== idx))} color="error"><DeleteIcon fontSize="small" /></IconButton>
              </Box>
            ))}
          </Box>
          {/* External workers - mobile */}
          {isExternalMode && (
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('permit.workerInfo', '작업자 정보')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                {workers.map((w, idx) => (
                  <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1.5, border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
                    <TextField size="small" fullWidth placeholder={t('permit.workerName', '성명')} value={w.workerName} onChange={(e) => { const nw = [...workers]; nw[idx] = { ...nw[idx], workerName: e.target.value }; setWorkers(nw) }} />
                    <TextField select size="small" fullWidth value={w.workerCompany || ''}
                      SelectProps={{ displayEmpty: true }}
                      onChange={(e) => { const nw = [...workers]; nw[idx] = { ...nw[idx], workerCompany: e.target.value }; setWorkers(nw) }}>
                      <MenuItem value="">{t('permit.workerCompany', '소속업체')}</MenuItem>
                      {contractorRegs.map(r => (
                        <MenuItem key={r.id} value={r.companyName}>{r.companyName}</MenuItem>
                      ))}
                    </TextField>
                    <TextField size="small" fullWidth placeholder={t('permit.workerPhone', '연락처')} value={w.workerPhone} onChange={(e) => { const nw = [...workers]; nw[idx] = { ...nw[idx], workerPhone: fmtPhone(e.target.value) }; setWorkers(nw) }} inputProps={{ inputMode: 'numeric', maxLength: 13 }} />
                    <Button size="small" color="error" onClick={() => setWorkers(prev => prev.filter((_, i) => i !== idx))}>{t('common.delete')}</Button>
                  </Box>
                ))}
                <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => setWorkers(prev => [...prev, { workerName: '', workerCompany: '', workerPhone: '' }])}>
                  {t('permit.addWorker', '작업자 추가')}
                </Button>
              </Box>
            </Box>
          )}
          {/* Checklist + Inspector - mobile (맨 아래) */}
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('ptw.checklist', '체크리스트')}
            </Typography>
            <FormControl fullWidth size="small">
              <Select displayEmpty value={form.checklistTemplateId || ''} onChange={(e) => setForm({ ...form, checklistTemplateId: e.target.value ? Number(e.target.value) : undefined })}>
                <MenuItem value="">{t('common.select', '선택하세요')}</MenuItem>
                {templates.filter(tmpl => tmpl.categoryType === 'WORK_PERMIT').map(tmpl => <MenuItem key={tmpl.id} value={tmpl.id}>{tmpl.templateName}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('ptw.inspectorName', '점검자')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" fullWidth value={form.inspectorName || ''} InputProps={{ readOnly: true }} placeholder={t('ptw.selectInspector', '점검자 선택')} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowUserModal(true)}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          {form.checklistTemplateId && (
            <SafetyChecklistTab templateId={form.checklistTemplateId} embedded />
          )}
        </Box>

        {/* Save / Cancel buttons */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' }, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={() => viewMode === 'edit' ? setViewMode('detail') : handleBackToList()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save')}</Button>
        </Box>
        <UserSelectModal
          open={showUserModal}
          onClose={() => { setShowUserModal(false); setUserPickTarget(null) }}
          selectedUsers={[]}
          onConfirm={handleUserSelect}
          singleSelect
          useCompanyTree
          title={
            userPickTarget === 'planApprover' ? t('common.planApprover', '계획 승인자') + ' ' + t('common.select', '선택하세요')
            : userPickTarget === 'completionApprover' ? t('common.completionApprover', '완료 승인자') + ' ' + t('common.select', '선택하세요')
            : t('ptw.selectInspector', '점검자 선택')
          }
        />
      </Box>
    )
  }

  return null
}

// =============================================
// Tab 2: 작업 완료 후 점검 (Post-Work Inspection)
// =============================================
const PostWorkInspectionContent: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { getLabel: getPermitTypeLabel } = useCodeMap('PERMIT_TYPE')
  const { getLabel: getStatusLabel } = useCodeMap('PERMIT_STATUS')
  const { getLabel: getRiskLabel } = useCodeMap('RISK_LEVEL')

  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')
  const [selectedItem, setSelectedItem] = useState<PermitToWork | null>(null)
  const [page] = useState(0)
  const [templates, setTemplates] = useState<SafetyChecklistTemplate[]>([])
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

  const checklistRef = useRef<SafetyChecklistTabRef>(null)

  useEffect(() => {
    // 전체 템플릿 보존 — 스냅샷·다른 카테고리 템플릿도 이름 lookup 가능하도록.
    fetchSafetyTemplates().then(all => {
      setTemplates(all)
    }).catch(() => {})
  }, [])

  // Fetch APPROVED + COMPLETION_PENDING + DONE permits (모두 작업 완료 후 점검 탭 대상)
  const { data: approvedData } = useQuery({
    queryKey: ['ptwApproved', page],
    queryFn: () => permitToWorkApi.getByStatus('APPROVED', page, 50),
    enabled: viewMode === 'list',
  })
  const { data: completionPendingData } = useQuery({
    queryKey: ['ptwCompletionPending', page],
    queryFn: () => permitToWorkApi.getByStatus('COMPLETION_PENDING', page, 50),
    enabled: viewMode === 'list',
  })
  const { data: doneData } = useQuery({
    queryKey: ['ptwDone', page],
    queryFn: () => permitToWorkApi.getByStatus('DONE', page, 50),
    enabled: viewMode === 'list',
  })

  const allItems = [
    ...(approvedData?.content || []),
    ...(completionPendingData?.content || []),
    ...(doneData?.content || []),
  ].filter(item => item.checklistTemplateId)

  // 마스터 목록에 없는 templateId(=스냅샷)는 상세 조회로 이름 lookup
  const unknownTemplateIds = useMemo(() => {
    const all = new Set<number>()
    allItems.forEach(i => { if (i.checklistTemplateId) all.add(i.checklistTemplateId) })
    if (selectedItem?.checklistTemplateId) all.add(selectedItem.checklistTemplateId)
    return Array.from(all).filter(id => !templates.find(t => t.id === id))
  }, [allItems, selectedItem, templates])

  const snapshotQueries = useQueries({
    queries: unknownTemplateIds.map(id => ({
      queryKey: ['safetyTemplateDetail', id],
      queryFn: () => fetchSafetyTemplateDetail(id),
      staleTime: 60_000,
    })),
  })
  const snapshotNameMap = useMemo(() => {
    const m = new Map<number, string>()
    unknownTemplateIds.forEach((id, idx) => {
      const data = snapshotQueries[idx]?.data
      if (data?.templateName) m.set(id, data.templateName)
    })
    return m
  }, [unknownTemplateIds, snapshotQueries])

  const getTemplateName = (templateId?: number) => {
    if (!templateId) return ''
    const tmpl = templates.find(t => t.id === templateId)
    if (tmpl?.templateName) return tmpl.templateName
    const snap = snapshotNameMap.get(templateId)
    if (snap) return snap
    const stillLoading = snapshotQueries.some(q => q.isLoading)
    return stillLoading ? '' : (templates.length === 0 ? '' : t('common.deletedTemplate', '삭제된 체크리스트'))
  }

  const handleRowClick = (item: PermitToWork) => {
    setSelectedItem(item)
    setViewMode('detail')
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedItem(null)
  }

  const handleSaveChecklist = async () => {
    if (checklistRef.current) {
      await checklistRef.current.save()
      // Refresh permit data
      if (selectedItem) {
        try {
          const updated = await permitToWorkApi.getById(selectedItem.id)
          setSelectedItem(updated)
        } catch {}
      }
      queryClient.invalidateQueries({ queryKey: ['ptwApproved'] })
      queryClient.invalidateQueries({ queryKey: ['ptwCompletionPending'] })
      queryClient.invalidateQueries({ queryKey: ['ptwDone'] })
      showSuccess(t('common.saved'))
    }
  }

  const transitionMutation = useMutation({
    mutationFn: ({ id, action, rejectReason }: { id: number; action: 'completionSubmit' | 'complete' | 'reject'; rejectReason?: string }) =>
      permitToWorkApi.transition(id, action, rejectReason),
    onSuccess: async (updated) => {
      queryClient.invalidateQueries({ queryKey: ['ptwApproved'] })
      queryClient.invalidateQueries({ queryKey: ['ptwCompletionPending'] })
      queryClient.invalidateQueries({ queryKey: ['ptwDone'] })
      queryClient.invalidateQueries({ queryKey: ['ptw'] })
      showSuccess(t('common.saved'))
      if (updated?.status === 'COMPLETED' || updated?.status === 'DONE') {
        handleBackToList()
      } else {
        setSelectedItem(updated)
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || t('common.error')
      showError(msg)
    },
  })

  const handleCompletionSubmit = async () => {
    if (!selectedItem) return
    if (!checklistRef.current?.isAllChecked()) {
      showError(t('audit.allChecklistMustBeChecked', '모든 체크리스트 항목이 체크되어야 완료할 수 있습니다.'))
      return
    }
    const ok = await showConfirm(t('permit.confirmCompletionSubmit', '완료 결재를 상신하시겠습니까?'))
    if (!ok) return
    transitionMutation.mutate({ id: selectedItem.id, action: 'completionSubmit' })
  }

  const handleCompletionApprove = async () => {
    if (!selectedItem) return
    const ok = await showConfirm(t('permit.confirmCompletionApprove', '완료 결재를 승인하시겠습니까?'))
    if (!ok) return
    transitionMutation.mutate({ id: selectedItem.id, action: 'complete' })
  }

  // ========== LIST VIEW ==========
  if (viewMode === 'list') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>{t('permit.postWorkInspection', '작업 완료 후 점검')}</Typography>

        {allItems.length === 0
          ? <Alert severity="info" sx={{ m: 2 }}>{t('common.noData')}</Alert>
          : <>
            {/* PC Table */}
            <Paper sx={{ display: { xs: 'none', md: 'block' } }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={hSx}>{t('ptw.permitId')}</TableCell>
                      <TableCell sx={hSx}>{t('ptw.type')}</TableCell>
                      <TableCell sx={hSx}>{t('ptw.title')}</TableCell>
                      <TableCell sx={hSx}>{t('ptw.checklist', '체크리스트')}</TableCell>
                      <TableCell sx={hSx}>{t('ptw.riskLevel')}</TableCell>
                      <TableCell sx={hSx} align="center">{t('ptw.status')}</TableCell>
                      <TableCell sx={hSx} align="center">{t('ptw.checklistProgress', '점검 현황')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allItems.map((item) => (
                      <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.permitId}</TableCell>
                        <TableCell align="center">{getPermitTypeLabel(item.permitType)}</TableCell>
                        <TableCell><Typography variant="body2" fontWeight={600}>{item.title}</Typography></TableCell>
                        <TableCell align="center">{getTemplateName(item.checklistTemplateId)}</TableCell>
                        <TableCell align="center"><Chip label={getRiskLabel(item.riskLevel)} color={RISK_COLORS[item.riskLevel] || 'default'} size="small" /></TableCell>
                        <TableCell align="center"><Chip label={getStatusLabel(item.status)} color={STATUS_COLORS[item.status] || 'default'} variant="outlined" size="small" /></TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">{item.completedChecklist || 0}/{item.totalChecklist || 0}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Mobile Card List */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              {allItems.map((item) => (
                <Paper key={item.id} sx={{ p: 2, border: 1, borderColor: 'grey.300', cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography fontWeight="bold">{item.title}</Typography>
                    <Chip label={getStatusLabel(item.status)} color={STATUS_COLORS[item.status] || 'default'} variant="outlined" size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {getTemplateName(item.checklistTemplateId)} | {item.completedChecklist || 0}/{item.totalChecklist || 0}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </>
        }
      </Box>
    )
  }

  // ========== DETAIL VIEW with embedded checklist ==========
  if (viewMode === 'detail' && selectedItem) {
    const dLabelSx = { ...labelSx, width: 140, minWidth: 140 }
    const dValSx = { flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper' }
    const dValBorderSx = { ...dValSx, borderRight: 1, borderColor: 'grey.300' }
    const dRowSx = { display: 'flex', borderBottom: 1, borderColor: 'grey.300' }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>{t('permit.postWorkInspection', '작업 완료 후 점검')}</Typography>

        {/* Summary info */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
            <Box sx={dRowSx}><Typography sx={dLabelSx}>{t('ptw.permitId')}</Typography><Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.permitId}</Typography></Box><Typography sx={dLabelSx}>{t('ptw.status')}</Typography><Box sx={dValSx}><Chip label={getStatusLabel(selectedItem.status)} color={STATUS_COLORS[selectedItem.status] || 'default'} variant="outlined" size="small" /></Box></Box>
            <Box sx={dRowSx}><Typography sx={dLabelSx}>{t('ptw.title')}</Typography><Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.title}</Typography></Box><Typography sx={dLabelSx}>{t('ptw.inspectorName', '점검자')}</Typography><Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.inspectorName || ''}</Typography></Box></Box>
            <Box sx={{ display: 'flex' }}><Typography sx={dLabelSx}>{t('ptw.checklist', '체크리스트')}</Typography><Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{getTemplateName(selectedItem.checklistTemplateId)}</Typography></Box><Typography sx={dLabelSx}>{t('ptw.checklistProgress', '점검 현황')}</Typography><Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.completedChecklist || 0}/{selectedItem.totalChecklist || 0}</Typography></Box></Box>
          </Box>
          {/* Mobile */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
            {[
              [t('ptw.permitId'), selectedItem.permitId],
              [t('ptw.title'), selectedItem.title],
              [t('ptw.status'), getStatusLabel(selectedItem.status)],
              [t('ptw.inspectorName', '점검자'), selectedItem.inspectorName],
              [t('ptw.checklist', '체크리스트'), getTemplateName(selectedItem.checklistTemplateId)],
              [t('ptw.checklistProgress', '점검 현황'), `${selectedItem.completedChecklist || 0}/${selectedItem.totalChecklist || 0}`],
            ].filter(([, v]) => v).map(([label, value], i) => (
              <Box key={i}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{value}</Typography>
              </Box>
            ))}
          </Box>

        {/* Embedded checklist with showSummary */}
        {selectedItem.checklistTemplateId && (
          <Box sx={{ mb: 3 }}>
            <SafetyChecklistTab ref={checklistRef} templateId={selectedItem.checklistTemplateId} embedded showSummary />
          </Box>
        )}

        {/* 반려 사유 표시 (반려 후 다시 점검 단계로 돌아온 경우) */}
        {selectedItem.rejectReason && selectedItem.status === 'APPROVED' && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'error.lighter', border: 1, borderColor: 'error.light', borderRadius: 1 }}>
            <Typography variant="body2" color="error.main" fontWeight="bold" sx={{ mb: 0.5 }}>
              {t('common.rejectReasonTitle', '반려 사유')}
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedItem.rejectReason}</Typography>
          </Box>
        )}

        {/* Buttons — 완료 결재 흐름 */}
        {(() => {
          const status = selectedItem.status
          const normalizeName = (s?: string | null) => (s || '').trim()
          const isCompletionApprover = !!user && (
            (!!selectedItem.completionApproverUserId && selectedItem.completionApproverUserId === user.id) ||
            (!!selectedItem.completionApproverName && normalizeName(selectedItem.completionApproverName) === normalizeName(user.name))
          )
          const isAdminRole = user?.role === 'SYSTEM_ADMIN'
          const noCompletionApproverAssigned = !selectedItem.completionApproverUserId && !normalizeName(selectedItem.completionApproverName)
          const canApproveCompletion = isAdminRole || isCompletionApprover || noCompletionApproverAssigned
          return (
            <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' }, flexWrap: 'wrap' }}>
              <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list')}</Button>

              {/* APPROVED → 체크리스트 저장 / 완료 결재 상신 */}
              {status === 'APPROVED' && (
                <>
                  <Button variant="contained" onClick={handleSaveChecklist} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save')}</Button>
                  <Button variant="contained" color="info" onClick={handleCompletionSubmit} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
                    {t('permit.completionSubmit', '완료 결재 상신')}
                  </Button>
                </>
              )}

              {/* COMPLETION_PENDING → 완료 결재 반려 / 완료 결재 승인 */}
              {status === 'COMPLETION_PENDING' && canApproveCompletion && (
                <>
                  <Button variant="contained" color="warning" sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}
                    onClick={() => setRejectDialogOpen(true)}>
                    {t('permit.completionReject', '완료 결재 반려')}
                  </Button>
                  <Button variant="contained" color="success" sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}
                    onClick={handleCompletionApprove}>
                    {t('permit.completionApprove', '완료 결재 승인')}
                  </Button>
                </>
              )}
            </Box>
          )
        })()}

        {/* 완료 결재 반려 사유 입력 다이얼로그 */}
        <RejectReasonDialog
          open={rejectDialogOpen}
          stage={t('permit.completionReject', '완료 결재 반려')}
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

  return null
}

// =============================================
// Tab 4: 관리자 (Admin) - reuses original PermitToWorkContent with mode="all"
// =============================================
const AdminContent: React.FC = () => {
  return <PermitApplicationContent mode="all" />
}

// =============================================
// Main Page with 4 Tabs
// =============================================
const PermitToWorkPage: React.FC = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(0)

  return (
    <Box>
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2, '& .MuiTab-root': { minWidth: 'auto', px: 2, fontSize: '0.85rem' } }}
      >
        <Tab label={t('common.dashboard', '대시보드')} />
        <Tab label={t('permit.myApplication', '작업 허가 신청')} />
        <Tab label={t('permit.postWorkInspection', '작업 완료 후 점검')} />
        <Tab label={t('permit.admin', '관리자')} />
        <Tab label={t('common.report', '레포트')} />
      </Tabs>
      {activeTab === 0 && <PermitDashboardTab />}
      {activeTab === 1 && <PermitApplicationContent mode="my" />}
      {activeTab === 2 && <PostWorkInspectionContent />}
      {activeTab === 3 && <AdminContent />}
      {activeTab === 4 && <PermitReportTab />}
    </Box>
  )
}

export default PermitToWorkPage
