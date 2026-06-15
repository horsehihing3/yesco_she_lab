import { useState } from 'react'
import {
  Box, Typography, TextField, Button, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, Paper, Grid, Pagination, TableContainer, Select, MenuItem,
  IconButton, CircularProgress,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import useCodeMap from '../../hooks/useCodeMap'
import { chemicalGhsApi } from '../../api/chemicalApi'
import type { ChemicalGhs } from '../../types/chemical.types'
import StatCard from '../legalCompliance/StatCard'
import DevTestFillButton from '../common/DevTestFillButton'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }
const labelSx = { width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem' }
const valSx = { flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }

const emptyForm = { chemicalName: '', casNumber: '', physicalHazard: '', healthHazard: '', environmentalHazard: '', signalWord: '', ghsVersion: '', status: 'LATEST' }

const GhsTab: React.FC = () => {
  const { codeList: ghsStatusCodes, getLabel: getGhsStatusLabel } = useCodeMap('GHS_STATUS')
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<ChemicalGhs | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [page, setPage] = useState(0)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const applySearch = () => { setKeyword(keywordInput); setPage(0) }

  const { data, isLoading } = useQuery({
    queryKey: ['chemical-ghs', page, keyword],
    queryFn: () => chemicalGhsApi.search({ keyword, page, size: 10 }),
    enabled: viewMode === 'list',
  })

  const items: ChemicalGhs[] = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  const classifiedCount = items.filter((i) => i.status === 'LATEST').length
  const needUpdateCount = items.filter((i) => i.status === 'NEED_UPDATE').length

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['chemical-ghs'] })
  const createMut = useMutation({ mutationFn: (r: Partial<ChemicalGhs>) => chemicalGhsApi.create(r), onSuccess: () => { invalidate(); showSuccess(t('common.saved', '저장되었습니다.')); handleBackToList() }, onError: () => showError(t('common.error', '오류가 발생했습니다.')) })
  const updateMut = useMutation({ mutationFn: ({ id, r }: { id: number; r: Partial<ChemicalGhs> }) => chemicalGhsApi.update(id, r), onSuccess: () => { invalidate(); showSuccess(t('common.saved', '저장되었습니다.')); handleBackToList() }, onError: () => showError(t('common.error', '오류가 발생했습니다.')) })
  const deleteMut = useMutation({ mutationFn: (id: number) => chemicalGhsApi.delete(id), onSuccess: () => { invalidate(); showSuccess(t('common.deleted', '삭제되었습니다.')); handleBackToList() }, onError: () => showError(t('common.error', '오류가 발생했습니다.')) })

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm(emptyForm) }
  const handleRowClick = (item: ChemicalGhs) => { setSelectedItem(item); setViewMode('detail') }
  const handleOpenCreate = () => { setSelectedItem(null); setForm(emptyForm); setViewMode('create') }
  const handleOpenEdit = (item: ChemicalGhs) => {
    setSelectedItem(item)
    setForm({ chemicalName: item.chemicalName || '', casNumber: item.casNumber || '', physicalHazard: item.physicalHazard || '', healthHazard: item.healthHazard || '', environmentalHazard: item.environmentalHazard || '', signalWord: item.signalWord || '', ghsVersion: item.ghsVersion || '', status: item.status || 'LATEST' })
    setViewMode('edit')
  }
  const handleSave = () => { if (selectedItem && viewMode === 'edit') updateMut.mutate({ id: selectedItem.id, r: form }); else createMut.mutate(form) }
  const handleDelete = async (item: ChemicalGhs) => { const ok = await showConfirm(t('common.confirmDelete', '삭제하시겠습니까?')); if (ok) deleteMut.mutate(item.id) }
  const handleReset = () => { setKeywordInput(''); setKeyword(''); setPage(0) }

  // DEV ONLY — 비어있는 항목을 GHS 분류 더미데이터로 채움 (입력값 보존)
  const fillTestData = () => setForm(prev => ({
    ...prev,
    chemicalName: prev.chemicalName || '톨루엔',
    casNumber: prev.casNumber || '108-88-3',
    physicalHazard: prev.physicalHazard || '인화성 액체 2',
    healthHazard: prev.healthHazard || '생식독성 2, 특정표적장기독성(반복노출) 2',
    environmentalHazard: prev.environmentalHazard || '수생환경유해성 만성 3',
    signalWord: prev.signalWord || '위험',
    ghsVersion: prev.ghsVersion || 'Rev.9',
    status: prev.status || (ghsStatusCodes[0]?.code ?? 'LATEST'),
  }))

  // ==================== DETAIL VIEW ====================
  if (viewMode === 'detail' && selectedItem) {
    return (
      <Box>
        {/* PC */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.ghs.chemicalName', '화학물질명')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.chemicalName}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.ghs.casNumber', 'CAS No.')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.casNumber || ''}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.ghs.physicalHazard', '물리적 위험성')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.physicalHazard || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.ghs.healthHazard', '건강 유해성')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.healthHazard || ''}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.ghs.environmentalHazard', '환경 유해성')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.environmentalHazard || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.ghs.signalWord', '신호어')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.signalWord || ''}</Typography></Box>
            </Box>
            <Box sx={{ display: 'flex' }}>
              <Typography sx={labelSx}>{t('chem.ghs.ghsVersion', 'GHS 버전')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.ghsVersion || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.ghs.status', '상태')}</Typography>
              <Box sx={valSx}>
                <Chip label={getGhsStatusLabel(selectedItem.status)} size="small" color={selectedItem.status === 'LATEST' ? 'success' : selectedItem.status === 'NEED_UPDATE' ? 'warning' : 'default'} />
              </Box>
            </Box>
          </Box>
        {/* Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
          {[
            [t('chem.ghs.chemicalName', '화학물질명'), selectedItem.chemicalName],
            [t('chem.ghs.casNumber', 'CAS No.'), selectedItem.casNumber],
            [t('chem.ghs.physicalHazard', '물리적 위험성'), selectedItem.physicalHazard],
            [t('chem.ghs.healthHazard', '건강 유해성'), selectedItem.healthHazard],
            [t('chem.ghs.environmentalHazard', '환경 유해성'), selectedItem.environmentalHazard],
            [t('chem.ghs.signalWord', '신호어'), selectedItem.signalWord],
            [t('chem.ghs.ghsVersion', 'GHS 버전'), selectedItem.ghsVersion],
            [t('chem.ghs.status', '상태'), getGhsStatusLabel(selectedItem.status)],
          ].filter(([, v]) => v).map(([label, value], i) => (
            <Box key={i}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography>
              <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{value}</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list', '목록')}</Button>
          <Button variant="contained" onClick={() => handleOpenEdit(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.edit', '수정')}</Button>
          <Button variant="contained" color="error" onClick={() => handleDelete(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.delete', '삭제')}</Button>
        </Box>
      </Box>
    )
  }

  // ==================== CREATE / EDIT VIEW ====================
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <Box>
        {/* PC Form */}
        <Paper sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.ghs.chemicalName', '화학물질명')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.chemicalName} onChange={e => setForm({ ...form, chemicalName: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.ghs.casNumber', 'CAS No.')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.casNumber} onChange={e => setForm({ ...form, casNumber: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.ghs.physicalHazard', '물리적 위험성')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.physicalHazard} onChange={e => setForm({ ...form, physicalHazard: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.ghs.healthHazard', '건강 유해성')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.healthHazard} onChange={e => setForm({ ...form, healthHazard: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.ghs.environmentalHazard', '환경 유해성')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.environmentalHazard} onChange={e => setForm({ ...form, environmentalHazard: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.ghs.signalWord', '신호어')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.signalWord} onChange={e => setForm({ ...form, signalWord: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.ghs.ghsVersion', 'GHS 버전')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.ghsVersion} onChange={e => setForm({ ...form, ghsVersion: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.ghs.status', '상태')}</Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {ghsStatusCodes.map(c => <MenuItem key={c.code} value={c.code}>{getGhsStatusLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          </Box>
        </Paper>
        {/* Mobile Form */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('chem.ghs.chemicalName', '화학물질명')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.chemicalName} onChange={e => setForm({ ...form, chemicalName: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.ghs.casNumber', 'CAS No.')}</Typography>
            <TextField size="small" fullWidth value={form.casNumber} onChange={e => setForm({ ...form, casNumber: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.ghs.physicalHazard', '물리적 위험성')}</Typography>
            <TextField size="small" fullWidth value={form.physicalHazard} onChange={e => setForm({ ...form, physicalHazard: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.ghs.healthHazard', '건강 유해성')}</Typography>
            <TextField size="small" fullWidth value={form.healthHazard} onChange={e => setForm({ ...form, healthHazard: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.ghs.environmentalHazard', '환경 유해성')}</Typography>
            <TextField size="small" fullWidth value={form.environmentalHazard} onChange={e => setForm({ ...form, environmentalHazard: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.ghs.signalWord', '신호어')}</Typography>
            <TextField size="small" fullWidth value={form.signalWord} onChange={e => setForm({ ...form, signalWord: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.ghs.ghsVersion', 'GHS 버전')}</Typography>
            <TextField size="small" fullWidth value={form.ghsVersion} onChange={e => setForm({ ...form, ghsVersion: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.ghs.status', '상태')}</Typography>
            <Select fullWidth size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              {ghsStatusCodes.map(c => <MenuItem key={c.code} value={c.code}>{getGhsStatusLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
          <Button variant="outlined" onClick={() => viewMode === 'edit' ? setViewMode('detail') : handleBackToList()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel', '취소')}</Button>
          <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save', '저장')}</Button>
        </Box>
      </Box>
    )
  }

  // ==================== LIST VIEW ====================
  if (isLoading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>

  return (
    <Box>
      {/* Metrics Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <StatCard color="blue" value={totalElements} label={t('chem.ghs.totalSubstances', 'GHS 해당 물질')} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard color="green" value={classifiedCount} label={t('chem.ghs.classified', '분류 완료')} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard color="yellow" value={needUpdateCount} label={t('chem.ghs.needReview', '검토 필요')} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard color="blue" value="Rev.9" label={t('chem.ghs.currentVersion', '현행 GHS 버전')} />
        </Grid>
      </Grid>

      {/* Search - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ListSearchBar placeholder={t('chem.ghs.searchPlaceholder')}
            value={keywordInput} onChange={setKeywordInput} onSearch={applySearch}
            sx={{ minWidth: 250 }} />
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>{t('common.new', '신규')}</Button>
      </Box>
      {/* Search - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
        <ListSearchBar fullWidth placeholder={t('chem.ghs.searchPlaceholder')}
          value={keywordInput} onChange={setKeywordInput} onSearch={applySearch} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={handleReset} sx={{ flex: 1 }}>{t('common.reset', '초기화')}</Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ flex: 1 }}>{t('common.new', '신규')}</Button>
        </Box>
      </Box>

      {/* PC Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={headerCellSx}>{t('chem.ghs.chemicalName', '화학물질명')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.ghs.casNumber', 'CAS No.')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.ghs.physicalHazard', '물리적 위험성')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.ghs.healthHazard', '건강 유해성')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.ghs.environmentalHazard', '환경 유해성')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.ghs.signalWord', '신호어')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.ghs.ghsVersion', 'GHS 버전')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.ghs.status', '상태')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">{t('common.noData', '데이터가 없습니다.')}</TableCell>
              </TableRow>
            ) : items.map((row) => (
              <TableRow key={row.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(row)}>
                <TableCell>{row.chemicalName}</TableCell>
                <TableCell>{row.casNumber || ''}</TableCell>
                <TableCell>{row.physicalHazard || ''}</TableCell>
                <TableCell>{row.healthHazard || ''}</TableCell>
                <TableCell>{row.environmentalHazard || ''}</TableCell>
                <TableCell>{row.signalWord || ''}</TableCell>
                <TableCell>{row.ghsVersion || ''}</TableCell>
                <TableCell>
                  <Chip label={getGhsStatusLabel(row.status)} size="small" color={row.status === 'LATEST' ? 'success' : row.status === 'NEED_UPDATE' ? 'warning' : 'default'} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1 }}>
        {items.length > 0 ? items.map((row) => (
          <Paper key={row.id} sx={{ p: 2, cursor: 'pointer' }} onClick={() => handleRowClick(row)}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="subtitle2" fontWeight="bold">{row.chemicalName}</Typography>
              <Chip label={getGhsStatusLabel(row.status)} size="small" color={row.status === 'LATEST' ? 'success' : row.status === 'NEED_UPDATE' ? 'warning' : 'default'} />
            </Box>
            <Typography variant="caption" color="text.secondary">
              CAS: {row.casNumber || ''} | {t('chem.ghs.signalWord', '신호어')}: {row.signalWord || ''} | {row.ghsVersion || ''}
            </Typography>
          </Paper>
        )) : (
          <Typography align="center" color="text.secondary" sx={{ py: 4 }}>{t('common.noData', '데이터가 없습니다.')}</Typography>
        )}
      </Box>

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination count={totalPages} page={page + 1} onChange={(_, v) => setPage(v - 1)} color="primary" />
        </Box>
      )}
    </Box>
  )
}

export default GhsTab
