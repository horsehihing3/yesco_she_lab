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
import { radMeasurementApi, radStatsApi } from '../../api/radiationApi'
import type { RadMeasurement } from '../../types/radiation.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const MEASURE_TYPES = ['공간선량률', '표면오염', '공기중 방사성 물질']
const UNITS = ['μSv/h', 'mSv/h', 'Bq/cm²', 'Bq/m³']
const EVALS = ['정상', '주의', '초과']

const evalColor = (s?: string): 'success' | 'warning' | 'error' | 'default' =>
  s === '정상' ? 'success' : s === '주의' ? 'warning' : s === '초과' ? 'error' : 'default'

const emptyForm: Partial<RadMeasurement> = {
  measureType: '공간선량률', unit: 'μSv/h', evaluation: '정상',
  measureDate: new Date().toISOString().slice(0, 10),
}

const RadMeasurementTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { data: items = [], isLoading } = useQuery({ queryKey: ['radMeasurements'], queryFn: radMeasurementApi.list })
  const { data: stats } = useQuery({ queryKey: ['radStats'], queryFn: radStatsApi.get })

  const [searchInput, setSearchInput] = useState('')

  const [search, setSearch] = useState('')

  const applySearch = () => setSearch(searchInput)

  const handleResetSearch = () => { setSearchInput(''); setSearch('') }
  const [evalFilter, setEvalFilter] = useState('')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<RadMeasurement | null>(null)
  const [form, setForm] = useState<Partial<RadMeasurement>>(emptyForm)

  const createMut = useMutation({
    mutationFn: radMeasurementApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radMeasurements'] }); qc.invalidateQueries({ queryKey: ['radStats'] }); setOpen(false) },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<RadMeasurement> }) => radMeasurementApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radMeasurements'] }); qc.invalidateQueries({ queryKey: ['radStats'] }); setOpen(false) },
  })
  const deleteMut = useMutation({
    mutationFn: radMeasurementApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radMeasurements'] }); qc.invalidateQueries({ queryKey: ['radStats'] }) },
  })

  const filtered = useMemo(() => items.filter(v => {
    if (evalFilter && v.evaluation !== evalFilter) return false
    if (search && !(v.zoneName || '').includes(search) && !(v.pointName || '').includes(search) && !(v.measurer || '').includes(search)) return false
    return true
  }), [items, evalFilter, search])

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, measureDate: todayStr() }); setOpen(true) }
  const openEdit = (v: RadMeasurement) => { setEditing(v); setForm({ ...v }); setOpen(true) }
  const submit = () => {
    if (editing) updateMut.mutate({ id: editing.id, e: form })
    else createMut.mutate(form)
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.measureTotal ?? 0} label="총 측정 기록" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={items.filter(v => v.evaluation === '정상').length} label="정상 평가" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={items.filter(v => v.evaluation === '주의').length} label="주의 평가" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.measureOverCount ?? 0} label="기준 초과" /></Grid>
      </Grid>

      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>방사선 측정 기록</strong> — 공간선량률 정기 측정 후 기록 보존 5년 이상 · 기준 초과 시 원안위 즉시 보고 (원자력안전법 §103)
      </Alert>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2, justifyContent: 'flex-start' }} alignItems="center">
        <ListSearchBar placeholder="구역/지점/측정자 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch}
          sx={{ width: { xs: '100%', sm: 240 } }} />
        <TextField select size="small" sx={{ minWidth: 130 }} label="평가" value={evalFilter} onChange={e => setEvalFilter(e.target.value)}>
          <MenuItem value="">전체</MenuItem>
          {EVALS.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
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
                <TableCell align="center">측정일</TableCell>
                <TableCell>구역</TableCell>
                <TableCell align="center">지점</TableCell>
                <TableCell align="center">측정유형</TableCell>
                <TableCell align="center">측정값</TableCell>
                <TableCell align="center">기준값</TableCell>
                <TableCell>측정기기</TableCell>
                <TableCell align="center">측정자</TableCell>
                <TableCell align="center">평가</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>액션</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {filtered.map(v => (
                  <TableRow key={v.id} hover>
                    <TableCell align="center">{v.measureDate}</TableCell>
                    <TableCell>{v.zoneName || '-'}</TableCell>
                    <TableCell align="center">{v.pointName || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.measureType || '-'} variant="outlined" /></TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{v.measureValue != null ? `${Number(v.measureValue).toFixed(2)} ${v.unit || ''}` : '-'}</TableCell>
                    <TableCell align="center">{v.standardValue || '-'}</TableCell>
                    <TableCell>{v.device || '-'}</TableCell>
                    <TableCell align="center">{v.measurer || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.evaluation || '-'} color={evalColor(v.evaluation)} /></TableCell>
                    <TableCell align="center" sx={{ width: 80, whiteSpace: 'nowrap', px: 0.5 }}>
                      <IconButton size="small" onClick={() => openEdit(v)}><EditIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={async () => { if (await showConfirm('삭제하시겠습니까?')) deleteMut.mutate(v.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={10} align="center" sx={{ color: 'text.disabled', py: 6 }}>측정 기록이 없습니다</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '측정 기록 수정' : '측정 기록 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>측정일</FormLabel>
              <FormCell borderRight><DatePickerField value={form.measureDate || null} onChange={d => setForm({ ...form, measureDate: d || '' })} /></FormCell>
              <FormLabel>측정유형</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={form.measureType || ''} onChange={e => setForm({ ...form, measureType: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{MEASURE_TYPES.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>구역</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.zoneName || ''} onChange={e => setForm({ ...form, zoneName: e.target.value })} /></FormCell>
              <FormLabel>측정 지점</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.pointName || ''} onChange={e => setForm({ ...form, pointName: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>측정값</FormLabel>
              <FormCell borderRight><NumberField fullWidth value={form.measureValue ?? null} onChange={v => setForm({ ...form, measureValue: v ?? undefined })} step={0.001} thousandSeparator={false} /></FormCell>
              <FormLabel>단위</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={form.unit || ''} onChange={e => setForm({ ...form, unit: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>기준값</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" placeholder="10 μSv/h" value={form.standardValue || ''} onChange={e => setForm({ ...form, standardValue: e.target.value })} /></FormCell>
              <FormLabel>평가</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={form.evaluation || ''} onChange={e => setForm({ ...form, evaluation: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{EVALS.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>측정기기</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.device || ''} onChange={e => setForm({ ...form, device: e.target.value })} /></FormCell>
              <FormLabel>측정자</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.measurer || ''} onChange={e => setForm({ ...form, measurer: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={submit} disabled={!form.measureDate}>저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default RadMeasurementTab
