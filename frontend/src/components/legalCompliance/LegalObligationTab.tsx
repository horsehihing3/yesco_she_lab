import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Typography, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ScheduleIcon from '@mui/icons-material/Schedule'
import WarningIcon from '@mui/icons-material/Warning'
import CancelIcon from '@mui/icons-material/Cancel'
import SchoolIcon from '@mui/icons-material/School'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import AirIcon from '@mui/icons-material/Air'
import ScienceIcon from '@mui/icons-material/Science'
import BarChartIcon from '@mui/icons-material/BarChart'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import BoltIcon from '@mui/icons-material/Bolt'
import AssignmentIcon from '@mui/icons-material/Assignment'
import EnergySavingsLeafIcon from '@mui/icons-material/EnergySavingsLeaf'
import MedicationIcon from '@mui/icons-material/Medication'
import LabelIcon from '@mui/icons-material/Label'
import GavelIcon from '@mui/icons-material/Gavel'
import BusinessIcon from '@mui/icons-material/Business'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import PersonIcon from '@mui/icons-material/Person'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import { SvgIconComponent } from '@mui/icons-material'
import { obligationApi } from '../../api/legalComplianceApi'
import type { LegalObligation, LegalObligationRequest } from '../../types/legalCompliance.types'
import StatCard from './StatCard'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import DevTestFillButton from '../common/DevTestFillButton'
import { useAlert } from '../../contexts/AlertContext'

const OBL_TYPES = ['정기교육', '정기검사·측정', '정기보고·제출', '자체점검', '심사·평가']
const STATUSES = [
  { code: 'done',  label: '이행완료', color: 'success' as const, Icon: CheckCircleIcon },
  { code: 'doing', label: '진행중',   color: 'info' as const,    Icon: ScheduleIcon },
  { code: 'delay', label: '지연',     color: 'warning' as const, Icon: WarningIcon },
  { code: 'fail',  label: '미이행',   color: 'error' as const,   Icon: CancelIcon },
]
const CYCLES = ['월 1회', '분기 1회', '반기 1회', '연 1회', '수시']
const CATEGORIES = ['안전', '환경', '보건', '화학물질', '소방', '전기']

const statusInfo = (s: string) => STATUSES.find(x => x.code === s) || STATUSES[1]

// 이모지 → 단색 MUI 아이콘 매핑
const ICON_MAP: Record<string, SvgIconComponent> = {
  '🎓': SchoolIcon,
  '🩺': MonitorHeartIcon,
  '🌬️': AirIcon,
  '🧪': ScienceIcon,
  '📊': BarChartIcon,
  '🔥': LocalFireDepartmentIcon,
  '⚡': BoltIcon,
  '📋': AssignmentIcon,
  '🌿': EnergySavingsLeafIcon,
  '💊': MedicationIcon,
}
const iconFor = (raw?: string): SvgIconComponent => (raw && ICON_MAP[raw]) || LabelIcon

const emptyForm: LegalObligationRequest = {
  obligationType: '정기교육', category: '안전', obligationName: '',
  cycle: '연 1회', status: 'doing', progress: 0,
}

const LegalObligationTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { data: items = [], isLoading } = useQuery({ queryKey: ['legalObligations'], queryFn: obligationApi.list })
  const { data: stats } = useQuery({ queryKey: ['legalObligationsStats'], queryFn: obligationApi.stats })

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const applySearch = () => setSearch(searchInput)
  const handleReset = () => { setSearchInput(''); setSearch(''); setTypeFilter(''); setStatusFilter('') }

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<LegalObligation | null>(null)
  const [form, setForm] = useState<LegalObligationRequest>(emptyForm)
  const [pickerOpen, setPickerOpen] = useState(false)

  const onPicked = (users: UserInfo[]) => {
    if (users[0]) {
      const u = users[0]
      setForm(f => ({ ...f, ownerName: u.name, dept: u.department || f.dept }))
    }
    setPickerOpen(false)
  }

  const createMut = useMutation({
    mutationFn: (req: LegalObligationRequest) => obligationApi.create(req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['legalObligations'] }); qc.invalidateQueries({ queryKey: ['legalObligationsStats'] }); setOpen(false) },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, req }: { id: number; req: LegalObligationRequest }) => obligationApi.update(id, req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['legalObligations'] }); qc.invalidateQueries({ queryKey: ['legalObligationsStats'] }); setOpen(false) },
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => obligationApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['legalObligations'] }); qc.invalidateQueries({ queryKey: ['legalObligationsStats'] }) },
  })

  const filtered = useMemo(() => items.filter(o => {
    if (typeFilter && o.obligationType !== typeFilter) return false
    if (statusFilter && o.status !== statusFilter) return false
    if (search && !o.obligationName.includes(search) && !(o.baseLaw || '').includes(search) && !(o.dept || '').includes(search)) return false
    return true
  }), [items, typeFilter, statusFilter, search])

  // 분류별 이행률
  const categoryRates = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {}
    items.forEach(o => {
      const c = o.category || '기타'
      if (!map[c]) map[c] = { total: 0, done: 0 }
      map[c].total += 1
      if (o.status === 'done') map[c].done += 1
    })
    return Object.entries(map).map(([label, v]) => ({
      label, pct: v.total > 0 ? Math.round((v.done / v.total) * 100) : 0,
    }))
  }, [items])

  const overallRate = stats ? (stats.totalCount > 0 ? Math.round(stats.doneCount / stats.totalCount * 100) : 0) : 0

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, nextDueDate: todayStr() }); setOpen(true) }
  const openEdit = (o: LegalObligation) => {
    setEditing(o)
    setForm({
      obligationType: o.obligationType, category: o.category, obligationName: o.obligationName,
      baseLaw: o.baseLaw, cycle: o.cycle, dept: o.dept, ownerName: o.ownerName,
      dueDate: o.dueDate, nextDueDate: o.nextDueDate,
      status: o.status, progress: o.progress, evidence: o.evidence, penalty: o.penalty, icon: o.icon,
    })
    setOpen(true)
  }
  const submit = () => {
    if (editing) updateMut.mutate({ id: editing.id, req: form })
    else createMut.mutate(form)
  }

  // DEV ONLY — 비어있는 항목을 법적의무 도메인 더미데이터로 채움 (입력값은 보존)
  const fillTestData = () => setForm(prev => ({
    ...prev,
    obligationType: prev.obligationType || '정기교육',
    category: prev.category || '안전',
    obligationName: prev.obligationName || '근로자 정기 안전보건교육',
    baseLaw: prev.baseLaw || '산업안전보건법 제29조',
    cycle: prev.cycle || '분기 1회',
    dept: prev.dept || '안전환경팀',
    nextDueDate: prev.nextDueDate || todayStr(),
    status: prev.status || 'doing',
    progress: prev.progress ?? 60,
    evidence: prev.evidence || '교육일지 및 참석자 명단',
    penalty: prev.penalty || '500만원 이하 과태료',
    icon: prev.icon || '🎓',
  }))

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={`${overallRate}%`}            label={t('legalObligationTab.label1', '전체 이행률')} sub="목표 100%" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.totalCount ?? 0}        label={t('legalObligationTab.label2', '의무 항목 총계')} sub={`이행완료 ${stats?.doneCount ?? 0}건`} /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.doingCount ?? 0}        label={t('legalObligationTab.label3', '진행 중 / 예정')} /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={(stats?.delayCount ?? 0) + (stats?.failCount ?? 0)} label={t('legalObligationTab.label4', '미이행 / 지연')} sub="개선 조치 필요" /></Grid>
      </Grid>

      {/* 분류별 이행률 */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {categoryRates.map(r => (
          <Grid item xs={6} sm={4} md={2} key={r.label}>
            <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
              <Box sx={{ position: 'relative', width: 56, height: 56, mx: 'auto', mb: 1, lineHeight: 0 }}>
                <CircularProgress variant="determinate" value={100} size={56} thickness={5}
                  sx={{ color: 'action.hover', position: 'absolute', top: 0, left: 0, display: 'block' }} />
                <CircularProgress variant="determinate" value={r.pct} size={56} thickness={5}
                  sx={{ color: r.pct >= 80 ? 'success.main' : r.pct >= 60 ? 'warning.main' : 'error.main', position: 'absolute', top: 0, left: 0, display: 'block' }} />
                <Box sx={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700,
                }}>{r.pct}%</Box>
              </Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>{r.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Toolbar */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems="center">
        <ListSearchBar fullWidth placeholder="의무명/법령/담당부서 검색"
          value={searchInput} onChange={setSearchInput} onSearch={applySearch}
        />
        <TextField select size="small" sx={{ minWidth: 150 }} label={t('legalObligationTab.label5', '유형')} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <MenuItem value="">전체</MenuItem>
          {OBL_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <TextField select size="small" sx={{ minWidth: 130 }} label={t('legalObligationTab.label6', '상태')} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <MenuItem value="">전체</MenuItem>
          {STATUSES.map(s => <MenuItem key={s.code} value={s.code}>{s.label}</MenuItem>)}
        </TextField>
        <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate} sx={{ whiteSpace: 'nowrap' }}>New</Button>
      </Stack>

      {/* Checklist */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', color: 'text.disabled' }}>등록된 의무가 없습니다</Paper>
      ) : (
        <Stack spacing={1}>
          {filtered.map(o => {
            const sInfo = statusInfo(o.status)
            const Icon = sInfo.Icon
            const ObIcon = iconFor(o.icon)
            return (
              <Paper key={o.id} variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={1.5} alignItems="center">
                  <Grid item>
                    <Icon color={sInfo.color} />
                  </Grid>
                  <Grid item xs>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                      <ObIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      <Typography variant="subtitle2" fontWeight={600}>{o.obligationName}</Typography>
                      <Chip size="small" label={sInfo.label} color={sInfo.color} />
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{
                      mt: 0.5, color: 'text.secondary', flexWrap: 'wrap',
                      '& .meta': { display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem' },
                      '& .MuiSvgIcon-root': { fontSize: 16 },
                    }}>
                      {o.baseLaw &&    <span className="meta"><GavelIcon />{o.baseLaw}</span>}
                      {o.dept &&       <span className="meta"><BusinessIcon />{o.dept}</span>}
                      {o.cycle &&      <span className="meta"><CalendarMonthIcon />{o.cycle}</span>}
                      {o.ownerName &&  <span className="meta"><PersonIcon />{o.ownerName}</span>}
                    </Stack>
                    <Box sx={{ mt: 1 }}>
                      <Stack direction="row" justifyContent="space-between" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        <Typography variant="caption">이행 진척</Typography>
                        <Typography variant="caption">{o.progress}%</Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.max(0, Math.min(100, o.progress))}
                        color={o.progress >= 100 ? 'success' : o.progress >= 50 ? 'info' : 'error'}
                        sx={{ height: 6, borderRadius: 1 }}
                      />
                    </Box>
                  </Grid>
                  <Grid item sx={{ minWidth: 140, textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                    <Typography variant="caption" color="text.disabled" display="block">다음 이행 기한</Typography>
                    <Typography variant="body2" fontWeight={600}>{o.nextDueDate || '수시'}</Typography>
                    <Stack direction="row" justifyContent="flex-end" sx={{ mt: 0.5 }}>
                      <IconButton size="small" onClick={() => openEdit(o)}><EditIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={async () => { if (await showConfirm(t('legalObligationTab.msg1', '삭제하시겠습니까?'))) deleteMut.mutate(o.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>
            )
          })}
        </Stack>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '의무 수정' : '의무 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel>의무 유형</FormLabel>
              <FormCell borderRight>
                <TextField select fullWidth size="small" value={form.obligationType || ''} onChange={e => setForm({ ...form, obligationType: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {OBL_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </FormCell>
              <FormLabel>분류</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel required>의무 명칭</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.obligationName} onChange={e => setForm({ ...form, obligationName: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>근거 법령</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.baseLaw || ''} onChange={e => setForm({ ...form, baseLaw: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>이행 주기</FormLabel>
              <FormCell borderRight>
                <TextField select fullWidth size="small" value={form.cycle || ''} onChange={e => setForm({ ...form, cycle: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {CYCLES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </FormCell>
              <FormLabel>담당부서</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.dept || ''} onChange={e => setForm({ ...form, dept: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>담당자</FormLabel>
              <FormCell borderRight>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField fullWidth size="small" InputProps={{ readOnly: true }}
                    value={form.ownerName || ''} placeholder="조직도에서 선택" />
                  <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setPickerOpen(true)}>
                    <PersonSearchIcon fontSize="small" />
                  </Button>
                </Box>
              </FormCell>
              <FormLabel>이행 기한</FormLabel>
              <FormCell><DatePickerField value={form.nextDueDate || null} onChange={d => setForm({ ...form, nextDueDate: d })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>상태</FormLabel>
              <FormCell borderRight>
                <TextField select fullWidth size="small" value={form.status || 'doing'} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {STATUSES.map(s => <MenuItem key={s.code} value={s.code}>{s.label}</MenuItem>)}
                </TextField>
              </FormCell>
              <FormLabel>진척률 (%)</FormLabel>
              <FormCell><NumberField fullWidth size="small" value={form.progress ?? null} onChange={v => setForm({ ...form, progress: v ?? 0 })} min={0} max={100} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>증빙</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.evidence || ''} onChange={e => setForm({ ...form, evidence: e.target.value })} /></FormCell>
              <FormLabel>미이행 제재</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.penalty || ''} onChange={e => setForm({ ...form, penalty: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>아이콘</FormLabel>
              <FormCell><TextField fullWidth size="small" placeholder="이모지" value={form.icon || ''} onChange={e => setForm({ ...form, icon: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          {!editing && <DevTestFillButton onFill={fillTestData} />}
          <Button variant="outlined" onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={submit} disabled={!form.obligationName || createMut.isPending || updateMut.isPending}>
            저장
          </Button>
        </DialogActions>
      </Dialog>

      <UserSelectModal open={pickerOpen} onClose={() => setPickerOpen(false)} selectedUsers={[]} onConfirm={onPicked} singleSelect useCompanyTree title="담당자 선택 (조직도)" />
    </Box>
  )
}

export default LegalObligationTab
