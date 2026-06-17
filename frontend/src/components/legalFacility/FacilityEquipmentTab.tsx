import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Alert, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress, Tooltip,
  FormControl, InputLabel, Select,
} from '@mui/material'
import ListSearchBar from '../common/ListSearchBar'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import { equipmentApi } from '../../api/legalFacilityApi'
import type { FacilityEquipment } from '../../types/legalFacility.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import DevTestFillButton from '../common/DevTestFillButton'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const CATEGORIES = ['압력용기', '보일러', '크레인·호이스트', '리프트', '국소배기장치', '화학설비', '건조설비', '전기설비', '소방설비']
const STATUSES = ['정상', '임박', '만료', '휴지', '폐기']
const INSPECT_TYPES = ['안전검사', '정기검사', '완성검사', '설치검사', '자체검사', '종합점검']
const INSPECT_PERIODS = ['6개월', '1년', '2년', '3년', '4년']
const LOCATIONS = ['생산동1', '생산동2', '도장동', '용접동', '화학창고']

const catColor = (c?: string): 'error' | 'warning' | 'primary' | 'info' | 'success' | 'secondary' | 'default' => {
  switch (c) {
    case '압력용기': return 'error'
    case '보일러': return 'warning'
    case '크레인·호이스트': return 'warning'
    case '리프트': return 'info'
    case '국소배기장치': return 'success'
    case '화학설비': return 'secondary'
    case '전기설비': return 'info'
    case '소방설비': return 'success'
    default: return 'default'
  }
}

const statusColor = (s: string): 'success' | 'warning' | 'error' | 'default' => {
  switch (s) {
    case '정상': return 'success'
    case '임박': return 'warning'
    case '만료': return 'error'
    default: return 'default'
  }
}

