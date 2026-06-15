import { formatUserName } from '../utils/userDisplay'
import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, Select, MenuItem,
  FormControl, Chip, Pagination, CircularProgress, Alert, Tabs, Tab,
  Checkbox, ListItemText, OutlinedInput, Radio,
} from '@mui/material'
import ListSearchBar from '../components/common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import DeleteIcon from '@mui/icons-material/Delete'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import IconButton from '@mui/material/IconButton'
import DatePickerField from '../components/common/DatePickerField'
import { fmtPhone } from '../utils/phoneFormat'
import { todayStr, weekFromTodayStr, formatDate, formatDateTime } from '../utils/dateDefaults'
import { contractorRegistrationApi } from '../api/contractorRegistrationApi'
import NumberField from '../components/common/NumberField'
import { useAlert } from '../contexts/AlertContext'
import { useAuth } from '../context/AuthContext'
import { useButtonRules } from '../hooks/useButtonRules'
import { fetchTeamLeader } from '../api/approvalApi'
import { contractorPlanApi } from '../api/contractorApi'
import { ContractorPlan, ContractorPlanRequest, ContractorWorker } from '../types/contractor.types'
import { ppeEquipmentApi } from '../api/ppeEquipmentApi'
import { PpeEquipment } from '../types/ppeEquipment.types'
import { fetchSafetyTemplates } from '../api/safetyChecklistApi'
import type { SafetyChecklistTemplate } from '../types/safetyChecklist.types'
import UserSelectModal, { UserInfo } from '../components/common/UserSelectModal'
import DeptUserMultiSelectModal from '../components/common/DeptUserMultiSelectModal'
import useCodeMap from '../hooks/useCodeMap'
import SafetyChecklistTab, { SafetyChecklistTabRef } from '../components/ehs/SafetyChecklistTab'
import ContractorReportTab from '../components/contractor/ContractorReportTab'
import ContractorDashboardTab from '../components/contractor/ContractorDashboardTab'
import RejectReasonDialog from '../components/common/RejectReasonDialog'
import DevTestFillButton from '../components/common/DevTestFillButton'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  DRAFT: 'default', PENDING: 'warning', REQUESTED: 'info',
  PENDING_APPROVAL: 'warning', APPROVED: 'info',
  COMPLETION_PENDING: 'warning', DONE: 'success',
  COMPLETED: 'success', REJECTED: 'error', CANCELLED: 'default',
}

const RISK_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  LOW: 'success', MEDIUM: 'warning', HIGH: 'error', CRITICAL: 'error',
}

