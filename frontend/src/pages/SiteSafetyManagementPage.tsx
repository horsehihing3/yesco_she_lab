import React, { useState, useEffect, useMemo, useRef } from 'react'
import { fmtPhone } from '../utils/phoneFormat'
import { todayStr, weekFromTodayStr } from '../utils/dateDefaults'
import ReadTextField from '../components/common/ReadTextField'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, Select, MenuItem, FormControl,
  Chip, Pagination, CircularProgress, Alert, Tabs, Tab, IconButton,
  Stack, Tooltip,
} from '@mui/material'
import ListSearchBar from '../components/common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import CloseIcon from '@mui/icons-material/Close'
import { itemAttachmentApi } from '../api/itemAttachmentApi'
import type { FileMetadata } from '../types/file.types'
import DatePickerField from '../components/common/DatePickerField'
import NumberField from '../components/common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../components/common/FormTable'
import UserSelectModal, { UserInfo } from '../components/common/UserSelectModal'
import DeptUserMultiSelectModal from '../components/common/DeptUserMultiSelectModal'
import { useAlert } from '../contexts/AlertContext'
import { useAuth } from '../context/AuthContext'
import { useMenuRule } from '../hooks/useMenuRule'
import { useButtonRules } from '../hooks/useButtonRules'
import { siteSafetyPlanApi } from '../api/siteSafetyApi'
import type { SiteSafetyPlan, SiteSafetyPlanRequest } from '../types/siteSafety.types'
import { fetchSafetyTemplates } from '../api/safetyChecklistApi'
import type { SafetyChecklistTemplate } from '../types/safetyChecklist.types'
import SafetyChecklistTab from '../components/ehs/SafetyChecklistTab'
import SiteSafetyReportTab from '../components/siteSafety/SiteSafetyReportTab'
import SiteSafetyDashboardTab from '../components/siteSafety/SiteSafetyDashboardTab'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'
type Mode = 'plan' | 'approval' | 'admin'
type PlanType = 'INTERNAL' | 'PARTNER'

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  DRAFT: 'default', PENDING_APPROVAL: 'warning', APPROVED: 'info', COMPLETION_PENDING: 'warning', DONE: 'success', REJECTED: 'error',
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '작성중', PENDING_APPROVAL: '결재대기', APPROVED: '승인', COMPLETION_PENDING: '완료결재대기', DONE: '완료', REJECTED: '반려',
}

const RISK_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  LOW: 'success', MEDIUM: 'warning', HIGH: 'error', CRITICAL: 'error',
}

const WORK_TYPES = ['유지보수', '공사', '점검', '청소', '기타']
const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const RISK_LABEL: Record<string, string> = { LOW: '낮음', MEDIUM: '중간', HIGH: '높음', CRITICAL: '심각' }

// 현장 안전 계획 첨부파일 entity type
const SITE_SAFETY_PLAN_ENTITY_TYPE = 'SITE_SAFETY_PLAN'

