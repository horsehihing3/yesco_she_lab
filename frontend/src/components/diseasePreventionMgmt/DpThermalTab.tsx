import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Grid, Paper, Stack, TextField, MenuItem, Button, Chip, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  IconButton, CircularProgress,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import { dpThermalApi, dpMgmtStatsApi } from '../../api/diseasePreventionMgmtApi'
import type { DpThermal } from '../../types/diseasePreventionMgmt.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'

const TYPES = ['온열', '한랭', '예방조치']
const SEVERITIES = ['경증', '중등도', '중증']

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const typeColor = (t: string): 'error' | 'info' | 'success' | 'default' =>
  t === '온열' ? 'error' : t === '한랭' ? 'info' : t === '예방조치' ? 'success' : 'default'
const sevColor = (s?: string): 'error' | 'warning' | 'success' | 'default' =>
  s === '중증' ? 'error' : s === '중등도' ? 'warning' : s === '경증' ? 'success' : 'default'

const emptyForm: Partial<DpThermal> = { thermalType: '온열', severity: '경증' }

const MENU = '보건 관리 › 질병예방 관리 › 온열한랭'

const DpThermalTab: React.FC = () => {
  const qc = useQueryClient()
  const { showConfirm, showSuccess, showError } = useAlert()
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const isAdmin = user?.role === 'SYSTEM_ADMIN'
  const myRoles: string[] = ['guest', ...(isAdmin ? ['superAdmin'] : []), ...(user?.role ? [user.role] : [])]

  const { data: list = [], isLoading } = useQuery({ queryKey: ['dpThermal'], queryFn: dpThermalApi.list })
  const { data: stats } = useQuery({ queryKey: ['dpMgmtStats'], queryFn: dpMgmtStatsApi.get })

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<DpThermal | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [form, setForm] = useState<Partial<DpThermal>>(emptyForm)

  const applySearch = () => setSearch(searchInput)
  const handleResetSearch = () => { setSearchInput(''); setSearch('') }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['dpThermal'] })
    qc.invalidateQueries({ queryKey: ['dpMgmtStats'] })
  }

  const createM = useMutation({ mutationFn: dpThermalApi.create, onSuccess: () => { invalidate(); showSuccess('등록되었습니다'); handleBackToList() }, onError: () => showError('등록 실패') })
  const updateM = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<DpThermal> }) => dpThermalApi.update(id, e), onSuccess: () => { invalidate(); showSuccess('수정되었습니다'); handleBackToList() }, onError: () => showError('수정 실패') })
  const deleteM = useMutation({ mutationFn: dpThermalApi.remove, onSuccess: () => { invalidate(); showSuccess('삭제되었습니다'); handleBackToList() } })

  const filtered = useMemo(() => list.filter((x) => {
    if (filterType !== 'all' && x.thermalType !== filterType) return false
    if (search && !`${x.location || ''} ${x.symptoms || ''}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [list, filterType, search])

  const handleBackToList = () => { setViewMode('list'); setSelected(null); setForm(emptyForm) }
  const handleRowClick = (item: DpThermal) => { setSelected(item); setViewMode('detail') }
  const handleAddClick = () => { setSelected(null); setForm({ ...emptyForm, occurDate: todayStr() }); setViewMode('create') }
  const handleEditClick = () => { if (selected) { setForm({ ...selected }); setViewMode('edit') } }
  const handleDeleteClick = async () => {
    if (!selected) return
    if (await showConfirm('이 기록을 삭제하시겠습니까?')) deleteM.mutate(selected.id)
  }
  const handleSave = () => {
    if (!form.thermalType || !form.occurDate) { showError('유형·발생일 필수'); return }
    if (viewMode === 'edit' && selected) updateM.mutate({ id: selected.id, e: form })
    else createM.mutate(form)
  }

  if (viewMode === 'detail' && selected) {
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>온열·한랭 기록 상세</Typography>
        <FormTable>
          <FormRow><FormLabel>유형</FormLabel><FormCell borderRight><Chip size="small" label={selected.thermalType} color={typeColor(selected.thermalType)} /></FormCell><FormLabel>발생일</FormLabel><FormCell><Typography variant="body2" fontFamily="monospace">{selected.occurDate}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>발생 위치</FormLabel><FormCell><Typography variant="body2">{selected.location || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>근로자명</FormLabel><FormCell borderRight><Typography variant="body2">{selected.workerName || ''}</Typography></FormCell><FormLabel>부서</FormLabel><FormCell><Typography variant="body2">{selected.department || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>기상 상태</FormLabel><FormCell borderRight><Typography variant="body2">{selected.weatherCondition || ''}</Typography></FormCell><FormLabel>체감온도 (℃)</FormLabel><FormCell><Typography variant="body2" fontFamily="monospace">{selected.perceivedTemp ?? ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>증상</FormLabel><FormCell><Typography variant="body2">{selected.symptoms || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>심각도</FormLabel><FormCell borderRight><Chip size="small" label={selected.severity || '-'} color={sevColor(selected.severity)} variant="outlined" /></FormCell><FormLabel>처치</FormLabel><FormCell><Typography variant="body2">{selected.treatment || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>경과</FormLabel><FormCell><Typography variant="body2">{selected.outcome || ''}</Typography></FormCell></FormRow>
          <FormRow><FormLabel>예방·조치</FormLabel><FormCell><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selected.preventionAction || ''}</Typography></FormCell></FormRow>
          <FormRow last><FormLabel>비고</FormLabel><FormCell><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selected.notes || ''}</Typography></FormCell></FormRow>
        </FormTable>
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>목록</Button>
          {canSee(MENU, 'DETAIL', '수정', myRoles) && (
            <Button variant="contained" onClick={handleEditClick} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>수정</Button>
          )}
          {canSee(MENU, 'DETAIL', '삭제', myRoles) && (
            <Button variant="contained" color="error" onClick={handleDeleteClick} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>삭제</Button>
          )}
        </Box>
      </Box>
    )
  }

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{viewMode === 'edit' ? '온열·한랭 기록 수정' : '온열·한랭 기록 등록'}</Typography>
        <FormTable>
          <FormRow>
            <FormLabel required>유형</FormLabel>
            <FormCell borderRight>
              <TextField select fullWidth size="small" value={form.thermalType || ''} onChange={(e) => setForm({ ...form, thermalType: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </FormCell>
            <FormLabel required>발생일</FormLabel>
            <FormCell><DatePickerField value={form.occurDate || null} onChange={(d) => setForm({ ...form, occurDate: d || undefined })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>발생 위치</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>근로자명</FormLabel>
            <FormCell borderRight><TextField fullWidth size="small" value={form.workerName || ''} onChange={(e) => setForm({ ...form, workerName: e.target.value })} placeholder="예방조치는 '-' 입력 가능" /></FormCell>
            <FormLabel>부서</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>기상 상태</FormLabel>
            <FormCell borderRight><TextField fullWidth size="small" value={form.weatherCondition || ''} onChange={(e) => setForm({ ...form, weatherCondition: e.target.value })} placeholder="예: 폭염주의보" /></FormCell>
            <FormLabel>체감온도 (℃)</FormLabel>
            <FormCell><NumberField fullWidth value={form.perceivedTemp ?? null} onChange={(v) => setForm({ ...form, perceivedTemp: v ?? undefined })} thousandSeparator={false} step={0.1} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>증상</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.symptoms || ''} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>심각도</FormLabel>
            <FormCell borderRight>
              <TextField select fullWidth size="small" value={form.severity || ''} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {SEVERITIES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </FormCell>
            <FormLabel>처치</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.treatment || ''} onChange={(e) => setForm({ ...form, treatment: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>경과</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.outcome || ''} onChange={(e) => setForm({ ...form, outcome: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>예방·조치</FormLabel>
            <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.preventionAction || ''} onChange={(e) => setForm({ ...form, preventionAction: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow last>
            <FormLabel>비고</FormLabel>
            <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></FormCell>
          </FormRow>
        </FormTable>
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>취소</Button>
          {canSee(MENU, 'DETAIL', '저장', myRoles) && (
            <Button variant="contained" onClick={handleSave} disabled={createM.isPending || updateM.isPending} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>저장</Button>
          )}
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.thermalTotal ?? 0}  label="관리 대상" sub="옥외·고온·한랭" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.thermalCases ?? 0}  label="발생 사례" sub="금년 누적" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.thermalSevere ?? 0} label="중증·중등도" sub="병원 이송" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.thermalAction ?? 0} label="예방조치" sub="작업중지 발령" /></Grid>
      </Grid>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2, justifyContent: 'flex-start' }} alignItems="center">
        <ListSearchBar placeholder="발생 위치·증상 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch}
          sx={{ width: { xs: '100%', sm: 240 } }} />
        <TextField select size="small" value={filterType} onChange={(e) => setFilterType(e.target.value)} sx={{ minWidth: 120 }}>
          <MenuItem value="all">전체</MenuItem>
          {TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
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
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 90 }}>유형</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>발생일</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>위치</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>근로자·부서</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>체감온도</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>증상</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>심각도</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.disabled' }}>기록이 없습니다</TableCell></TableRow>
                ) : filtered.map((x) => (
                  <TableRow key={x.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(x)}>
                    <TableCell align="center"><Chip size="small" label={x.thermalType} color={typeColor(x.thermalType)} /></TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.occurDate}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{x.location || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{x.workerName || '-'}<Box sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>{x.department || ''}</Box></TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{x.perceivedTemp ?? '-'}℃</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{x.symptoms || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={x.severity || '-'} color={sevColor(x.severity)} variant="outlined" /></TableCell>
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

export default DpThermalTab
