import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  IconButton, CircularProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import { permitInspectionApi, permitLifecycleStatsApi } from '../../api/permitLifecycleApi'
import type { PermitInspection } from '../../types/permitLifecycle.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const FREQS = ['일', '주', '월', '분기', '반기', '연']
const TYPES = ['법정', '자체', '외부위탁']
const RESULTS = ['적합', '시정필요', '부적합']

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const daysUntil = (d?: string) => {
  if (!d) return Infinity
  return Math.ceil((new Date(d).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000)
}

const statusBadge = (next?: string): { label: string; color: 'success' | 'warning' | 'error' } => {
  const d = daysUntil(next)
  if (d < 0) return { label: '미실시', color: 'error' }
  if (d <= 30) return { label: '임박', color: 'warning' }
  return { label: '정상', color: 'success' }
}

const resultColor = (r?: string): 'success' | 'warning' | 'error' | 'default' =>
  r === '적합' ? 'success' : r === '시정필요' ? 'warning' : r === '부적합' ? 'error' : 'default'

const emptyForm: Partial<PermitInspection> = { frequency: '월', inspectionType: '법정', lastResult: '적합' }

const PermitInspectionTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm, showSuccess, showError } = useAlert()

  const { data: list = [], isLoading } = useQuery({ queryKey: ['permitInspection'], queryFn: permitInspectionApi.list })
  const { data: stats } = useQuery({ queryKey: ['permitLifecycleStats'], queryFn: permitLifecycleStatsApi.get })

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<PermitInspection | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterFreq, setFilterFreq] = useState('all')
  const [form, setForm] = useState<Partial<PermitInspection>>(emptyForm)

  const applySearch = () => setSearch(searchInput)
  const handleResetSearch = () => { setSearchInput(''); setSearch('') }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['permitInspection'] })
    qc.invalidateQueries({ queryKey: ['permitLifecycleStats'] })
  }

  const createM = useMutation({ mutationFn: permitInspectionApi.create, onSuccess: () => { invalidate(); showSuccess(t('permitInspectionTab.msg1', '등록되었습니다')); handleBackToList() }, onError: () => showError(t('permitInspectionTab.msg2', '등록 실패')) })
  const updateM = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<PermitInspection> }) => permitInspectionApi.update(id, e), onSuccess: () => { invalidate(); showSuccess(t('permitInspectionTab.msg3', '수정되었습니다')); handleBackToList() }, onError: () => showError(t('permitInspectionTab.msg4', '수정 실패')) })
  const deleteM = useMutation({ mutationFn: permitInspectionApi.remove, onSuccess: () => { invalidate(); showSuccess(t('permitInspectionTab.msg5', '삭제되었습니다')); handleBackToList() } })

  const filtered = useMemo(() => list.filter((x) => {
    if (filterFreq !== 'all' && x.frequency !== filterFreq) return false
    if (search && !`${x.inspectionName} ${x.targetFacility || ''}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [list, filterFreq, search])

  const handleBackToList = () => { setViewMode('list'); setSelected(null); setForm(emptyForm) }
  const handleRowClick = (item: PermitInspection) => { setSelected(item); setViewMode('detail') }
  const handleAddClick = () => { setSelected(null); setForm({ ...emptyForm, lastDate: todayStr(), nextDate: todayStr() }); setViewMode('create') }
  const handleEditClick = () => { if (selected) { setForm({ ...selected }); setViewMode('edit') } }
  const handleDeleteClick = async () => {
    if (!selected) return
    if (await showConfirm(t('permitInspectionTab.msg6', '이 점검 항목을 삭제하시겠습니까?'))) deleteM.mutate(selected.id)
  }
  const handleSave = () => {
    if (!form.inspectionName || !form.frequency || !form.nextDate) { showError(t('permitInspectionTab.msg7', '점검명·주기·차기 점검일 필수')); return }
    if (viewMode === 'edit' && selected) updateM.mutate({ id: selected.id, e: form })
    else createM.mutate(form)
  }

  if (viewMode === 'detail' && selected) {
    const st = statusBadge(selected.nextDate)
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{t('permitInspectionTab.section1', '점검 항목 상세')}</Typography>
        <FormTable>
          <FormRow>
            <FormLabel>점검 명칭</FormLabel>
            <FormCell><Typography variant="body2" fontWeight={600}>{selected.inspectionName}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>점검 구분</FormLabel>
            <FormCell borderRight><Typography variant="body2">{selected.inspectionType || ''}</Typography></FormCell>
            <FormLabel>점검 주기</FormLabel>
            <FormCell><Chip size="small" label={selected.frequency} variant="outlined" /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>대상 시설</FormLabel>
            <FormCell><Typography variant="body2">{selected.targetFacility || ''}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>관련 법규</FormLabel>
            <FormCell><Typography variant="body2">{selected.legalBasis || ''}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>최근 점검일</FormLabel>
            <FormCell borderRight><Typography variant="body2" fontFamily="monospace">{selected.lastDate || ''}</Typography></FormCell>
            <FormLabel>차기 점검일</FormLabel>
            <FormCell><Typography variant="body2" fontFamily="monospace">{selected.nextDate || ''}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>담당자</FormLabel>
            <FormCell borderRight><Typography variant="body2">{selected.assignee || ''}</Typography></FormCell>
            <FormLabel>최근 결과</FormLabel>
            <FormCell><Chip size="small" label={selected.lastResult || '-'} color={resultColor(selected.lastResult)} variant="outlined" /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>상태</FormLabel>
            <FormCell><Chip size="small" label={st.label} color={st.color} /></FormCell>
          </FormRow>
          <FormRow last>
            <FormLabel>비고</FormLabel>
            <FormCell><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selected.notes || ''}</Typography></FormCell>
          </FormRow>
        </FormTable>
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>목록</Button>
          <Button variant="contained" onClick={handleEditClick} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>수정</Button>
          <Button variant="contained" color="error" onClick={handleDeleteClick} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>삭제</Button>
        </Box>
      </Box>
    )
  }

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{viewMode === 'edit' ? '점검 항목 수정' : '점검 항목 등록'}</Typography>
        <FormTable>
          <FormRow>
            <FormLabel required>점검 명칭</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.inspectionName || ''} onChange={(e) => setForm({ ...form, inspectionName: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>점검 구분</FormLabel>
            <FormCell borderRight>
              <TextField select fullWidth size="small" value={form.inspectionType || ''} onChange={(e) => setForm({ ...form, inspectionType: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </FormCell>
            <FormLabel required>점검 주기</FormLabel>
            <FormCell>
              <TextField select fullWidth size="small" value={form.frequency || ''} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {FREQS.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
              </TextField>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>대상 시설</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.targetFacility || ''} onChange={(e) => setForm({ ...form, targetFacility: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>관련 법규</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.legalBasis || ''} onChange={(e) => setForm({ ...form, legalBasis: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>최근 점검일</FormLabel>
            <FormCell borderRight><DatePickerField value={form.lastDate || null} onChange={(d) => setForm({ ...form, lastDate: d || undefined })} /></FormCell>
            <FormLabel required>차기 점검일</FormLabel>
            <FormCell><DatePickerField value={form.nextDate || null} onChange={(d) => setForm({ ...form, nextDate: d || undefined })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>담당자</FormLabel>
            <FormCell borderRight><TextField fullWidth size="small" value={form.assignee || ''} onChange={(e) => setForm({ ...form, assignee: e.target.value })} /></FormCell>
            <FormLabel>최근 결과</FormLabel>
            <FormCell>
              <TextField select fullWidth size="small" value={form.lastResult || ''} onChange={(e) => setForm({ ...form, lastResult: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {RESULTS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </TextField>
            </FormCell>
          </FormRow>
          <FormRow last>
            <FormLabel>비고</FormLabel>
            <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></FormCell>
          </FormRow>
        </FormTable>
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>취소</Button>
          <Button variant="contained" onClick={handleSave} disabled={createM.isPending || updateM.isPending} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>저장</Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.ipTotal ?? 0}   label={t('permitInspectionTab.label1', '총 점검 항목')} sub="정기 점검" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={(stats?.ipTotal ?? 0) - (stats?.ipNear ?? 0) - (stats?.ipOverdue ?? 0)} label={t('permitInspectionTab.label2', '정상')} sub="기한 내" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.ipNear ?? 0}    label={t('permitInspectionTab.label3', '임박 (D-30)')} sub="곧 만기" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.ipOverdue ?? 0} label={t('permitInspectionTab.label4', '미실시')} sub="기한 초과" /></Grid>
      </Grid>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2, justifyContent: 'flex-start' }} alignItems="center">
        <ListSearchBar placeholder="점검명·시설 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch}
          sx={{ width: { xs: '100%', sm: 240 } }} />
        <TextField select size="small" value={filterFreq} onChange={(e) => setFilterFreq(e.target.value)} sx={{ minWidth: 110 }}>
          <MenuItem value="all">전체</MenuItem>
          {FREQS.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
        </TextField>
        <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick} sx={{ whiteSpace: 'nowrap' }}>New</Button>
      </Stack>

      <Paper variant="outlined" sx={{ mb: 2 }}>
        {isLoading ? <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>점검명</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 80 }}>주기</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>대상 시설</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>최근 점검</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>차기 점검</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>최근 결과</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 90 }}>상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.disabled' }}>점검 항목이 없습니다</TableCell></TableRow>
                ) : filtered.map((x) => {
                  const st = statusBadge(x.nextDate)
                  const dD = daysUntil(x.nextDate)
                  return (
                    <TableRow key={x.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(x)}>
                      <TableCell sx={{ fontWeight: 600 }}>{x.inspectionName}</TableCell>
                      <TableCell align="center"><Chip size="small" label={x.frequency} variant="outlined" /></TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{x.targetFacility || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.lastDate || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: dD < 0 ? 'error.main' : dD <= 30 ? 'warning.main' : 'inherit' }}>
                        {x.nextDate}<Box sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>D{dD >= 0 ? '-' : '+'}{Math.abs(dD)}</Box>
                      </TableCell>
                      <TableCell align="center"><Chip size="small" label={x.lastResult || '-'} color={resultColor(x.lastResult)} variant="outlined" /></TableCell>
                      <TableCell align="center"><Chip size="small" label={st.label} color={st.color} /></TableCell>
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

export default PermitInspectionTab
