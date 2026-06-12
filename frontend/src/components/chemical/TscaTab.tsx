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
import { chemicalTscaApi } from '../../api/chemicalApi'
import type { ChemicalTsca } from '../../types/chemical.types'
import StatCard from '../legalCompliance/StatCard'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }
const labelSx = { width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem' }
const valSx = { flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'divider' }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'divider' }

const emptyForm = { chemicalName: '', casNumber: '', inventoryStatus: 'LISTED', regulationSection: '', reportingDuty: '', exportToUs: '', pmnRequired: 'N', status: 'COMPLIANT' }

const TscaTab: React.FC = () => {
  const { codeList: tscaInvCodes, getLabel: getTscaInvLabel } = useCodeMap('TSCA_INVENTORY')
  const { codeList: tscaPmnCodes, getLabel: getTscaPmnLabel } = useCodeMap('TSCA_PMN')
  const { codeList: tscaStatusCodes, getLabel: getTscaStatusLabel } = useCodeMap('TSCA_STATUS')
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<ChemicalTsca | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [page, setPage] = useState(0)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const applySearch = () => { setKeyword(keywordInput); setPage(0) }

  const { data, isLoading } = useQuery({
    queryKey: ['chemical-tsca', page, keyword],
    queryFn: () => chemicalTscaApi.search({ keyword, page, size: 10 }),
    enabled: viewMode === 'list',
  })

  const items: ChemicalTsca[] = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  const listedCount = items.filter((i) => i.inventoryStatus === 'LISTED').length
  const unlistedCount = items.filter((i) => i.inventoryStatus === 'UNLISTED').length
  const pmnCount = items.filter((i) => i.pmnRequired === 'Y').length

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['chemical-tsca'] })
  const createMut = useMutation({ mutationFn: (r: Partial<ChemicalTsca>) => chemicalTscaApi.create(r), onSuccess: () => { invalidate(); showSuccess(t('common.saved', '저장되었습니다.')); handleBackToList() }, onError: () => showError(t('common.error', '오류가 발생했습니다.')) })
  const updateMut = useMutation({ mutationFn: ({ id, r }: { id: number; r: Partial<ChemicalTsca> }) => chemicalTscaApi.update(id, r), onSuccess: () => { invalidate(); showSuccess(t('common.saved', '저장되었습니다.')); handleBackToList() }, onError: () => showError(t('common.error', '오류가 발생했습니다.')) })
  const deleteMut = useMutation({ mutationFn: (id: number) => chemicalTscaApi.delete(id), onSuccess: () => { invalidate(); showSuccess(t('common.deleted', '삭제되었습니다.')); handleBackToList() }, onError: () => showError(t('common.error', '오류가 발생했습니다.')) })

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm(emptyForm) }
  const handleRowClick = (item: ChemicalTsca) => { setSelectedItem(item); setViewMode('detail') }
  const handleOpenCreate = () => { setSelectedItem(null); setForm(emptyForm); setViewMode('create') }
  const handleOpenEdit = (item: ChemicalTsca) => {
    setSelectedItem(item)
    setForm({ chemicalName: item.chemicalName || '', casNumber: item.casNumber || '', inventoryStatus: item.inventoryStatus || 'LISTED', regulationSection: item.regulationSection || '', reportingDuty: item.reportingDuty || '', exportToUs: item.exportToUs || '', pmnRequired: item.pmnRequired || 'N', status: item.status || 'COMPLIANT' })
    setViewMode('edit')
  }
  const handleSave = () => { if (selectedItem && viewMode === 'edit') updateMut.mutate({ id: selectedItem.id, r: form }); else createMut.mutate(form) }
  const handleDelete = async (item: ChemicalTsca) => { const ok = await showConfirm(t('common.confirmDelete', '삭제하시겠습니까?')); if (ok) deleteMut.mutate(item.id) }
  const handleReset = () => { setKeywordInput(''); setKeyword(''); setPage(0) }

  // ==================== DETAIL VIEW ====================
  if (viewMode === 'detail' && selectedItem) {
    return (
      <Box>
        {/* PC */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.tsca.chemicalName', '화학물질명')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.chemicalName}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.tsca.casNumber', 'CAS No.')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.casNumber || ''}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.tsca.inventoryStatus', 'TSCA Inventory')}</Typography>
              <Box sx={valBorderSx}>
                <Chip label={getTscaInvLabel(selectedItem.inventoryStatus || '')} size="small" color={selectedItem.inventoryStatus === 'LISTED' ? 'success' : 'error'} />
              </Box>
              <Typography sx={labelSx}>{t('chem.tsca.regulationSection', '규제 섹션')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.regulationSection || ''}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.tsca.reportingDuty', '신고 의무')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.reportingDuty || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.tsca.exportToUs', '수출 여부')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.exportToUs || ''}</Typography></Box>
            </Box>
            <Box sx={{ display: 'flex' }}>
              <Typography sx={labelSx}>{t('chem.tsca.pmnRequired', 'PMN 여부')}</Typography>
              <Box sx={valBorderSx}>
                <Chip label={getTscaPmnLabel(selectedItem.pmnRequired || '')} size="small" color={selectedItem.pmnRequired === 'Y' ? 'error' : 'default'} />
              </Box>
              <Typography sx={labelSx}>{t('chem.tsca.status', '상태')}</Typography>
              <Box sx={valSx}>
                <Chip label={getTscaStatusLabel(selectedItem.status)} size="small" color={selectedItem.status === 'COMPLIANT' ? 'success' : selectedItem.status === 'UNDER_REVIEW' ? 'warning' : selectedItem.status === 'ACTION_NEEDED' ? 'error' : 'default'} />
              </Box>
            </Box>
          </Box>
        {/* Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
          {[
            [t('chem.tsca.chemicalName', '화학물질명'), selectedItem.chemicalName],
            [t('chem.tsca.casNumber', 'CAS No.'), selectedItem.casNumber],
            [t('chem.tsca.inventoryStatus', 'TSCA Inventory'), getTscaInvLabel(selectedItem.inventoryStatus || '')],
            [t('chem.tsca.regulationSection', '규제 섹션'), selectedItem.regulationSection],
            [t('chem.tsca.reportingDuty', '신고 의무'), selectedItem.reportingDuty],
            [t('chem.tsca.exportToUs', '수출 여부'), selectedItem.exportToUs],
            [t('chem.tsca.pmnRequired', 'PMN 여부'), getTscaPmnLabel(selectedItem.pmnRequired || '')],
            [t('chem.tsca.status', '상태'), getTscaStatusLabel(selectedItem.status)],
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
            <Typography sx={labelSx}>{t('chem.tsca.chemicalName', '화학물질명')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.chemicalName} onChange={e => setForm({ ...form, chemicalName: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.tsca.casNumber', 'CAS No.')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.casNumber} onChange={e => setForm({ ...form, casNumber: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.tsca.inventoryStatus', 'TSCA Inventory')}</Typography>
            <Box sx={valBorderSx}>
              <Select fullWidth size="small" value={form.inventoryStatus} onChange={e => setForm({ ...form, inventoryStatus: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {tscaInvCodes.map(c => <MenuItem key={c.code} value={c.code}>{getTscaInvLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
            <Typography sx={labelSx}>{t('chem.tsca.regulationSection', '규제 섹션')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.regulationSection} onChange={e => setForm({ ...form, regulationSection: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.tsca.reportingDuty', '신고 의무')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.reportingDuty} onChange={e => setForm({ ...form, reportingDuty: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.tsca.exportToUs', '수출 여부')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.exportToUs} onChange={e => setForm({ ...form, exportToUs: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.tsca.pmnRequired', 'PMN 여부')}</Typography>
            <Box sx={valBorderSx}>
              <Select fullWidth size="small" value={form.pmnRequired} onChange={e => setForm({ ...form, pmnRequired: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {tscaPmnCodes.map(c => <MenuItem key={c.code} value={c.code}>{getTscaPmnLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
            <Typography sx={labelSx}>{t('chem.tsca.status', '상태')}</Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {tscaStatusCodes.map(c => <MenuItem key={c.code} value={c.code}>{getTscaStatusLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          </Box>
        </Paper>
        {/* Mobile Form */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('chem.tsca.chemicalName', '화학물질명')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.chemicalName} onChange={e => setForm({ ...form, chemicalName: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.tsca.casNumber', 'CAS No.')}</Typography>
            <TextField size="small" fullWidth value={form.casNumber} onChange={e => setForm({ ...form, casNumber: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.tsca.inventoryStatus', 'TSCA Inventory')}</Typography>
            <Select fullWidth size="small" value={form.inventoryStatus} onChange={e => setForm({ ...form, inventoryStatus: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              {tscaInvCodes.map(c => <MenuItem key={c.code} value={c.code}>{getTscaInvLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.tsca.regulationSection', '규제 섹션')}</Typography>
            <TextField size="small" fullWidth value={form.regulationSection} onChange={e => setForm({ ...form, regulationSection: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.tsca.reportingDuty', '신고 의무')}</Typography>
            <TextField size="small" fullWidth value={form.reportingDuty} onChange={e => setForm({ ...form, reportingDuty: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.tsca.exportToUs', '수출 여부')}</Typography>
            <TextField size="small" fullWidth value={form.exportToUs} onChange={e => setForm({ ...form, exportToUs: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.tsca.pmnRequired', 'PMN 여부')}</Typography>
            <Select fullWidth size="small" value={form.pmnRequired} onChange={e => setForm({ ...form, pmnRequired: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              {tscaPmnCodes.map(c => <MenuItem key={c.code} value={c.code}>{getTscaPmnLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.tsca.status', '상태')}</Typography>
            <Select fullWidth size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              {tscaStatusCodes.map(c => <MenuItem key={c.code} value={c.code}>{getTscaStatusLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
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
          <StatCard color="blue" value={totalElements} label={t('chem.tsca.totalSubject', 'TSCA 해당 물질')} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard color="green" value={listedCount} label={t('chem.tsca.listed', 'Inventory 등재')} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard color="red" value={unlistedCount} label={t('chem.tsca.unlisted', '미등재(신고필요)')} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard color="yellow" value={pmnCount} label={t('chem.tsca.pmnRequired', '우선심사물질')} />
        </Grid>
      </Grid>

      {/* Search - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ListSearchBar placeholder={t('chem.tsca.searchPlaceholder')}
            value={keywordInput} onChange={setKeywordInput} onSearch={applySearch}
            sx={{ minWidth: 250 }} />
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>{t('common.new', '신규')}</Button>
      </Box>
      {/* Search - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
        <ListSearchBar fullWidth placeholder={t('chem.tsca.searchPlaceholder')}
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
              <TableCell sx={headerCellSx}>{t('chem.tsca.chemicalName', '화학물질명')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.tsca.casNumber', 'CAS No.')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.tsca.inventoryStatus', 'TSCA Inventory')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.tsca.regulationSection', '규제 섹션')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.tsca.reportingDuty', '신고 의무')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.tsca.exportToUs', '수출 여부')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.tsca.pmnRequired', 'PMN 여부')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.tsca.status', '상태')}</TableCell>
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
                <TableCell>
                  <Chip label={getTscaInvLabel(row.inventoryStatus || '')} size="small" color={row.inventoryStatus === 'LISTED' ? 'success' : 'error'} />
                </TableCell>
                <TableCell>{row.regulationSection || ''}</TableCell>
                <TableCell>{row.reportingDuty || ''}</TableCell>
                <TableCell>{row.exportToUs || ''}</TableCell>
                <TableCell>
                  <Chip label={getTscaPmnLabel(row.pmnRequired || '')} size="small" color={row.pmnRequired === 'Y' ? 'error' : 'default'} />
                </TableCell>
                <TableCell>
                  <Chip label={getTscaStatusLabel(row.status)} size="small" color={row.status === 'COMPLIANT' ? 'success' : row.status === 'UNDER_REVIEW' ? 'warning' : row.status === 'ACTION_NEEDED' ? 'error' : 'default'} />
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
              <Chip label={getTscaStatusLabel(row.status)} size="small" color={row.status === 'COMPLIANT' ? 'success' : row.status === 'UNDER_REVIEW' ? 'warning' : row.status === 'ACTION_NEEDED' ? 'error' : 'default'} />
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 0.5 }}>
              <Chip label={getTscaInvLabel(row.inventoryStatus || '')} size="small" color={row.inventoryStatus === 'LISTED' ? 'success' : 'error'} sx={{ height: 18, '& .MuiChip-label': { fontSize: '0.65rem' } }} />
              <Typography variant="caption" color="text.secondary">
                CAS: {row.casNumber || ''} | PMN: {row.pmnRequired || ''}
              </Typography>
            </Box>
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

export default TscaTab
