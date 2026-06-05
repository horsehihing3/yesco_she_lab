import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Alert,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress,
  Typography,
} from '@mui/material'
import ListSearchBar from '../common/ListSearchBar'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { disasterFacApi, disasterInspApi, fireStatsApi } from '../../api/fireSafetyApi'
import type { DisasterFacility, DisasterInspection } from '../../types/fireSafety.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const FAC_TYPES = ['방유제', '집수조', '가스누설감지기', '긴급차단밸브', '제독·세척설비', '배수구차단판', '중화설비', '방충·방서시설']
const CYCLES = ['월1회', '분기', '반기', '연1회']
const STATUSES = ['정상', '점검필요', '불량']
const ANOMALIES = ['이상없음', '경미한 이상', '이상 발견', '긴급조치 필요']
const DONE_STATUSES = ['완료', '진행중', '예정']

const statusColor = (s?: string): 'success' | 'warning' | 'error' | 'default' =>
  s === '정상' ? 'success' : s === '점검필요' ? 'warning' : s === '불량' ? 'error' : 'default'
const anomalyColor = (s?: string): 'success' | 'warning' | 'error' | 'default' =>
  s === '이상없음' ? 'success' : s === '경미한 이상' ? 'warning' : s === '이상 발견' || s === '긴급조치 필요' ? 'error' : 'default'

const emptyFac: Partial<DisasterFacility> = { facType: '방유제', checkCycle: '분기', status: '정상' }
const emptyInsp: Partial<DisasterInspection> = { anomaly: '이상없음', doneStatus: '완료', inspDate: new Date().toISOString().slice(0, 10) }

const DisasterFacilityTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { data: items = [], isLoading } = useQuery({ queryKey: ['disasterFacilities'], queryFn: disasterFacApi.list })
  const { data: insps = [], isLoading: inspLoading } = useQuery({ queryKey: ['disasterInspections'], queryFn: disasterInspApi.list })
  const { data: stats } = useQuery({ queryKey: ['fireStats'], queryFn: fireStatsApi.get })

  const [searchInput, setSearchInput] = useState('')

  const [search, setSearch] = useState('')

  const applySearch = () => setSearch(searchInput)

  const handleResetSearch = () => { setSearchInput(''); setSearch('') }
  const [typeFilter, setTypeFilter] = useState('')

  // Facility dialog
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<DisasterFacility | null>(null)
  const [form, setForm] = useState<Partial<DisasterFacility>>(emptyFac)
  const create = useMutation({
    mutationFn: disasterFacApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['disasterFacilities'] }); qc.invalidateQueries({ queryKey: ['fireStats'] }); setOpen(false) },
  })
  const update = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<DisasterFacility> }) => disasterFacApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['disasterFacilities'] }); setOpen(false) },
  })
  const remove = useMutation({
    mutationFn: disasterFacApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disasterFacilities'] }),
  })

  // Inspection dialog
  const [iOpen, setIOpen] = useState(false)
  const [iEditing, setIEditing] = useState<DisasterInspection | null>(null)
  const [iForm, setIForm] = useState<Partial<DisasterInspection>>(emptyInsp)
  const iCreate = useMutation({
    mutationFn: disasterInspApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['disasterInspections'] }); setIOpen(false) },
  })
  const iUpdate = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<DisasterInspection> }) => disasterInspApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['disasterInspections'] }); setIOpen(false) },
  })
  const iDelete = useMutation({
    mutationFn: disasterInspApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disasterInspections'] }),
  })

  const filtered = useMemo(() => items.filter(v => {
    if (typeFilter && v.facType !== typeFilter) return false
    if (search && !v.name.includes(search) && !(v.location || '').includes(search) && !(v.chemical || '').includes(search)) return false
    return true
  }), [items, typeFilter, search])

  const badItems = items.filter(v => v.status === '불량')

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={2}><StatCard color="red"    value={stats?.disTotal ?? 0} label="방제시설 총계" sub="8개 유형 등록" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="green"  value={stats?.disOk ?? 0}    label="정상 가동" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="yellow" value={stats?.disWarn ?? 0}  label="점검 필요" sub="분기 기한 도래" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="red"    value={stats?.disBad ?? 0}   label="이상 발생" sub="즉시 조치 필요" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="blue"   value={insps.length}         label="점검 이력" sub="누적 기록" /></Grid>
        <Grid item xs={6} sm={2}><StatCard color="purple" value={insps.filter(i => i.doneStatus === '진행중').length} label="조치 진행" sub="개선 작업" /></Grid>
      </Grid>

      {badItems.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>불량 방제시설 {badItems.length}건 — 화학물질 누출 위험 · 즉시 조치 필요</strong>
          {' · '}{badItems.map(i => i.name).join(' · ')}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems="center">
        <ListSearchBar fullWidth placeholder="시설명/위치/화학물질 검색..." value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
        <TextField select size="small" sx={{ minWidth: 170 }} label="유형" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <MenuItem value="">전체</MenuItem>
          {FAC_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { setEditing(null); setForm({ ...emptyFac, installDate: todayStr(), lastCheck: todayStr(), nextCheck: todayStr() }); setOpen(true) }} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>New</Button>
      </Stack>

      <Paper variant="outlined" sx={{ mb: 3 }}>
        {isLoading ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell align="center">관리번호</TableCell>
                <TableCell>시설명</TableCell>
                <TableCell align="center">유형</TableCell>
                <TableCell>위치</TableCell>
                <TableCell align="center">용량·규격</TableCell>
                <TableCell align="center">재질</TableCell>
                <TableCell>관련 화학물질</TableCell>
                <TableCell align="center">주기</TableCell>
                <TableCell align="center">최근점검</TableCell>
                <TableCell align="center">다음점검</TableCell>
                <TableCell align="center">상태</TableCell>
                <TableCell align="center">담당자</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>액션</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {filtered.map(v => (
                  <TableRow key={v.id} hover>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{v.mgmtNo}</TableCell>
                    <TableCell>{v.name}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.facType || '-'} variant="outlined" /></TableCell>
                    <TableCell>{v.location || '-'}</TableCell>
                    <TableCell align="center">{v.capacity || '-'}</TableCell>
                    <TableCell align="center">{v.material || '-'}</TableCell>
                    <TableCell>{v.chemical || '-'}</TableCell>
                    <TableCell align="center">{v.checkCycle || '-'}</TableCell>
                    <TableCell align="center">{v.lastCheck || '-'}</TableCell>
                    <TableCell align="center">{v.nextCheck || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.status} color={statusColor(v.status)} /></TableCell>
                    <TableCell align="center">{v.mgrName || '-'}</TableCell>
                    <TableCell align="center" sx={{ width: 80, whiteSpace: 'nowrap', px: 0.5 }}>
                      <IconButton size="small" onClick={() => { setEditing(v); setForm({ ...v }); setOpen(true) }}><EditIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={async () => { if (await showConfirm('삭제하시겠습니까?')) remove.mutate(v.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={13} align="center" sx={{ color: 'text.disabled', py: 6 }}>등록된 방제시설이 없습니다</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ===== 방제시설 점검 이력 ===== */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>방제시설 점검 이력</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { setIEditing(null); setIForm(emptyInsp); setIOpen(true) }} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>New</Button>
      </Stack>
      <Paper variant="outlined">
        {inspLoading ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell align="center">점검일</TableCell>
                <TableCell>시설명</TableCell>
                <TableCell align="center">유형</TableCell>
                <TableCell>위치</TableCell>
                <TableCell align="center">점검자</TableCell>
                <TableCell>점검 내용</TableCell>
                <TableCell align="center">이상 여부</TableCell>
                <TableCell>조치내용</TableCell>
                <TableCell align="center">완료여부</TableCell>
                <TableCell align="center">다음점검</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>액션</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {insps.map(v => (
                  <TableRow key={v.id} hover>
                    <TableCell align="center">{v.inspDate}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{v.facilityName || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.facType || '-'} variant="outlined" /></TableCell>
                    <TableCell>{v.location || '-'}</TableCell>
                    <TableCell align="center">{v.checker || '-'}</TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.content || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.anomaly || '-'} color={anomalyColor(v.anomaly)} /></TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.actionTaken || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.doneStatus || '-'} color={v.doneStatus === '완료' ? 'success' : 'warning'} /></TableCell>
                    <TableCell align="center">{v.nextCheck || '-'}</TableCell>
                    <TableCell align="center" sx={{ width: 80, whiteSpace: 'nowrap', px: 0.5 }}>
                      <IconButton size="small" onClick={() => { setIEditing(v); setIForm({ ...v }); setIOpen(true) }}><EditIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={async () => { if (await showConfirm('삭제하시겠습니까?')) iDelete.mutate(v.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {insps.length === 0 && <TableRow><TableCell colSpan={11} align="center" sx={{ color: 'text.disabled', py: 6 }}>점검 기록이 없습니다</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ===== Facility dialog ===== */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '방제시설 수정' : '방제시설 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>관리번호</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.mgmtNo || ''} onChange={e => setForm({ ...form, mgmtNo: e.target.value })} /></FormCell>
              <FormLabel required>유형</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={form.facType || ''} onChange={e => setForm({ ...form, facType: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{FAC_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel required>시설명</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>설치 위치</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} /></FormCell>
              <FormLabel>용량·규격</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.capacity || ''} onChange={e => setForm({ ...form, capacity: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>재질</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.material || ''} onChange={e => setForm({ ...form, material: e.target.value })} /></FormCell>
              <FormLabel>관련 화학물질</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.chemical || ''} onChange={e => setForm({ ...form, chemical: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>설치일</FormLabel>
              <FormCell borderRight><DatePickerField value={form.installDate || null} onChange={d => setForm({ ...form, installDate: d || undefined })} /></FormCell>
              <FormLabel>점검 주기</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={form.checkCycle || ''} onChange={e => setForm({ ...form, checkCycle: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{CYCLES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>최근 점검일</FormLabel>
              <FormCell borderRight><DatePickerField value={form.lastCheck || null} onChange={d => setForm({ ...form, lastCheck: d || undefined })} /></FormCell>
              <FormLabel>다음 점검일</FormLabel>
              <FormCell><DatePickerField value={form.nextCheck || null} onChange={d => setForm({ ...form, nextCheck: d || undefined })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>상태</FormLabel>
              <FormCell borderRight><TextField select fullWidth size="small" value={form.status || ''} onChange={e => setForm({ ...form, status: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></FormCell>
              <FormLabel>담당자</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.mgrName || ''} onChange={e => setForm({ ...form, mgrName: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>법령 근거</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" placeholder="예) 화관법 §24" value={form.lawBasis || ''} onChange={e => setForm({ ...form, lawBasis: e.target.value })} /></FormCell>
              <FormLabel>연동 설비</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.interlock || ''} onChange={e => setForm({ ...form, interlock: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>비고</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.note || ''} onChange={e => setForm({ ...form, note: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={() => editing ? update.mutate({ id: editing.id, e: form }) : create.mutate(form)} disabled={!form.mgmtNo || !form.name}>저장</Button>
        </DialogActions>
      </Dialog>

      {/* ===== Inspection dialog ===== */}
      <Dialog open={iOpen} onClose={() => setIOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{iEditing ? '점검 기록 수정' : '점검 기록 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>점검일</FormLabel>
              <FormCell borderRight><DatePickerField value={iForm.inspDate || null} onChange={d => setIForm({ ...iForm, inspDate: d || '' })} /></FormCell>
              <FormLabel>점검자</FormLabel>
              <FormCell><TextField fullWidth size="small" value={iForm.checker || ''} onChange={e => setIForm({ ...iForm, checker: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>시설명</FormLabel>
              <FormCell><TextField fullWidth size="small" value={iForm.facilityName || ''} onChange={e => setIForm({ ...iForm, facilityName: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>유형</FormLabel>
              <FormCell borderRight><TextField select fullWidth size="small" value={iForm.facType || ''} onChange={e => setIForm({ ...iForm, facType: e.target.value })}><MenuItem value="">선택하세요</MenuItem>{FAC_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></FormCell>
              <FormLabel>위치</FormLabel>
              <FormCell><TextField fullWidth size="small" value={iForm.location || ''} onChange={e => setIForm({ ...iForm, location: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>점검 내용</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={iForm.content || ''} onChange={e => setIForm({ ...iForm, content: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>이상 여부</FormLabel>
              <FormCell borderRight><TextField select fullWidth size="small" value={iForm.anomaly || ''} onChange={e => setIForm({ ...iForm, anomaly: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{ANOMALIES.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}</TextField></FormCell>
              <FormLabel>완료여부</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={iForm.doneStatus || ''} onChange={e => setIForm({ ...iForm, doneStatus: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{DONE_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>조치 내용</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={iForm.actionTaken || ''} onChange={e => setIForm({ ...iForm, actionTaken: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>다음 점검 예정일</FormLabel>
              <FormCell><DatePickerField value={iForm.nextCheck || null} onChange={d => setIForm({ ...iForm, nextCheck: d || undefined })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setIOpen(false)}>취소</Button>
          <Button variant="contained" onClick={() => iEditing ? iUpdate.mutate({ id: iEditing.id, e: iForm }) : iCreate.mutate(iForm)} disabled={!iForm.inspDate}>저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DisasterFacilityTab
