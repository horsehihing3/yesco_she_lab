import { useState, useMemo } from 'react'
import { isEhsManager } from '../../utils/auth'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { todayStr, weekFromTodayStr } from '../../utils/dateDefaults'
import {
  Box, Grid, Paper, TextField, MenuItem, Button, Chip, Alert, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  IconButton, CircularProgress, FormControl, Select,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import { lawApi } from '../../api/legalComplianceApi'
import type { LegalLaw, LegalLawRequest } from '../../types/legalCompliance.types'
import StatCard from './StatCard'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'
import DatePickerField from '../common/DatePickerField'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import ListSearchBar from '../common/ListSearchBar'

const CATEGORIES = ['안전', '환경', '보건', '화학물질', '소방', '전기']
const REVIEW_STATUSES = ['검토대기', '검토중', '완료-적용', '완료-불해당']
const APPLY_YN = ['적용', '불해당', '검토중']
const AMEND_TYPES = ['일부개정', '전부개정', '신규제정', '폐지']

type ViewMode = 'list' | 'create' | 'detail' | 'edit'

const catColor = (c: string): 'primary' | 'success' | 'secondary' | 'warning' | 'error' | 'default' => {
  switch (c) {
    case '안전': return 'primary'
    case '환경': return 'success'
    case '보건': return 'secondary'
    case '화학물질': return 'warning'
    case '소방': return 'error'
    default: return 'default'
  }
}

const statusColor = (s: string): 'warning' | 'info' | 'success' | 'default' => {
  switch (s) {
    case '검토대기': return 'warning'
    case '검토중': return 'info'
    case '완료-적용': return 'success'
    default: return 'default'
  }
}

const applyColor = (a?: string): 'success' | 'default' | 'warning' => {
  if (a === '적용') return 'success'
  if (a === '불해당') return 'default'
  return 'warning'
}

const emptyForm: LegalLawRequest = {
  category: '안전', lawName: '', clause: '', amendType: '일부개정',
  reviewStatus: '검토대기', applyYn: '검토중', urgent: false,
}

const MENU = 'EHS 경영 › 법규 대응 › 법규검토시스템'

const LegalLawTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const isAdmin = isEhsManager(user)
  const myRoles: string[] = ['guest', ...(user?.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : (user?.role ? [user.role] : []))]
  const getRoles = (item: { createdByUserId?: number | null }): string[] => {
    const roles = [...myRoles]
    if (item.createdByUserId != null && user?.id != null && item.createdByUserId === user.id) roles.push('writer')
    return roles
  }
  const { data: laws = [], isLoading } = useQuery({ queryKey: ['legalLaws'], queryFn: lawApi.list })
  const { data: stats } = useQuery({ queryKey: ['legalLawsStats'], queryFn: lawApi.stats })

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<LegalLaw | null>(null)
  const [form, setForm] = useState<LegalLawRequest>(emptyForm)
  const [pickerOpen, setPickerOpen] = useState(false)

  const onPicked = (users: UserInfo[]) => {
    if (users[0]) setForm(f => ({ ...f, reviewer: users[0].name }))
    setPickerOpen(false)
  }

  const createMut = useMutation({
    mutationFn: (req: LegalLawRequest) => lawApi.create(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['legalLaws'] })
      qc.invalidateQueries({ queryKey: ['legalLawsStats'] })
      setViewMode('list')
      setSelectedItem(null)
    },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, req }: { id: number; req: LegalLawRequest }) => lawApi.update(id, req),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['legalLaws'] })
      qc.invalidateQueries({ queryKey: ['legalLawsStats'] })
      setSelectedItem(updated)
      setViewMode('detail')
    },
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => lawApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['legalLaws'] })
      qc.invalidateQueries({ queryKey: ['legalLawsStats'] })
      setViewMode('list')
      setSelectedItem(null)
    },
  })

  const filtered = useMemo(() => laws.filter(l => {
    if (catFilter && l.category !== catFilter) return false
    if (statusFilter && l.reviewStatus !== statusFilter) return false
    if (search && !l.lawName.includes(search) && !(l.clause || '').includes(search)) return false
    return true
  }), [laws, catFilter, statusFilter, search])

  const urgentList = useMemo(() => laws.filter(l => l.urgent), [laws])

  const handleOpenCreate = () => { setSelectedItem(null); setForm({ ...emptyForm, promulgateDate: todayStr(), enforceDate: weekFromTodayStr() }); setViewMode('create') }
  const handleOpenDetail = (l: LegalLaw) => { setSelectedItem(l); setViewMode('detail') }
  const handleOpenEdit = (l: LegalLaw) => {
    setSelectedItem(l)
    setForm({
      category: l.category, lawName: l.lawName, clause: l.clause, amendType: l.amendType,
      promulgateDate: l.promulgateDate, enforceDate: l.enforceDate, reviewer: l.reviewer,
      reviewDueDate: l.reviewDueDate, reviewStatus: l.reviewStatus, applyYn: l.applyYn,
      followUpAction: l.followUpAction, amendSummary: l.amendSummary, urgent: l.urgent,
    })
    setViewMode('edit')
  }
  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null) }
  const handleSave = () => {
    if (viewMode === 'edit' && selectedItem) updateMut.mutate({ id: selectedItem.id, req: form })
    else createMut.mutate(form)
  }
  const handleDelete = async () => {
    if (!selectedItem) return
    if (await showConfirm(t('legalLawTab.msg1', '삭제하시겠습니까?'))) deleteMut.mutate(selectedItem.id)
  }
  const handleReset = () => { setSearchInput(''); setSearch(''); setCatFilter(''); setStatusFilter('') }

  // ──────────────────── LIST VIEW ────────────────────
  if (viewMode === 'list') {
    return (
      <Box>
        {/* Stat cards */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.totalCount ?? 0}             label={t('legalLawTab.label1', '적용 법령 총계')} /></Grid>
          <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.pendingCount ?? 0}           label={t('legalLawTab.label2', '검토 대기/검토중')} /></Grid>
          <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.doneCount ?? 0}              label={t('legalLawTab.label3', '검토 완료')} sub={`적용 ${stats?.doneApplyCount ?? 0} · 불해당 ${stats?.doneNotApplicableCount ?? 0}`} /></Grid>
          <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.urgentCount ?? 0}            label={t('legalLawTab.label4', '즉시 조치 필요')} sub="시행일 임박" /></Grid>
        </Grid>

        {/* Urgent banner */}
        {urgentList.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>긴급 검토 필요 — {urgentList.length}건</strong>
            {' · '}
            {urgentList.map(l => `「${l.lawName}」`).join(' / ')}
          </Alert>
        )}

        {/* PC Search */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ListSearchBar value={searchInput} onChange={setSearchInput} onSearch={() => setSearch(searchInput)}
              placeholder="법령명/조항/키워드 검색" sx={{ minWidth: 240 }} />
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select displayEmpty value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                <MenuItem value="">분류 전체</MenuItem>
                {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select displayEmpty value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <MenuItem value="">검토상태 전체</MenuItem>
                {REVIEW_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
          </Box>
          {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>New</Button>
          )}
        </Box>

        {/* Mobile Search */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <ListSearchBar value={searchInput} onChange={setSearchInput} onSearch={() => setSearch(searchInput)}
            placeholder="법령명/조항/키워드 검색" fullWidth />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select displayEmpty value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                <MenuItem value="">분류 전체</MenuItem>
                {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select displayEmpty value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <MenuItem value="">검토상태 전체</MenuItem>
                {REVIEW_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ flex: 1 }}>New</Button>
            )}
          </Box>
        </Box>

        {/* Table */}
        <Paper variant="outlined">
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell align="center">분류</TableCell>
                    <TableCell>법령명/조항</TableCell>
                    <TableCell align="center">시행일</TableCell>
                    <TableCell align="center">검토 담당</TableCell>
                    <TableCell align="center">검토 상태</TableCell>
                    <TableCell align="center">적용 여부</TableCell>
                    <TableCell>후속 조치</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map(l => (
                    <TableRow key={l.id} hover sx={{ cursor: 'pointer', bgcolor: l.urgent ? 'rgba(239,68,68,0.05)' : undefined }}
                      onClick={() => handleOpenDetail(l)}>
                      <TableCell align="center">{l.category}</TableCell>
                      <TableCell>
                        <Box sx={{ fontWeight: 600 }}>{l.lawName}{l.urgent && <Chip size="small" label={t('legalLawTab.label5', '긴급')} color="error" sx={{ ml: 1 }} />}</Box>
                        <Typography variant="caption" sx={{ color: 'info.main' }}>{l.clause}</Typography>
                      </TableCell>
                      <TableCell align="center">{l.enforceDate || ''}</TableCell>
                      <TableCell align="center">{l.reviewer || '-'}</TableCell>
                      <TableCell align="center">{l.reviewStatus}</TableCell>
                      <TableCell align="center">{l.applyYn || '-'}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{l.followUpAction || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ color: 'text.disabled', py: 6 }}>등록된 법령이 없습니다</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    )
  }

  // ──────────────────── DETAIL VIEW ────────────────────
  if (viewMode === 'detail' && selectedItem) {
    return (
      <Box>
        <FormTable>
          <FormRow>
            <FormLabel>분류</FormLabel>
            <FormCell borderRight>
              <Chip size="small" label={selectedItem.category} color={catColor(selectedItem.category)} variant="outlined" />
            </FormCell>
            <FormLabel>개정 유형</FormLabel>
            <FormCell><Typography variant="body2">{selectedItem.amendType || '-'}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>법령명</FormLabel>
            <FormCell>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight={600}>{selectedItem.lawName}</Typography>
                {selectedItem.urgent && <Chip size="small" label={t('legalLawTab.label6', '긴급')} color="error" />}
              </Box>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>개정 조항</FormLabel>
            <FormCell><Typography variant="body2">{selectedItem.clause || '-'}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>공포일</FormLabel>
            <FormCell borderRight><Typography variant="body2">{selectedItem.promulgateDate || '-'}</Typography></FormCell>
            <FormLabel>시행일</FormLabel>
            <FormCell><Typography variant="body2">{selectedItem.enforceDate || '-'}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>검토 담당자</FormLabel>
            <FormCell borderRight><Typography variant="body2">{selectedItem.reviewer || '-'}</Typography></FormCell>
            <FormLabel>검토 기한</FormLabel>
            <FormCell><Typography variant="body2">{selectedItem.reviewDueDate || '-'}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>검토 상태</FormLabel>
            <FormCell borderRight>
              <Chip size="small" label={selectedItem.reviewStatus} color={statusColor(selectedItem.reviewStatus)} />
            </FormCell>
            <FormLabel>적용 여부</FormLabel>
            <FormCell>
              <Chip size="small" label={selectedItem.applyYn || '-'} color={applyColor(selectedItem.applyYn)} variant="outlined" />
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>후속 조치</FormLabel>
            <FormCell><Typography variant="body2">{selectedItem.followUpAction || '-'}</Typography></FormCell>
          </FormRow>
          <FormRow last>
            <FormLabel>개정 내용</FormLabel>
            <FormCell><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedItem.amendSummary || '-'}</Typography></FormCell>
          </FormRow>
        </FormTable>

        <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(33% - 6px)', md: 'none' } }}>
            목록
          </Button>
          {canSee(MENU, 'DETAIL', '수정', getRoles(selected ?? {})) && (
            <Button variant="contained" color="primary" onClick={() => handleOpenEdit(selectedItem)} sx={{ flex: { xs: '1 1 calc(33% - 6px)', md: 'none' } }}>
              수정
            </Button>
          )}
          {canSee(MENU, 'DETAIL', '삭제', getRoles(selected ?? {})) && (
            <Button variant="contained" color="error" onClick={handleDelete} sx={{ flex: { xs: '1 1 calc(33% - 6px)', md: 'none' } }}>
              삭제
            </Button>
          )}
        </Box>
      </Box>
    )
  }

  // ──────────────────── CREATE / EDIT VIEW ────────────────────
  return (
    <Box>
      <FormTable>
        <FormRow>
          <FormLabel required>분류</FormLabel>
          <FormCell borderRight>
            <TextField select fullWidth size="small" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <MenuItem value="">선택하세요</MenuItem>
              {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </FormCell>
          <FormLabel>개정 유형</FormLabel>
          <FormCell>
            <TextField select fullWidth size="small" value={form.amendType || ''} onChange={e => setForm({ ...form, amendType: e.target.value })}>
              <MenuItem value="">선택하세요</MenuItem>
              {AMEND_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel required>법령명</FormLabel>
          <FormCell><TextField fullWidth size="small" value={form.lawName} onChange={e => setForm({ ...form, lawName: e.target.value })} /></FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>개정 조항</FormLabel>
          <FormCell><TextField fullWidth size="small" placeholder="예) 제29조(안전보건교육)" value={form.clause || ''} onChange={e => setForm({ ...form, clause: e.target.value })} /></FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>공포일</FormLabel>
          <FormCell borderRight><DatePickerField value={form.promulgateDate || null} onChange={d => setForm({ ...form, promulgateDate: d })} /></FormCell>
          <FormLabel>시행일</FormLabel>
          <FormCell><DatePickerField value={form.enforceDate || null} onChange={d => setForm({ ...form, enforceDate: d })} /></FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>검토 담당자</FormLabel>
          <FormCell borderRight>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField fullWidth size="small" InputProps={{ readOnly: true }}
                value={form.reviewer || ''} placeholder="조직도에서 선택" />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setPickerOpen(true)}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          </FormCell>
          <FormLabel>검토 기한</FormLabel>
          <FormCell><DatePickerField value={form.reviewDueDate || null} onChange={d => setForm({ ...form, reviewDueDate: d })} /></FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>검토 상태</FormLabel>
          <FormCell borderRight>
            <TextField select fullWidth size="small" value={form.reviewStatus || '검토대기'} onChange={e => setForm({ ...form, reviewStatus: e.target.value })}>
              <MenuItem value="">선택하세요</MenuItem>
              {REVIEW_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </FormCell>
          <FormLabel>적용 여부</FormLabel>
          <FormCell>
            <TextField select fullWidth size="small" value={form.applyYn || '검토중'} onChange={e => setForm({ ...form, applyYn: e.target.value })}>
              <MenuItem value="">선택하세요</MenuItem>
              {APPLY_YN.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </TextField>
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>후속 조치</FormLabel>
          <FormCell><TextField fullWidth size="small" value={form.followUpAction || ''} onChange={e => setForm({ ...form, followUpAction: e.target.value })} /></FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>개정 내용</FormLabel>
          <FormCell><TextField fullWidth size="small" multiline minRows={3} value={form.amendSummary || ''} onChange={e => setForm({ ...form, amendSummary: e.target.value })} /></FormCell>
        </FormRow>
        <FormRow last>
          <FormLabel>긴급 여부</FormLabel>
          <FormCell>
            <TextField select fullWidth size="small" value={form.urgent ? '1' : '0'} onChange={e => setForm({ ...form, urgent: e.target.value === '1' })}>
              <MenuItem value="">선택하세요</MenuItem>
              <MenuItem value="0">일반</MenuItem>
              <MenuItem value="1">긴급</MenuItem>
            </TextField>
          </FormCell>
        </FormRow>
      </FormTable>

      <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
        <Button variant="outlined" onClick={viewMode === 'edit' && selectedItem ? () => { setViewMode('detail') } : handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
          취소
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={!form.lawName || createMut.isPending || updateMut.isPending} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
          저장
        </Button>
      </Box>

      <UserSelectModal open={pickerOpen} onClose={() => setPickerOpen(false)} selectedUsers={[]} onConfirm={onPicked} singleSelect useCompanyTree title="검토 담당자 선택 (조직도)" />
    </Box>
  )
}

export default LegalLawTab
