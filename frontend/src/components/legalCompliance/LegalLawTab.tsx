import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Alert, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress, Tooltip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import { lawApi } from '../../api/legalComplianceApi'
import type { LegalLaw, LegalLawRequest } from '../../types/legalCompliance.types'
import StatCard from './StatCard'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'
import DatePickerField from '../common/DatePickerField'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'

const CATEGORIES = ['안전', '환경', '보건', '화학물질', '소방', '전기']
const REVIEW_STATUSES = ['검토대기', '검토중', '완료-적용', '완료-불해당']
const APPLY_YN = ['적용', '불해당', '검토중']
const AMEND_TYPES = ['일부개정', '전부개정', '신규제정', '폐지']

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

const LegalLawTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { data: laws = [], isLoading } = useQuery({ queryKey: ['legalLaws'], queryFn: lawApi.list })
  const { data: stats } = useQuery({ queryKey: ['legalLawsStats'], queryFn: lawApi.stats })

  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<LegalLaw | null>(null)
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
      setOpen(false)
    },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, req }: { id: number; req: LegalLawRequest }) => lawApi.update(id, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['legalLaws'] })
      qc.invalidateQueries({ queryKey: ['legalLawsStats'] })
      setOpen(false)
    },
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => lawApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['legalLaws'] })
      qc.invalidateQueries({ queryKey: ['legalLawsStats'] })
    },
  })

  const filtered = useMemo(() => laws.filter(l => {
    if (catFilter && l.category !== catFilter) return false
    if (statusFilter && l.reviewStatus !== statusFilter) return false
    if (search && !l.lawName.includes(search) && !(l.clause || '').includes(search)) return false
    return true
  }), [laws, catFilter, statusFilter, search])

  const urgentList = useMemo(() => laws.filter(l => l.urgent), [laws])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true) }
  const openEdit = (l: LegalLaw) => {
    setEditing(l)
    setForm({
      category: l.category, lawName: l.lawName, clause: l.clause, amendType: l.amendType,
      promulgateDate: l.promulgateDate, enforceDate: l.enforceDate, reviewer: l.reviewer,
      reviewDueDate: l.reviewDueDate, reviewStatus: l.reviewStatus, applyYn: l.applyYn,
      followUpAction: l.followUpAction, amendSummary: l.amendSummary, urgent: l.urgent,
    })
    setOpen(true)
  }
  const submit = () => {
    if (editing) updateMut.mutate({ id: editing.id, req: form })
    else createMut.mutate(form)
  }

  return (
    <Box>
      {/* Stat cards */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.totalCount ?? 0}             label="적용 법령 총계" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.pendingCount ?? 0}           label="검토 대기/검토중" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.doneCount ?? 0}              label="검토 완료" sub={`적용 ${stats?.doneApplyCount ?? 0} · 불해당 ${stats?.doneNotApplicableCount ?? 0}`} /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.urgentCount ?? 0}            label="즉시 조치 필요" sub="시행일 임박" /></Grid>
      </Grid>

      {/* Urgent banner */}
      {urgentList.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>긴급 검토 필요 — {urgentList.length}건</strong>
          {' · '}
          {urgentList.map(l => `「${l.lawName}」`).join(' / ')}
        </Alert>
      )}

      {/* Toolbar */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems="center">
        <TextField
          size="small" fullWidth placeholder="법령명/조항/키워드 검색..."
          value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} /> }}
        />
        <TextField select size="small" sx={{ minWidth: 130 }} label="분류" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <MenuItem value="">전체</MenuItem>
          {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
        <TextField select size="small" sx={{ minWidth: 140 }} label="검토상태" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <MenuItem value="">전체</MenuItem>
          {REVIEW_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}>New</Button>
      </Stack>

      {/* Table */}
      <Paper variant="outlined">
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>분류</TableCell>
                  <TableCell>법령명/조항</TableCell>
                  <TableCell>시행일</TableCell>
                  <TableCell>검토 담당</TableCell>
                  <TableCell>검토 상태</TableCell>
                  <TableCell>적용 여부</TableCell>
                  <TableCell>후속 조치</TableCell>
                  <TableCell align="right">액션</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(l => (
                  <TableRow key={l.id} hover sx={{ bgcolor: l.urgent ? 'rgba(239,68,68,0.05)' : undefined }}>
                    <TableCell><Chip size="small" label={l.category} color={catColor(l.category)} variant="outlined" /></TableCell>
                    <TableCell>
                      <Box sx={{ fontWeight: 600 }}>{l.lawName}{l.urgent && <Chip size="small" label="긴급" color="error" sx={{ ml: 1 }} />}</Box>
                      <Typography variant="caption" sx={{ color: 'info.main' }}>{l.clause}</Typography>
                    </TableCell>
                    <TableCell>
                      {l.enforceDate && (
                        <Chip size="small" label={l.enforceDate} color={l.urgent ? 'error' : 'default'} variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>{l.reviewer || '-'}</TableCell>
                    <TableCell><Chip size="small" label={l.reviewStatus} color={statusColor(l.reviewStatus)} /></TableCell>
                    <TableCell><Chip size="small" label={l.applyYn || '-'} color={applyColor(l.applyYn)} variant="outlined" /></TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{l.followUpAction || '-'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="수정"><IconButton size="small" onClick={() => openEdit(l)}><EditIcon fontSize="inherit" /></IconButton></Tooltip>
                      <Tooltip title="삭제"><IconButton size="small" onClick={async () => { if (await showConfirm('삭제하시겠습니까?')) deleteMut.mutate(l.id) }}><DeleteIcon fontSize="inherit" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ color: 'text.disabled', py: 6 }}>등록된 법령이 없습니다</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Modal */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '법령 수정' : '법령 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>분류</FormLabel>
              <FormCell borderRight>
                <TextField select fullWidth size="small" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <MenuItem value="">선택</MenuItem>
                  {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </FormCell>
              <FormLabel>개정 유형</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.amendType || ''} onChange={e => setForm({ ...form, amendType: e.target.value })}>
                  <MenuItem value="">선택</MenuItem>
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
                  <MenuItem value="">선택</MenuItem>
                  {REVIEW_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </FormCell>
              <FormLabel>적용 여부</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.applyYn || '검토중'} onChange={e => setForm({ ...form, applyYn: e.target.value })}>
                  <MenuItem value="">선택</MenuItem>
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
                  <MenuItem value="">선택</MenuItem>
                  <MenuItem value="0">일반</MenuItem>
                  <MenuItem value="1">긴급</MenuItem>
                </TextField>
              </FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={submit} disabled={!form.lawName || createMut.isPending || updateMut.isPending}>
            {editing ? '수정' : '등록'}
          </Button>
        </DialogActions>
      </Dialog>

      <UserSelectModal open={pickerOpen} onClose={() => setPickerOpen(false)} selectedUsers={[]} onConfirm={onPicked} singleSelect useCompanyTree title="검토 담당자 선택 (조직도)" />
    </Box>
  )
}

export default LegalLawTab
