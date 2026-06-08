import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  IconButton, CircularProgress, LinearProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import { permitRenewalApi, permitLifecycleStatsApi } from '../../api/permitLifecycleApi'
import type { PermitRenewal } from '../../types/permitLifecycle.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const STAGES = ['검토', '서류준비', '신청완료', '심사중', '승인', '완료']
const CATEGORIES = ['환경', '안전', '보건', '소방', '화학', '건축']

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const stageColor = (s: string): 'default' | 'info' | 'warning' | 'success' =>
  s === '완료' ? 'success' : s === '심사중' ? 'info' : s === '승인' ? 'info' : 'warning'

const daysUntil = (d?: string) => {
  if (!d) return Infinity
  return Math.ceil((new Date(d).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000)
}

const emptyForm: Partial<PermitRenewal> = { stage: '검토' }

const PermitRenewalTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm, showSuccess, showError } = useAlert()

  const { data: list = [], isLoading } = useQuery({ queryKey: ['permitRenewal'], queryFn: permitRenewalApi.list })
  const { data: stats } = useQuery({ queryKey: ['permitLifecycleStats'], queryFn: permitLifecycleStatsApi.get })

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<PermitRenewal | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('all')
  const [form, setForm] = useState<Partial<PermitRenewal>>(emptyForm)

  const applySearch = () => setSearch(searchInput)
  const handleResetSearch = () => { setSearchInput(''); setSearch('') }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['permitRenewal'] })
    qc.invalidateQueries({ queryKey: ['permitLifecycleStats'] })
  }

  const createM = useMutation({ mutationFn: permitRenewalApi.create, onSuccess: () => { invalidate(); showSuccess(t('permitRenewalTab.msg1', '등록되었습니다')); handleBackToList() }, onError: () => showError(t('permitRenewalTab.msg2', '등록 실패')) })
  const updateM = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<PermitRenewal> }) => permitRenewalApi.update(id, e), onSuccess: () => { invalidate(); showSuccess(t('permitRenewalTab.msg3', '수정되었습니다')); handleBackToList() }, onError: () => showError(t('permitRenewalTab.msg4', '수정 실패')) })
  const deleteM = useMutation({ mutationFn: permitRenewalApi.remove, onSuccess: () => { invalidate(); showSuccess(t('permitRenewalTab.msg5', '삭제되었습니다')); handleBackToList() } })

  const filtered = useMemo(() => list.filter((x) => {
    if (filterStage !== 'all' && x.stage !== filterStage) return false
    if (search) {
      const q = search.toLowerCase()
      if (!`${x.permitName} ${x.assignee || ''}`.toLowerCase().includes(q)) return false
    }
    return true
  }), [list, filterStage, search])

  const handleBackToList = () => { setViewMode('list'); setSelected(null); setForm(emptyForm) }
  const handleRowClick = (item: PermitRenewal) => { setSelected(item); setViewMode('detail') }
  const handleAddClick = () => { setSelected(null); setForm({ ...emptyForm, currentExpiry: todayStr(), targetDate: todayStr(), dueDate: todayStr() }); setViewMode('create') }
  const handleEditClick = () => { if (selected) { setForm({ ...selected }); setViewMode('edit') } }
  const handleDeleteClick = async () => {
    if (!selected) return
    if (await showConfirm(t('permitRenewalTab.msg6', '이 갱신 항목을 삭제하시겠습니까?'))) deleteM.mutate(selected.id)
  }
  const handleSave = () => {
    if (!form.permitName) { showError(t('permitRenewalTab.msg7', '갱신 인허가명을 입력해주세요')); return }
    if (viewMode === 'edit' && selected) updateM.mutate({ id: selected.id, e: form })
    else createM.mutate(form)
  }

  if (viewMode === 'detail' && selected) {
    const idx = STAGES.indexOf(selected.stage)
    const pct = idx >= 0 ? ((idx + 1) / STAGES.length) * 100 : 0
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{t('permitRenewalTab.section1', '갱신 항목 상세')}</Typography>
        <FormTable>
          <FormRow>
            <FormLabel>갱신 인허가명</FormLabel>
            <FormCell><Typography variant="body2" fontWeight={600}>{selected.permitName}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>분야</FormLabel>
            <FormCell borderRight><Chip size="small" label={selected.category || '-'} variant="outlined" /></FormCell>
            <FormLabel>단계</FormLabel>
            <FormCell><Chip size="small" label={selected.stage} color={stageColor(selected.stage)} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>진행률</FormLabel>
            <FormCell>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                <LinearProgress variant="determinate" value={pct} sx={{ flex: 1, height: 6, borderRadius: 1 }} />
                <Typography variant="caption" fontWeight={600}>{Math.round(pct)}%</Typography>
              </Stack>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>현재 만료일</FormLabel>
            <FormCell borderRight><Typography variant="body2" fontFamily="monospace">{selected.currentExpiry || ''}</Typography></FormCell>
            <FormLabel>갱신 목표일</FormLabel>
            <FormCell><Typography variant="body2" fontFamily="monospace">{selected.targetDate || ''}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>갱신 시작일</FormLabel>
            <FormCell borderRight><Typography variant="body2" fontFamily="monospace">{selected.startDate || ''}</Typography></FormCell>
            <FormLabel>담당자</FormLabel>
            <FormCell><Typography variant="body2">{selected.assignee || ''}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>다음 액션</FormLabel>
            <FormCell><Typography variant="body2">{selected.nextAction || ''}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>액션 기한</FormLabel>
            <FormCell><Typography variant="body2" fontFamily="monospace">{selected.dueDate || ''}</Typography></FormCell>
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
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{viewMode === 'edit' ? '갱신 항목 수정' : '갱신 항목 등록'}</Typography>
        <FormTable>
          <FormRow>
            <FormLabel required>갱신 인허가명</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.permitName || ''} onChange={(e) => setForm({ ...form, permitName: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>분야</FormLabel>
            <FormCell borderRight>
              <TextField select fullWidth size="small" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </FormCell>
            <FormLabel>단계</FormLabel>
            <FormCell>
              <TextField select fullWidth size="small" value={form.stage || ''} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {STAGES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>현재 만료일</FormLabel>
            <FormCell borderRight><DatePickerField value={form.currentExpiry || null} onChange={(d) => setForm({ ...form, currentExpiry: d || undefined })} /></FormCell>
            <FormLabel>갱신 목표일</FormLabel>
            <FormCell><DatePickerField value={form.targetDate || null} onChange={(d) => setForm({ ...form, targetDate: d || undefined })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>갱신 시작일</FormLabel>
            <FormCell borderRight><DatePickerField value={form.startDate || null} onChange={(d) => setForm({ ...form, startDate: d || undefined })} /></FormCell>
            <FormLabel>담당자</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.assignee || ''} onChange={(e) => setForm({ ...form, assignee: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>다음 액션</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.nextAction || ''} onChange={(e) => setForm({ ...form, nextAction: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>액션 기한</FormLabel>
            <FormCell><DatePickerField value={form.dueDate || null} onChange={(d) => setForm({ ...form, dueDate: d || undefined })} /></FormCell>
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
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.rnActive ?? 0} label={t('permitRenewalTab.label1', '진행 중')} sub="갱신 워크플로우" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.rnWarn ?? 0}   label={t('permitRenewalTab.label2', '심사·승인')} sub="진행 중" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={(stats as any)?.rnDelay ?? 0} label={t('permitRenewalTab.label3', '지연')} sub="기한 초과" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.rnDone ?? 0}   label={t('permitRenewalTab.label4', '완료')} sub="갱신완료" /></Grid>
      </Grid>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2, justifyContent: 'flex-start' }} alignItems="center">
        <ListSearchBar placeholder="갱신 인허가·담당자 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch}
          sx={{ width: { xs: '100%', sm: 240 } }} />
        <TextField select size="small" value={filterStage} onChange={(e) => setFilterStage(e.target.value)} sx={{ minWidth: 130 }}>
          <MenuItem value="all">전체</MenuItem>
          {STAGES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
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
                  <TableCell sx={{ fontWeight: 'bold' }}>갱신 인허가</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 80 }}>분야</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>단계</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 150 }}>진행률</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>현재 만료일</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>액션 기한</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 130 }}>담당자</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.disabled' }}>갱신 항목이 없습니다</TableCell></TableRow>
                ) : filtered.map((x) => {
                  const idx = STAGES.indexOf(x.stage)
                  const pct = idx >= 0 ? ((idx + 1) / STAGES.length) * 100 : 0
                  const dDue = daysUntil(x.dueDate)
                  return (
                    <TableRow key={x.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(x)}>
                      <TableCell sx={{ fontWeight: 600 }}>{x.permitName}</TableCell>
                      <TableCell align="center"><Chip size="small" label={x.category || '-'} variant="outlined" /></TableCell>
                      <TableCell align="center"><Chip size="small" label={x.stage} color={stageColor(x.stage)} /></TableCell>
                      <TableCell align="center" sx={{ minWidth: 120 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <LinearProgress variant="determinate" value={pct} sx={{ flex: 1, minWidth: 60, height: 5, borderRadius: 1 }} />
                          <Box sx={{ fontSize: '0.75rem', fontWeight: 600, minWidth: 32 }}>{Math.round(pct)}%</Box>
                        </Stack>
                      </TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.currentExpiry || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: dDue < 0 ? 'error.main' : dDue <= 30 ? 'warning.main' : 'inherit' }}>
                        {x.dueDate || '-'}{x.dueDate && <Box sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>D{dDue >= 0 ? '-' : '+'}{Math.abs(dDue)}</Box>}
                      </TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.85rem' }}>{x.assignee || '-'}</TableCell>
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

export default PermitRenewalTab
