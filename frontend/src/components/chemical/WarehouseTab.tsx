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
import NumberField from '../common/NumberField'
import { chemicalWarehouseApi } from '../../api/chemicalApi'
import { ChemicalWarehouse } from '../../types/chemical.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const storageTypeChipColor = (type?: string): 'primary' | 'error' | 'warning' | 'default' => {
  if (type === 'GENERAL') return 'primary'
  if (type === 'HAZARDOUS') return 'error'
  if (type === 'CORROSIVE') return 'warning'
  if (type === 'TOXIC') return 'error'
  return 'default'
}

const statusColorMap: Record<string, 'success' | 'warning'> = {
  NORMAL: 'success',
  INSPECTION_NEEDED: 'warning',
}

const headerCellSx = { fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300', wordBreak: 'keep-all' }
const lastHeaderCellSx = { fontWeight: 'bold', wordBreak: 'keep-all' }
const cellBorderSx = { borderRight: 1, borderColor: 'grey.300' }

const labelSx = { width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all' as const }
const valSx = { flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'grey.300' }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'grey.300' }

const emptyForm = { warehouseName: '', storageType: '', location: '', storedItemsCount: 0, totalStock: '', temperature: '', humidity: '', status: 'NORMAL' }

const WarehouseTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<ChemicalWarehouse | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['chemicalWarehouses', page, keyword],
    queryFn: () => chemicalWarehouseApi.getAll(page, 10),
    enabled: viewMode === 'list',
  })

  const items: ChemicalWarehouse[] = data?.content || []
  const totalPages = data?.totalPages || 0

  const warehouseCount = items.length
  const totalItems = items.reduce((sum, w) => sum + (w.storedItemsCount || 0), 0)
  const hazardousCount = items.filter(w => w.storageType === 'HAZARDOUS' || w.storageType === 'TOXIC').length
  const expiringCount = 0

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['chemicalWarehouses'] })
  const createMut = useMutation({ mutationFn: (r: Partial<ChemicalWarehouse>) => chemicalWarehouseApi.create(r), onSuccess: () => { invalidate(); showSuccess(t('common.saved')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const updateMut = useMutation({ mutationFn: ({ id, r }: { id: number; r: Partial<ChemicalWarehouse> }) => chemicalWarehouseApi.update(id, r), onSuccess: () => { invalidate(); showSuccess(t('common.saved')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const deleteMut = useMutation({ mutationFn: (id: number) => chemicalWarehouseApi.delete(id), onSuccess: () => { invalidate(); showSuccess(t('common.deleted')); handleBackToList() }, onError: () => showError(t('common.error')) })

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm(emptyForm) }
  const handleRowClick = (item: ChemicalWarehouse) => { setSelectedItem(item); setViewMode('detail') }
  const handleOpenCreate = () => { setSelectedItem(null); setForm(emptyForm); setViewMode('create') }
  const handleOpenEdit = (item: ChemicalWarehouse) => {
    setSelectedItem(item)
    setForm({ warehouseName: item.warehouseName || '', storageType: item.storageType || '', location: item.location || '', storedItemsCount: item.storedItemsCount ?? 0, totalStock: item.totalStock || '', temperature: item.temperature || '', humidity: item.humidity || '', status: item.status || 'NORMAL' })
    setViewMode('edit')
  }
  const handleSave = () => { if (selectedItem && viewMode === 'edit') updateMut.mutate({ id: selectedItem.id, r: form }); else createMut.mutate(form) }
  const handleDelete = async (item: ChemicalWarehouse) => { const ok = await showConfirm(t('common.confirmDelete')); if (ok) deleteMut.mutate(item.id) }

  const handleReset = () => { setKeyword(''); setPage(0) }

  const getStorageTypeLabel = (type?: string) => {
    const map: Record<string, string> = {
      GENERAL: t('chem.warehouse.typeGeneral'),
      HAZARDOUS: t('chem.warehouse.typeHazardous'),
      CORROSIVE: t('chem.warehouse.typeCorrosive'),
      TOXIC: t('chem.warehouse.typeToxic'),
    }
    return map[type || ''] || type || ''
  }

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      NORMAL: t('chem.warehouse.statusNormal'),
      INSPECTION_NEEDED: t('chem.warehouse.statusInspection'),
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
              <Typography sx={labelSx}>{t('chem.warehouse.warehouseCode')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.warehouseCode}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.warehouse.warehouseName')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.warehouseName}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.warehouse.storageType')}</Typography>
              <Box sx={valBorderSx}><Chip label={getStorageTypeLabel(selectedItem.storageType)} size="small" color={storageTypeChipColor(selectedItem.storageType)} /></Box>
              <Typography sx={labelSx}>{t('chem.warehouse.location')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.location || ''}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.warehouse.storedItems')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.storedItemsCount ?? ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.warehouse.totalStock')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.totalStock || ''}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.warehouse.temperature')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.temperature || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.warehouse.humidity')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.humidity || ''}</Typography></Box>
            </Box>
            <Box sx={{ display: 'flex' }}>
              <Typography sx={labelSx}>{t('chem.erp.status')}</Typography>
              <Box sx={valSx}><Chip label={getStatusLabel(selectedItem.status)} size="small" color={statusColorMap[selectedItem.status] || 'default'} /></Box>
            </Box>
          </Box>
        {/* Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
          {[
            [t('chem.warehouse.warehouseCode'), selectedItem.warehouseCode],
            [t('chem.warehouse.warehouseName'), selectedItem.warehouseName],
            [t('chem.warehouse.storageType'), getStorageTypeLabel(selectedItem.storageType)],
            [t('chem.warehouse.location'), selectedItem.location],
            [t('chem.warehouse.storedItems'), selectedItem.storedItemsCount?.toString()],
            [t('chem.warehouse.totalStock'), selectedItem.totalStock],
            [t('chem.warehouse.temperature'), selectedItem.temperature],
            [t('chem.warehouse.humidity'), selectedItem.humidity],
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
            <Typography sx={labelSx}>{t('chem.warehouse.warehouseName')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.warehouseName} onChange={e => setForm({ ...form, warehouseName: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.warehouse.storageType')}</Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" value={form.storageType} onChange={e => setForm({ ...form, storageType: e.target.value })} displayEmpty>
                <MenuItem value="">{t('chem.warehouse.searchPlaceholder')}</MenuItem>
                <MenuItem value="GENERAL">{t('chem.warehouse.typeGeneral')}</MenuItem>
                <MenuItem value="HAZARDOUS">{t('chem.warehouse.typeHazardous')}</MenuItem>
                <MenuItem value="CORROSIVE">{t('chem.warehouse.typeCorrosive')}</MenuItem>
                <MenuItem value="TOXIC">{t('chem.warehouse.typeToxic')}</MenuItem>
              </Select>
            </Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.warehouse.location')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.warehouse.storedItems')}</Typography>
            <Box sx={valSx}><NumberField fullWidth size="small" value={form.storedItemsCount} onChange={(v) => setForm({ ...form, storedItemsCount: v ?? 0 })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.warehouse.totalStock')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.totalStock} onChange={e => setForm({ ...form, totalStock: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.warehouse.temperature')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.warehouse.humidity')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.humidity} onChange={e => setForm({ ...form, humidity: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.erp.status')}</Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="NORMAL">{t('chem.warehouse.statusNormal')}</MenuItem>
                <MenuItem value="INSPECTION_NEEDED">{t('chem.warehouse.statusInspection')}</MenuItem>
              </Select>
            </Box>
          </Box>
        </Paper>
        {/* Mobile Form */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('chem.warehouse.warehouseName')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.warehouseName} onChange={e => setForm({ ...form, warehouseName: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.warehouse.storageType')}</Typography>
            <Select fullWidth size="small" value={form.storageType} onChange={e => setForm({ ...form, storageType: e.target.value })} displayEmpty>
              <MenuItem value="">{t('chem.warehouse.searchPlaceholder')}</MenuItem>
              <MenuItem value="GENERAL">{t('chem.warehouse.typeGeneral')}</MenuItem>
              <MenuItem value="HAZARDOUS">{t('chem.warehouse.typeHazardous')}</MenuItem>
              <MenuItem value="CORROSIVE">{t('chem.warehouse.typeCorrosive')}</MenuItem>
              <MenuItem value="TOXIC">{t('chem.warehouse.typeToxic')}</MenuItem>
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.warehouse.location')}</Typography>
            <TextField size="small" fullWidth value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.warehouse.storedItems')}</Typography>
            <NumberField size="small" fullWidth value={form.storedItemsCount} onChange={(v) => setForm({ ...form, storedItemsCount: v ?? 0 })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.warehouse.totalStock')}</Typography>
            <TextField size="small" fullWidth value={form.totalStock} onChange={e => setForm({ ...form, totalStock: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.warehouse.temperature')}</Typography>
            <TextField size="small" fullWidth value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.warehouse.humidity')}</Typography>
            <TextField size="small" fullWidth value={form.humidity} onChange={e => setForm({ ...form, humidity: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.erp.status')}</Typography>
            <Select fullWidth size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <MenuItem value="NORMAL">{t('chem.warehouse.statusNormal')}</MenuItem>
              <MenuItem value="INSPECTION_NEEDED">{t('chem.warehouse.statusInspection')}</MenuItem>
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
      {/* Metrics */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">{t('chem.warehouse.totalWarehouse')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="primary.main">{warehouseCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">{t('chem.warehouse.storedItems')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="info.main">{totalItems}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">{t('chem.warehouse.hazardWarehouse')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="error.main">{hazardousCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">{t('chem.erp.expiringSoon')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="warning.main">{expiringCount}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Search - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField size="small" placeholder={t('chem.warehouse.searchPlaceholder')} value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(0) }}
            sx={{ minWidth: 250 }} />
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>{t('common.new')}</Button>
      </Box>
      {/* Search - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
        <TextField size="small" fullWidth placeholder={t('chem.warehouse.searchPlaceholder')} value={keyword}
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
              <TableCell align="center" sx={headerCellSx}>{t('chem.warehouse.warehouseCode')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.warehouse.warehouseName')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.warehouse.storageType')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.warehouse.location')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.warehouse.storedItems')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.warehouse.totalStock')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.warehouse.temperature')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.warehouse.humidity')}</TableCell>
              <TableCell align="center" sx={lastHeaderCellSx}>{t('chem.erp.status')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length > 0 ? items.map((item) => (
              <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                <TableCell align="center" sx={cellBorderSx}>{item.warehouseCode}</TableCell>
                <TableCell sx={cellBorderSx}><Typography variant="body2" fontWeight={600}>{item.warehouseName}</Typography></TableCell>
                <TableCell align="center" sx={cellBorderSx}><Chip label={getStorageTypeLabel(item.storageType)} size="small" color={storageTypeChipColor(item.storageType)} /></TableCell>
                <TableCell sx={cellBorderSx}>{item.location || ''}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.storedItemsCount ?? ''}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.totalStock || ''}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.temperature || ''}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.humidity || ''}</TableCell>
                <TableCell align="center"><Chip label={getStatusLabel(item.status)} size="small" color={statusColorMap[item.status] || 'default'} /></TableCell>
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
              <Typography variant="subtitle2" fontWeight="bold">{item.warehouseName}</Typography>
              <Chip label={getStatusLabel(item.status)} size="small" color={statusColorMap[item.status] || 'default'} />
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 0.5 }}>
              <Chip label={getStorageTypeLabel(item.storageType)} size="small" color={storageTypeChipColor(item.storageType)} sx={{ height: 18, '& .MuiChip-label': { fontSize: '0.65rem' } }} />
              <Typography variant="caption" color="text.secondary">{item.warehouseCode} | {item.location || ''}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {t('chem.warehouse.storedItems')}: {item.storedItemsCount ?? ''} | {t('chem.warehouse.totalStock')}: {item.totalStock || ''}
            </Typography>
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

export default WarehouseTab
