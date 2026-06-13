import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Typography, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import { improvementApi } from '../../api/legalComplianceApi'
import type { LegalImprovement, LegalImprovementRequest } from '../../types/legalCompliance.types'
import StatCard from './StatCard'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import DevTestFillButton from '../common/DevTestFillButton'
import { useAlert } from '../../contexts/AlertContext'

const IMP_TYPES = ['법규준수', '인허가', '의무이행', '자체발굴']
const PRIORITIES = [
  { code: 'high', label: '高 (법령위반)', color: '#ef4444' },
  { code: 'mid',  label: '中 (위반우려)', color: '#f59e0b' },
  { code: 'low',  label: '低 (권고)',     color: '#22c55e' },
]
const SOURCES = ['법규검토', '인허가 관리', '의무이행점검', '현장점검', '감사']
const COLUMNS = [
  { key: 'register', label: '🔴 등록·검토', color: '#ef4444' },
  { key: 'progress', label: '🟡 개선 진행', color: '#f59e0b' },
  { key: 'review',   label: '🔵 완료 검토', color: '#3b82f6' },
  { key: 'done',     label: '🟢 종결',       color: '#22c55e' },
]

const typeColor = (t?: string): 'primary' | 'secondary' | 'warning' | 'success' | 'default' => {
  switch (t) {
    case '법규준수': return 'primary'
    case '인허가':   return 'secondary'
    case '의무이행': return 'warning'
    case '자체발굴': return 'success'
    default: return 'default'
  }
}

const priorityColor = (p: string) => PRIORITIES.find(x => x.code === p)?.color || '#94a3b8'