const computeDday = (d?: string): number | null => {
  if (!d) return null
  return Math.floor((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

const ddayColor = (d: number | null): 'success' | 'warning' | 'error' | 'default' => {
  if (d === null) return 'default'
  if (d < 0) return 'error'
  if (d <= 30) return 'warning'
  return 'success'
}

const emptyForm: Partial<FacilityEquipment> = {
  mgmtNo: '', name: '', category: '압력용기', spec: '', location: '생산동1',
  inspectType: '안전검사', inspectPeriod: '2년', status: '정상',
}

const FacilityEquipmentTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { data: items = [], isLoading } = useQuery({ queryKey: ['facilityEquipments'], queryFn: equipmentApi.list })
  const { data: stats } = useQuery({ queryKey: ['facilityEquipmentsStats'], queryFn: equipmentApi.stats })

  const [searchInput, setSearchInput] = useState('')

  const [search, setSearch] = useState('')

  const applySearch = () => setSearch(searchInput)

  const handleResetSearch = () => { setSearchInput(''); setSearch('') }
  const [catFilter, setCatFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [locFilter, setLocFilter] = useState('')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<FacilityEquipment | null>(null)
  const [form, setForm] = useState<Partial<FacilityEquipment>>(emptyForm)
  const [ownerPickerOpen, setOwnerPickerOpen] = useState(false)

  const createMut = useMutation({
    mutationFn: (e: Partial<FacilityEquipment>) => equipmentApi.create(e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['facilityEquipments'] }); qc.invalidateQueries({ queryKey: ['facilityEquipmentsStats'] }); setOpen(false) },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<FacilityEquipment> }) => equipmentApi.update(id, e),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['facilityEquipments'] }); qc.invalidateQueries({ queryKey: ['facilityEquipmentsStats'] }); setOpen(false) },
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => equipmentApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['facilityEquipments'] }); qc.invalidateQueries({ queryKey: ['facilityEquipmentsStats'] }) },
  })

  const filtered = useMemo(() => items.filter(e => {
    if (catFilter && e.category !== catFilter) return false
    if (statusFilter && e.status !== statusFilter) return false
    if (locFilter && e.location !== locFilter) return false
    if (search && !e.name.includes(search) && !e.mgmtNo.includes(search) && !(e.location || '').includes(search)) return false
    return true
  }), [items, catFilter, statusFilter, locFilter, search])

  const urgentList = useMemo(() => items.filter(e => e.status === '만료'), [items])

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, installDate: todayStr(), lastInspectDate: todayStr(), nextInspectDate: todayStr() }); setOpen(true) }
  const openEdit = (e: FacilityEquipment) => {
    setEditing(e); setForm(e); setOpen(true)
  }
  const submit = () => {
    if (editing) updateMut.mutate({ id: editing.id, e: form })
    else createMut.mutate(form)
  }
  const onOwnerPicked = (users: UserInfo[]) => {
    if (users[0]) {
      const u = users[0]
      setForm(prev => ({ ...prev, ownerUserId: u.id, ownerName: u.name, ownerDept: u.department }))
    }
    setOwnerPickerOpen(false)
  }

  // DEV ONLY — 비어있는 항목을 법정설비 도메인 더미데이터로 채움 (입력값은 보존)
  const fillTestData = () => setForm(prev => ({
    ...prev,
    mgmtNo: prev.mgmtNo || 'PV-2025-001',
    name: prev.name || '제1공장 공기저장탱크',
    category: prev.category || '압력용기',
    spec: prev.spec || '5m³, 15kgf/cm²',
    location: prev.location || '생산동1',
    maker: prev.maker || '대성기계',
    makerNo: prev.makerNo || 'DS-PV-20231105',
    installDate: prev.installDate || todayStr(),
    baseLaw: prev.baseLaw || '산업안전보건법 제93조',
    inspectType: prev.inspectType || '안전검사',
    inspectPeriod: prev.inspectPeriod || '2년',
    lastInspectDate: prev.lastInspectDate || todayStr(),
    nextInspectDate: prev.nextInspectDate || todayStr(),
    status: prev.status || '정상',
    note: prev.note || '안전밸브 정상 작동, 외관 양호 (테스트 데이터)',
  }))

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={2.4}><StatCard color="yellow" value={stats?.totalCount ?? 0}     label={t('facilityEquipmentTab.label1', '등록 기구 총계')} sub="압력·크레인·화학설비 등" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="green"  value={stats?.okCount ?? 0}        label={t('facilityEquipmentTab.label2', '정상 관리 중')} sub="유효 검사 완료" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="red"    value={stats?.expiredCount ?? 0}   label={t('facilityEquipmentTab.label3', '검사기간 만료')} sub="즉시 조치 필요" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="blue"   value={stats?.nearCount ?? 0}      label="D-30 이내 검사" sub="사전 일정 수립" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="purple" value={stats?.suspendedCount ?? 0} label={t('facilityEquipmentTab.label4', '폐기 / 휴지')} sub="관리 제외" /></Grid>
      </Grid>

      {urgentList.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>검사기간 만료 {urgentList.length}건 — 즉시 검사 신청 필요</strong>
          {' · '}
          {urgentList.slice(0, 5).map(e => e.name).join(' · ')}
          {urgentList.length > 5 ? ` 외 ${urgentList.length - 5}건` : ''}
        </Alert>
      )}

      {/* Toolbar - PC */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 2, justifyContent: 'flex-start', display: { xs: 'none', md: 'flex' } }} alignItems="center">
        <ListSearchBar placeholder="기구명/관리번호/위치 검색"
          value={searchInput} onChange={setSearchInput} onSearch={applySearch}
          sx={{ width: 240 }} />
        <TextField select size="small" sx={{ minWidth: 150 }} label={t('facilityEquipmentTab.label5', '분류')} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <MenuItem value="">전체</MenuItem>
          {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
        <TextField select size="small" sx={{ minWidth: 130 }} label={t('facilityEquipmentTab.label6', '상태')} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <MenuItem value="">전체</MenuItem>
          {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <TextField select size="small" sx={{ minWidth: 130 }} label={t('facilityEquipmentTab.label7', '위치')} value={locFilter} onChange={e => setLocFilter(e.target.value)}>
          <MenuItem value="">전체</MenuItem>
          {LOCATIONS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
        </TextField>
        <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>New</Button>
      </Stack>

      {/* Toolbar - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
        <ListSearchBar fullWidth placeholder="기구명/관리번호/위치 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <InputLabel>{t('facilityEquipmentTab.label5', '분류')}</InputLabel>
            <Select label={t('facilityEquipmentTab.label5', '분류')} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <MenuItem value="">전체</MenuItem>
              {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ flex: 1 }}>
            <InputLabel>{t('facilityEquipmentTab.label6', '상태')}</InputLabel>
            <Select label={t('facilityEquipmentTab.label6', '상태')} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <MenuItem value="">전체</MenuItem>
              {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        <FormControl size="small" fullWidth>
          <InputLabel>{t('facilityEquipmentTab.label7', '위치')}</InputLabel>
          <Select label={t('facilityEquipmentTab.label7', '위치')} value={locFilter} onChange={e => setLocFilter(e.target.value)}>
            <MenuItem value="">전체</MenuItem>
            {LOCATIONS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={handleResetSearch} sx={{ flex: 1 }}>초기화</Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate} sx={{ flex: 1 }}>New</Button>
        </Box>
      </Box>

      {/* PC Table */}
      <Paper variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 1500, '& .MuiTableCell-root': { whiteSpace: 'nowrap' } }}>
              <TableHead>
                <TableRow>
                  <TableCell>관리번호</TableCell>
                  <TableCell>기구 명칭</TableCell>
                  <TableCell>분류</TableCell>
                  <TableCell>규격/용량</TableCell>
                  <TableCell>설치위치</TableCell>
                  <TableCell>법령</TableCell>
                  <TableCell>검사 종류</TableCell>
                  <TableCell align="center">주기</TableCell>
                  <TableCell>다음검사일</TableCell>
                  <TableCell>D-Day</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>담당자</TableCell>
                  <TableCell align="right">액션</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(e => {
                  const d = computeDday(e.nextInspectDate)
                  return (
                    <TableRow key={e.id} hover>
                      <TableCell sx={{ color: 'info.main' }}>{e.mgmtNo}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{e.name}</TableCell>
                      <TableCell><Chip size="small" label={e.category} color={catColor(e.category)} variant="outlined" /></TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{e.spec}</TableCell>
                      <TableCell>{e.location}</TableCell>
                      <TableCell sx={{ color: 'text.disabled' }}>{e.baseLaw}</TableCell>
                      <TableCell><Chip size="small" label={e.inspectType} variant="outlined" /></TableCell>
                      <TableCell align="center">{e.inspectPeriod}</TableCell>
                      <TableCell>{e.nextInspectDate}</TableCell>
                      <TableCell>{d !== null && <Chip size="small" label={d >= 0 ? `D-${d}` : `D+${Math.abs(d)}`} color={ddayColor(d) === 'default' ? undefined : ddayColor(d)} />}</TableCell>
                      <TableCell><Chip size="small" label={e.status} color={statusColor(e.status)} /></TableCell>
                      <TableCell>{e.ownerName}<br /><Typography component="span" variant="caption" color="text.disabled">{e.ownerDept}</Typography></TableCell>
                      <TableCell align="right">
                        <Tooltip title="수정"><IconButton size="small" onClick={() => openEdit(e)}><EditIcon fontSize="inherit" /></IconButton></Tooltip>
                        <Tooltip title="삭제"><IconButton size="small" onClick={async () => { if (await showConfirm(t('facilityEquipmentTab.msg1', '삭제하시겠습니까?'))) deleteMut.mutate(e.id) }}><DeleteIcon fontSize="inherit" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={13} align="center" sx={{ color: 'text.disabled', py: 6 }}>등록된 기구가 없습니다</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Mobile cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
        ) : filtered.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', color: 'text.disabled' }}>등록된 기구가 없습니다</Paper>
        ) : filtered.map(e => {
          const d = computeDday(e.nextInspectDate)
          return (
            <Paper key={e.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" color="info.main" sx={{ fontWeight: 700 }}>{e.mgmtNo}</Typography>
                  <Typography variant="body2" fontWeight="bold">{e.name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
                  <IconButton size="small" onClick={() => openEdit(e)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={async () => { if (await showConfirm(t('facilityEquipmentTab.msg1', '삭제하시겠습니까?'))) deleteMut.mutate(e.id) }}><DeleteIcon fontSize="small" /></IconButton>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
                <Chip size="small" label={e.category} color={catColor(e.category)} variant="outlined" />
                <Chip size="small" label={e.status} color={statusColor(e.status)} />
                {d !== null && <Chip size="small" label={d >= 0 ? `D-${d}` : `D+${Math.abs(d)}`} color={ddayColor(d) === 'default' ? undefined : ddayColor(d)} />}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {e.location} · {e.spec || '-'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {e.inspectType} · 주기 {e.inspectPeriod} · 다음검사 {e.nextInspectDate || '-'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                담당: {e.ownerName || '-'} {e.ownerDept ? `(${e.ownerDept})` : ''}
              </Typography>
            </Paper>
          )
        })}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '법정기구 수정' : '법정기구 등록'}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>분류</FormLabel>
              <FormCell borderRight>
                <TextField select fullWidth size="small" value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </FormCell>
              <FormLabel required>관리번호</FormLabel>
              <FormCell>
                <TextField fullWidth size="small" placeholder="예) PV-2025-001" value={form.mgmtNo || ''} onChange={e => setForm({ ...form, mgmtNo: e.target.value })} />
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel required>기구 명칭</FormLabel>
              <FormCell>
                <TextField fullWidth size="small" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>규격/용량</FormLabel>
              <FormCell borderRight>
                <TextField fullWidth size="small" placeholder="예) 5m³, 15kgf/cm²" value={form.spec || ''} onChange={e => setForm({ ...form, spec: e.target.value })} />
              </FormCell>
              <FormLabel required>설치위치</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {LOCATIONS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                </TextField>
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>제조사</FormLabel>
              <FormCell borderRight>
                <TextField fullWidth size="small" value={form.maker || ''} onChange={e => setForm({ ...form, maker: e.target.value })} />
              </FormCell>
              <FormLabel>제조번호</FormLabel>
              <FormCell>
                <TextField fullWidth size="small" value={form.makerNo || ''} onChange={e => setForm({ ...form, makerNo: e.target.value })} />
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>설치일</FormLabel>
              <FormCell borderRight>
                <DatePickerField value={form.installDate || null} onChange={d => setForm({ ...form, installDate: d || undefined })} />
              </FormCell>
              <FormLabel>법령 근거</FormLabel>
              <FormCell>
                <TextField fullWidth size="small" placeholder="예) 산안법 제93조" value={form.baseLaw || ''} onChange={e => setForm({ ...form, baseLaw: e.target.value })} />
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>검사 종류</FormLabel>
              <FormCell borderRight>
                <TextField select fullWidth size="small" value={form.inspectType || ''} onChange={e => setForm({ ...form, inspectType: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {INSPECT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </FormCell>
              <FormLabel>검사 주기</FormLabel>
              <FormCell>
                <TextField select fullWidth size="small" value={form.inspectPeriod || ''} onChange={e => setForm({ ...form, inspectPeriod: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {INSPECT_PERIODS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>최근 검사일</FormLabel>
              <FormCell borderRight>
                <DatePickerField value={form.lastInspectDate || null} onChange={d => setForm({ ...form, lastInspectDate: d || undefined })} />
              </FormCell>
              <FormLabel>다음 검사일</FormLabel>
              <FormCell>
                <DatePickerField value={form.nextInspectDate || null} onChange={d => setForm({ ...form, nextInspectDate: d || undefined })} />
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>상태</FormLabel>
              <FormCell borderRight>
                <TextField select fullWidth size="small" value={form.status || '정상'} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <MenuItem value="">선택하세요</MenuItem>
                  {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </FormCell>
              <FormLabel>담당자</FormLabel>
              <FormCell>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField fullWidth size="small" InputProps={{ readOnly: true }}
                    value={form.ownerName ? `${form.ownerName} · ${form.ownerDept || ''}` : ''} placeholder="조직도에서 선택" />
                  <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setOwnerPickerOpen(true)}>
                    <PersonSearchIcon fontSize="small" />
                  </Button>
                </Box>
              </FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>비고</FormLabel>
              <FormCell>
                <TextField fullWidth size="small" multiline minRows={2} value={form.note || ''} onChange={e => setForm({ ...form, note: e.target.value })} />
              </FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          {!editing && <DevTestFillButton onFill={fillTestData} />}
          <Button variant="outlined" onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={submit} disabled={!form.name || !form.mgmtNo || createMut.isPending || updateMut.isPending}>
            저장
          </Button>
        </DialogActions>
      </Dialog>

      <UserSelectModal
        open={ownerPickerOpen}
        onClose={() => setOwnerPickerOpen(false)}
        selectedUsers={[]}
        onConfirm={onOwnerPicked}
        singleSelect={true}
        useCompanyTree={true}
        title="담당자 선택 (조직도)"
      />
    </Box>
  )
}

export default FacilityEquipmentTab
