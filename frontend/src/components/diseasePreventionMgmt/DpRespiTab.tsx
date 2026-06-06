import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { dpRespiApi, dpMgmtStatsApi } from '../../api/diseasePreventionMgmtApi'
import type { DpRespi } from '../../types/diseasePreventionMgmt.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'

const EXPOSURE_TYPES = ['분진', '유기용제', '금속분진', '산알칼리', '감작성물질']
const STATUSES = ['정상', '요관찰', '이상소견']
const FIT_RESULTS = ['', '적합', '부적합']

const statusColor = (s?: string): 'success' | 'warning' | 'error' | 'default' =>
  s === '이상소견' ? 'error' : s === '요관찰' ? 'warning' : s === '정상' ? 'success' : 'default'

const emptyForm: Partial<DpRespi> = { exposureType: '유기용제', status: '정상' }

const MENU = '보건관리 › 질병예방관리 › 각 질환 탭'

const DpRespiTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm, showSuccess, showError } = useAlert()
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const isAdmin = user?.role === 'SYSTEM_ADMIN'
  const myRoles: string[] = ['guest', ...(isAdmin ? ['superAdmin'] : [])]

  const { data: list = [], isLoading } = useQuery({ queryKey: ['dpRespi'], queryFn: dpRespiApi.list })
  const { data: stats } = useQuery({ queryKey: ['dpMgmtStats'], queryFn: dpMgmtStatsApi.get })

  const [searchInput, setSearchInput] = useState('')

  const [search, setSearch] = useState('')

  const applySearch = () => setSearch(searchInput)

  const handleResetSearch = () => { setSearchInput(''); setSearch('') }
  const [filterExp, setFilterExp] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<DpRespi | null>(null)
  const [form, setForm] = useState<Partial<DpRespi>>(emptyForm)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['dpRespi'] })
    qc.invalidateQueries({ queryKey: ['dpMgmtStats'] })
  }

  const createM = useMutation({ mutationFn: dpRespiApi.create, onSuccess: () => { invalidate(); setOpen(false); showSuccess('등록되었습니다') }, onError: () => showError('등록 실패') })
  const updateM = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<DpRespi> }) => dpRespiApi.update(id, e), onSuccess: () => { invalidate(); setOpen(false); showSuccess('수정되었습니다') }, onError: () => showError('수정 실패') })
  const deleteM = useMutation({ mutationFn: dpRespiApi.remove, onSuccess: () => { invalidate(); showSuccess('삭제되었습니다') } })

  const filtered = useMemo(() => list.filter((x) => {
    if (filterExp !== 'all' && x.exposureType !== filterExp) return false
    if (search && !`${x.workerName} ${x.exposureSubstance || ''}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [list, filterExp, search])

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, fitTestDate: todayStr(), examDate: todayStr() }); setOpen(true) }
  const openEdit = (item: DpRespi) => { setEditing(item); setForm({ ...item }); setOpen(true) }
  const handleSave = () => {
    if (!form.workerName || !form.exposureType) { showError('근로자명·노출 유형 필수'); return }
    if (editing) updateM.mutate({ id: editing.id, e: form })
    else createM.mutate(form)
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.respiTotal ?? 0}    label="노출자" sub="관리 대상" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.respiOk ?? 0}       label="정상" sub="검사 적합" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.respiWatch ?? 0}    label="요관찰" sub="추적 검사" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.respiAbnormal ?? 0} label="이상소견" sub="전문의 진료" /></Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <ListSearchBar placeholder="근로자·물질 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch} sx={{ flex: 1, minWidth: 200 }} />
          <TextField select size="small" label="노출 유형" value={filterExp} onChange={(e) => setFilterExp(e.target.value)} sx={{ minWidth: 130 }}>
            <MenuItem value="all">전체</MenuItem>
            {EXPOSURE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
        <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
        </Stack>
      </Paper>

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
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 90 }}>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.disabled' }}>노출자 기록이 없습니다</TableCell></TableRow>
                ) : filtered.map((x) => (
                  <TableRow key={x.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{x.workerName}<Box sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>{x.department || ''}</Box></TableCell>
                    <TableCell align="center"><Chip size="small" label={x.exposureType} color="info" variant="outlined" /></TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{x.exposureSubstance || '-'}<Box sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>{x.exposureLevel || ''}</Box></TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.fitTestResult || '-'}<Box sx={{ fontSize: '0.7rem' }}>{x.fitTestDate || ''}</Box></TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.pftFev1 ?? '-'}/{x.pftFvc ?? '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={x.status || '-'} color={statusColor(x.status)} /></TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap', px: 0.5 }}>
                      {canSee(MENU, 'DETAIL', '수정', myRoles) && (
                        <IconButton size="small" onClick={() => openEdit(x)}><EditIcon fontSize="inherit" /></IconButton>
                      )}
                      {canSee(MENU, 'DETAIL', '삭제', myRoles) && (
                        <IconButton size="small" onClick={async () => {
                          if (await showConfirm('이 항목을 삭제하시겠습니까?')) deleteM.mutate(x.id)
                        }}><DeleteIcon fontSize="inherit" /></IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Stack direction="row" justifyContent="flex-end">
        {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>신규 등록</Button>
        )}
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? '호흡기·피부 노출 수정' : '호흡기·피부 노출 등록'}</DialogTitle>
        <DialogContent dividers>
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
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpen(false)}>취소</Button>
          {canSee(MENU, 'DETAIL', '저장', myRoles) && (
            <Button variant="contained" onClick={handleSave} disabled={createM.isPending || updateM.isPending}>저장</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DpRespiTab
