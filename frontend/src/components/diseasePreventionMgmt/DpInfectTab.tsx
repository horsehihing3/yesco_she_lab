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
import { dpInfectApi, dpMgmtStatsApi } from '../../api/diseasePreventionMgmtApi'
import type { DpInfect } from '../../types/diseasePreventionMgmt.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import DevTestFillButton from '../common/DevTestFillButton'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'

const PROGRAM_TYPES = ['예방접종', '검진', '감염병발생', '노출사고']
const STATUSES = ['완료', '예정', '추적관리', '회복']

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const typeColor = (t: string): 'success' | 'info' | 'error' | 'warning' | 'default' =>
  t === '예방접종' ? 'success' : t === '검진' ? 'info' :
  t === '감염병발생' ? 'error' : t === '노출사고' ? 'warning' : 'default'

const daysUntil = (d?: string) => {
  if (!d) return Infinity
  return Math.ceil((new Date(d).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000)
}

const emptyForm: Partial<DpInfect> = { programType: '예방접종', status: '완료' }

const MENU = '보건 관리 › 질병예방 관리 › 감염병'

const DpInfectTab: React.FC = () => {
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

  const { data: list = [], isLoading } = useQuery({ queryKey: ['dpInfect'], queryFn: dpInfectApi.list })
  const { data: stats } = useQuery({ queryKey: ['dpMgmtStats'], queryFn: dpMgmtStatsApi.get })

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<DpInfect | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [form, setForm] = useState<Partial<DpInfect>>(emptyForm)

  // DEV ONLY — 비어있는 항목을 감염병 관리 도메인 더미데이터로 채움 (입력값은 보존)
  const fillTestData = () => setForm(prev => ({
    ...prev,
    workerName: prev.workerName || '강서연',
    department: prev.department || '총무팀',
    programType: prev.programType || '예방접종',
    status: prev.status || '완료',
    diseaseType: prev.diseaseType || '인플루엔자 (4가)',
    implDate: prev.implDate || todayStr(),
    nextDueDate: prev.nextDueDate || todayStr(),
    result: prev.result || '접종 완료, 이상반응 없음',
    notes: prev.notes || '테스트 데이터',
  }))

  const applySearch = () => setSearch(searchInput)
  const handleResetSearch = () => { setSearchInput(''); setSearch('') }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['dpInfect'] })
    qc.invalidateQueries({ queryKey: ['dpMgmtStats'] })
  }

  const createM = useMutation({ mutationFn: dpInfectApi.create, onSuccess: () => { invalidate(); showSuccess(t('dpInfectTab.msg1', '등록되었습니다')); handleBackToList() }, onError: () => showError(t('dpInfectTab.msg2', '등록 실패')) })
  const updateM = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<DpInfect> }) => dpInfectApi.update(id, e), onSuccess: () => { invalidate(); showSuccess(t('dpInfectTab.msg3', '수정되었습니다')); handleBackToList() }, onError: () => showError(t('dpInfectTab.msg4', '수정 실패')) })
  const deleteM = useMutation({ mutationFn: dpInfectApi.remove, onSuccess: () => { invalidate(); showSuccess(t('dpInfectTab.msg5', '삭제되었습니다')); handleBackToList() } })

  const filtered = useMemo(() => list.filter((x) => {
    if (filterType !== 'all' && x.programType !== filterType) return false
    if (search && !`${x.workerName} ${x.diseaseType || ''}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [list, filterType, search])

  const handleBackToList = () => { setViewMode('list'); setSelected(null); setForm(emptyForm) }
  const handleRowClick = (item: DpInfect) => { setSelected(item); setViewMode('detail') }
  const handleAddClick = () => { setSelected(null); setForm({ ...emptyForm, implDate: todayStr(), nextDueDate: todayStr() }); setViewMode('create') }
  const handleEditClick = () => { if (selected) { setForm({ ...selected }); setViewMode('edit') } }
  const handleDeleteClick = async () => {
    if (!selected) return
    if (await showConfirm(t('dpInfectTab.msg6', '이 기록을 삭제하시겠습니까?'))) deleteM.mutate(selected.id)
  }
  const handleSave = () => {
    if (!form.workerName || !form.programType) { showError(t('dpInfectTab.msg7', '근로자명·프로그램 유형 필수')); return }
    if (viewMode === 'edit' && selected) updateM.mutate({ id: selected.id, e: form })
    else createM.mutate(form)
  }

  if (viewMode === 'detail' && selected) {
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{t('dpInfectTab.section1', '감염병 기록 상세')}</Typography>
        <FormTable>
          <FormRow><FormLabel>근로자명</FormLabel><FormCell borderRight><Typography variant="body2" fontWeight={600}>{selected.workerName}</Typography></FormCell><FormLabel>부서</FormLabel><FormCell><Typography variant="body2">{selected.department || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>프로그램 유형</FormLabel><FormCell borderRight><Chip size="small" label={selected.programType} color={typeColor(selected.programType)} variant="outlined" /></FormCell><FormLabel>상태</FormLabel><FormCell><Typography variant="body2">{selected.status || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>질환·항목</FormLabel><FormCell><Typography variant="body2">{selected.diseaseType || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>실시일</FormLabel><FormCell borderRight><Typography variant="body2" fontFamily="monospace">{selected.implDate || ''}</Typography></FormCell><FormLabel>차기 예정일</FormLabel><FormCell><Typography variant="body2" fontFamily="monospace">{selected.nextDueDate || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>결과</FormLabel><FormCell><Typography variant="body2">{selected.result || ''}</Typography></FormCell></FormRow>
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
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{viewMode === 'edit' ? '감염병 기록 수정' : '감염병 기록 등록'}</Typography>
        <FormTable>
          <FormRow>
            <FormLabel required>근로자명</FormLabel>
            <FormCell borderRight><TextField fullWidth size="small" value={form.workerName || ''} onChange={(e) => setForm({ ...form, workerName: e.target.value })} /></FormCell>
            <FormLabel>부서</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel required>프로그램 유형</FormLabel>
            <FormCell borderRight>
              <TextField select fullWidth size="small" value={form.programType || ''} onChange={(e) => setForm({ ...form, programType: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {PROGRAM_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </FormCell>
            <FormLabel>상태</FormLabel>
            <FormCell>
              <TextField select fullWidth size="small" value={form.status || ''} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>질환·항목</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.diseaseType || ''} onChange={(e) => setForm({ ...form, diseaseType: e.target.value })} placeholder="예: 인플루엔자 / B형간염 / 결핵검진" /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>실시일</FormLabel>
            <FormCell borderRight><DatePickerField value={form.implDate || null} onChange={(d) => setForm({ ...form, implDate: d || undefined })} /></FormCell>
            <FormLabel>차기 예정일</FormLabel>
            <FormCell><DatePickerField value={form.nextDueDate || null} onChange={(d) => setForm({ ...form, nextDueDate: d || undefined })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>결과</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.result || ''} onChange={(e) => setForm({ ...form, result: e.target.value })} /></FormCell>
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
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.infectTotal ?? 0} label={t('dpInfectTab.label1', '전체 기록')} sub="예방·검진·발생" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.infectVac ?? 0}   label={t('dpInfectTab.label2', '예방접종')} sub="등록 건수" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.infectDue ?? 0}   label={t('dpInfectTab.label3', '검진 임박')} sub="30일 이내" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.infectEvent ?? 0} label={t('dpInfectTab.label4', '발생·노출')} sub="대응 중" /></Grid>
      </Grid>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2, justifyContent: 'flex-start' }} alignItems="center">
        <ListSearchBar placeholder="근로자·질환 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch}
          sx={{ width: { xs: '100%', sm: 240 } }} />
        <TextField select size="small" value={filterType} onChange={(e) => setFilterType(e.target.value)} sx={{ minWidth: 130 }}>
          <MenuItem value="all">전체</MenuItem>
          {PROGRAM_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
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
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>프로그램</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>질환·항목</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>실시일</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>결과</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>차기 예정</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.disabled' }}>기록이 없습니다</TableCell></TableRow>
                ) : filtered.map((x) => {
                  const d = daysUntil(x.nextDueDate)
                  return (
                    <TableRow key={x.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(x)}>
                      <TableCell sx={{ fontWeight: 600 }}>{x.workerName}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{x.department || '-'}</TableCell>
                      <TableCell align="center"><Chip size="small" label={x.programType} color={typeColor(x.programType)} variant="outlined" /></TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{x.diseaseType || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.implDate || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{x.result || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: d <= 30 && d >= 0 ? 'warning.main' : 'inherit' }}>{x.nextDueDate || '-'}</TableCell>
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

export default DpInfectTab