// ===================================================================
// Plan content (used by all 3 modes / planType: INTERNAL or PARTNER)
// ===================================================================
export const SiteSafetyPlanContent: React.FC<{ mode: Mode; planType?: PlanType }> = ({ mode, planType = 'INTERNAL' }) => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { user } = useAuth()

  const isApprovalMode = mode === 'approval'
  const isAdminMode = mode === 'admin'
  const isPartner = planType === 'PARTNER'

  const { canSee } = useButtonRules()
  const BUTTON_MENU = isPartner ? '협력업체 › 협력업체 안전 관리 › 관리' : ''
  const normName = (s?: string | null) => (s || '').trim()
  const getItemRoles = (item: SiteSafetyPlan): string[] => {
    const roles: string[] = ['guest']
    if (user?.role === 'SYSTEM_ADMIN') roles.push('superAdmin')
    if (normName(item.modifiedBy) && normName(item.modifiedBy) === normName(user?.name || user?.username)) roles.push('writer')
    if ((item.planApproverUserId && item.planApproverUserId === user?.id) ||
        (item.planApproverName && normName(item.planApproverName) === normName(user?.name))) roles.push('planApprover')
    if ((item.completionApproverUserId && item.completionApproverUserId === user?.id) ||
        (item.completionApproverName && normName(item.completionApproverName) === normName(user?.name))) roles.push('completionApprover')
    return roles
  }

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<SiteSafetyPlan | null>(null)
  const [page, setPage] = useState(0)
  const [searchTextInput, setSearchTextInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const applySearch = () => setSearchText(searchTextInput)
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState<SiteSafetyPlanRequest>({ title: '' })
  const [workers, setWorkers] = useState<Array<{ workerName: string; companyName: string; workerPhone: string }>>([])
  // 첨부파일 — 신규 선택(pending) + 삭제 예정(markedDeletes)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [markedDeleteIds, setMarkedDeleteIds] = useState<number[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [templates, setTemplates] = useState<SafetyChecklistTemplate[]>([])
  const [approverPickTarget, setApproverPickTarget] = useState<'plan' | 'completion' | null>(null)
  const [showWorkerUserModal, setShowWorkerUserModal] = useState(false)

  useEffect(() => {
    fetchSafetyTemplates().then(setTemplates).catch(() => {})
  }, [])

  const queryKey = ['siteSafety', planType, mode, statusFilter, page]
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => {
      // 조회(admin) 탭은 완료(DONE) 항목만 노출
      if (isAdminMode) return siteSafetyPlanApi.getByStatus('DONE', page, 10, planType)
      return statusFilter
        ? siteSafetyPlanApi.getByStatus(statusFilter, page, 10, planType)
        : siteSafetyPlanApi.getAll(page, 10, planType)
    },
    enabled: viewMode === 'list',
  })

  const { data: detailWorkers } = useQuery({
    queryKey: ['siteSafetyWorkers', selected?.id],
    queryFn: () => siteSafetyPlanApi.getWorkers(selected!.id),
    enabled: !!selected?.id && viewMode === 'detail',
  })

  // 첨부파일 — 상세 + 수정 모드에서 기존 파일 조회
  const { data: attachments = [] } = useQuery<FileMetadata[]>({
    queryKey: ['siteSafetyAttachments', selected?.id],
    queryFn: () => itemAttachmentApi.list(SITE_SAFETY_PLAN_ENTITY_TYPE, selected!.id),
    enabled: !!selected?.id && (viewMode === 'detail' || viewMode === 'edit'),
  })

  // 저장 성공 후 첨부파일 일괄 처리 (생성/수정 공용)
  const flushAttachments = async (planId: number) => {
    // 1) 삭제 예정
    for (const fid of markedDeleteIds) {
      try { await itemAttachmentApi.remove(fid) } catch { /* skip */ }
    }
    // 2) 신규 업로드
    for (const f of pendingFiles) {
      try { await itemAttachmentApi.upload(SITE_SAFETY_PLAN_ENTITY_TYPE, planId, f) } catch { /* skip */ }
    }
    setPendingFiles([])
    setMarkedDeleteIds([])
    qc.invalidateQueries({ queryKey: ['siteSafetyAttachments', planId] })
  }

  const createMut = useMutation({
    mutationFn: (req: SiteSafetyPlanRequest) => siteSafetyPlanApi.create(req),
    onSuccess: async (created) => {
      if (created?.id && workers.length > 0) {
        for (const w of workers) {
          await siteSafetyPlanApi.addWorker(created.id, { workerName: w.workerName, companyName: w.companyName, workerPhone: w.workerPhone })
        }
      }
      if (created?.id) await flushAttachments(created.id)
      qc.invalidateQueries({ queryKey: ['siteSafety'] })
      showSuccess(t('common.saved', '저장되었습니다.'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, req }: { id: number; req: SiteSafetyPlanRequest }) => siteSafetyPlanApi.update(id, req),
    onSuccess: async (updated) => {
      if (updated?.id && workers.length > 0) {
        await siteSafetyPlanApi.deleteWorkers(updated.id)
        for (const w of workers) {
          await siteSafetyPlanApi.addWorker(updated.id, { workerName: w.workerName, companyName: w.companyName, workerPhone: w.workerPhone })
        }
      }
      if (updated?.id) await flushAttachments(updated.id)
      qc.invalidateQueries({ queryKey: ['siteSafety'] })
      showSuccess(t('common.saved', '저장되었습니다.'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const transitionMut = useMutation({
    mutationFn: ({ id, action, rejectReason }: { id: number; action: 'submit' | 'approve' | 'reject' | 'completionSubmit' | 'complete'; rejectReason?: string }) =>
      siteSafetyPlanApi.transition(id, action, rejectReason),
    onSuccess: (_updated, variables) => {
      qc.invalidateQueries({ queryKey: ['siteSafety'] })
      qc.invalidateQueries({ queryKey: ['partnerSafetyExecuteList'] })
      showSuccess('처리되었습니다.')
      // 승인·반려·완료 등 결재 액션 이후에는 목록으로 복귀 (상세에 남으면 상태 불일치 혼선)
      if (['submit', 'approve', 'reject', 'completionSubmit', 'complete'].includes(variables.action)) {
        handleBackToList()
      } else {
        setSelected(_updated)
      }
    },
    onError: (err: any) => showError(err?.response?.data?.message || t('common.error')),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => siteSafetyPlanApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['siteSafety'] })
      showSuccess(t('common.deleted', '삭제되었습니다.'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const handleBackToList = () => {
    setViewMode('list')
    setSelected(null)
    setForm({ title: '' })
    setWorkers([])
    setPendingFiles([])
    setMarkedDeleteIds([])
  }

  const handleRowClick = (item: SiteSafetyPlan) => {
    setSelected(item)
    setViewMode('detail')
  }

  const handleOpenCreate = () => {
    setSelected(null)
    const dateDefaults = { workStartDate: todayStr(), workEndDate: weekFromTodayStr() }
    setForm(isPartner
      ? { title: '', modifiedBy: user?.name || user?.username || '', ...dateDefaults }
      : { title: '', ...dateDefaults })
    setWorkers([])
    setViewMode('create')
  }

  const handleOpenEdit = async (item: SiteSafetyPlan) => {
    setSelected(item)
    setForm({
      title: item.title, workType: item.workType, riskLevel: item.riskLevel,
      workLocation: item.workLocation, workersCount: item.workersCount,
      workStartDate: item.workStartDate, workEndDate: item.workEndDate,
      workDescription: item.workDescription, safetyMeasures: item.safetyMeasures,
      requiredPpe: item.requiredPpe, hazardFactors: item.hazardFactors,
      emergencyContact: item.emergencyContact, notes: item.notes,
      checklistTemplateId: item.checklistTemplateId,
      planApproverUserId: item.planApproverUserId,
      planApproverTeam: item.planApproverTeam || '',
      planApproverPosition: item.planApproverPosition || '',
      planApproverName: item.planApproverName || '',
      completionApproverUserId: item.completionApproverUserId,
      completionApproverTeam: item.completionApproverTeam || '',
      completionApproverPosition: item.completionApproverPosition || '',
      completionApproverName: item.completionApproverName || '',
    })
    if (item.id) {
      try {
        const ws = await siteSafetyPlanApi.getWorkers(item.id)
        setWorkers((ws || []).map(w => ({ workerName: w.workerName, companyName: w.companyName || '', workerPhone: w.workerPhone || '' })))
      } catch { setWorkers([]) }
    }
    setViewMode('edit')
  }

  const handleSave = () => {
    if (isPartner) {
      if (!form.checklistTemplateId) { showError('체크리스트를 선택해 주세요.'); return }
      const tpl = templates.find(t => t.id === form.checklistTemplateId)
      const autoTitle = tpl?.templateName || '협력업체 안전 점검'
      const payload = {
        ...form,
        planType,
        title: autoTitle,
        modifiedBy: form.modifiedBy || user?.name || user?.username || '',
      }
      if (selected) updateMut.mutate({ id: selected.id, req: payload })
      else createMut.mutate(payload)
      return
    }
    if (!form.title) { showError('제목을 입력해 주세요.'); return }
    if (!form.checklistTemplateId) { showError('체크리스트를 선택해 주세요.'); return }
    const payload = { ...form, planType }
    if (selected) updateMut.mutate({ id: selected.id, req: payload })
    else createMut.mutate(payload)
  }

  const handleDelete = async (item: SiteSafetyPlan) => {
    if (await showConfirm(t('common.confirmDelete', '정말로 삭제하시겠습니까?'))) {
      deleteMut.mutate(item.id)
    }
  }

  const handleUserSelect = (users: UserInfo[]) => {
    if (users[0]) {
      const u = users[0]
      if (approverPickTarget === 'plan') {
        setForm(f => ({
          ...f, planApproverUserId: u.id, planApproverName: u.name,
          planApproverTeam: u.department || '', planApproverPosition: '',
        }))
      } else if (approverPickTarget === 'completion') {
        setForm(f => ({
          ...f, completionApproverUserId: u.id, completionApproverName: u.name,
          completionApproverTeam: u.department || '', completionApproverPosition: '',
        }))
      }
    }
    setApproverPickTarget(null)
  }

  const handleWorkerUserSelect = (users: UserInfo[]) => {
    setWorkers(prev => [...prev, ...users.map(u => ({ workerName: u.name, companyName: u.department || '내부직원', workerPhone: '' }))])
    setShowWorkerUserModal(false)
  }

  const filteredItems = useMemo(() => {
    let items = data?.content || []
    if (searchText) {
      const s = searchText.toLowerCase()
      items = items.filter(i =>
        i.title?.toLowerCase().includes(s) ||
        i.planId?.toLowerCase().includes(s) ||
        i.modifiedBy?.toLowerCase().includes(s),
      )
    }
    if (isApprovalMode) {
      // 평가서조회: 결재 진행중·완료된 항목만
      items = items.filter(i => ['PENDING_APPROVAL', 'APPROVED', 'DONE', 'REJECTED'].includes(i.status))
    }
    if (mode === 'plan') {
      // 관리 탭: 계획 결재 승인 이후(APPROVED) / 완료결재대기(COMPLETION_PENDING) / 완료(DONE) 항목 숨김 — 실행·조회 탭에서 처리
      items = items.filter(i => i.status !== 'APPROVED' && i.status !== 'COMPLETION_PENDING' && i.status !== 'DONE')
    }
    return items
  }, [data, searchText, isApprovalMode, mode])

  // ============== LIST VIEW ==============
  if (viewMode === 'list') {
    return (
      <Box>
        {/* ─── 데스크탑(md+) 헤더 ─── */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1.5, mb: 2, alignItems: 'center' }}>
          <ListSearchBar sx={{ width: 320 }} placeholder="제목/계획번호/작성자 검색..." value={searchTextInput} onChange={setSearchTextInput} onSearch={applySearch} />
          <TextField select size="small" sx={{ width: 140 }} label="상태"
            value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}>
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="DRAFT">작성중</MenuItem>
            <MenuItem value="PENDING_APPROVAL">결재대기</MenuItem>
            <MenuItem value="REJECTED">반려</MenuItem>
          </TextField>
          <IconButton size="small" onClick={() => qc.invalidateQueries({ queryKey: ['siteSafety'] })}><RefreshIcon /></IconButton>
          <Box sx={{ flex: 1 }} />
          {mode === 'plan' && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>New</Button>
          )}
        </Box>

        {/* ─── 모바일(xs/sm) 헤더 ─── */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField size="small" fullWidth placeholder="제목/계획번호/작성자 검색..."
              value={searchText} onChange={e => setSearchText(e.target.value)} />
            <IconButton size="small" onClick={() => qc.invalidateQueries({ queryKey: ['siteSafety'] })}
              sx={{ border: 1, borderColor: 'divider', borderRadius: 1, flexShrink: 0 }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Box>
          <TextField select size="small" fullWidth label="상태"
            value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}>
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="DRAFT">작성중</MenuItem>
            <MenuItem value="PENDING_APPROVAL">결재대기</MenuItem>
            <MenuItem value="REJECTED">반려</MenuItem>
          </TextField>
          {mode === 'plan' && (
            <Button variant="contained" fullWidth startIcon={<AddIcon />} onClick={handleOpenCreate}>New</Button>
          )}
        </Box>

        {isLoading ? (
          <Paper variant="outlined" sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Paper>
        ) : (
          <>
            {/* ─── 데스크탑(md+) : 테이블 ─── */}
            <Paper variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}>
              {isPartner ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell align="center">번호</TableCell>
                        <TableCell>체크리스트</TableCell>
                        <TableCell align="center">작성자</TableCell>
                        <TableCell align="center">작성일</TableCell>
                        <TableCell align="center">상태</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredItems.map(item => (
                        <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>{item.planId}</TableCell>
                          <TableCell>{item.title || '-'}</TableCell>
                          <TableCell align="center">{item.modifiedBy || '-'}</TableCell>
                          <TableCell align="center">{item.createdAt ? item.createdAt.slice(0, 10) : '-'}</TableCell>
                          <TableCell align="center">
                            <Chip size="small" label={STATUS_LABEL[item.status] || item.status} color={STATUS_COLORS[item.status] || 'default'} />
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredItems.length === 0 && (
                        <TableRow><TableCell colSpan={5} align="center" sx={{ color: 'text.disabled', py: 6 }}>등록된 점검이 없습니다</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell align="center">계획번호</TableCell>
                        <TableCell>제목</TableCell>
                        <TableCell align="center">작업 유형</TableCell>
                        <TableCell align="center">위험도</TableCell>
                        <TableCell>위치</TableCell>
                        <TableCell align="center">시작일</TableCell>
                        <TableCell align="center">종료일</TableCell>
                        <TableCell align="center">상태</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredItems.map(item => (
                        <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>{item.planId}</TableCell>
                          <TableCell>{item.title}</TableCell>
                          <TableCell align="center">{item.workType || '-'}</TableCell>
                          <TableCell align="center">
                            {item.riskLevel ? <Chip size="small" label={RISK_LABEL[item.riskLevel] || item.riskLevel} color={RISK_COLORS[item.riskLevel] || 'default'} /> : '-'}
                          </TableCell>
                          <TableCell>{item.workLocation || '-'}</TableCell>
                          <TableCell align="center">{item.workStartDate || '-'}</TableCell>
                          <TableCell align="center">{item.workEndDate || '-'}</TableCell>
                          <TableCell align="center">
                            <Chip size="small" label={STATUS_LABEL[item.status] || item.status} color={STATUS_COLORS[item.status] || 'default'} />
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredItems.length === 0 && (
                        <TableRow><TableCell colSpan={8} align="center" sx={{ color: 'text.disabled', py: 6 }}>등록된 계획이 없습니다</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>

            {/* ─── 모바일(xs/sm) : 카드 ─── */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1 }}>
              {filteredItems.length === 0 && (
                <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.disabled', fontSize: '0.875rem' }}>
                  {isPartner ? '등록된 점검이 없습니다' : '등록된 계획이 없습니다'}
                </Paper>
              )}
              {filteredItems.map(item => (
                <Paper key={item.id} variant="outlined" onClick={() => handleRowClick(item)}
                  sx={{ p: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                  {/* 1행: 계획번호 + 상태칩 */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'primary.main', fontWeight: 700, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.planId}
                    </Typography>
                    <Chip size="small" label={STATUS_LABEL[item.status] || item.status} color={STATUS_COLORS[item.status] || 'default'} />
                  </Box>
                  {/* 2행: 제목/체크리스트 */}
                  <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 0.75 }}>
                    {item.title || '-'}
                  </Typography>
                  {/* 3행: 부가정보 */}
                  {isPartner ? (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', fontSize: '0.75rem', color: 'text.secondary', flexWrap: 'wrap' }}>
                      {item.modifiedBy && <Typography sx={{ fontSize: 'inherit' }}>작성자 · {item.modifiedBy}</Typography>}
                      {item.createdAt && <Typography sx={{ fontSize: 'inherit' }}>· {item.createdAt.slice(0, 10)}</Typography>}
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', mb: 0.5, flexWrap: 'wrap' }}>
                      {item.workType && <Chip size="small" label={item.workType} variant="outlined" sx={{ height: 22 }} />}
                      {item.riskLevel && <Chip size="small" label={RISK_LABEL[item.riskLevel] || item.riskLevel} color={RISK_COLORS[item.riskLevel] || 'default'} sx={{ height: 22 }} />}
                      {item.workLocation && <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>· {item.workLocation}</Typography>}
                    </Box>
                  )}
                  {!isPartner && (item.workStartDate || item.workEndDate) && (
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontFamily: 'monospace' }}>
                      {item.workStartDate || '-'} ~ {item.workEndDate || '-'}
                    </Typography>
                  )}
                  {/* admin 모드: 수정/삭제 */}
                </Paper>
              ))}
            </Box>
          </>
        )}

        {data && data.totalPages > 1 && (
          <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
            <Pagination count={data.totalPages} page={page + 1} onChange={(_, v) => setPage(v - 1)} size="small" />
          </Stack>
        )}
      </Box>
    )
  }

  // ============== DETAIL/CREATE/EDIT VIEW ==============
  const isReadonly = viewMode === 'detail'
  const isCreating = viewMode === 'create'
  const view = isReadonly ? selected || {} : form
  const titleLabel = isPartner
    ? (isCreating ? '협력 업체 안전 점검 등록'
        : viewMode === 'edit' ? '협력 업체 안전 점검 수정'
        : '협력 업체 안전 점검 상세')
    : (isCreating ? '현장 안전 계획 등록'
        : viewMode === 'edit' ? '현장 안전 계획 수정'
        : '현장 안전 계획 상세')

  // ====== PARTNER 전용 간소화 폼 ======
  if (isPartner) {
    const writer = (isReadonly ? selected?.modifiedBy : form.modifiedBy) || user?.name || user?.username || '-'
    const writeDate = isReadonly
      ? (selected?.createdAt ? selected.createdAt.slice(0, 10) : '-')
      : new Date().toISOString().slice(0, 10)
    const planNo = selected?.planId || '자동 생성'

    return (
      <Box>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>{titleLabel}</Typography>

        <FormTable>
          <FormRow>
            <FormLabel>계획번호</FormLabel>
            <FormCell borderRight>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{planNo}</Typography>
            </FormCell>
            <FormLabel>작성일</FormLabel>
            <FormCell>
              <Typography variant="body2">{writeDate}</Typography>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>작성자</FormLabel>
            <FormCell borderRight sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2">{writer}</Typography>
            </FormCell>
            <FormLabel>계획 승인자</FormLabel>
            <FormCell borderRight>
              {isReadonly ? (
                <Typography variant="body2">{(view as any).planApproverName || ''}</Typography>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField fullWidth size="small" InputProps={{ readOnly: true }}
                    value={(view as any).planApproverName || ''} placeholder="조직도에서 선택" />
                  <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setApproverPickTarget('plan')}>
                    <PersonSearchIcon fontSize="small" />
                  </Button>
                </Box>
              )}
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>완료 승인자</FormLabel>
            <FormCell>
              {isReadonly ? (
                <Typography variant="body2">{(view as any).completionApproverName || ''}</Typography>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField fullWidth size="small" InputProps={{ readOnly: true }}
                    value={(view as any).completionApproverName || ''} placeholder="조직도에서 선택" />
                  <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setApproverPickTarget('completion')}>
                    <PersonSearchIcon fontSize="small" />
                  </Button>
                </Box>
              )}
            </FormCell>
          </FormRow>
          <FormRow last>
            <FormLabel required>체크리스트</FormLabel>
            <FormCell>
              {isReadonly ? (
                <Typography variant="body2">
                  {(() => {
                    const tid = (view as any).checklistTemplateId
                    const t = templates.find(x => x.id === tid)
                    return t ? t.templateName : '-'
                  })()}
                </Typography>
              ) : (
                <FormControl fullWidth size="small">
                  <Select displayEmpty value={(view as any).checklistTemplateId || ''}
                    onChange={e => setForm({ ...form, checklistTemplateId: e.target.value ? Number(e.target.value) : undefined })}>
                    <MenuItem value="">선택하세요</MenuItem>
                    {templates.filter(t => (t as SafetyChecklistTemplate & { categoryType?: string }).categoryType === 'CONTRACTOR_MOBILE')
                      .map(tmpl => <MenuItem key={tmpl.id} value={tmpl.id}>{tmpl.templateName}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
            </FormCell>
          </FormRow>
        </FormTable>

        {/* 선택한 체크리스트 본문 — 항목 확인/점검 */}
        {(view as any).checklistTemplateId && (
          <Box sx={{ mt: 3 }}>
            <SafetyChecklistTab templateId={(view as any).checklistTemplateId} embedded />
          </Box>
        )}

        {/* 협력업체 안전 관리 조회 — 실행 새 창에서 받은 확인/서명 데이터 (localStorage) */}
        {isReadonly && planType === 'PARTNER' && selected?.id && (() => {
          let submitted: { url: string; name: string; sign: string; externalId: string; phone: string; systemNo: string; submittedAt: string } | null = null
          try {
            const raw = localStorage.getItem('partnerSafetySubmitted:' + selected.id)
            submitted = raw ? JSON.parse(raw) : null
          } catch { submitted = null }
          if (!submitted) return null
          return (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="text.primary" sx={{ mb: 2 }}>
                확인 / 서명
              </Typography>
              <FormTable>
                <FormRow>
                  <FormLabel>성명</FormLabel>
                  <FormCell borderRight><Typography variant="body2">{submitted.name}</Typography></FormCell>
                  <FormLabel>외부 ID</FormLabel>
                  <FormCell><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{submitted.externalId}</Typography></FormCell>
                </FormRow>
                <FormRow>
                  <FormLabel>연락처</FormLabel>
                  <FormCell borderRight><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{submitted.phone}</Typography></FormCell>
                  <FormLabel>시스템 번호</FormLabel>
                  <FormCell><Typography variant="body2">{submitted.systemNo}</Typography></FormCell>
                </FormRow>
                <FormRow>
                  <FormLabel>서명</FormLabel>
                  <FormCell>
                    {submitted.sign
                      ? <img src={submitted.sign} alt="" style={{ maxHeight: 60 }} />
                      : <Typography variant="body2" color="text.disabled">—</Typography>}
                  </FormCell>
                </FormRow>
                <FormRow>
                  <FormLabel>제출일시</FormLabel>
                  <FormCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {submitted.submittedAt?.replace('T', ' ').substring(0, 19)}
                    </Typography>
                  </FormCell>
                </FormRow>
                <FormRow last>
                  <FormLabel>전송 URL</FormLabel>
                  <FormCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.72rem' }}>
                      {submitted.url}
                    </Typography>
                  </FormCell>
                </FormRow>
              </FormTable>
            </Box>
          )
        })()}

        {/* 결재 정보 */}
        {isReadonly && selected?.status === 'REJECTED' && selected.rejectReason && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <strong>반려 사유:</strong> {selected.rejectReason}
          </Alert>
        )}

        {/* 하단 액션 버튼 — 현장 안전 관리와 동일 프로세스 */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' }, flexWrap: 'wrap', mt: 3, pb: 3 }}>
          {viewMode === 'edit' ? (
            <Button variant="outlined" onClick={() => setViewMode('detail')} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>취소</Button>
          ) : (
            <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>목록</Button>
          )}

          {!isReadonly && (
            <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
              저장
            </Button>
          )}

          {isReadonly && mode === 'plan' && (selected?.status === 'DRAFT' || selected?.status === 'REJECTED') && (() => {
            const itemRoles = getItemRoles(selected!)
            const canEdit = BUTTON_MENU
              ? canSee(BUTTON_MENU, 'DRAFT', '수정', itemRoles)
              : itemRoles.includes('writer') || itemRoles.includes('superAdmin')
            const canSubmit = BUTTON_MENU
              ? canSee(BUTTON_MENU, 'DRAFT', '계획 결재 상신', itemRoles)
              : itemRoles.includes('writer') || itemRoles.includes('superAdmin')
            return (
              <>
                {canEdit && <Button variant="contained" onClick={() => selected && handleOpenEdit(selected)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>수정</Button>}
                {canEdit && <Button variant="contained" color="error" onClick={() => selected && handleDelete(selected)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>삭제</Button>}
                {canSubmit && <Button variant="contained" color="info" onClick={async () => {
                  if (await showConfirm('계획 결재를 상신하시겠습니까?') && selected) {
                    transitionMut.mutate({ id: selected.id, action: 'submit' })
                  }
                }} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>계획 결재 상신</Button>}
              </>
            )
          })()}

          {isReadonly && (isApprovalMode || mode === 'plan') && selected?.status === 'PENDING_APPROVAL' && (() => {
            const itemRoles = getItemRoles(selected!)
            const canApprove = BUTTON_MENU
              ? canSee(BUTTON_MENU, 'PENDING_APPROVAL', '계획 결재 승인', itemRoles)
              : itemRoles.includes('planApprover') || itemRoles.includes('superAdmin')
            const canReject = BUTTON_MENU
              ? canSee(BUTTON_MENU, 'PENDING_APPROVAL', '반려', itemRoles)
              : itemRoles.includes('planApprover') || itemRoles.includes('superAdmin')
            return (
              <>
                {canReject && <Button variant="contained" color="warning" onClick={async () => {
                  const reason = window.prompt('반려 사유를 입력하세요.')
                  if (reason && selected) transitionMut.mutate({ id: selected.id, action: 'reject', rejectReason: reason })
                }} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>반려</Button>}
                {canApprove && <Button variant="contained" color="success" onClick={async () => {
                  if (await showConfirm('계획 결재를 승인하시겠습니까?') && selected) {
                    transitionMut.mutate({ id: selected.id, action: 'approve' })
                  }
                }} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>계획 결재 승인</Button>}
              </>
            )
          })()}

          {isReadonly && isApprovalMode && selected?.status === 'APPROVED' && (
            <Button variant="contained" color="info" onClick={async () => {
              if (await showConfirm('완료 처리하시겠습니까?') && selected) {
                transitionMut.mutate({ id: selected.id, action: 'complete' })
              }
            }} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>완료 처리</Button>
          )}

        </Box>

        {/* 승인자 선택 모달 — PARTNER 전용 분기에서도 사용 */}
        <UserSelectModal open={approverPickTarget !== null} onClose={() => setApproverPickTarget(null)}
          selectedUsers={[]} onConfirm={handleUserSelect} singleSelect useCompanyTree
          title={approverPickTarget === 'plan' ? '계획 승인자 선택' : '완료 승인자 선택'} />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>{titleLabel}</Typography>

      <FormTable>
        <FormRow>
          <FormLabel required>제목</FormLabel>
          <FormCell><ReadTextField fullWidth size="small" readOnly={isReadonly}
            value={(view as any).title || ''} onChange={e => setForm({ ...form, title: e.target.value })} /></FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>작업 유형</FormLabel>
          <FormCell borderRight>
            <ReadTextField select fullWidth size="small" readOnly={isReadonly} value={(view as any).workType || ''}
              onChange={e => setForm({ ...form, workType: e.target.value })}>
              <MenuItem value="">선택하세요</MenuItem>
              {WORK_TYPES.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
            </ReadTextField>
          </FormCell>
          <FormLabel>위험도</FormLabel>
          <FormCell>
            <ReadTextField select fullWidth size="small" readOnly={isReadonly} value={(view as any).riskLevel || ''}
              onChange={e => setForm({ ...form, riskLevel: e.target.value })}>
              <MenuItem value="">선택하세요</MenuItem>
              {RISK_LEVELS.map(r => <MenuItem key={r} value={r}>{RISK_LABEL[r]}</MenuItem>)}
            </ReadTextField>
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>작업 위치</FormLabel>
          <FormCell borderRight><ReadTextField fullWidth size="small" readOnly={isReadonly}
            value={(view as any).workLocation || ''} onChange={e => setForm({ ...form, workLocation: e.target.value })} /></FormCell>
          <FormLabel>작업 인원</FormLabel>
          <FormCell><NumberField fullWidth readOnly={isReadonly}
            value={(view as any).workersCount ?? null} onChange={v => setForm({ ...form, workersCount: v ?? 0 })} thousandSeparator={false} /></FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>시작일</FormLabel>
          <FormCell borderRight><DatePickerField readOnly={isReadonly}
            value={(view as any).workStartDate || null} onChange={d => setForm({ ...form, workStartDate: d || undefined })} /></FormCell>
          <FormLabel>종료일</FormLabel>
          <FormCell><DatePickerField readOnly={isReadonly}
            value={(view as any).workEndDate || null} onChange={d => setForm({ ...form, workEndDate: d || undefined })} /></FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>작업 내용</FormLabel>
          <FormCell><ReadTextField fullWidth size="small" multiline minRows={2} readOnly={isReadonly}
            value={(view as any).workDescription || ''} onChange={e => setForm({ ...form, workDescription: e.target.value })} /></FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>안전 조치</FormLabel>
          <FormCell><ReadTextField fullWidth size="small" multiline minRows={2} readOnly={isReadonly}
            value={(view as any).safetyMeasures || ''} onChange={e => setForm({ ...form, safetyMeasures: e.target.value })} /></FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>보호구</FormLabel>
          <FormCell borderRight><ReadTextField fullWidth size="small" readOnly={isReadonly}
            value={(view as any).requiredPpe || ''} onChange={e => setForm({ ...form, requiredPpe: e.target.value })} /></FormCell>
          <FormLabel>유해·위험요인</FormLabel>
          <FormCell><ReadTextField fullWidth size="small" readOnly={isReadonly}
            value={(view as any).hazardFactors || ''} onChange={e => setForm({ ...form, hazardFactors: e.target.value })} /></FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>비상연락처</FormLabel>
          <FormCell borderRight><ReadTextField fullWidth size="small" readOnly={isReadonly}
            value={(view as any).emergencyContact || ''} onChange={e => setForm({ ...form, emergencyContact: fmtPhone(e.target.value) })} /></FormCell>
          <FormLabel>계획 승인자</FormLabel>
          <FormCell>
            {isReadonly ? (
              <Typography variant="body2">{(view as any).planApproverName || ''}</Typography>
            ) : (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField fullWidth size="small" InputProps={{ readOnly: true }}
                  value={(view as any).planApproverName || ''} placeholder="조직도에서 선택" />
                <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setApproverPickTarget('plan')}>
                  <PersonSearchIcon fontSize="small" />
                </Button>
              </Box>
            )}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel required>체크리스트</FormLabel>
          <FormCell>
            {isReadonly ? (
              <Typography variant="body2">
                {(() => {
                  const tid = (view as any).checklistTemplateId
                  const t = templates.find(x => x.id === tid)
                  return t ? t.templateName : '-'
                })()}
              </Typography>
            ) : (
              <FormControl fullWidth size="small">
                <Select displayEmpty value={(view as any).checklistTemplateId || ''}
                  onChange={e => setForm({ ...form, checklistTemplateId: e.target.value ? Number(e.target.value) : undefined })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {templates.filter(t => (t as SafetyChecklistTemplate & { categoryType?: string }).categoryType === 'CONTRACTOR_MOBILE')
                    .map(tmpl => <MenuItem key={tmpl.id} value={tmpl.id}>{tmpl.templateName}</MenuItem>)}
                </Select>
              </FormControl>
            )}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>비고</FormLabel>
          <FormCell><ReadTextField fullWidth size="small" multiline minRows={2} readOnly={isReadonly}
            value={(view as any).notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} /></FormCell>
        </FormRow>
        <FormRow last>
          <FormLabel>첨부파일</FormLabel>
          <FormCell>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ alignItems: 'center' }}>
              {/* 기존 서버 파일 */}
              {attachments.map(f => {
                const markedDelete = markedDeleteIds.includes(f.id)
                return (
                  <Chip
                    key={f.id}
                    size="small"
                    icon={<AttachFileIcon fontSize="small" />}
                    label={
                      <Tooltip title={f.originalFilename}>
                        <Box component="span" sx={{
                          maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          display: 'inline-block', verticalAlign: 'middle',
                          textDecoration: markedDelete ? 'line-through' : 'none',
                        }}>
                          {f.originalFilename}
                        </Box>
                      </Tooltip>
                    }
                    onClick={() => {
                      if (markedDelete) {
                        setMarkedDeleteIds(prev => prev.filter(id => id !== f.id))
                      } else {
                        window.open(`/api/files/${f.id}`, '_blank')
                      }
                    }}
                    deleteIcon={isReadonly || markedDelete ? undefined : <CloseIcon fontSize="small" />}
                    onDelete={isReadonly || markedDelete ? undefined : () => setMarkedDeleteIds(prev => [...prev, f.id])}
                    color={markedDelete ? 'default' : undefined}
                    variant={markedDelete ? 'outlined' : 'filled'}
                  />
                )
              })}
              {/* 신규 보류 파일 */}
              {!isReadonly && pendingFiles.map((file, idx) => (
                <Chip
                  key={`pending-${idx}`}
                  size="small"
                  icon={<AttachFileIcon fontSize="small" />}
                  label={
                    <Tooltip title={file.name}>
                      <Box component="span" sx={{
                        maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        display: 'inline-block', verticalAlign: 'middle',
                      }}>
                        {file.name}
                      </Box>
                    </Tooltip>
                  }
                  color="info"
                  variant="outlined"
                  deleteIcon={<CloseIcon fontSize="small" />}
                  onDelete={() => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}
                />
              ))}
              {/* 첨부 추가 버튼 (편집/등록 모드에서만) */}
              {!isReadonly && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    onChange={e => {
                      const files = Array.from(e.target.files || [])
                      if (files.length > 0) setPendingFiles(prev => [...prev, ...files])
                      if (e.target) e.target.value = ''
                    }}
                  />
                  <Button size="small" variant="text" startIcon={<AttachFileIcon fontSize="small" />}
                    onClick={() => fileInputRef.current?.click()}>
                    파일 추가
                  </Button>
                </>
              )}
              {isReadonly && attachments.length === 0 && (
                <Typography variant="body2" color="text.disabled">첨부된 파일이 없습니다.</Typography>
              )}
            </Stack>
          </FormCell>
        </FormRow>
      </FormTable>

      {/* ============ 작업자 정보 ============ */}
      <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1 }}>작업자 정보</Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        {(isReadonly ? (detailWorkers || []) : workers).length === 0 ? (
          <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 2 }}>등록된 작업자가 없습니다.</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell align="center" sx={{ width: 40 }}>No</TableCell>
                <TableCell>성명</TableCell>
                <TableCell>연락처</TableCell>
                <TableCell>소속업체</TableCell>
                {!isReadonly && <TableCell align="center" sx={{ width: 60 }}>삭제</TableCell>}
              </TableRow></TableHead>
              <TableBody>
                {(isReadonly ? (detailWorkers || []) : workers).map((w, idx) => isReadonly ? (
                  <TableRow key={idx}>
                    <TableCell align="center">{idx + 1}</TableCell>
                    <TableCell>{w.workerName}</TableCell>
                    <TableCell>{w.workerPhone || '-'}</TableCell>
                    <TableCell>{w.companyName || '-'}</TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={idx}>
                    <TableCell align="center">{idx + 1}</TableCell>
                    <TableCell><TextField size="small" fullWidth value={w.workerName} onChange={e => { const nw = [...workers]; nw[idx] = { ...nw[idx], workerName: e.target.value }; setWorkers(nw) }} /></TableCell>
                    <TableCell><TextField size="small" fullWidth value={w.workerPhone}
                      placeholder="010-0000-0000"
                      inputProps={{ inputMode: 'numeric', maxLength: 13 }}
                      onChange={e => { const nw = [...workers]; nw[idx] = { ...nw[idx], workerPhone: fmtPhone(e.target.value) }; setWorkers(nw) }} /></TableCell>
                    <TableCell><TextField size="small" fullWidth value={w.companyName} onChange={e => { const nw = [...workers]; nw[idx] = { ...nw[idx], companyName: e.target.value }; setWorkers(nw) }} /></TableCell>
                    <TableCell align="center"><IconButton size="small" color="error" onClick={() => setWorkers(prev => prev.filter((_, i) => i !== idx))}><DeleteIcon fontSize="inherit" /></IconButton></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {!isReadonly && (
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Button variant="outlined" size="small" onClick={() => setWorkers(prev => [...prev, { workerName: '', workerPhone: '', companyName: '' }])}>외부직원 추가</Button>
            <Button variant="outlined" size="small" onClick={() => setShowWorkerUserModal(true)}>내부직원 추가</Button>
          </Stack>
        )}
      </Paper>

      {/* ============ 체크리스트 정보 (평가서조회 탭에서만) ============ */}
      {isReadonly && isApprovalMode && (
        <>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1 }}>체크리스트 정보</Typography>
          <FormTable>
            <FormRow last>
              <FormLabel>체크리스트</FormLabel>
              <FormCell>
                <Typography variant="body2">
                  {selected?.checklistTemplateId
                    ? (templates.find(t => t.id === selected.checklistTemplateId)?.templateName || `#${selected.checklistTemplateId}`)
                    : '미연결'}
                </Typography>
              </FormCell>
            </FormRow>
          </FormTable>
        </>
      )}

      {/* 결재 정보 */}
      {isReadonly && selected?.status === 'REJECTED' && selected.rejectReason && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <strong>반려 사유:</strong> {selected.rejectReason}
        </Alert>
      )}

      {/* 하단 액션 버튼 — 기존 협력사 관리 패턴 맞춤 */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' }, flexWrap: 'wrap', mt: 3, pb: 3 }}>
        <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>목록</Button>

        {/* 작성/수정 모드 */}
        {!isReadonly && (
          <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
            저장
          </Button>
        )}

        {/* 계획 탭 - DRAFT/REJECTED: 수정/삭제/결재 상신 */}
        {isReadonly && mode === 'plan' && (selected?.status === 'DRAFT' || selected?.status === 'REJECTED') && (
          <>
            <Button variant="contained" onClick={() => selected && handleOpenEdit(selected)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>수정</Button>
            <Button variant="contained" color="error" onClick={() => selected && handleDelete(selected)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>삭제</Button>
            <Button variant="contained" color="info" onClick={async () => {
              if (await showConfirm('계획 결재를 상신하시겠습니까?') && selected) {
                transitionMut.mutate({ id: selected.id, action: 'submit' })
              }
            }} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>계획 결재 상신</Button>
          </>
        )}

        {/* 평가서조회 탭 - PENDING_APPROVAL: 반려/승인 */}
        {isReadonly && isApprovalMode && selected?.status === 'PENDING_APPROVAL' && (
          <>
            <Button variant="contained" color="warning" onClick={async () => {
              const reason = window.prompt('반려 사유를 입력하세요.')
              if (reason && selected) transitionMut.mutate({ id: selected.id, action: 'reject', rejectReason: reason })
            }} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>반려</Button>
            <Button variant="contained" color="success" onClick={async () => {
              if (await showConfirm('계획 결재를 승인하시겠습니까?') && selected) {
                transitionMut.mutate({ id: selected.id, action: 'approve' })
              }
            }} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>계획 결재 승인</Button>
          </>
        )}

        {/* 평가서조회 탭 - APPROVED: 완료 처리 */}
        {isReadonly && isApprovalMode && selected?.status === 'APPROVED' && (
          <Button variant="contained" color="info" onClick={async () => {
            if (await showConfirm('완료 처리하시겠습니까?') && selected) {
              transitionMut.mutate({ id: selected.id, action: 'complete' })
            }
          }} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>완료 처리</Button>
        )}

      </Box>

      <UserSelectModal open={approverPickTarget !== null} onClose={() => setApproverPickTarget(null)}
        selectedUsers={[]} onConfirm={handleUserSelect} singleSelect useCompanyTree
        title="계획 승인자 선택" />
      <DeptUserMultiSelectModal open={showWorkerUserModal} onClose={() => setShowWorkerUserModal(false)}
        onConfirm={handleWorkerUserSelect} title="내부직원 선택" />
    </Box>
  )
}

// ===================================================================
// Main Page (4 tabs)
// ===================================================================
const SiteSafetyManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  return (
    <Box>
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto"
        sx={{ mb: 2, '& .MuiTab-root': { minWidth: 'auto', px: 2, fontSize: '0.85rem' } }}>
        <Tab label="대시보드" />
        <Tab label="계획" />
        <Tab label="평가서조회 담당승인자" />
        <Tab label="전체조회 (어드민)" />
        <Tab label="레포트" />
      </Tabs>
      {activeTab === 0 && <SiteSafetyDashboardTab />}
      {activeTab === 1 && <SiteSafetyPlanContent mode="plan" />}
      {activeTab === 2 && <SiteSafetyPlanContent mode="approval" />}
      {activeTab === 3 && <SiteSafetyPlanContent mode="admin" />}
      {activeTab === 4 && <SiteSafetyReportTab />}
    </Box>
  )
}

export default SiteSafetyManagementPage
