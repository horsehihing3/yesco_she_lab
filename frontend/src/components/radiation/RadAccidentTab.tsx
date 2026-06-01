import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Alert, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress, FormControlLabel, Switch,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { radAccidentApi, radDrillApi, radStatsApi } from '../../api/radiationApi'
import type { RadAccident, RadDrill } from '../../types/radiation.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const ACC_TYPES = ['누출', '분실', '오염', '피폭초과', '기타']
const ACC_STATUSES = ['조사중', '재발방지중', '종결']

const accStatusColor = (s?: string): 'warning' | 'info' | 'success' | 'default' =>
  s === '조사중' ? 'warning' : s === '재발방지중' ? 'info' : s === '종결' ? 'success' : 'default'

const emptyAcc: Partial<RadAccident> = {
  accidentType: '기타', status: '조사중', nrscReported: false,
  accidentDate: new Date().toISOString().slice(0, 10),
}

const emptyDrill: Partial<RadDrill> = {
  drillType: '방사선 누출 비상훈련', result: '양호',
  drillDate: new Date().toISOString().slice(0, 10),
}

const RadAccidentTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { data: accidents = [], isLoading: accLoading } = useQuery({ queryKey: ['radAccidents'], queryFn: radAccidentApi.list })
  const { data: drills = [], isLoading: drillLoading } = useQuery({ queryKey: ['radDrills'], queryFn: radDrillApi.list })
  const { data: stats } = useQuery({ queryKey: ['radStats'], queryFn: radStatsApi.get })

  // accident dialog
  const [accOpen, setAccOpen] = useState(false)
  const [accEditing, setAccEditing] = useState<RadAccident | null>(null)
  const [accForm, setAccForm] = useState<Partial<RadAccident>>(emptyAcc)

  // drill dialog
  const [drillOpen, setDrillOpen] = useState(false)
  const [drillEditing, setDrillEditing] = useState<RadDrill | null>(null)
  const [drillForm, setDrillForm] = useState<Partial<RadDrill>>(emptyDrill)

  const accCreate = useMutation({
    mutationFn: radAccidentApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radAccidents'] }); qc.invalidateQueries({ queryKey: ['radStats'] }); setAccOpen(false) },
  })
  const accUpdate = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<RadAccident> }) => radAccidentApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radAccidents'] }); qc.invalidateQueries({ queryKey: ['radStats'] }); setAccOpen(false) },
  })
  const accDelete = useMutation({
    mutationFn: radAccidentApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radAccidents'] }); qc.invalidateQueries({ queryKey: ['radStats'] }) },
  })

  const drillCreate = useMutation({
    mutationFn: radDrillApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radDrills'] }); setDrillOpen(false) },
  })
  const drillUpdate = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<RadDrill> }) => radDrillApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radDrills'] }); setDrillOpen(false) },
  })
  const drillDelete = useMutation({
    mutationFn: radDrillApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radDrills'] }) },
  })

  const sortedAcc = useMemo(() => [...accidents].sort((a, b) => (b.accidentDate || '').localeCompare(a.accidentDate || '')), [accidents])
  const sortedDrills = useMemo(() => [...drills].sort((a, b) => (b.drillDate || '').localeCompare(a.drillDate || '')), [drills])

  const openAccCreate = () => { setAccEditing(null); setAccForm(emptyAcc); setAccOpen(true) }
  const openAccEdit = (v: RadAccident) => { setAccEditing(v); setAccForm({ ...v }); setAccOpen(true) }
  const submitAcc = () => {
    if (accEditing) accUpdate.mutate({ id: accEditing.id, e: accForm })
    else accCreate.mutate(accForm)
  }

  const openDrillCreate = () => { setDrillEditing(null); setDrillForm(emptyDrill); setDrillOpen(true) }
  const openDrillEdit = (v: RadDrill) => { setDrillEditing(v); setDrillForm({ ...v }); setDrillOpen(true) }
  const submitDrill = () => {
    if (drillEditing) drillUpdate.mutate({ id: drillEditing.id, e: drillForm })
    else drillCreate.mutate(drillForm)
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.accidentTotal ?? 0} label="총 사고 기록" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.accidentOpen ?? 0}  label="조사 진행 중" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={accidents.filter(a => a.status === '종결').length} label="종결" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="purple" value={drills.length} label="비상훈련 실시" /></Grid>
      </Grid>

      <Alert severity="warning" sx={{ mb: 2 }}>
        <strong>방사선 사고 보고 의무</strong> — 누출·분실·피폭초과 등 발생 시 즉시 원안위 보고 (24시간 이내) · 재발방지 대책 수립 (원자력안전법 §76)
      </Alert>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>방사선 사고·비상 이력</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openAccCreate} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>New</Button>
      </Stack>

      <Paper variant="outlined" sx={{ mb: 3 }}>
        {accLoading ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell align="center">발생일</TableCell>
                <TableCell align="center">유형</TableCell>
                <TableCell>장소</TableCell>
                <TableCell>원인</TableCell>
                <TableCell>대응 조치</TableCell>
                <TableCell align="center">원안위 보고</TableCell>
                <TableCell align="center">상태</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>액션</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {sortedAcc.map(v => (
                  <TableRow key={v.id} hover>
                    <TableCell align="center">{v.accidentDate}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.accidentType || '-'} variant="outlined" /></TableCell>
                    <TableCell>{v.location || '-'}</TableCell>
                    <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.cause || '-'}</TableCell>
                    <TableCell sx={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.response || '-'}</TableCell>
                    <TableCell align="center">{v.nrscReported ? <Chip size="small" label="보고" color="success" /> : <Chip size="small" label="미보고" color="default" />}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.status || '-'} color={accStatusColor(v.status)} /></TableCell>
                    <TableCell align="center" sx={{ width: 80, whiteSpace: 'nowrap', px: 0.5 }}>
                      <IconButton size="small" onClick={() => openAccEdit(v)}><EditIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={async () => { if (await showConfirm('삭제하시겠습니까?')) accDelete.mutate(v.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {sortedAcc.length === 0 && <TableRow><TableCell colSpan={8} align="center" sx={{ color: 'text.disabled', py: 6 }}>사고 기록이 없습니다</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>비상 훈련 이력</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openDrillCreate} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>New</Button>
      </Stack>

      <Paper variant="outlined">
        {drillLoading ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell align="center">훈련일</TableCell>
                <TableCell align="center">유형</TableCell>
                <TableCell>시나리오</TableCell>
                <TableCell align="center">참여 인원</TableCell>
                <TableCell align="center">담당자</TableCell>
                <TableCell align="center">결과</TableCell>
                <TableCell>개선사항</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>액션</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {sortedDrills.map(v => (
                  <TableRow key={v.id} hover>
                    <TableCell align="center">{v.drillDate}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.drillType || '-'} variant="outlined" /></TableCell>
                    <TableCell sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.scenario || '-'}</TableCell>
                    <TableCell align="center">{v.participants ?? '-'}</TableCell>
                    <TableCell align="center">{v.ownerName || '-'}</TableCell>
                    <TableCell align="center">{v.result || '-'}</TableCell>
                    <TableCell sx={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.improvement || '-'}</TableCell>
                    <TableCell align="center" sx={{ width: 80, whiteSpace: 'nowrap', px: 0.5 }}>
                      <IconButton size="small" onClick={() => openDrillEdit(v)}><EditIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={async () => { if (await showConfirm('삭제하시겠습니까?')) drillDelete.mutate(v.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {sortedDrills.length === 0 && <TableRow><TableCell colSpan={8} align="center" sx={{ color: 'text.disabled', py: 6 }}>훈련 기록이 없습니다</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* 사고 다이얼로그 */}
      <Dialog open={accOpen} onClose={() => setAccOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{accEditing ? '방사선 사고 수정' : '방사선 사고 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>발생일</FormLabel>
              <FormCell borderRight><DatePickerField value={accForm.accidentDate || null} onChange={d => setAccForm({ ...accForm, accidentDate: d || '' })} /></FormCell>
              <FormLabel>유형</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={accForm.accidentType || ''} onChange={e => setAccForm({ ...accForm, accidentType: e.target.value })}>
<MenuItem value="">선택</MenuItem>{ACC_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>장소</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={accForm.location || ''} onChange={e => setAccForm({ ...accForm, location: e.target.value })} /></FormCell>
              <FormLabel>상태</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={accForm.status || ''} onChange={e => setAccForm({ ...accForm, status: e.target.value })}>
<MenuItem value="">선택</MenuItem>{ACC_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>원안위 보고</FormLabel>
              <FormCell borderRight><FormControlLabel control={<Switch checked={!!accForm.nrscReported} onChange={(_, c) => setAccForm({ ...accForm, nrscReported: c })} />} label={accForm.nrscReported ? '보고 완료' : '미보고'} /></FormCell>
              <FormLabel>보고일시</FormLabel>
              <FormCell><TextField fullWidth size="small" type="datetime-local" InputLabelProps={{ shrink: true }} value={accForm.reportedAt?.slice(0, 16) || ''} onChange={e => setAccForm({ ...accForm, reportedAt: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>원인</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={accForm.cause || ''} onChange={e => setAccForm({ ...accForm, cause: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>대응 조치</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={3} value={accForm.response || ''} onChange={e => setAccForm({ ...accForm, response: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>비고</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={accForm.note || ''} onChange={e => setAccForm({ ...accForm, note: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccOpen(false)}>취소</Button>
          <Button variant="contained" onClick={submitAcc} disabled={!accForm.accidentDate}>{accEditing ? '수정' : '등록'}</Button>
        </DialogActions>
      </Dialog>

      {/* 훈련 다이얼로그 */}
      <Dialog open={drillOpen} onClose={() => setDrillOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{drillEditing ? '비상훈련 수정' : '비상훈련 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>훈련일</FormLabel>
              <FormCell borderRight><DatePickerField value={drillForm.drillDate || null} onChange={d => setDrillForm({ ...drillForm, drillDate: d || '' })} /></FormCell>
              <FormLabel>유형</FormLabel>
              <FormCell><TextField fullWidth size="small" value={drillForm.drillType || ''} onChange={e => setDrillForm({ ...drillForm, drillType: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>참여 인원</FormLabel>
              <FormCell borderRight><NumberField fullWidth value={drillForm.participants ?? null} onChange={v => setDrillForm({ ...drillForm, participants: v ?? undefined })} thousandSeparator={false} /></FormCell>
              <FormLabel>담당자</FormLabel>
              <FormCell><TextField fullWidth size="small" value={drillForm.ownerName || ''} onChange={e => setDrillForm({ ...drillForm, ownerName: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>시나리오</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={drillForm.scenario || ''} onChange={e => setDrillForm({ ...drillForm, scenario: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>결과</FormLabel>
              <FormCell><TextField fullWidth size="small" value={drillForm.result || ''} onChange={e => setDrillForm({ ...drillForm, result: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>개선사항</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={drillForm.improvement || ''} onChange={e => setDrillForm({ ...drillForm, improvement: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDrillOpen(false)}>취소</Button>
          <Button variant="contained" onClick={submitDrill} disabled={!drillForm.drillDate}>{drillEditing ? '수정' : '등록'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default RadAccidentTab
