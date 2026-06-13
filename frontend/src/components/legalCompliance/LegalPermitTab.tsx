import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Alert, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress, Divider,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import { permitApi } from '../../api/legalComplianceApi'
import type { LegalPermit, LegalPermitRequest } from '../../types/legalCompliance.types'
import StatCard from './StatCard'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import DevTestFillButton from '../common/DevTestFillButton'
import { useAlert } from '../../contexts/AlertContext'

const PERMIT_TYPES = ['허가', '신고', '등록', '검사', '점검']
const CATEGORIES = ['안전', '환경', '화학물질', '소방', '전기']
const RENEWAL_PERIODS = ['1년', '2년', '3년', '5년', '비정기']

const computeDday = (expire?: string): number | null => {
  if (!expire) return null
  const now = new Date()
  const exp = new Date(expire)
  return Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

const ddayColor = (d: number | null): 'success' | 'warning' | 'error' | 'default' => {
  if (d === null) return 'default'
  if (d <= 30) return 'error'
  if (d <= 60) return 'warning'
  return 'success'
}

const emptyForm: LegalPermitRequest = {
  permitType: '허가', category: '안전', permitName: '', renewalPeriod: '1년',
}

const LegalPermitTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { data: permits = [], isLoading } = useQuery({ queryKey: ['legalPermits'], queryFn: permitApi.list })
  const { data: stats } = useQuery({ queryKey: ['legalPermitsStats'], queryFn: permitApi.stats })

  const [typeFilter, setTypeFilter] = useState('')
  const [catFilter, setCatFilter] = useState('')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<LegalPermit | null>(null)
  const [form, setForm] = useState<LegalPermitRequest>(emptyForm)
  const [pickerOpen, setPickerOpen] = useState(false)

  const onPicked = (users: UserInfo[]) => {
    if (users[0]) setForm(f => ({ ...f, ownerName: users[0].name }))
    setPickerOpen(false)
  }

  const createMut = useMutation({
    mutationFn: (req: LegalPermitRequest) => permitApi.create(req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['legalPermits'] }); qc.invalidateQueries({ queryKey: ['legalPermitsStats'] }); setOpen(false) },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, req }: { id: number; req: LegalPermitRequest }) => permitApi.update(id, req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['legalPermits'] }); qc.invalidateQueries({ queryKey: ['legalPermitsStats'] }); setOpen(false) },
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => permitApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['legalPermits'] }); qc.invalidateQueries({ queryKey: ['legalPermitsStats'] }) },
  })

  const filtered = useMemo(() => permits.filter(p => {
    if (typeFilter && p.permitType !== typeFilter) return false
    if (catFilter && p.category !== catFilter) return false
    return true
  }), [permits, typeFilter, catFilter])

  const urgent = useMemo(() => permits.filter(p => {
    const d = computeDday(p.expireDate)
    return d !== null && d >= 0 && d <= 30
  }), [permits])

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, issueDate: todayStr(), expiryDate: todayStr(), nextRenewalDate: todayStr() }); setOpen(true) }
  const openEdit = (p: LegalPermit) => {
    setEditing(p)
    setForm({
      permitType: p.permitType, category: p.category, permitName: p.permitName, baseLaw: p.baseLaw,
      agency: p.agency, permitNo: p.permitNo, issueDate: p.issueDate, expireDate: p.expireDate,
      ownerName: p.ownerName, renewalPeriod: p.renewalPeriod, conditions: p.conditions, icon: p.icon,
    })
    setOpen(true)
  }
  const submit = () => {
    if (editing) updateMut.mutate({ id: editing.id, req: form })
    else createMut.mutate(form)
  }

  // DEV ONLY — 비어있는 항목을 인허가 도메인 더미데이터로 채움 (입력값은 보존)
  const fillTestData = () => setForm(prev => ({
    ...prev,
    permitType: prev.permitType || '허가',
    category: prev.category || '환경',
    permitName: prev.permitName || '대기배출시설 설치허가',
    baseLaw: prev.baseLaw || '대기환경보전법 제23조',
    agency: prev.agency || '한강유역환경청',
    permitNo: prev.permitNo || '대기-2025-0137',
    issueDate: prev.issueDate || todayStr(),
    expireDate: prev.expireDate || todayStr(),
    renewalPeriod: prev.renewalPeriod || '3년',
    conditions: prev.conditions || '방지시설 정상가동 및 자가측정 결과 분기별 보고 (테스트 데이터)',
    icon: prev.icon || '🏭',
  }))

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.totalCount ?? 0}  label={t('legalPermitTab.label1', '인허가 총 건수')} /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.validCount ?? 0}  label={t('legalPermitTab.label2', '유효 (정상)')} sub="60일 이상 여유" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.warnCount ?? 0}   label={t('legalPermitTab.label3', '갱신 임박')} sub="D-60 이내" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.urgentCount ?? 0} label={t('legalPermitTab.label4', '긴급 갱신')} sub="D-30 이내" /></Grid>
      </Grid>

      {urgent.length > 0 && (
        <Alert severity="warning" icon={false} sx={{ mb: 2 }}>
          <strong>⏰ D-30 이내 갱신 필요 항목 — {urgent.length}건</strong>
          {' · '}
          {urgent.map(p => `${p.permitName}(D-${computeDday(p.expireDate)})`).join(' · ')}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1.5}>
          <TextField select size="small" sx={{ minWidth: 130 }} label={t('legalPermitTab.label5', '유형')} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <MenuItem value="">전체</MenuItem>
            {PERMIT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField select size="small" sx={{ minWidth: 130 }} label={t('legalPermitTab.label6', '분류')} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <MenuItem value="">전체</MenuItem>
            {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </Stack>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}>New</Button>
      </Stack>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', color: 'text.disabled' }}>등록된 인허가가 없습니다</Paper>
      ) : (
        <Grid container spacing={1.5}>
          {filtered.map(p => {
            const d = computeDday(p.expireDate)
            const color = ddayColor(d)
            const borderColor = color === 'error' ? '#ef4444' : color === 'warning' ? '#f59e0b' : 'rgba(0,0,0,0.12)'
            return (
              <Grid item xs={12} sm={6} md={4} key={p.id}>
                <Paper variant="outlined" sx={{ p: 2, position: 'relative', overflow: 'hidden', borderColor, borderWidth: color === 'default' ? 1 : 2 }}>
                  {(color === 'error' || color === 'warning') && (
                    <Box sx={{
                      position: 'absolute', top: 0, right: 0,
                      bgcolor: color === 'error' ? '#ef4444' : '#f59e0b',
                      color: color === 'error' ? '#fff' : '#000',
                      fontSize: 9, fontWeight: 800, letterSpacing: 0.5,
                      px: 1, py: 0.25, borderBottomLeftRadius: 6,
                    }}>
                      {color === 'error' ? '긴급' : '주의'}
                    </Box>
                  )}
                  <Stack direction="row" spacing={1.5} alignItems="flex-start" justifyContent="space-between">
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ fontSize: 22 }}>{p.icon}</Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={700} noWrap>{p.permitName}</Typography>
                        <Typography variant="caption" color="text.secondary">{p.baseLaw}</Typography>
                      </Box>
                    </Stack>
                    {d !== null && <Chip size="small" label={d >= 0 ? `D-${d}` : `+${Math.abs(d)}`} color={color === 'default' ? undefined : color} />}
                  </Stack>
                  <Divider sx={{ my: 1.5 }} />
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.disabled">허가번호</Typography>
                      <Typography variant="body2" fontWeight={600}>{p.permitNo}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.disabled">유효기간</Typography>
                      <Typography variant="body2" fontWeight={600} color={color === 'error' ? 'error.main' : color === 'warning' ? 'warning.main' : 'success.main'}>{p.expireDate}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.disabled">허가기관</Typography>
                      <Typography variant="body2" fontWeight={600}>{p.agency}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.disabled">담당자</Typography>
                      <Typography variant="body2" fontWeight={600}>{p.ownerName}</Typography>
                    </Grid>
                  </Grid>
                  <Stack direction="row" spacing={0.5} sx={{ mt: 1.5 }} alignItems="center">
                    {p.permitType && <Chip size="small" label={p.permitType} color="primary" variant="outlined" />}
                    {p.category && <Chip size="small" label={p.category} variant="outlined" />}
                    {p.renewalPeriod && <Chip size="small" label={`${p.renewalPeriod} 주기`} variant="outlined" sx={{ ml: 'auto !important' }} />}
                    <IconButton size="small" onClick={() => openEdit(p)}><EditIcon fontSize="inherit" /></IconButton>
                    <IconButton size="small" onClick={async () => { if (await showConfirm(t('legalPermitTab.msg1', '삭제하시겠습니까?'))) deleteMut.mutate(p.id) }}><DeleteIcon fontSize="inherit" /></IconButton>
                  </Stack>
                </Paper>
              </Grid>
            )
          })}
        </Grid>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '인허가 수정' : '인허가 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel>인허가 유형</FormLabel>
              <FormCell borderRight>
                <TextField select fullWidth size="small" value={form.permitType || ''} onChange={e => setForm({ ...form, permitType: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {PERMIT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </FormCell>
              <FormLabel>분류</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel required>인허가 명칭</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.permitName} onChange={e => setForm({ ...form, permitName: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>근거 법령</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.baseLaw || ''} onChange={e => setForm({ ...form, baseLaw: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>허가기관</FormLabel>
              <FormCell borderRight><TextField fullWidth size="small" value={form.agency || ''} onChange={e => setForm({ ...form, agency: e.target.value })} /></FormCell>
              <FormLabel>허가번호</FormLabel>
              <FormCell><TextField fullWidth size="small" value={form.permitNo || ''} onChange={e => setForm({ ...form, permitNo: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>허가일</FormLabel>
              <FormCell borderRight><DatePickerField value={form.issueDate || null} onChange={d => setForm({ ...form, issueDate: d })} /></FormCell>
              <FormLabel required>만료일</FormLabel>
              <FormCell><DatePickerField value={form.expireDate || null} onChange={d => setForm({ ...form, expireDate: d })} /></FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>담당자</FormLabel>
              <FormCell borderRight>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField fullWidth size="small" InputProps={{ readOnly: true }}
                    value={form.ownerName || ''} placeholder="조직도에서 선택" />
                  <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setPickerOpen(true)}>
                    <PersonSearchIcon fontSize="small" />
                  </Button>
                </Box>
              </FormCell>
              <FormLabel>갱신 주기</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.renewalPeriod || ''} onChange={e => setForm({ ...form, renewalPeriod: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {RENEWAL_PERIODS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>아이콘</FormLabel>
              <FormCell><TextField fullWidth size="small" placeholder="이모지" value={form.icon || ''} onChange={e => setForm({ ...form, icon: e.target.value })} /></FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>조건부 허가</FormLabel>
              <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.conditions || ''} onChange={e => setForm({ ...form, conditions: e.target.value })} /></FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          {!editing && <DevTestFillButton onFill={fillTestData} />}
          <Button variant="outlined" onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={submit} disabled={!form.permitName || createMut.isPending || updateMut.isPending}>
            저장
          </Button>
        </DialogActions>
      </Dialog>

      <UserSelectModal open={pickerOpen} onClose={() => setPickerOpen(false)} selectedUsers={[]} onConfirm={onPicked} singleSelect useCompanyTree title="담당자 선택 (조직도)" />
    </Box>
  )
}

export default LegalPermitTab