// Style constants
const labelSx = {
  width: 128, minWidth: 128, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center',
}
const valSx = { flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem' }
const valSxBorder = { ...valSx, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }
const hSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

// =============================================
// Tab content component (shared by all 3 tabs)
// =============================================
const ContractorPlanContent: React.FC<{ mode: 'plan' | 'approval' | 'admin' }> = ({ mode }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showWarning, showConfirm } = useAlert()
  const { codeList: permitTypes, getLabel: getPermitTypeLabel } = useCodeMap('PERMIT_TYPE')
  const { codeList: permitStatuses, getLabel: getStatusLabel } = useCodeMap('PERMIT_STATUS')
  const { codeList: riskLevels, getLabel: getRiskLabel } = useCodeMap('RISK_LEVEL')

  const { canSee } = useButtonRules()
  const checklistRef = useRef<SafetyChecklistTabRef>(null)
  const isApprovalMode = mode === 'approval'
  const isAdminMode = mode === 'admin'
  const canApprove = user?.role === 'SYSTEM_ADMIN' || user?.role === 'AUDIT_ADMIN'
  const MENU = mode === 'plan'
    ? '협력 업체 관리 › 협력 업체 위험성 평가 › 계획'
    : mode === 'approval'
    ? '협력 업체 관리 › 협력 업체 위험성 평가 › 평가서조회 담당승인자'
    : '협력 업체 관리 › 협력 업체 위험성 평가 › 전체조회 (어드민)'
  const myRoles: string[] = ['guest', ...(user?.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : [user?.role ?? ''].filter(Boolean))]

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<ContractorPlan | null>(null)

  // List filters
  const [page, setPage] = useState(0)
  const [searchTextInput, setSearchTextInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const applySearch = () => setSearchText(searchTextInput)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Form state
  const [form, setForm] = useState<ContractorPlanRequest>({ title: '' })
  // 결재 반려 사유 입력 다이얼로그 (계획/완료 단계 구분)
  const [rejectDialogStage, setRejectDialogStage] = useState<'plan' | 'completion' | null>(null)

  // Checklist templates
  const [templates, setTemplates] = useState<SafetyChecklistTemplate[]>([])
  // 어떤 승인자(계획/완료)를 픽 중인지
  const [approverPickTarget, setApproverPickTarget] = useState<'plan' | 'completion' | null>(null)

  // PPE inventory list for multi-select
  const [ppeList, setPpeList] = useState<PpeEquipment[]>([])

  // Workers
  const [workers, setWorkers] = useState<Array<{ workerName: string; companyName: string; workerPhone: string }>>([])
  const [showWorkerUserModal, setShowWorkerUserModal] = useState(false)

  useEffect(() => {
    // 전체 체크리스트 템플릿 조회 — 드롭다운은 CONTRACTOR 만 노출하지만,
    // 기존 계획에 연결된 템플릿이 다른 카테고리거나 삭제된 경우에도 lookup 이 가능하도록
    // 전체 목록을 그대로 보관 (#templateId 가 그대로 노출되는 문제 방지)
    fetchSafetyTemplates().then(all => {
      setTemplates(all)
    }).catch(() => {})
    ppeEquipmentApi.getAll(0, 200).then(res => {
      setPpeList(res.content || [])
    }).catch(() => {})
  }, [])

  // Release edit lock on browser close / tab close while in approval-mode detail
  useEffect(() => {
    if (!isApprovalMode || !selectedItem?.id || viewMode !== 'detail') return
    const planId = selectedItem.id
    const handleUnload = () => {
      contractorPlanApi.releaseEditLock(planId).catch(() => {})
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => {
      window.removeEventListener('beforeunload', handleUnload)
      contractorPlanApi.releaseEditLock(planId).catch(() => {})
    }
  }, [isApprovalMode, selectedItem?.id, viewMode])

  // Query
  const queryKey = isApprovalMode
    ? ['contractorApproval', page]
    : searchText ? ['contractorSearch', searchText, page]
    : statusFilter ? ['contractorStatus', statusFilter, page]
    : typeFilter ? ['contractorType', typeFilter, page]
    : ['contractor', page]

  const queryFn = () => {
    // 관리(승인) 모드는 APPROVED / COMPLETION_PENDING / DONE 항목을 모두 보여줘야 하므로 클라이언트 필터링
    if (isApprovalMode) return contractorPlanApi.getAll(page, 100)
    if (statusFilter) return contractorPlanApi.getByStatus(statusFilter, page, 10)
    return contractorPlanApi.getAll(page, 10)
  }

  const { data, isLoading } = useQuery({ queryKey, queryFn, enabled: viewMode === 'list' })

  // 등록된 협력업체 (작업자 소속업체 셀렉박스용)
  const { data: contractorRegPage } = useQuery({
    queryKey: ['contractorRegistrationsForRiskWorker'],
    queryFn: () => contractorRegistrationApi.search({ regStatus: 'APPROVED', size: 200 }),
    staleTime: 1000 * 60 * 5,
  })
  const contractorRegs = contractorRegPage?.content || []

  // Detail workers query (must be at top level, not inside conditional)
  const { data: detailWorkers } = useQuery({
    queryKey: ['contractorWorkers', selectedItem?.id],
    queryFn: () => contractorPlanApi.getWorkers(selectedItem!.id),
    enabled: !!selectedItem?.id && viewMode === 'detail',
  })

  const createMutation = useMutation({
    mutationFn: (req: ContractorPlanRequest) => contractorPlanApi.create(req),
    onSuccess: async (created) => {
      // Save workers
      if (created?.id && workers.length > 0) {
        for (const w of workers) {
          await contractorPlanApi.addWorker(created.id, { workerName: w.workerName, companyName: w.companyName, workerPhone: w.workerPhone })
        }
      }
      queryClient.invalidateQueries({ queryKey: ['contractor'] })
      queryClient.invalidateQueries({ queryKey: ['contractorApproval'] })
      showSuccess(t('common.saved'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: number; req: ContractorPlanRequest }) => contractorPlanApi.update(id, req),
    onSuccess: async (updated) => {
      // Save workers (delete old + re-add)
      if (updated?.id && workers.length > 0) {
        await contractorPlanApi.deleteWorkers(updated.id)
        for (const w of workers) {
          await contractorPlanApi.addWorker(updated.id, { workerName: w.workerName, companyName: w.companyName, workerPhone: w.workerPhone })
        }
      }
      queryClient.invalidateQueries({ queryKey: ['contractor'] })
      queryClient.invalidateQueries({ queryKey: ['contractorApproval'] })
      showSuccess(t('common.saved'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const transitionMutation = useMutation({
    mutationFn: ({ id, action, rejectReason }: { id: number; action: 'submit' | 'approve' | 'reject' | 'completionSubmit' | 'complete'; rejectReason?: string }) =>
      contractorPlanApi.transition(id, action, rejectReason),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['contractor'] })
      queryClient.invalidateQueries({ queryKey: ['contractorApproval'] })
      setSelectedItem(updated)
      showSuccess(t('common.saved'))
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message
      showError(msg || t('common.error'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => contractorPlanApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor'] })
      queryClient.invalidateQueries({ queryKey: ['contractorApproval'] })
      showSuccess(t('common.deleted'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  // Handlers
  const handleBackToList = () => {
    if (isApprovalMode && selectedItem?.id) {
      contractorPlanApi.releaseEditLock(selectedItem.id).catch(() => {})
    }
    setViewMode('list')
    setSelectedItem(null)
    setForm({ title: '' })
    setWorkers([])
  }

  const handleRowClick = async (item: ContractorPlan) => {
    if (isApprovalMode) {
      try {
        const result = await contractorPlanApi.acquireEditLock(item.id)
        if (!result.acquired) {
          showWarning(`${result.currentEditor || '다른 사용자'}가 편집중입니다.`)
          return
        }
      } catch {
        showError(t('contractorManagementPage.msg1', '편집 잠금 확인에 실패했습니다.'))
        return
      }
    }
    setSelectedItem(item)
    setViewMode('detail')
  }

  const handleOpenCreate = async () => {
    setSelectedItem(null)
    const leader = await fetchTeamLeader(user?.deptCode)
    setForm({
      title: '',
      workStartDate: todayStr() + 'T08:00:00',
      workEndDate: weekFromTodayStr() + 'T17:00:00',
      ...(leader ? {
        planApproverName: leader.name, planApproverPosition: leader.position, planApproverTeam: leader.team,
        completionApproverName: leader.name, completionApproverPosition: leader.position, completionApproverTeam: leader.team,
      } : {}),
    })
    setWorkers([])
    setViewMode('create')
  }

  const handleOpenEdit = async (item: ContractorPlan) => {
    setSelectedItem(item)
    setForm({
      title: item.title, workType: item.workType, riskLevel: item.riskLevel,
      workLocation: item.workLocation, workersCount: item.workersCount,
      workStartDate: item.workStartDate, workEndDate: item.workEndDate,
      workDescription: item.workDescription, safetyMeasures: item.safetyMeasures,
      requiredPpe: item.requiredPpe, hazardFactors: item.hazardFactors,
      emergencyContact: item.emergencyContact, notes: item.notes,
      checklistTemplateId: item.checklistTemplateId, approverName: item.approverName,
      planApproverUserId: item.planApproverUserId,
      planApproverTeam: item.planApproverTeam || '',
      planApproverPosition: item.planApproverPosition || '',
      planApproverName: item.planApproverName || '',
      completionApproverUserId: item.completionApproverUserId,
      completionApproverTeam: item.completionApproverTeam || '',
      completionApproverPosition: item.completionApproverPosition || '',
      completionApproverName: item.completionApproverName || '',
      repeatType: item.repeatType, repeatInterval: item.repeatInterval, repeatDays: item.repeatDays,
    })
    // Load workers
    if (item.id) {
      try {
        const existingWorkers = await contractorPlanApi.getWorkers(item.id)
        setWorkers((existingWorkers || []).map((w: ContractorWorker) => ({ workerName: w.workerName, companyName: w.companyName || '', workerPhone: w.workerPhone || '' })))
      } catch { setWorkers([]) }
    }
    setViewMode('edit')
  }

  const handleSave = () => {
    if (!form.checklistTemplateId) {
      showError(t('common.checklist', '체크리스트') + ' ' + t('common.required', '필수입니다'))
      return
    }
    if (selectedItem) updateMutation.mutate({ id: selectedItem.id, req: form })
    else createMutation.mutate(form)
  }

  const handleDelete = async (item: ContractorPlan) => {
    const ok = await showConfirm(t('common.confirmDelete', '정말로 삭제하시겠습니까?'))
    if (ok) deleteMutation.mutate(item.id)
  }

  // DEV ONLY — 비어있는 항목을 협력업체 위험성평가 더미데이터로 채움 (입력값 보존)
  // 승인자(사람 선택)·작업자·보호구/체크리스트(재고·템플릿 종속 드롭다운)는 채우지 않는다.
  const fillTestData = () => setForm(prev => ({
    ...prev,
    title: prev.title || '배관 용접 작업 위험성평가',
    workType: prev.workType || permitTypes[0]?.code || '',
    riskLevel: prev.riskLevel || riskLevels[0]?.code || '',
    workLocation: prev.workLocation || '제2공장 옥외 배관 구역',
    workersCount: prev.workersCount ?? 4,
    workDescription: prev.workDescription || '노후 배관 절단 및 신규 배관 용접 작업',
    safetyMeasures: prev.safetyMeasures || '화기작업 허가, 소화기 비치, 감시자 배치, 환기 실시',
    hazardFactors: prev.hazardFactors || '화재·폭발, 유해가스 흡입, 화상',
    emergencyContact: prev.emergencyContact || '010-1234-5678',
    notes: prev.notes || '작업 전 안전교육 실시 (테스트 데이터)',
  }))

  const handleUserSelect = (users: UserInfo[]) => {
    if (users.length > 0 && approverPickTarget) {
      const u = users[0]
      if (approverPickTarget === 'plan') {
        setForm(f => ({
          ...f,
          planApproverUserId: u.id,
          planApproverTeam: u.department || '',
          planApproverName: u.name,
        }))
      } else {
        setForm(f => ({
          ...f,
          completionApproverUserId: u.id,
          completionApproverTeam: u.department || '',
          completionApproverName: u.name,
        }))
      }
    }
    setApproverPickTarget(null)
  }

  const handleWorkerUserSelect = (users: UserInfo[]) => {
    if (users.length > 0) {
      setWorkers(prev => {
        const existingNames = new Set(prev.map(w => w.workerName))
        const newWorkers = users
          .filter(u => !existingNames.has(u.name || ''))
          .map(u => ({
            workerName: u.name || '',
            companyName: u.company || u.department || '',
            workerPhone: (u as any).phone || (u as any).workerPhone || '',
          }))
        return [...prev, ...newWorkers]
      })
    }
    setShowWorkerUserModal(false)
  }

  const getTemplateName = (templateId?: number) => {
    if (!templateId) return ''
    const tmpl = templates.find(t => t.id === templateId)
    // 템플릿이 삭제됐거나 아직 로드 전이면 raw id 대신 안전한 메시지 노출
    return tmpl?.templateName || (templates.length === 0 ? '' : t('common.deletedTemplate', '삭제된 체크리스트'))
  }

  // Filter items client-side for search/type when API doesn't support it
  let items = data?.content || []
  // 관리(승인) 모드는 결재 진행/완료 단계만 노출
  if (isApprovalMode) {
    const allowed = new Set(['APPROVED', 'COMPLETION_PENDING', 'DONE'])
    items = items.filter(item => allowed.has(item.status))
  }
  if (searchText) {
    const lower = searchText.toLowerCase()
    items = items.filter(item =>
      item.title?.toLowerCase().includes(lower) ||
      item.planId?.toLowerCase().includes(lower) ||
      item.workLocation?.toLowerCase().includes(lower)
    )
  }
  if (typeFilter) {
    items = items.filter(item => item.workType === typeFilter)
  }
  const totalPages = data?.totalPages || 0

  const tabTitle = isApprovalMode ? '평가서조회 담당승인자'
    : isAdminMode ? '전체조회 (어드민)'
    : '계획'

  // ==================== LIST VIEW ====================
  if (viewMode === 'list') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>{tabTitle}</Typography>

        {/* Search / Filter bar - PC */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ListSearchBar placeholder="검색 (제목/ID/위치)" value={searchTextInput} onChange={setSearchTextInput} onSearch={applySearch} />
            {!isApprovalMode && (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); setSearchText(''); setTypeFilter('') }}>
                  <MenuItem value="">{t('ptw.allStatus')}</MenuItem>
                  {permitStatuses.map((c) => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select displayEmpty value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); setSearchText(''); setStatusFilter('') }}>
                <MenuItem value="">{t('ptw.allTypes')}</MenuItem>
                {permitTypes.map((c) => <MenuItem key={c.code} value={c.code}>{getPermitTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <IconButton onClick={() => { setSearchText(''); setStatusFilter(''); setTypeFilter(''); setPage(0) }} size="small"><RefreshIcon /></IconButton>
          </Box>
          {!isApprovalMode && canSee(MENU, 'LIST', '신규 등록', myRoles) && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>New</Button>
          )}
        </Box>
        {/* Search / Filter bar - Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <ListSearchBar fullWidth placeholder="검색 (제목/ID/위치)" value={searchTextInput} onChange={setSearchTextInput} onSearch={applySearch} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!isApprovalMode && (
              <FormControl size="small" sx={{ flex: 1 }}>
                <Select displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); setSearchText(''); setTypeFilter('') }}>
                  <MenuItem value="">{t('ptw.allStatus')}</MenuItem>
                  {permitStatuses.map((c) => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select displayEmpty value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); setSearchText(''); setStatusFilter('') }}>
                <MenuItem value="">{t('ptw.allTypes')}</MenuItem>
                {permitTypes.map((c) => <MenuItem key={c.code} value={c.code}>{getPermitTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            {!isApprovalMode && canSee(MENU, 'LIST', '신규 등록', myRoles) && (
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
                    <TableCell sx={hSx}>ID</TableCell>
                    <TableCell sx={hSx}>작업유형</TableCell>
                    <TableCell sx={hSx}>제목</TableCell>
                    <TableCell sx={hSx}>위험등급</TableCell>
                    <TableCell sx={hSx}>작업기간</TableCell>
                    <TableCell sx={hSx}>계획 승인자</TableCell>
                    <TableCell sx={hSx} align="center">상태</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                      <TableCell align="center">{item.planId}</TableCell>
                      <TableCell align="center">{getPermitTypeLabel(item.workType || '')}</TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>{item.title}</Typography></TableCell>
                      <TableCell align="center"><Chip label={getRiskLabel(item.riskLevel || '')} color={RISK_COLORS[item.riskLevel || ''] || 'default'} size="small" /></TableCell>
                      <TableCell align="center">
                        {formatDate(item.workStartDate) || ''} ~ {formatDate(item.workEndDate) || ''}
                      </TableCell>
                      <TableCell align="center">{item.planApproverName || item.approverName || ''}</TableCell>
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
              <Paper key={item.id} sx={{ p: 2, border: 1, borderColor: 'divider', cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography fontWeight="bold">{item.title}</Typography>
                  <Chip label={getStatusLabel(item.status)} color={STATUS_COLORS[item.status] || 'default'} variant="outlined" size="small" />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {getPermitTypeLabel(item.workType || '')} | {item.planApproverName || item.approverName || ''}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(item.workStartDate) || ''} ~ {formatDate(item.workEndDate) || ''}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                  <Chip label={getRiskLabel(item.riskLevel || '')} color={RISK_COLORS[item.riskLevel || ''] || 'default'} size="small" />
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
    const dValBorderSx = { ...dValSx, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }
    const dRowSx = { display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>{tabTitle}</Typography>

        {/* PC 2-column */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
          <Box sx={dRowSx}><Typography sx={dLabelSx}>ID</Typography><Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.planId}</Typography></Box><Typography sx={dLabelSx}>상태</Typography><Box sx={dValSx}><Chip label={getStatusLabel(selectedItem.status)} color={STATUS_COLORS[selectedItem.status] || 'default'} variant="outlined" size="small" /></Box></Box>
          <Box sx={dRowSx}><Typography sx={dLabelSx}>제목</Typography><Box sx={{ ...dValSx, borderBottom: 0 }}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.title}</Typography></Box></Box>
          <Box sx={dRowSx}><Typography sx={dLabelSx}>작업유형</Typography><Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{getPermitTypeLabel(selectedItem.workType || '')}</Typography></Box><Typography sx={dLabelSx}>위험등급</Typography><Box sx={dValSx}><Chip label={getRiskLabel(selectedItem.riskLevel || '')} color={RISK_COLORS[selectedItem.riskLevel || ''] || 'default'} size="small" /></Box></Box>
          <Box sx={dRowSx}><Typography sx={dLabelSx}>작업장소</Typography><Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.workLocation || ''}</Typography></Box><Typography sx={dLabelSx}>작업인원</Typography><Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.workersCount || 0}명</Typography></Box></Box>
          <Box sx={dRowSx}><Typography sx={dLabelSx}>시작일</Typography><Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{formatDateTime(selectedItem.workStartDate) || ''}</Typography></Box><Typography sx={dLabelSx}>종료일</Typography><Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5 }}>{formatDateTime(selectedItem.workEndDate) || ''}</Typography></Box></Box>
          {selectedItem.workDescription && <Box sx={dRowSx}><Typography sx={dLabelSx}>작업내용</Typography><Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5, whiteSpace: 'pre-wrap' }}>{selectedItem.workDescription}</Typography></Box></Box>}
          {selectedItem.safetyMeasures && <Box sx={dRowSx}><Typography sx={dLabelSx}>안전조치</Typography><Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5, whiteSpace: 'pre-wrap' }}>{selectedItem.safetyMeasures}</Typography></Box></Box>}
          <Box sx={dRowSx}><Typography sx={dLabelSx}>보호구</Typography><Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.requiredPpe || ''}</Typography></Box><Typography sx={dLabelSx}>위험요인</Typography><Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.hazardFactors || ''}</Typography></Box></Box>
          <Box sx={dRowSx}><Typography sx={dLabelSx}>비상연락처</Typography><Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.emergencyContact || ''}</Typography></Box><Typography sx={dLabelSx}>비고</Typography><Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5, whiteSpace: 'pre-wrap' }}>{selectedItem.notes || ''}</Typography></Box></Box>
          <Box sx={dRowSx}><Typography sx={dLabelSx}>일정 반복</Typography><Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5 }}>{!selectedItem.repeatType || selectedItem.repeatType === 'NONE' ? '반복 안 함' : selectedItem.repeatType === 'WEEKDAYS' ? (selectedItem.repeatDays || '').split(',').map((d: string) => ({MON:'월',TUE:'화',WED:'수',THU:'목',FRI:'금',SAT:'토',SUN:'일'}[d] || d)).join(', ') : `${selectedItem.repeatInterval || 1} ${selectedItem.repeatType === 'DAILY' ? '일' : selectedItem.repeatType === 'WEEKLY' ? '주' : '개월'}마다`}</Typography></Box></Box>
          {/* 작성자 / 작성일자 — 계획 승인자 위 */}
          <Box sx={dRowSx}>
            <Typography sx={dLabelSx}>작성자</Typography>
            <Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{formatUserName(selectedItem.createdByTeam, selectedItem.createdByName, selectedItem.createdByPosition)}</Typography></Box>
            <Typography sx={dLabelSx}>작성일자</Typography>
            <Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5, fontFamily: 'monospace' }}>{formatDateTime(selectedItem.createdAt) || ''}</Typography></Box>
          </Box>
          {/* 수정자 / 수정일자 — 수정 이력 있을 때만 */}
          {selectedItem.modifiedAt && selectedItem.modifiedAt !== selectedItem.createdAt && (
            <Box sx={dRowSx}>
              <Typography sx={dLabelSx}>수정자</Typography>
              <Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{formatUserName(selectedItem.modifiedByTeam, selectedItem.modifiedByName, selectedItem.modifiedByPosition)}</Typography></Box>
              <Typography sx={dLabelSx}>수정일자</Typography>
              <Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5, fontFamily: 'monospace' }}>{formatDateTime(selectedItem.modifiedAt)}</Typography></Box>
            </Box>
          )}
          <Box sx={dRowSx}><Typography sx={dLabelSx}>계획 승인자</Typography><Box sx={dValBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{formatUserName(selectedItem.planApproverTeam, selectedItem.planApproverName, selectedItem.planApproverPosition) || ''}{selectedItem.planApprovedAt && <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>({selectedItem.planApprovedBy} | {selectedItem.planApprovedAt.replace('T', ' ').substring(0, 19)})</Typography>}</Typography></Box><Typography sx={dLabelSx}>완료 승인자</Typography><Box sx={dValSx}><Typography variant="body2" sx={{ py: 0.5 }}>{formatUserName(selectedItem.completionApproverTeam, selectedItem.completionApproverName, selectedItem.completionApproverPosition) || ''}{selectedItem.completionApprovedAt && <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>({selectedItem.completionApprovedBy} | {selectedItem.completionApprovedAt.replace('T', ' ').substring(0, 19)})</Typography>}</Typography></Box></Box>
          <Box sx={dRowSx}><Typography sx={dLabelSx}>체크리스트</Typography><Box sx={{ ...dValSx, flex: 3 }}><Typography variant="body2" sx={{ py: 0.5 }}>{getTemplateName(selectedItem.checklistTemplateId)}</Typography></Box></Box>
        </Box>

        {/* Mobile 1-column */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
          {[
            ['ID', selectedItem.planId],
            ['상태', getStatusLabel(selectedItem.status)],
            ['제목', selectedItem.title],
            ['작업유형', getPermitTypeLabel(selectedItem.workType || '')],
            ['위험등급', getRiskLabel(selectedItem.riskLevel || '')],
            ['작업장소', selectedItem.workLocation],
            ['작업인원', `${selectedItem.workersCount || 0}명`],
            ['시작일', formatDateTime(selectedItem.workStartDate)],
            ['종료일', formatDateTime(selectedItem.workEndDate)],
            ['작업내용', selectedItem.workDescription],
            ['안전조치', selectedItem.safetyMeasures],
            ['보호구', selectedItem.requiredPpe],
            ['위험요인', selectedItem.hazardFactors],
            ['비상연락처', selectedItem.emergencyContact],
            ['비고', selectedItem.notes],
            ['일정 반복', !selectedItem.repeatType || selectedItem.repeatType === 'NONE' ? '반복 안 함' : selectedItem.repeatType === 'WEEKDAYS' ? (selectedItem.repeatDays || '').split(',').map((d: string) => ({MON:'월',TUE:'화',WED:'수',THU:'목',FRI:'금',SAT:'토',SUN:'일'}[d] || d)).join(', ') : `${selectedItem.repeatInterval || 1} ${selectedItem.repeatType === 'DAILY' ? '일' : selectedItem.repeatType === 'WEEKLY' ? '주' : '개월'}마다`],
            ['작성자', formatUserName(selectedItem.createdByTeam, selectedItem.createdByName, selectedItem.createdByPosition)],
            ['작성일자', formatDateTime(selectedItem.createdAt) || ''],
            ...(selectedItem.modifiedAt && selectedItem.modifiedAt !== selectedItem.createdAt ? [
              ['수정자', formatUserName(selectedItem.modifiedByTeam, selectedItem.modifiedByName, selectedItem.modifiedByPosition)],
              ['수정일자', formatDateTime(selectedItem.modifiedAt)],
            ] : []),
            ['계획 승인자', formatUserName(selectedItem.planApproverTeam, selectedItem.planApproverName, selectedItem.planApproverPosition)],
            ['완료 승인자', formatUserName(selectedItem.completionApproverTeam, selectedItem.completionApproverName, selectedItem.completionApproverPosition)],
            ['체크리스트', getTemplateName(selectedItem.checklistTemplateId)],
          ].filter(([, v]) => v).map(([label, value], i) => (
            <Box key={i}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography>
              <Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>{value}</Typography>
            </Box>
          ))}
        </Box>

        {/* 작업자 정보 */}
        {detailWorkers && detailWorkers.length > 0 && (
          <>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>{t('contractorManagementPage.section1', '작업자 정보')}</Typography>
            {/* PC */}
            <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
              <Table size="small" sx={{ '& td, & th': { borderRight: '1px solid', borderColor: 'divider', px: 1.5, py: 1 }, '& td:last-child, & th:last-child': { borderRight: 'none' } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={hSx} align="center">No</TableCell>
                    <TableCell sx={hSx} align="center">성명</TableCell>
                    <TableCell sx={hSx} align="center">연락처</TableCell>
                    <TableCell sx={hSx} align="center">소속업체</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detailWorkers.map((w, idx) => (
                    <TableRow key={w.id}>
                      <TableCell align="center">{idx + 1}</TableCell>
                      <TableCell align="center">{w.workerName}</TableCell>
                      <TableCell align="center">{w.workerPhone || ''}</TableCell>
                      <TableCell align="center">{w.companyName || ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {/* Mobile */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 3 }}>
              {detailWorkers.map((w, idx) => (
                <Paper key={w.id} sx={{ p: 1.5, border: 1, borderColor: 'divider' }}>
                  <Typography variant="body2" fontWeight="bold">{idx + 1}. {w.workerName}</Typography>
                  <Typography variant="caption" color="text.secondary">{w.workerPhone || ''} | {w.companyName || ''}</Typography>
                </Paper>
              ))}
            </Box>
          </>
        )}

        {/* Embedded checklist in detail */}
        {selectedItem.checklistTemplateId && (
          <Box sx={{ mb: 3 }}>
            <SafetyChecklistTab
              ref={checklistRef}
              templateId={selectedItem.checklistTemplateId}
              embedded
              showSummary={isApprovalMode && selectedItem.status === 'APPROVED'}
            />
          </Box>
        )}

        {/* Bottom buttons — 결재 흐름: 계획 탭(상신/승인) | 관리 탭(완료 상신/완료 승인) */}
        {(() => {
          const status = selectedItem.status
          const normalizeName = (s?: string | null) => (s || '').trim()
          const isPlanApprover = !!user && (
            (!!selectedItem.planApproverUserId && selectedItem.planApproverUserId === user.id) ||
            (!!selectedItem.planApproverName && normalizeName(selectedItem.planApproverName) === normalizeName(user.name))
          )
          const isCompletionApprover = !!user && (
            (!!selectedItem.completionApproverUserId && selectedItem.completionApproverUserId === user.id) ||
            (!!selectedItem.completionApproverName && normalizeName(selectedItem.completionApproverName) === normalizeName(user.name))
          )
          const isPlanMode = mode === 'plan'
          const showPlan = isPlanMode || isAdminMode
          const showApproval = isApprovalMode || isAdminMode
          // 버튼 관리 권한 체크: canApprove(AUDIT_ADMIN)는 결재자 역할에 포함
          const itemRoles: string[] = ['guest']
          if (user?.role === 'SYSTEM_ADMIN') itemRoles.push('superAdmin')
          else if (user?.role) itemRoles.push(user.role)
          if (isPlanApprover || canApprove) itemRoles.push('planApprover')
          if (isCompletionApprover || canApprove) itemRoles.push('completionApprover')
          return (
            <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' }, flexWrap: 'wrap' }}>
              <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list')}</Button>

              {/* DRAFT/REJECTED → 계획 결재 상신 */}
              {showPlan && (status === 'DRAFT' || status === 'REJECTED') && canSee(MENU, 'DRAFT/REJECTED', '계획 결재 상신', itemRoles) && (
                <Button variant="contained" color="info" sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}
                  onClick={async () => {
                    const ok = await showConfirm(t('contractorManagementPage.msg5', '계획 결재를 상신하시겠습니까?'))
                    if (ok) transitionMutation.mutate({ id: selectedItem.id, action: 'submit' })
                  }}>계획 결재 상신</Button>
              )}

              {/* PENDING_APPROVAL → 반려 / 계획 결재 승인 */}
              {showPlan && status === 'PENDING_APPROVAL' && canSee(MENU, 'PENDING_APPROVAL', '반려', itemRoles) && (
                <Button variant="contained" color="warning" sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}
                  onClick={() => setRejectDialogStage('plan')}>반려</Button>
              )}
              {showPlan && status === 'PENDING_APPROVAL' && canSee(MENU, 'PENDING_APPROVAL', '계획 결재 승인', itemRoles) && (
                <Button variant="contained" color="success" sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}
                  onClick={async () => {
                    const ok = await showConfirm(t('contractorManagementPage.msg6', '계획 결재를 승인하시겠습니까?'))
                    if (ok) transitionMutation.mutate({ id: selectedItem.id, action: 'approve' })
                  }}>계획 결재 승인</Button>
              )}

              {/* APPROVED → 저장 + 완료 결재 상신 */}
              {showApproval && status === 'APPROVED' && canSee(MENU, 'APPROVED', '저장', itemRoles) && (
                <Button variant="contained" sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}
                  onClick={async () => {
                    try {
                      if (checklistRef.current) await checklistRef.current.save()
                      const updated = await contractorPlanApi.getById(selectedItem.id)
                      setSelectedItem(updated)
                      queryClient.invalidateQueries({ queryKey: ['contractorApproval'] })
                    } catch { showError(t('common.error')) }
                  }}>{t('common.save')}</Button>
              )}
              {showApproval && status === 'APPROVED' && canSee(MENU, 'APPROVED', '완료 결재 상신', itemRoles) && (
                <Button variant="contained" color="info" sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}
                  onClick={async () => {
                    const ok = await showConfirm(t('contractorManagementPage.msg7', '완료 결재를 상신하시겠습니까?'))
                    if (!ok) return
                    try {
                      if (checklistRef.current) await checklistRef.current.save()
                    } catch { /* continue */ }
                    transitionMutation.mutate({ id: selectedItem.id, action: 'completionSubmit' })
                  }}>완료 결재 상신</Button>
              )}

              {/* COMPLETION_PENDING → 반려 / 완료 결재 승인 */}
              {showApproval && status === 'COMPLETION_PENDING' && canSee(MENU, 'COMPLETION_PENDING', '반려', itemRoles) && (
                <Button variant="contained" color="warning" sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}
                  onClick={() => setRejectDialogStage('completion')}>반려</Button>
              )}
              {showApproval && status === 'COMPLETION_PENDING' && canSee(MENU, 'COMPLETION_PENDING', '완료 결재 승인', itemRoles) && (
                <Button variant="contained" color="success" sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}
                  onClick={async () => {
                    const ok = await showConfirm(t('contractorManagementPage.msg8', '완료 결재를 승인하시겠습니까?'))
                    if (ok) transitionMutation.mutate({ id: selectedItem.id, action: 'complete' })
                  }}>완료 결재 승인</Button>
              )}

              {/* 수정/삭제 — DRAFT/REJECTED 일 때만 */}
              {showPlan && (status === 'DRAFT' || status === 'REJECTED') && canSee(MENU, 'DRAFT/REJECTED', '수정', itemRoles) && (
                <Button variant="contained" onClick={() => handleOpenEdit(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.edit')}</Button>
              )}
              {showPlan && (status === 'DRAFT' || status === 'REJECTED') && canSee(MENU, 'DRAFT/REJECTED', '삭제', itemRoles) && (
                <Button variant="contained" color="error" onClick={() => handleDelete(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.delete')}</Button>
              )}
            </Box>
          )
        })()}

        {/* 결재 반려 사유 입력 다이얼로그 */}
        <RejectReasonDialog
          open={rejectDialogStage !== null}
          stage={rejectDialogStage === 'plan' ? '계획 결재 반려'
            : rejectDialogStage === 'completion' ? '완료 결재 반려' : ''}
          onClose={() => setRejectDialogStage(null)}
          onConfirm={(reason) => {
            if (selectedItem) {
              transitionMutation.mutate({ id: selectedItem.id, action: 'reject', rejectReason: reason })
            }
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
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>{tabTitle}</Typography>

        {/* Desktop form - table-style layout */}
        <Paper sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
          {/* Row: title */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={labelSx}>제목<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Box>
          </Box>
          {/* Row: workType + riskLevel */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={labelSx}>작업유형</Typography>
            <Box sx={valSxBorder}>
              <Select fullWidth size="small" displayEmpty value={form.workType || ''} onChange={(e) => setForm({ ...form, workType: e.target.value })}>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {permitTypes.map((c) => <MenuItem key={c.code} value={c.code}>{getPermitTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
            <Typography sx={labelSx}>위험등급</Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" displayEmpty value={form.riskLevel || ''} onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {riskLevels.map((c) => <MenuItem key={c.code} value={c.code}>{getRiskLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          </Box>
          {/* Row: workLocation + workersCount */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={labelSx}>작업장소</Typography>
            <Box sx={valSxBorder}>
              <TextField fullWidth size="small" value={form.workLocation || ''} onChange={(e) => setForm({ ...form, workLocation: e.target.value })} />
            </Box>
            <Typography sx={labelSx}>작업인원</Typography>
            <Box sx={valSx}>
              <NumberField fullWidth size="small" value={form.workersCount || 0} onChange={(v) => setForm({ ...form, workersCount: v ?? 0 })} />
            </Box>
          </Box>
          {/* Row: workStartDate + workEndDate */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={labelSx}>시작일</Typography>
            <Box sx={valSxBorder}>
              <DatePickerField value={formatDate(form.workStartDate) || null} onChange={(v) => setForm({ ...form, workStartDate: v + 'T08:00:00' })} size="small" maxDate={formatDate(form.workEndDate)} />
            </Box>
            <Typography sx={labelSx}>종료일</Typography>
            <Box sx={valSx}>
              <DatePickerField value={formatDate(form.workEndDate) || null} onChange={(v) => setForm({ ...form, workEndDate: v + 'T17:00:00' })} size="small" minDate={formatDate(form.workStartDate)} />
            </Box>
          </Box>
          {/* Row: workDescription */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={labelSx}>작업내용</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" multiline rows={2} value={form.workDescription || ''} onChange={(e) => setForm({ ...form, workDescription: e.target.value })} /></Box>
          </Box>
          {/* Row: safetyMeasures */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={labelSx}>안전조치</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" multiline rows={2} value={form.safetyMeasures || ''} onChange={(e) => setForm({ ...form, safetyMeasures: e.target.value })} /></Box>
          </Box>
          {/* Row: requiredPpe + hazardFactors */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={labelSx}>보호구</Typography>
            <Box sx={valSxBorder}>
              <Select fullWidth size="small" multiple displayEmpty
                value={form.requiredPpe ? form.requiredPpe.split(', ').filter(Boolean) : []}
                onChange={(e) => setForm({ ...form, requiredPpe: (e.target.value as string[]).join(', ') })}
                input={<OutlinedInput />}
                renderValue={(selected) => (selected as string[]).length === 0
                  ? <span style={{ color: '#9e9e9e' }}>선택</span>
                  : (selected as string[]).join(', ')}>
                {ppeList.map(ppe => (
                  <MenuItem key={ppe.id} value={ppe.name}>
                    <Checkbox checked={(form.requiredPpe || '').split(', ').includes(ppe.name)} size="small" />
                    <ListItemText primary={ppe.name} secondary={ppe.category} />
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <Typography sx={labelSx}>위험요인</Typography>
            <Box sx={valSx}>
              <TextField fullWidth size="small" value={form.hazardFactors || ''} onChange={(e) => setForm({ ...form, hazardFactors: e.target.value })} />
            </Box>
          </Box>
          {/* Row: emergencyContact + notes */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={labelSx}>비상연락처</Typography>
            <Box sx={valSxBorder}>
              <TextField fullWidth size="small" value={form.emergencyContact || ''} onChange={(e) => { const nums = e.target.value.replace(/[^0-9]/g, '').slice(0, 11); let formatted = nums; if (nums.length > 7) formatted = nums.slice(0,3) + '-' + nums.slice(3,7) + '-' + nums.slice(7); else if (nums.length > 3) formatted = nums.slice(0,3) + '-' + nums.slice(3); setForm({ ...form, emergencyContact: formatted }) }} inputProps={{ inputMode: 'numeric', maxLength: 13 }} />
            </Box>
            <Typography sx={labelSx}>비고</Typography>
            <Box sx={valSx}>
              <TextField fullWidth size="small" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Box>
          </Box>
          {/* Row: 일정 반복 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={labelSx}>일정 반복</Typography>
            <Box sx={{ ...valSx, flexDirection: 'column', gap: 1, py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setForm({ ...form, repeatType: 'NONE', repeatInterval: undefined })}>
                <Radio checked={!form.repeatType || form.repeatType === 'NONE'} size="small" />
                <Typography variant="body2">반복 안 함</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setForm({ ...form, repeatType: 'DAILY', repeatInterval: form.repeatType === 'DAILY' ? form.repeatInterval : 1 })}>
                <Radio checked={form.repeatType === 'DAILY'} size="small" />
                <TextField size="small" sx={{ width: 60, mx: 1 }} value={form.repeatType === 'DAILY' ? (form.repeatInterval || 1) : 1}
                  onChange={(e) => setForm({ ...form, repeatType: 'DAILY', repeatInterval: Number(e.target.value) || 1 })}
                  inputProps={{ min: 1, style: { textAlign: 'center' } }} />
                <Typography variant="body2">일마다</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setForm({ ...form, repeatType: 'WEEKLY', repeatInterval: form.repeatType === 'WEEKLY' ? form.repeatInterval : 1 })}>
                <Radio checked={form.repeatType === 'WEEKLY'} size="small" />
                <TextField size="small" sx={{ width: 60, mx: 1 }} value={form.repeatType === 'WEEKLY' ? (form.repeatInterval || 1) : 1}
                  onChange={(e) => setForm({ ...form, repeatType: 'WEEKLY', repeatInterval: Number(e.target.value) || 1 })}
                  inputProps={{ min: 1, style: { textAlign: 'center' } }} />
                <Typography variant="body2">주마다</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setForm({ ...form, repeatType: 'MONTHLY', repeatInterval: form.repeatType === 'MONTHLY' ? form.repeatInterval : 1 })}>
                <Radio checked={form.repeatType === 'MONTHLY'} size="small" />
                <TextField size="small" sx={{ width: 60, mx: 1 }} value={form.repeatType === 'MONTHLY' ? (form.repeatInterval || 1) : 1}
                  onChange={(e) => setForm({ ...form, repeatType: 'MONTHLY', repeatInterval: Number(e.target.value) || 1 })}
                  inputProps={{ min: 1, style: { textAlign: 'center' } }} />
                <Typography variant="body2">개월마다</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => setForm({ ...form, repeatType: 'WEEKDAYS', repeatInterval: undefined })}>
                <Radio checked={form.repeatType === 'WEEKDAYS'} size="small" sx={{ mt: 0.5 }} />
                <Box sx={{ ml: 1 }}>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {([['MON','월'],['TUE','화'],['WED','수'],['THU','목'],['FRI','금'],['SAT','토'],['SUN','일']] as [string,string][]).map(([code, label]) => {
                      const days = (form.repeatDays || '').split(',').filter(Boolean)
                      const selected = days.includes(code)
                      return <Chip key={code} label={label} size="small"
                        color={selected ? (code === 'SAT' ? 'info' : code === 'SUN' ? 'error' : 'primary') : 'default'}
                        variant={selected ? 'filled' : 'outlined'}
                        onClick={(e) => { e.stopPropagation(); const next = selected ? days.filter(d => d !== code) : [...days, code]; setForm({ ...form, repeatType: 'WEEKDAYS', repeatDays: next.join(','), repeatInterval: undefined }) }}
                        sx={{ cursor: 'pointer', fontWeight: selected ? 'bold' : 'normal' }} />
                    })}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                    <Chip label={t('contractorManagementPage.label1', '월·수·금')} size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); setForm({ ...form, repeatType: 'WEEKDAYS', repeatDays: 'MON,WED,FRI' }) }} sx={{ cursor: 'pointer' }} />
                    <Chip label={t('contractorManagementPage.label2', '화·목')} size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); setForm({ ...form, repeatType: 'WEEKDAYS', repeatDays: 'TUE,THU' }) }} sx={{ cursor: 'pointer' }} />
                    <Chip label={t('contractorManagementPage.label3', '평일')} size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); setForm({ ...form, repeatType: 'WEEKDAYS', repeatDays: 'MON,TUE,WED,THU,FRI' }) }} sx={{ cursor: 'pointer' }} />
                    <Chip label={t('contractorManagementPage.label4', '주말')} size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); setForm({ ...form, repeatType: 'WEEKDAYS', repeatDays: 'SAT,SUN' }) }} sx={{ cursor: 'pointer' }} />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
          {/* Row: 작성자 | 작성일자 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={labelSx}>작성자</Typography>
            <Box sx={valSxBorder}>
              <Typography variant="body2">{selectedItem ? (formatUserName(selectedItem.createdByTeam, selectedItem.createdByName, selectedItem.createdByPosition) || user?.name || '') : (formatUserName(user?.department, user?.name, user?.position) || user?.name || '')}</Typography>
            </Box>
            <Typography sx={labelSx}>작성일자</Typography>
            <Box sx={valSx}>
              <Typography variant="body2" fontFamily="monospace">
                {selectedItem?.createdAt ? formatDateTime(selectedItem.createdAt) : todayStr()}
              </Typography>
            </Box>
          </Box>
          {/* Row: 수정자 | 수정일자 — 수정 모드에서만 표시 */}
          {viewMode === 'edit' && selectedItem && (
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
              <Typography sx={labelSx}>수정자</Typography>
              <Box sx={valSxBorder}>
                <Typography variant="body2">{formatUserName(user?.department, user?.name, user?.position)}</Typography>
              </Box>
              <Typography sx={labelSx}>수정일자</Typography>
              <Box sx={valSx}>
                <Typography variant="body2" fontFamily="monospace">{todayStr()}</Typography>
              </Box>
            </Box>
          )}
          {/* Row: 계획 승인자 | 완료 승인자 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={labelSx}>
              계획 승인자
              <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={{ ...valSx, display: 'flex', gap: 1, alignItems: 'center', py: 1, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
              <TextField fullWidth size="small" value={form.planApproverName || ''} InputProps={{ readOnly: true }}
                placeholder="조직도에서 선택" />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setApproverPickTarget('plan')}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
            <Typography sx={labelSx}>
              완료 승인자
              <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={{ ...valSx, display: 'flex', gap: 1, alignItems: 'center', py: 1 }}>
              <TextField fullWidth size="small" value={form.completionApproverName || ''} InputProps={{ readOnly: true }}
                placeholder="조직도에서 선택" />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setApproverPickTarget('completion')}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          </Box>
          {/* Workers section (먼저) */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={labelSx}>작업자 정보</Typography>
            <Box sx={{ ...valSx, flexDirection: 'column', py: 2 }}>
              {workers.map((w, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5 }}>
                  <TextField size="small" placeholder="작업자명" value={w.workerName} onChange={(e) => { const nw = [...workers]; nw[idx] = { ...nw[idx], workerName: e.target.value }; setWorkers(nw) }} sx={{ flex: 1 }} />
                  <TextField select size="small" value={w.companyName || ''}
                    SelectProps={{ displayEmpty: true }}
                    onChange={(e) => { const nw = [...workers]; nw[idx] = { ...nw[idx], companyName: e.target.value }; setWorkers(nw) }}
                    sx={{ flex: 1 }}>
                    <MenuItem value="">소속업체</MenuItem>
                    {contractorRegs.map(r => (
                      <MenuItem key={r.id} value={r.companyName}>{r.companyName}</MenuItem>
                    ))}
                  </TextField>
                  <TextField size="small" placeholder="연락처" value={w.workerPhone} onChange={(e) => { const nw = [...workers]; nw[idx] = { ...nw[idx], workerPhone: fmtPhone(e.target.value) }; setWorkers(nw) }} inputProps={{ inputMode: 'numeric', maxLength: 13 }} sx={{ flex: 1 }} />
                  <IconButton size="small" onClick={() => setWorkers(prev => prev.filter((_, i) => i !== idx))} color="error"><DeleteIcon fontSize="small" /></IconButton>
                </Box>
              ))}
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => setWorkers(prev => [...prev, { workerName: '', workerPhone: '', companyName: '' }])}>
                  외부직원 추가
                </Button>
                <Button variant="outlined" size="small" startIcon={<PersonSearchIcon />} onClick={() => setShowWorkerUserModal(true)}>
                  내부직원 추가
                </Button>
              </Box>
            </Box>
          </Box>
          {/* Row: checklist (마지막) */}
          <Box sx={{ display: 'flex' }}>
            <Typography sx={labelSx}>체크리스트<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" displayEmpty value={form.checklistTemplateId || ''} onChange={(e) => setForm({ ...form, checklistTemplateId: e.target.value ? Number(e.target.value) : undefined })}>
                <MenuItem value="">{t('common.select', '선택하세요')}</MenuItem>
                {templates.filter(t => (t as SafetyChecklistTemplate & { categoryType?: string }).categoryType === 'CONTRACTOR')
                  .map(tmpl => <MenuItem key={tmpl.id} value={tmpl.id}>{tmpl.templateName}</MenuItem>)}
              </Select>
            </Box>
          </Box>
        </Paper>

        {/* Preview checklist when selected */}
        {form.checklistTemplateId && (
          <SafetyChecklistTab templateId={form.checklistTemplateId} embedded />
        )}

        {/* Mobile form */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              제목 <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>작업유형</Typography>
            <FormControl fullWidth size="small">
              <Select displayEmpty value={form.workType || ''} onChange={(e) => setForm({ ...form, workType: e.target.value })}>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {permitTypes.map((c) => <MenuItem key={c.code} value={c.code}>{getPermitTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>위험등급</Typography>
            <FormControl fullWidth size="small">
              <Select displayEmpty value={form.riskLevel || ''} onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {riskLevels.map((c) => <MenuItem key={c.code} value={c.code}>{getRiskLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>작업장소</Typography>
            <TextField size="small" fullWidth value={form.workLocation || ''} onChange={(e) => setForm({ ...form, workLocation: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>작업인원</Typography>
            <NumberField size="small" fullWidth value={form.workersCount || 0} onChange={(v) => setForm({ ...form, workersCount: v ?? 0 })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>시작일</Typography>
            <DatePickerField value={formatDate(form.workStartDate) || null} onChange={(v) => setForm({ ...form, workStartDate: v + 'T08:00:00' })} size="small" maxDate={formatDate(form.workEndDate)} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>종료일</Typography>
            <DatePickerField value={formatDate(form.workEndDate) || null} onChange={(v) => setForm({ ...form, workEndDate: v + 'T17:00:00' })} size="small" minDate={formatDate(form.workStartDate)} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>작업내용</Typography>
            <TextField size="small" fullWidth multiline rows={2} value={form.workDescription || ''} onChange={(e) => setForm({ ...form, workDescription: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>안전조치</Typography>
            <TextField size="small" fullWidth multiline rows={2} value={form.safetyMeasures || ''} onChange={(e) => setForm({ ...form, safetyMeasures: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>보호구</Typography>
            <Select fullWidth size="small" multiple displayEmpty
              value={form.requiredPpe ? form.requiredPpe.split(', ').filter(Boolean) : []}
              onChange={(e) => setForm({ ...form, requiredPpe: (e.target.value as string[]).join(', ') })}
              input={<OutlinedInput />}
              renderValue={(selected) => (selected as string[]).length === 0
                ? <span style={{ color: '#9e9e9e' }}>선택</span>
                : (selected as string[]).join(', ')}>
              {ppeList.map(ppe => (
                <MenuItem key={ppe.id} value={ppe.name}>
                  <Checkbox checked={(form.requiredPpe || '').split(', ').includes(ppe.name)} size="small" />
                  <ListItemText primary={ppe.name} secondary={ppe.category} />
                </MenuItem>
              ))}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>위험요인</Typography>
            <TextField size="small" fullWidth value={form.hazardFactors || ''} onChange={(e) => setForm({ ...form, hazardFactors: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>비상연락처</Typography>
            <TextField size="small" fullWidth value={form.emergencyContact || ''} onChange={(e) => { const nums = e.target.value.replace(/[^0-9]/g, '').slice(0, 11); let formatted = nums; if (nums.length > 7) formatted = nums.slice(0,3) + '-' + nums.slice(3,7) + '-' + nums.slice(7); else if (nums.length > 3) formatted = nums.slice(0,3) + '-' + nums.slice(3); setForm({ ...form, emergencyContact: formatted }) }} inputProps={{ inputMode: 'numeric', maxLength: 13 }} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>비고</Typography>
            <TextField size="small" fullWidth value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>일정 반복</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }} onClick={() => setForm({ ...form, repeatType: 'NONE', repeatInterval: undefined })}>
                <Radio checked={!form.repeatType || form.repeatType === 'NONE'} size="small" />
                <Typography variant="body2">반복 안 함</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }} onClick={() => setForm({ ...form, repeatType: 'DAILY', repeatInterval: form.repeatType === 'DAILY' ? form.repeatInterval : 1 })}>
                <Radio checked={form.repeatType === 'DAILY'} size="small" />
                <TextField size="small" sx={{ width: 50, mx: 0.5 }} value={form.repeatType === 'DAILY' ? (form.repeatInterval || 1) : 1}
                  onChange={(e) => setForm({ ...form, repeatType: 'DAILY', repeatInterval: Number(e.target.value) || 1 })}
                  inputProps={{ min: 1, style: { textAlign: 'center' } }} />
                <Typography variant="body2">일마다</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }} onClick={() => setForm({ ...form, repeatType: 'WEEKLY', repeatInterval: form.repeatType === 'WEEKLY' ? form.repeatInterval : 1 })}>
                <Radio checked={form.repeatType === 'WEEKLY'} size="small" />
                <TextField size="small" sx={{ width: 50, mx: 0.5 }} value={form.repeatType === 'WEEKLY' ? (form.repeatInterval || 1) : 1}
                  onChange={(e) => setForm({ ...form, repeatType: 'WEEKLY', repeatInterval: Number(e.target.value) || 1 })}
                  inputProps={{ min: 1, style: { textAlign: 'center' } }} />
                <Typography variant="body2">주마다</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }} onClick={() => setForm({ ...form, repeatType: 'MONTHLY', repeatInterval: form.repeatType === 'MONTHLY' ? form.repeatInterval : 1 })}>
                <Radio checked={form.repeatType === 'MONTHLY'} size="small" />
                <TextField size="small" sx={{ width: 50, mx: 0.5 }} value={form.repeatType === 'MONTHLY' ? (form.repeatInterval || 1) : 1}
                  onChange={(e) => setForm({ ...form, repeatType: 'MONTHLY', repeatInterval: Number(e.target.value) || 1 })}
                  inputProps={{ min: 1, style: { textAlign: 'center' } }} />
                <Typography variant="body2">개월마다</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }} onClick={() => setForm({ ...form, repeatType: 'WEEKDAYS', repeatInterval: undefined })}>
                <Radio checked={form.repeatType === 'WEEKDAYS'} size="small" sx={{ mt: 0.5 }} />
                <Box sx={{ ml: 0.5 }}>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {([['MON','월'],['TUE','화'],['WED','수'],['THU','목'],['FRI','금'],['SAT','토'],['SUN','일']] as [string,string][]).map(([code, label]) => {
                      const days = (form.repeatDays || '').split(',').filter(Boolean)
                      const selected = days.includes(code)
                      return <Chip key={code} label={label} size="small"
                        color={selected ? (code === 'SAT' ? 'info' : code === 'SUN' ? 'error' : 'primary') : 'default'}
                        variant={selected ? 'filled' : 'outlined'}
                        onClick={(e) => { e.stopPropagation(); const next = selected ? days.filter(d => d !== code) : [...days, code]; setForm({ ...form, repeatType: 'WEEKDAYS', repeatDays: next.join(','), repeatInterval: undefined }) }}
                        sx={{ cursor: 'pointer', fontWeight: selected ? 'bold' : 'normal' }} />
                    })}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                    <Chip label={t('contractorManagementPage.label5', '월·수·금')} size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); setForm({ ...form, repeatType: 'WEEKDAYS', repeatDays: 'MON,WED,FRI' }) }} sx={{ cursor: 'pointer' }} />
                    <Chip label={t('contractorManagementPage.label6', '화·목')} size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); setForm({ ...form, repeatType: 'WEEKDAYS', repeatDays: 'TUE,THU' }) }} sx={{ cursor: 'pointer' }} />
                    <Chip label={t('contractorManagementPage.label7', '평일')} size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); setForm({ ...form, repeatType: 'WEEKDAYS', repeatDays: 'MON,TUE,WED,THU,FRI' }) }} sx={{ cursor: 'pointer' }} />
                    <Chip label={t('contractorManagementPage.label8', '주말')} size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); setForm({ ...form, repeatType: 'WEEKDAYS', repeatDays: 'SAT,SUN' }) }} sx={{ cursor: 'pointer' }} />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
          {/* 작성자 / 작성일자 */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>작성자</Typography>
              <Typography variant="body2" sx={{ px: 1.5 }}>{selectedItem ? (formatUserName(selectedItem.createdByTeam, selectedItem.createdByName, selectedItem.createdByPosition) || user?.name || '') : (formatUserName(user?.department, user?.name, user?.position) || user?.name || '')}</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>작성일자</Typography>
              <Typography variant="body2" fontFamily="monospace" sx={{ px: 1.5 }}>
                {selectedItem?.createdAt ? formatDateTime(selectedItem.createdAt) : todayStr()}
              </Typography>
            </Box>
          </Box>
          {/* 수정자 / 수정일자 — 수정 모드 */}
          {viewMode === 'edit' && selectedItem && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>수정자</Typography>
                <Typography variant="body2" sx={{ px: 1.5 }}>{formatUserName(user?.department, user?.name, user?.position)}</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>수정일자</Typography>
                <Typography variant="body2" fontFamily="monospace" sx={{ px: 1.5 }}>{todayStr()}</Typography>
              </Box>
            </Box>
          )}
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              계획 승인자 <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField fullWidth size="small" value={form.planApproverName || ''} InputProps={{ readOnly: true }}
                placeholder="조직도에서 선택" />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setApproverPickTarget('plan')}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              완료 승인자 <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField fullWidth size="small" value={form.completionApproverName || ''} InputProps={{ readOnly: true }}
                placeholder="조직도에서 선택" />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setApproverPickTarget('completion')}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          </Box>
          {/* Workers - mobile (먼저) */}
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>작업자 정보</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
              {workers.map((w, idx) => (
                <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <TextField size="small" fullWidth placeholder="작업자명" value={w.workerName} onChange={(e) => { const nw = [...workers]; nw[idx] = { ...nw[idx], workerName: e.target.value }; setWorkers(nw) }} />
                  <TextField select size="small" fullWidth value={w.companyName || ''}
                    SelectProps={{ displayEmpty: true }}
                    onChange={(e) => { const nw = [...workers]; nw[idx] = { ...nw[idx], companyName: e.target.value }; setWorkers(nw) }}>
                    <MenuItem value="">소속업체</MenuItem>
                    {contractorRegs.map(r => (
                      <MenuItem key={r.id} value={r.companyName}>{r.companyName}</MenuItem>
                    ))}
                  </TextField>
                  <TextField size="small" fullWidth placeholder="연락처" value={w.workerPhone} onChange={(e) => { const nw = [...workers]; nw[idx] = { ...nw[idx], workerPhone: fmtPhone(e.target.value) }; setWorkers(nw) }} inputProps={{ inputMode: 'numeric', maxLength: 13 }} />
                  <Button size="small" color="error" onClick={() => setWorkers(prev => prev.filter((_, i) => i !== idx))}>{t('common.delete')}</Button>
                </Box>
              ))}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" size="small" startIcon={<AddIcon />} sx={{ flex: 1 }} onClick={() => setWorkers(prev => [...prev, { workerName: '', workerPhone: '', companyName: '' }])}>
                  외부직원 추가
                </Button>
                <Button variant="outlined" size="small" startIcon={<PersonSearchIcon />} sx={{ flex: 1 }} onClick={() => setShowWorkerUserModal(true)}>
                  내부직원 추가
                </Button>
              </Box>
            </Box>
          </Box>
          {/* 체크리스트 (마지막) */}
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>체크리스트<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <FormControl fullWidth size="small">
              <Select displayEmpty value={form.checklistTemplateId || ''} onChange={(e) => setForm({ ...form, checklistTemplateId: e.target.value ? Number(e.target.value) : undefined })}>
                <MenuItem value="">{t('common.select', '선택하세요')}</MenuItem>
                {templates.filter(t => (t as SafetyChecklistTemplate & { categoryType?: string }).categoryType === 'CONTRACTOR')
                  .map(tmpl => <MenuItem key={tmpl.id} value={tmpl.id}>{tmpl.templateName}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Save / Cancel buttons */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' }, flexWrap: 'wrap', mt: 3 }}>
          {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
          <Button variant="outlined" onClick={() => viewMode === 'edit' ? setViewMode('detail') : handleBackToList()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save')}</Button>
        </Box>
        <UserSelectModal
          open={approverPickTarget !== null}
          onClose={() => setApproverPickTarget(null)}
          selectedUsers={[]}
          onConfirm={handleUserSelect}
          singleSelect
          useCompanyTree
          title={approverPickTarget === 'plan' ? '계획 승인자 선택' : '완료 승인자 선택'}
        />
        <DeptUserMultiSelectModal open={showWorkerUserModal} onClose={() => setShowWorkerUserModal(false)} onConfirm={handleWorkerUserSelect} title="내부직원 선택" />
      </Box>
    )
  }

  return null
}

// =============================================
// Main Page with 3 Tabs
// =============================================
const ContractorManagementPage: React.FC = () => {
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
        <Tab label={t('contractor.tabs.dashboard', '대시보드')} />
        <Tab label={t('contractor.tabs.plan', '계획')} />
        <Tab label={t('contractor.tabs.approval', '평가서조회 담당승인자')} />
        <Tab label={t('contractor.tabs.adminView', '전체조회 (어드민)')} />
        <Tab label={t('contractor.tabs.report', '레포트')} />
      </Tabs>
      {activeTab === 0 && <ContractorDashboardTab />}
      {activeTab === 1 && <ContractorPlanContent mode="plan" />}
      {activeTab === 2 && <ContractorPlanContent mode="approval" />}
      {activeTab === 3 && <ContractorPlanContent mode="admin" />}
      {activeTab === 4 && <ContractorReportTab />}
    </Box>
  )
}

export default ContractorManagementPage
