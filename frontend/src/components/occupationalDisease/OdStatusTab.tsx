import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, CircularProgress, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, InputAdornment,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import { workerApi, odStatsApi } from '../../api/occupationalDiseaseApi'
import type { OdWorker } from '../../types/occupationalDisease.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const DIVISIONS = ['정기', '수시', '배치전', '미수검']
const JUDGES = ['A', 'B', 'C1', 'C2', 'D1', 'D2']
const AFTER_ACTIONS = ['추적관찰', '업무전환', '근로단축', '근로금지', '산재신청', '직업병의뢰', '재검권고', '해당없음', '-']
const ACTION_DONE = ['완료', '진행중', '-']
const GENDERS = ['남', '여']
const JOBS = ['사무직', '비사무직']

const judgeColor = (j?: string): 'success' | 'info' | 'warning' | 'error' | 'default' => {
  if (j === 'A') return 'success'
  if (j === 'B') return 'info'
  if (j === 'C1' || j === 'C2') return 'warning'
  if (j === 'D1' || j === 'D2') return 'error'
  return 'default'
}
const divColor = (d: string): 'primary' | 'warning' | 'error' | 'success' | 'default' => {
  switch (d) { case '정기': return 'primary'; case '수시': return 'warning'; case '미수검': return 'error'; case '배치전': return 'success'; default: return 'default' }
}

const emptyForm: Partial<OdWorker> = { division: '정기', gender: '남', job: '비사무직' }

const OdStatusTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { data: items = [], isLoading } = useQuery({ queryKey: ['odWorkers'], queryFn: workerApi.list })
  const { data: stats } = useQuery({ queryKey: ['odStats'], queryFn: odStatsApi.get })

  const [search, setSearch] = useState('')
  const [judgeFilter, setJudgeFilter] = useState('')
  const [divFilter, setDivFilter] = useState('')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<OdWorker | null>(null)
  const [form, setForm] = useState<Partial<OdWorker>>(emptyForm)

  const createMut = useMutation({ mutationFn: (e: Partial<OdWorker>) => workerApi.create(e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odWorkers'] }); qc.invalidateQueries({ queryKey: ['odStats'] }); setOpen(false) } })
  const updateMut = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<OdWorker> }) => workerApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odWorkers'] }); qc.invalidateQueries({ queryKey: ['odStats'] }); setOpen(false) } })
  const deleteMut = useMutation({ mutationFn: (id: number) => workerApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odWorkers'] }); qc.invalidateQueries({ queryKey: ['odStats'] }) } })

  const filtered = useMemo(() => items.filter(w => {
    if (judgeFilter && w.judge !== judgeFilter) return false
    if (divFilter && w.division !== divFilter) return false
    if (search && !w.name.includes(search) && !w.employeeNo.includes(search) && !(w.dept || '').includes(search) && !(w.factor || '').includes(search)) return false
    return true
  }), [items, judgeFilter, divFilter, search])

  // 부서별 게이지
  const byDept = useMemo(() => {
    const m: Record<string, { total: number; done: number; d: number }> = {}
    items.forEach(w => {
      const k = w.dept || '기타'
      if (!m[k]) m[k] = { total: 0, done: 0, d: 0 }
      m[k].total += 1
      if (w.examDate) m[k].done += 1
      if (w.judge?.startsWith('D')) m[k].d += 1
    })
    return Object.entries(m).map(([dept, v]) => ({ dept, total: v.total, done: v.done, d: v.d, pct: v.total > 0 ? Math.round(v.done / v.total * 100) : 0 }))
  }, [items])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true) }
  const openEdit = (w: OdWorker) => { setEditing(w); setForm(w); setOpen(true) }
  const submit = () => { if (editing) updateMut.mutate({ id: editing.id, e: form }); else createMut.mutate(form) }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={2.4}><StatCard color="blue"   value={stats?.workerTotal ?? 0}        label="검진 대상자" sub={`완료 ${stats?.workerCompletedCount ?? 0}`} /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="green"  value={stats?.workerCompletedCount ?? 0} label="검진 완료" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="yellow" value={stats?.workerCCount ?? 0}       label="C판정 (요관찰)" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="red"    value={stats?.workerD1Count ?? 0}     label="D1판정 (직업병)" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="purple" value={stats?.workerMissedCount ?? 0} label="미수검" /></Grid>
      </Grid>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ fontWeight: 700, fontSize: 14, mb: 1 }}>부서별 검진현황</Box>
        <Grid container spacing={1.5}>
          {byDept.map(d => (
            <Grid item xs={6} sm={4} md={2} key={d.dept}>
              <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                <Box sx={{ position: 'relative', width: 56, height: 56, mx: 'auto', mb: 1, lineHeight: 0 }}>
                  <CircularProgress variant="determinate" value={100} size={56} thickness={5} sx={{ color: 'action.hover', position: 'absolute', top: 0, left: 0, display: 'block' }} />
                  <CircularProgress variant="determinate" value={d.pct} size={56} thickness={5} sx={{ color: d.pct >= 90 ? 'success.main' : d.pct >= 70 ? 'warning.main' : 'error.main', position: 'absolute', top: 0, left: 0, display: 'block' }} />
                  <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{d.pct}%</Box>
                </Box>
                <Typography variant="body2" fontWeight={600} color="text.secondary">{d.dept}</Typography>
                <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>{d.done}/{d.total}명 · D{d.d}건</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems="center">
        <TextField size="small" fullWidth placeholder="성명/사번/부서/유해인자..." value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
        <TextField select size="small" sx={{ minWidth: 130 }} label="판정" value={judgeFilter} onChange={e => setJudgeFilter(e.target.value)}>
          <MenuItem value="">전체</MenuItem>
          {JUDGES.map(j => <MenuItem key={j} value={j}>{j}</MenuItem>)}
        </TextField>
        <TextField select size="small" sx={{ minWidth: 130 }} label="검진구분" value={divFilter} onChange={e => setDivFilter(e.target.value)}>
          <MenuItem value="">전체</MenuItem>
          {DIVISIONS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
        </TextField>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>New</Button>
      </Stack>

      <Paper variant="outlined">
        {isLoading ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell align="center">성명</TableCell><TableCell align="center">사번</TableCell><TableCell>부서</TableCell>
                <TableCell>직종</TableCell><TableCell>성별</TableCell><TableCell>구분</TableCell>
                <TableCell>유해인자</TableCell><TableCell>발암성</TableCell><TableCell align="center">노출기간</TableCell>
                <TableCell>검진기관</TableCell><TableCell align="center">검진일</TableCell>
                <TableCell align="center">판정</TableCell><TableCell>사후조치</TableCell><TableCell align="center">이행</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>액션</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {filtered.map(w => (
                  <TableRow key={w.id} hover>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{w.name}</TableCell>
                    <TableCell align="center">{w.employeeNo}</TableCell>
                    <TableCell>{w.dept}</TableCell>
                    <TableCell>{w.job}</TableCell>
                    <TableCell align="center">{w.gender}</TableCell>
                    <TableCell><Chip size="small" label={w.division} color={divColor(w.division)} /></TableCell>
                    <TableCell>{w.factor}</TableCell>
                    <TableCell>{w.carcinogenicity && w.carcinogenicity !== '없음'
                      ? <Chip size="small" label={w.carcinogenicity} color="error" />
                      : <Box component="span" sx={{ color: 'text.disabled' }}>없음</Box>}</TableCell>
                    <TableCell align="center">{w.exposurePeriod}</TableCell>
                    <TableCell>{w.examOrg}</TableCell>
                    <TableCell align="center">{w.examDate}</TableCell>
                    <TableCell align="center">{w.judge ? <Chip size="small" label={w.judge} color={judgeColor(w.judge)} sx={{ fontWeight: 700 }} /> : '-'}</TableCell>
                    <TableCell>{w.afterAction}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: w.actionDone === '완료' ? 'success.main' : w.actionDone === '진행중' ? 'warning.main' : 'text.disabled' }}>{w.actionDone}</TableCell>
                    <TableCell align="center" sx={{ width: 80, whiteSpace: 'nowrap', px: 0.5 }}>
                      <IconButton size="small" onClick={() => openEdit(w)}><EditIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={async () => { if (await showConfirm('삭제하시겠습니까?')) deleteMut.mutate(w.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={15} align="center" sx={{ color: 'text.disabled', py: 6 }}>등록된 대상자가 없습니다</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '대상자 수정' : '대상자 추가'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>사번</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.employeeNo || ''} onChange={e => setForm({ ...form, employeeNo: e.target.value })} /></FormCell>
              <FormLabel required>성명</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>부서</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.dept || ''} onChange={e => setForm({ ...form, dept: e.target.value })} /></FormCell>
              <FormLabel>직종</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={form.job || ''} onChange={e => setForm({ ...form, job: e.target.value })}>
<MenuItem value="">선택</MenuItem>{JOBS.map(j => <MenuItem key={j} value={j}>{j}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>성별</FormLabel>
              <FormCell borderRight><TextField select fullWidth size="small" value={form.gender || ''} onChange={e => setForm({ ...form, gender: e.target.value })}>
<MenuItem value="">선택</MenuItem>{GENDERS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}</TextField></FormCell>
              <FormLabel>생년월일</FormLabel>
              <FormCell><DatePickerField value={form.birthDate || null} onChange={d => setForm({ ...form, birthDate: d })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>검진 구분</FormLabel>
              <FormCell borderRight><TextField select fullWidth size="small" value={form.division || '정기'} onChange={e => setForm({ ...form, division: e.target.value })}>
<MenuItem value="">선택</MenuItem>{DIVISIONS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}</TextField></FormCell>
              <FormLabel>유해인자</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.factor || ''} onChange={e => setForm({ ...form, factor: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>발암성</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.carcinogenicity || ''} onChange={e => setForm({ ...form, carcinogenicity: e.target.value })} placeholder="없음/1A군/1B군/2군" /></FormCell>
              <FormLabel>노출기간</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.exposurePeriod || ''} onChange={e => setForm({ ...form, exposurePeriod: e.target.value })} placeholder="예) 5년 3개월" /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>검진기관</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.examOrg || ''} onChange={e => setForm({ ...form, examOrg: e.target.value })} /></FormCell>
              <FormLabel>검진일</FormLabel>
              <FormCell><DatePickerField value={form.examDate || null} onChange={d => setForm({ ...form, examDate: d })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>판정</FormLabel>
              <FormCell borderRight><TextField select fullWidth size="small" value={form.judge || ''} onChange={e => setForm({ ...form, judge: e.target.value })}><MenuItem value="">미판정</MenuItem>{JUDGES.map(j => <MenuItem key={j} value={j}>{j}</MenuItem>)}</TextField></FormCell>
              <FormLabel>사후조치</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={form.afterAction || ''} onChange={e => setForm({ ...form, afterAction: e.target.value })}><MenuItem value="">선택</MenuItem>{AFTER_ACTIONS.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>이행 여부</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={form.actionDone || ''} onChange={e => setForm({ ...form, actionDone: e.target.value })}><MenuItem value="">선택</MenuItem>{ACTION_DONE.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}</TextField></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={submit} disabled={!form.name || !form.employeeNo}>{editing ? '수정' : '추가'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default OdStatusTab
