import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { dpMsdApi, dpMgmtStatsApi } from '../../api/diseasePreventionMgmtApi'
import type { DpMsd } from '../../types/diseasePreventionMgmt.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const MSD_TASKS = ['반복 컴퓨터 작업', '반복 손목 작업', '반복 어깨 작업', '중량물 들기', '자세 정적유지', '지속적 쪼그려앉기', '지지없이 들기', '계단 오르기', '반복 진동공구', '부적절한 자세', '과도한 힘 사용']
const RISKS = ['낮음', '중간', '높음']
const STATUSES = ['정상', '요관찰', '요개선']

const riskColor = (r?: string): 'success' | 'warning' | 'error' | 'default' =>
  r === '높음' ? 'error' : r === '중간' ? 'warning' : r === '낮음' ? 'success' : 'default'

const emptyForm: Partial<DpMsd> = { riskLevel: '중간', status: '요관찰' }

const DpMsdTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm, showSuccess, showError } = useAlert()

  const { data: list = [], isLoading } = useQuery({ queryKey: ['dpMsd'], queryFn: dpMsdApi.list })
  const { data: stats } = useQuery({ queryKey: ['dpMgmtStats'], queryFn: dpMgmtStatsApi.get })

  const [search, setSearch] = useState('')
  const [filterRisk, setFilterRisk] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<DpMsd | null>(null)
  const [form, setForm] = useState<Partial<DpMsd>>(emptyForm)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['dpMsd'] })
    qc.invalidateQueries({ queryKey: ['dpMgmtStats'] })
  }

  const createM = useMutation({ mutationFn: dpMsdApi.create, onSuccess: () => { invalidate(); setOpen(false); showSuccess('등록되었습니다') }, onError: () => showError('등록 실패') })
  const updateM = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<DpMsd> }) => dpMsdApi.update(id, e), onSuccess: () => { invalidate(); setOpen(false); showSuccess('수정되었습니다') }, onError: () => showError('수정 실패') })
  const deleteM = useMutation({ mutationFn: dpMsdApi.remove, onSuccess: () => { invalidate(); showSuccess('삭제되었습니다') } })

  const filtered = useMemo(() => list.filter((x) => {
    if (filterRisk !== 'all' && x.riskLevel !== filterRisk) return false
    if (search && !`${x.workerName} ${x.taskName || ''}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [list, filterRisk, search])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true) }
  const openEdit = (item: DpMsd) => { setEditing(item); setForm({ ...item }); setOpen(true) }
  const handleSave = () => {
    if (!form.workerName) { showError('근로자명을 입력해주세요'); return }
    if (editing) updateM.mutate({ id: editing.id, e: form })
    else createM.mutate(form)
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.msdTotal ?? 0} label="평가 건수" sub="총 작업분석" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.msdLow ?? 0}   label="낮음" sub="REBA 1~3" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.msdMid ?? 0}   label="중간" sub="REBA 4~7" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.msdHigh ?? 0}  label="높음" sub="REBA 8~15" /></Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField size="small" placeholder="근로자·작업명 검색" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1, minWidth: 200 }} />
          <TextField select size="small" label="위험도" value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} sx={{ minWidth: 110 }}>
            <MenuItem value="all">전체</MenuItem>
            {RISKS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </TextField>
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
                  <TableCell sx={{ fontWeight: 'bold' }}>작업·부담작업</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 80 }}>REBA</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 80 }}>OWAS</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 90 }}>위험도</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>상태</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 90 }}>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.disabled' }}>평가 기록이 없습니다</TableCell></TableRow>
                ) : filtered.map((x) => (
                  <TableRow key={x.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{x.workerName}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{x.department || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>{x.taskName || '-'}{x.taskCategory && ` · ${x.taskCategory}`}</TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{x.rebaScore ?? '-'}</TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{x.owasScore ?? '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={x.riskLevel || '-'} color={riskColor(x.riskLevel)} /></TableCell>
                    <TableCell align="center"><Chip size="small" label={x.status || '-'} variant="outlined" /></TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap', px: 0.5 }}>
                      <IconButton size="small" onClick={() => openEdit(x)}><EditIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={async () => {
                        if (await showConfirm('이 평가를 삭제하시겠습니까?')) deleteM.mutate(x.id)
                      }}><DeleteIcon fontSize="inherit" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Stack direction="row" justifyContent="flex-end">
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>신규 등록</Button>
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '근골격계 평가 수정' : '근골격계 평가 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>근로자명</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.workerName || ''} onChange={(e) => setForm({ ...form, workerName: e.target.value })} /></FormCell>
              <FormLabel>부서</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>직위·직무</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.jobTitle || ''} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>작업명</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.taskName || ''} onChange={(e) => setForm({ ...form, taskName: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>부담작업</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.taskCategory || ''} onChange={(e) => setForm({ ...form, taskCategory: e.target.value })}>
                  <MenuItem value="">선택</MenuItem>
                  {MSD_TASKS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>REBA 점수</FormLabel>
              <FormCell borderRight><NumberField fullWidth value={form.rebaScore ?? null} onChange={(v) => setForm({ ...form, rebaScore: v ?? undefined })} min={1} max={15} thousandSeparator={false} /></FormCell>
              <FormLabel>OWAS 점수</FormLabel>
              <FormCell><NumberField fullWidth value={form.owasScore ?? null} onChange={(v) => setForm({ ...form, owasScore: v ?? undefined })} min={1} max={4} thousandSeparator={false} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>위험도</FormLabel>
              <FormCell borderRight>
                <TextField select fullWidth size="small" value={form.riskLevel || ''} onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}>
                  <MenuItem value="">선택</MenuItem>
                  {RISKS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </TextField>
              </FormCell>
              <FormLabel>관리 상태</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.status || ''} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <MenuItem value="">선택</MenuItem>
                  {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>증상 부위</FormLabel>
              <FormCell><TextField fullWidth size="small" placeholder="예: 손목,어깨,허리 (쉼표 구분)" value={form.affectedBodyParts || ''} onChange={(e) => setForm({ ...form, affectedBodyParts: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>증상</FormLabel>
              <FormCell><TextField fullWidth size="small" placeholder="예: 통증,저림,뻐근함" value={form.symptoms || ''} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>평가일</FormLabel>
              <FormCell borderRight><DatePickerField value={form.assessmentDate || null} onChange={(d) => setForm({ ...form, assessmentDate: d || undefined })} /></FormCell>
              <FormLabel>평가자</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.assessor || ''} onChange={(e) => setForm({ ...form, assessor: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>개선조치</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.actionTaken || ''} onChange={(e) => setForm({ ...form, actionTaken: e.target.value })} /></FormCell>
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

export default DpMsdTab
