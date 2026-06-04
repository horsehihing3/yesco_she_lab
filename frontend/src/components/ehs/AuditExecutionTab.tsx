import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useButtonRules } from '../../hooks/useButtonRules'
import { Role } from '../../data/buttonManageData'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Select, MenuItem,
  FormControl, Chip, Pagination, CircularProgress, Alert, IconButton,
  LinearProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import HistoryIcon from '@mui/icons-material/History'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import UserSelectModal from '../common/UserSelectModal'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import RejectReasonDialog from '../common/RejectReasonDialog'
import { auditApi, auditPlanApi } from '../../api/auditApi'
import { fetchTeamLeader } from '../../api/approvalApi'
import { fetchSafetyTemplateDetail } from '../../api/safetyChecklistApi'
import { SafetyChecklistTemplate } from '../../types/safetyChecklist.types'
import { Audit, AuditRequest, AuditLogEntry, AuditFieldChange } from '../../types/audit.types'
import useCodeMap from '../../hooks/useCodeMap'
import DatePickerField from '../common/DatePickerField'
import SafetyChecklistTab, { SafetyChecklistTabRef } from './SafetyChecklistTab'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const statusColors: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  PLAN: 'default',
  PREPARING: 'warning',
  IN_PROGRESS: 'info',
  PENDING_CLOSE: 'info',
  COMPLETED: 'success',
}

const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }
const labelSx = { width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', textAlign: 'center' as const, wordBreak: 'keep-all' as const }
const valSx = { flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'grey.300' }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'grey.300' }

const emptyForm: AuditRequest = { auditName: '', auditType: 'REGULAR', targetDept: '', targetSite: '', auditor: '', auditDate: '', grade: undefined, summary: '', status: 'PLAN' }

interface AuditExecutionTabProps { menuPath?: string }

