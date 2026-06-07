import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Alert,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import { radHealthApi, radStatsApi } from '../../api/radiationApi'
import type { RadHealth } from '../../types/radiation.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const EXAM_TYPES = ['배치전', '정기(6개월)', '정기(1년)', '수시']
const JUDGMENTS = ['A', 'B', 'C1', 'C2', 'D1', 'D2', 'R']

const judgmentColor = (j?: string): 'success' | 'warning' | 'error' | 'default' =>
  j === 'A' ? 'success' : j?.startsWith('B') ? 'success' : j?.startsWith('C') ? 'warning' : j?.startsWith('D') ? 'error' : 'default'

const emptyForm: Partial<RadHealth> = { examType: '정기(1년)', judgment: 'A' }

const RadHealthTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { data: items = [], isLoading } = useQuery({ queryKey: ['radHealths'], queryFn: radHealthApi.list })
  const { data: stats } = useQuery({ queryKey: ['radStats'], queryFn: radStatsApi.get })

  const [searchInput, setSearchInput] = useState('')

  const [search, setSearch] = useState('')

  const applySearch = () => setSearch(searchInput)

  const handleResetSearch = () => { setSearchInput(''); setSearch('') }
  const [typeFilter, setTypeFilter] = useState('')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<RadHealth | null>(null)
  const [form, setForm] = useState<Partial<RadHealth>>(emptyForm)

  const createMut = useMutation({
    mutationFn: radHealthApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radHealths'] }); qc.invalidateQueries({ queryKey: ['radStats'] }); setOpen(false) },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<RadHealth> }) => radHealthApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radHealths'] }); qc.invalidateQueries({ queryKey: ['radStats'] }); setOpen(false) },
  })
  const deleteMut = useMutation({
    mutationFn: radHealthApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radHealths'] }); qc.invalidateQueries({ queryKey: ['radStats'] }) },
  })

  const filtered = useMemo(() => items.filter(v => {
    if (typeFilter && v.examType !== typeFilter) return false
    if (search && !v.workerName.includes(search) && !(v.dept || '').includes(search) && !(v.examOrg || '').includes(search)) return false
    return true
  }), [items, typeFilter, search])

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, examDate: todayStr(), nextExamDate: todayStr() }); setOpen(true) }
  const openEdit = (v: RadHealth) => { setEditing(v); setForm({ ...v }); setOpen(true) }
  const submit = () => {
    if (editing) updateMut.mutate({ id: editing.id, e: form })
    else createMut.mutate(form)
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={items.length} label="총 검진 기록" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={items.filter(v => v.judgment === 'A').length} label="A 판정" sub="정상" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={items.filter(v => v.judgment?.startsWith('C')).length} label="C 판정" sub="요관찰" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.healthAbnormalCount ?? 0} label="이상소견" sub="D 판정 등" /></Grid>
      </Grid>

      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>방사선작업종사자 특수건강진단</strong> — 배치전 1회 · 정기 6개월/1년 · 누적선량 추적 · 이상소견 시 추적관찰 (산안법 §130)
      </Alert>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2, justifyContent: 'flex-start' }} alignItems="center">
        <ListSearchBar placeholder="성명/부서/검진기관 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch}
          sx={{ width: { xs: '100%', sm: 240 } }} />
        <TextField select size="small" sx={{ minWidth: 170 }} label="검진구분" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <MenuItem value="">전체</MenuItem>
          {EXAM_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>New</Button>
      </Stack>

      <Paper variant="outlined">
        {isLoading ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell align="center">사번</TableCell>
                <TableCell align="center">성명</TableCell>
                <TableCell>부서</TableCell>
                <TableCell align="center">검진구분</TableCell>
                <TableCell align="center">검진일</TableCell>
                <TableCell>검진기관</TableCell>
                <TableCell align="center">판정</TableCell>
                <TableCell align="center">수정체</TableCell>
                <TableCell align="center">누적선량 (mSv)</TableCell>
                <TableCell align="center">차기 검진</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>액션</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {filtered.map(v => (
                  <TableRow key={v.id} hover>
                    <TableCell align="center">{v.employeeNo || '-'}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{v.workerName}</TableCell>
                    <TableCell>{v.dept || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.examType || '-'} variant="outlined" /></TableCell>
                    <TableCell align="center">{v.examDate || '-'}</TableCell>
                    <TableCell>{v.examOrg || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.judgment || '-'} color={judgmentColor(v.judgment)} /></TableCell>
                    <TableCell align="center">{v.lensCheck || '-'}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{v.cumulativeDose != null ? Number(v.cumulativeDose).toFixed(2) : '-'}</TableCell>
                    <TableCell align="center">{v.nextExamDate || '-'}</TableCell>
                    <TableCell align="center" sx={{ width: 80, whiteSpace: 'nowrap', px: 0.5 }}>
                      <IconButton size="small" onClick={() => openEdit(v)}><EditIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={async () => { if (await showConfirm('삭제하시겠습니까?')) deleteMut.mutate(v.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={11} align="center" sx={{ color: 'text.disabled', py: 6 }}>검진 기록이 없습니다</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '검진 수정' : '검진 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel>사번</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.employeeNo || ''} onChange={e => setForm({ ...form, employeeNo: e.target.value })} /></FormCell>
              <FormLabel required>성명</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.workerName || ''} onChange={e => setForm({ ...form, workerName: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>부서</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.dept || ''} onChange={e => setForm({ ...form, dept: e.target.value })} /></FormCell>
              <FormLabel>검진구분</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={form.examType || ''} onChange={e => setForm({ ...form, examType: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{EXAM_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>검진일</FormLabel>
              <FormCell borderRight><DatePickerField value={form.examDate || null} onChange={d => setForm({ ...form, examDate: d || undefined })} /></FormCell>
              <FormLabel>차기 검진일</FormLabel>
              <FormCell><DatePickerField value={form.nextExamDate || null} onChange={d => setForm({ ...form, nextExamDate: d || undefined })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>검진기관</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.examOrg || ''} onChange={e => setForm({ ...form, examOrg: e.target.value })} /></FormCell>
              <FormLabel>판정</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={form.judgment || ''} onChange={e => setForm({ ...form, judgment: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{JUDGMENTS.map(j => <MenuItem key={j} value={j}>{j}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>CBC(WBC)</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" placeholder="WBC 5.8" value={form.cbcWbc || ''} onChange={e => setForm({ ...form, cbcWbc: e.target.value })} /></FormCell>
              <FormLabel>수정체 검사</FormLabel>
              <FormCell><TextField fullWidth size="small" placeholder="정상/경계/이상" value={form.lensCheck || ''} onChange={e => setForm({ ...form, lensCheck: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>누적 피폭선량 (mSv)</FormLabel>
              <FormCell><NumberField fullWidth value={form.cumulativeDose ?? null} onChange={v => setForm({ ...form, cumulativeDose: v ?? undefined })} step={0.01} thousandSeparator={false} /></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>사후 조치</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.afterAction || ''} onChange={e => setForm({ ...form, afterAction: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={submit} disabled={!form.workerName}>저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default RadHealthTab
