import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { dpHearingApi, dpMgmtStatsApi } from '../../api/diseasePreventionMgmtApi'
import type { DpHearing } from '../../types/diseasePreventionMgmt.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'

const STATUSES = ['정상', 'STS발생', 'D1', 'D2']
const EXAM_TYPES = ['기준선', '정기', '확인']

const statusColor = (s?: string): 'success' | 'warning' | 'error' | 'default' =>
  s === 'D2' ? 'error' : s === 'D1' ? 'error' : s === 'STS발생' ? 'warning' : s === '정상' ? 'success' : 'default'

const emptyForm: Partial<DpHearing> = { status: '정상', examType: '정기' }

const MENU = '보건 관리 › 질병예방 관리 › 각 질환 탭'

const DpHearingTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm, showSuccess, showError } = useAlert()
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const isAdmin = user?.role === 'SYSTEM_ADMIN'
  const myRoles: string[] = ['guest', ...(isAdmin ? ['superAdmin'] : [])]

  const { data: list = [], isLoading } = useQuery({ queryKey: ['dpHearing'], queryFn: dpHearingApi.list })
  const { data: stats } = useQuery({ queryKey: ['dpMgmtStats'], queryFn: dpMgmtStatsApi.get })

  const [searchInput, setSearchInput] = useState('')

  const [search, setSearch] = useState('')

  const applySearch = () => setSearch(searchInput)

  const handleResetSearch = () => { setSearchInput(''); setSearch('') }
  const [filterStatus, setFilterStatus] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<DpHearing | null>(null)
  const [form, setForm] = useState<Partial<DpHearing>>(emptyForm)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['dpHearing'] })
    qc.invalidateQueries({ queryKey: ['dpMgmtStats'] })
  }

  const createM = useMutation({ mutationFn: dpHearingApi.create, onSuccess: () => { invalidate(); setOpen(false); showSuccess('등록되었습니다') }, onError: () => showError('등록 실패') })
  const updateM = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<DpHearing> }) => dpHearingApi.update(id, e), onSuccess: () => { invalidate(); setOpen(false); showSuccess('수정되었습니다') }, onError: () => showError('수정 실패') })
  const deleteM = useMutation({ mutationFn: dpHearingApi.remove, onSuccess: () => { invalidate(); showSuccess('삭제되었습니다') } })

  const filtered = useMemo(() => list.filter((x) => {
    if (filterStatus !== 'all' && x.status !== filterStatus) return false
    if (search && !`${x.workerName} ${x.department || ''}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [list, filterStatus, search])

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, examDate: todayStr() }); setOpen(true) }
  const openEdit = (item: DpHearing) => { setEditing(item); setForm({ ...item }); setOpen(true) }
  const handleSave = () => {
    if (!form.workerName) { showError('근로자명을 입력해주세요'); return }
    if (editing) updateM.mutate({ id: editing.id, e: form })
    else createM.mutate(form)
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.hearingTotal ?? 0} label="노출자" sub="85dB 이상" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.hearingOk ?? 0}    label="정상" sub="기준 이내" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.hearingSts ?? 0}   label="STS 발생" sub="청력 악화" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.hearingD ?? 0}     label="소음성 난청" sub="D1·D2 판정" /></Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <ListSearchBar placeholder="근로자·작업장 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch} sx={{ flex: 1, minWidth: 200 }} />
          <TextField select size="small" label="상태" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} sx={{ minWidth: 110 }}>
            <MenuItem value="all">전체</MenuItem>
            {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
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
                  <TableCell sx={{ fontWeight: 'bold' }}>근로자</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>부서</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>소음 (dB)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 70 }}>NRR</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>우 4k/6k</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>좌 4k/6k</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>상태</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 90 }}>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.disabled' }}>청력 기록이 없습니다</TableCell></TableRow>
                ) : filtered.map((x) => {
                  const dbHigh = (x.noiseLevel ?? 0) >= 90 ? 'error.main' : (x.noiseLevel ?? 0) >= 85 ? 'warning.main' : 'inherit'
                  return (
                    <TableRow key={x.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{x.workerName}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{x.department || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', color: dbHigh, fontWeight: 600 }}>{x.noiseLevel ?? '-'}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{x.ppeNrr ?? '-'}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.right4k}/{x.right6k}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.left4k}/{x.left6k}</TableCell>
                      <TableCell align="center"><Chip size="small" label={x.status || '-'} color={statusColor(x.status)} /></TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap', px: 0.5 }}>
                        {canSee(MENU, 'DETAIL', '수정', myRoles) && (
                          <IconButton size="small" onClick={() => openEdit(x)}><EditIcon fontSize="inherit" /></IconButton>
                        )}
                        {canSee(MENU, 'DETAIL', '삭제', myRoles) && (
                          <IconButton size="small" onClick={async () => {
                            if (await showConfirm('이 기록을 삭제하시겠습니까?')) deleteM.mutate(x.id)
                          }}><DeleteIcon fontSize="inherit" /></IconButton>
                        )}
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
        {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>신규 등록</Button>
        )}
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '청력 검사 수정' : '청력 검사 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>근로자명</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.workerName || ''} onChange={(e) => setForm({ ...form, workerName: e.target.value })} /></FormCell>
              <FormLabel>부서</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>소음 (dB)</FormLabel>
              <FormCell borderRight><NumberField fullWidth value={form.noiseLevel ?? null} onChange={(v) => setForm({ ...form, noiseLevel: v ?? undefined })} thousandSeparator={false} /></FormCell>
              <FormLabel>노출시간 (h/일)</FormLabel>
              <FormCell><NumberField fullWidth value={form.exposureHours ?? null} onChange={(v) => setForm({ ...form, exposureHours: v ?? undefined })} thousandSeparator={false} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>보호구</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.ppeType || ''} onChange={(e) => setForm({ ...form, ppeType: e.target.value })} /></FormCell>
              <FormLabel>NRR</FormLabel>
              <FormCell><NumberField fullWidth value={form.ppeNrr ?? null} onChange={(v) => setForm({ ...form, ppeNrr: v ?? undefined })} thousandSeparator={false} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>우 4k / 6k (dB)</FormLabel>
              <FormCell borderRight>
                <Stack direction="row" spacing={1}>
                  <NumberField fullWidth value={form.right4k ?? null} onChange={(v) => setForm({ ...form, right4k: v ?? undefined })} thousandSeparator={false} placeholder="4k" />
                  <NumberField fullWidth value={form.right6k ?? null} onChange={(v) => setForm({ ...form, right6k: v ?? undefined })} thousandSeparator={false} placeholder="6k" />
                </Stack>
              </FormCell>
              <FormLabel>좌 4k / 6k (dB)</FormLabel>
              <FormCell>
                <Stack direction="row" spacing={1}>
                  <NumberField fullWidth value={form.left4k ?? null} onChange={(v) => setForm({ ...form, left4k: v ?? undefined })} thousandSeparator={false} placeholder="4k" />
                  <NumberField fullWidth value={form.left6k ?? null} onChange={(v) => setForm({ ...form, left6k: v ?? undefined })} thousandSeparator={false} placeholder="6k" />
                </Stack>
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>STS 결과</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.stsResult || ''} onChange={(e) => setForm({ ...form, stsResult: e.target.value })} placeholder="예: 발생 / 없음" /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>검사일</FormLabel>
              <FormCell borderRight><DatePickerField value={form.examDate || null} onChange={(d) => setForm({ ...form, examDate: d || undefined })} /></FormCell>
              <FormLabel>검사 구분</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.examType || ''} onChange={(e) => setForm({ ...form, examType: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {EXAM_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>판정</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.status || ''} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
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
          {canSee(MENU, 'DETAIL', '저장', myRoles) && (
            <Button variant="contained" onClick={handleSave} disabled={createM.isPending || updateM.isPending}>저장</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DpHearingTab