const AuditExecutionTab: React.FC<AuditExecutionTabProps> = ({ menuPath }) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { codeList: auditStatusCodes, getLabel: getAuditStatusLabel } = useCodeMap('AUDIT_STATUS')
  const { codeList: auditTypeCodes, getLabel: getAuditTypeLabel } = useCodeMap('AUDIT_TYPE')
  const { user: authUser } = useAuth()

  const isAdmin = authUser?.role === 'SYSTEM_ADMIN'
  const canCompletionApprove = (a: { completionApproverUserId?: number | null; completionApproverName?: string | null }) => {
    if (isAdmin) return true
    if (a.completionApproverUserId && authUser?.id && a.completionApproverUserId === authUser.id) return true
    if (a.completionApproverName && authUser?.name && a.completionApproverName === authUser.name) return true
    return false
  }
  const { canSee } = useButtonRules()
  const MENU = menuPath ?? 'EHS경영 › 감사 › 감사 실시'
  const getRoles = (item: { createdByUserId?: number|null; auditorName?: string|null; auditor?: string|null; planApproverUserId?: number|null; planApproverName?: string|null; completionApproverUserId?: number|null; completionApproverName?: string|null }): string[] => {
    const roles: string[] = ['guest']
    if (isAdmin) roles.push('superAdmin')
    else if (authUser?.role) roles.push(authUser.role)
    if (item.createdByUserId === authUser?.id) roles.push('writer')
    const auditorCsv = item.auditorName || item.auditor || ''
    if (authUser?.name && auditorCsv.split(',').map(s => s.trim()).includes(authUser.name)) roles.push('auditor')
    if ((item.planApproverUserId && authUser?.id && item.planApproverUserId === authUser.id) ||
        (item.planApproverName && authUser?.name && item.planApproverName === authUser.name)) roles.push('planApprover')
    if ((item.completionApproverUserId && authUser?.id && item.completionApproverUserId === authUser.id) ||
        (item.completionApproverName && authUser?.name && item.completionApproverName === authUser.name)) roles.push('completionApprover')
    return roles
  }
  const myRoles: string[] = ['guest', ...(isAdmin ? ['superAdmin'] : [authUser?.role ?? ''].filter(Boolean))]
  const [showCompletionApproverModal, setShowCompletionApproverModal] = useState(false)
  const [showPlanApproverModal, setShowPlanApproverModal] = useState(false)
  // 완료 결재 반려 사유 입력 다이얼로그
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

  const checklistRef = useRef<SafetyChecklistTabRef>(null)
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [logModalItems, setLogModalItems] = useState<any[]>([])
  const [logModalTitle, setLogModalTitle] = useState('')
  const [logModalLoading, setLogModalLoading] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<Audit | null>(null)
  const [form, setForm] = useState<AuditRequest>(emptyForm)
  const [page, setPage] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const pageSize = 10

  const queryKey = statusFilter
    ? ['auditExecStatus', statusFilter, page]
    : ['auditExec', page]

  const queryFn = () => {
    if (statusFilter) return auditApi.getByStatus(statusFilter, page, pageSize)
    return auditApi.getAll(page, pageSize)
  }

  const { data, isLoading } = useQuery({ queryKey, queryFn, enabled: viewMode === 'list' })

  let items = data?.content || []
  const totalPages = data?.totalPages || 0

  if (searchText) {
    const s = searchText.toLowerCase()
    items = items.filter((i) =>
      i.auditName.toLowerCase().includes(s) ||
      i.auditId?.toLowerCase().includes(s) ||
      i.auditor?.toLowerCase().includes(s) ||
      i.targetDept?.toLowerCase().includes(s)
    )
  }

  // 연결된 감사 계획 조회 → checklistTemplateId 가져오기
  const { data: linkedPlan } = useQuery({
    queryKey: ['auditPlanForExec', selectedItem?.planId],
    queryFn: () => auditPlanApi.getById(selectedItem!.planId!),
    enabled: !!selectedItem?.planId && viewMode === 'detail',
  })

  // 연결된 체크리스트 템플릿 조회
  const checklistTemplateId = linkedPlan?.checklistTemplateId
  const { data: checklistTemplate } = useQuery<SafetyChecklistTemplate>({
    queryKey: ['safetyTemplate', checklistTemplateId],
    queryFn: () => fetchSafetyTemplateDetail(checklistTemplateId!),
    enabled: !!checklistTemplateId && viewMode === 'detail',
  })

  // 변경 이력 조회
  const { data: auditLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['auditLogs', selectedItem?.id],
    queryFn: () => auditApi.getLogs(selectedItem!.id),
    enabled: !!selectedItem?.id && viewMode === 'detail',
  })

  const invalidate = () => { queryClient.invalidateQueries({ queryKey: ['auditExec'] }); queryClient.invalidateQueries({ queryKey: ['auditExecStatus'] }) }
  const createMut = useMutation({ mutationFn: (r: AuditRequest) => auditApi.create(r), onSuccess: () => { invalidate(); showSuccess(t('common.saved')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const updateMut = useMutation({ mutationFn: ({ id, r }: { id: number; r: AuditRequest }) => auditApi.update(id, r), onSuccess: () => { invalidate(); showSuccess(t('common.saved')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const deleteMut = useMutation({ mutationFn: (id: number) => auditApi.delete(id), onSuccess: () => { invalidate(); showSuccess(t('common.deleted')); handleBackToList() }, onError: () => showError(t('common.error')) })

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm(emptyForm) }
  const handleRowClick = (item: Audit) => { setSelectedItem(item); setViewMode('detail') }
  const handleOpenCreate = async () => {
    setSelectedItem(null)
    const leader = await fetchTeamLeader(authUser?.deptCode)
    setForm({
      ...emptyForm,
      createdByUserId: authUser?.id ?? null,
      createdByName: authUser?.name || '',
      ...(leader ? {
        planApproverName: leader.name, planApproverPosition: leader.position, planApproverTeam: leader.team,
        completionApproverName: leader.name, completionApproverPosition: leader.position, completionApproverTeam: leader.team,
      } : {}),
    })
    setViewMode('create')
  }
  const handleOpenEdit = (item: Audit) => {
    setSelectedItem(item)
    setForm({
      planId: item.planId, auditName: item.auditName, auditType: item.auditType,
      targetDept: item.targetDept || '', targetSite: item.targetSite || '',
      auditor: item.auditor || '', auditDate: item.auditDate || '',
      grade: item.grade, summary: item.summary || '', status: item.status,
      planApproverUserId: item.planApproverUserId ?? null,
      planApproverTeam: item.planApproverTeam || '',
      planApproverPosition: item.planApproverPosition || '',
      planApproverName: item.planApproverName || '',
      completionApproverUserId: item.completionApproverUserId,
      completionApproverTeam: item.completionApproverTeam || '',
      completionApproverPosition: item.completionApproverPosition || '',
      completionApproverName: item.completionApproverName || '',
      createdByUserId: item.createdByUserId ?? null,
      createdByName: item.createdByName || '',
    })
    setViewMode('edit')
  }
  const handleSave = async () => {
    if (selectedItem && (viewMode === 'edit' || viewMode === 'detail')) {
      // 체크리스트 항목/서명 저장
      if (checklistRef.current) {
        await checklistRef.current.save()
      }
      if (viewMode === 'detail') {
        // 저장 후 audit 데이터 다시 조회하여 카운트 반영
        try {
          const updated = await auditApi.getById(selectedItem.id)
          setSelectedItem(updated)
          invalidate()
          refetchLogs()
          showSuccess(t('common.saved'))
        } catch { showError(t('common.error')) }
        return
      }
      updateMut.mutate({ id: selectedItem.id, r: form })
    } else { createMut.mutate(form) }
  }
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedItem) return
    if (newStatus === 'COMPLETED') {
      if (!canCompletionApprove(selectedItem)) {
        showError(t('audit.notCompletionApprover', '지정된 완료 승인자만 작업 완료 처리할 수 있습니다.'))
        return
      }
      if (!checklistRef.current?.isAllChecked()) {
        showError(t('audit.allChecklistMustBeChecked', '모든 체크리스트 항목이 체크되어야 완료할 수 있습니다.'))
        return
      }
      const ok = await showConfirm(t('common.confirmApprove', '승인 하시겠습니까?'))
      if (!ok) return
      try {
        await auditApi.complete(selectedItem.id)
        const updated = await auditApi.getById(selectedItem.id)
        setSelectedItem(updated)
        invalidate()
        refetchLogs()
        showSuccess(t('audit.completed', '완료 승인되었습니다.'))
      } catch { showError(t('common.error')) }
      return
    }
    try {
      await auditApi.update(selectedItem.id, {
        auditName: selectedItem.auditName, auditType: selectedItem.auditType,
        targetDept: selectedItem.targetDept || '', targetSite: selectedItem.targetSite || '',
        auditor: selectedItem.auditor || '', auditDate: selectedItem.auditDate || '',
        grade: selectedItem.grade, summary: selectedItem.summary || '', status: newStatus,
        planApproverUserId: selectedItem.planApproverUserId,
        planApproverTeam: selectedItem.planApproverTeam || undefined,
        planApproverPosition: selectedItem.planApproverPosition || undefined,
        planApproverName: selectedItem.planApproverName || undefined,
        completionApproverUserId: selectedItem.completionApproverUserId,
        completionApproverTeam: selectedItem.completionApproverTeam || undefined,
        completionApproverPosition: selectedItem.completionApproverPosition || undefined,
        completionApproverName: selectedItem.completionApproverName || undefined,
        createdByUserId: selectedItem.createdByUserId,
        createdByName: selectedItem.createdByName || undefined,
      } as AuditRequest)
      const updated = await auditApi.getById(selectedItem.id)
      setSelectedItem(updated)
      invalidate()
      refetchLogs()
      showSuccess(t('common.saved'))
    } catch { showError(t('common.error')) }
  }
  const handleLogClick = async (log: AuditLogEntry) => {
    if (log.action !== 'CHECKLIST_SAVE') return
    setLogModalLoading(true)
    setLogModalTitle(log.createdAt?.replace('T', ' ').substring(0, 19))
    setLogModalOpen(true)
    try {
      const items = await auditApi.getLogItems(log.id)
      setLogModalItems(items)
    } catch { setLogModalItems([]) }
    setLogModalLoading(false)
  }

  const fieldLabel = (key: string): string => {
    const k = `audit.field.${key}`
    const fallback: Record<string, string> = {
      auditName: '감사명', auditType: '감사 유형',
      targetDept: '대상 부서', targetSite: '대상 현장',
      auditorName: '감사원', auditorDept: '감사원 부서',
      auditStartDate: '시작일', auditEndDate: '종료일',
      grade: '등급', summary: '요약', notes: '비고',
    }
    return t(k, fallback[key] ?? key)
  }

  const parseFieldChanges = (raw?: string | null): AuditFieldChange[] => {
    if (!raw) return []
    try {
      const v = JSON.parse(raw)
      return Array.isArray(v) ? (v as AuditFieldChange[]) : []
    } catch { return [] }
  }

  const actionLabel = (action: string): string => {
    switch (action) {
      case 'CHECKLIST_SAVE': return t('audit.logChecklist', '체크리스트 저장')
      case 'STATUS_CHANGE': return t('audit.logStatus', '상태 변경')
      case 'FIELD_UPDATE': return t('audit.logFieldUpdate', '항목 수정')
      case 'APPROVAL_SUBMIT': return t('audit.logApprovalSubmit', '결재 상신')
      case 'APPROVAL_APPROVED': return t('audit.logApprovalApproved', '결재 승인')
      case 'APPROVAL_REJECTED': return t('audit.logApprovalRejected', '결재 반려')
      case 'APPROVAL_COMPLETED': return t('audit.logApprovalCompleted', '결재 완료')
      default: return action
    }
  }

  const actionChipColor = (action: string): 'default' | 'info' | 'success' | 'error' | 'warning' | 'primary' => {
    switch (action) {
      case 'STATUS_CHANGE': return 'info'
      case 'FIELD_UPDATE': return 'warning'
      case 'APPROVAL_SUBMIT': return 'primary'
      case 'APPROVAL_APPROVED':
      case 'APPROVAL_COMPLETED': return 'success'
      case 'APPROVAL_REJECTED': return 'error'
      default: return 'default'
    }
  }

  const renderLogContent = (log: AuditLogEntry) => {
    if (log.action === 'FIELD_UPDATE') {
      const diffs = parseFieldChanges(log.fieldChanges)
      if (diffs.length > 0) {
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            {diffs.map((d, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, flexWrap: 'wrap', fontSize: '0.85rem' }}>
                <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{fieldLabel(d.field)}</Typography>
                <Typography component="span" sx={{ color: 'text.secondary', textDecoration: 'line-through', fontSize: '0.8rem' }}>{d.before ?? ''}</Typography>
                <Typography component="span" sx={{ fontSize: '0.8rem' }}>→</Typography>
                <Typography component="span" sx={{ fontWeight: 600, color: 'primary.main', fontSize: '0.8rem' }}>{d.after ?? ''}</Typography>
              </Box>
            ))}
          </Box>
        )
      }
    }
    if (log.action === 'APPROVAL_REJECTED' && log.rejectReason) {
      return (
        <Box>
          <Typography variant="caption" color="error.main" fontWeight="bold">{t('audit.logRejectReason', '반려 사유')}</Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{log.rejectReason}</Typography>
        </Box>
      )
    }
    return <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{log.detail}</Typography>
  }
  const handleDelete = async (item: Audit) => { const ok = await showConfirm(t('common.confirmDelete')); if (ok) deleteMut.mutate(item.id) }
  const handleReset = () => { setSearchText(''); setStatusFilter(''); setPage(0) }

  // ==================== DETAIL VIEW ====================
  if (viewMode === 'detail' && selectedItem) {
    const progress = selectedItem.totalChecklist > 0 ? Math.round((selectedItem.completedChecklist / selectedItem.totalChecklist) * 100) : 0
    return (
      <Box>
        {/* 반려 사유 배너 — IN_PROGRESS 로 되돌려진 경우 사유 노출 */}
        {selectedItem.rejectReason && selectedItem.status === 'IN_PROGRESS' && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'error.lighter', border: 1, borderColor: 'error.light', borderRadius: 1 }}>
            <Typography variant="body2" color="error.main" fontWeight="bold" sx={{ mb: 0.5 }}>
              {t('common.rejectReasonTitle', '반려 사유')}
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedItem.rejectReason}</Typography>
          </Box>
        )}
        {/* PC 감사 정보 */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('audit.auditId')}</Typography>
            <Box sx={valBorderSx}><Typography variant="body2" fontFamily="monospace">{selectedItem.auditId}</Typography></Box>
            <Typography sx={labelSx}>{t('audit.auditName')}</Typography>
            <Box sx={valSx}><Typography variant="body2" fontWeight={600}>{selectedItem.auditName}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('audit.auditType')}</Typography>
            <Box sx={valBorderSx}><Typography variant="body2">{getAuditTypeLabel(selectedItem.auditType)}</Typography></Box>
            <Typography sx={labelSx}>{t('audit.targetDept')}</Typography>
            <Box sx={valSx}><Typography variant="body2">{selectedItem.targetDept || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('audit.auditor')}</Typography>
            <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.auditor || ''}</Typography></Box>
            <Typography sx={labelSx}>{t('audit.auditDate', '감사일')}</Typography>
            <Box sx={valSx}><Typography variant="body2">{selectedItem.auditDate || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('audit.grade')}</Typography>
            <Box sx={valBorderSx}>
              {selectedItem.grade ? <Chip label={selectedItem.grade} size="small" color={selectedItem.grade === 'S' ? 'success' : selectedItem.grade === 'A' ? 'primary' : selectedItem.grade === 'B' ? 'warning' : 'error'} /> : null}
            </Box>
            <Typography sx={labelSx}>{t('common.status')}</Typography>
            <Box sx={valSx}><Chip label={getAuditStatusLabel(selectedItem.status)} color={statusColors[selectedItem.status]} size="small" /></Box>
          </Box>
          {checklistTemplateId && (
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('audit.checklistProgress')}</Typography>
              <Box sx={valBorderSx}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <LinearProgress variant="determinate" value={progress} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                  <Typography variant="body2" fontWeight="bold">{selectedItem.completedChecklist}/{selectedItem.totalChecklist}</Typography>
                </Box>
              </Box>
              <Typography sx={labelSx}>{t('audit.findingCount')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.findingCount}</Typography></Box>
            </Box>
          )}
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('audit.planApprover', '계획 승인자')}</Typography>
            <Box sx={valBorderSx}>
              <Typography variant="body2">
                {selectedItem.planApproverName
                  ? `${selectedItem.planApproverName}${selectedItem.planApproverTeam ? ` (${selectedItem.planApproverTeam})` : ''}`
                  : ''}
                {selectedItem.planApprovedAt && (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    ({selectedItem.planApprovedBy || ''} | {selectedItem.planApprovedAt.replace('T', ' ').substring(0, 16)})
                  </Typography>
                )}
              </Typography>
            </Box>
            <Typography sx={labelSx}>{t('audit.completionApprover', '완료 승인자')}</Typography>
            <Box sx={valSx}>
              <Typography variant="body2">
                {selectedItem.completionApproverName
                  ? `${selectedItem.completionApproverName}${selectedItem.completionApproverTeam ? ` (${selectedItem.completionApproverTeam})` : ''}`
                  : ''}
                {selectedItem.completionApprovedAt && (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    ({selectedItem.completionApprovedBy || ''} | {selectedItem.completionApprovedAt.replace('T', ' ').substring(0, 16)})
                  </Typography>
                )}
              </Typography>
            </Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('audit.createdByName', '작성자')}</Typography>
            <Box sx={valBorderSx}>
              <Typography variant="body2">{selectedItem.createdByName || ''}</Typography>
            </Box>
            <Typography sx={labelSx}>{t('audit.createdAt', '작성일시')}</Typography>
            <Box sx={valSx}>
              <Typography variant="body2">
                {selectedItem.createdAt ? selectedItem.createdAt.replace('T', ' ').substring(0, 16) : ''}
              </Typography>
            </Box>
          </Box>
          {selectedItem.summary && (
            <Box sx={{ display: 'flex' }}>
              <Typography sx={labelSx}>{t('audit.summary', '요약')}</Typography>
              <Box sx={valSx}><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedItem.summary}</Typography></Box>
            </Box>
          )}
        </Box>
        {/* Mobile 감사 정보 */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
          {[
            [t('audit.auditId'), selectedItem.auditId],
            [t('audit.auditName'), selectedItem.auditName],
            [t('audit.auditType'), getAuditTypeLabel(selectedItem.auditType)],
            [t('audit.targetDept'), selectedItem.targetDept],
            [t('audit.auditor'), selectedItem.auditor],
            [t('audit.auditDate', '감사일'), selectedItem.auditDate],
            [t('audit.grade'), selectedItem.grade],
            [t('common.status'), getAuditStatusLabel(selectedItem.status)],
            ...(checklistTemplateId ? [
              [t('audit.checklistProgress'), `${selectedItem.completedChecklist}/${selectedItem.totalChecklist}`],
              [t('audit.findingCount'), String(selectedItem.findingCount)],
            ] : []),
            [t('audit.completionApprover', '완료 승인자'),
              selectedItem.completionApproverName
                ? `${selectedItem.completionApproverName}${selectedItem.completionApproverTeam ? ` (${selectedItem.completionApproverTeam})` : ''}`
                : ''],
            [t('audit.completionApprovedAt', '완료 승인일시'),
              selectedItem.completionApprovedAt ? selectedItem.completionApprovedAt.replace('T', ' ').substring(0, 16) : ''],
            [t('audit.summary', '요약'), selectedItem.summary],
          ].filter(([, v]) => v).map(([label, value], i) => (
            <Box key={i}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography>
              <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{value}</Typography>
            </Box>
          ))}
        </Box>

        {/* ===== 체크리스트 섹션 ===== */}
        {checklistTemplateId ? (
          <Box sx={{ mb: 3 }}>
            <SafetyChecklistTab ref={checklistRef} templateId={checklistTemplateId} embedded showSummary hideSignatures />
          </Box>
        ) : (
          <Paper sx={{ p: 3, bgcolor: 'grey.50', mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              {t('audit.noChecklistLinked', '연결된 체크리스트가 없습니다. 감사 계획에서 체크리스트를 연결하세요.')}
            </Typography>
          </Paper>
        )}

        {/* ===== 변경 이력 ===== */}
        {auditLogs && auditLogs.length > 0 && (
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
                  {auditLogs.map((log) => (
                    <TableRow key={log.id} hover sx={{ cursor: log.action === 'CHECKLIST_SAVE' ? 'pointer' : 'default' }} onClick={() => handleLogClick(log)}>
                      <TableCell sx={{ textAlign: 'center', fontSize: '0.8rem', fontFamily: 'monospace' }}>{log.createdAt?.replace('T', ' ').substring(0, 19)}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontSize: '0.85rem' }}>{log.changedBy || ''}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip size="small" label={actionLabel(log.action)} color={actionChipColor(log.action)} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{renderLogContent(log)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {/* Mobile 카드 */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              {auditLogs.map((log) => (
                <Paper key={log.id} sx={{ p: 2, border: 1, borderColor: 'grey.300', cursor: log.action === 'CHECKLIST_SAVE' ? 'pointer' : 'default' }} onClick={() => handleLogClick(log)}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{log.createdAt?.replace('T', ' ').substring(0, 19)}</Typography>
                    <Chip size="small" label={actionLabel(log.action)} color={actionChipColor(log.action)} />
                  </Box>
                  {log.changedBy && <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{t('common.modifiedBy', '수정자')}: {log.changedBy}</Typography>}
                  {renderLogContent(log)}
                </Paper>
              ))}
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
            {t('common.list')}
          </Button>
          {selectedItem.status !== 'COMPLETED' && (() => {
            const r = getRoles(selectedItem)
            const st = selectedItem.status
            return (
              <>
                {canSee(MENU, st === 'PENDING_CLOSE' ? 'PENDING_CLOSE' : st === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'PREPARING', '저장 (감사 정보)', r) && (
                  <Button variant="contained" color="primary" onClick={handleSave} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
                    {t('common.save')}
                  </Button>
                )}
                {st !== 'IN_PROGRESS' && st !== 'PENDING_CLOSE' && canSee(MENU, 'PREPARING', '진행중 (상태 전환)', r) && (
                  <Button variant="contained" color="info" onClick={() => handleStatusChange('IN_PROGRESS')} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
                    {t('audit.startProgress', '진행중')}
                  </Button>
                )}
                {st === 'IN_PROGRESS' && canSee(MENU, 'IN_PROGRESS', '완료 결재 상신', r) && (
                  <Button variant="contained" color="info" onClick={() => handleStatusChange('PENDING_CLOSE')} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
                    {t('audit.completionSubmit', '완료 결재 상신')}
                  </Button>
                )}
                {st === 'PENDING_CLOSE' && canSee(MENU, 'PENDING_CLOSE', '반려', r) && (
                  <Button variant="contained" color="warning"
                    onClick={() => setRejectDialogOpen(true)}
                    sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
                    {t('audit.reject', '반려')}
                  </Button>
                )}
                {st === 'PENDING_CLOSE' && canSee(MENU, 'PENDING_CLOSE', '완료 승인', r) && (
                  <Button variant="contained" color="success" onClick={() => handleStatusChange('COMPLETED')} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
                    {t('audit.completionApprove', '완료 승인')}
                  </Button>
                )}
              </>
            )
          })()}
        </Box>

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

  // ==================== CREATE / EDIT VIEW ====================
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <Box>
        {/* PC Form */}
        <Paper sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('audit.auditName')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.auditName} onChange={e => setForm({ ...form, auditName: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('audit.auditType')}</Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" value={form.auditType} onChange={e => setForm({ ...form, auditType: e.target.value as AuditRequest['auditType'] })}>
                {auditTypeCodes.map(c => <MenuItem key={c.code} value={c.code}>{getAuditTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('audit.targetDept')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.targetDept || ''} onChange={e => setForm({ ...form, targetDept: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('audit.auditor')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.auditor || ''} onChange={e => setForm({ ...form, auditor: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('audit.auditDate', '감사일')}</Typography>
            <Box sx={valBorderSx}><DatePickerField value={form.auditDate || ''} onChange={v => setForm({ ...form, auditDate: v })} size="small" /></Box>
            <Typography sx={labelSx}>{t('audit.grade')}</Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" displayEmpty value={form.grade || ''} onChange={e => setForm({ ...form, grade: (e.target.value || undefined) as AuditRequest['grade'] })}>
                <MenuItem value=""></MenuItem>
                <MenuItem value="S">S</MenuItem>
                <MenuItem value="A">A</MenuItem>
                <MenuItem value="B">B</MenuItem>
                <MenuItem value="C">C</MenuItem>
              </Select>
            </Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('common.status')}</Typography>
            <Box sx={valBorderSx}>
              <Select fullWidth size="small" value={form.status || 'PLAN'} onChange={e => setForm({ ...form, status: e.target.value as AuditRequest['status'] })}>
                {auditStatusCodes.map(c => <MenuItem key={c.code} value={c.code}>{getAuditStatusLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
            <Typography sx={labelSx}>{t('audit.completionApprover', '완료 승인자')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={{ ...valSx, display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <TextField size="small" sx={{ flex: 1, minWidth: 0 }} value={form.completionApproverName || ''} InputProps={{ readOnly: true }}
                placeholder={t('audit.selectCompletionApprover', '완료 승인자 선택')} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowCompletionApproverModal(true)}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('audit.planApprover', '계획 승인자')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={{ ...valBorderSx, display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField fullWidth size="small" value={form.planApproverName || ''} InputProps={{ readOnly: true }}
                placeholder={t('audit.selectPlanApprover', '계획 승인자 선택')} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowPlanApproverModal(true)}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
            <Typography sx={labelSx}>{t('audit.createdByName', '작성자')}</Typography>
            <Box sx={valSx}>
              <TextField fullWidth size="small" value={form.createdByName || ''} InputProps={{ readOnly: true }} />
            </Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('audit.summary', '요약')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" multiline minRows={2} value={form.summary || ''} onChange={e => setForm({ ...form, summary: e.target.value })} /></Box>
          </Box>
        </Paper>
        {/* Mobile Form */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('audit.auditName')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.auditName} onChange={e => setForm({ ...form, auditName: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('audit.auditType')}</Typography>
            <Select fullWidth size="small" value={form.auditType} onChange={e => setForm({ ...form, auditType: e.target.value as AuditRequest['auditType'] })}>
              {auditTypeCodes.map(c => <MenuItem key={c.code} value={c.code}>{getAuditTypeLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('audit.targetDept')}</Typography>
            <TextField size="small" fullWidth value={form.targetDept || ''} onChange={e => setForm({ ...form, targetDept: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('audit.auditor')}</Typography>
            <TextField size="small" fullWidth value={form.auditor || ''} onChange={e => setForm({ ...form, auditor: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('audit.auditDate', '감사일')}</Typography>
            <DatePickerField value={form.auditDate || ''} onChange={v => setForm({ ...form, auditDate: v })} size="small" />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('audit.grade')}</Typography>
            <Select fullWidth size="small" displayEmpty value={form.grade || ''} onChange={e => setForm({ ...form, grade: (e.target.value || undefined) as AuditRequest['grade'] })}>
              <MenuItem value=""></MenuItem><MenuItem value="S">S</MenuItem><MenuItem value="A">A</MenuItem><MenuItem value="B">B</MenuItem><MenuItem value="C">C</MenuItem>
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.status')}</Typography>
            <Select fullWidth size="small" value={form.status || 'PLAN'} onChange={e => setForm({ ...form, status: e.target.value as AuditRequest['status'] })}>
              {auditStatusCodes.map(c => <MenuItem key={c.code} value={c.code}>{getAuditStatusLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('audit.planApprover', '계획 승인자')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField size="small" fullWidth value={form.planApproverName || ''} InputProps={{ readOnly: true }}
                placeholder={t('audit.selectPlanApprover', '계획 승인자 선택')} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowPlanApproverModal(true)}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('audit.completionApprover', '완료 승인자')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField size="small" fullWidth value={form.completionApproverName || ''} InputProps={{ readOnly: true }}
                placeholder={t('audit.selectCompletionApprover', '완료 승인자 선택')} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowCompletionApproverModal(true)}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('audit.createdByName', '작성자')}
            </Typography>
            <TextField size="small" fullWidth value={form.createdByName || ''} InputProps={{ readOnly: true }} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('audit.summary', '요약')}</Typography>
            <TextField size="small" fullWidth multiline minRows={2} value={form.summary || ''} onChange={e => setForm({ ...form, summary: e.target.value })} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={() => viewMode === 'edit' ? setViewMode('detail') : handleBackToList()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save')}</Button>
        </Box>
        <UserSelectModal
          open={showCompletionApproverModal}
          onClose={() => setShowCompletionApproverModal(false)}
          selectedUsers={[]}
          singleSelect
          useCompanyTree
          onConfirm={(users) => {
            if (users.length > 0) {
              const u = users[0]
              setForm({
                ...form,
                completionApproverUserId: u.id,
                completionApproverTeam: u.department || '',
                completionApproverName: u.name,
              })
            }
            setShowCompletionApproverModal(false)
          }}
          title={t('audit.selectCompletionApprover', '완료 승인자 선택')}
        />
        <UserSelectModal
          open={showPlanApproverModal}
          onClose={() => setShowPlanApproverModal(false)}
          selectedUsers={[]}
          singleSelect
          useCompanyTree
          onConfirm={(users) => {
            if (users.length > 0) {
              const u = users[0]
              setForm(prev => ({
                ...prev,
                planApproverUserId: u.id,
                planApproverTeam: u.department || '',
                planApproverName: u.name,
              }))
            }
            setShowPlanApproverModal(false)
          }}
          title={t('audit.selectPlanApprover', '계획 승인자 선택')}
        />

        {/* 완료 결재 반려 사유 입력 다이얼로그 */}
        <RejectReasonDialog
          open={rejectDialogOpen}
          stage={t('audit.completionReject', '완료 결재 반려')}
          onClose={() => setRejectDialogOpen(false)}
          onConfirm={async (reason) => {
            if (!selectedItem) return
            try {
              await auditApi.reject(selectedItem.id, reason)
              const updated = await auditApi.getById(selectedItem.id)
              setSelectedItem(updated)
              invalidate()
              refetchLogs()
              setRejectDialogOpen(false)
              showSuccess(t('audit.rejected', '반려되었습니다.'))
            } catch (e: any) {
              showError(e?.response?.data?.message || t('common.error'))
            }
          }}
        />
      </Box>
    )
  }

  // ==================== LIST VIEW ====================
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {/* PC Search */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField size="small" placeholder={t('audit.searchPlaceholder')} value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setPage(0) }}
            sx={{ minWidth: 200 }} />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); setSearchText('') }}>
              <MenuItem value="">{t('audit.allStatus')}</MenuItem>
              {auditStatusCodes.map((c) => (
                <MenuItem key={c.code} value={c.code}>{getAuditStatusLabel(c.code)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
        </Box>
        {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>{t('common.new')}</Button>
        )}
      </Box>
      {/* Mobile Search */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
        <TextField size="small" fullWidth placeholder={t('audit.searchPlaceholder')} value={searchText}
          onChange={(e) => { setSearchText(e.target.value); setPage(0) }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <Select displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); setSearchText('') }}>
              <MenuItem value="">{t('audit.allStatus')}</MenuItem>
              {auditStatusCodes.map((c) => (
                <MenuItem key={c.code} value={c.code}>{getAuditStatusLabel(c.code)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>{t('common.new')}</Button>
          )}
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
              <Table size="small" stickyHeader sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headerCellSx}>{t('audit.auditId')}</TableCell>
                    <TableCell sx={headerCellSx}>{t('audit.auditName')}</TableCell>
                    <TableCell sx={headerCellSx}>{t('audit.targetDept')}</TableCell>
                    <TableCell sx={headerCellSx}>{t('audit.auditor')}</TableCell>
                    <TableCell sx={headerCellSx}>{t('audit.checklistProgress')}</TableCell>
                    <TableCell sx={headerCellSx}>{t('audit.findingCount')}</TableCell>
                    <TableCell sx={headerCellSx} align="center">{t('audit.completionApprover', '완료 승인자')}</TableCell>
                    <TableCell sx={headerCellSx} align="center">{t('common.modifiedAt', '수정일자')}</TableCell>
                    <TableCell sx={headerCellSx} align="center">{t('common.modifiedBy', '수정자')}</TableCell>
                    <TableCell sx={headerCellSx} align="center">{t('common.status')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => {
                    const progress = item.totalChecklist > 0 ? Math.round((item.completedChecklist / item.totalChecklist) * 100) : 0
                    return (
                      <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.auditId}</TableCell>
                        <TableCell><Typography fontWeight={600} variant="body2">{item.auditName}</Typography></TableCell>
                        <TableCell align="center">{item.targetDept || ''}</TableCell>
                        <TableCell align="center">{item.auditor || ''}</TableCell>
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
                        <TableCell align="center">
                          <Typography variant="body2">{item.findingCount}</Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.85rem' }}>
                          {item.completionApproverName || ''}
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                          {item.modifiedAt?.replace('T', ' ').substring(0, 16) || ''}
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.85rem' }}>
                          {item.modifiedBy || ''}
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={getAuditStatusLabel(item.status)} color={statusColors[item.status]} size="small" />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          {/* Mobile Card List */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
            {items.map((item) => {
              const progress = item.totalChecklist > 0 ? Math.round((item.completedChecklist / item.totalChecklist) * 100) : 0
              return (
                <Paper key={item.id} sx={{ p: 2, border: 1, borderColor: 'grey.300', cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography fontWeight="bold">{item.auditName}</Typography>
                    <Chip label={getAuditStatusLabel(item.status)} color={statusColors[item.status]} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {item.targetDept || ''} | {item.auditor || ''}
                  </Typography>
                  {item.totalChecklist > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="caption">{t('audit.checklistProgress')}</Typography>
                      <LinearProgress variant="determinate" value={progress} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
                      <Typography variant="caption" fontWeight="bold">{item.completedChecklist}/{item.totalChecklist}</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">{t('audit.findingCount')}:</Typography>
                    <Chip label={item.findingCount} size="small" color={item.findingCount > 0 ? 'error' : 'default'} />
                  </Box>
                </Paper>
              )
            })}
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

export default AuditExecutionTab
