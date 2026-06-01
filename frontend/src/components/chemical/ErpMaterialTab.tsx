import { useState } from 'react'
import {
  Box, Typography, TextField, Button, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, Paper, Grid, Pagination, TableContainer, Select, MenuItem, IconButton,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import DatePickerField from '../common/DatePickerField'
import NumberField from '../common/NumberField'
import { erpMaterialApi } from '../../api/chemicalApi'
import type { ErpMaterial } from '../../types/chemical.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const statusChipColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
  if (status === 'NORMAL') return 'success'
  if (status === 'LOW_STOCK') return 'warning'
  if (status === 'EXPIRING') return 'error'
  if (status === 'RESTRICTED') return 'default'
  return 'default'
}

const headerCellSx = { fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300', wordBreak: 'keep-all' }
const lastHeaderCellSx = { fontWeight: 'bold', wordBreak: 'keep-all' }
const cellBorderSx = { borderRight: 1, borderColor: 'grey.300' }

const labelSx = { width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all' as const }
const valSx = { flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'grey.300' }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'grey.300' }

const emptyForm = { materialCode: '', materialName: '', chemicalName: '', casNumber: '', supplier: '', stockQuantity: 0, unit: '', unitPrice: 0, lastIncomingDate: '', status: 'NORMAL' }

const ErpMaterialTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<ErpMaterial | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['erp-material', page, keyword],
    queryFn: () => erpMaterialApi.search({ keyword, page, size: 10 }),
    enabled: viewMode === 'list',
  })

  const items: ErpMaterial[] = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['erp-material'] })
  const createMut = useMutation({ mutationFn: (r: Partial<ErpMaterial>) => erpMaterialApi.create(r), onSuccess: () => { invalidate(); showSuccess(t('common.saved')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const updateMut = useMutation({ mutationFn: ({ id, r }: { id: number; r: Partial<ErpMaterial> }) => erpMaterialApi.update(id, r), onSuccess: () => { invalidate(); showSuccess(t('common.saved')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const deleteMut = useMutation({ mutationFn: (id: number) => erpMaterialApi.delete(id), onSuccess: () => { invalidate(); showSuccess(t('common.deleted')); handleBackToList() }, onError: () => showError(t('common.error')) })

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm(emptyForm) }
  const handleRowClick = (item: ErpMaterial) => { setSelectedItem(item); setViewMode('detail') }
  const handleOpenCreate = () => { setSelectedItem(null); setForm(emptyForm); setViewMode('create') }
  const handleOpenEdit = (item: ErpMaterial) => {
    setSelectedItem(item)
    setForm({ materialCode: item.materialCode || '', materialName: item.materialName || '', chemicalName: item.chemicalName || '', casNumber: item.casNumber || '', supplier: item.supplier || '', stockQuantity: item.stockQuantity ?? 0, unit: item.unit || '', unitPrice: item.unitPrice ?? 0, lastIncomingDate: item.lastIncomingDate || '', status: item.status || 'NORMAL' })
    setViewMode('edit')
  }
  const handleSave = () => { if (selectedItem && viewMode === 'edit') updateMut.mutate({ id: selectedItem.id, r: form }); else createMut.mutate(form) }
  const handleDelete = async (item: ErpMaterial) => { const ok = await showConfirm(t('common.confirmDelete')); if (ok) deleteMut.mutate(item.id) }

  const handleReset = () => { setKeyword(''); setPage(0) }

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      NORMAL: t('chem.erp.statusNormal'),
      LOW_STOCK: t('chem.erp.statusLowStock'),
      EXPIRING: t('chem.erp.statusExpiring'),
      RESTRICTED: t('chem.erp.statusRestricted'),
    }
    return map[status] || status
  }

  // ==================== DETAIL VIEW ====================
  if (viewMode === 'detail' && selectedItem) {
    return (
      <Box>
        {/* PC */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.erp.materialCode')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.materialCode}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.erp.materialName')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.materialName}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.erp.chemicalName')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.chemicalName || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.casNumber')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.casNumber || ''}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.erp.supplier')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.supplier || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.erp.stockQuantity')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.stockQuantity != null ? `${selectedItem.stockQuantity} ${selectedItem.unit || ''}` : ''}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.erp.unitPrice')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.unitPrice != null ? selectedItem.unitPrice.toLocaleString() : ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.erp.lastIncomingDate')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.lastIncomingDate || ''}</Typography></Box>
            </Box>
            <Box sx={{ display: 'flex' }}>
              <Typography sx={labelSx}>{t('chem.erp.status')}</Typography>
              <Box sx={valSx}><Chip label={getStatusLabel(selectedItem.status)} size="small" color={statusChipColor(selectedItem.status)} /></Box>
            </Box>
          </Box>
        {/* Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
          {[
            [t('chem.erp.materialCode'), selectedItem.materialCode],
            [t('chem.erp.materialName'), selectedItem.materialName],
            [t('chem.erp.chemicalName'), selectedItem.chemicalName],
            [t('chem.casNumber'), selectedItem.casNumber],
            [t('chem.erp.supplier'), selectedItem.supplier],
            [t('chem.erp.stockQuantity'), selectedItem.stockQuantity != null ? `${selectedItem.stockQuantity} ${selectedItem.unit || ''}` : null],
            [t('chem.erp.unitPrice'), selectedItem.unitPrice != null ? selectedItem.unitPrice.toLocaleString() : null],
            [t('chem.erp.lastIncomingDate'), selectedItem.lastIncomingDate],
            [t('chem.erp.status'), getStatusLabel(selectedItem.status)],
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
            <Typography sx={labelSx}>{t('chem.erp.materialCode')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.materialCode} onChange={e => setForm({ ...form, materialCode: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.erp.materialName')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.materialName} onChange={e => setForm({ ...form, materialName: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.erp.chemicalName')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.chemicalName} onChange={e => setForm({ ...form, chemicalName: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.casNumber')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.casNumber} onChange={e => setForm({ ...form, casNumber: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.erp.supplier')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.erp.stockQuantity')}</Typography>
            <Box sx={valSx}><NumberField fullWidth size="small" value={form.stockQuantity} onChange={(v) => setForm({ ...form, stockQuantity: v ?? 0 })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.unit')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.erp.unitPrice')}</Typography>
            <Box sx={valSx}><NumberField fullWidth size="small" value={form.unitPrice} onChange={(v) => setForm({ ...form, unitPrice: v ?? 0 })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.erp.lastIncomingDate')}</Typography>
            <Box sx={valBorderSx}><DatePickerField value={form.lastIncomingDate || ''} onChange={v => setForm({ ...form, lastIncomingDate: v })} size="small" /></Box>
            <Typography sx={labelSx}>{t('chem.erp.status')}</Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="NORMAL">{t('chem.erp.statusNormal')}</MenuItem>
                <MenuItem value="LOW_STOCK">{t('chem.erp.statusLowStock')}</MenuItem>
                <MenuItem value="EXPIRING">{t('chem.erp.statusExpiring')}</MenuItem>
                <MenuItem value="RESTRICTED">{t('chem.erp.statusRestricted')}</MenuItem>
              </Select>
            </Box>
          </Box>
        </Paper>
        {/* Mobile Form */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.erp.materialCode')}</Typography>
            <TextField size="small" fullWidth value={form.materialCode} onChange={e => setForm({ ...form, materialCode: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('chem.erp.materialName')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.materialName} onChange={e => setForm({ ...form, materialName: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.erp.chemicalName')}</Typography>
            <TextField size="small" fullWidth value={form.chemicalName} onChange={e => setForm({ ...form, chemicalName: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.casNumber')}</Typography>
            <TextField size="small" fullWidth value={form.casNumber} onChange={e => setForm({ ...form, casNumber: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.erp.supplier')}</Typography>
            <TextField size="small" fullWidth value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.erp.stockQuantity')}</Typography>
            <NumberField size="small" fullWidth value={form.stockQuantity} onChange={(v) => setForm({ ...form, stockQuantity: v ?? 0 })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.unit')}</Typography>
            <TextField size="small" fullWidth value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.erp.unitPrice')}</Typography>
            <NumberField size="small" fullWidth value={form.unitPrice} onChange={(v) => setForm({ ...form, unitPrice: v ?? 0 })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.erp.lastIncomingDate')}</Typography>
            <DatePickerField value={form.lastIncomingDate || ''} onChange={v => setForm({ ...form, lastIncomingDate: v })} size="small" />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.erp.status')}</Typography>
            <Select fullWidth size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <MenuItem value="NORMAL">{t('chem.erp.statusNormal')}</MenuItem>
              <MenuItem value="LOW_STOCK">{t('chem.erp.statusLowStock')}</MenuItem>
              <MenuItem value="EXPIRING">{t('chem.erp.statusExpiring')}</MenuItem>
              <MenuItem value="RESTRICTED">{t('chem.erp.statusRestricted')}</MenuItem>
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
            <Typography variant="caption" color="text.secondary">{t('chem.erp.totalMaterial')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="primary">{totalElements}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">{t('chem.erp.normalStock')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="success.main"></Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">{t('chem.erp.lowStock')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="warning.main"></Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">{t('chem.erp.expiringSoon')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="error"></Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Search - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField size="small" placeholder={t('chem.erp.searchPlaceholder')} value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(0) }}
            sx={{ minWidth: 250 }} />
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>{t('common.new')}</Button>
      </Box>
      {/* Search - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
        <TextField size="small" fullWidth placeholder={t('chem.erp.searchPlaceholder')} value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(0) }} />
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
              <TableCell align="center" sx={headerCellSx}>{t('chem.erp.materialCode')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.erp.materialName')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.erp.chemicalName')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.casNumber')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.erp.supplier')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.erp.stockQuantity')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.erp.unitPrice')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.erp.lastIncomingDate')}</TableCell>
              <TableCell align="center" sx={lastHeaderCellSx}>{t('chem.erp.status')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length > 0 ? items.map((item) => (
              <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                <TableCell align="center" sx={cellBorderSx}>{item.materialCode}</TableCell>
                <TableCell sx={cellBorderSx}>{item.materialName}</TableCell>
                <TableCell sx={cellBorderSx}>{item.chemicalName || ''}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.casNumber || ''}</TableCell>
                <TableCell sx={cellBorderSx}>{item.supplier || ''}</TableCell>
                <TableCell align="right" sx={cellBorderSx}>
                  {item.stockQuantity != null ? `${item.stockQuantity} ${item.unit || ''}` : ''}
                </TableCell>
                <TableCell align="right" sx={cellBorderSx}>
                  {item.unitPrice != null ? item.unitPrice.toLocaleString() : ''}
                </TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.lastIncomingDate || ''}</TableCell>
                <TableCell align="center">
                  <Chip label={getStatusLabel(item.status)} size="small" color={statusChipColor(item.status)} />
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
              <Typography variant="subtitle2" fontWeight="bold">{item.materialName}</Typography>
              <Chip label={getStatusLabel(item.status)} size="small" color={statusChipColor(item.status)} />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {item.materialCode} | CAS: {item.casNumber || ''}
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {t('chem.erp.stockQuantity')}: {item.stockQuantity != null ? `${item.stockQuantity} ${item.unit || ''}` : ''} | {item.supplier || ''}
              </Typography>
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

export default ErpMaterialTab
