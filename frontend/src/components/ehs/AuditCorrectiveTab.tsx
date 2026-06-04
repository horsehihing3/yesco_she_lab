import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import ListSearchBar from '../common/ListSearchBar'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, Select, MenuItem,
  FormControl, Chip, CircularProgress, Alert, IconButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import DatePickerField from '../common/DatePickerField'
import LoadingOverlay from '../common/LoadingOverlay'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import { useAlert } from '../../contexts/AlertContext'
import {
  auditApi as defaultAuditApi,
  auditFindingApi as defaultAuditFindingApi,
  auditCorrectiveApi as defaultAuditCorrectiveApi,
} from '../../api/auditApi'
import {
  legalComplianceExecApi,
  legalComplianceFindingApi,
  legalComplianceCorrectiveApi,
} from '../../api/legalComplianceApi'
import {
  Audit, AuditFinding,
  AuditCorrective, AuditCorrectiveRequest, CorrectiveStatus,
} from '../../types/audit.types'
import useCodeMap from '../../hooks/useCodeMap'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const statusColors: Record<CorrectiveStatus, 'default' | 'info' | 'success' | 'error' | 'warning'> = {
  PENDING: 'default',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  OVERDUE: 'error',
  DEMONSTRATION: 'warning',
  NA: 'default',
}

