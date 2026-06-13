import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Alert, Typography, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import { watchApi, watchCheckApi } from '../../api/legalFacilityApi'
import type { FacilityWatch, FacilityWatchCheck } from '../../types/legalFacility.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import DevTestFillButton from '../common/DevTestFillButton'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const FACILITY_TYPES = ['화학물질 저장·취급', '고압·압력설비', '환기·배기설비', '전기설비', '폐수·환경설비', '기타']
const RISK_GRADES = [
  { code: 'A', label: 'A (긴급)', color: '#ef4444' },
  { code: 'B', label: 'B (주의)', color: '#f59e0b' },
  { code: 'C', label: 'C (관찰)', color: '#22c55e' },
]
const CYCLES = ['주 1회', '주 2회', '월 1회', '월 2회', '분기 1회', '수시']
const ANOMALIES = ['이상없음', '경미한 이상', '이상 발견', '긴급 조치 필요']

const riskColor = (r: string): 'error' | 'warning' | 'success' | 'default' => {
  switch (r) { case 'A': return 'error'; case 'B': return 'warning'; case 'C': return 'success'; default: return 'default' }
}

const anomalyColor = (a?: string): 'success' | 'warning' | 'error' | 'default' => {
  switch (a) { case '이상없음': return 'success'; case '경미한 이상': return 'warning'; case '이상 발견': case '긴급 조치 필요': return 'error'; default: return 'default' }
}

const emptyWatchForm: Partial<FacilityWatch> = { riskGrade: 'B', facilityType: '기타', cycle: '월 1회', riskPct: 50 }
const emptyCheckForm: Partial<FacilityWatchCheck> = { anomaly: '이상없음' }

const FacilityWatchTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { data: watches = [], isLoading } = useQuery({ queryKey: ['facilityWatches'], queryFn: watchApi.list })
  const { data: stats } = useQuery({ queryKey: ['facilityWatchesStats'], queryFn: watchApi.stats })
  const { data: checks = [] } = useQuery({ queryKey: ['facilityWatchChecks'], queryFn: watchCheckApi.list })

  const [riskFilter, setRiskFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<FacilityWatch | null>(null)
  const [form, setForm] = useState<Partial<FacilityWatch>>(emptyWatchForm)
  const [ownerPickerOpen, setOwnerPickerOpen] = useState(false)

  const [checkOpen, setCheckOpen] = useState(false)
  const [checkForm, setCheckForm] = useState<Partial<FacilityWatchCheck>>(emptyCheckForm)

  const createWatchMut = useMutation({ mutationFn: (e: Partial<FacilityWatch>) => watchApi.create(e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['facilityWatches'] }); qc.invalidateQueries({ queryKey: ['facilityWatchesStats'] }); setOpen(false) } })
  const updateWatchMut = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<FacilityWatch> }) => watchApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['facilityWatches'] }); qc.invalidateQueries({ queryKey: ['facilityWatchesStats'] }); setOpen(false) } })
  const deleteWatchMut = useMutation({ mutationFn: (id: number) => watchApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['facilityWatches'] }); qc.invalidateQueries({ queryKey: ['facilityWatchesStats'] }) } })

  const createCheckMut = useMutation({ mutationFn: (e: Partial<FacilityWatchCheck>) => watchCheckApi.create(e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['facilityWatchChecks'] }); setCheckOpen(false) } })

  const filtered = watches.filter(w => {
    if (riskFilter && w.riskGrade !== riskFilter) return false
    if (typeFilter && w.facilityType !== typeFilter) return false
    return true
  })

  const urgentList = watches.filter(w => w.riskGrade === 'A')

  const openCreate = () => { setEditing(null); setForm({ ...emptyWatchForm, lastCheckDate: todayStr(), nextCheckDate: todayStr() }); setOpen(true) }
  const openEdit = (w: FacilityWatch) => { setEditing(w); setForm(w); setOpen(true) }
  const submit = () => { if (editing) updateWatchMut.mutate({ id: editing.id, e: form }); else createWatchMut.mutate(form) }
  // DEV ONLY — 비어있는 항목을 관심시설 도메인 더미데이터로 채움 (입력값은 보존)
  const fillTestData = () => setForm(prev => ({
    ...prev,
    name: prev.name || '제1공장 염산 저장탱크',
    facilityType: prev.facilityType || '화학물질 저장·취급',
    riskGrade: prev.riskGrade || 'A',
    location: prev.location || '화학창고 B-2구역',
    cycle: prev.cycle || '주 1회',
    riskPct: prev.riskPct ?? 75,
    lastCheckDate: prev.lastCheckDate || todayStr(),
    nextCheckDate: prev.nextCheckDate || todayStr(),
    anomaly: prev.anomaly || '저장탱크 하부 연결배관 미세 누유 흔적 확인',
    action: prev.action || '누유 부위 가스킷 교체 및 방류턱 점검 (테스트 데이터)',
    reason: prev.reason || '유해화학물질 다량 취급 설비로 중점 모니터링 대상 지정',
  }))
  const onOwnerPicked = (users: UserInfo[]) => {
    if (users[0]) {
      const u = users[0]
      setForm(prev => ({ ...prev, ownerUserId: u.id, ownerName: u.name }))
    }
    setOwnerPickerOpen(false)
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={2.4}><StatCard color="red"    value={stats?.riskACount ?? 0} label={t('facilityWatchTab.label1', '위험등급 A (긴급)')} sub="즉시 점검·조치" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="yellow" value={stats?.riskBCount ?? 0} label={t('facilityWatchTab.label2', '위험등급 B (주의)')} sub="주기적 모니터링" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="green"  value={stats?.riskCCount ?? 0} label={t('facilityWatchTab.label3', '위험등급 C (관찰)')} sub="분기 1회 점검" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="blue"   value={stats?.totalCount ?? 0} label={t('facilityWatchTab.label4', '총 관심시설')}      sub="등록 관리 중" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="purple" value={checks.length}          label={t('facilityWatchTab.label5', '총 점검 기록')}      /></Grid>
      </Grid>

      {urgentList.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>위험등급 A 시설 {urgentList.length}건 — 즉시 점검 실시</strong>
          {' · '}{urgentList.map(w => w.name).join(' · ')}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1.5}>
          <TextField select size="small" sx={{ minWidth: 150 }} label={t('facilityWatchTab.label6', '위험등급')} value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
            <MenuItem value="">전체</MenuItem>
            {RISK_GRADES.map(r => <MenuItem key={r.code} value={r.code}>{r.label}</MenuItem>)}
          </TextField>
          <TextField select size="small" sx={{ minWidth: 180 }} label={t('facilityWatchTab.label7', '시설 유형')} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <MenuItem value="">전체</MenuItem>
            {FACILITY_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
        </Stack>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}>New</Button>
      </Stack>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          {filtered.map(w => (
            <Grid item xs={12} sm={6} md={4} key={w.id}>
              <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                <Box sx={{ height: 4, bgcolor: riskColor(w.riskGrade) === 'default' ? 'grey.300' : `${riskColor(w.riskGrade)}.main` }} />
                <Box sx={{ p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                    <Box>
                      <Typography fontWeight={700}>{w.name}</Typography>
                      <Typography variant="caption" color="text.secondary">📍 {w.location} · {w.facilityType}</Typography>
                    </Box>
                    <Chip size="small" label={`등급 ${w.riskGrade}`} color={riskColor(w.riskGrade)} sx={{ fontWeight: 900 }} />
                  </Stack>
                  <Paper variant="outlined" sx={{ p: 1.2, mb: 1, bgcolor: 'action.hover' }}>
                    <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 0.5 }}>⚠️ 이상 징후</Typography>
                    <Typography variant="body2" fontWeight={600}>{w.anomaly}</Typography>
                    {w.action && <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block' }}>🔧 {w.action}</Typography>}
                  </Paper>
                  <Box sx={{ mb: 1 }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ color: 'text.disabled', mb: 0.5 }}>
                      <Typography variant="caption">위험도 지수</Typography>
                      <Typography variant="caption" fontWeight={700}>{w.riskPct ?? 0}%</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={w.riskPct ?? 0}
                      color={(w.riskPct ?? 0) >= 70 ? 'error' : (w.riskPct ?? 0) >= 50 ? 'warning' : 'success'}
                      sx={{ height: 6, borderRadius: 1 }} />
                  </Box>
                  <Grid container spacing={1} sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Grid item xs={6}><Typography variant="caption" color="text.disabled">담당자</Typography><Typography variant="body2" fontWeight={600}>{w.ownerName || '-'}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="text.disabled">점검주기</Typography><Typography variant="body2" fontWeight={600}>{w.cycle}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="text.disabled">최근점검</Typography><Typography variant="body2">{w.lastCheckDate}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="text.disabled">다음점검</Typography><Typography variant="body2" color={w.riskGrade === 'A' ? 'error.main' : 'warning.main'}>{w.nextCheckDate}</Typography></Grid>
                  </Grid>
                  <Stack direction="row" spacing={0.5} sx={{ mt: 1.5 }} justifyContent="flex-end">
                    <IconButton size="small" onClick={() => openEdit(w)}><EditIcon fontSize="inherit" /></IconButton>
                    <IconButton size="small" onClick={async () => { if (await showConfirm(t('facilityWatchTab.msg1', '삭제하시겠습니까?'))) deleteWatchMut.mutate(w.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                    {w.riskGrade === 'A' && <Button size="small" variant="outlined" color="error" onClick={() => { setCheckForm({ ...emptyCheckForm, watchId: w.id, facilityName: w.name, facilityType: w.facilityType, riskGrade: w.riskGrade }); setCheckOpen(true) }}>긴급조치</Button>}
                  </Stack>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2, mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>{t('facilityWatchTab.section1', '최근 점검 이력')}</Typography>
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => { setCheckForm(emptyCheckForm); setCheckOpen(true) }}>New</Button>
      </Stack>
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>점검일</TableCell><TableCell>시설명</TableCell><TableCell>유형</TableCell><TableCell>위험등급</TableCell>
                <TableCell>점검내용</TableCell><TableCell>점검자</TableCell><TableCell>이상 여부</TableCell><TableCell>조치내용</TableCell><TableCell>다음점검</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {checks.map(c => (
                <TableRow key={c.id} hover>
                  <TableCell>{c.checkDate}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{c.facilityName}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{c.facilityType}</TableCell>
                  <TableCell><Chip size="small" label={`등급 ${c.riskGrade}`} color={riskColor(c.riskGrade || '')} /></TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{c.content}</TableCell>
                  <TableCell>{c.checker}</TableCell>
                  <TableCell><Chip size="small" label={c.anomaly} color={anomalyColor(c.anomaly)} /></TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{c.action}</TableCell>
                  <TableCell sx={{ color: 'warning.main' }}>{c.nextCheckDate}</TableCell>
                </TableRow>
              ))}
              {checks.length === 0 && <TableRow><TableCell colSpan={9} align="center" sx={{ color: 'text.disabled', py: 4 }}>점검 기록이 없습니다</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 관심시설 등록 모달 */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '관심시설 수정' : '관심시설 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>시설명</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>시설 유형</FormLabel>
              <FormCell borderRight><TextField select fullWidth size="small" value={form.facilityType || ''} onChange={e => setForm({ ...form, facilityType: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{FACILITY_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></FormCell>
              <FormLabel required>위험등급</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={form.riskGrade || 'B'} onChange={e => setForm({ ...form, riskGrade: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{RISK_GRADES.map(r => <MenuItem key={r.code} value={r.code}>{r.label}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>설치위치</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" placeholder="동/층/구역" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} /></FormCell>
              <FormLabel>담당자</FormLabel>
              <FormCell>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField fullWidth size="small" InputProps={{ readOnly: true }}
                    value={form.ownerName || ''} placeholder="조직도에서 선택" />
                  <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setOwnerPickerOpen(true)}>
                    <PersonSearchIcon fontSize="small" />
                  </Button>
                </Box>
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>점검 주기</FormLabel>
              <FormCell borderRight><TextField select fullWidth size="small" value={form.cycle || ''} onChange={e => setForm({ ...form, cycle: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{CYCLES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></FormCell>
              <FormLabel>위험도 지수</FormLabel>
              <FormCell><NumberField fullWidth size="small" value={form.riskPct ?? null} onChange={v => setForm({ ...form, riskPct: v ?? 0 })} min={0} max={100} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>최근 점검일</FormLabel>
              <FormCell borderRight><DatePickerField value={form.lastCheckDate || null} onChange={d => setForm({ ...form, lastCheckDate: d })} /></FormCell>
              <FormLabel>다음 점검일</FormLabel>
              <FormCell><DatePickerField value={form.nextCheckDate || null} onChange={d => setForm({ ...form, nextCheckDate: d })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>이상 징후</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.anomaly || ''} onChange={e => setForm({ ...form, anomaly: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>조치 내용</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.action || ''} onChange={e => setForm({ ...form, action: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>등록 사유</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.reason || ''} onChange={e => setForm({ ...form, reason: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          {!editing && <DevTestFillButton onFill={fillTestData} />}
          <Button variant="outlined" onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={submit} disabled={!form.name || !form.riskGrade}>저장</Button>
        </DialogActions>
      </Dialog>

      {/* 점검 기록 모달 */}
      <Dialog open={checkOpen} onClose={() => setCheckOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('facilityWatchTab.dialogTitle1', '관심시설 점검 기록')}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel>시설명</FormLabel>
              <FormCell><TextField fullWidth size="small" value={checkForm.facilityName || ''} onChange={e => setCheckForm({ ...checkForm, facilityName: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel required>점검일</FormLabel>
              <FormCell borderRight><DatePickerField value={checkForm.checkDate || null} onChange={d => setCheckForm({ ...checkForm, checkDate: d })} /></FormCell>
              <FormLabel>점검자</FormLabel>
              <FormCell><TextField fullWidth size="small" value={checkForm.checker || ''} onChange={e => setCheckForm({ ...checkForm, checker: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>이상 여부</FormLabel>
              <FormCell borderRight><TextField select fullWidth size="small" value={checkForm.anomaly || '이상없음'} onChange={e => setCheckForm({ ...checkForm, anomaly: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{ANOMALIES.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}</TextField></FormCell>
              <FormLabel>다음 점검일</FormLabel>
              <FormCell><DatePickerField value={checkForm.nextCheckDate || null} onChange={d => setCheckForm({ ...checkForm, nextCheckDate: d })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>점검 내용</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={checkForm.content || ''} onChange={e => setCheckForm({ ...checkForm, content: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>조치 내용</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={checkForm.action || ''} onChange={e => setCheckForm({ ...checkForm, action: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setCheckOpen(false)}>취소</Button>
          <Button variant="contained" onClick={() => createCheckMut.mutate(checkForm)} disabled={!checkForm.checkDate}>저장</Button>
        </DialogActions>
      </Dialog>

      <UserSelectModal
        open={ownerPickerOpen}
        onClose={() => setOwnerPickerOpen(false)}
        selectedUsers={[]}
        onConfirm={onOwnerPicked}
        singleSelect={true}
        useCompanyTree={true}
        title="담당자 선택"
      />
    </Box>
  )
}

export default FacilityWatchTab
