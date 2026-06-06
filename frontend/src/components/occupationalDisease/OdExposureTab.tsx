import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Alert, LinearProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { exposureApi, odStatsApi } from '../../api/occupationalDiseaseApi'
import type { OdExposure } from '../../types/occupationalDisease.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'

const CLASSES = ['화학적', '물리적', '생물학적']
const STATUSES = [
  { code: 'danger', label: '초과', color: 'error' as const },
  { code: 'warn', label: '주의', color: 'warning' as const },
  { code: 'ok', label: '정상', color: 'success' as const },
]
const DEPTS = ['생산1팀', '생산2팀', '도장팀', '도금팀', '용접팀', '화학실험실']

const statusInfo = (s?: string) => STATUSES.find(x => x.code === s) || STATUSES[2]

const emptyForm: Partial<OdExposure> = { factorClass: '화학적', status: 'ok', exposureRatio: 0 }

const MENU = '보건관리 › 직업병관리 › 노출 기록'

const OdExposureTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const isAdmin = user?.role === 'SYSTEM_ADMIN'
  const myRoles: string[] = ['guest', ...(isAdmin ? ['superAdmin'] : [])]
  const { data: items = [], isLoading } = useQuery({ queryKey: ['odExposures'], queryFn: exposureApi.list })
  const { data: stats } = useQuery({ queryKey: ['odStats'], queryFn: odStatsApi.get })

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<OdExposure | null>(null)
  const [form, setForm] = useState<Partial<OdExposure>>(emptyForm)

  const createMut = useMutation({ mutationFn: (e: Partial<OdExposure>) => exposureApi.create(e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odExposures'] }); qc.invalidateQueries({ queryKey: ['odStats'] }); setOpen(false) } })
  const updateMut = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<OdExposure> }) => exposureApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odExposures'] }); qc.invalidateQueries({ queryKey: ['odStats'] }); setOpen(false) } })
  const deleteMut = useMutation({ mutationFn: (id: number) => exposureApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['odExposures'] }); qc.invalidateQueries({ queryKey: ['odStats'] }) } })

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, measureDate: todayStr() }); setOpen(true) }
  const openEdit = (e: OdExposure) => { setEditing(e); setForm(e); setOpen(true) }
  const submit = () => { if (editing) updateMut.mutate({ id: editing.id, e: form }); else createMut.mutate(form) }

  const dangerList = items.filter(e => e.status === 'danger')

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.exposureDangerCount ?? 0} label="노출기준 초과" sub="즉시 개선" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.exposureWarnCount ?? 0}   label="50% 이상 노출" sub="주의 관리" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.exposureOkCount ?? 0}     label="정상 범위" sub="50% 미만" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={items.length}                     label="측정 항목" /></Grid>
      </Grid>

      {dangerList.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>노출기준 초과 {dangerList.length}개 항목 — 즉시 공학적 개선 필요</strong>
          {' · '}{dangerList.map(d => `${d.factorName}(${d.dept})`).join(' · ')}
        </Alert>
      )}

      <Stack direction="row" sx={{ mb: 2 }} justifyContent="flex-end">
        {canSee(MENU, 'LIST', 'New', myRoles) && (
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}>New</Button>
        )}
      </Stack>

      <Paper variant="outlined">
        {isLoading ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>유해인자</TableCell><TableCell align="center">분류</TableCell><TableCell>부서</TableCell><TableCell>공정</TableCell>
                <TableCell>측정값</TableCell><TableCell>TWA</TableCell><TableCell>노출비율</TableCell>
                <TableCell align="center">측정일</TableCell><TableCell align="center">근로자</TableCell><TableCell align="center">상태</TableCell><TableCell>개선조치</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>액션</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {items.map(e => {
                  const s = statusInfo(e.status)
                  return (
                    <TableRow key={e.id} hover sx={{ borderLeft: e.status === 'danger' ? '3px solid' : e.status === 'warn' ? '3px solid' : '3px solid', borderLeftColor: e.status === 'danger' ? 'error.main' : e.status === 'warn' ? 'warning.main' : 'success.main' }}>
                      <TableCell sx={{ fontWeight: 700 }}>{e.factorName}</TableCell>
                      <TableCell align="center"><Chip size="small" label={e.factorClass} variant="outlined" /></TableCell>
                      <TableCell>{e.dept}</TableCell>
                      <TableCell>{e.processName}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: e.status === 'danger' ? 'error.main' : e.status === 'warn' ? 'warning.main' : 'success.main' }}>{e.measuredValue}</TableCell>
                      <TableCell>{e.twaStandard}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <LinearProgress variant="determinate" value={Math.min(e.exposureRatio || 0, 100)}
                            color={(e.exposureRatio || 0) > 100 ? 'error' : (e.exposureRatio || 0) > 80 ? 'warning' : 'success'}
                            sx={{ width: 60, height: 5, borderRadius: 1 }} />
                          <Box component="span">{e.exposureRatio}%</Box>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">{e.measureDate}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>{e.workerCount}명</TableCell>
                      <TableCell align="center"><Chip size="small" label={s.label} color={s.color} /></TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{e.action}</TableCell>
                      <TableCell align="center" sx={{ width: 80, whiteSpace: 'nowrap', px: 0.5 }}>
                        {canSee(MENU, 'DETAIL', '수정', myRoles) && (
                          <IconButton size="small" onClick={() => openEdit(e)}><EditIcon fontSize="inherit" /></IconButton>
                        )}
                        {canSee(MENU, 'DETAIL', '삭제', myRoles) && (
                          <IconButton size="small" onClick={async () => { if (await showConfirm('삭제하시겠습니까?')) deleteMut.mutate(e.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
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

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '노출기록 수정' : '노출기록 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel>분류</FormLabel>
              <FormCell borderRight><TextField select fullWidth size="small" value={form.factorClass || ''} onChange={e => setForm({ ...form, factorClass: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{CLASSES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></FormCell>
              <FormLabel required>유해인자명</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.factorName || ''} onChange={e => setForm({ ...form, factorName: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>노출 부서</FormLabel>
              <FormCell borderRight><TextField select fullWidth size="small" value={form.dept || ''} onChange={e => setForm({ ...form, dept: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{DEPTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}</TextField></FormCell>
              <FormLabel>공정명</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.processName || ''} onChange={e => setForm({ ...form, processName: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>측정값</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" placeholder="예) 120 ppm" value={form.measuredValue || ''} onChange={e => setForm({ ...form, measuredValue: e.target.value })} /></FormCell>
              <FormLabel>TWA</FormLabel>
              <FormCell><TextField fullWidth size="small" placeholder="예) 100 ppm" value={form.twaStandard || ''} onChange={e => setForm({ ...form, twaStandard: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>노출비율 (%)</FormLabel>
              <FormCell borderRight><NumberField fullWidth size="small" value={form.exposureRatio ?? null} onChange={v => setForm({ ...form, exposureRatio: v ?? 0 })} min={0} max={500} /></FormCell>
              <FormLabel>측정일</FormLabel>
              <FormCell><DatePickerField value={form.measureDate || null} onChange={d => setForm({ ...form, measureDate: d })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>노출 근로자</FormLabel>
              <FormCell borderRight><NumberField fullWidth size="small" value={form.workerCount ?? null} onChange={v => setForm({ ...form, workerCount: v ?? 0 })} min={0} /></FormCell>
              <FormLabel>상태</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={form.status || 'ok'} onChange={e => setForm({ ...form, status: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{STATUSES.map(s => <MenuItem key={s.code} value={s.code}>{s.label}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>개선 내용</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.action || ''} onChange={e => setForm({ ...form, action: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpen(false)}>취소</Button>
          {canSee(MENU, 'DETAIL', '저장', myRoles) && (
            <Button variant="contained" onClick={submit} disabled={!form.factorName}>저장</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default OdExposureTab
