import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { permitRegistryApi, permitLifecycleStatsApi } from '../../api/permitLifecycleApi'
import type { PermitRegistry } from '../../types/permitLifecycle.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const CATEGORIES = ['환경', '안전', '보건', '소방', '화학', '건축']

const computeStatus = (p: PermitRegistry): '유효' | '만료임박' | '만료' | '무기한' => {
  if (!p.expiryDate) return '무기한'
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const exp = new Date(p.expiryDate)
  const diff = Math.ceil((exp.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return '만료'
  if (diff <= 90) return '만료임박'
  return '유효'
}

const statusColor = (s: string): 'success' | 'warning' | 'error' | 'default' =>
  s === '유효' ? 'success' : s === '만료임박' ? 'warning' : s === '만료' ? 'error' : 'default'

const categoryColor = (c: string): 'success' | 'error' | 'secondary' | 'warning' | 'info' | 'default' => ({
  '환경': 'success', '안전': 'error', '보건': 'secondary',
  '소방': 'warning', '화학': 'info', '건축': 'default',
})[c] as any || 'default'

const emptyForm: Partial<PermitRegistry> = { category: '환경' }

const PermitRegistryTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm, showSuccess, showError } = useAlert()

  const { data: list = [], isLoading } = useQuery({ queryKey: ['permitRegistry'], queryFn: permitRegistryApi.list })
  const { data: stats } = useQuery({ queryKey: ['permitLifecycleStats'], queryFn: permitLifecycleStatsApi.get })

  const [searchInput, setSearchInput] = useState('')

  const [search, setSearch] = useState('')

  const applySearch = () => setSearch(searchInput)

  const handleResetSearch = () => { setSearchInput(''); setSearch('') }
  const [filterCat, setFilterCat] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PermitRegistry | null>(null)
  const [form, setForm] = useState<Partial<PermitRegistry>>(emptyForm)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['permitRegistry'] })
    qc.invalidateQueries({ queryKey: ['permitLifecycleStats'] })
  }

  const createM = useMutation({ mutationFn: permitRegistryApi.create, onSuccess: () => { invalidate(); setOpen(false); showSuccess('등록되었습니다') }, onError: () => showError('등록 실패') })
  const updateM = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<PermitRegistry> }) => permitRegistryApi.update(id, e), onSuccess: () => { invalidate(); setOpen(false); showSuccess('수정되었습니다') }, onError: () => showError('수정 실패') })
  const deleteM = useMutation({ mutationFn: permitRegistryApi.remove, onSuccess: () => { invalidate(); showSuccess('삭제되었습니다') } })

  const filtered = useMemo(() => list.filter((x) => {
    if (filterCat !== 'all' && x.category !== filterCat) return false
    if (search) {
      const q = search.toLowerCase()
      if (!`${x.name} ${x.facility || ''} ${x.permitNumber || ''}`.toLowerCase().includes(q)) return false
    }
    return true
  }), [list, filterCat, search])

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, issuedDate: todayStr(), expiryDate: todayStr() }); setOpen(true) }
  const openEdit = (item: PermitRegistry) => { setEditing(item); setForm({ ...item }); setOpen(true) }
  const handleSave = () => {
    if (!form.name || !form.category) { showError('분야·인허가 명칭 필수'); return }
    if (editing) updateM.mutate({ id: editing.id, e: form })
    else createM.mutate(form)
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.regTotal ?? 0}   label="전체" sub="건" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.regValid ?? 0}   label="유효" sub="정상" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.regWarn ?? 0}    label="만료 임박" sub="90일 이내" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.regExpired ?? 0} label="만료" sub="즉시 조치" /></Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <ListSearchBar placeholder="인허가명·시설·허가번호 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch} sx={{ flex: 1, minWidth: 200 }} />
          <TextField select size="small" label="분야" value={filterCat} onChange={(e) => setFilterCat(e.target.value)} sx={{ minWidth: 120 }}>
            <MenuItem value="all">전체</MenuItem>
            {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ mb: 2 }}>
        {isLoading ? <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 80 }}>분야</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>인허가 명칭</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>발급 기관</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 150 }}>허가번호</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>발급일</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>만료일</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 90 }}>상태</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 90 }}>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.disabled' }}>인허가가 없습니다</TableCell></TableRow>
                ) : filtered.map((x) => {
                  const st = computeStatus(x)
                  return (
                    <TableRow key={x.id} hover>
                      <TableCell align="center"><Chip size="small" label={x.category} color={categoryColor(x.category)} variant="outlined" /></TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{x.name}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{x.agency || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.permitNumber || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.issuedDate || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.expiryDate || '-'}</TableCell>
                      <TableCell align="center"><Chip size="small" label={st} color={statusColor(st)} /></TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap', px: 0.5 }}>
                        <IconButton size="small" onClick={() => openEdit(x)}><EditIcon fontSize="inherit" /></IconButton>
                        <IconButton size="small" onClick={async () => {
                          if (await showConfirm('이 인허가를 삭제하시겠습니까?')) deleteM.mutate(x.id)
                        }}><DeleteIcon fontSize="inherit" /></IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Stack direction="row" justifyContent="flex-end">
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>신규 등록</Button>
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '인허가 수정' : '인허가 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>분야</FormLabel>
              <FormCell borderRight>
                <TextField select fullWidth size="small" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <MenuItem value="">선택</MenuItem>
                  {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </FormCell>
              <FormLabel>인허가 종류</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.permitType || ''} onChange={(e) => setForm({ ...form, permitType: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel required>인허가 명칭</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>관계 법규</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.law || ''} onChange={(e) => setForm({ ...form, law: e.target.value })} /></FormCell>
              <FormLabel>발급 기관</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.agency || ''} onChange={(e) => setForm({ ...form, agency: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>허가번호</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.permitNumber || ''} onChange={(e) => setForm({ ...form, permitNumber: e.target.value })} /></FormCell>
              <FormLabel>갱신 주기</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.cycle || ''} onChange={(e) => setForm({ ...form, cycle: e.target.value })} placeholder="예: 5년 / 2년 / 없음" /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>발급일</FormLabel>
              <FormCell borderRight><DatePickerField value={form.issuedDate || null} onChange={(d) => setForm({ ...form, issuedDate: d || undefined })} /></FormCell>
              <FormLabel>만료일</FormLabel>
              <FormCell><DatePickerField value={form.expiryDate || null} onChange={(d) => setForm({ ...form, expiryDate: d || undefined })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>대상 시설</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.facility || ''} onChange={(e) => setForm({ ...form, facility: e.target.value })} /></FormCell>
              <FormLabel>위치</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>담당자</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.manager || ''} onChange={(e) => setForm({ ...form, manager: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>비고</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleSave} disabled={createM.isPending || updateM.isPending}>저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PermitRegistryTab
