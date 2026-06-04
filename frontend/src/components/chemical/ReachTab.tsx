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
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import { chemicalReachApi } from '../../api/chemicalApi'
import type { ChemicalReach } from '../../types/chemical.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }
const metricCardSx = { p: 2, textAlign: 'center', borderRadius: 1, border: 1, borderColor: 'grey.300' }
const labelSx = { width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'center', fontSize: '0.875rem' }
const valSx = { flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'grey.300' }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'grey.300' }

const emptyForm = { chemicalName: '', casNumber: '', registrationNo: '', svhc: 'N', authorizationRequired: 'N', restrictionNote: '', registrationDate: '', status: 'REGISTERED' }

const ReachTab: React.FC = () => {
  const { codeList: reachYnCodes, getLabel: getReachYnLabel } = useCodeMap('REACH_YN')
  const { codeList: reachStatusCodes, getLabel: getReachStatusLabel } = useCodeMap('REACH_STATUS')
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<ChemicalReach | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [page, setPage] = useState(0)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const applySearch = () => { setKeyword(keywordInput); setPage(0) }

  const { data, isLoading } = useQuery({
    queryKey: ['chemical-reach', page, keyword],
    queryFn: () => chemicalReachApi.search({ keyword, page, size: 10 }),
    enabled: viewMode === 'list',
  })

  const items: ChemicalReach[] = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  const svhcCount = items.filter((i) => i.svhc === 'Y').length
  const registeredCount = items.filter((i) => i.status === 'REGISTERED').length
  const authNeededCount = items.filter((i) => i.authorizationRequired === 'Y').length

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['chemical-reach'] })
  const createMut = useMutation({ mutationFn: (r: Partial<ChemicalReach>) => chemicalReachApi.create(r), onSuccess: () => { invalidate(); showSuccess(t('common.saved', '저장되었습니다.')); handleBackToList() }, onError: () => showError(t('common.error', '오류가 발생했습니다.')) })
  const updateMut = useMutation({ mutationFn: ({ id, r }: { id: number; r: Partial<ChemicalReach> }) => chemicalReachApi.update(id, r), onSuccess: () => { invalidate(); showSuccess(t('common.saved', '저장되었습니다.')); handleBackToList() }, onError: () => showError(t('common.error', '오류가 발생했습니다.')) })
  const deleteMut = useMutation({ mutationFn: (id: number) => chemicalReachApi.delete(id), onSuccess: () => { invalidate(); showSuccess(t('common.deleted', '삭제되었습니다.')); handleBackToList() }, onError: () => showError(t('common.error', '오류가 발생했습니다.')) })

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm(emptyForm) }
  const handleRowClick = (item: ChemicalReach) => { setSelectedItem(item); setViewMode('detail') }
  const handleOpenCreate = () => { setSelectedItem(null); setForm({ ...emptyForm, registrationDate: todayStr() }); setViewMode('create') }
  const handleOpenEdit = (item: ChemicalReach) => {
    setSelectedItem(item)
    setForm({ chemicalName: item.chemicalName || '', casNumber: item.casNumber || '', registrationNo: item.registrationNo || '', svhc: item.svhc || 'N', authorizationRequired: item.authorizationRequired || 'N', restrictionNote: item.restrictionNote || '', registrationDate: item.registrationDate || '', status: item.status || 'REGISTERED' })
    setViewMode('edit')
  }
  const handleSave = () => { if (selectedItem && viewMode === 'edit') updateMut.mutate({ id: selectedItem.id, r: form }); else createMut.mutate(form) }
  const handleDelete = async (item: ChemicalReach) => { const ok = await showConfirm(t('common.confirmDelete', '삭제하시겠습니까?')); if (ok) deleteMut.mutate(item.id) }
  const handleReset = () => { setKeywordInput(''); setKeyword(''); setPage(0) }

  // ==================== DETAIL VIEW ====================
  if (viewMode === 'detail' && selectedItem) {
    return (
      <Box>
        {/* PC */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.reach.chemicalName', '화학물질명')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.chemicalName}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.reach.casNumber', 'CAS No.')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.casNumber || ''}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.reach.registrationNo', '등록 번호')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.registrationNo || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.reach.svhc', 'SVHC')}</Typography>
              <Box sx={valSx}>
                <Chip label={getReachYnLabel(selectedItem.svhc || '')} size="small" color={selectedItem.svhc === 'Y' ? 'error' : 'default'} />
              </Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.reach.authRequired', '허가 대상')}</Typography>
              <Box sx={valBorderSx}>
                <Chip label={getReachYnLabel(selectedItem.authorizationRequired || '')} size="small" color={selectedItem.authorizationRequired === 'Y' ? 'error' : 'default'} />
              </Box>
              <Typography sx={labelSx}>{t('chem.reach.restrictionNote', '제한 사항')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.restrictionNote || ''}</Typography></Box>
            </Box>
            <Box sx={{ display: 'flex' }}>
              <Typography sx={labelSx}>{t('chem.reach.registrationDate', '등록일')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.registrationDate || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.reach.status', '상태')}</Typography>
              <Box sx={valSx}>
                <Chip label={getReachStatusLabel(selectedItem.status)} size="small" color={selectedItem.status === 'REGISTERED' ? 'success' : selectedItem.status === 'NEED_UPDATE' ? 'warning' : selectedItem.status === 'UNDER_REVIEW' ? 'info' : 'default'} />
              </Box>
            </Box>
          </Box>
        {/* Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
          {[
            [t('chem.reach.chemicalName', '화학물질명'), selectedItem.chemicalName],
            [t('chem.reach.casNumber', 'CAS No.'), selectedItem.casNumber],
            [t('chem.reach.registrationNo', '등록 번호'), selectedItem.registrationNo],
            [t('chem.reach.svhc', 'SVHC'), getReachYnLabel(selectedItem.svhc || '')],
            [t('chem.reach.authRequired', '허가 대상'), getReachYnLabel(selectedItem.authorizationRequired || '')],
            [t('chem.reach.restrictionNote', '제한 사항'), selectedItem.restrictionNote],
            [t('chem.reach.registrationDate', '등록일'), selectedItem.registrationDate],
            [t('chem.reach.status', '상태'), getReachStatusLabel(selectedItem.status)],
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
        <Paper sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.reach.chemicalName', '화학물질명')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.chemicalName} onChange={e => setForm({ ...form, chemicalName: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.reach.casNumber', 'CAS No.')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.casNumber} onChange={e => setForm({ ...form, casNumber: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.reach.registrationNo', '등록 번호')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.registrationNo} onChange={e => setForm({ ...form, registrationNo: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.reach.svhc', 'SVHC')}</Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" value={form.svhc} onChange={e => setForm({ ...form, svhc: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택</MenuItem>
                {reachYnCodes.map(c => <MenuItem key={c.code} value={c.code}>{getReachYnLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.reach.authRequired', '허가 대상')}</Typography>
            <Box sx={valBorderSx}>
              <Select fullWidth size="small" value={form.authorizationRequired} onChange={e => setForm({ ...form, authorizationRequired: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택</MenuItem>
                {reachYnCodes.map(c => <MenuItem key={c.code} value={c.code}>{getReachYnLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
            <Typography sx={labelSx}>{t('chem.reach.restrictionNote', '제한 사항')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.restrictionNote} onChange={e => setForm({ ...form, restrictionNote: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.reach.registrationDate', '등록일')}</Typography>
            <Box sx={valBorderSx}><DatePickerField value={form.registrationDate || ''} onChange={v => setForm({ ...form, registrationDate: v })} size="small" /></Box>
            <Typography sx={labelSx}>{t('chem.reach.status', '상태')}</Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택</MenuItem>
                {reachStatusCodes.map(c => <MenuItem key={c.code} value={c.code}>{getReachStatusLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          </Box>
        </Paper>
        {/* Mobile Form */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('chem.reach.chemicalName', '화학물질명')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.chemicalName} onChange={e => setForm({ ...form, chemicalName: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.reach.casNumber', 'CAS No.')}</Typography>
            <TextField size="small" fullWidth value={form.casNumber} onChange={e => setForm({ ...form, casNumber: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.reach.registrationNo', '등록 번호')}</Typography>
            <TextField size="small" fullWidth value={form.registrationNo} onChange={e => setForm({ ...form, registrationNo: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.reach.svhc', 'SVHC')}</Typography>
            <Select fullWidth size="small" value={form.svhc} onChange={e => setForm({ ...form, svhc: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택</MenuItem>
              {reachYnCodes.map(c => <MenuItem key={c.code} value={c.code}>{getReachYnLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.reach.authRequired', '허가 대상')}</Typography>
            <Select fullWidth size="small" value={form.authorizationRequired} onChange={e => setForm({ ...form, authorizationRequired: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택</MenuItem>
              {reachYnCodes.map(c => <MenuItem key={c.code} value={c.code}>{getReachYnLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.reach.restrictionNote', '제한 사항')}</Typography>
            <TextField size="small" fullWidth value={form.restrictionNote} onChange={e => setForm({ ...form, restrictionNote: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.reach.registrationDate', '등록일')}</Typography>
            <DatePickerField value={form.registrationDate || ''} onChange={v => setForm({ ...form, registrationDate: v })} size="small" />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.reach.status', '상태')}</Typography>
            <Select fullWidth size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택</MenuItem>
              {reachStatusCodes.map(c => <MenuItem key={c.code} value={c.code}>{getReachStatusLabel(c.code)}</MenuItem>)}
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
          <Paper sx={metricCardSx}>
            <Typography variant="body2" color="text.secondary">{t('chem.reach.totalSubject', 'REACH 대상')}</Typography>
            <Typography variant="h5" fontWeight="bold">{totalElements}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={metricCardSx}>
            <Typography variant="body2" color="text.secondary">{t('chem.reach.svhcCount', 'SVHC 목록 해당')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="error.main">{svhcCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={metricCardSx}>
            <Typography variant="body2" color="text.secondary">{t('chem.reach.registered', '등록 완료')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="success.main">{registeredCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={metricCardSx}>
            <Typography variant="body2" color="text.secondary">{t('chem.reach.authNeeded', '허가 신청 필요')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="warning.main">{authNeededCount}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Search - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ListSearchBar placeholder={t('chem.reach.searchPlaceholder')}
            value={keywordInput} onChange={setKeywordInput} onSearch={applySearch}
            sx={{ minWidth: 250 }} />
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>{t('common.new', '신규')}</Button>
      </Box>
      {/* Search - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
        <ListSearchBar fullWidth placeholder={t('chem.reach.searchPlaceholder')}
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
              <TableCell sx={headerCellSx}>{t('chem.reach.chemicalName', '화학물질명')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.reach.casNumber', 'CAS No.')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.reach.registrationNo', '등록 번호')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.reach.svhc', 'SVHC')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.reach.authRequired', '허가 대상')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.reach.restrictionNote', '제한 사항')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.reach.registrationDate', '등록일')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.reach.status', '상태')}</TableCell>
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
                <TableCell>{row.registrationNo || ''}</TableCell>
                <TableCell>
                  <Chip label={getReachYnLabel(row.svhc || '')} size="small" color={row.svhc === 'Y' ? 'error' : 'default'} />
                </TableCell>
                <TableCell>
                  <Chip label={getReachYnLabel(row.authorizationRequired || '')} size="small" color={row.authorizationRequired === 'Y' ? 'error' : 'default'} />
                </TableCell>
                <TableCell>{row.restrictionNote || ''}</TableCell>
                <TableCell>{row.registrationDate || ''}</TableCell>
                <TableCell>
                  <Chip label={getReachStatusLabel(row.status)} size="small" color={row.status === 'REGISTERED' ? 'success' : row.status === 'NEED_UPDATE' ? 'warning' : row.status === 'UNDER_REVIEW' ? 'info' : 'default'} />
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
              <Chip label={getReachStatusLabel(row.status)} size="small" color={row.status === 'REGISTERED' ? 'success' : row.status === 'NEED_UPDATE' ? 'warning' : row.status === 'UNDER_REVIEW' ? 'info' : 'default'} />
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 0.5 }}>
              <Chip label={row.svhc === 'Y' ? 'SVHC' : ''} size="small" color={row.svhc === 'Y' ? 'error' : 'default'} sx={{ height: 18, '& .MuiChip-label': { fontSize: '0.65rem' } }} />
              <Typography variant="caption" color="text.secondary">
                CAS: {row.casNumber || ''} | {row.registrationNo || ''}
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

export default ReachTab
