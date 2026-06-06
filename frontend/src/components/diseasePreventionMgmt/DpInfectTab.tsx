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
import { dpInfectApi, dpMgmtStatsApi } from '../../api/diseasePreventionMgmtApi'
import type { DpInfect } from '../../types/diseasePreventionMgmt.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'

const PROGRAM_TYPES = ['예방접종', '검진', '감염병발생', '노출사고']
const STATUSES = ['완료', '예정', '추적관리', '회복']

const typeColor = (t: string): 'success' | 'info' | 'error' | 'warning' | 'default' =>
  t === '예방접종' ? 'success' : t === '검진' ? 'info' :
  t === '감염병발생' ? 'error' : t === '노출사고' ? 'warning' : 'default'

const daysUntil = (d?: string) => {
  if (!d) return Infinity
  return Math.ceil((new Date(d).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000)
}

const emptyForm: Partial<DpInfect> = { programType: '예방접종', status: '완료' }

const MENU = '보건 관리 › 질병예방 관리 › 감염병'

const DpInfectTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm, showSuccess, showError } = useAlert()
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const isAdmin = user?.role === 'SYSTEM_ADMIN'
  const myRoles: string[] = ['guest', ...(isAdmin ? ['superAdmin'] : [])]

  const { data: list = [], isLoading } = useQuery({ queryKey: ['dpInfect'], queryFn: dpInfectApi.list })
  const { data: stats } = useQuery({ queryKey: ['dpMgmtStats'], queryFn: dpMgmtStatsApi.get })

  const [searchInput, setSearchInput] = useState('')

  const [search, setSearch] = useState('')

  const applySearch = () => setSearch(searchInput)

  const handleResetSearch = () => { setSearchInput(''); setSearch('') }
  const [filterType, setFilterType] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<DpInfect | null>(null)
  const [form, setForm] = useState<Partial<DpInfect>>(emptyForm)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['dpInfect'] })
    qc.invalidateQueries({ queryKey: ['dpMgmtStats'] })
  }

  const createM = useMutation({ mutationFn: dpInfectApi.create, onSuccess: () => { invalidate(); setOpen(false); showSuccess('등록되었습니다') }, onError: () => showError('등록 실패') })
  const updateM = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<DpInfect> }) => dpInfectApi.update(id, e), onSuccess: () => { invalidate(); setOpen(false); showSuccess('수정되었습니다') }, onError: () => showError('수정 실패') })
  const deleteM = useMutation({ mutationFn: dpInfectApi.remove, onSuccess: () => { invalidate(); showSuccess('삭제되었습니다') } })

  const filtered = useMemo(() => list.filter((x) => {
    if (filterType !== 'all' && x.programType !== filterType) return false
    if (search && !`${x.workerName} ${x.diseaseType || ''}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [list, filterType, search])

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, implDate: todayStr(), nextDueDate: todayStr() }); setOpen(true) }
  const openEdit = (item: DpInfect) => { setEditing(item); setForm({ ...item }); setOpen(true) }
  const handleSave = () => {
    if (!form.workerName || !form.programType) { showError('근로자명·프로그램 유형 필수'); return }
    if (editing) updateM.mutate({ id: editing.id, e: form })
    else createM.mutate(form)
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.infectTotal ?? 0} label="전체 기록" sub="예방·검진·발생" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.infectVac ?? 0}   label="예방접종" sub="등록 건수" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.infectDue ?? 0}   label="검진 임박" sub="30일 이내" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.infectEvent ?? 0} label="발생·노출" sub="대응 중" /></Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <ListSearchBar placeholder="근로자·질환 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch} sx={{ flex: 1, minWidth: 200 }} />
          <TextField select size="small" label="프로그램" value={filterType} onChange={(e) => setFilterType(e.target.value)} sx={{ minWidth: 130 }}>
            <MenuItem value="all">전체</MenuItem>
            {PROGRAM_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
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
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>프로그램</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>질환·항목</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>실시일</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>결과</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>차기 예정</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 90 }}>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.disabled' }}>기록이 없습니다</TableCell></TableRow>
                ) : filtered.map((x) => {
                  const d = daysUntil(x.nextDueDate)
                  return (
                    <TableRow key={x.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{x.workerName}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{x.department || '-'}</TableCell>
                      <TableCell align="center"><Chip size="small" label={x.programType} color={typeColor(x.programType)} variant="outlined" /></TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{x.diseaseType || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.implDate || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{x.result || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: d <= 30 && d >= 0 ? 'warning.main' : 'inherit' }}>{x.nextDueDate || '-'}</TableCell>
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
        <DialogTitle>{editing ? '감염병 기록 수정' : '감염병 기록 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>근로자명</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.workerName || ''} onChange={(e) => setForm({ ...form, workerName: e.target.value })} /></FormCell>
              <FormLabel>부서</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel required>프로그램 유형</FormLabel>
              <FormCell borderRight>
                <TextField select fullWidth size="small" value={form.programType || ''} onChange={(e) => setForm({ ...form, programType: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {PROGRAM_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </FormCell>
              <FormLabel>상태</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.status || ''} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>질환·항목</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.diseaseType || ''} onChange={(e) => setForm({ ...form, diseaseType: e.target.value })} placeholder="예: 인플루엔자 / B형간염 / 결핵검진" /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>실시일</FormLabel>
              <FormCell borderRight><DatePickerField value={form.implDate || null} onChange={(d) => setForm({ ...form, implDate: d || undefined })} /></FormCell>
              <FormLabel>차기 예정일</FormLabel>
              <FormCell><DatePickerField value={form.nextDueDate || null} onChange={(d) => setForm({ ...form, nextDueDate: d || undefined })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>결과</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.result || ''} onChange={(e) => setForm({ ...form, result: e.target.value })} /></FormCell>
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

export default DpInfectTab
