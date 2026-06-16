import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
import { radWorkerApi, radStatsApi } from '../../api/radiationApi'
import type { RadWorker } from '../../types/radiation.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import DevTestFillButton from '../common/DevTestFillButton'
import { useAlert } from '../../contexts/AlertContext'

const WORKER_TYPES = ['방사선작업종사자', '수시출입자']
const DOSIMETER_TYPES = ['TLD', 'OSL', '전자식']
const STATUSES = ['정상', '경보', '제한']

const statusColor = (s?: string): 'success' | 'warning' | 'error' | 'default' =>
  s === '정상' ? 'success' : s === '경보' ? 'warning' : s === '제한' ? 'error' : 'default'

const emptyForm: Partial<RadWorker> = { workerType: '방사선작업종사자', dosimeterType: 'TLD', status: '정상' }

const RadWorkerTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { data: items = [], isLoading } = useQuery({ queryKey: ['radWorkers'], queryFn: radWorkerApi.list })
  const { data: stats } = useQuery({ queryKey: ['radStats'], queryFn: radStatsApi.get })

  const [searchInput, setSearchInput] = useState('')

  const [search, setSearch] = useState('')

  const applySearch = () => setSearch(searchInput)

  const handleResetSearch = () => { setSearchInput(''); setSearch('') }
  const [typeFilter, setTypeFilter] = useState('')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<RadWorker | null>(null)
  const [form, setForm] = useState<Partial<RadWorker>>(emptyForm)

  // DEV ONLY — 비어있는 항목을 방사선작업종사자 도메인 더미데이터로 채움 (입력값은 보존)
  const fillTestData = () => setForm(prev => ({
    ...prev,
    employeeNo: prev.employeeNo || 'EMP-2024-017',
    name: prev.name || '김방사',
    dept: prev.dept || '비파괴검사팀',
    job: prev.job || '방사선투과검사원',
    workerType: prev.workerType || '방사선작업종사자',
    status: prev.status || '정상',
    nrscNo: prev.nrscNo || 'NRSC-2024-1234',
    dosimeterType: prev.dosimeterType || 'TLD',
    dosimeterNo: prev.dosimeterNo || 'TLD-0517',
    registerDate: prev.registerDate || todayStr(),
    lastEduDate: prev.lastEduDate || todayStr(),
    nextEduDate: prev.nextEduDate || todayStr(),
  }))

  const createMut = useMutation({
    mutationFn: radWorkerApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radWorkers'] }); qc.invalidateQueries({ queryKey: ['radStats'] }); setOpen(false) },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<RadWorker> }) => radWorkerApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radWorkers'] }); qc.invalidateQueries({ queryKey: ['radStats'] }); setOpen(false) },
  })
  const deleteMut = useMutation({
    mutationFn: radWorkerApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radWorkers'] }); qc.invalidateQueries({ queryKey: ['radStats'] }) },
  })

  const filtered = useMemo(() => items.filter(v => {
    if (typeFilter && v.workerType !== typeFilter) return false
    if (search && !v.name.includes(search) && !v.employeeNo.includes(search) && !(v.dept || '').includes(search)) return false
    return true
  }), [items, typeFilter, search])

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, registerDate: todayStr(), lastEduDate: todayStr(), nextEduDate: todayStr() }); setOpen(true) }
  const openEdit = (v: RadWorker) => { setEditing(v); setForm({ ...v }); setOpen(true) }
  const submit = () => {
    if (editing) updateMut.mutate({ id: editing.id, e: form })
    else createMut.mutate(form)
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.workerTotal ?? 0}  label={t('radWorkerTab.label1', '총 종사자')} sub="방사선작업종사자 + 수시출입자" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.workerNormal ?? 0} label={t('radWorkerTab.label2', '정상 상태')} /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.workerAlert ?? 0}  label={t('radWorkerTab.label3', '경보 상태')} sub="피폭 임박/누적 초과" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={items.filter(v => v.workerType === '방사선작업종사자').length} label={t('radWorkerTab.label4', '법적 종사자')} sub="원안위 등록" /></Grid>
      </Grid>

      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>방사선작업종사자 관리</strong> — 원안위 등록 · 연 1회 안전교육 · 6개월/1년 건강진단 · 개인선량계 패용 의무 (원자력안전법 §97)
      </Alert>

      {/* PC toolbar */}
      <Stack direction="row" spacing={1.5} sx={{ display: { xs: 'none', md: 'flex' }, mb: 2, justifyContent: 'flex-start' }} alignItems="center">
        <ListSearchBar placeholder="성명/사번/부서 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch}
          sx={{ width: 240 }} />
        <TextField select size="small" sx={{ minWidth: 180 }} label={t('radWorkerTab.label5', '구분')} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <MenuItem value="">전체</MenuItem>
          {WORKER_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>New</Button>
      </Stack>

      {/* Mobile toolbar */}
      <Stack direction="column" spacing={1} sx={{ display: { xs: 'flex', md: 'none' }, mb: 2 }}>
        <ListSearchBar fullWidth placeholder="성명/사번/부서 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
        <TextField select size="small" fullWidth label={t('radWorkerTab.label5', '구분')} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <MenuItem value="">전체</MenuItem>
          {WORKER_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={handleResetSearch} sx={{ flex: 1 }}>초기화</Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate} sx={{ flex: 1 }}>New</Button>
        </Box>
      </Stack>

      <Paper variant="outlined">
        {isLoading ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell align="center">사번</TableCell>
                <TableCell align="center">성명</TableCell>
                <TableCell>부서/직종</TableCell>
                <TableCell align="center">구분</TableCell>
                <TableCell align="center">원안위 등록</TableCell>
                <TableCell align="center">선량계</TableCell>
                <TableCell align="center">선량계 번호</TableCell>
                <TableCell align="center">최근 교육</TableCell>
                <TableCell align="center">차기 교육</TableCell>
                <TableCell align="center">상태</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>액션</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {filtered.map(v => (
                  <TableRow key={v.id} hover>
                    <TableCell align="center">{v.employeeNo}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{v.name}</TableCell>
                    <TableCell>{v.dept || '-'} / {v.job || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.workerType || '-'} variant="outlined" /></TableCell>
                    <TableCell align="center">{v.nrscNo || '-'}</TableCell>
                    <TableCell align="center">{v.dosimeterType || '-'}</TableCell>
                    <TableCell align="center">{v.dosimeterNo || '-'}</TableCell>
                    <TableCell align="center">{v.lastEduDate || '-'}</TableCell>
                    <TableCell align="center">{v.nextEduDate || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.status} color={statusColor(v.status)} /></TableCell>
                    <TableCell align="center" sx={{ width: 80, whiteSpace: 'nowrap', px: 0.5 }}>
                      <IconButton size="small" onClick={() => openEdit(v)}><EditIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={async () => { if (await showConfirm(t('radWorkerTab.msg1', '삭제하시겠습니까?'))) deleteMut.mutate(v.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={11} align="center" sx={{ color: 'text.disabled', py: 6 }}>등록된 종사자가 없습니다</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '종사자 수정' : '종사자 등록'}</DialogTitle>
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
              <FormCell><TextField fullWidth size="small" value={form.job || ''} onChange={e => setForm({ ...form, job: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>구분</FormLabel>
              <FormCell borderRight><TextField select fullWidth size="small" value={form.workerType || ''} onChange={e => setForm({ ...form, workerType: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{WORKER_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></FormCell>
              <FormLabel>상태</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={form.status || ''} onChange={e => setForm({ ...form, status: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>원안위 등록번호</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.nrscNo || ''} onChange={e => setForm({ ...form, nrscNo: e.target.value })} /></FormCell>
              <FormLabel>선량계 종류</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={form.dosimeterType || ''} onChange={e => setForm({ ...form, dosimeterType: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{DOSIMETER_TYPES.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>선량계 번호</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.dosimeterNo || ''} onChange={e => setForm({ ...form, dosimeterNo: e.target.value })} /></FormCell>
              <FormLabel>등록일</FormLabel>
              <FormCell><DatePickerField value={form.registerDate || null} onChange={d => setForm({ ...form, registerDate: d || undefined })} /></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>최근 교육일</FormLabel>
              <FormCell borderRight><DatePickerField value={form.lastEduDate || null} onChange={d => setForm({ ...form, lastEduDate: d || undefined })} /></FormCell>
              <FormLabel>차기 교육일</FormLabel>
              <FormCell><DatePickerField value={form.nextEduDate || null} onChange={d => setForm({ ...form, nextEduDate: d || undefined })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          {!editing && <DevTestFillButton onFill={fillTestData} />}
          <Button variant="outlined" onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={submit} disabled={!form.employeeNo || !form.name}>저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default RadWorkerTab
