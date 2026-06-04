import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'
import { fmtPhone } from '../../utils/phoneFormat'
import ReadTextField from '../common/ReadTextField'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Alert,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  CircularProgress, Typography, IconButton,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ListSearchBar from '../common/ListSearchBar'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import { partnerVisitorApi, partnerStatsApi } from '../../api/partnerApi'
import type { PartnerVisitor } from '../../types/partner.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import { useAlert } from '../../contexts/AlertContext'

const PURPOSES = ['설비 점검·수리', '공사·시공', '납품·배송', '회의·협의', '감사·점검', '기타']
const AREAS = ['생산동 1F', '생산동 2F', '도장동', '전기실', '사무동', '야적장']
const EDUCATIONS = ['완료', '온라인이수', '미이수']
const PPES = ['안전모·안전화·조끼', '안전모·안전화', '안전화', '미착용', '기타']
const STATUSES = ['입장중', '퇴장', '교육미이수', '출입금지']

const statusColor = (s?: string): 'success' | 'info' | 'warning' | 'error' | 'default' =>
  s === '입장중' ? 'info' : s === '퇴장' ? 'success' : s === '교육미이수' ? 'warning' : s === '출입금지' ? 'error' : 'default'

const emptyForm: Partial<PartnerVisitor> = {
  purpose: '설비 점검·수리', area: '생산동 1F',
  education: '완료', ppe: '안전모·안전화·조끼', status: '입장중',
}

type Mode = 'list' | 'view' | 'edit' | 'create'

const PartnerVisitorTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm } = useAlert()
  const { data: items = [], isLoading } = useQuery({ queryKey: ['partnerVisitors'], queryFn: partnerVisitorApi.list })
  const { data: stats } = useQuery({ queryKey: ['partnerStats'], queryFn: partnerStatsApi.get })

  const [searchInput, setSearchInput] = useState('')

  const [search, setSearch] = useState('')

  const applySearch = () => setSearch(searchInput)

  const handleResetSearch = () => { setSearchInput(''); setSearchInput(''); setSearch('') }
  const [statusFilter, setStatusFilter] = useState('')

  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const MENU = '협력업체 › 방문자 관리'
  const myRoles: string[] = ['guest', ...(user?.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : [user?.role ?? ''].filter(Boolean))]
  const canNew  = canSee(MENU, 'LIST',   '신규 등록', myRoles)
  const canEdit = canSee(MENU, '입장중',  '수정', myRoles)
  const canDel  = canSee(MENU, '입장중',  '삭제', myRoles)

  const [mode, setMode] = useState<Mode>('list')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [form, setForm] = useState<Partial<PartnerVisitor>>(emptyForm)
  const [pickerOpen, setPickerOpen] = useState(false)

  const selected = useMemo(
    () => (selectedId != null ? items.find(i => i.id === selectedId) ?? null : null),
    [items, selectedId],
  )

  const onPicked = (users: UserInfo[]) => {
    if (users[0]) setForm(f => ({ ...f, mgrName: users[0].name }))
    setPickerOpen(false)
  }

  const createMut = useMutation({
    mutationFn: partnerVisitorApi.create,
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['partnerVisitors'] })
      qc.invalidateQueries({ queryKey: ['partnerStats'] })
      setSelectedId(created.id)
      setMode('view')
    },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<PartnerVisitor> }) => partnerVisitorApi.update(id, e),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partnerVisitors'] })
      qc.invalidateQueries({ queryKey: ['partnerStats'] })
      setMode('view')
    },
  })
  const deleteMut = useMutation({
    mutationFn: partnerVisitorApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partnerVisitors'] })
      qc.invalidateQueries({ queryKey: ['partnerStats'] })
      setSelectedId(null)
      setMode('list')
    },
  })

  const filtered = useMemo(() => items.filter(v => {
    if (statusFilter && v.status !== statusFilter) return false
    if (search && !v.visitorName.includes(search) && !(v.companyName || '').includes(search) && !(v.purpose || '').includes(search)) return false
    return true
  }), [items, statusFilter, search])

  // ====== Handlers ======
  const handleRowClick = (v: PartnerVisitor) => { setSelectedId(v.id); setMode('view') }
  const handleNewClick = () => { setForm({ ...emptyForm, visitDt: todayStr() }); setMode('create') }
  const handleEditClick = () => { if (selected) { setForm({ ...selected }); setMode('edit') } }
  const handleBackToList = () => { setSelectedId(null); setMode('list') }
  const handleCancelEdit = () => { setMode('view') }
  const handleSubmit = () => {
    if (mode === 'edit' && selectedId != null) updateMut.mutate({ id: selectedId, e: form })
    else if (mode === 'create') createMut.mutate(form)
  }
  const handleDelete = async () => {
    if (selected && await showConfirm('삭제하시겠습니까?')) deleteMut.mutate(selected.id)
  }

  // ====== DETAIL PAGE ======
  if (mode !== 'list') {
    const isReadonly = mode === 'view'
    const title = mode === 'create' ? '방문자 등록' : (mode === 'edit' ? '방문자 수정' : '방문자 상세')

    return (
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">{title}</Typography>
          <Stack direction="row" spacing={1}>
            {mode === 'edit' ? (
              <Button variant="outlined" size="small" onClick={() => setMode('view')}>취소</Button>
            ) : (
              <Button variant="outlined" size="small" startIcon={<ArrowBackIcon />} onClick={handleBackToList}>목록</Button>
            )}
            {mode === 'view' && (
              <>
                {canEdit && <Button variant="contained" size="small" color="primary" startIcon={<EditIcon />} onClick={handleEditClick}>수정</Button>}
                {canDel && <Button variant="outlined" size="small" color="error" startIcon={<DeleteIcon />} onClick={handleDelete}>삭제</Button>}
              </>
            )}
          </Stack>
        </Stack>

        <FormTable>
          <FormRow>
            <FormLabel required>성명</FormLabel>
            <FormCell borderRight>
              <ReadTextField fullWidth size="small" readOnly={isReadonly}
                value={(isReadonly ? selected?.visitorName : form.visitorName) || ''}
                onChange={e => setForm({ ...form, visitorName: e.target.value })} />
            </FormCell>
            <FormLabel required>업체명</FormLabel>
            <FormCell>
              <ReadTextField fullWidth size="small" readOnly={isReadonly}
                value={(isReadonly ? selected?.companyName : form.companyName) || ''}
                onChange={e => setForm({ ...form, companyName: e.target.value })} />
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>직책</FormLabel>
            <FormCell borderRight>
              <ReadTextField fullWidth size="small" readOnly={isReadonly}
                value={(isReadonly ? selected?.position : form.position) || ''}
                onChange={e => setForm({ ...form, position: e.target.value })} />
            </FormCell>
            <FormLabel>연락처</FormLabel>
            <FormCell>
              <ReadTextField fullWidth size="small" readOnly={isReadonly}
                value={(isReadonly ? selected?.contact : form.contact) || ''}
                onChange={e => setForm({ ...form, contact: fmtPhone(e.target.value) })} />
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>방문 목적</FormLabel>
            <FormCell borderRight>
              <ReadTextField select fullWidth size="small" readOnly={isReadonly}
                value={(isReadonly ? selected?.purpose : form.purpose) || ''}
                onChange={e => setForm({ ...form, purpose: e.target.value })}>
                {PURPOSES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </ReadTextField>
            </FormCell>
            <FormLabel>방문 구역</FormLabel>
            <FormCell>
              <ReadTextField select fullWidth size="small" readOnly={isReadonly}
                value={(isReadonly ? selected?.area : form.area) || ''}
                onChange={e => setForm({ ...form, area: e.target.value })}>
                {AREAS.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </ReadTextField>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>입장 시간</FormLabel>
            <FormCell borderRight>
              <ReadTextField fullWidth size="small" type="time" readOnly={isReadonly} InputLabelProps={{ shrink: true }}
                value={(isReadonly ? selected?.checkInTime : form.checkInTime) || ''}
                onChange={e => setForm({ ...form, checkInTime: e.target.value })} />
            </FormCell>
            <FormLabel>퇴장 시간</FormLabel>
            <FormCell>
              <ReadTextField fullWidth size="small" type="time" readOnly={isReadonly} InputLabelProps={{ shrink: true }}
                value={(isReadonly ? selected?.checkOutTime : form.checkOutTime) || ''}
                onChange={e => setForm({ ...form, checkOutTime: e.target.value })} />
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>안전교육</FormLabel>
            <FormCell borderRight>
              <ReadTextField select fullWidth size="small" readOnly={isReadonly}
                value={(isReadonly ? selected?.education : form.education) || ''}
                onChange={e => setForm({ ...form, education: e.target.value })}>
                {EDUCATIONS.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
              </ReadTextField>
            </FormCell>
            <FormLabel>보호구</FormLabel>
            <FormCell>
              <ReadTextField select fullWidth size="small" readOnly={isReadonly}
                value={(isReadonly ? selected?.ppe : form.ppe) || ''}
                onChange={e => setForm({ ...form, ppe: e.target.value })}>
                {PPES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </ReadTextField>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>안내 담당자</FormLabel>
            <FormCell borderRight>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField fullWidth size="small" InputProps={{ readOnly: true }}
                  value={(isReadonly ? selected?.mgrName : form.mgrName) || ''} placeholder="조직도에서 선택" />
                {!isReadonly && (
                  <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setPickerOpen(true)}>
                    <PersonSearchIcon fontSize="small" />
                  </Button>
                )}
              </Box>
            </FormCell>
            <FormLabel>상태</FormLabel>
            <FormCell>
              <ReadTextField select fullWidth size="small" readOnly={isReadonly}
                value={(isReadonly ? selected?.status : form.status) || '입장중'}
                onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </ReadTextField>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>방문일시</FormLabel>
            <FormCell>
              <DatePickerField readOnly={isReadonly}
                value={(isReadonly ? selected?.visitDt?.slice(0, 10) : form.visitDt?.slice(0, 10)) || null}
                onChange={d => setForm({ ...form, visitDt: d ? `${d}T00:00:00` : undefined })} />
            </FormCell>
          </FormRow>
          <FormRow last>
            <FormLabel>비고</FormLabel>
            <FormCell>
              <ReadTextField fullWidth size="small" multiline minRows={2} readOnly={isReadonly}
                value={(isReadonly ? selected?.note : form.note) || ''}
                onChange={e => setForm({ ...form, note: e.target.value })} />
            </FormCell>
          </FormRow>
        </FormTable>

        {!isReadonly && (
          <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={handleSubmit} disabled={!form.visitorName}>저장</Button>
          </Stack>
        )}

        <UserSelectModal open={pickerOpen} onClose={() => setPickerOpen(false)} selectedUsers={[]} onConfirm={onPicked} singleSelect useCompanyTree title="안내 담당자 선택 (조직도)" />
      </Box>
    )
  }

  // ====== LIST PAGE ======
  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={2.4}><StatCard color="blue"   value={stats?.visitorToday ?? 0}   label="오늘 방문자" sub={`입장 중 ${stats?.visitorInside ?? 0}명`} /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="blue"   value={stats?.visitorMonth ?? 0}   label="이번 달 방문자" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="green"  value={items.filter(v => v.education === '완료').length} label="교육 이수" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="yellow" value={stats?.visitorNoEdu ?? 0}   label="교육 미이수" sub="입장 보류" /></Grid>
        <Grid item xs={6} sm={2.4}><StatCard color="red"    value={stats?.visitorBlocked ?? 0} label="출입금지" /></Grid>
      </Grid>

      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>방문자 EHS 교육 의무 안내</strong> — 모든 협력업체 방문자는 입장 전 안전교육 (10분) 이수 필수 · 보호구 착용 확인 후 출입증 발급 (산안법 §14)
      </Alert>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems="center">
        <ListSearchBar fullWidth placeholder="성명/업체명/목적 검색..." value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
        <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
        <TextField select size="small" sx={{ minWidth: 130 }} label="상태" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <MenuItem value="">전체</MenuItem>
          {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        {canNew && <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleNewClick} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>New</Button>}
      </Stack>

      <Paper variant="outlined">
        {isLoading ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell align="center">방문일시</TableCell><TableCell align="center">성명</TableCell>
                <TableCell>업체명</TableCell><TableCell align="center">직책</TableCell>
                <TableCell>방문 목적</TableCell><TableCell align="center">방문 구역</TableCell>
                <TableCell align="center">안전교육</TableCell><TableCell>보호구</TableCell>
                <TableCell align="center">입장</TableCell><TableCell align="center">퇴장</TableCell>
                <TableCell align="center">상태</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {filtered.map(v => (
                  <TableRow key={v.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(v)}>
                    <TableCell align="center">{v.visitDt?.replace('T', ' ').slice(0, 16) || '-'}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{v.visitorName}</TableCell>
                    <TableCell>{v.companyName || '-'}</TableCell>
                    <TableCell align="center">{v.position || '-'}</TableCell>
                    <TableCell><Chip size="small" label={v.purpose || '-'} variant="outlined" /></TableCell>
                    <TableCell align="center">{v.area || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.education || '-'} color={v.education === '완료' ? 'success' : v.education === '미이수' ? 'error' : 'default'} /></TableCell>
                    <TableCell>{v.ppe || '-'}</TableCell>
                    <TableCell align="center">{v.checkInTime || '-'}</TableCell>
                    <TableCell align="center">{v.checkOutTime || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={v.status} color={statusColor(v.status)} /></TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={11} align="center" sx={{ color: 'text.disabled', py: 6 }}>방문자 기록이 없습니다</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  )
}

export default PartnerVisitorTab
