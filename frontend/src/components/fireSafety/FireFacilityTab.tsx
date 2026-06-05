import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Alert,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress,
} from '@mui/material'
import ListSearchBar from '../common/ListSearchBar'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { fireFacilityApi, fireStatsApi } from '../../api/fireSafetyApi'
import type { FireFacility } from '../../types/fireSafety.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const CATEGORIES = ['소화설비', '경보설비', '피난설비', '소화활동설비', '소화용수설비']
const CYCLES = ['월1회', '분기', '반기', '연1회']
const STATUSES = ['정상', '점검필요', '불량', '수리중']

const statusColor = (s?: string): 'success' | 'warning' | 'error' | 'info' | 'default' =>
  s === '정상' ? 'success' : s === '점검필요' ? 'warning' : s === '불량' ? 'error' : s === '수리중' ? 'info' : 'default'

const emptyForm: Partial<FireFacility> = { category: '소화설비', checkCycle: '연1회', status: '정상' }

const FireFacilityTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { data: items = [], isLoading } = useQuery({ queryKey: ['fireFacilities'], queryFn: fireFacilityApi.list })
  const { data: stats } = useQuery({ queryKey: ['fireStats'], queryFn: fireStatsApi.get })

  const [searchInput, setSearchInput] = useState('')

  const [search, setSearch] = useState('')

  const applySearch = () => setSearch(searchInput)

  const handleResetSearch = () => { setSearchInput(''); setSearch('') }
  const [catFilter, setCatFilter] = useState('')
  const [stFilter, setStFilter] = useState('')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<FireFacility | null>(null)
  const [form, setForm] = useState<Partial<FireFacility>>(emptyForm)

  const createMut = useMutation({
    mutationFn: fireFacilityApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fireFacilities'] }); qc.invalidateQueries({ queryKey: ['fireStats'] }); setOpen(false) },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<FireFacility> }) => fireFacilityApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fireFacilities'] }); qc.invalidateQueries({ queryKey: ['fireStats'] }); setOpen(false) },
  })
  const deleteMut = useMutation({
    mutationFn: fireFacilityApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fireFacilities'] }); qc.invalidateQueries({ queryKey: ['fireStats'] }) },
  })

  const filtered = useMemo(() => items.filter(v => {
    if (catFilter && v.category !== catFilter) return false
    if (stFilter && v.status !== stFilter) return false
    if (search && !v.name.includes(search) && !v.mgmtNo.includes(search) && !(v.location || '').includes(search) && !(v.lawBasis || '').includes(search)) return false
    return true
  }), [items, catFilter, stFilter, search])

  const badItems = items.filter(v => v.status === '불량' || v.status === '수리중')

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, installDate: todayStr(), lastCheck: todayStr(), nextCheck: todayStr() }); setOpen(true) }
  const openEdit = (v: FireFacility) => { setEditing(v); setForm({ ...v }); setOpen(true) }
  const submit = () => {
    if (editing) updateMut.mutate({ id: editing.id, e: form })
    else createMut.mutate(form)
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={2}><StatCard color="red"    value={stats?.facTotal ?? 0}    label="소방시설 총계" sub="5개 분류 등록" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="green"  value={stats?.facOk ?? 0}       label="정상 작동" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="yellow" value={stats?.facWarn ?? 0}     label="점검 필요" sub="D-30 이내" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="red"    value={stats?.facBad ?? 0}      label="불량·수리 중" sub="즉시 조치" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="blue"   value={`${stats?.facOkRate ?? 0}%`} label="전체 정상률" sub="목표 95% 이상" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="purple" value={stats?.planTotal ?? 0}   label="연간 점검 계획" /></Grid>
      </Grid>

      {badItems.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>불량·수리 시설 {badItems.length}건 — 소방안전관리자 즉시 확인 및 수리업체 연락 필요</strong>
          {' · '}
          {badItems.slice(0, 3).map(i => `${i.name}(${i.location})`).join(' · ')}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems="center">
        <ListSearchBar fullWidth placeholder="시설명/관리번호/위치/법령 검색..." value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
        <TextField select size="small" sx={{ minWidth: 150 }} label="분류" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <MenuItem value="">전체</MenuItem>
          {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
        <TextField select size="small" sx={{ minWidth: 130 }} label="상태" value={stFilter} onChange={e => setStFilter(e.target.value)}>
          <MenuItem value="">전체</MenuItem>
          {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>New</Button>
      </Stack>

      <Paper variant="outlined">
        {isLoading ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell align="center">관리번호</TableCell>
                <TableCell>시설명</TableCell>
                <TableCell align="center">분류</TableCell>
                <TableCell align="center">규격</TableCell>
                <TableCell align="center">수량</TableCell>
                <TableCell>설치위치</TableCell>
                <TableCell align="center">법령 근거</TableCell>
                <TableCell align="center">점검주기</TableCell>
                <TableCell align="center">최근점검</TableCell>
                <TableCell align="center">다음점검</TableCell>
                <TableCell align="center">상태</TableCell>
                <TableCell align="center">담당자</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>액션</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {filtered.map(v => (
                  <TableRow key={v.id} hover>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{v.mgmtNo}</TableCell>
                    <TableCell>{v.name}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.category || '-'} variant="outlined" /></TableCell>
                    <TableCell align="center">{v.spec || '-'}</TableCell>
                    <TableCell align="center">{v.qty || '-'}</TableCell>
                    <TableCell>{v.location || '-'}</TableCell>
                    <TableCell align="center">{v.lawBasis || '-'}</TableCell>
                    <TableCell align="center">{v.checkCycle || '-'}</TableCell>
                    <TableCell align="center">{v.lastCheck || '-'}</TableCell>
                    <TableCell align="center">{v.nextCheck || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.status} color={statusColor(v.status)} /></TableCell>
                    <TableCell align="center">{v.mgrName || '-'}</TableCell>
                    <TableCell align="center" sx={{ width: 80, whiteSpace: 'nowrap', px: 0.5 }}>
                      <IconButton size="small" onClick={() => openEdit(v)}><EditIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={async () => { if (await showConfirm('삭제하시겠습니까?')) deleteMut.mutate(v.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={13} align="center" sx={{ color: 'text.disabled', py: 6 }}>등록된 소방시설이 없습니다</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '소방시설 수정' : '소방시설 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>관리번호</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.mgmtNo || ''} onChange={e => setForm({ ...form, mgmtNo: e.target.value })} /></FormCell>
              <FormLabel required>분류</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel required>시설명</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>규격·사양</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.spec || ''} onChange={e => setForm({ ...form, spec: e.target.value })} /></FormCell>
              <FormLabel>수량</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.qty || ''} onChange={e => setForm({ ...form, qty: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>설치 위치</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} /></FormCell>
              <FormLabel>설치일</FormLabel>
              <FormCell><DatePickerField value={form.installDate || null} onChange={d => setForm({ ...form, installDate: d || undefined })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>제조사</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.maker || ''} onChange={e => setForm({ ...form, maker: e.target.value })} /></FormCell>
              <FormLabel>제조번호</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.makerNo || ''} onChange={e => setForm({ ...form, makerNo: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>설치 업체</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.installer || ''} onChange={e => setForm({ ...form, installer: e.target.value })} /></FormCell>
              <FormLabel>법령 근거</FormLabel>
              <FormCell><TextField fullWidth size="small" placeholder="예) 소방시설법 §12" value={form.lawBasis || ''} onChange={e => setForm({ ...form, lawBasis: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>점검 주기</FormLabel>
              <FormCell borderRight><TextField select fullWidth size="small" value={form.checkCycle || ''} onChange={e => setForm({ ...form, checkCycle: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{CYCLES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></FormCell>
              <FormLabel>담당자</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.mgrName || ''} onChange={e => setForm({ ...form, mgrName: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>최근 점검일</FormLabel>
              <FormCell borderRight><DatePickerField value={form.lastCheck || null} onChange={d => setForm({ ...form, lastCheck: d || undefined })} /></FormCell>
              <FormLabel>다음 점검일</FormLabel>
              <FormCell><DatePickerField value={form.nextCheck || null} onChange={d => setForm({ ...form, nextCheck: d || undefined })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>현재 상태</FormLabel>
              <FormCell borderRight><TextField select fullWidth size="small" value={form.status || ''} onChange={e => setForm({ ...form, status: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></FormCell>
              <FormLabel>취득 가격 (원)</FormLabel>
              <FormCell><NumberField fullWidth value={form.acquirePrice ?? null} onChange={v => setForm({ ...form, acquirePrice: v ?? undefined })} /></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>비고</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.note || ''} onChange={e => setForm({ ...form, note: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={submit} disabled={!form.mgmtNo || !form.name}>저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default FireFacilityTab