const computeDday = (target?: string, colStatus?: string): string => {
  if (colStatus === 'done') return '종결'
  if (colStatus === 'review') return '검토중'
  if (!target) return '-'
  const now = new Date()
  const d = Math.floor((new Date(target).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return d >= 0 ? `D-${d}` : `D+${Math.abs(d)}`
}

const emptyForm: LegalImprovementRequest = {
  improvementType: '법규준수', priority: 'mid', title: '',
  source: '법규검토', colStatus: 'register',
}

const LegalImprovementTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { data: items = [], isLoading } = useQuery({ queryKey: ['legalImprovements'], queryFn: improvementApi.list })
  const { data: stats } = useQuery({ queryKey: ['legalImprovementsStats'], queryFn: improvementApi.stats })

  const [typeFilter, setTypeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<LegalImprovement | null>(null)
  const [form, setForm] = useState<LegalImprovementRequest>(emptyForm)
  const [pickerOpen, setPickerOpen] = useState(false)

  const onPicked = (users: UserInfo[]) => {
    if (users[0]) {
      const u = users[0]
      setForm(f => ({ ...f, ownerName: u.name, dept: u.department || f.dept }))
    }
    setPickerOpen(false)
  }

  const createMut = useMutation({
    mutationFn: (req: LegalImprovementRequest) => improvementApi.create(req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['legalImprovements'] }); qc.invalidateQueries({ queryKey: ['legalImprovementsStats'] }); setOpen(false) },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, req }: { id: number; req: LegalImprovementRequest }) => improvementApi.update(id, req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['legalImprovements'] }); qc.invalidateQueries({ queryKey: ['legalImprovementsStats'] }); setOpen(false) },
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => improvementApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['legalImprovements'] }); qc.invalidateQueries({ queryKey: ['legalImprovementsStats'] }) },
  })

  const filtered = useMemo(() => items.filter(i => {
    if (typeFilter && i.improvementType !== typeFilter) return false
    if (priorityFilter && i.priority !== priorityFilter) return false
    return true
  }), [items, typeFilter, priorityFilter])

  const byColumn = useMemo(() => {
    const m: Record<string, LegalImprovement[]> = { register: [], progress: [], review: [], done: [] }
    filtered.forEach(i => { (m[i.colStatus] ||= []).push(i) })
    return m
  }, [filtered])

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, targetDate: todayStr(), registeredDate: todayStr() }); setOpen(true) }
  const openEdit = (i: LegalImprovement) => {
    setEditing(i)
    setForm({
      improvementType: i.improvementType, priority: i.priority, title: i.title,
      baseLaw: i.baseLaw, description: i.description, dept: i.dept, ownerName: i.ownerName,
      targetDate: i.targetDate, source: i.source, colStatus: i.colStatus, registeredDate: i.registeredDate,
    })
    setOpen(true)
  }
  const submit = () => {
    if (editing) updateMut.mutate({ id: editing.id, req: form })
    else createMut.mutate(form)
  }

  // DEV ONLY — 비어있는 항목을 개선조치 도메인 더미데이터로 채움 (입력값은 보존)
  const fillTestData = () => setForm(prev => ({
    ...prev,
    improvementType: prev.improvementType || '법규준수',
    priority: prev.priority || 'high',
    title: prev.title || '국소배기장치 제어풍속 기준 미달 개선',
    baseLaw: prev.baseLaw || '산업안전보건기준에 관한 규칙 제429조',
    description: prev.description || '제어풍속이 법정 기준 미달로 측정되어 배기팬 용량 증설 및 후드 개조 필요 (테스트 데이터)',
    dept: prev.dept || '안전환경팀',
    targetDate: prev.targetDate || todayStr(),
    source: prev.source || '현장점검',
    colStatus: prev.colStatus || 'register',
    registeredDate: prev.registeredDate || todayStr(),
  }))

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.totalCount ?? 0}    label={t('legalImprovementTab.label1', '전체 개선 과제')} sub="이번 연도" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.registerCount ?? 0} label={t('legalImprovementTab.label2', '등록 / 검토중')} /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.progressCount ?? 0} label={t('legalImprovementTab.label3', '개선 진행중')} /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.doneCount ?? 0}     label={t('legalImprovementTab.label4', '완료 종결')} sub={`종결률 ${stats?.closeRate ?? 0}%`} /></Grid>
      </Grid>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1.5}>
          <TextField select size="small" sx={{ minWidth: 130 }} label={t('legalImprovementTab.label5', '구분')} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <MenuItem value="">전체</MenuItem>
            {IMP_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField select size="small" sx={{ minWidth: 150 }} label={t('legalImprovementTab.label6', '중요도')} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <MenuItem value="">전체</MenuItem>
            {PRIORITIES.map(p => <MenuItem key={p.code} value={p.code}>{p.label}</MenuItem>)}
          </TextField>
        </Stack>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}>New</Button>
      </Stack>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={1.5}>
          {COLUMNS.map(col => {
            const list = byColumn[col.key] || []
            return (
              <Grid item xs={12} sm={6} md={3} key={col.key}>
                <Paper variant="outlined" sx={{ p: 1.5, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight={700}>{col.label}</Typography>
                  <Chip size="small" label={list.length} sx={{ ml: 'auto' }} />
                </Paper>
                <Stack spacing={1}>
                  {list.map(i => {
                    const dday = computeDday(i.targetDate, i.colStatus)
                    const ddayColor: 'error' | 'warning' | 'default' | 'success' =
                      dday === '종결' ? 'success' :
                      dday === '검토중' ? 'default' :
                      dday.startsWith('D-') && parseInt(dday.slice(2)) <= 15 ? 'error' :
                      dday.startsWith('D+') ? 'error' :
                      'warning'
                    return (
                      <Paper key={i.id} variant="outlined" sx={{ p: 1.5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: priorityColor(i.priority) }} />
                            {i.improvementType && <Chip size="small" label={i.improvementType} color={typeColor(i.improvementType)} />}
                          </Stack>
                          <Chip size="small" label={dday} color={ddayColor === 'default' ? undefined : ddayColor} />
                        </Stack>
                        <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.4, mb: 0.5 }}>{i.title}</Typography>
                        {i.baseLaw && <Typography variant="caption" color="text.disabled" display="block">{i.baseLaw}</Typography>}
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main' }}>{i.ownerName?.[0] || '?'}</Avatar>
                            <Typography variant="caption" color="text.secondary">{i.ownerName} · {i.dept}</Typography>
                          </Stack>
                          <Box>
                            <IconButton size="small" onClick={() => openEdit(i)}><EditIcon fontSize="inherit" /></IconButton>
                            <IconButton size="small" onClick={async () => { if (await showConfirm(t('legalImprovementTab.msg1', '삭제하시겠습니까?'))) deleteMut.mutate(i.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                          </Box>
                        </Stack>
                      </Paper>
                    )
                  })}
                  {list.length === 0 && <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center', py: 3, display: 'block' }}>비어 있음</Typography>}
                </Stack>
              </Grid>
            )
          })}
        </Grid>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '개선 과제 수정' : '개선 과제 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel>개선 구분</FormLabel>
              <FormCell borderRight>
                <TextField select fullWidth size="small" value={form.improvementType || ''} onChange={e => setForm({ ...form, improvementType: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {IMP_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </FormCell>
              <FormLabel required>중요도</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {PRIORITIES.map(p => <MenuItem key={p.code} value={p.code}>{p.label}</MenuItem>)}
                </TextField>
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel required>개선 제목</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>근거 법령</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.baseLaw || ''} onChange={e => setForm({ ...form, baseLaw: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel required>개선 요구사항</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={3} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>담당부서</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.dept || ''} onChange={e => setForm({ ...form, dept: e.target.value })} /></FormCell>
              <FormLabel>담당자</FormLabel>
              <FormCell>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField fullWidth size="small" InputProps={{ readOnly: true }}
                    value={form.ownerName || ''} placeholder="조직도에서 선택" />
                  <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setPickerOpen(true)}>
                    <PersonSearchIcon fontSize="small" />
                  </Button>
                </Box>
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel required>목표 완료일</FormLabel>
              <FormCell borderRight><DatePickerField value={form.targetDate || null} onChange={d => setForm({ ...form, targetDate: d })} /></FormCell>
              <FormLabel>발굴 경로</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.source || ''} onChange={e => setForm({ ...form, source: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {SOURCES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>진행 상태</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.colStatus || 'register'} onChange={e => setForm({ ...form, colStatus: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {COLUMNS.map(c => <MenuItem key={c.key} value={c.key}>{c.label}</MenuItem>)}
                </TextField>
              </FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          {!editing && <DevTestFillButton onFill={fillTestData} />}
          <Button variant="outlined" onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={submit} disabled={!form.title || createMut.isPending || updateMut.isPending}>
            저장
          </Button>
        </DialogActions>
      </Dialog>

      <UserSelectModal open={pickerOpen} onClose={() => setPickerOpen(false)} selectedUsers={[]} onConfirm={onPicked} singleSelect useCompanyTree title="담당자 선택 (조직도)" />
    </Box>
  )
}

export default LegalImprovementTab
