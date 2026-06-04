import { useState } from 'react'
import { fmtPhone } from '../../utils/phoneFormat'
import {
  Box, Typography, TextField, Button, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, Paper, Grid, Pagination, TableContainer, Select, MenuItem, IconButton,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import { chemicalVendorApi } from '../../api/chemicalApi'
import type { ChemicalVendor } from '../../types/chemical.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const gradeChipColor = (grade?: string): 'success' | 'warning' | 'error' | 'default' => {
  if (grade === 'A') return 'success'
  if (grade === 'B') return 'warning'
  if (grade === 'C') return 'error'
  return 'default'
}

const msdsChipColor = (status?: string): 'success' | 'warning' | 'error' | 'default' => {
  if (status === 'COMPLETE') return 'success'
  if (status === 'PARTIAL') return 'warning'
  if (status === 'MISSING') return 'error'
  return 'default'
}

const headerCellSx = { fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300', wordBreak: 'keep-all' }
const lastHeaderCellSx = { fontWeight: 'bold', wordBreak: 'keep-all' }
const cellBorderSx = { borderRight: 1, borderColor: 'grey.300' }

const labelSx = { width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all' as const }
const valSx = { flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'grey.300' }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'grey.300' }

const emptyForm = { vendorName: '', representative: '', contactPerson: '', phone: '', supplyItemsCount: 0, msdsStatus: '', lastTransactionDate: '', grade: '' }

const VendorListTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<ChemicalVendor | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [page, setPage] = useState(0)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const applySearch = () => { setKeyword(keywordInput); setPage(0) }

  const { data, isLoading } = useQuery({
    queryKey: ['chemical-vendor', page, keyword],
    queryFn: () => chemicalVendorApi.search({ keyword, page, size: 10 }),
    enabled: viewMode === 'list',
  })

  const items: ChemicalVendor[] = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['chemical-vendor'] })
  const createMut = useMutation({ mutationFn: (r: Partial<ChemicalVendor>) => chemicalVendorApi.create(r), onSuccess: () => { invalidate(); showSuccess(t('common.saved')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const updateMut = useMutation({ mutationFn: ({ id, r }: { id: number; r: Partial<ChemicalVendor> }) => chemicalVendorApi.update(id, r), onSuccess: () => { invalidate(); showSuccess(t('common.saved')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const deleteMut = useMutation({ mutationFn: (id: number) => chemicalVendorApi.delete(id), onSuccess: () => { invalidate(); showSuccess(t('common.deleted')); handleBackToList() }, onError: () => showError(t('common.error')) })

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm(emptyForm) }
  const handleRowClick = (item: ChemicalVendor) => { setSelectedItem(item); setViewMode('detail') }
  const handleOpenCreate = () => { setSelectedItem(null); setForm({ ...emptyForm, lastTransactionDate: todayStr() }); setViewMode('create') }
  const handleOpenEdit = (item: ChemicalVendor) => {
    setSelectedItem(item)
    setForm({ vendorName: item.vendorName || '', representative: item.representative || '', contactPerson: item.contactPerson || '', phone: item.phone || '', supplyItemsCount: item.supplyItemsCount ?? 0, msdsStatus: item.msdsStatus || '', lastTransactionDate: item.lastTransactionDate || '', grade: item.grade || '' })
    setViewMode('edit')
  }
  const handleSave = () => { if (selectedItem && viewMode === 'edit') updateMut.mutate({ id: selectedItem.id, r: form }); else createMut.mutate(form) }
  const handleDelete = async (item: ChemicalVendor) => { const ok = await showConfirm(t('common.confirmDelete')); if (ok) deleteMut.mutate(item.id) }

  const handleReset = () => { setKeywordInput(''); setKeyword(''); setPage(0) }

  const getMsdsLabel = (status?: string) => {
    const map: Record<string, string> = {
      COMPLETE: t('chem.vendor.msdsComplete'),
      PARTIAL: t('chem.vendor.msdsPartial'),
      MISSING: t('chem.vendor.msdsMissing'),
    }
    return map[status || ''] || status || ''
  }

  // ==================== DETAIL VIEW ====================
  if (viewMode === 'detail' && selectedItem) {
    return (
      <Box>
        {/* PC */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.vendor.vendorCode')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.vendorCode}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.vendor.vendorName')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.vendorName}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.vendor.representative')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.representative || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.vendor.contactPerson')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.contactPerson || ''}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.vendor.phone')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.phone || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.vendor.supplyItems')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.supplyItemsCount != null ? `${selectedItem.supplyItemsCount}` : ''}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.vendor.msdsStatus')}</Typography>
              <Box sx={valBorderSx}><Chip label={getMsdsLabel(selectedItem.msdsStatus)} size="small" color={msdsChipColor(selectedItem.msdsStatus)} /></Box>
              <Typography sx={labelSx}>{t('chem.vendor.lastTransaction')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.lastTransactionDate || ''}</Typography></Box>
            </Box>
            <Box sx={{ display: 'flex' }}>
              <Typography sx={labelSx}>{t('chem.vendor.grade')}</Typography>
              <Box sx={valSx}><Chip label={selectedItem.grade || ''} size="small" color={gradeChipColor(selectedItem.grade)} /></Box>
            </Box>
          </Box>
        {/* Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
          {[
            [t('chem.vendor.vendorCode'), selectedItem.vendorCode],
            [t('chem.vendor.vendorName'), selectedItem.vendorName],
            [t('chem.vendor.representative'), selectedItem.representative],
            [t('chem.vendor.contactPerson'), selectedItem.contactPerson],
            [t('chem.vendor.phone'), selectedItem.phone],
            [t('chem.vendor.supplyItems'), selectedItem.supplyItemsCount != null ? `${selectedItem.supplyItemsCount}` : null],
            [t('chem.vendor.msdsStatus'), getMsdsLabel(selectedItem.msdsStatus)],
            [t('chem.vendor.lastTransaction'), selectedItem.lastTransactionDate],
            [t('chem.vendor.grade'), selectedItem.grade],
          ].filter(([, v]) => v).map(([label, value], i) => (
            <Box key={i}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography>
              <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{value}</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list')}</Button>
          <Button variant="contained" onClick={() => handleOpenEdit(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.edit')}</Button>
          <Button variant="contained" color="error" onClick={() => handleDelete(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.delete')}</Button>
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
            <Typography sx={labelSx}>{t('chem.vendor.vendorName')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.vendorName} onChange={e => setForm({ ...form, vendorName: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.vendor.representative')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.representative} onChange={e => setForm({ ...form, representative: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.vendor.contactPerson')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.vendor.phone')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.phone} onChange={e => setForm({ ...form, phone: fmtPhone(e.target.value) })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.vendor.supplyItems')}</Typography>
            <Box sx={valBorderSx}><NumberField fullWidth size="small" value={form.supplyItemsCount} onChange={(v) => setForm({ ...form, supplyItemsCount: v ?? 0 })} /></Box>
            <Typography sx={labelSx}>{t('chem.vendor.msdsStatus')}</Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" value={form.msdsStatus} onChange={e => setForm({ ...form, msdsStatus: e.target.value })} displayEmpty>
                <MenuItem value="">{t('chem.vendor.searchPlaceholder')}</MenuItem>
                <MenuItem value="COMPLETE">{t('chem.vendor.msdsComplete')}</MenuItem>
                <MenuItem value="PARTIAL">{t('chem.vendor.msdsPartial')}</MenuItem>
                <MenuItem value="MISSING">{t('chem.vendor.msdsMissing')}</MenuItem>
              </Select>
            </Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.vendor.lastTransaction')}</Typography>
            <Box sx={valBorderSx}><DatePickerField value={form.lastTransactionDate || ''} onChange={v => setForm({ ...form, lastTransactionDate: v })} size="small" /></Box>
            <Typography sx={labelSx}>{t('chem.vendor.grade')}</Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} displayEmpty>
                <MenuItem value="">{t('chem.vendor.searchPlaceholder')}</MenuItem>
                <MenuItem value="A">{t('chem.vendor.gradeA')}</MenuItem>
                <MenuItem value="B">{t('chem.vendor.gradeB')}</MenuItem>
                <MenuItem value="C">{t('chem.vendor.gradeC')}</MenuItem>
              </Select>
            </Box>
          </Box>
        </Paper>
        {/* Mobile Form */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('chem.vendor.vendorName')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.vendorName} onChange={e => setForm({ ...form, vendorName: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.vendor.representative')}</Typography>
            <TextField size="small" fullWidth value={form.representative} onChange={e => setForm({ ...form, representative: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.vendor.contactPerson')}</Typography>
            <TextField size="small" fullWidth value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.vendor.phone')}</Typography>
            <TextField size="small" fullWidth value={form.phone} onChange={e => setForm({ ...form, phone: fmtPhone(e.target.value) })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.vendor.supplyItems')}</Typography>
            <NumberField size="small" fullWidth value={form.supplyItemsCount} onChange={(v) => setForm({ ...form, supplyItemsCount: v ?? 0 })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.vendor.msdsStatus')}</Typography>
            <Select fullWidth size="small" value={form.msdsStatus} onChange={e => setForm({ ...form, msdsStatus: e.target.value })} displayEmpty>
              <MenuItem value="">{t('chem.vendor.searchPlaceholder')}</MenuItem>
              <MenuItem value="COMPLETE">{t('chem.vendor.msdsComplete')}</MenuItem>
              <MenuItem value="PARTIAL">{t('chem.vendor.msdsPartial')}</MenuItem>
              <MenuItem value="MISSING">{t('chem.vendor.msdsMissing')}</MenuItem>
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.vendor.lastTransaction')}</Typography>
            <DatePickerField value={form.lastTransactionDate || ''} onChange={v => setForm({ ...form, lastTransactionDate: v })} size="small" />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.vendor.grade')}</Typography>
            <Select fullWidth size="small" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} displayEmpty>
              <MenuItem value="">{t('chem.vendor.searchPlaceholder')}</MenuItem>
              <MenuItem value="A">{t('chem.vendor.gradeA')}</MenuItem>
              <MenuItem value="B">{t('chem.vendor.gradeB')}</MenuItem>
              <MenuItem value="C">{t('chem.vendor.gradeC')}</MenuItem>
            </Select>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={() => viewMode === 'edit' ? setViewMode('detail') : handleBackToList()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save')}</Button>
        </Box>
      </Box>
    )
  }

  // ==================== LIST VIEW ====================
  return (
    <Box>
      {/* Metrics Cards */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">{t('chem.vendor.totalVendor')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="primary">{totalElements}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">{t('chem.vendor.gradeA')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="success.main"></Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">{t('chem.vendor.gradeB')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="warning.main"></Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">{t('chem.vendor.msdsMissing')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="error"></Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Search - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ListSearchBar placeholder={t('chem.vendor.searchPlaceholder')}
            value={keywordInput} onChange={setKeywordInput} onSearch={applySearch}
            sx={{ minWidth: 250 }} />
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>{t('common.new')}</Button>
      </Box>
      {/* Search - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
        <ListSearchBar fullWidth placeholder={t('chem.vendor.searchPlaceholder')}
          value={keywordInput} onChange={setKeywordInput} onSearch={applySearch} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={handleReset} sx={{ flex: 1 }}>{t('common.reset', '초기화')}</Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ flex: 1 }}>{t('common.new')}</Button>
        </Box>
      </Box>

      {/* PC Table */}
      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', overflowX: 'auto' }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={headerCellSx}>{t('chem.vendor.vendorCode')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.vendor.vendorName')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.vendor.representative')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.vendor.contactPerson')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.vendor.phone')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.vendor.supplyItems')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.vendor.msdsStatus')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.vendor.lastTransaction')}</TableCell>
              <TableCell align="center" sx={lastHeaderCellSx}>{t('chem.vendor.grade')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length > 0 ? items.map((item) => (
              <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                <TableCell align="center" sx={cellBorderSx}>{item.vendorCode}</TableCell>
                <TableCell sx={cellBorderSx}>{item.vendorName}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.representative || ''}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.contactPerson || ''}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.phone || ''}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.supplyItemsCount != null ? `${item.supplyItemsCount}` : ''}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>
                  <Chip label={getMsdsLabel(item.msdsStatus)} size="small" color={msdsChipColor(item.msdsStatus)} />
                </TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.lastTransactionDate || ''}</TableCell>
                <TableCell align="center">
                  <Chip label={item.grade || ''} size="small" color={gradeChipColor(item.grade)} />
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  {isLoading ? t('common.loading') : t('common.noData')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1 }}>
        {items.length > 0 ? items.map((item) => (
          <Paper key={item.id} sx={{ p: 2, cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="subtitle2" fontWeight="bold">{item.vendorName}</Typography>
              <Chip label={item.grade || ''} size="small" color={gradeChipColor(item.grade)} />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {item.vendorCode} | {item.representative || ''} | {item.contactPerson || ''}
            </Typography>
            <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">MSDS:</Typography>
              <Chip label={getMsdsLabel(item.msdsStatus)} size="small" color={msdsChipColor(item.msdsStatus)} sx={{ height: 18, '& .MuiChip-label': { fontSize: '0.65rem' } }} />
              <Typography variant="caption" color="text.secondary">| {item.phone || ''}</Typography>
            </Box>
          </Paper>
        )) : (
          <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
            {isLoading ? t('common.loading') : t('common.noData')}
          </Typography>
        )}
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination count={totalPages} page={page + 1} onChange={(_, p) => setPage(p - 1)} color="primary" />
        </Box>
      )}
    </Box>
  )
}

export default VendorListTab
