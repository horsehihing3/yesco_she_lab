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
import { radSourceApi, radStatsApi } from '../../api/radiationApi'
import type { RadSource } from '../../types/radiation.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const TYPES = ['방사선 발생장치', '방사성 동위원소']
const STATUSES = ['유효', '임박', '만료', '폐기', '휴지']

const statusColor = (s?: string): 'success' | 'warning' | 'error' | 'default' =>
  s === '유효' ? 'success' : s === '임박' ? 'warning' : s === '만료' || s === '폐기' ? 'error' : 'default'

const emptyForm: Partial<RadSource> = { sourceType: '방사선 발생장치', status: '유효' }

const RadSourceTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { data: items = [], isLoading } = useQuery({ queryKey: ['radSources'], queryFn: radSourceApi.list })
  const { data: stats } = useQuery({ queryKey: ['radStats'], queryFn: radStatsApi.get })

  const [searchInput, setSearchInput] = useState('')

  const [search, setSearch] = useState('')

  const applySearch = () => setSearch(searchInput)

  const handleResetSearch = () => { setSearchInput(''); setSearch('') }
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<RadSource | null>(null)
  const [form, setForm] = useState<Partial<RadSource>>(emptyForm)

  const createMut = useMutation({
    mutationFn: radSourceApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radSources'] }); qc.invalidateQueries({ queryKey: ['radStats'] }); setOpen(false) },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<RadSource> }) => radSourceApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radSources'] }); qc.invalidateQueries({ queryKey: ['radStats'] }); setOpen(false) },
  })
  const deleteMut = useMutation({
    mutationFn: radSourceApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radSources'] }); qc.invalidateQueries({ queryKey: ['radStats'] }) },
  })

  const filtered = useMemo(() => items.filter(v => {
    if (statusFilter && v.status !== statusFilter) return false
    if (typeFilter && v.sourceType !== typeFilter) return false
    if (search && !v.name.includes(search) && !(v.mgmtNo || '').includes(search) && !(v.isotope || '').includes(search)) return false
    return true
  }), [items, statusFilter, typeFilter, search])

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, permitDate: todayStr(), expireDate: todayStr() }); setOpen(true) }
  const openEdit = (v: RadSource) => { setEditing(v); setForm({ ...v }); setOpen(true) }
  const submit = () => {
    if (editing) updateMut.mutate({ id: editing.id, e: form })
    else createMut.mutate(form)
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.sourceTotal ?? 0}   label={t('radSourceTab.label1', '총 방사선원')} sub="등록된 방사선원" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.sourceValid ?? 0}   label={t('radSourceTab.label2', '유효 허가')} /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.sourceNear ?? 0}    label={t('radSourceTab.label3', '허가 임박')} sub="30일 이내 만료" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.sourceExpired ?? 0} label={t('radSourceTab.label4', '허가 만료')} /></Grid>
      </Grid>

      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>방사선원 허가 관리</strong> — 원자력안전위원회 허가 만료 30일 전 갱신 신청 필수 (원자력안전법 §53)
      </Alert>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2, justifyContent: 'flex-start' }} alignItems="center">
        <ListSearchBar placeholder="관리번호/명칭/핵종 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch}
          sx={{ width: { xs: '100%', sm: 240 } }} />
        <TextField select size="small" sx={{ minWidth: 150 }} label={t('radSourceTab.label5', '구분')} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <MenuItem value="">전체</MenuItem>
          {TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <TextField select size="small" sx={{ minWidth: 120 }} label={t('radSourceTab.label6', '상태')} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <MenuItem value="">전체</MenuItem>
          {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
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
                <TableCell align="center">관리번호</TableCell>
                <TableCell>명칭</TableCell>
                <TableCell align="center">구분</TableCell>
                <TableCell align="center">핵종/에너지</TableCell>
                <TableCell align="center">방사능/출력</TableCell>
                <TableCell align="center">설치 위치</TableCell>
                <TableCell align="center">허가번호</TableCell>
                <TableCell align="center">만료일</TableCell>
                <TableCell align="center">상태</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>액션</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {filtered.map(v => (
                  <TableRow key={v.id} hover>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{v.mgmtNo}</TableCell>
                    <TableCell>{v.name}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.sourceType || '-'} variant="outlined" /></TableCell>
                    <TableCell align="center">{v.isotope || '-'}</TableCell>
                    <TableCell align="center">{v.activity || '-'}</TableCell>
                    <TableCell align="center">{v.location || '-'}</TableCell>
                    <TableCell align="center">{v.permitNo || '-'}</TableCell>
                    <TableCell align="center">{v.expireDate || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.status} color={statusColor(v.status)} /></TableCell>
                    <TableCell align="center" sx={{ width: 80, whiteSpace: 'nowrap', px: 0.5 }}>
                      <IconButton size="small" onClick={() => openEdit(v)}><EditIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={async () => { if (await showConfirm(t('radSourceTab.msg1', '삭제하시겠습니까?'))) deleteMut.mutate(v.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={10} align="center" sx={{ color: 'text.disabled', py: 6 }}>등록된 방사선원이 없습니다</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '방사선원 수정' : '방사선원 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>관리번호</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.mgmtNo || ''} onChange={e => setForm({ ...form, mgmtNo: e.target.value })} /></FormCell>
              <FormLabel required>명칭</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>구분</FormLabel>
              <FormCell borderRight><TextField select fullWidth size="small" value={form.sourceType || ''} onChange={e => setForm({ ...form, sourceType: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></FormCell>
              <FormLabel>상태</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={form.status || '유효'} onChange={e => setForm({ ...form, status: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>핵종/에너지</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.isotope || ''} onChange={e => setForm({ ...form, isotope: e.target.value })} /></FormCell>
              <FormLabel>방사능/출력</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.activity || ''} onChange={e => setForm({ ...form, activity: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>제조사</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.maker || ''} onChange={e => setForm({ ...form, maker: e.target.value })} /></FormCell>
              <FormLabel>설치 위치</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>허가번호</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.permitNo || ''} onChange={e => setForm({ ...form, permitNo: e.target.value })} /></FormCell>
              <FormLabel>책임자</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.ownerName || ''} onChange={e => setForm({ ...form, ownerName: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>허가일</FormLabel>
              <FormCell borderRight><DatePickerField value={form.permitDate || null} onChange={d => setForm({ ...form, permitDate: d || undefined })} /></FormCell>
              <FormLabel>만료일</FormLabel>
              <FormCell><DatePickerField value={form.expireDate || null} onChange={d => setForm({ ...form, expireDate: d || undefined })} /></FormCell>
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

export default RadSourceTab
