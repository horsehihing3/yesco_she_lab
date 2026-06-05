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
import { permitInspectionApi, permitLifecycleStatsApi } from '../../api/permitLifecycleApi'
import type { PermitInspection } from '../../types/permitLifecycle.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const FREQS = ['일', '주', '월', '분기', '반기', '연']
const TYPES = ['법정', '자체', '외부위탁']
const RESULTS = ['적합', '시정필요', '부적합']

const daysUntil = (d?: string) => {
  if (!d) return Infinity
  return Math.ceil((new Date(d).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000)
}

const statusBadge = (next?: string): { label: string; color: 'success' | 'warning' | 'error' } => {
  const d = daysUntil(next)
  if (d < 0) return { label: '미실시', color: 'error' }
  if (d <= 30) return { label: '임박', color: 'warning' }
  return { label: '정상', color: 'success' }
}

const resultColor = (r?: string): 'success' | 'warning' | 'error' | 'default' =>
  r === '적합' ? 'success' : r === '시정필요' ? 'warning' : r === '부적합' ? 'error' : 'default'

const emptyForm: Partial<PermitInspection> = { frequency: '월', inspectionType: '법정', lastResult: '적합' }

const PermitInspectionTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm, showSuccess, showError } = useAlert()

  const { data: list = [], isLoading } = useQuery({ queryKey: ['permitInspection'], queryFn: permitInspectionApi.list })
  const { data: stats } = useQuery({ queryKey: ['permitLifecycleStats'], queryFn: permitLifecycleStatsApi.get })

  const [searchInput, setSearchInput] = useState('')

  const [search, setSearch] = useState('')

  const applySearch = () => setSearch(searchInput)

  const handleResetSearch = () => { setSearchInput(''); setSearch('') }
  const [filterFreq, setFilterFreq] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PermitInspection | null>(null)
  const [form, setForm] = useState<Partial<PermitInspection>>(emptyForm)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['permitInspection'] })
    qc.invalidateQueries({ queryKey: ['permitLifecycleStats'] })
  }

  const createM = useMutation({ mutationFn: permitInspectionApi.create, onSuccess: () => { invalidate(); setOpen(false); showSuccess('등록되었습니다') }, onError: () => showError('등록 실패') })
  const updateM = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<PermitInspection> }) => permitInspectionApi.update(id, e), onSuccess: () => { invalidate(); setOpen(false); showSuccess('수정되었습니다') }, onError: () => showError('수정 실패') })
  const deleteM = useMutation({ mutationFn: permitInspectionApi.remove, onSuccess: () => { invalidate(); showSuccess('삭제되었습니다') } })

  const filtered = useMemo(() => list.filter((x) => {
    if (filterFreq !== 'all' && x.frequency !== filterFreq) return false
    if (search && !`${x.inspectionName} ${x.targetFacility || ''}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [list, filterFreq, search])

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, lastDate: todayStr(), nextDate: todayStr() }); setOpen(true) }
  const openEdit = (item: PermitInspection) => { setEditing(item); setForm({ ...item }); setOpen(true) }
  const handleSave = () => {
    if (!form.inspectionName || !form.frequency || !form.nextDate) { showError('점검명·주기·차기 점검일 필수'); return }
    if (editing) updateM.mutate({ id: editing.id, e: form })
    else createM.mutate(form)
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.ipTotal ?? 0}   label="총 점검 항목" sub="정기 점검" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={(stats?.ipTotal ?? 0) - (stats?.ipNear ?? 0) - (stats?.ipOverdue ?? 0)} label="정상" sub="기한 내" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.ipNear ?? 0}    label="임박 (D-30)" sub="곧 만기" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.ipOverdue ?? 0} label="미실시" sub="기한 초과" /></Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <ListSearchBar placeholder="점검명·시설 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch} sx={{ flex: 1, minWidth: 200 }} />
          <TextField select size="small" label="주기" value={filterFreq} onChange={(e) => setFilterFreq(e.target.value)} sx={{ minWidth: 110 }}>
            <MenuItem value="all">전체</MenuItem>
            {FREQS.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
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
                  <TableCell sx={{ fontWeight: 'bold' }}>점검명</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 80 }}>주기</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>대상 시설</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>최근 점검</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>차기 점검</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>최근 결과</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 90 }}>상태</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 90 }}>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.disabled' }}>점검 항목이 없습니다</TableCell></TableRow>
                ) : filtered.map((x) => {
                  const st = statusBadge(x.nextDate)
                  const dD = daysUntil(x.nextDate)
                  return (
                    <TableRow key={x.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{x.inspectionName}</TableCell>
                      <TableCell align="center"><Chip size="small" label={x.frequency} variant="outlined" /></TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{x.targetFacility || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.lastDate || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: dD < 0 ? 'error.main' : dD <= 30 ? 'warning.main' : 'inherit' }}>
                        {x.nextDate}<Box sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>D{dD >= 0 ? '-' : '+'}{Math.abs(dD)}</Box>
                      </TableCell>
                      <TableCell align="center"><Chip size="small" label={x.lastResult || '-'} color={resultColor(x.lastResult)} variant="outlined" /></TableCell>
                      <TableCell align="center"><Chip size="small" label={st.label} color={st.color} /></TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap', px: 0.5 }}>
                        <IconButton size="small" onClick={() => openEdit(x)}><EditIcon fontSize="inherit" /></IconButton>
                        <IconButton size="small" onClick={async () => {
                          if (await showConfirm('이 점검 항목을 삭제하시겠습니까?')) deleteM.mutate(x.id)
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
        <DialogTitle>{editing ? '점검 항목 수정' : '점검 항목 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>점검 명칭</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.inspectionName || ''} onChange={(e) => setForm({ ...form, inspectionName: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>점검 구분</FormLabel>
              <FormCell borderRight>
                <TextField select fullWidth size="small" value={form.inspectionType || ''} onChange={(e) => setForm({ ...form, inspectionType: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </FormCell>
              <FormLabel required>점검 주기</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.frequency || ''} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {FREQS.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                </TextField>
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>대상 시설</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.targetFacility || ''} onChange={(e) => setForm({ ...form, targetFacility: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>관련 법규</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.legalBasis || ''} onChange={(e) => setForm({ ...form, legalBasis: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>최근 점검일</FormLabel>
              <FormCell borderRight><DatePickerField value={form.lastDate || null} onChange={(d) => setForm({ ...form, lastDate: d || undefined })} /></FormCell>
              <FormLabel required>차기 점검일</FormLabel>
              <FormCell><DatePickerField value={form.nextDate || null} onChange={(d) => setForm({ ...form, nextDate: d || undefined })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>담당자</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.assignee || ''} onChange={(e) => setForm({ ...form, assignee: e.target.value })} /></FormCell>
              <FormLabel>최근 결과</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.lastResult || ''} onChange={(e) => setForm({ ...form, lastResult: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {RESULTS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </TextField>
              </FormCell>
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

export default PermitInspectionTab
