import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Alert, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { aftercareApi, fitnessApi, odStatsApi } from '../../api/occupationalDiseaseApi'
import type { OdAftercare, OdFitness } from '../../types/occupationalDisease.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const JUDGES = ['C1', 'C2', 'D1', 'D2']
const STATUSES = ['진행중', '추적관찰', '산재진행', '완결']
const FIT_RESULTS = ['현재 업무 적합', '조건부 적합', '일시적 부적합', '영구적 부적합']

const judgeColor = (j?: string): 'warning' | 'error' | 'default' => {
  if (j?.startsWith('D')) return 'error'
  if (j?.startsWith('C')) return 'warning'
  return 'default'
}
const statusColor = (s?: string): 'info' | 'success' | 'secondary' | 'warning' | 'default' => {
  switch (s) { case '진행중': return 'info'; case '완결': return 'success'; case '산재진행': return 'secondary'; case '추적관찰': return 'warning'; default: return 'default' }
}

const emptyAft: Partial<OdAftercare> = { judge: 'D1', status: '진행중', urgent: false }
const emptyFit: Partial<OdFitness> = { evalResult: '조건부 적합', doneStatus: '이행중' }

const OdAftercareTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { data: items = [], isLoading } = useQuery({ queryKey: ['odAftercare'], queryFn: aftercareApi.list })
  const { data: stats } = useQuery({ queryKey: ['odStats'], queryFn: odStatsApi.get })
  const { data: fits = [] } = useQuery({ queryKey: ['odFitness'], queryFn: fitnessApi.list })

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<OdAftercare | null>(null)
  const [form, setForm] = useState<Partial<OdAftercare>>(emptyAft)
  const [fitOpen, setFitOpen] = useState(false)
  const [fitEditing, setFitEditing] = useState<OdFitness | null>(null)
  const [fitForm, setFitForm] = useState<Partial<OdFitness>>(emptyFit)

  const createMut = useMutation({ mutationFn: (e: Partial<OdAftercare>) => aftercareApi.create(e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odAftercare'] }); qc.invalidateQueries({ queryKey: ['odStats'] }); setOpen(false) } })
  const updateMut = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<OdAftercare> }) => aftercareApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odAftercare'] }); qc.invalidateQueries({ queryKey: ['odStats'] }); setOpen(false) } })
  const deleteMut = useMutation({ mutationFn: (id: number) => aftercareApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odAftercare'] }); qc.invalidateQueries({ queryKey: ['odStats'] }) } })

  const createFitMut = useMutation({ mutationFn: (e: Partial<OdFitness>) => fitnessApi.create(e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odFitness'] }); setFitOpen(false) } })
  const updateFitMut = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<OdFitness> }) => fitnessApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odFitness'] }); setFitOpen(false) } })
  const deleteFitMut = useMutation({ mutationFn: (id: number) => fitnessApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odFitness'] }) } })

  const openCreate = () => { setEditing(null); setForm({ ...emptyAft, dueDate: todayStr() }); setOpen(true) }
  const openEdit = (a: OdAftercare) => { setEditing(a); setForm(a); setOpen(true) }
  const submit = () => { if (editing) updateMut.mutate({ id: editing.id, e: form }); else createMut.mutate(form) }
  const openFitCreate = () => { setFitEditing(null); setFitForm(emptyFit); setFitOpen(true) }
  const openFitEdit = (f: OdFitness) => { setFitEditing(f); setFitForm(f); setFitOpen(true) }
  const submitFit = () => { if (fitEditing) updateFitMut.mutate({ id: fitEditing.id, e: fitForm }); else createFitMut.mutate(fitForm) }

  const urgentList = items.filter(a => a.urgent)

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.aftercareUrgentCount ?? 0} label="즉시 조치 필요" sub="D1·C2 판정자" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={items.filter(a => !a.urgent).length} label="요관찰 (추적)" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={fits.length}                       label="적합성 평가" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.aftercareDoneCount ?? 0}    label="사후관리 완결" /></Grid>
      </Grid>

      {urgentList.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>D1 판정자 {urgentList.length}명 — 즉각적 업무 전환 / 산재 신청 검토 요망</strong>
          {' · '}{urgentList.map(a => `${a.workerName}(${a.dept})`).join(' · ')}
        </Alert>
      )}

      <Stack direction="row" sx={{ mb: 2 }} justifyContent="flex-end">
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}>New</Button>
      </Stack>

      {isLoading ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          {items.map(a => {
            const actions = (a.actionsText || '').split('\n').filter(Boolean)
            return (
              <Paper key={a.id} variant="outlined" sx={{ p: 2, borderColor: a.urgent ? 'error.light' : undefined }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 1.5 }}>
                  <Box>
                    <Typography fontWeight={700} fontSize={15}>{a.workerName} <Typography component="span" variant="caption" color="text.secondary"> · {a.dept}</Typography></Typography>
                    <Typography variant="caption" color="text.secondary" display="block">{a.disease} · 주요노출: {a.factor}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={`${a.judge} 판정`} color={judgeColor(a.judge)} />
                    <Chip size="small" label={a.status} color={statusColor(a.status)} />
                  </Stack>
                </Stack>
                {actions.length > 0 && (
                  <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                    <Typography variant="caption" color="text.disabled" sx={{ mb: 0.5, display: 'block' }}>조치 이행 현황</Typography>
                    <Stack spacing={0.5}>
                      {actions.map((ac, i) => (
                        <Stack key={i} direction="row" spacing={1} alignItems="center">
                          <CheckCircleIcon color={i < actions.length - 1 ? 'success' : 'info'} sx={{ fontSize: 16 }} />
                          <span>{ac}</span>
                        </Stack>
                      ))}
                    </Stack>
                  </Paper>
                )}
                <Stack direction="row" spacing={0.5} sx={{ mt: 1 }} justifyContent="flex-end">
                  <IconButton size="small" onClick={() => openEdit(a)}><EditIcon fontSize="inherit" /></IconButton>
                  <IconButton size="small" onClick={async () => { if (await showConfirm('삭제하시겠습니까?')) deleteMut.mutate(a.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                </Stack>
              </Paper>
            )
          })}
        </Stack>
      )}

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2, mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>업무적합성 평가 현황</Typography>
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={openFitCreate}>New</Button>
      </Stack>
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>성명</TableCell><TableCell>부서</TableCell><TableCell>질환명</TableCell>
              <TableCell>평가일</TableCell><TableCell>평가기관</TableCell><TableCell>결과</TableCell><TableCell>권고사항</TableCell><TableCell>이행</TableCell>
              <TableCell align="center" sx={{ width: 80 }}>액션</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {fits.map(f => (
                <TableRow key={f.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{f.workerName}</TableCell>
                  <TableCell>{f.dept}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{f.disease}</TableCell>
                  <TableCell>{f.evalDate}</TableCell>
                  <TableCell>{f.evalOrg}</TableCell>
                  <TableCell><Chip size="small" label={f.evalResult} color={f.evalResult?.includes('영구') ? 'error' : f.evalResult?.includes('일시') ? 'warning' : 'success'} /></TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{f.recommendation}</TableCell>
                  <TableCell><Chip size="small" label={f.doneStatus} variant="outlined" /></TableCell>
                  <TableCell align="center" sx={{ width: 80, whiteSpace: 'nowrap', px: 0.5 }}>
                    <IconButton size="small" onClick={() => openFitEdit(f)}><EditIcon fontSize="inherit" /></IconButton>
                    <IconButton size="small" onClick={async () => { if (await showConfirm('삭제하시겠습니까?')) deleteFitMut.mutate(f.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {fits.length === 0 && <TableRow><TableCell colSpan={9} align="center" sx={{ color: 'text.disabled', py: 4 }}>평가 기록이 없습니다</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 사후관리 모달 */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '사후관리 조치 수정' : '사후관리 조치 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>대상자</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.workerName || ''} onChange={e => setForm({ ...form, workerName: e.target.value })} /></FormCell>
              <FormLabel>부서</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.dept || ''} onChange={e => setForm({ ...form, dept: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>검진 판정</FormLabel>
              <FormCell borderRight><TextField select fullWidth size="small" value={form.judge || 'D1'} onChange={e => setForm({ ...form, judge: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{JUDGES.map(j => <MenuItem key={j} value={j}>{j}</MenuItem>)}</TextField></FormCell>
              <FormLabel>유해인자</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.factor || ''} onChange={e => setForm({ ...form, factor: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>질환/소견</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.disease || ''} onChange={e => setForm({ ...form, disease: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>조치 내역</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={4} placeholder="한 줄에 하나씩 입력&#10;예) 업무전환 실시(5/10)" value={form.actionsText || ''} onChange={e => setForm({ ...form, actionsText: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>상태</FormLabel>
              <FormCell borderRight><TextField select fullWidth size="small" value={form.status || ''} onChange={e => setForm({ ...form, status: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></FormCell>
              <FormLabel>조치 기한</FormLabel>
              <FormCell><DatePickerField value={form.dueDate || null} onChange={d => setForm({ ...form, dueDate: d })} /></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>긴급 여부</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={form.urgent ? '1' : '0'} onChange={e => setForm({ ...form, urgent: e.target.value === '1' })}>
<MenuItem value="">선택하세요</MenuItem><MenuItem value="0">일반</MenuItem><MenuItem value="1">긴급</MenuItem></TextField></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={submit} disabled={!form.workerName}>저장</Button>
        </DialogActions>
      </Dialog>

      {/* 적합성 평가 모달 */}
      <Dialog open={fitOpen} onClose={() => setFitOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{fitEditing ? '업무적합성 평가 수정' : '업무적합성 평가 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>대상자</FormLabel>
              <FormCell><TextField fullWidth size="small" value={fitForm.workerName || ''} onChange={e => setFitForm({ ...fitForm, workerName: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>부서</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={fitForm.dept || ''} onChange={e => setFitForm({ ...fitForm, dept: e.target.value })} /></FormCell>
              <FormLabel>질환명</FormLabel>
              <FormCell><TextField fullWidth size="small" value={fitForm.disease || ''} onChange={e => setFitForm({ ...fitForm, disease: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>평가기관</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={fitForm.evalOrg || ''} onChange={e => setFitForm({ ...fitForm, evalOrg: e.target.value })} /></FormCell>
              <FormLabel>평가일</FormLabel>
              <FormCell><DatePickerField value={fitForm.evalDate || null} onChange={d => setFitForm({ ...fitForm, evalDate: d })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>평가결과</FormLabel>
              <FormCell borderRight><TextField select fullWidth size="small" value={fitForm.evalResult || ''} onChange={e => setFitForm({ ...fitForm, evalResult: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{FIT_RESULTS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}</TextField></FormCell>
              <FormLabel>이행 상태</FormLabel>
              <FormCell><TextField fullWidth size="small" placeholder="이행중/완료/산재처리" value={fitForm.doneStatus || ''} onChange={e => setFitForm({ ...fitForm, doneStatus: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>권고사항</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={fitForm.recommendation || ''} onChange={e => setFitForm({ ...fitForm, recommendation: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setFitOpen(false)}>취소</Button>
          <Button variant="contained" onClick={submitFit} disabled={!fitForm.workerName}>저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default OdAftercareTab
