import { useState, useMemo } from 'react'
import { isSystemAdmin } from '../../utils/auth'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  IconButton, CircularProgress,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import { dpHearingApi, dpMgmtStatsApi } from '../../api/diseasePreventionMgmtApi'
import type { DpHearing } from '../../types/diseasePreventionMgmt.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import DevTestFillButton from '../common/DevTestFillButton'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'

const STATUSES = ['정상', 'STS발생', 'D1', 'D2']
const EXAM_TYPES = ['기준선', '정기', '확인']

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const statusColor = (s?: string): 'success' | 'warning' | 'error' | 'default' =>
  s === 'D2' ? 'error' : s === 'D1' ? 'error' : s === 'STS발생' ? 'warning' : s === '정상' ? 'success' : 'default'

const emptyForm: Partial<DpHearing> = { status: '정상', examType: '정기' }

const MENU = '보건 관리 › 질병예방 관리 › 청력보존'

const DpHearingTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm, showSuccess, showError } = useAlert()
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const isAdmin = isSystemAdmin(user)
  const myRoles: string[] = ['guest', ...(user?.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : (user?.role ? [user.role] : []))]
  const getRoles = (item: { createdByUserId?: number | null }): string[] => {
    const roles = [...myRoles]
    if (item.createdByUserId != null && user?.id != null && item.createdByUserId === user.id) roles.push('writer')
    return roles
  }

  const { data: list = [], isLoading } = useQuery({ queryKey: ['dpHearing'], queryFn: dpHearingApi.list })
  const { data: stats } = useQuery({ queryKey: ['dpMgmtStats'], queryFn: dpMgmtStatsApi.get })

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<DpHearing | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [form, setForm] = useState<Partial<DpHearing>>(emptyForm)

  // DEV ONLY — 비어있는 항목을 청력보존 도메인 더미데이터로 채움 (입력값은 보존)
  const fillTestData = () => setForm(prev => ({
    ...prev,
    workerName: prev.workerName || '박정호',
    department: prev.department || '압축기실 정비반',
    noiseLevel: prev.noiseLevel ?? 92,
    exposureHours: prev.exposureHours ?? 8,
    right4k: prev.right4k ?? 35,
    right6k: prev.right6k ?? 40,
    left4k: prev.left4k ?? 30,
    left6k: prev.left6k ?? 45,
    stsResult: prev.stsResult || '발생 (좌측 평균 12dB 악화)',
    ppeType: prev.ppeType || '귀마개(폼형) + 귀덮개',
    ppeNrr: prev.ppeNrr ?? 25,
    examDate: prev.examDate || todayStr(),
    examType: prev.examType || '정기',
    status: prev.status || 'STS발생',
    notes: prev.notes || '테스트 데이터',
  }))

  const applySearch = () => setSearch(searchInput)
  const handleResetSearch = () => { setSearchInput(''); setSearch('') }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['dpHearing'] })
    qc.invalidateQueries({ queryKey: ['dpMgmtStats'] })
  }

  const createM = useMutation({ mutationFn: dpHearingApi.create, onSuccess: () => { invalidate(); showSuccess(t('dpHearingTab.msg1', '등록되었습니다')); handleBackToList() }, onError: () => showError(t('dpHearingTab.msg2', '등록 실패')) })
  const updateM = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<DpHearing> }) => dpHearingApi.update(id, e), onSuccess: () => { invalidate(); showSuccess(t('dpHearingTab.msg3', '수정되었습니다')); handleBackToList() }, onError: () => showError(t('dpHearingTab.msg4', '수정 실패')) })
  const deleteM = useMutation({ mutationFn: dpHearingApi.remove, onSuccess: () => { invalidate(); showSuccess(t('dpHearingTab.msg5', '삭제되었습니다')); handleBackToList() } })

  const filtered = useMemo(() => list.filter((x) => {
    if (filterStatus !== 'all' && x.status !== filterStatus) return false
    if (search && !`${x.workerName} ${x.department || ''}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [list, filterStatus, search])

  const handleBackToList = () => { setViewMode('list'); setSelected(null); setForm(emptyForm) }
  const handleRowClick = (item: DpHearing) => { setSelected(item); setViewMode('detail') }
  const handleAddClick = () => { setSelected(null); setForm({ ...emptyForm, examDate: todayStr() }); setViewMode('create') }
  const handleEditClick = () => { if (selected) { setForm({ ...selected }); setViewMode('edit') } }
  const handleDeleteClick = async () => {
    if (!selected) return
    if (await showConfirm(t('dpHearingTab.msg6', '이 기록을 삭제하시겠습니까?'))) deleteM.mutate(selected.id)
  }
  const handleSave = () => {
    if (!form.workerName) { showError(t('dpHearingTab.msg7', '근로자명을 입력해주세요')); return }
    if (viewMode === 'edit' && selected) updateM.mutate({ id: selected.id, e: form })
    else createM.mutate(form)
  }

  if (viewMode === 'detail' && selected) {
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{t('dpHearingTab.section1', '청력 검사 상세')}</Typography>
        <FormTable>
          <FormRow><FormLabel>근로자명</FormLabel><FormCell borderRight><Typography variant="body2" fontWeight={600}>{selected.workerName}</Typography></FormCell><FormLabel>부서</FormLabel><FormCell><Typography variant="body2">{selected.department || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>소음 (dB)</FormLabel><FormCell borderRight><Typography variant="body2" fontFamily="monospace">{selected.noiseLevel ?? ''}</Typography></FormCell><FormLabel>노출시간 (h/일)</FormLabel><FormCell><Typography variant="body2" fontFamily="monospace">{selected.exposureHours ?? ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>보호구</FormLabel><FormCell borderRight><Typography variant="body2">{selected.ppeType || ''}</Typography></FormCell><FormLabel>NRR</FormLabel><FormCell><Typography variant="body2" fontFamily="monospace">{selected.ppeNrr ?? ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>우 4k / 6k (dB)</FormLabel><FormCell borderRight><Typography variant="body2" fontFamily="monospace">{selected.right4k}/{selected.right6k}</Typography></FormCell><FormLabel>좌 4k / 6k (dB)</FormLabel><FormCell><Typography variant="body2" fontFamily="monospace">{selected.left4k}/{selected.left6k}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>STS 결과</FormLabel><FormCell><Typography variant="body2">{selected.stsResult || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>검사일</FormLabel><FormCell borderRight><Typography variant="body2" fontFamily="monospace">{selected.examDate || ''}</Typography></FormCell><FormLabel>검사 구분</FormLabel><FormCell><Typography variant="body2">{selected.examType || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>판정</FormLabel><FormCell><Chip size="small" label={selected.status || '-'} color={statusColor(selected.status)} /></FormCell></FormRow>
          <FormRow last><FormLabel>비고</FormLabel><FormCell><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selected.notes || ''}</Typography></FormCell></FormRow>
        </FormTable>
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>목록</Button>
          {canSee(MENU, 'DETAIL', '수정', getRoles(selected ?? {})) && (
            <Button variant="contained" onClick={handleEditClick} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>수정</Button>
          )}
          {canSee(MENU, 'DETAIL', '삭제', getRoles(selected ?? {})) && (
            <Button variant="contained" color="error" onClick={handleDeleteClick} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>삭제</Button>
          )}
        </Box>
      </Box>
    )
  }

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{viewMode === 'edit' ? '청력 검사 수정' : '청력 검사 등록'}</Typography>
        <FormTable>
          <FormRow>
            <FormLabel required>근로자명</FormLabel>
            <FormCell borderRight><TextField fullWidth size="small" value={form.workerName || ''} onChange={(e) => setForm({ ...form, workerName: e.target.value })} /></FormCell>
            <FormLabel>부서</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>소음 (dB)</FormLabel>
            <FormCell borderRight><NumberField fullWidth value={form.noiseLevel ?? null} onChange={(v) => setForm({ ...form, noiseLevel: v ?? undefined })} thousandSeparator={false} /></FormCell>
            <FormLabel>노출시간 (h/일)</FormLabel>
            <FormCell><NumberField fullWidth value={form.exposureHours ?? null} onChange={(v) => setForm({ ...form, exposureHours: v ?? undefined })} thousandSeparator={false} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>보호구</FormLabel>
            <FormCell borderRight><TextField fullWidth size="small" value={form.ppeType || ''} onChange={(e) => setForm({ ...form, ppeType: e.target.value })} /></FormCell>
            <FormLabel>NRR</FormLabel>
            <FormCell><NumberField fullWidth value={form.ppeNrr ?? null} onChange={(v) => setForm({ ...form, ppeNrr: v ?? undefined })} thousandSeparator={false} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>우 4k / 6k (dB)</FormLabel>
            <FormCell borderRight>
              <Stack direction="row" spacing={1}>
                <NumberField fullWidth value={form.right4k ?? null} onChange={(v) => setForm({ ...form, right4k: v ?? undefined })} thousandSeparator={false} placeholder="4k" />
                <NumberField fullWidth value={form.right6k ?? null} onChange={(v) => setForm({ ...form, right6k: v ?? undefined })} thousandSeparator={false} placeholder="6k" />
              </Stack>
            </FormCell>
            <FormLabel>좌 4k / 6k (dB)</FormLabel>
            <FormCell>
              <Stack direction="row" spacing={1}>
                <NumberField fullWidth value={form.left4k ?? null} onChange={(v) => setForm({ ...form, left4k: v ?? undefined })} thousandSeparator={false} placeholder="4k" />
                <NumberField fullWidth value={form.left6k ?? null} onChange={(v) => setForm({ ...form, left6k: v ?? undefined })} thousandSeparator={false} placeholder="6k" />
              </Stack>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>STS 결과</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.stsResult || ''} onChange={(e) => setForm({ ...form, stsResult: e.target.value })} placeholder="예: 발생 / 없음" /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>검사일</FormLabel>
            <FormCell borderRight><DatePickerField value={form.examDate || null} onChange={(d) => setForm({ ...form, examDate: d || undefined })} /></FormCell>
            <FormLabel>검사 구분</FormLabel>
            <FormCell>
              <TextField select fullWidth size="small" value={form.examType || ''} onChange={(e) => setForm({ ...form, examType: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {EXAM_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>판정</FormLabel>
            <FormCell>
              <TextField select fullWidth size="small" value={form.status || ''} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </FormCell>
          </FormRow>
          <FormRow last>
            <FormLabel>비고</FormLabel>
            <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></FormCell>
          </FormRow>
        </FormTable>
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2 }}>
          {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>취소</Button>
          {canSee(MENU, 'DETAIL', '저장', getRoles(selected ?? {})) && (
            <Button variant="contained" onClick={handleSave} disabled={createM.isPending || updateM.isPending} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>저장</Button>
          )}
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.hearingTotal ?? 0} label={t('dpHearingTab.label1', '노출자')} sub="85dB 이상" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.hearingOk ?? 0}    label={t('dpHearingTab.label2', '정상')} sub="기준 이내" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.hearingSts ?? 0}   label="STS 발생" sub="청력 악화" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.hearingD ?? 0}     label={t('dpHearingTab.label3', '소음성 난청')} sub="D1·D2 판정" /></Grid>
      </Grid>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2, justifyContent: 'flex-start' }} alignItems="center">
        <ListSearchBar placeholder="근로자·작업장 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch}
          sx={{ width: { xs: '100%', sm: 240 } }} />
        <TextField select size="small" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} sx={{ minWidth: 110 }}>
          <MenuItem value="all">전체</MenuItem>
          {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
        <Box sx={{ flex: 1 }} />
        {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick} sx={{ whiteSpace: 'nowrap' }}>New</Button>
        )}
      </Stack>

      <Paper variant="outlined" sx={{ mb: 2 }}>
        {isLoading ? <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>근로자</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>부서</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>소음 (dB)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 70 }}>NRR</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>우 4k/6k</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>좌 4k/6k</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.disabled' }}>청력 기록이 없습니다</TableCell></TableRow>
                ) : filtered.map((x) => {
                  const dbHigh = (x.noiseLevel ?? 0) >= 90 ? 'error.main' : (x.noiseLevel ?? 0) >= 85 ? 'warning.main' : 'inherit'
                  return (
                    <TableRow key={x.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(x)}>
                      <TableCell sx={{ fontWeight: 600 }}>{x.workerName}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{x.department || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', color: dbHigh, fontWeight: 600 }}>{x.noiseLevel ?? '-'}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{x.ppeNrr ?? '-'}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.right4k}/{x.right6k}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.left4k}/{x.left6k}</TableCell>
                      <TableCell align="center"><Chip size="small" label={x.status || '-'} color={statusColor(x.status)} /></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  )
}

export default DpHearingTab
