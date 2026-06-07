import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  IconButton, CircularProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import { permitChangeApi, permitLifecycleStatsApi } from '../../api/permitLifecycleApi'
import type { PermitChange } from '../../types/permitLifecycle.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const CHANGE_TYPES = ['설비증설', '공정변경', '물질변경', '인원변경', '위치변경']
const STATUSES = ['검토중', '안전영향평가', '허가신청', '심사중', '승인', '이행완료', '반려']
const IMPACTS = ['검토중', '영향있음', '영향없음']

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const statusColor = (s: string): 'default' | 'info' | 'warning' | 'success' | 'error' =>
  s === '이행완료' ? 'success' : s === '반려' ? 'error' :
  s === '허가신청' || s === '심사중' || s === '승인' ? 'warning' : 'info'

const impactColor = (s?: string): 'success' | 'error' | 'warning' | 'default' =>
  s === '영향있음' ? 'error' : s === '영향없음' ? 'success' : 'warning'

const emptyForm: Partial<PermitChange> = { changeType: '설비증설', status: '검토중', impactAssessment: '검토중' }

const PermitChangeTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm, showSuccess, showError } = useAlert()

  const { data: list = [], isLoading } = useQuery({ queryKey: ['permitChange'], queryFn: permitChangeApi.list })
  const { data: stats } = useQuery({ queryKey: ['permitLifecycleStats'], queryFn: permitLifecycleStatsApi.get })

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<PermitChange | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [form, setForm] = useState<Partial<PermitChange>>(emptyForm)

  const applySearch = () => setSearch(searchInput)
  const handleResetSearch = () => { setSearchInput(''); setSearch('') }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['permitChange'] })
    qc.invalidateQueries({ queryKey: ['permitLifecycleStats'] })
  }

  const createM = useMutation({ mutationFn: permitChangeApi.create, onSuccess: () => { invalidate(); showSuccess('등록되었습니다'); handleBackToList() }, onError: () => showError('등록 실패') })
  const updateM = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<PermitChange> }) => permitChangeApi.update(id, e), onSuccess: () => { invalidate(); showSuccess('수정되었습니다'); handleBackToList() }, onError: () => showError('수정 실패') })
  const deleteM = useMutation({ mutationFn: permitChangeApi.remove, onSuccess: () => { invalidate(); showSuccess('삭제되었습니다'); handleBackToList() } })

  const filtered = useMemo(() => list.filter((x) => {
    if (filterType !== 'all' && x.changeType !== filterType) return false
    if (search && !`${x.title} ${x.description || ''}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [list, filterType, search])

  const handleBackToList = () => { setViewMode('list'); setSelected(null); setForm(emptyForm) }
  const handleRowClick = (item: PermitChange) => { setSelected(item); setViewMode('detail') }
  const handleAddClick = () => { setSelected(null); setForm({ ...emptyForm, requestDate: todayStr(), plannedDate: todayStr() }); setViewMode('create') }
  const handleEditClick = () => { if (selected) { setForm({ ...selected }); setViewMode('edit') } }
  const handleDeleteClick = async () => {
    if (!selected) return
    if (await showConfirm('이 변경관리 항목을 삭제하시겠습니까?')) deleteM.mutate(selected.id)
  }
  const handleSave = () => {
    if (!form.title || !form.changeType) { showError('변경 유형·제목 필수'); return }
    if (viewMode === 'edit' && selected) updateM.mutate({ id: selected.id, e: form })
    else createM.mutate(form)
  }

  if (viewMode === 'detail' && selected) {
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>변경관리 상세</Typography>
        <FormTable>
          <FormRow>
            <FormLabel>변경 유형</FormLabel>
            <FormCell borderRight><Chip size="small" label={selected.changeType} color="secondary" variant="outlined" /></FormCell>
            <FormLabel>상태</FormLabel>
            <FormCell><Chip size="small" label={selected.status} color={statusColor(selected.status)} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>변경 제목</FormLabel>
            <FormCell><Typography variant="body2" fontWeight={600}>{selected.title}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>변경 내용</FormLabel>
            <FormCell><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selected.description || ''}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>요청일</FormLabel>
            <FormCell borderRight><Typography variant="body2" fontFamily="monospace">{selected.requestDate || ''}</Typography></FormCell>
            <FormLabel>시행 계획일</FormLabel>
            <FormCell><Typography variant="body2" fontFamily="monospace">{selected.plannedDate || ''}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>요청자</FormLabel>
            <FormCell borderRight><Typography variant="body2">{selected.initiator || ''}</Typography></FormCell>
            <FormLabel>승인자</FormLabel>
            <FormCell><Typography variant="body2">{selected.approver || ''}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>안전영향 평가</FormLabel>
            <FormCell><Chip size="small" label={selected.impactAssessment || '-'} color={impactColor(selected.impactAssessment)} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>영향받는 인허가</FormLabel>
            <FormCell><Typography variant="body2">{selected.affectedPermits || ''}</Typography></FormCell>
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
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{viewMode === 'edit' ? '변경관리 수정' : '변경관리 등록'}</Typography>
        <FormTable>
          <FormRow>
            <FormLabel required>변경 유형</FormLabel>
            <FormCell borderRight>
              <TextField select fullWidth size="small" value={form.changeType || ''} onChange={(e) => setForm({ ...form, changeType: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {CHANGE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
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
            <FormLabel required>변경 제목</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>변경 내용</FormLabel>
            <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>요청일</FormLabel>
            <FormCell borderRight><DatePickerField value={form.requestDate || null} onChange={(d) => setForm({ ...form, requestDate: d || undefined })} /></FormCell>
            <FormLabel>시행 계획일</FormLabel>
            <FormCell><DatePickerField value={form.plannedDate || null} onChange={(d) => setForm({ ...form, plannedDate: d || undefined })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>요청자</FormLabel>
            <FormCell borderRight><TextField fullWidth size="small" value={form.initiator || ''} onChange={(e) => setForm({ ...form, initiator: e.target.value })} /></FormCell>
            <FormLabel>승인자</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.approver || ''} onChange={(e) => setForm({ ...form, approver: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>안전영향 평가</FormLabel>
            <FormCell>
              <TextField select fullWidth size="small" value={form.impactAssessment || ''} onChange={(e) => setForm({ ...form, impactAssessment: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {IMPACTS.map((i) => <MenuItem key={i} value={i}>{i}</MenuItem>)}
              </TextField>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>영향받는 인허가</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.affectedPermits || ''} onChange={(e) => setForm({ ...form, affectedPermits: e.target.value })} /></FormCell>
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
        <Grid item xs={6} sm={3}><StatCard color="purple" value={stats?.chTotal ?? 0}    label="전체 MOC" sub="변경요청" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.chReview ?? 0}   label="검토 중" sub="영향평가 단계" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.chProgress ?? 0} label="허가 진행" sub="신청·심사 중" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.chDone ?? 0}     label="완료" sub="이행완료" /></Grid>
      </Grid>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2, justifyContent: 'flex-start' }} alignItems="center">
        <ListSearchBar placeholder="변경 사유·대상 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch}
          sx={{ width: { xs: '100%', sm: 240 } }} />
        <TextField select size="small" value={filterType} onChange={(e) => setFilterType(e.target.value)} sx={{ minWidth: 120 }}>
          <MenuItem value="all">전체</MenuItem>
          {CHANGE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
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
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>변경 유형</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>제목</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>요청일</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>계획일</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>영향평가</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 120 }}>상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.disabled' }}>변경관리 항목이 없습니다</TableCell></TableRow>
                ) : filtered.map((x) => (
                  <TableRow key={x.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(x)}>
                    <TableCell align="center"><Chip size="small" label={x.changeType} color="secondary" variant="outlined" /></TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{x.title}</TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.requestDate || '-'}</TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.plannedDate || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={x.impactAssessment || '-'} color={impactColor(x.impactAssessment)} /></TableCell>
                    <TableCell align="center"><Chip size="small" label={x.status} color={statusColor(x.status)} /></TableCell>
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

export default PermitChangeTab
