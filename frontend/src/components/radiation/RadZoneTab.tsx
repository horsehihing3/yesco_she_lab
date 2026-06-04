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
import { radZoneApi, radStatsApi } from '../../api/radiationApi'
import type { RadZone } from '../../types/radiation.types'
import StatCard from '../legalCompliance/StatCard'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const ZONE_TYPES = ['방사선관리구역', '방사선작업구역', '감시구역']
const CYCLES = ['월 1회', '주 1회', '일 1회', '작업 전후', '연 1회']

const zoneColor = (t?: string): 'error' | 'warning' | 'info' | 'default' =>
  t === '방사선관리구역' ? 'error' : t === '방사선작업구역' ? 'warning' : t === '감시구역' ? 'info' : 'default'

const emptyForm: Partial<RadZone> = { zoneType: '방사선관리구역', measureCycle: '월 1회' }

const RadZoneTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { data: items = [], isLoading } = useQuery({ queryKey: ['radZones'], queryFn: radZoneApi.list })
  const { data: stats } = useQuery({ queryKey: ['radStats'], queryFn: radStatsApi.get })

  const [searchInput, setSearchInput] = useState('')

  const [search, setSearch] = useState('')

  const applySearch = () => setSearch(searchInput)

  const handleResetSearch = () => { setSearchInput(''); setSearch('') }
  const [typeFilter, setTypeFilter] = useState('')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<RadZone | null>(null)
  const [form, setForm] = useState<Partial<RadZone>>(emptyForm)

  const createMut = useMutation({
    mutationFn: radZoneApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radZones'] }); qc.invalidateQueries({ queryKey: ['radStats'] }); setOpen(false) },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<RadZone> }) => radZoneApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radZones'] }); qc.invalidateQueries({ queryKey: ['radStats'] }); setOpen(false) },
  })
  const deleteMut = useMutation({
    mutationFn: radZoneApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radZones'] }); qc.invalidateQueries({ queryKey: ['radStats'] }) },
  })

  const filtered = useMemo(() => items.filter(v => {
    if (typeFilter && v.zoneType !== typeFilter) return false
    if (search && !v.name.includes(search) && !(v.location || '').includes(search)) return false
    return true
  }), [items, typeFilter, search])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true) }
  const openEdit = (v: RadZone) => { setEditing(v); setForm({ ...v }); setOpen(true) }
  const submit = () => {
    if (editing) updateMut.mutate({ id: editing.id, e: form })
    else createMut.mutate(form)
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.zoneTotal ?? 0} label="총 구역" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={items.filter(v => v.zoneType === '방사선관리구역').length} label="방사선관리구역" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={items.filter(v => v.zoneType === '방사선작업구역').length} label="방사선작업구역" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={items.filter(v => v.zoneType === '감시구역').length} label="감시구역" /></Grid>
      </Grid>

      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>방사선 구역 설정 기준</strong> — 방사선관리구역 1 mSv/주 초과 · 출입통제 및 표지 의무 · 정기 측정 기록 보존 (원자력안전법 §54)
      </Alert>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems="center">
        <ListSearchBar fullWidth placeholder="구역명/위치 검색..." value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
        <TextField select size="small" sx={{ minWidth: 170 }} label="구역구분" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <MenuItem value="">전체</MenuItem>
          {ZONE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>New</Button>
      </Stack>

      <Paper variant="outlined">
        {isLoading ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>구역명</TableCell>
                <TableCell align="center">구분</TableCell>
                <TableCell>위치</TableCell>
                <TableCell align="center">면적 (㎡)</TableCell>
                <TableCell align="center">측정주기</TableCell>
                <TableCell align="center">관리자</TableCell>
                <TableCell align="center">관련 선원</TableCell>
                <TableCell align="center">기준값</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>액션</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {filtered.map(v => (
                  <TableRow key={v.id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{v.name}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.zoneType || '-'} color={zoneColor(v.zoneType)} /></TableCell>
                    <TableCell>{v.location || '-'}</TableCell>
                    <TableCell align="center">{v.areaM2 != null ? Number(v.areaM2).toFixed(1) : '-'}</TableCell>
                    <TableCell align="center">{v.measureCycle || '-'}</TableCell>
                    <TableCell align="center">{v.ownerName || '-'}</TableCell>
                    <TableCell align="center">{v.relatedSource || '-'}</TableCell>
                    <TableCell align="center">{v.standardValue || '-'}</TableCell>
                    <TableCell align="center" sx={{ width: 80, whiteSpace: 'nowrap', px: 0.5 }}>
                      <IconButton size="small" onClick={() => openEdit(v)}><EditIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={async () => { if (await showConfirm('삭제하시겠습니까?')) deleteMut.mutate(v.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={9} align="center" sx={{ color: 'text.disabled', py: 6 }}>등록된 구역이 없습니다</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '구역 수정' : '구역 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>구역명</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></FormCell>
              <FormLabel>구역구분</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={form.zoneType || ''} onChange={e => setForm({ ...form, zoneType: e.target.value })}>
<MenuItem value="">선택</MenuItem>{ZONE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>위치</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} /></FormCell>
              <FormLabel>면적 (㎡)</FormLabel>
              <FormCell><NumberField fullWidth value={form.areaM2 ?? null} onChange={v => setForm({ ...form, areaM2: v ?? undefined })} step={0.1} thousandSeparator={false} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>측정주기</FormLabel>
              <FormCell borderRight><TextField select fullWidth size="small" value={form.measureCycle || ''} onChange={e => setForm({ ...form, measureCycle: e.target.value })}>
<MenuItem value="">선택</MenuItem>{CYCLES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></FormCell>
              <FormLabel>관리자</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.ownerName || ''} onChange={e => setForm({ ...form, ownerName: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>관련 선원</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" placeholder="XR-001, IR-002" value={form.relatedSource || ''} onChange={e => setForm({ ...form, relatedSource: e.target.value })} /></FormCell>
              <FormLabel>기준값</FormLabel>
              <FormCell><TextField fullWidth size="small" placeholder="1 mSv/주 초과" value={form.standardValue || ''} onChange={e => setForm({ ...form, standardValue: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>출입 규정</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.accessRule || ''} onChange={e => setForm({ ...form, accessRule: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={submit} disabled={!form.name}>저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default RadZoneTab
