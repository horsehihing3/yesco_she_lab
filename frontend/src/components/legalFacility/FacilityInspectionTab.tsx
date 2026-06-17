import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress, Divider,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import AssignmentIcon from '@mui/icons-material/Assignment'
import EventIcon from '@mui/icons-material/Event'
import PaidIcon from '@mui/icons-material/Paid'
import PersonIcon from '@mui/icons-material/Person'
import BuildIcon from '@mui/icons-material/Build'
import { inspectionApi } from '../../api/legalFacilityApi'
import type { FacilityInspection } from '../../types/legalFacility.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import DevTestFillButton from '../common/DevTestFillButton'

const INSPECT_TYPES = ['안전검사', '정기검사', '완성검사', '설치검사', '자체검사', '종합점검']
const RESULTS = ['합격', '조건부합격', '불합격', '예정']
const CATEGORIES = ['압력용기', '보일러', '크레인·호이스트', '리프트', '국소배기장치', '화학설비', '전기설비', '소방설비']

const resultColor = (r?: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  switch (r) { case '합격': return 'success'; case '조건부합격': return 'warning'; case '불합격': return 'error'; case '예정': return 'info'; default: return 'default' }
}

const emptyForm: Partial<FacilityInspection> = {
  inspectType: '안전검사', result: '합격', cost: 0,
}

const FacilityInspectionTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { data: items = [], isLoading } = useQuery({ queryKey: ['facilityInspections'], queryFn: inspectionApi.list })
  const { data: stats } = useQuery({ queryKey: ['facilityInspectionsStats'], queryFn: inspectionApi.stats })

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<FacilityInspection | null>(null)
  const [form, setForm] = useState<Partial<FacilityInspection>>(emptyForm)
  const [pickerOpen, setPickerOpen] = useState(false)

  const onPicked = (users: UserInfo[]) => {
    if (users[0]) setForm(f => ({ ...f, ownerName: users[0].name }))
    setPickerOpen(false)
  }

  const createMut = useMutation({ mutationFn: (e: Partial<FacilityInspection>) => inspectionApi.create(e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['facilityInspections'] }); qc.invalidateQueries({ queryKey: ['facilityInspectionsStats'] }); setOpen(false) } })
  const updateMut = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<FacilityInspection> }) => inspectionApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['facilityInspections'] }); qc.invalidateQueries({ queryKey: ['facilityInspectionsStats'] }); setOpen(false) } })
  const deleteMut = useMutation({ mutationFn: (id: number) => inspectionApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['facilityInspections'] }); qc.invalidateQueries({ queryKey: ['facilityInspectionsStats'] }) } })

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, applyDate: todayStr(), inspectDate: todayStr(), validUntil: todayStr() }); setOpen(true) }
  const openEdit = (e: FacilityInspection) => { setEditing(e); setForm(e); setOpen(true) }
  const submit = () => { if (editing) updateMut.mutate({ id: editing.id, e: form }); else createMut.mutate(form) }

  // DEV ONLY — 비어있는 항목을 시설검사 도메인 더미데이터로 채움 (입력값은 보존)
  const fillTestData = () => setForm(prev => ({
    ...prev,
    equipmentName: prev.equipmentName || '제2공장 공기압축기',
    category: prev.category || '압력용기',
    inspectType: prev.inspectType || '정기검사',
    inspectOrg: prev.inspectOrg || '한국산업안전보건공단',
    inspectNo: prev.inspectNo || 'INS-2025-0421',
    applyDate: prev.applyDate || todayStr(),
    inspectDate: prev.inspectDate || todayStr(),
    result: prev.result || '합격',
    validUntil: prev.validUntil || todayStr(),
    cost: prev.cost ?? 350000,
    note: prev.note || '안전밸브 및 압력계 정상, 외관 부식 없음 (테스트 데이터)',
    fix: prev.fix || '없음',
  }))

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={2.4}><StatCard color="blue"   value={stats?.totalCount ?? 0}        label={t('facilityInspectionTab.label1', '검사 이력 총계')} /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="green"  value={stats?.passCount ?? 0}        label={t('facilityInspectionTab.label2', '합격')} /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="yellow" value={stats?.conditionalCount ?? 0} label={t('facilityInspectionTab.label3', '조건부합격')} /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="red"    value={stats?.failCount ?? 0}        label={t('facilityInspectionTab.label4', '불합격')} sub="개선 필요" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="purple" value={`${stats?.passRate ?? 0}%`}    label={t('facilityInspectionTab.label5', '검사 합격률')} /></Grid>
      </Grid>

      {/* Toolbar - PC */}
      <Stack direction="row" sx={{ mb: 2, display: { xs: 'none', md: 'flex' } }} justifyContent="flex-end">
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}>New</Button>
      </Stack>

      {/* Toolbar - Mobile */}
      <Stack direction="column" spacing={1} sx={{ display: { xs: 'flex', md: 'none' }, mb: 2 }}>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate} fullWidth>New</Button>
      </Stack>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
      ) : (
        <Stack spacing={1.5}>
          {items.map(e => (
            <Paper key={e.id} variant="outlined" sx={{ p: 2 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-start' }} spacing={1}>
                <Box>
                  <Typography fontWeight={700}>{e.equipmentName}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} alignItems="center">
                    <Chip size="small" label={e.category} variant="outlined" />
                    <Typography variant="caption" color="text.disabled">{e.inspectNo}</Typography>
                  </Stack>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip size="small" label={e.result} color={resultColor(e.result)} />
                  {e.validUntil && <Chip size="small" label={`유효 ${e.validUntil}`} variant="outlined" />}
                </Stack>
              </Stack>
              <Divider sx={{ my: 1.5 }} />
              <Stack direction="row" spacing={2} sx={{ color: 'text.secondary', flexWrap: 'wrap', alignItems: 'center', '& > .info-item': { display: 'inline-flex', alignItems: 'center', gap: 0.5 }, '& .MuiSvgIcon-root': { fontSize: '1rem', color: 'text.secondary' } }}>
                <span className="info-item"><AccountBalanceIcon />{e.inspectOrg}</span>
                <span className="info-item"><AssignmentIcon />{e.inspectType}</span>
                <span className="info-item"><EventIcon />검사일: <b>{e.inspectDate}</b></span>
                {(e.cost ?? 0) > 0 && <span className="info-item"><PaidIcon />₩{e.cost?.toLocaleString()}</span>}
                <span className="info-item"><PersonIcon />{e.ownerName}</span>
              </Stack>
              {e.note && <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>{e.note}</Typography>}
              {e.fix && e.fix !== '-' && (
                <Typography variant="caption" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'warning.main', mt: 0.5 }}>
                  <BuildIcon sx={{ fontSize: '1rem' }} />개선조치: {e.fix}
                </Typography>
              )}
              <Stack direction="row" spacing={0.5} sx={{ mt: 1 }} justifyContent="flex-end">
                <IconButton size="small" onClick={() => openEdit(e)}><EditIcon fontSize="inherit" /></IconButton>
                <IconButton size="small" onClick={async () => { if (await showConfirm(t('facilityInspectionTab.msg1', '삭제하시겠습니까?'))) deleteMut.mutate(e.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
              </Stack>
            </Paper>
          ))}
          {items.length === 0 && <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', color: 'text.disabled' }}>등록된 검사가 없습니다</Paper>}
        </Stack>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '검사 이력 수정' : '검사 이력 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel>검사 대상</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.equipmentName || ''} onChange={e => setForm({ ...form, equipmentName: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>분류</FormLabel>
              <FormCell borderRight><TextField select fullWidth size="small" value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></FormCell>
              <FormLabel>검사 종류</FormLabel>
              <FormCell><TextField select fullWidth size="small" value={form.inspectType || ''} onChange={e => setForm({ ...form, inspectType: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{INSPECT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>검사기관</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.inspectOrg || ''} onChange={e => setForm({ ...form, inspectOrg: e.target.value })} /></FormCell>
              <FormLabel>검사번호</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.inspectNo || ''} onChange={e => setForm({ ...form, inspectNo: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>검사 신청일</FormLabel>
              <FormCell borderRight><DatePickerField value={form.applyDate || null} onChange={d => setForm({ ...form, applyDate: d })} /></FormCell>
              <FormLabel>검사 실시일</FormLabel>
              <FormCell><DatePickerField value={form.inspectDate || null} onChange={d => setForm({ ...form, inspectDate: d })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>검사 결과</FormLabel>
              <FormCell borderRight><TextField select fullWidth size="small" value={form.result || ''} onChange={e => setForm({ ...form, result: e.target.value })}>
<MenuItem value="">선택하세요</MenuItem>{RESULTS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}</TextField></FormCell>
              <FormLabel>유효기간</FormLabel>
              <FormCell><DatePickerField value={form.validUntil || null} onChange={d => setForm({ ...form, validUntil: d })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>검사 비용</FormLabel>
              <FormCell borderRight><NumberField fullWidth size="small" value={form.cost ?? null} onChange={v => setForm({ ...form, cost: v ?? 0 })} min={0} thousandSeparator /></FormCell>
              <FormLabel>검사원</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.inspector || ''} onChange={e => setForm({ ...form, inspector: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>담당자</FormLabel>
              <FormCell>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField fullWidth size="small" InputProps={{ readOnly: true }}
                    value={form.ownerName || ''} placeholder="조직도에서 선택" />
                  <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setPickerOpen(true)}>
                    <PersonSearchIcon fontSize="small" />
                  </Button>
                </Box>
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>검사 소견</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.note || ''} onChange={e => setForm({ ...form, note: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>개선 조치</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.fix || ''} onChange={e => setForm({ ...form, fix: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          {!editing && <DevTestFillButton onFill={fillTestData} />}
          <Button variant="outlined" onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={submit} disabled={createMut.isPending || updateMut.isPending}>저장</Button>
        </DialogActions>
      </Dialog>

      <UserSelectModal open={pickerOpen} onClose={() => setPickerOpen(false)} selectedUsers={[]} onConfirm={onPicked} singleSelect useCompanyTree title="담당자 선택 (조직도)" />
    </Box>
  )
}

export default FacilityInspectionTab
