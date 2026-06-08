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
import { permitDocumentApi, permitLifecycleStatsApi } from '../../api/permitLifecycleApi'
import type { PermitDocument } from '../../types/permitLifecycle.types'
import StatCard from '../legalCompliance/StatCard'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const DOC_TYPES = ['허가증', '신고증', '검사결과서', '측정결과서', '보고서', '취급일지', '교육일지', '기타']
const CATEGORIES = ['환경', '안전', '보건', '소방', '화학', '건축']

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const disposalDate = (d: PermitDocument): string | null => {
  if (!d.issueDate || !d.retentionYears) return null
  if (d.retentionYears >= 999) return null
  const dt = new Date(d.issueDate)
  dt.setFullYear(dt.getFullYear() + d.retentionYears)
  return dt.toISOString().slice(0, 10)
}

const daysUntil = (d?: string | null) => {
  if (!d) return Infinity
  return Math.ceil((new Date(d).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000)
}

const retentionBadge = (d: PermitDocument): { label: string; color: 'success' | 'info' | 'warning' | 'error' } => {
  if (d.retentionYears >= 999) return { label: '영구보존', color: 'info' }
  const days = daysUntil(disposalDate(d))
  if (days < 0) return { label: '폐기대상', color: 'error' }
  if (days <= 365) return { label: '폐기임박', color: 'warning' }
  return { label: '보존중', color: 'success' }
}

const emptyForm: Partial<PermitDocument> = { docType: '허가증', retentionYears: 5 }

const PermitDocumentTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showConfirm, showSuccess, showError } = useAlert()

  const { data: list = [], isLoading } = useQuery({ queryKey: ['permitDocument'], queryFn: permitDocumentApi.list })
  const { data: stats } = useQuery({ queryKey: ['permitLifecycleStats'], queryFn: permitLifecycleStatsApi.get })

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<PermitDocument | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [form, setForm] = useState<Partial<PermitDocument>>(emptyForm)

  const applySearch = () => setSearch(searchInput)
  const handleResetSearch = () => { setSearchInput(''); setSearch('') }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['permitDocument'] })
    qc.invalidateQueries({ queryKey: ['permitLifecycleStats'] })
  }

  const createM = useMutation({ mutationFn: permitDocumentApi.create, onSuccess: () => { invalidate(); showSuccess(t('permitDocumentTab.msg1', '등록되었습니다')); handleBackToList() }, onError: () => showError(t('permitDocumentTab.msg2', '등록 실패')) })
  const updateM = useMutation({ mutationFn: ({ id, e }: { id: number; e: Partial<PermitDocument> }) => permitDocumentApi.update(id, e), onSuccess: () => { invalidate(); showSuccess(t('permitDocumentTab.msg3', '수정되었습니다')); handleBackToList() }, onError: () => showError(t('permitDocumentTab.msg4', '수정 실패')) })
  const deleteM = useMutation({ mutationFn: permitDocumentApi.remove, onSuccess: () => { invalidate(); showSuccess(t('permitDocumentTab.msg5', '삭제되었습니다')); handleBackToList() } })

  const filtered = useMemo(() => list.filter((x) => {
    if (filterType !== 'all' && x.docType !== filterType) return false
    if (search && !`${x.docName} ${x.relatedPermit || ''}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [list, filterType, search])

  const computed = useMemo(() => {
    let active = 0, near = 0, disp = 0
    list.forEach((d) => {
      if (d.retentionYears >= 999) { active++; return }
      const days = daysUntil(disposalDate(d))
      if (days < 0) disp++
      else if (days <= 365) { active++; near++ }
      else active++
    })
    return { active, near, disp }
  }, [list])

  const handleBackToList = () => { setViewMode('list'); setSelected(null); setForm(emptyForm) }
  const handleRowClick = (item: PermitDocument) => { setSelected(item); setViewMode('detail') }
  const handleAddClick = () => { setSelected(null); setForm({ ...emptyForm, issueDate: todayStr() }); setViewMode('create') }
  const handleEditClick = () => { if (selected) { setForm({ ...selected }); setViewMode('edit') } }
  const handleDeleteClick = async () => {
    if (!selected) return
    if (await showConfirm(t('permitDocumentTab.msg6', '이 문서를 삭제하시겠습니까?'))) deleteM.mutate(selected.id)
  }
  const handleSave = () => {
    if (!form.docName || !form.docType || !form.issueDate) { showError(t('permitDocumentTab.msg7', '문서명·종류·발급일 필수')); return }
    if (viewMode === 'edit' && selected) updateM.mutate({ id: selected.id, e: form })
    else createM.mutate(form)
  }

  if (viewMode === 'detail' && selected) {
    const rb = retentionBadge(selected)
    const dd = disposalDate(selected)
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{t('permitDocumentTab.section1', '문서 상세')}</Typography>
        <FormTable>
          <FormRow>
            <FormLabel>문서명</FormLabel>
            <FormCell><Typography variant="body2" fontWeight={600}>{selected.docName}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>문서 종류</FormLabel>
            <FormCell borderRight><Chip size="small" label={selected.docType} color="primary" variant="outlined" /></FormCell>
            <FormLabel>분야</FormLabel>
            <FormCell><Chip size="small" label={selected.category || '-'} variant="outlined" /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>관련 인허가 번호</FormLabel>
            <FormCell><Typography variant="body2" fontFamily="monospace">{selected.relatedPermit || ''}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>발급일</FormLabel>
            <FormCell borderRight><Typography variant="body2" fontFamily="monospace">{selected.issueDate}</Typography></FormCell>
            <FormLabel>보존기간 (년)</FormLabel>
            <FormCell><Typography variant="body2">{selected.retentionYears >= 999 ? '영구' : `${selected.retentionYears}년`}</Typography></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>폐기 예정일</FormLabel>
            <FormCell borderRight><Typography variant="body2" fontFamily="monospace">{dd || ''}</Typography></FormCell>
            <FormLabel>상태</FormLabel>
            <FormCell><Chip size="small" label={rb.label} color={rb.color} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>파일 경로</FormLabel>
            <FormCell><Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{selected.fileLocation || ''}</Typography></FormCell>
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
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{viewMode === 'edit' ? '문서 수정' : '문서 등록'}</Typography>
        <FormTable>
          <FormRow>
            <FormLabel required>문서명</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.docName || ''} onChange={(e) => setForm({ ...form, docName: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel required>문서 종류</FormLabel>
            <FormCell borderRight>
              <TextField select fullWidth size="small" value={form.docType || ''} onChange={(e) => setForm({ ...form, docType: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {DOC_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </FormCell>
            <FormLabel>분야</FormLabel>
            <FormCell>
              <TextField select fullWidth size="small" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <MenuItem value="">선택하세요</MenuItem>
                {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>관련 인허가 번호</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.relatedPermit || ''} onChange={(e) => setForm({ ...form, relatedPermit: e.target.value })} /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel required>발급일</FormLabel>
            <FormCell borderRight><DatePickerField value={form.issueDate || null} onChange={(d) => setForm({ ...form, issueDate: d || undefined })} /></FormCell>
            <FormLabel>보존기간 (년)</FormLabel>
            <FormCell><NumberField fullWidth value={form.retentionYears ?? null} onChange={(v) => setForm({ ...form, retentionYears: v ?? 5 })} min={0} max={999} thousandSeparator={false} placeholder="영구 보존은 999" /></FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>파일 경로</FormLabel>
            <FormCell><TextField fullWidth size="small" value={form.fileLocation || ''} onChange={(e) => setForm({ ...form, fileLocation: e.target.value })} placeholder="예: /문서함/환경/대기/2024-대기-00123.pdf" /></FormCell>
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
        <Grid item xs={6} sm={3}><StatCard color="blue"   value={stats?.dcTotal ?? 0} label={t('permitDocumentTab.label1', '전체 문서')} sub="건" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="green"  value={computed.active} label={t('permitDocumentTab.label2', '보존 중')} sub="유효 보존" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="yellow" value={computed.near}   label={t('permitDocumentTab.label3', '폐기 임박')} sub="1년 이내" /></Grid>
        <Grid item xs={6} sm={3}><StatCard color="red"    value={computed.disp}   label={t('permitDocumentTab.label4', '폐기 대상')} sub="보존기간 종료" /></Grid>
      </Grid>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2, justifyContent: 'flex-start' }} alignItems="center">
        <ListSearchBar placeholder="문서명·관련 인허가 검색" value={searchInput} onChange={setSearchInput} onSearch={applySearch}
          sx={{ width: { xs: '100%', sm: 240 } }} />
        <TextField select size="small" value={filterType} onChange={(e) => setFilterType(e.target.value)} sx={{ minWidth: 130 }}>
          <MenuItem value="all">전체</MenuItem>
          {DOC_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
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
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>분야</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>종류</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>문서명</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 150 }}>관련 인허가</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>발급일</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 80 }}>보존</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 110 }}>폐기예정</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.disabled' }}>문서가 없습니다</TableCell></TableRow>
                ) : filtered.map((x) => {
                  const rb = retentionBadge(x)
                  const dd = disposalDate(x)
                  return (
                    <TableRow key={x.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(x)}>
                      <TableCell align="center"><Chip size="small" label={x.category || '-'} variant="outlined" /></TableCell>
                      <TableCell align="center"><Chip size="small" label={x.docType} color="primary" variant="outlined" /></TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{x.docName}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.relatedPermit || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{x.issueDate}</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.85rem' }}>{x.retentionYears >= 999 ? '영구' : `${x.retentionYears}년`}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{dd || '-'}</TableCell>
                      <TableCell align="center"><Chip size="small" label={rb.label} color={rb.color} /></TableCell>
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

export default PermitDocumentTab
