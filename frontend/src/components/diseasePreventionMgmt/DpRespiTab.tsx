import { useState, useMemo } from 'react'
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
import { dpRespiApi, dpMgmtStatsApi } from '../../api/diseasePreventionMgmtApi'
import type { DpRespi } from '../../types/diseasePreventionMgmt.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import DevTestFillButton from '../common/DevTestFillButton'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'

const EXPOSURE_TYPES = ['분진', '유기용제', '금속분진', '산알칼리', '감작성물질']
const STATUSES = ['정상', '요관찰', '이상소견']
const FIT_RESULTS = ['', '적합', '부적합']

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const statusColor = (s?: string): 'success' | 'warning' | 'error' | 'default' =>
  s === '이상소견' ? 'error' : s === '요관찰' ? 'warning' : s === '정상' ? 'success' : 'default'

const emptyForm: Partial<DpRespi> = { exposureType: '유기용제', status: '정상' }

const MENU = '보건 관리 › 질병예방 관리 › 호흡기피부'

const DpRespiTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm, showSuccess, showError } = useAlert()
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const myRoles: string[] = ['guest', ...(user?.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : (user?.role ? [user.role] : []))]
  const getRoles = (item: { createdByUserId?: number | null }): string[] => {
    const roles = [...myRoles]
    if (item.createdByUserId != null && user?.id != null && item.createdByUserId === user.id) roles.push('writer')
    return roles
  }

  const { data: list = [], isLoading } = useQuery({ queryKey: ['dpRespi'], queryFn: dpRespiApi.list })
  const { data: stats } = useQuery({ queryKey: ['dpMgmtStats'], queryFn: dpMgmtStatsApi.get })

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<DpRespi | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterExp, setFilterExp] = useState('all')
  const [form, setForm] = useState<Partial<DpRespi>>(emptyForm)

  // DEV ONLY — 비어있는 항목을 호흡기·피부 노출 도메인 더미데이터로 채움 (입력값은 보존)
  const fillTestData = () => setForm(prev => ({
    ...prev,
    workerName: prev.workerName || '최영길',
    department: prev.department || '도장1팀',
    exposureType: prev.exposureType || '유기용제',
    exposureSubstance: prev.exposureSubstance || '톨루엔, 크실렌',
    exposureLevel: prev.exposureLevel || '15ppm (TWA)',
    ppeType: prev.ppeType || '방독마스크(유기가스용 정화통)',
    fitTestDate: prev.fitTestDate || todayStr(),
    fitTestResult: prev.fitTestResult || '적합',
    pftFvc: prev.pftFvc ?? 4.2,
    pftFev1: prev.pftFev1 ?? 3.5,
    skinCondition: prev.skinCondition || '양손 등쪽 경미한 건조·홍반',
    patchTestResult: prev.patchTestResult || '음성',
    status: prev.status || '요관찰',
    examDate: prev.examDate || todayStr(),
    examiner: prev.examiner || '한국산업보건연구원',
    notes: prev.notes || '테스트 데이터',
  }))

  const applySearch = () => setSearch(searchInput)
  const handleResetSearch = () => { setSearchInput(''); setSearch('') }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['dpRespi'] })
    qc.invalidateQueries({ queryKey: ['dpMgmtStats'] })
  }

  const createM = useMutation({ mutationFn: dpRespiApi.create, onSuccess: () => { invalidate(); showSuccess(t('dpRespiTab.msg1', '등록되었습니다')); handleBackToList() }, onError: () => showError(t('dpRespiTab.msg2', '등록 실패')) })
  const updateM = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<DpRespi> }) => dpRespiApi.update(id, e), onSuccess: () => { invalidate(); showSuccess(t('dpRespiTab.msg3', '수정되었습니다')); handleBackToList() }, onError: () => showError(t('dpRespiTab.msg4', '수정 실패')) })
  const deleteM = useMutation({ mutationFn: dpRespiApi.remove, onSuccess: () => { invalidate(); showSuccess(t('dpRespiTab.msg5', '삭제되었습니다')); handleBackToList() } })

  const filtered = useMemo(() => list.filter((x) => {
    if (filterExp !== 'all' && x.exposureType !== filterExp) return false
    if (search && !`${x.workerName} ${x.exposureSubstance || ''}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [list, filterExp, search])

  const handleBackToList = () => { setViewMode('list'); setSelected(null); setForm(emptyForm) }
  const handleRowClick = (item: DpRespi) => { setSelected(item); setViewMode('detail') }
  const handleAddClick = () => { setSelected(null); setForm({ ...emptyForm, fitTestDate: todayStr(), examDate: todayStr() }); setViewMode('create') }
  const handleEditClick = () => { if (selected) { setForm({ ...selected }); setViewMode('edit') } }
  const handleDeleteClick = async () => {
    if (!selected) return
    if (await showConfirm(t('dpRespiTab.msg6', '이 항목을 삭제하시겠습니까?'))) deleteM.mutate(selected.id)
  }
  const handleSave = () => {
    if (!form.workerName || !form.exposureType) { showError(t('dpRespiTab.msg7', '근로자명·노출 유형 필수')); return }
    if (viewMode === 'edit' && selected) updateM.mutate({ id: selected.id, e: form })
    else createM.mutate(form)
  }

  if (viewMode === 'detail' && selected) {
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{t('dpRespiTab.section1', '호흡기·피부 노출 상세')}</Typography>
        <FormTable>
          <FormRow><FormLabel>근로자명</FormLabel><FormCell borderRight><Typography variant="body2" fontWeight={600}>{selected.workerName}</Typography></FormCell><FormLabel>부서</FormLabel><FormCell><Typography variant="body2">{selected.department || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>노출 유형</FormLabel><FormCell><Chip size="small" label={selected.exposureType} color="info" variant="outlined" /></FormCell></FormRow>
          <FormRow><FormLabel>노출 물질</FormLabel><FormCell><Typography variant="body2">{selected.exposureSubstance || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>노출 수준</FormLabel><FormCell><Typography variant="body2">{selected.exposureLevel || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>보호구</FormLabel><FormCell><Typography variant="body2">{selected.ppeType || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>Fit Test 일자</FormLabel><FormCell borderRight><Typography variant="body2" fontFamily="monospace">{selected.fitTestDate || ''}</Typography></FormCell><FormLabel>Fit Test 결과</FormLabel><FormCell><Typography variant="body2">{selected.fitTestResult || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>FVC (L)</FormLabel><FormCell borderRight><Typography variant="body2" fontFamily="monospace">{selected.pftFvc ?? ''}</Typography></FormCell><FormLabel>FEV1 (L)</FormLabel><FormCell><Typography variant="body2" fontFamily="monospace">{selected.pftFev1 ?? ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>피부 상태</FormLabel><FormCell borderRight><Typography variant="body2">{selected.skinCondition || ''}</Typography></FormCell><FormLabel>패치 테스트</FormLabel><FormCell><Typography variant="body2">{selected.patchTestResult || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>판정</FormLabel><FormCell borderRight><Chip size="small" label={selected.status || '-'} color={statusColor(selected.status)} /></FormCell><FormLabel>검진일</FormLabel><FormCell><Typography variant="body2" fontFamily="monospace">{selected.examDate || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>검진기관</FormLabel><FormCell><Typography variant="body2">{selected.examiner || ''}</Typography></FormCell></FormRow>
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
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{viewMode === 'edit' ? '호흡기·피부 노출 수정' : '호흡기·피부 노출 등록'}</Typography>
        <FormTable>
          <FormRow>
            <FormLabel required>근로자명</FormLabel>
            <FormCell borderRight><TextField fullWidth size="small" value={form.workerName || ''} onChange={(e) => setForm({ ...form, workerName: e.target.value })} /></FormCell>
            <FormLabel>부서</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel required>노출 유형</FormLabel>
            <FormCell>
              <TextField select fullWidth size="small" value={form.exposureType || ''} onChange={(e) => setForm({ ...form, exposureType: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {EXPOSURE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>노출 물질</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.exposureSubstance || ''} onChange={(e) => setForm({ ...form, exposureSubstance: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>노출 수준</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.exposureLevel || ''} onChange={(e) => setForm({ ...form, exposureLevel: e.target.value })} placeholder="예: 15ppm (TWA)" /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>보호구</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.ppeType || ''} onChange={(e) => setForm({ ...form, ppeType: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>Fit Test 일자</FormLabel>
            <FormCell borderRight><DatePickerField value={form.fitTestDate || null} onChange={(d) => setForm({ ...form, fitTestDate: d || undefined })} /></FormCell>
            <FormLabel>Fit Test 결과</FormLabel>
            <FormCell>
              <TextField select fullWidth size="small" value={form.fitTestResult || ''} onChange={(e) => setForm({ ...form, fitTestResult: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {FIT_RESULTS.map((r) => <MenuItem key={r} value={r}>{r || '미실시'}</MenuItem>)}
              </TextField>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>FVC (L)</FormLabel>
            <FormCell borderRight><NumberField fullWidth value={form.pftFvc ?? null} onChange={(v) => setForm({ ...form, pftFvc: v ?? undefined })} thousandSeparator={false} step={0.1} /></FormCell>
            <FormLabel>FEV1 (L)</FormLabel>
            <FormCell><NumberField fullWidth value={form.pftFev1 ?? null} onChange={(v) => setForm({ ...form, pftFev1: v ?? undefined })} thousandSeparator={false} step={0.1} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>피부 상태</FormLabel>
            <FormCell borderRight><TextField fullWidth size="small" value={form.skinCondition || ''} onChange={(e) => setForm({ ...form, skinCondition: e.target.value })} /></FormCell>
            <FormLabel>패치 테스트</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.patchTestResult || ''} onChange={(e) => setForm({ ...form, patchTestResult: e.target.value })} placeholder="예: 음성 / 양성 (...)" /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>판정</FormLabel>
            <FormCell borderRight>
              <TextField select fullWidth size="small" value={form.status || ''} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </FormCell>
            <FormLabel>검진일</FormLabel>
            <FormCell><DatePickerField value={form.examDate || null} onChange={(d) => setForm({ ...form, examDate: d || undefined })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>검진기관</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.examiner || ''} onChange={(e) => setForm({ ...form, examiner: e.target.value })} /></FormCell>
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
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.respiTotal ?? 0}    label={t('dpRespiTab.label1', '노출자')} sub="관리 대상" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.respiOk ?? 0}       label={t('dpRespiTab.label2', '정상')} sub="검사 적합" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.respiWatch ?? 0}    label={t('dpRespiTab.label3', '요관찰')} sub="추적 검사" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.respiAbnormal ?? 0} label={t('dpRespiTab.label4', '이상소견')} sub="전문의 진료" /></Grid>
      </Grid>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2, justifyContent: 'flex-start' }} alignItems="center">
        <ListSearchBar placeholder="근로자·물질 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch}
          sx={{ width: { xs: '100%', sm: 240 } }} />
        <TextField select size="small" value={filterExp} onChange={(e) => setFilterExp(e.target.value)} sx={{ minWidth: 130 }}>
          <MenuItem value="all">전체</MenuItem>
          {EXPOSURE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
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
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>노출 유형</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>노출 물질·수준</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>Fit Test</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 90 }}>FEV1/FVC</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>판정</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.disabled' }}>노출자 기록이 없습니다</TableCell></TableRow>
                ) : filtered.map((x) => (
                  <TableRow key={x.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(x)}>
                    <TableCell sx={{ fontWeight: 600 }}>{x.workerName}<Box sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>{x.department || ''}</Box></TableCell>
                    <TableCell align="center"><Chip size="small" label={x.exposureType} color="info" variant="outlined" /></TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{x.exposureSubstance || '-'}<Box sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>{x.exposureLevel || ''}</Box></TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.fitTestResult || '-'}<Box sx={{ fontSize: '0.7rem' }}>{x.fitTestDate || ''}</Box></TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.pftFev1 ?? '-'}/{x.pftFvc ?? '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={x.status || '-'} color={statusColor(x.status)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  )
}

export default DpRespiTab
