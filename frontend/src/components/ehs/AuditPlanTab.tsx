import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, Select, MenuItem,
  FormControl, Chip, Pagination, CircularProgress, Alert, IconButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import DepartmentSelectModal from '../common/DepartmentSelectModal'
import DatePickerField from '../common/DatePickerField'
import RejectReasonDialog from '../common/RejectReasonDialog'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { auditPlanApi } from '../../api/auditApi'
import { fetchSafetyTemplates, fetchSafetyTemplateDetail } from '../../api/safetyChecklistApi'
import { SafetyChecklistTemplate, SafetyChecklistCategory, SafetyChecklistItem } from '../../types/safetyChecklist.types'
import { AuditPlan, AuditPlanRequest, AuditType } from '../../types/audit.types'
import useCodeMap from '../../hooks/useCodeMap'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const labelSx = {
  width: 140, minWidth: 140, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center',
}
const valueSx = { flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem' }
const valueBorderSx = { ...valueSx, borderRight: 1, borderColor: 'grey.300' }
const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

const emptyForm: AuditPlanRequest = {
  auditName: '',
  auditType: 'INTERNAL',
}

const ChecklistPreview: React.FC<{ templateId?: number | null }> = ({ templateId }) => {
  const { t } = useTranslation()
  const { data: detail, isLoading } = useQuery({
    queryKey: ['safetyTemplateDetail', templateId],
    queryFn: () => fetchSafetyTemplateDetail(templateId!),
    enabled: !!templateId,
  })

  if (!templateId) return null
  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={20} /></Box>
  }

  const title = detail?.templateName
  const description = detail?.description
  const categories: SafetyChecklistCategory[] = detail?.categories || []
  const totalItems = categories.reduce((sum, c) => sum + (c.items?.length || 0), 0)

  // RiskAssessment 의 renderChecklistInfo 와 동일한 라벨 셀 스타일
  const infoLabelSx = {
    width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100',
    px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300',
    display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center',
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
        {t('checklist.checklistInfo', '체크리스트 정보')}
      </Typography>
      <Paper sx={{ border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Box sx={infoLabelSx}>{t('common.title', '제목')}</Box>
          <Box sx={{ flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: title ? 'flex-start' : 'center' }}>
            <Typography variant="body2">{title || ''}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex' }}>
          <Box sx={infoLabelSx}>{t('common.description', '설명')}</Box>
          <Box sx={{ flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: description ? 'flex-start' : 'center' }}>
            <Typography variant="body2">{description || ''}</Typography>
          </Box>
        </Box>
      </Paper>

      {totalItems === 0 ? (
        <Alert severity="info">{t('audit.checklistEmpty', '체크리스트에 항목이 없습니다')}</Alert>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ overflowX: 'auto', border: 1, borderColor: 'grey.300' }}>
            <Table size="small" sx={{ '& td, & th': { borderRight: '1px solid', borderColor: 'grey.300', wordBreak: 'keep-all' } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold', width: 50, bgcolor: 'grey.100' }} align="center">No</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 160, bgcolor: 'grey.100' }} align="center">{t('audit.section', '구분')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 320, bgcolor: 'grey.100' }} align="center">{t('audit.itemText', '점검 항목')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 220, bgcolor: 'grey.100' }} align="center">{t('audit.legalRef', '법적 근거')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.flatMap((cat) =>
                  (cat.items || []).map((item: SafetyChecklistItem, idx: number) => (
                    <TableRow key={`${cat.id}-${item.id}`} hover>
                      <TableCell align="center">{idx + 1}</TableCell>
                      <TableCell>{cat.categoryName}</TableCell>
                      <TableCell sx={{ whiteSpace: 'pre-wrap' }}>{item.checkItem}</TableCell>
                      <TableCell sx={{ whiteSpace: 'pre-wrap' }}>{item.legalBasis || ''}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  )
}


const AuditPlanTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { user } = useAuth()
  const { codeList: auditTypeCodes, getLabel: getAuditTypeLabel } = useCodeMap('AUDIT_TYPE')
  const isAdmin = user?.role === 'SYSTEM_ADMIN' || user?.role === 'AUDIT_ADMIN' || user?.role === 'EHS_ADMIN'
  // 계획 승인 권한: admin 또는 지정된 plan_approver 본인만
  const canApprovePlan = (p: { planApproverUserId?: number | null; planApproverName?: string | null }) => {
    if (isAdmin) return true
    if (p.planApproverUserId && user?.id && p.planApproverUserId === user.id) return true
    if (p.planApproverName && user?.name && p.planApproverName === user.name) return true
    return false
  }

  // 감사 및 점검 체크리스트 목록
  const { data: allTemplates } = useQuery({
    queryKey: ['safetyTemplates', 'AUDIT'],
    queryFn: fetchSafetyTemplates,
  })
  const auditChecklists = (allTemplates || []).filter((t: SafetyChecklistTemplate) => t.categoryType === 'AUDIT')

  const [showAuditorModal, setShowAuditorModal] = useState(false)
  const [showDeptModal, setShowDeptModal] = useState(false)
  const [showPlanApproverModal, setShowPlanApproverModal] = useState(false)
  // 계획 결재 반려 사유 입력 다이얼로그
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [showCompletionApproverModal, setShowCompletionApproverModal] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<AuditPlan | null>(null)
  const [form, setForm] = useState<AuditPlanRequest>({ ...emptyForm })
  const [page, setPage] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const pageSize = 10

  const handleAuditorSelect = (users: UserInfo[]) => {
    const csv = users.map(u => u.name).join(', ')
    setForm({ ...form, auditorName: csv, auditor: csv })
    setShowAuditorModal(false)
  }
  const auditorCount = (form.auditorName || '').split(',').map(s => s.trim()).filter(Boolean).length

  const queryKey = ['auditPlans', page]
  const queryFn = () => auditPlanApi.getAll(page, pageSize)

  const { data, isLoading } = useQuery({ queryKey, queryFn, enabled: viewMode === 'list' })

  const createMutation = useMutation({
    mutationFn: (req: AuditPlanRequest) => auditPlanApi.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditPlans'] })
      queryClient.invalidateQueries({ queryKey: ['auditPlanStatus'] })
      showSuccess(t('common.saved'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: number; req: AuditPlanRequest }) => auditPlanApi.update(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditPlans'] })
      queryClient.invalidateQueries({ queryKey: ['auditPlanStatus'] })
      showSuccess(t('common.saved'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => auditPlanApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditPlans'] })
      queryClient.invalidateQueries({ queryKey: ['auditPlanStatus'] })
      showSuccess(t('common.deleted'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm({ ...emptyForm }) }
  const handleOpenCreate = () => {
    setSelectedItem(null)
    // 작성자(createdByName) 로그인 사용자 자동 입력
    setForm({
      ...emptyForm,
      createdByUserId: user?.id ?? null,
      createdByName: user?.name || '',
    })
    setViewMode('create')
  }
  const handleOpenDetail = (item: AuditPlan) => { setSelectedItem(item); setViewMode('detail') }
  const handleOpenEdit = (item?: AuditPlan) => {
    const target = item || selectedItem
    if (!target) return
    setSelectedItem(target)
    setForm({
      auditName: target.auditName, auditType: target.auditType,
      targetDept: target.targetDept, targetSite: target.targetSite,
      auditorName: target.auditorName || target.auditor || '',
      auditor: target.auditorName || target.auditor || '',
      auditorEmail: target.auditorEmail,
      personInCharge: target.personInCharge,
      planStartDate: target.planStartDate, planEndDate: target.planEndDate,
      purpose: target.purpose, checklistTemplateId: target.checklistTemplateId,
      planApproverUserId: target.planApproverUserId ?? null,
      planApproverTeam: target.planApproverTeam || '',
      planApproverPosition: target.planApproverPosition || '',
      planApproverName: target.planApproverName || '',
      completionApproverUserId: target.completionApproverUserId ?? null,
      completionApproverTeam: target.completionApproverTeam || '',
      completionApproverPosition: target.completionApproverPosition || '',
      completionApproverName: target.completionApproverName || '',
      createdByUserId: target.createdByUserId ?? null,
      createdByName: target.createdByName || '',
    })
    setViewMode('edit')
  }
  const validateRequired = (): string | null => {
    if (!form.auditName?.trim()) return t('audit.auditName')
    if (!form.checklistTemplateId) return t('audit.checklist', '체크리스트')
    if (!form.auditType) return t('audit.auditType')
    if (!form.targetDept?.trim()) return t('audit.targetDept')
    if (!form.auditorName?.trim()) return t('audit.auditor')
    if (!form.planStartDate) return t('audit.planStartDate')
    if (!form.planEndDate) return t('audit.planEndDate')
    if (!form.planApproverName?.trim()) return t('audit.planApprover', '계획 승인자')
    if (!form.completionApproverName?.trim()) return t('audit.completionApprover', '완료 승인자')
    return null
  }
  const handleSave = () => {
    const missing = validateRequired()
    if (missing) {
      showError(`${missing} ${t('common.required', '필수입니다')}`)
      return
    }
    if (selectedItem) updateMutation.mutate({ id: selectedItem.id, req: form })
    else createMutation.mutate(form)
  }
  const handleDelete = async (item: AuditPlan) => {
    const confirmed = await showConfirm(t('common.confirmDelete', '정말로 삭제하시겠습니까?'))
    if (confirmed) deleteMutation.mutate(item.id)
  }

  // 계획 결재 상신 — 작성자(or 작성중 상태) 가 결재 요청
  const handleSubmit = async () => {
    if (!selectedItem) return
    const confirmed = await showConfirm(t('audit.confirmSubmit', '계획 결재를 상신하시겠습니까?'))
    if (!confirmed) return
    try {
      const updated = await auditPlanApi.submit(selectedItem.id)
      queryClient.invalidateQueries({ queryKey: ['auditPlans'] })
      setSelectedItem(updated)
      showSuccess(t('audit.submitted', '결재 상신되었습니다.'))
    } catch {
      showError(t('common.error'))
    }
  }

  const handleApprove = async () => {
    if (!selectedItem) return
    if (!canApprovePlan(selectedItem)) {
      showError(t('audit.notPlanApprover', '지정된 계획 승인자만 승인할 수 있습니다.'))
      return
    }
    const confirmed = await showConfirm(t('common.confirmApprove', '승인 하시겠습니까?'))
    if (!confirmed) return
    try {
      const updated = await auditPlanApi.approve(selectedItem.id)
      queryClient.invalidateQueries({ queryKey: ['auditPlans'] })
      setSelectedItem(updated)
      showSuccess(t('audit.approved', '승인되었습니다.'))
    } catch {
      showError(t('common.error'))
    }
  }

  // 반려 — 다이얼로그 오픈만 (실제 실행은 handleRejectConfirm)
  const handleReject = () => {
    if (!selectedItem) return
    if (!canApprovePlan(selectedItem)) {
      showError(t('audit.notPlanApprover', '지정된 계획 승인자만 반려할 수 있습니다.'))
      return
    }
    setRejectDialogOpen(true)
  }
  const handleRejectConfirm = async (reason: string) => {
    if (!selectedItem) return
    try {
      const updated = await auditPlanApi.reject(selectedItem.id, reason)
      queryClient.invalidateQueries({ queryKey: ['auditPlans'] })
      setSelectedItem(updated)
      setRejectDialogOpen(false)
      showSuccess(t('audit.rejected', '반려되었습니다.'))
    } catch {
      showError(t('common.error'))
    }
  }

  // 감사 계획 목록 — 승인된 항목은 감사 실시 탭에서 표시되므로 여기서 숨김
  let items = (data?.content || []).filter((i) => !i.approved)
  const totalPages = data?.totalPages || 0

  if (searchText) {
    const s = searchText.toLowerCase()
    items = items.filter((i) =>
      i.auditName.toLowerCase().includes(s) ||
      i.planId?.toLowerCase().includes(s) ||
      i.auditor?.toLowerCase().includes(s) ||
      i.targetDept?.toLowerCase().includes(s)
    )
  }
  if (typeFilter) {
    items = items.filter((i) => i.auditType === typeFilter)
  }

  // ──────────────────── LIST VIEW ────────────────────
  if (viewMode === 'list') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* PC Search */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField size="small" placeholder={t('audit.searchPlaceholder')} value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setPage(0) }}
              sx={{ minWidth: 200 }} />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select displayEmpty value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('audit.allTypes')}</MenuItem>
                {auditTypeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getAuditTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <IconButton onClick={() => { setSearchText(''); setTypeFilter(''); setPage(0) }} size="small"><RefreshIcon /></IconButton>
          </Box>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>New</Button>
        </Box>
        {/* Mobile Search */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <TextField size="small" fullWidth placeholder={t('audit.searchPlaceholder')} value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setPage(0) }} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select displayEmpty value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('audit.allTypes')}</MenuItem>
                {auditTypeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getAuditTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ flex: 1 }}>New</Button>
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
                      <TableCell sx={headerCellSx}>{t('audit.planId')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('audit.auditName')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('audit.auditType')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('audit.targetDept')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('audit.planDate')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('audit.auditor')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('audit.creator', '작성자')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('audit.planApprover', '계획 승인자')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('common.status')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => {
                      const auditorList = (item.auditorName || item.auditor || '').split(',').map(s => s.trim()).filter(Boolean)
                      return (
                      <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleOpenDetail(item)}>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.planId}</TableCell>
                        <TableCell><Typography fontWeight={600} variant="body2">{item.auditName}</Typography></TableCell>
                        <TableCell align="center">{getAuditTypeLabel(item.auditType)}</TableCell>
                        <TableCell align="center">{item.targetDept || ''}</TableCell>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.planStartDate || ''}</TableCell>
                        <TableCell align="center">
                          {auditorList.length === 0
                            ? ''
                            : auditorList.length === 1
                              ? auditorList[0]
                              : `${auditorList[0]} 외 ${auditorList.length - 1}명`}
                        </TableCell>
                        <TableCell align="center">{item.createdByName || ''}</TableCell>
                        <TableCell align="center">{item.planApproverName || ''}</TableCell>
                        <TableCell align="center">
                          {(() => {
                            if (item.approved) {
                              return <Chip label={t('audit.planApprove', '계획 승인')} color="success" size="small" />
                            }
                            if (item.status === 'PENDING_APPROVAL') {
                              return <Chip label={t('audit.submitApproval', '계획 결재 상신')} color="info" size="small" />
                            }
                            return <Chip label={t('audit.statusDraft', '작성중')} color="default" size="small" />
                          })()}
                        </TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
            {/* Mobile Card List */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              {items.map((item) => (
                <Paper key={item.id} sx={{ p: 2, border: 1, borderColor: 'grey.300', cursor: 'pointer' }} onClick={() => handleOpenDetail(item)}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography fontWeight="bold">{item.auditName}</Typography>
                    {(() => {
                      if (item.approved) {
                        return <Chip label={t('audit.planApprove', '계획 승인')} color="success" size="small" />
                      }
                      if (item.status === 'PENDING_APPROVAL') {
                        return <Chip label={t('audit.submitApproval', '계획 결재 상신')} color="info" size="small" />
                      }
                      return <Chip label={t('audit.statusDraft', '작성중')} color="default" size="small" />
                    })()}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {getAuditTypeLabel(item.auditType)} | {item.targetDept || ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.auditor || ''} | {item.planStartDate || ''}
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
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {/* 반려 사유 배너 — 미승인 + rejectReason 있을 때 (반려로 작성 단계 복귀) */}
          {!selectedItem.approved && selectedItem.rejectReason && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'error.lighter', border: 1, borderColor: 'error.light', borderRadius: 1 }}>
              <Typography variant="body2" color="error.main" fontWeight="bold" sx={{ mb: 0.5 }}>
                {t('common.rejectReasonTitle', '반려 사유')}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedItem.rejectReason}</Typography>
            </Box>
          )}
          {/* PC Detail */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('audit.planId')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" fontFamily="monospace">{selectedItem.planId}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('audit.auditName')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" fontWeight={600}>{selectedItem.auditName}</Typography>
              </Box>
              <Typography sx={labelSx}>{t('audit.auditType')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{getAuditTypeLabel(selectedItem.auditType)}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('audit.targetDept')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{selectedItem.targetDept || ''}</Typography>
              </Box>
              <Typography sx={labelSx}>{t('audit.targetSite')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{selectedItem.targetSite || ''}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('audit.auditor')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                {(() => {
                  const list = (selectedItem.auditorName || selectedItem.auditor || '').split(',').map(s => s.trim()).filter(Boolean)
                  return (
                    <Typography variant="body2">
                      {list.length === 0 ? '' : `${list.join(', ')} (${list.length}${t('audit.persons', '명')})`}
                    </Typography>
                  )
                })()}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('audit.planDate')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" fontFamily="monospace">{selectedItem.planStartDate || ''} ~ {selectedItem.planEndDate || ''}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('audit.purpose')}</Typography>
              <Box sx={valueSx}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedItem.purpose || ''}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('audit.checklist', '체크리스트')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">
                  {selectedItem.checklistTemplateId
                    ? auditChecklists.find((t: SafetyChecklistTemplate) => t.id === selectedItem.checklistTemplateId)?.templateName || ''
                    : t('audit.noChecklist', '미연결')}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('audit.planApprover', '계획 승인자')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
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
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
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
            <Box sx={{ display: 'flex' }}>
              <Typography sx={labelSx}>{t('audit.creator', '작성자')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{selectedItem.createdByName || ''}</Typography>
              </Box>
              <Typography sx={labelSx}>{t('audit.createdAt', '작성일시')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" fontFamily="monospace">
                  {selectedItem.createdAt ? selectedItem.createdAt.replace('T', ' ').substring(0, 16) : ''}
                </Typography>
              </Box>
            </Box>
          </Box>
          {/* Mobile Detail */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
            {[
              [t('audit.planId'), selectedItem.planId],
              [t('audit.auditName'), selectedItem.auditName],
              [t('audit.auditType'), getAuditTypeLabel(selectedItem.auditType)],
              [t('audit.targetDept'), selectedItem.targetDept || ''],
              [t('audit.targetSite'), selectedItem.targetSite || ''],
              [t('audit.auditor'), selectedItem.auditor || ''],
              [t('audit.personInCharge', '담당자'), selectedItem.personInCharge || ''],
              [t('audit.planDate'), `${selectedItem.planStartDate || ''} ~ ${selectedItem.planEndDate || ''}`],
              [t('audit.purpose'), selectedItem.purpose || ''],
              [t('audit.planApprover', '계획 승인자'),
                selectedItem.planApproverName
                  ? `${selectedItem.planApproverName}${selectedItem.planApproverTeam ? ` (${selectedItem.planApproverTeam})` : ''}`
                  : ''],
              [t('audit.planApprovedAt', '계획 승인일시'),
                selectedItem.planApprovedAt ? selectedItem.planApprovedAt.replace('T', ' ').substring(0, 16) : ''],
            ].map(([label, value], i) => (
              <Box key={i}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>{value}</Typography>
              </Box>
            ))}
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('audit.checklist', '체크리스트')}</Typography>
              <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>
                {selectedItem.checklistTemplateId
                  ? auditChecklists.find((tpl: SafetyChecklistTemplate) => tpl.id === selectedItem.checklistTemplateId)?.templateName || ''
                  : t('audit.noChecklist', '미연결')}
              </Typography>
            </Box>
          </Box>

        {/* 체크리스트 정보 + 항목 미리보기 (PC/모바일 공통, 풀폭) */}
        <ChecklistPreview templateId={selectedItem.checklistTemplateId} />

        <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
            {t('common.list')}
          </Button>
          {/* 계획 결재 상신 — 작성중(PLAN) 상태에서 작성자/일반 사용자가 결재 요청 */}
          {!selectedItem.approved && (selectedItem.status === 'PLAN' || !selectedItem.status) && (
            <Button variant="contained" color="info"
              onClick={handleSubmit}
              sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
              {t('audit.planSubmit', '계획 결재 상신')}
            </Button>
          )}
          {/* 계획 반려 / 계획 승인 — PENDING_APPROVAL 상태 + 지정된 승인자/admin */}
          {!selectedItem.approved && selectedItem.status === 'PENDING_APPROVAL' && canApprovePlan(selectedItem) && (
            <>
              <Button variant="contained" color="warning" onClick={handleReject} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
                {t('audit.reject', '반려')}
              </Button>
              <Button variant="contained" color="success" onClick={handleApprove} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
                {t('audit.planApprove', '계획 승인')}
              </Button>
            </>
          )}
          {/* 수정 / 삭제 — 작성중(PLAN) 상태에서만 (결재 진행/승인 후 차단) */}
          {!selectedItem.approved && (selectedItem.status === 'PLAN' || !selectedItem.status) && (
            <>
              <Button variant="contained" color="primary" onClick={() => handleOpenEdit()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
                {t('common.edit')}
              </Button>
              <Button variant="contained" color="error" onClick={() => handleDelete(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
                {t('common.delete')}
              </Button>
            </>
          )}
        </Box>
        {/* 계획 결재 반려 사유 입력 다이얼로그 */}
        <RejectReasonDialog
          open={rejectDialogOpen}
          stage={t('audit.planReject', '계획 결재 반려')}
          onClose={() => setRejectDialogOpen(false)}
          onConfirm={handleRejectConfirm}
        />
      </Box>
    )
  }

  // ──────────────────── CREATE / EDIT VIEW ────────────────────
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* PC Form */}
        <Paper sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>{t('audit.auditName')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valueBorderSx}>
              <TextField fullWidth size="small" value={form.auditName} onChange={(e) => setForm({ ...form, auditName: e.target.value })} />
            </Box>
            <Typography sx={labelSx}>{t('audit.auditType')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valueSx}>
              <Select fullWidth size="small" value={form.auditType} onChange={(e) => setForm({ ...form, auditType: e.target.value as AuditType })}>
                {auditTypeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getAuditTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>
              {t('audit.targetDept')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={{ ...valueBorderSx, display: 'flex', gap: 1 }}>
              <TextField fullWidth size="small" value={form.targetDept || ''} InputProps={{ readOnly: true }}
                placeholder={t('audit.selectTargetDept', '부서 선택')} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowDeptModal(true)}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
            <Typography sx={labelSx}>{t('audit.targetSite')}</Typography>
            <Box sx={valueSx}>
              <TextField fullWidth size="small" value={form.targetSite || ''} onChange={(e) => setForm({ ...form, targetSite: e.target.value })} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>
              {t('audit.auditor')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={{ ...valueSx, display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField fullWidth size="small" value={form.auditorName || ''} InputProps={{ readOnly: true }}
                placeholder={t('audit.selectAuditors', '감사원 선택')} />
              {auditorCount > 0 && (
                <Chip size="small" color="primary" label={`${auditorCount}${t('audit.persons', '명')}`} />
              )}
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowAuditorModal(true)}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>{t('audit.planStartDate')}</Typography>
            <Box sx={valueBorderSx}>
              <DatePickerField value={form.planStartDate || null} onChange={(v) => setForm({ ...form, planStartDate: v })} size="small" maxDate={form.planEndDate} />
            </Box>
            <Typography sx={labelSx}>{t('audit.planEndDate')}</Typography>
            <Box sx={valueSx}>
              <DatePickerField value={form.planEndDate || null} onChange={(v) => setForm({ ...form, planEndDate: v })} size="small" minDate={form.planStartDate} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>{t('audit.purpose')}</Typography>
            <Box sx={valueSx}>
              <TextField fullWidth size="small" multiline rows={3} value={form.purpose || ''} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>
              {t('audit.planApprover', '계획 승인자')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={{ ...valueBorderSx, display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField fullWidth size="small" value={form.planApproverName || ''} InputProps={{ readOnly: true }}
                placeholder={t('audit.selectPlanApprover', '계획 승인자 선택')} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowPlanApproverModal(true)}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
            <Typography sx={labelSx}>
              {t('audit.completionApprover', '완료 승인자')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={{ ...valueSx, display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField fullWidth size="small" value={form.completionApproverName || ''} InputProps={{ readOnly: true }}
                placeholder={t('audit.selectCompletionApprover', '완료 승인자 선택')} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowCompletionApproverModal(true)}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>{t('audit.createdByName', '작성자')}</Typography>
            <Box sx={valueSx}>
              <TextField fullWidth size="small" value={form.createdByName || ''} InputProps={{ readOnly: true }} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Typography sx={labelSx}>{t('audit.checklist', '체크리스트')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valueSx}>
              <Select fullWidth size="small" displayEmpty value={form.checklistTemplateId || ''} onChange={(e) => setForm({ ...form, checklistTemplateId: e.target.value ? Number(e.target.value) : undefined })}>
                <MenuItem value="">{t('audit.noChecklist', '체크리스트 미연결')}</MenuItem>
                {auditChecklists.map((tpl: SafetyChecklistTemplate) => (
                  <MenuItem key={tpl.id} value={tpl.id}>{tpl.templateName} ({tpl.itemCount || 0}{t('audit.itemCountSuffix', '개 항목')})</MenuItem>
                ))}
              </Select>
            </Box>
          </Box>
        </Paper>

        {/* Mobile Form */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('audit.auditName')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.auditName} onChange={(e) => setForm({ ...form, auditName: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('audit.auditType')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <FormControl fullWidth size="small">
              <Select value={form.auditType} onChange={(e) => setForm({ ...form, auditType: e.target.value as AuditType })}>
                {auditTypeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getAuditTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('audit.targetDept')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" fullWidth value={form.targetDept || ''} InputProps={{ readOnly: true }} placeholder={t('audit.selectTargetDept', '부서 선택')} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowDeptModal(true)}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('audit.targetSite')}</Typography>
            <TextField size="small" fullWidth value={form.targetSite || ''} onChange={(e) => setForm({ ...form, targetSite: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('audit.auditor')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField size="small" fullWidth value={form.auditorName || ''} InputProps={{ readOnly: true }} placeholder={t('audit.selectAuditors', '감사원 선택')} />
              {auditorCount > 0 && <Chip size="small" color="primary" label={`${auditorCount}${t('audit.persons', '명')}`} />}
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowAuditorModal(true)}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <DatePickerField value={form.planStartDate || null} onChange={(v) => setForm({ ...form, planStartDate: v })} size="small" label={t('audit.planStartDate')} maxDate={form.planEndDate} />
          <DatePickerField value={form.planEndDate || null} onChange={(v) => setForm({ ...form, planEndDate: v })} size="small" label={t('audit.planEndDate')} minDate={form.planStartDate} />
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('audit.purpose')}</Typography>
            <TextField size="small" fullWidth multiline rows={3} value={form.purpose || ''} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('audit.checklist', '체크리스트')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Select fullWidth size="small" displayEmpty value={form.checklistTemplateId || ''} onChange={(e) => setForm({ ...form, checklistTemplateId: e.target.value ? Number(e.target.value) : undefined })}>
              <MenuItem value="">{t('audit.noChecklist', '체크리스트 미연결')}</MenuItem>
              {auditChecklists.map((tpl: SafetyChecklistTemplate) => (
                <MenuItem key={tpl.id} value={tpl.id}>{tpl.templateName} ({tpl.itemCount || 0}{t('audit.itemCountSuffix', '개 항목')})</MenuItem>
              ))}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('audit.planApprover', '계획 승인자')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField size="small" fullWidth value={form.planApproverName || ''} InputProps={{ readOnly: true }} placeholder={t('audit.selectPlanApprover', '계획 승인자 선택')} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowPlanApproverModal(true)}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('audit.completionApprover', '완료 승인자')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField size="small" fullWidth value={form.completionApproverName || ''} InputProps={{ readOnly: true }} placeholder={t('audit.selectCompletionApprover', '완료 승인자 선택')} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowCompletionApproverModal(true)}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('audit.createdByName', '작성자')}
            </Typography>
            <TextField size="small" fullWidth value={form.createdByName || ''} InputProps={{ readOnly: true }} />
          </Box>
        </Box>

        {/* 체크리스트 정보 + 항목 미리보기 (PC/모바일 공통, 풀폭) */}
        <ChecklistPreview templateId={form.checklistTemplateId} />

        <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={() => viewMode === 'edit' ? setViewMode('detail') : handleBackToList()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save')}</Button>
        </Box>
        <UserSelectModal
          open={showAuditorModal}
          onClose={() => setShowAuditorModal(false)}
          selectedUsers={[]}
          onConfirm={handleAuditorSelect}
          useCompanyTree
          title={t('audit.selectAuditors', '감사원 선택')}
        />
        <DepartmentSelectModal
          open={showDeptModal}
          onClose={() => setShowDeptModal(false)}
          onConfirm={(deptName) => { setForm({ ...form, targetDept: deptName }); setShowDeptModal(false) }}
          initialDepartment={form.targetDept || ''}
          title={t('audit.selectTargetDept', '부서 선택')}
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
              setForm({
                ...form,
                planApproverUserId: u.id,
                planApproverTeam: u.department || '',
                planApproverName: u.name,
              })
            }
            setShowPlanApproverModal(false)
          }}
          title={t('audit.selectPlanApprover', '계획 승인자 선택')}
        />
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
      </Box>
    )
  }

  return null
}

export default AuditPlanTab
