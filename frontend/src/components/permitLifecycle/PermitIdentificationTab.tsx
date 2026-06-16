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
import { permitIdentApi, permitLifecycleStatsApi } from '../../api/permitLifecycleApi'
import type { PermitIdentification } from '../../types/permitLifecycle.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import DevTestFillButton from '../common/DevTestFillButton'
import { useAlert } from '../../contexts/AlertContext'

const STATUSES = ['식별완료', '검토중', '미식별', '미대상']
const CATEGORIES = ['환경', '안전', '보건', '소방', '화학', '건축']

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const statusColor = (s?: string): 'success' | 'warning' | 'error' | 'default' =>
  s === '식별완료' ? 'success' : s === '검토중' ? 'warning' : s === '미식별' ? 'error' : 'default'

const emptyForm: Partial<PermitIdentification> = { status: '검토중' }

const PermitIdentificationTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm, showSuccess, showError } = useAlert()

  const { data: list = [], isLoading } = useQuery({ queryKey: ['permitIdent'], queryFn: permitIdentApi.list })
  const { data: stats } = useQuery({ queryKey: ['permitLifecycleStats'], queryFn: permitLifecycleStatsApi.get })

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<PermitIdentification | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [form, setForm] = useState<Partial<PermitIdentification>>(emptyForm)

  // DEV ONLY — 비어있는 항목을 인허가 식별 도메인 더미데이터로 채움 (입력값은 보존)
  const fillTestData = () => setForm(prev => ({
    ...prev,
    equipmentName: prev.equipmentName || '제1공장 보일러 #2',
    equipmentType: prev.equipmentType || '대기배출시설',
    location: prev.location || '경기도 안산시 단원구',
    installDate: prev.installDate || todayStr(),
    applicableCategories: prev.applicableCategories || '환경,화학',
    applicablePermits: prev.applicablePermits || '대기배출시설 설치허가,유해화학물질 취급시설',
    status: prev.status || '검토중',
    assessmentDate: prev.assessmentDate || todayStr(),
    notes: prev.notes || '인허가 대상 여부 검토 중 (테스트 데이터)',
  }))

  const applySearch = () => setSearch(searchInput)
  const handleResetSearch = () => { setSearchInput(''); setSearch('') }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['permitIdent'] })
    qc.invalidateQueries({ queryKey: ['permitLifecycleStats'] })
  }

  const createM = useMutation({
    mutationFn: permitIdentApi.create,
    onSuccess: () => { invalidate(); showSuccess(t('permitIdentificationTab.msg1', '등록되었습니다')); handleBackToList() },
    onError: () => showError(t('permitIdentificationTab.msg2', '등록에 실패했습니다')),
  })
  const updateM = useMutation({
    mutationFn: ({ id, e }: { id: number; e: Partial<PermitIdentification> }) => permitIdentApi.update(id, e),
    onSuccess: () => { invalidate(); showSuccess(t('permitIdentificationTab.msg3', '수정되었습니다')); handleBackToList() },
    onError: () => showError(t('permitIdentificationTab.msg4', '수정에 실패했습니다')),
  })
  const deleteM = useMutation({
    mutationFn: permitIdentApi.remove,
    onSuccess: () => { invalidate(); showSuccess(t('permitIdentificationTab.msg5', '삭제되었습니다')); handleBackToList() },
  })

  const filtered = useMemo(() => list.filter((x) => {
    if (filterStatus !== 'all' && x.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      const hay = `${x.equipmentName} ${x.equipmentType || ''} ${x.location || ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  }), [list, filterStatus, search])

  const handleBackToList = () => { setViewMode('list'); setSelected(null); setForm(emptyForm) }
  const handleRowClick = (item: PermitIdentification) => { setSelected(item); setViewMode('detail') }
  const handleAddClick = () => { setSelected(null); setForm({ ...emptyForm, installDate: todayStr(), assessmentDate: todayStr() }); setViewMode('create') }
  const handleEditClick = () => { if (selected) { setForm({ ...selected }); setViewMode('edit') } }
  const handleDeleteClick = async () => {
    if (!selected) return
    if (await showConfirm(t('permitIdentificationTab.msg6', '이 식별 항목을 삭제하시겠습니까?'))) deleteM.mutate(selected.id)
  }
  const handleSave = () => {
    if (!form.equipmentName) { showError(t('permitIdentificationTab.msg7', '설비명을 입력해주세요')); return }
    if (viewMode === 'edit' && selected) updateM.mutate({ id: selected.id, e: form })
    else createM.mutate(form)
  }

  if (viewMode === 'detail' && selected) {
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{t('permitIdentificationTab.section1', '식별 항목 상세')}</Typography>
        <FormTable>
          <FormRow>
            <FormLabel>설비·시설명</FormLabel>
            <FormCell><Typography variant="body2" fontWeight={600}>{selected.equipmentName}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>시설 종류</FormLabel>
            <FormCell borderRight><Typography variant="body2">{selected.equipmentType || ''}</Typography></FormCell>
            <FormLabel>식별 상태</FormLabel>
            <FormCell><Chip size="small" label={selected.status} color={statusColor(selected.status)} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>위치</FormLabel>
            <FormCell borderRight><Typography variant="body2">{selected.location || ''}</Typography></FormCell>
            <FormLabel>설치일</FormLabel>
            <FormCell><Typography variant="body2" fontFamily="monospace">{selected.installDate || ''}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>해당 분야</FormLabel>
            <FormCell><Typography variant="body2">{selected.applicableCategories || ''}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>예상 인허가</FormLabel>
            <FormCell><Typography variant="body2">{selected.applicablePermits || ''}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>연결된 인허가</FormLabel>
            <FormCell><Typography variant="body2">{selected.linkedPermits || ''}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>평가자</FormLabel>
            <FormCell borderRight><Typography variant="body2">{selected.assessor || ''}</Typography></FormCell>
            <FormLabel>평가일</FormLabel>
            <FormCell><Typography variant="body2" fontFamily="monospace">{selected.assessmentDate || ''}</Typography></FormCell>
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
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{viewMode === 'edit' ? '식별 항목 수정' : '식별 항목 등록'}</Typography>
        <FormTable>
          <FormRow>
            <FormLabel required>설비·시설명</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.equipmentName || ''} onChange={(e) => setForm({ ...form, equipmentName: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>시설 종류</FormLabel>
            <FormCell borderRight><TextField fullWidth size="small" value={form.equipmentType || ''} onChange={(e) => setForm({ ...form, equipmentType: e.target.value })} /></FormCell>
            <FormLabel>식별 상태</FormLabel>
            <FormCell>
              <TextField select fullWidth size="small" value={form.status || ''} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>위치</FormLabel>
            <FormCell borderRight><TextField fullWidth size="small" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} /></FormCell>
            <FormLabel>설치일</FormLabel>
            <FormCell><DatePickerField value={form.installDate || null} onChange={(d) => setForm({ ...form, installDate: d || undefined })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>해당 분야</FormLabel>
            <FormCell><TextField fullWidth size="small" placeholder="예: 환경,화학,소방 (쉼표 구분)" value={form.applicableCategories || ''} onChange={(e) => setForm({ ...form, applicableCategories: e.target.value })} helperText={`선택지: ${CATEGORIES.join(' / ')}`} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>예상 인허가</FormLabel>
            <FormCell><TextField fullWidth size="small" placeholder="예: 대기배출시설,안전검사 (쉼표 구분)" value={form.applicablePermits || ''} onChange={(e) => setForm({ ...form, applicablePermits: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>연결된 인허가</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.linkedPermits || ''} onChange={(e) => setForm({ ...form, linkedPermits: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>평가자</FormLabel>
            <FormCell borderRight><TextField fullWidth size="small" value={form.assessor || ''} onChange={(e) => setForm({ ...form, assessor: e.target.value })} /></FormCell>
            <FormLabel>평가일</FormLabel>
            <FormCell><DatePickerField value={form.assessmentDate || null} onChange={(d) => setForm({ ...form, assessmentDate: d || undefined })} /></FormCell>
          </FormRow>
          <FormRow last>
            <FormLabel>비고</FormLabel>
            <FormCell><TextField fullWidth size="small" multiline minRows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></FormCell>
          </FormRow>
        </FormTable>
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2 }}>
          {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>취소</Button>
          <Button variant="contained" onClick={handleSave} disabled={createM.isPending || updateM.isPending} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>저장</Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.identTotal ?? 0}  label={t('permitIdentificationTab.label1', '전체 식별')} sub="건" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={stats?.identDone ?? 0}   label={t('permitIdentificationTab.label2', '식별완료')} sub="인허가 매핑 완료" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={stats?.identReview ?? 0} label={t('permitIdentificationTab.label3', '검토 중')} sub="대상 여부 판정 중" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={stats?.identMiss ?? 0}   label={t('permitIdentificationTab.label4', '미식별')} sub="조치 필요" /></Grid>
      </Grid>

      {/* PC toolbar */}
      <Stack direction="row" spacing={1.5} sx={{ display: { xs: 'none', md: 'flex' }, mb: 2, justifyContent: 'flex-start' }} alignItems="center">
        <ListSearchBar placeholder="설비명·위치 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch}
          sx={{ width: 240 }} />
        <TextField select size="small" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} sx={{ minWidth: 130 }}>
          <MenuItem value="all">전체</MenuItem>
          {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick} sx={{ whiteSpace: 'nowrap' }}>New</Button>
      </Stack>

      {/* Mobile toolbar */}
      <Stack direction="column" spacing={1} sx={{ display: { xs: 'flex', md: 'none' }, mb: 2 }}>
        <ListSearchBar fullWidth placeholder="설비명·위치 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
        <TextField select size="small" fullWidth value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <MenuItem value="all">전체</MenuItem>
          {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={handleResetSearch} sx={{ flex: 1 }}>초기화</Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick} sx={{ flex: 1 }}>New</Button>
        </Box>
      </Stack>

      <Paper variant="outlined" sx={{ mb: 2 }}>
        {isLoading ? <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box> : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>설비·시설명</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>시설 종류</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>위치</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>설치일</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 90 }}>상태</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 120 }}>평가자</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.disabled' }}>식별 항목이 없습니다</TableCell></TableRow>
                ) : filtered.map((x) => (
                  <TableRow key={x.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(x)}>
                    <TableCell sx={{ fontWeight: 600 }}>{x.equipmentName}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{x.equipmentType || '-'}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{x.location || '-'}</TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.installDate || '-'}</TableCell>
                    <TableCell align="center"><Chip size="small" label={x.status} color={statusColor(x.status)} /></TableCell>
                    <TableCell align="center" sx={{ fontSize: '0.85rem' }}>{x.assessor || '-'}</TableCell>
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

export default PermitIdentificationTab
