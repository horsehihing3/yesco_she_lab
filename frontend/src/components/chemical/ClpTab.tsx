import { useState } from 'react'
import {
  Box, Typography, TextField, Button, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, Paper, Grid, Pagination, TableContainer, Select, MenuItem,
  IconButton, CircularProgress,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import useCodeMap from '../../hooks/useCodeMap'
import DatePickerField from '../common/DatePickerField'
import { chemicalClpApi } from '../../api/chemicalApi'
import type { ChemicalClp } from '../../types/chemical.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }
const metricCardSx = { p: 2, textAlign: 'center', borderRadius: 1, border: 1, borderColor: 'grey.300' }
const labelSx = { width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'center', fontSize: '0.875rem' }
const valSx = { flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'grey.300' }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'grey.300' }

const emptyForm = { chemicalName: '', casNumber: '', clpClassification: '', signalWord: 'Danger', hCodes: '', pCodes: '', lastUpdated: '', status: 'LATEST' }

const ClpTab: React.FC = () => {
  const { codeList: signalWordCodes, getLabel: getSignalWordLabel } = useCodeMap('CLP_SIGNAL_WORD')
  const { codeList: clpStatusCodes, getLabel: getClpStatusLabel } = useCodeMap('CLP_STATUS')
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<ChemicalClp | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['chemical-clp', page, keyword],
    queryFn: () => chemicalClpApi.search({ keyword, page, size: 10 }),
    enabled: viewMode === 'list',
  })

  const items: ChemicalClp[] = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  const classifiedCount = items.filter((i) => i.clpClassification).length
  const dangerCount = items.filter((i) => i.signalWord === 'Danger').length
  const warningCount = items.filter((i) => i.signalWord === 'Warning').length

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['chemical-clp'] })
  const createMut = useMutation({ mutationFn: (r: Partial<ChemicalClp>) => chemicalClpApi.create(r), onSuccess: () => { invalidate(); showSuccess(t('common.saved', '저장되었습니다.')); handleBackToList() }, onError: () => showError(t('common.error', '오류가 발생했습니다.')) })
  const updateMut = useMutation({ mutationFn: ({ id, r }: { id: number; r: Partial<ChemicalClp> }) => chemicalClpApi.update(id, r), onSuccess: () => { invalidate(); showSuccess(t('common.saved', '저장되었습니다.')); handleBackToList() }, onError: () => showError(t('common.error', '오류가 발생했습니다.')) })
  const deleteMut = useMutation({ mutationFn: (id: number) => chemicalClpApi.delete(id), onSuccess: () => { invalidate(); showSuccess(t('common.deleted', '삭제되었습니다.')); handleBackToList() }, onError: () => showError(t('common.error', '오류가 발생했습니다.')) })

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm(emptyForm) }
  const handleRowClick = (item: ChemicalClp) => { setSelectedItem(item); setViewMode('detail') }
  const handleOpenCreate = () => { setSelectedItem(null); setForm(emptyForm); setViewMode('create') }
  const handleOpenEdit = (item: ChemicalClp) => {
    setSelectedItem(item)
    setForm({ chemicalName: item.chemicalName || '', casNumber: item.casNumber || '', clpClassification: item.clpClassification || '', signalWord: item.signalWord || 'Danger', hCodes: item.hCodes || '', pCodes: item.pCodes || '', lastUpdated: item.lastUpdated || '', status: item.status || 'LATEST' })
    setViewMode('edit')
  }
  const handleSave = () => { if (selectedItem && viewMode === 'edit') updateMut.mutate({ id: selectedItem.id, r: form }); else createMut.mutate(form) }
  const handleDelete = async (item: ChemicalClp) => { const ok = await showConfirm(t('common.confirmDelete', '삭제하시겠습니까?')); if (ok) deleteMut.mutate(item.id) }
  const handleReset = () => { setKeyword(''); setPage(0) }

  // ==================== DETAIL VIEW ====================
  if (viewMode === 'detail' && selectedItem) {
    return (
      <Box>
        {/* PC */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.clp.chemicalName', '화학물질명')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.chemicalName}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.clp.casNumber', 'CAS No.')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.casNumber || ''}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.clp.classification', 'CLP 분류')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.clpClassification || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.clp.signalWord', '신호어')}</Typography>
              <Box sx={valSx}>
                {selectedItem.signalWord ? (
                  <Chip label={getSignalWordLabel(selectedItem.signalWord || '')} size="small" color={selectedItem.signalWord === 'Danger' ? 'error' : 'warning'} />
                ) : null}
              </Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.clp.hCodes', 'H-코드')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.hCodes || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.clp.pCodes', 'P-코드')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.pCodes || ''}</Typography></Box>
            </Box>
            <Box sx={{ display: 'flex' }}>
              <Typography sx={labelSx}>{t('chem.clp.lastUpdated', '최종 갱신')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.lastUpdated || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.clp.status', '상태')}</Typography>
              <Box sx={valSx}>
                <Chip label={getClpStatusLabel(selectedItem.status)} size="small" color={selectedItem.status === 'LATEST' ? 'success' : selectedItem.status === 'NEED_UPDATE' ? 'warning' : 'default'} />
              </Box>
            </Box>
          </Box>
        {/* Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
          {[
            [t('chem.clp.chemicalName', '화학물질명'), selectedItem.chemicalName],
            [t('chem.clp.casNumber', 'CAS No.'), selectedItem.casNumber],
            [t('chem.clp.classification', 'CLP 분류'), selectedItem.clpClassification],
            [t('chem.clp.signalWord', '신호어'), getSignalWordLabel(selectedItem.signalWord || '')],
            [t('chem.clp.hCodes', 'H-코드'), selectedItem.hCodes],
            [t('chem.clp.pCodes', 'P-코드'), selectedItem.pCodes],
            [t('chem.clp.lastUpdated', '최종 갱신'), selectedItem.lastUpdated],
            [t('chem.clp.status', '상태'), getClpStatusLabel(selectedItem.status)],
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
            <Typography sx={labelSx}>{t('chem.clp.chemicalName', '화학물질명')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.chemicalName} onChange={e => setForm({ ...form, chemicalName: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.clp.casNumber', 'CAS No.')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.casNumber} onChange={e => setForm({ ...form, casNumber: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.clp.classification', 'CLP 분류')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.clpClassification} onChange={e => setForm({ ...form, clpClassification: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.clp.signalWord', '신호어')}</Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" value={form.signalWord} onChange={e => setForm({ ...form, signalWord: e.target.value })}>
                {signalWordCodes.map(c => <MenuItem key={c.code} value={c.code}>{getSignalWordLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.clp.hCodes', 'H-코드')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.hCodes} onChange={e => setForm({ ...form, hCodes: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.clp.pCodes', 'P-코드')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.pCodes} onChange={e => setForm({ ...form, pCodes: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.clp.lastUpdated', '최종 갱신')}</Typography>
            <Box sx={valBorderSx}><DatePickerField value={form.lastUpdated || ''} onChange={v => setForm({ ...form, lastUpdated: v })} size="small" /></Box>
            <Typography sx={labelSx}>{t('chem.clp.status', '상태')}</Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {clpStatusCodes.map(c => <MenuItem key={c.code} value={c.code}>{getClpStatusLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          </Box>
        </Paper>
        {/* Mobile Form */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('chem.clp.chemicalName', '화학물질명')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.chemicalName} onChange={e => setForm({ ...form, chemicalName: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.clp.casNumber', 'CAS No.')}</Typography>
            <TextField size="small" fullWidth value={form.casNumber} onChange={e => setForm({ ...form, casNumber: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.clp.classification', 'CLP 분류')}</Typography>
            <TextField size="small" fullWidth value={form.clpClassification} onChange={e => setForm({ ...form, clpClassification: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.clp.signalWord', '신호어')}</Typography>
            <Select fullWidth size="small" value={form.signalWord} onChange={e => setForm({ ...form, signalWord: e.target.value })}>
              {signalWordCodes.map(c => <MenuItem key={c.code} value={c.code}>{getSignalWordLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.clp.hCodes', 'H-코드')}</Typography>
            <TextField size="small" fullWidth value={form.hCodes} onChange={e => setForm({ ...form, hCodes: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.clp.pCodes', 'P-코드')}</Typography>
            <TextField size="small" fullWidth value={form.pCodes} onChange={e => setForm({ ...form, pCodes: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.clp.lastUpdated', '최종 갱신')}</Typography>
            <DatePickerField value={form.lastUpdated || ''} onChange={v => setForm({ ...form, lastUpdated: v })} size="small" />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.clp.status', '상태')}</Typography>
            <Select fullWidth size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {clpStatusCodes.map(c => <MenuItem key={c.code} value={c.code}>{getClpStatusLabel(c.code)}</MenuItem>)}
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
            <Typography variant="body2" color="text.secondary">{t('chem.clp.totalSubstances', 'CLP 해당 물질')}</Typography>
            <Typography variant="h5" fontWeight="bold">{totalElements}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={metricCardSx}>
            <Typography variant="body2" color="text.secondary">{t('chem.clp.classified', '분류 완료')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="success.main">{classifiedCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={metricCardSx}>
            <Typography variant="body2" color="text.secondary">{t('chem.clp.danger', '위험(Danger)')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="error.main">{dangerCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={metricCardSx}>
            <Typography variant="body2" color="text.secondary">{t('chem.clp.warning', '경고(Warning)')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="warning.main">{warningCount}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Search - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField size="small" placeholder={t('chem.clp.searchPlaceholder')} value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(0) }}
            sx={{ minWidth: 250 }} />
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>{t('common.new', '신규')}</Button>
      </Box>
      {/* Search - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
        <TextField size="small" fullWidth placeholder={t('chem.clp.searchPlaceholder')} value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(0) }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={handleReset} sx={{ flex: 1 }}>
            {t('common.reset', '초기화')}
          </Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ flex: 1 }}>
            {t('common.new', '신규')}
          </Button>
        </Box>
      </Box>

      {/* PC Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={headerCellSx}>{t('chem.clp.chemicalName', '화학물질명')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.clp.casNumber', 'CAS No.')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.clp.classification', 'CLP 분류')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.clp.signalWord', '신호어')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.clp.hCodes', 'H-코드')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.clp.pCodes', 'P-코드')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.clp.lastUpdated', '최종 갱신')}</TableCell>
              <TableCell sx={headerCellSx}>{t('chem.clp.status', '상태')}</TableCell>
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
                <TableCell>{row.clpClassification || ''}</TableCell>
                <TableCell>
                  {row.signalWord ? (
                    <Chip label={getSignalWordLabel(row.signalWord || '')} size="small" color={row.signalWord === 'Danger' ? 'error' : 'warning'} />
                  ) : ''}
                </TableCell>
                <TableCell>{row.hCodes || ''}</TableCell>
                <TableCell>{row.pCodes || ''}</TableCell>
                <TableCell>{row.lastUpdated || ''}</TableCell>
                <TableCell>
                  <Chip label={getClpStatusLabel(row.status)} size="small" color={row.status === 'LATEST' ? 'success' : row.status === 'NEED_UPDATE' ? 'warning' : 'default'} />
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
              <Chip label={getClpStatusLabel(row.status)} size="small" color={row.status === 'LATEST' ? 'success' : row.status === 'NEED_UPDATE' ? 'warning' : 'default'} />
            </Box>
            <Typography variant="caption" color="text.secondary">
              CAS: {row.casNumber || ''} | {row.signalWord || ''} | H: {row.hCodes || ''}
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

export default ClpTab
