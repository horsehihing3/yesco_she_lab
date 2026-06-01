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
import { dpThermalApi, dpMgmtStatsApi } from '../../api/diseasePreventionMgmtApi'
import type { DpThermal } from '../../types/diseasePreventionMgmt.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const TYPES = ['온열', '한랭', '예방조치']
const SEVERITIES = ['경증', '중등도', '중증']

const typeColor = (t: string): 'error' | 'info' | 'success' | 'default' =>
  t === '온열' ? 'error' : t === '한랭' ? 'info' : t === '예방조치' ? 'success' : 'default'
const sevColor = (s?: string): 'error' | 'warning' | 'success' | 'default' =>
  s === '중증' ? 'error' : s === '중등도' ? 'warning' : s === '경증' ? 'success' : 'default'

const emptyForm: Partial<DpThermal> = { thermalType: '온열', severity: '경증' }

const DpThermalTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm, showSuccess, showError } = useAlert()

  const { data: list = [], isLoading } = useQuery({ queryKey: ['dpThermal'], queryFn: dpThermalApi.list })
  const { data: stats } = useQuery({ queryKey: ['dpMgmtStats'], queryFn: dpMgmtStatsApi.get })

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<DpThermal | null>(null)
  const [form, setForm] = useState<Partial<DpThermal>>(emptyForm)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['dpThermal'] })
    qc.invalidateQueries({ queryKey: ['dpMgmtStats'] })
  }

  const createM = useMutation({ mutationFn: dpThermalApi.create, onSuccess: () => { invalidate(); setOpen(false); showSuccess('등록되었습니다') }, onError: () => showError('등록 실패') })
  const updateM = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<DpThermal> }) => dpThermalApi.update(id, e), onSuccess: () => { invalidate(); setOpen(false); showSuccess('수정되었습니다') }, onError: () => showError('수정 실패') })
  const deleteM = useMutation({ mutationFn: dpThermalApi.remove, onSuccess: () => { invalidate(); showSuccess('삭제되었습니다') } })

  const filtered = useMemo(() => list.filter((x) => {
    if (filterType !== 'all' && x.thermalType !== filterType) return false
    if (search && !`${x.location || ''} ${x.symptoms || ''}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [list, filterType, search])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true) }
  const openEdit = (item: DpThermal) => { setEditing(item); setForm({ ...item }); setOpen(true) }
  const handleSave = () => {
    if (!form.thermalType || !form.occurDate) { showError('유형·발생일 필수'); return }
    if (editing) updateM.mutate({ id: editing.id, e: form })
    else createM.mutate(form)
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.thermalTotal ?? 0}  label="관리 대상" sub="옥외·고온·한랭" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.thermalCases ?? 0}  label="발생 사례" sub="금년 누적" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.thermalSevere ?? 0} label="중증·중등도" sub="병원 이송" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.thermalAction ?? 0} label="예방조치" sub="작업중지 발령" /></Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField size="small" placeholder="발생 위치·증상 검색" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1, minWidth: 200 }} />
          <TextField select size="small" label="유형" value={filterType} onChange={(e) => setFilterType(e.target.value)} sx={{ minWidth: 120 }}>
            <MenuItem value="all">전체</MenuItem>
            {TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ mb: 2 }}>
        {isLoading ? <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 90 }}>유형</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>발생일</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>위치</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>근로자·부서</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>체감온도</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>증상</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>심각도</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 90 }}>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.disabled' }}>기록이 없습니다</TableCell></TableRow>
                ) : filtered.map((x) => (
                  <TableRow key={x.id} hover>
                    <TableCell align="center"><Chip size="small" label={x.thermalType} color={typeColor(x.thermalType)} /></TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.occurDate}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{x.location || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{x.workerName || '-'}<Box sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>{x.department || ''}</Box></TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{x.perceivedTemp ?? '-'}℃</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{x.symptoms || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={x.severity || '-'} color={sevColor(x.severity)} variant="outlined" /></TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap', px: 0.5 }}>
                      <IconButton size="small" onClick={() => openEdit(x)}><EditIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={async () => {
                        if (await showConfirm('이 기록을 삭제하시겠습니까?')) deleteM.mutate(x.id)
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
        <DialogTitle>{editing ? '온열·한랭 기록 수정' : '온열·한랭 기록 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>유형</FormLabel>
              <FormCell borderRight>
                <TextField select fullWidth size="small" value={form.thermalType || ''} onChange={(e) => setForm({ ...form, thermalType: e.target.value })}>
                  <MenuItem value="">선택</MenuItem>
                  {TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </FormCell>
              <FormLabel required>발생일</FormLabel>
              <FormCell><DatePickerField value={form.occurDate || null} onChange={(d) => setForm({ ...form, occurDate: d || undefined })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>발생 위치</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>근로자명</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.workerName || ''} onChange={(e) => setForm({ ...form, workerName: e.target.value })} placeholder="예방조치는 '-' 입력 가능" /></FormCell>
              <FormLabel>부서</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>기상 상태</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.weatherCondition || ''} onChange={(e) => setForm({ ...form, weatherCondition: e.target.value })} placeholder="예: 폭염주의보" /></FormCell>
              <FormLabel>체감온도 (℃)</FormLabel>
              <FormCell><NumberField fullWidth value={form.perceivedTemp ?? null} onChange={(v) => setForm({ ...form, perceivedTemp: v ?? undefined })} thousandSeparator={false} step={0.1} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>증상</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.symptoms || ''} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>심각도</FormLabel>
              <FormCell borderRight>
                <TextField select fullWidth size="small" value={form.severity || ''} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                  <MenuItem value="">선택</MenuItem>
                  {SEVERITIES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </FormCell>
              <FormLabel>처치</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.treatment || ''} onChange={(e) => setForm({ ...form, treatment: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>경과</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.outcome || ''} onChange={(e) => setForm({ ...form, outcome: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>예방·조치</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.preventionAction || ''} onChange={(e) => setForm({ ...form, preventionAction: e.target.value })} /></FormCell>
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

export default DpThermalTab
