import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress, LinearProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { permitRenewalApi, permitLifecycleStatsApi } from '../../api/permitLifecycleApi'
import type { PermitRenewal } from '../../types/permitLifecycle.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const STAGES = ['검토', '서류준비', '신청완료', '심사중', '승인', '완료']
const CATEGORIES = ['환경', '안전', '보건', '소방', '화학', '건축']

const stageColor = (s: string): 'default' | 'info' | 'warning' | 'success' =>
  s === '완료' ? 'success' : s === '심사중' ? 'info' : s === '승인' ? 'info' : 'warning'

const daysUntil = (d?: string) => {
  if (!d) return Infinity
  return Math.ceil((new Date(d).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000)
}

const emptyForm: Partial<PermitRenewal> = { stage: '검토' }

const PermitRenewalTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm, showSuccess, showError } = useAlert()

  const { data: list = [], isLoading } = useQuery({ queryKey: ['permitRenewal'], queryFn: permitRenewalApi.list })
  const { data: stats } = useQuery({ queryKey: ['permitLifecycleStats'], queryFn: permitLifecycleStatsApi.get })

  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PermitRenewal | null>(null)
  const [form, setForm] = useState<Partial<PermitRenewal>>(emptyForm)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['permitRenewal'] })
    qc.invalidateQueries({ queryKey: ['permitLifecycleStats'] })
  }

  const createM = useMutation({ mutationFn: permitRenewalApi.create, onSuccess: () => { invalidate(); setOpen(false); showSuccess('등록되었습니다') }, onError: () => showError('등록 실패') })
  const updateM = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<PermitRenewal> }) => permitRenewalApi.update(id, e), onSuccess: () => { invalidate(); setOpen(false); showSuccess('수정되었습니다') }, onError: () => showError('수정 실패') })
  const deleteM = useMutation({ mutationFn: permitRenewalApi.remove, onSuccess: () => { invalidate(); showSuccess('삭제되었습니다') } })

  const filtered = useMemo(() => list.filter((x) => {
    if (filterStage !== 'all' && x.stage !== filterStage) return false
    if (search) {
      const q = search.toLowerCase()
      if (!`${x.permitName} ${x.assignee || ''}`.toLowerCase().includes(q)) return false
    }
    return true
  }), [list, filterStage, search])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true) }
  const openEdit = (item: PermitRenewal) => { setEditing(item); setForm({ ...item }); setOpen(true) }
  const handleSave = () => {
    if (!form.permitName) { showError('갱신 인허가명을 입력해주세요'); return }
    if (editing) updateM.mutate({ id: editing.id, e: form })
    else createM.mutate(form)
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.rnActive ?? 0} label="진행 중" sub="갱신 워크플로우" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.rnWarn ?? 0}   label="심사·승인" sub="진행 중" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={(stats as any)?.rnDelay ?? 0} label="지연" sub="기한 초과" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.rnDone ?? 0}   label="완료" sub="갱신완료" /></Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField size="small" placeholder="갱신 인허가·담당자 검색" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1, minWidth: 200 }} />
          <TextField select size="small" label="단계" value={filterStage} onChange={(e) => setFilterStage(e.target.value)} sx={{ minWidth: 130 }}>
            <MenuItem value="all">전체</MenuItem>
            {STAGES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ mb: 2 }}>
        {isLoading ? <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>갱신 인허가</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 80 }}>분야</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>단계</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 150 }}>진행률</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>현재 만료일</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>액션 기한</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 130 }}>담당자</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 90 }}>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.disabled' }}>갱신 항목이 없습니다</TableCell></TableRow>
                ) : filtered.map((x) => {
                  const idx = STAGES.indexOf(x.stage)
                  const pct = idx >= 0 ? ((idx + 1) / STAGES.length) * 100 : 0
                  const dDue = daysUntil(x.dueDate)
                  return (
                    <TableRow key={x.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{x.permitName}</TableCell>
                      <TableCell align="center"><Chip size="small" label={x.category || '-'} variant="outlined" /></TableCell>
                      <TableCell align="center"><Chip size="small" label={x.stage} color={stageColor(x.stage)} /></TableCell>
                      <TableCell align="center" sx={{ minWidth: 120 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <LinearProgress variant="determinate" value={pct} sx={{ flex: 1, minWidth: 60, height: 5, borderRadius: 1 }} />
                          <Box sx={{ fontSize: '0.75rem', fontWeight: 600, minWidth: 32 }}>{Math.round(pct)}%</Box>
                        </Stack>
                      </TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.currentExpiry || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: dDue < 0 ? 'error.main' : dDue <= 30 ? 'warning.main' : 'inherit' }}>
                        {x.dueDate || '-'}{x.dueDate && <Box sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>D{dDue >= 0 ? '-' : '+'}{Math.abs(dDue)}</Box>}
                      </TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.85rem' }}>{x.assignee || '-'}</TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap', px: 0.5 }}>
                        <IconButton size="small" onClick={() => openEdit(x)}><EditIcon fontSize="inherit" /></IconButton>
                        <IconButton size="small" onClick={async () => {
                          if (await showConfirm('이 갱신 항목을 삭제하시겠습니까?')) deleteM.mutate(x.id)
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
        <DialogTitle>{editing ? '갱신 항목 수정' : '갱신 항목 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>갱신 인허가명</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.permitName || ''} onChange={(e) => setForm({ ...form, permitName: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>분야</FormLabel>
              <FormCell borderRight>
                <TextField select fullWidth size="small" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <MenuItem value="">선택</MenuItem>
                  {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </FormCell>
              <FormLabel>단계</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.stage || ''} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
                  <MenuItem value="">선택</MenuItem>
                  {STAGES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>현재 만료일</FormLabel>
              <FormCell borderRight><DatePickerField value={form.currentExpiry || null} onChange={(d) => setForm({ ...form, currentExpiry: d || undefined })} /></FormCell>
              <FormLabel>갱신 목표일</FormLabel>
              <FormCell><DatePickerField value={form.targetDate || null} onChange={(d) => setForm({ ...form, targetDate: d || undefined })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>갱신 시작일</FormLabel>
              <FormCell borderRight><DatePickerField value={form.startDate || null} onChange={(d) => setForm({ ...form, startDate: d || undefined })} /></FormCell>
              <FormLabel>담당자</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.assignee || ''} onChange={(e) => setForm({ ...form, assignee: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>다음 액션</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.nextAction || ''} onChange={(e) => setForm({ ...form, nextAction: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>액션 기한</FormLabel>
              <FormCell><DatePickerField value={form.dueDate || null} onChange={(d) => setForm({ ...form, dueDate: d || undefined })} /></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>비고</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleSave} disabled={createM.isPending || updateM.isPending}>저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PermitRenewalTab