const labelSx = {
  width: 140, minWidth: 140, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center',
}
const valueSx = { flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem' }
const valueBorderSx = { ...valueSx, borderRight: 1, borderColor: 'grey.300' }
const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

// Inline 행별 입력 상태
type RowState = {
  actionDescription: string
  responsiblePerson: string
  responsibleDept: string
  dueDate: string | null
  status: CorrectiveStatus
}
const emptyRow: RowState = {
  actionDescription: '', responsiblePerson: '', responsibleDept: '',
  dueDate: null, status: 'NA',
}

// 새 4종 활성 코드만 노출 (PENDING/OVERDUE 비활성)
const ACTIVE_STATUSES: CorrectiveStatus[] = ['IN_PROGRESS', 'COMPLETED', 'DEMONSTRATION', 'NA']

export interface AuditCorrectiveTabProps {
  variant?: 'audit' | 'legal-compliance'
}

const AuditCorrectiveTab: React.FC<AuditCorrectiveTabProps> = ({ variant = 'audit' }) => {
  const auditApi = variant === 'legal-compliance' ? legalComplianceExecApi : defaultAuditApi
  const auditFindingApi = variant === 'legal-compliance' ? legalComplianceFindingApi : defaultAuditFindingApi
  const auditCorrectiveApi = variant === 'legal-compliance' ? legalComplianceCorrectiveApi : defaultAuditCorrectiveApi
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { getLabel: getCorrectiveStatusLabel } = useCodeMap('CORRECTIVE_STATUS')
  const { getLabel: getSeverityLabel } = useCodeMap('FINDING_SEVERITY')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<AuditCorrective | null>(null)
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [auditFilter, setAuditFilter] = useState<number | ''>('')
  const applySearch = () => { setSearchText(searchInput); setPage(0) }
  const [selectedAuditId, setSelectedAuditId] = useState<number | ''>('')
  const pageSize = 10

  // 행별 인라인 입력 상태 (key = finding.id)
  const [rowStates, setRowStates] = useState<Record<number, RowState>>({})
  const [userModalForFinding, setUserModalForFinding] = useState<number | null>(null)

  // ── Audit list ──
  const { data: auditListData } = useQuery({
    queryKey: ['auditListForCorrectiveSelect'],
    queryFn: () => auditApi.getAll(0, 100),
  })
  const auditList: Audit[] = auditListData?.content || []

  // ── Findings for selected audit (sync + load) — create/edit/detail 모두에서 사용 ──
  const { data: findingListData, isFetching: findingListLoading } = useQuery({
    queryKey: ['findingsForAudit', selectedAuditId],
    queryFn: async () => {
      try {
        await auditFindingApi.syncFromChecklist(selectedAuditId as number)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('finding sync failed', e)
      }
      return auditFindingApi.getByAudit(selectedAuditId as number, 0, 100)
    },
    enabled: !!selectedAuditId && (viewMode === 'create' || viewMode === 'edit' || viewMode === 'detail'),
  })
  const findingList: AuditFinding[] = findingListData?.content || []

  // ── 동일 감사의 모든 시정조치 조회 (detail/create/edit 모두에서 사용) ──
  // create 모드에서도 이미 등록된 시정조치를 보여주고, edit/save 시 update vs create 분기에 사용.
  const { data: correctivesByAuditData } = useQuery({
    queryKey: ['correctivesByAuditForDetail', selectedAuditId],
    queryFn: () => auditCorrectiveApi.getByAudit(selectedAuditId as number, 0, 200),
    enabled: !!selectedAuditId && (viewMode === 'detail' || viewMode === 'create' || viewMode === 'edit'),
  })
  const correctivesByFindingMap = new Map<number, AuditCorrective>()
  ;(correctivesByAuditData?.content || []).forEach(c => {
    if (c.findingId) correctivesByFindingMap.set(c.findingId, c)
  })

  // create/edit 모드에서 기존 시정조치를 모든 행에 prefill
  // (사용자가 빈 행으로 보고 덮어쓰지 않도록)
  useEffect(() => {
    if (viewMode !== 'create' && viewMode !== 'edit') return
    if (!correctivesByAuditData?.content?.length) return
    setRowStates(prev => {
      const next = { ...prev }
      for (const c of correctivesByAuditData.content) {
        if (!c.findingId) continue
        // 이미 사용자가 입력 중인 행은 건드리지 않음
        if (next[c.findingId]) continue
        next[c.findingId] = {
          actionDescription: c.actionDescription || '',
          responsiblePerson: c.responsiblePerson || '',
          responsibleDept: c.responsibleDept || '',
          dueDate: c.dueDate || null,
          status: ACTIVE_STATUSES.includes(c.status as CorrectiveStatus)
            ? (c.status as CorrectiveStatus)
            : 'NA',
        }
      }
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correctivesByAuditData, viewMode])

  // ── List query ──
  const queryKey = auditFilter
    ? ['auditCorrByAudit', auditFilter, page]
    : statusFilter
      ? ['auditCorrStatus', statusFilter, page]
      : ['auditCorrectives', page]
  const queryFn = () => {
    if (auditFilter) return auditCorrectiveApi.getByAudit(auditFilter as number, page, pageSize)
    if (statusFilter) return auditCorrectiveApi.getByStatus(statusFilter, page, pageSize)
    return auditCorrectiveApi.getAll(page, pageSize)
  }
  const { data, isLoading } = useQuery({ queryKey, queryFn, enabled: viewMode === 'list' })

  // ── Mutations ──
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['auditCorrectives'] })
    queryClient.invalidateQueries({ queryKey: ['auditCorrStatus'] })
    queryClient.invalidateQueries({ queryKey: ['auditCorrByAudit'] })
    queryClient.invalidateQueries({ queryKey: ['correctivesByAuditForDetail'] })
  }

  const createMutation = useMutation({
    mutationFn: (req: AuditCorrectiveRequest) => auditCorrectiveApi.create(req),
  })
  const updateMutation = useMutation({
    // success/error 처리는 handleSaveBulk 에서 일괄 처리
    mutationFn: ({ id, req }: { id: number; req: AuditCorrectiveRequest }) => auditCorrectiveApi.update(id, req),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => auditCorrectiveApi.delete(id),
    onSuccess: () => { invalidateAll(); showSuccess(t('common.deleted')); handleBackToList() },
    onError: () => showError(t('common.error')),
  })

  // ── Handlers ──
  const handleBackToList = () => {
    setViewMode('list'); setSelectedItem(null); setSelectedAuditId('')
    setRowStates({})
  }
  const handleOpenCreate = () => {
    setSelectedItem(null); setSelectedAuditId(''); setRowStates({}); setViewMode('create')
  }
  const handleOpenDetail = async (item: AuditCorrective) => {
    setSelectedItem(item)
    // 상세에서도 동일 감사의 모든 부적합 사항을 보여주기 위해 auditId 세팅
    let auditIdToSet: number | '' = item.auditId ?? ''
    if (!auditIdToSet && item.findingId) {
      try {
        const finding = await auditFindingApi.getById(item.findingId)
        auditIdToSet = finding.auditId ?? ''
      } catch { /* ignore */ }
    }
    setSelectedAuditId(auditIdToSet)
    setViewMode('detail')
  }
  const handleOpenEdit = async (item?: AuditCorrective) => {
    const target = item || selectedItem
    if (!target) return
    setSelectedItem(target)
    // edit 모드는 해당 finding 단건만 인라인 표시. rowStates 미리 채움.
    setRowStates({
      [target.findingId]: {
        actionDescription: target.actionDescription || '',
        responsiblePerson: target.responsiblePerson || '',
        responsibleDept: target.responsibleDept || '',
        dueDate: target.dueDate || null,
        status: ACTIVE_STATUSES.includes(target.status as CorrectiveStatus)
          ? target.status as CorrectiveStatus
          : 'IN_PROGRESS',
      },
    })
    let auditIdToSet: number | '' = target.auditId ?? ''
    if (!auditIdToSet && target.findingId) {
      try {
        const finding = await auditFindingApi.getById(target.findingId)
        auditIdToSet = finding.auditId ?? ''
      } catch { /* ignore */ }
    }
    setSelectedAuditId(auditIdToSet)
    setViewMode('edit')
  }

  const handleAuditSelectChange = (auditId: number | '') => {
    setSelectedAuditId(auditId)
    setRowStates({}) // 감사 변경 시 입력 초기화
  }

  const updateRow = (findingId: number, patch: Partial<RowState>) => {
    setRowStates(prev => ({
      ...prev,
      [findingId]: { ...(prev[findingId] || emptyRow), ...patch },
    }))
  }

  const handleUserSelected = (users: UserInfo[]) => {
    if (userModalForFinding == null || users.length === 0) {
      setUserModalForFinding(null)
      return
    }
    const u = users[0]
    updateRow(userModalForFinding, {
      responsiblePerson: u.name,
      responsibleDept: u.department || '',
    })
    setUserModalForFinding(null)
  }

  // 일괄 저장: actionDescription 있는 행은 모두 처리.
  // 이미 시정조치가 있는 finding → update, 없는 finding → create.
  const handleSaveBulk = async () => {
    if (!selectedAuditId) {
      showError(t('audit.selectAuditFirst', '먼저 감사를 선택하세요.'))
      return
    }
    const targets = Object.entries(rowStates)
      .filter(([, v]) => v.actionDescription?.trim())
      .map(([findingId, v]) => ({ findingId: Number(findingId), v }))

    if (targets.length === 0) {
      showError(t('audit.atLeastOneRow', '최소 1개 부적합 사항에 시정조치 내용을 입력하세요.'))
      return
    }

    const ok = await showConfirm(t('audit.confirmBulkSave',
      `총 ${targets.length}건의 시정조치를 등록하시겠습니까?`))
    if (!ok) return

    let createdCount = 0
    let updatedCount = 0
    let failCount = 0
    const errors: string[] = []
    for (const tgt of targets) {
      const existing = correctivesByFindingMap.get(tgt.findingId)
      const req = {
        findingId: tgt.findingId,
        actionDescription: tgt.v.actionDescription,
        responsiblePerson: tgt.v.responsiblePerson || undefined,
        responsibleDept: tgt.v.responsibleDept || undefined,
        dueDate: tgt.v.dueDate || undefined,
        status: tgt.v.status,
      }
      try {
        if (existing) {
          await updateMutation.mutateAsync({ id: existing.id, req })
          updatedCount++
        } else {
          await createMutation.mutateAsync(req)
          createdCount++
        }
      } catch (e) {
        failCount++
        // eslint-disable-next-line no-console
        console.error('Save corrective failed', { findingId: tgt.findingId, req, error: e })
        // axios 에러 메시지 추출
        const axErr = e as { response?: { data?: { message?: string } }; message?: string }
        const msg = axErr.response?.data?.message || axErr.message || '알 수 없는 오류'
        errors.push(`finding#${tgt.findingId}: ${msg}`)
      }
    }
    invalidateAll()
    if (failCount === 0) {
      showSuccess(t('common.saved', '저장되었습니다'))
      handleBackToList()
    } else {
      showError(`${createdCount + updatedCount}${t('common.cntSuffix', '건')} 저장, ${failCount}${t('common.cntSuffix', '건')} 실패\n${errors.join('\n')}`)
    }
  }

  const handleDelete = async (item: AuditCorrective) => {
    const confirmed = await showConfirm(t('common.confirmDelete', '정말로 삭제하시겠습니까?'))
    if (confirmed) deleteMutation.mutate(item.id)
  }

  const handleRefresh = () => {
    setSearchInput(''); setSearchText(''); setStatusFilter(''); setAuditFilter(''); setPage(0)
  }

  // ── Filtered items + 감사 단위 그룹핑 (목록은 1 row = 1 audit) ──
  let items = data?.content || []
  if (searchText) {
    const s = searchText.toLowerCase()
    items = items.filter((i) =>
      i.actionDescription.toLowerCase().includes(s) ||
      i.correctiveId?.toLowerCase().includes(s) ||
      i.responsiblePerson?.toLowerCase().includes(s) ||
      i.auditName?.toLowerCase().includes(s) ||
      i.findingDescription?.toLowerCase().includes(s)
    )
  }

  type AuditGroup = {
    auditId: number
    auditName: string
    correctives: AuditCorrective[]
    total: number
    inProgress: number
    completed: number
    demonstration: number
    na: number
    latest: AuditCorrective
  }
  const auditGroups: AuditGroup[] = (() => {
    const map = new Map<number, AuditGroup>()
    for (const c of items) {
      if (!c.auditId) continue
      let g = map.get(c.auditId)
      if (!g) {
        g = {
          auditId: c.auditId,
          auditName: c.auditName || auditList.find(a => a.id === c.auditId)?.auditName || '',
          correctives: [],
          total: 0, inProgress: 0, completed: 0, demonstration: 0, na: 0,
          latest: c,
        }
        map.set(c.auditId, g)
      }
      g.correctives.push(c)
      g.total++
      if (c.status === 'IN_PROGRESS')   g.inProgress++
      if (c.status === 'COMPLETED')     g.completed++
      if (c.status === 'DEMONSTRATION') g.demonstration++
      if (c.status === 'NA')            g.na++
      // latest 갱신: 가장 최근 modifiedAt
      if ((c.modifiedAt || '') > (g.latest.modifiedAt || '')) g.latest = c
    }
    return Array.from(map.values()).sort((a, b) => (b.latest.modifiedAt || '').localeCompare(a.latest.modifiedAt || ''))
  })()

  // ──────────────────── LIST VIEW ────────────────────
  if (viewMode === 'list') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* PC Search */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ListSearchBar placeholder={t('audit.searchPlaceholder')}
              value={searchInput} onChange={setSearchInput} onSearch={applySearch}
              sx={{ minWidth: 200 }} />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select displayEmpty value={auditFilter} onChange={(e) => { setAuditFilter(e.target.value as number | ''); setPage(0) }}>
                <MenuItem value="">{t('audit.selectAudit', '감사별 필터')}</MenuItem>
                {auditList.map((a) => <MenuItem key={a.id} value={a.id}>{a.auditName}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setAuditFilter(''); setPage(0); setSearchText('') }}>
                <MenuItem value="">{t('audit.allStatus')}</MenuItem>
                {ACTIVE_STATUSES.map((c) => <MenuItem key={c} value={c}>{getCorrectiveStatusLabel(c)}</MenuItem>)}
              </Select>
            </FormControl>
            <IconButton onClick={handleRefresh} size="small"><RefreshIcon /></IconButton>
          </Box>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>New</Button>
        </Box>
        {/* Mobile Search */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <ListSearchBar fullWidth placeholder={t('audit.searchPlaceholder')}
            value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select displayEmpty value={auditFilter} onChange={(e) => { setAuditFilter(e.target.value as number | ''); setPage(0) }}>
                <MenuItem value="">{t('audit.selectAudit', '감사별 필터')}</MenuItem>
                {auditList.map((a) => <MenuItem key={a.id} value={a.id}>{a.auditName}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setAuditFilter(''); setPage(0); setSearchText('') }}>
                <MenuItem value="">{t('audit.allStatus')}</MenuItem>
                {ACTIVE_STATUSES.map((c) => <MenuItem key={c} value={c}>{getCorrectiveStatusLabel(c)}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate} fullWidth>New</Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : auditGroups.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>{t('common.noData')}</Alert>
        ) : (
          <>
            {/* PC Table — 감사 단위 그룹 */}
            <Paper sx={{ display: { xs: 'none', md: 'block' } }}>
              <TableContainer>
                <Table size="small" stickyHeader sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headerCellSx} align="center">No</TableCell>
                      <TableCell sx={headerCellSx}>{t('audit.auditName', '감사명')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('audit.correctiveCount', '시정조치 건수')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('audit.statusBreakdown', '상태 분포')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('audit.lastUpdated', '최근 수정')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {auditGroups.map((g, idx) => (
                      <TableRow key={g.auditId} hover sx={{ cursor: 'pointer' }} onClick={() => handleOpenDetail(g.latest)}>
                        <TableCell align="center">{idx + 1}</TableCell>
                        <TableCell><Typography variant="body2" fontWeight={600}>{g.auditName}</Typography></TableCell>
                        <TableCell align="center"><Typography variant="body2">{g.total}{t('common.cntSuffix', '건')}</Typography></TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {g.completed > 0     && <Chip size="small" color="success" label={`${getCorrectiveStatusLabel('COMPLETED')} ${g.completed}`} />}
                            {g.inProgress > 0    && <Chip size="small" color="info"    label={`${getCorrectiveStatusLabel('IN_PROGRESS')} ${g.inProgress}`} />}
                            {g.demonstration > 0 && <Chip size="small" color="warning" label={`${getCorrectiveStatusLabel('DEMONSTRATION')} ${g.demonstration}`} />}
                            {g.na > 0            && <Chip size="small" label={`${getCorrectiveStatusLabel('NA')} ${g.na}`} />}
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {g.latest.modifiedAt ? g.latest.modifiedAt.replace('T', ' ').substring(0, 16) : ''}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
            {/* Mobile Card — 감사 단위 그룹 */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              {auditGroups.map((g) => (
                <Paper key={g.auditId} sx={{ p: 2, border: 1, borderColor: 'grey.300', cursor: 'pointer' }} onClick={() => handleOpenDetail(g.latest)}>
                  <Typography fontWeight="bold" sx={{ mb: 1 }}>{g.auditName}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('audit.correctiveCount', '시정조치 건수')}: {g.total}{t('common.cntSuffix', '건')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {g.completed > 0     && <Chip size="small" color="success" label={`${getCorrectiveStatusLabel('COMPLETED')} ${g.completed}`} />}
                    {g.inProgress > 0    && <Chip size="small" color="info"    label={`${getCorrectiveStatusLabel('IN_PROGRESS')} ${g.inProgress}`} />}
                    {g.demonstration > 0 && <Chip size="small" color="warning" label={`${getCorrectiveStatusLabel('DEMONSTRATION')} ${g.demonstration}`} />}
                    {g.na > 0            && <Chip size="small" label={`${getCorrectiveStatusLabel('NA')} ${g.na}`} />}
                  </Box>
                </Paper>
              ))}
            </Box>
          </>
        )}
      </Box>
    )
  }

  // ──────────────────── DETAIL VIEW ────────────────────
  if (viewMode === 'detail' && selectedItem) {
    // 감사명: 서버 응답에 audit_name 컬럼 없으니 auditList 에서 lookup
    const resolvedAuditName = auditList.find(a => a.id === (selectedItem.auditId ?? selectedAuditId))?.auditName
      || selectedItem.auditName || ''
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {/* 상단: 시정번호 / 상태 / 감사명 (메타데이터만) */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('audit.correctiveId')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" fontFamily="monospace">{selectedItem.correctiveId}</Typography>
              </Box>
              <Typography sx={labelSx}>{t('common.status')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Chip label={getCorrectiveStatusLabel(selectedItem.status)} color={statusColors[selectedItem.status]} size="small" />
              </Box>
            </Box>
            <Box sx={{ display: 'flex' }}>
              <Typography sx={labelSx}>{t('audit.auditName')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{resolvedAuditName}</Typography>
              </Box>
            </Box>
          </Box>
          {/* Mobile 상단 메타 */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
            {[
              [t('audit.correctiveId'), selectedItem.correctiveId],
              [t('common.status'), getCorrectiveStatusLabel(selectedItem.status)],
              [t('audit.auditName'), resolvedAuditName],
            ].map(([label, value], i) => (
              <Box key={i}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>{value}</Typography>
              </Box>
            ))}
          </Box>

        {/* 부적합 사항 (선택된 감사의 전체 목록) */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            {t('audit.findings', '부적합 사항')}
          </Typography>
          {findingListLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
          ) : findingList.length === 0 ? (
            <Alert severity="info">{t('audit.noFindings', '부적합 사항이 없습니다.')}</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ overflowX: 'auto', border: 1, borderColor: 'grey.300' }}>
              <Table size="small" sx={{ minWidth: 1500, '& td, & th': { borderRight: '1px solid', borderColor: 'grey.300', wordBreak: 'keep-all' } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 180, whiteSpace: 'nowrap', bgcolor: 'grey.100' }} align="center">{t('audit.findingId', '부적합 번호')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 90, bgcolor: 'grey.100' }} align="center">{t('audit.severity', '심각도')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 220, bgcolor: 'grey.100' }} align="center">{t('audit.findingDescription', '부적합 내용')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 240, bgcolor: 'grey.100' }} align="center">{t('audit.actionDescription', '시정조치 내용')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 100, bgcolor: 'grey.100' }} align="center">{t('audit.responsiblePerson', '담당자')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 130, bgcolor: 'grey.100' }} align="center">{t('audit.responsibleDept', '담당 부서')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 130, bgcolor: 'grey.100' }} align="center">{t('audit.dueDate', '조치 기한')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 100, bgcolor: 'grey.100' }} align="center">{t('common.status', '상태')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {findingList.map((f) => {
                    const c = correctivesByFindingMap.get(f.id)
                    const isSelected = f.id === selectedItem.findingId
                    return (
                      <TableRow key={f.id}
                        hover
                        selected={isSelected}
                        sx={isSelected ? { bgcolor: 'rgba(25, 118, 210, 0.08) !important' } : undefined}>
                        <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{f.findingId}</TableCell>
                        <TableCell align="center">{getSeverityLabel(f.severity) || f.severity}</TableCell>
                        <TableCell sx={{ whiteSpace: 'pre-wrap' }}>{f.description}</TableCell>
                        <TableCell sx={{ whiteSpace: 'pre-wrap' }}>{c?.actionDescription || ''}</TableCell>
                        <TableCell align="center">{c?.responsiblePerson || ''}</TableCell>
                        <TableCell align="center">{c?.responsibleDept || ''}</TableCell>
                        <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{c?.dueDate || ''}</TableCell>
                        <TableCell align="center">
                          {c?.status
                            ? <Chip label={getCorrectiveStatusLabel(c.status) || c.status} size="small" color={statusColors[c.status]} />
                            : ''}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list')}</Button>
          <Button variant="contained" onClick={() => handleOpenEdit()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.edit')}</Button>
          <Button variant="contained" color="error" onClick={() => handleDelete(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.delete')}</Button>
        </Box>
      </Box>
    )
  }

  // ──────────────────── CREATE / EDIT VIEW ────────────────────
  // create / edit 모드 모두 선택된 감사의 모든 finding 을 표시.
  // edit 모드에서는 selectedItem.findingId 행이 하이라이트되며 이미 입력값이 채워져 있음.
  const visibleFindings: AuditFinding[] = findingList

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <LoadingOverlay open={findingListLoading} message={t('audit.findingsLoading', '부적합 사항을 불러오는 중...')} />
      {/* 감사 선택 */}
      <Paper sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
        <Box sx={{ display: 'flex' }}>
          <Typography sx={labelSx}>{t('audit.selectAudit', '감사 선택')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
          <Box sx={valueSx}>
            <FormControl fullWidth size="small">
              <Select
                displayEmpty
                value={selectedAuditId}
                onChange={(e) => handleAuditSelectChange(e.target.value as number | '')}
                disabled={viewMode === 'edit'}
              >
                <MenuItem value="">{t('audit.selectAudit', '감사 선택')}</MenuItem>
                {auditList.map((a) => (
                  <MenuItem key={a.id} value={a.id}>{a.auditName}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>

      {/* Mobile audit select */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
        <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
          {t('audit.selectAudit', '감사 선택')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            displayEmpty
            value={selectedAuditId}
            onChange={(e) => handleAuditSelectChange(e.target.value as number | '')}
            disabled={viewMode === 'edit'}
          >
            <MenuItem value="">{t('audit.selectAudit', '감사 선택')}</MenuItem>
            {auditList.map((a) => (
              <MenuItem key={a.id} value={a.id}>{a.auditName}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* 부적합 사항 인라인 입력 표 */}
      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          {t('audit.correctiveBulkTitle', '부적합 사항별 시정조치 입력')}
          {viewMode === 'create' && (
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              ({t('audit.correctiveBulkHint', '시정조치 내용이 입력된 행만 등록됩니다')})
            </Typography>
          )}
        </Typography>
        {!selectedAuditId ? (
          <Alert severity="info">{t('audit.selectAuditFirst', '먼저 감사를 선택하세요.')}</Alert>
        ) : visibleFindings.length === 0 && !findingListLoading ? (
          <Alert severity="info">{t('audit.noFindings', '부적합 사항이 없습니다.')}</Alert>
        ) : (
          <TableContainer component={Paper} sx={{ overflowX: 'auto', border: 1, borderColor: 'grey.300' }}>
            <Table size="small" sx={{ minWidth: 1620, '& td, & th': { borderRight: '1px solid', borderColor: 'grey.300', wordBreak: 'keep-all' } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 130, bgcolor: 'grey.100' }} align="center">{t('audit.findingId', '부적합 번호')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 90, bgcolor: 'grey.100' }} align="center">{t('audit.severity', '심각도')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 240, bgcolor: 'grey.100' }} align="center">{t('audit.findingDescription', '부적합 내용')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 260, bgcolor: 'grey.100' }} align="center">{t('audit.correctiveAction', '시정조치 내용')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 200, bgcolor: 'grey.100' }} align="center">{t('audit.responsiblePerson', '담당자')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 150, bgcolor: 'grey.100' }} align="center">{t('audit.responsibleDept', '담당 부서')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 220, bgcolor: 'grey.100' }} align="center">{t('audit.dueDate', '완성 예정일')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 130, bgcolor: 'grey.100' }} align="center">{t('common.status', '상태')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleFindings.map((f) => {
                  const row = rowStates[f.id] || emptyRow
                  return (
                    <TableRow key={f.id} hover>
                      <TableCell align="center"><Typography variant="body2">{f.findingId}</Typography></TableCell>
                      <TableCell align="center"><Typography variant="body2">{getSeverityLabel(f.severity) || f.severity}</Typography></TableCell>
                      <TableCell><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{f.description}</Typography></TableCell>
                      <TableCell>
                        <TextField
                          size="small" fullWidth multiline rows={2}
                          value={row.actionDescription}
                          onChange={(e) => updateRow(f.id, { actionDescription: e.target.value })}
                          placeholder={t('audit.correctiveActionPh', '시정조치 내용 입력')}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                          <TextField size="small" fullWidth value={row.responsiblePerson}
                            InputProps={{ readOnly: true }}
                            placeholder={t('audit.selectResponsible', '담당자 선택')}/>
                          <Button variant="outlined" size="small" sx={{ minWidth: 36, px: 0.5 }}
                            onClick={() => setUserModalForFinding(f.id)}>
                            <PersonSearchIcon fontSize="small" />
                          </Button>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <TextField size="small" fullWidth value={row.responsibleDept}
                          InputProps={{ readOnly: true }} placeholder=""/>
                      </TableCell>
                      <TableCell>
                        <DatePickerField value={row.dueDate}
                          onChange={(v) => updateRow(f.id, { dueDate: v })}/>
                      </TableCell>
                      <TableCell>
                        <Select size="small" fullWidth value={row.status}
                          onChange={(e) => updateRow(f.id, { status: e.target.value as CorrectiveStatus })} displayEmpty>
                          <MenuItem value="" disabled>선택</MenuItem>
                          {ACTIVE_STATUSES.map((c) => (
                            <MenuItem key={c} value={c}>{getCorrectiveStatusLabel(c)}</MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
        <Button variant="outlined" onClick={() => viewMode === 'edit' ? setViewMode('detail') : handleBackToList()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel')}</Button>
        <Button variant="contained"
          onClick={handleSaveBulk}
          disabled={createMutation.isPending || updateMutation.isPending}
          sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
          {(createMutation.isPending || updateMutation.isPending) ? <CircularProgress size={18} sx={{ color: 'white' }} /> : t('common.save')}
        </Button>
      </Box>

      {/* 단일 사용자 선택 (담당자 → 부서 자동 매핑) */}
      <UserSelectModal
        open={userModalForFinding != null}
        onClose={() => setUserModalForFinding(null)}
        selectedUsers={[]}
        onConfirm={handleUserSelected}
        singleSelect
        useCompanyTree
        title={t('audit.selectResponsible', '담당자 선택')}
      />
    </Box>
  )
}

export default AuditCorrectiveTab
