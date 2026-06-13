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
import { radDoseApi, radStatsApi } from '../../api/radiationApi'
import type { RadDose } from '../../types/radiation.types'
import StatCard from '../legalCompliance/StatCard'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import DevTestFillButton from '../common/DevTestFillButton'
import { useAlert } from '../../contexts/AlertContext'

const DOSIMETER_TYPES = ['TLD', 'OSL', '전자식']
const ANNUAL_LIMIT = 20 // mSv/y

const evalColor = (dose?: number): 'success' | 'warning' | 'error' | 'default' => {
  if (dose == null) return 'default'
  if (dose >= ANNUAL_LIMIT) return 'error'
  if (dose >= ANNUAL_LIMIT * 0.5) return 'warning'
  return 'success'
}

const emptyForm: Partial<RadDose> = { dosimeterType: 'TLD', measureMonth: new Date().toISOString().slice(0, 7) }

const RadDoseTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { data: items = [], isLoading } = useQuery({ queryKey: ['radDoses'], queryFn: radDoseApi.list })
  const { data: stats } = useQuery({ queryKey: ['radStats'], queryFn: radStatsApi.get })

  const [searchInput, setSearchInput] = useState('')

  const [search, setSearch] = useState('')

  const applySearch = () => setSearch(searchInput)

  const handleResetSearch = () => { setSearchInput(''); setSearch('') }
  const [monthFilter, setMonthFilter] = useState('')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<RadDose | null>(null)
  const [form, setForm] = useState<Partial<RadDose>>(emptyForm)

  // DEV ONLY — 비어있는 항목을 개인 피폭선량 도메인 더미데이터로 채움 (입력값은 보존)
  const fillTestData = () => setForm(prev => ({
    ...prev,
    workerName: prev.workerName || '김방사',
    dept: prev.dept || '비파괴검사팀',
    measureMonth: prev.measureMonth || new Date().toISOString().slice(0, 7),
    dosimeterType: prev.dosimeterType || 'TLD',
    effectiveDose: prev.effectiveDose ?? 0.85,
    handDose: prev.handDose ?? 1.20,
    lensDose: prev.lensDose ?? 0.45,
    confirmNo: prev.confirmNo || 'KINS-2024-0517',
    measureOrg: prev.measureOrg || '한국원자력안전기술원(KINS)',
    note: prev.note || '연간 한도 대비 정상 범위',
  }))

  const createMut = useMutation({
    mutationFn: radDoseApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radDoses'] }); qc.invalidateQueries({ queryKey: ['radStats'] }); setOpen(false) },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<RadDose> }) => radDoseApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radDoses'] }); qc.invalidateQueries({ queryKey: ['radStats'] }); setOpen(false) },
  })
  const deleteMut = useMutation({
    mutationFn: radDoseApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radDoses'] }); qc.invalidateQueries({ queryKey: ['radStats'] }) },
  })

  const months = useMemo(() => Array.from(new Set(items.map(i => i.measureMonth))).sort().reverse(), [items])

  const filtered = useMemo(() => items.filter(v => {
    if (monthFilter && v.measureMonth !== monthFilter) return false
    if (search && !(v.workerName || '').includes(search) && !(v.dept || '').includes(search)) return false
    return true
  }), [items, monthFilter, search])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true) }
  const openEdit = (v: RadDose) => { setEditing(v); setForm({ ...v }); setOpen(true) }
  const submit = () => {
    if (editing) updateMut.mutate({ id: editing.id, e: form })
    else createMut.mutate(form)
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={(stats?.doseAvg ?? 0).toFixed(2)}  label={t('radDoseTab.label1', '월평균 유효선량')} sub="mSv (전체 평균)" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={(stats?.doseMax ?? 0).toFixed(2)}  label={t('radDoseTab.label2', '월최대 유효선량')} sub="mSv" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.doseOverLimit ?? 0} label={t('radDoseTab.label3', '연간 한도 초과')} sub={`20 mSv/y 기준`} /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={items.length} label={t('radDoseTab.label4', '측정 기록')} sub="누적 등록 건수" /></Grid>
      </Grid>

      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>개인 피폭선량 한도</strong> — 연간 유효선량 20 mSv/y (5년 평균) · 손 등 등가선량 500 mSv/y · 수정체 20 mSv/y (원자력안전법 시행령)
      </Alert>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2, justifyContent: 'flex-start' }} alignItems="center">
        <ListSearchBar placeholder="종사자/부서 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch}
          sx={{ width: { xs: '100%', sm: 240 } }} />
        <TextField select size="small" sx={{ minWidth: 140 }} label={t('radDoseTab.label5', '측정월')} value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
          <MenuItem value="">전체</MenuItem>
          {months.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
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
                <TableCell align="center">측정월</TableCell>
                <TableCell align="center">성명</TableCell>
                <TableCell>부서</TableCell>
                <TableCell align="center">선량계</TableCell>
                <TableCell align="center">유효선량 (mSv)</TableCell>
                <TableCell align="center">손 (mSv)</TableCell>
                <TableCell align="center">수정체 (mSv)</TableCell>
                <TableCell>측정기관</TableCell>
                <TableCell align="center">평가</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>액션</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {filtered.map(v => (
                  <TableRow key={v.id} hover>
                    <TableCell align="center">{v.measureMonth}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{v.workerName || '-'}</TableCell>
                    <TableCell>{v.dept || '-'}</TableCell>
                    <TableCell align="center">{v.dosimeterType || '-'}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{v.effectiveDose?.toFixed(2) ?? '-'}</TableCell>
                    <TableCell align="center">{v.handDose?.toFixed(2) ?? '-'}</TableCell>
                    <TableCell align="center">{v.lensDose?.toFixed(2) ?? '-'}</TableCell>
                    <TableCell>{v.measureOrg || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.effectiveDose != null ? (v.effectiveDose >= ANNUAL_LIMIT ? '초과' : v.effectiveDose >= ANNUAL_LIMIT * 0.5 ? '주의' : '정상') : '-'} color={evalColor(v.effectiveDose)} /></TableCell>
                    <TableCell align="center" sx={{ width: 80, whiteSpace: 'nowrap', px: 0.5 }}>
                      <IconButton size="small" onClick={() => openEdit(v)}><EditIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={async () => { if (await showConfirm(t('radDoseTab.msg1', '삭제하시겠습니까?'))) deleteMut.mutate(v.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={10} align="center" sx={{ color: 'text.disabled', py: 6 }}>피폭선량 기록이 없습니다</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '피폭선량 수정' : '피폭선량 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>성명</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.workerName || ''} onChange={e => setForm({ ...form, workerName: e.target.value })} /></FormCell>
              <FormLabel>부서</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.dept || ''} onChange={e => setForm({ ...form, dept: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel required>측정월</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" type="month" InputLabelProps={{ shrink: true }} value={form.measureMonth || ''} onChange={e => setForm({ ...form, measureMonth: e.target.value })} /></FormCell>
              <FormLabel>선량계 종류</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={form.dosimeterType || ''} onChange={e => setForm({ ...form, dosimeterType: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{DOSIMETER_TYPES.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>유효선량 (mSv)</FormLabel>
              <FormCell borderRight><NumberField fullWidth value={form.effectiveDose ?? null} onChange={v => setForm({ ...form, effectiveDose: v ?? undefined })} step={0.01} thousandSeparator={false} /></FormCell>
              <FormLabel>손 등가선량 (mSv)</FormLabel>
              <FormCell><NumberField fullWidth value={form.handDose ?? null} onChange={v => setForm({ ...form, handDose: v ?? undefined })} step={0.01} thousandSeparator={false} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>수정체 등가선량 (mSv)</FormLabel>
              <FormCell borderRight><NumberField fullWidth value={form.lensDose ?? null} onChange={v => setForm({ ...form, lensDose: v ?? undefined })} step={0.01} thousandSeparator={false} /></FormCell>
              <FormLabel>측정 확인번호</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.confirmNo || ''} onChange={e => setForm({ ...form, confirmNo: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>측정기관</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.measureOrg || ''} onChange={e => setForm({ ...form, measureOrg: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>비고</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.note || ''} onChange={e => setForm({ ...form, note: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          {!editing && <DevTestFillButton onFill={fillTestData} />}
          <Button variant="outlined" onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={submit} disabled={!form.workerName || !form.measureMonth}>저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default RadDoseTab
