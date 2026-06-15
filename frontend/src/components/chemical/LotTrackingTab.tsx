import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Button, Chip, Pagination,
  CircularProgress, Alert, Select, MenuItem, IconButton,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import { useAlert } from '../../contexts/AlertContext'
import { chemicalLotTrackingApi } from '../../api/chemicalApi'
import { ChemicalLotTracking } from '../../types/chemical.types'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import DevTestFillButton from '../common/DevTestFillButton'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const hSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

const labelSx = { width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem' }
const valSx = { flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }

const emptyForm = { chemicalName: '', incomingDate: '', incomingQuantity: '', currentLocation: '', usedQuantity: '', remainingQuantity: '', elapsedDays: 0, status: 'STORED' }

const LotTrackingTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<ChemicalLotTracking | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [page, setPage] = useState(0)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const applySearch = () => { setKeyword(keywordInput); setPage(0) }

  const statusMap: Record<string, { color: 'success' | 'primary' | 'warning' | 'default'; label: string }> = {
    STORED: { color: 'success', label: t('chem.lot.statusStored') },
    IN_USE: { color: 'primary', label: t('chem.lot.statusInUse') },
    INSPECTION_PENDING: { color: 'warning', label: t('chem.lot.statusInspection') },
    EXPIRING_SOON: { color: 'warning', label: t('chem.lot.statusExpiring') },
    CONSUMED: { color: 'default', label: t('chem.lot.statusConsumed') },
  }

  const { data, isLoading } = useQuery({
    queryKey: ['chemicalLotTracking', page, keyword],
    queryFn: () => chemicalLotTrackingApi.getAll(page, 10),
    enabled: viewMode === 'list',
  })

  const items: ChemicalLotTracking[] = data?.content || []
  const totalPages = data?.totalPages || 0

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['chemicalLotTracking'] })
  const createMut = useMutation({ mutationFn: (r: Partial<ChemicalLotTracking>) => chemicalLotTrackingApi.create(r), onSuccess: () => { invalidate(); showSuccess(t('common.saved')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const updateMut = useMutation({ mutationFn: ({ id, r }: { id: number; r: Partial<ChemicalLotTracking> }) => chemicalLotTrackingApi.update(id, r), onSuccess: () => { invalidate(); showSuccess(t('common.saved')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const deleteMut = useMutation({ mutationFn: (id: number) => chemicalLotTrackingApi.delete(id), onSuccess: () => { invalidate(); showSuccess(t('common.deleted')); handleBackToList() }, onError: () => showError(t('common.error')) })

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm(emptyForm) }
  const handleRowClick = (item: ChemicalLotTracking) => { setSelectedItem(item); setViewMode('detail') }
  const handleOpenCreate = () => { setSelectedItem(null); setForm({ ...emptyForm, incomingDate: todayStr() }); setViewMode('create') }
  const handleOpenEdit = (item: ChemicalLotTracking) => {
    setSelectedItem(item)
    setForm({ chemicalName: item.chemicalName || '', incomingDate: item.incomingDate || '', incomingQuantity: item.incomingQuantity || '', currentLocation: item.currentLocation || '', usedQuantity: item.usedQuantity || '', remainingQuantity: item.remainingQuantity || '', elapsedDays: item.elapsedDays ?? 0, status: item.status || 'STORED' })
    setViewMode('edit')
  }
  const handleSave = () => { if (selectedItem && viewMode === 'edit') updateMut.mutate({ id: selectedItem.id, r: form }); else createMut.mutate(form) }
  const handleDelete = async (item: ChemicalLotTracking) => { const ok = await showConfirm(t('common.confirmDelete')); if (ok) deleteMut.mutate(item.id) }

  const handleReset = () => { setKeywordInput(''); setKeyword(''); setPage(0) }

  // DEV ONLY — 비어있는 항목을 LOT 추적 더미데이터로 채움 (입력값 보존)
  const fillTestData = () => setForm(prev => ({
    ...prev,
    chemicalName: prev.chemicalName || '톨루엔',
    incomingDate: prev.incomingDate || todayStr(),
    incomingQuantity: prev.incomingQuantity || '200 kg',
    currentLocation: prev.currentLocation || '제1창고 A-01',
    usedQuantity: prev.usedQuantity || '50 kg',
    remainingQuantity: prev.remainingQuantity || '150 kg',
    elapsedDays: prev.elapsedDays || 15,
    status: prev.status || 'STORED',
  }))

  const getStatusChip = (status: string) => {
    const info = statusMap[status]
    if (!info) return <Chip label={status} size="small" />
    return <Chip label={info.label} size="small" color={info.color} />
  }

  const getStatusLabel = (status: string) => statusMap[status]?.label || status

  // ==================== DETAIL VIEW ====================
  if (viewMode === 'detail' && selectedItem) {
    return (
      <Box>
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
            <Box sx={rowSx}><Typography sx={labelSx}>{t('chem.lot.lotNumber')}</Typography><Box sx={valBorderSx}><Typography variant="body2">{selectedItem.lotNumber}</Typography></Box><Typography sx={labelSx}>{t('chem.lot.chemicalName')}</Typography><Box sx={valSx}><Typography variant="body2">{selectedItem.chemicalName}</Typography></Box></Box>
            <Box sx={rowSx}><Typography sx={labelSx}>{t('chem.lot.incomingDate')}</Typography><Box sx={valBorderSx}><Typography variant="body2">{selectedItem.incomingDate || ''}</Typography></Box><Typography sx={labelSx}>{t('chem.lot.incomingQuantity')}</Typography><Box sx={valSx}><Typography variant="body2">{selectedItem.incomingQuantity || ''}</Typography></Box></Box>
            <Box sx={rowSx}><Typography sx={labelSx}>{t('chem.lot.currentLocation')}</Typography><Box sx={valBorderSx}><Typography variant="body2">{selectedItem.currentLocation || ''}</Typography></Box><Typography sx={labelSx}>{t('chem.lot.usedQuantity')}</Typography><Box sx={valSx}><Typography variant="body2">{selectedItem.usedQuantity || ''}</Typography></Box></Box>
            <Box sx={rowSx}><Typography sx={labelSx}>{t('chem.lot.remainingQuantity')}</Typography><Box sx={valBorderSx}><Typography variant="body2">{selectedItem.remainingQuantity || ''}</Typography></Box><Typography sx={labelSx}>{t('chem.lot.elapsedDays')}</Typography><Box sx={valSx}><Typography variant="body2">{selectedItem.elapsedDays != null ? `${selectedItem.elapsedDays}` : ''}</Typography></Box></Box>
            <Box sx={{ display: 'flex' }}><Typography sx={labelSx}>{t('chem.status')}</Typography><Box sx={valSx}>{getStatusChip(selectedItem.status)}</Box></Box>
          </Box>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
            {[[t('chem.lot.lotNumber'), selectedItem.lotNumber], [t('chem.lot.chemicalName'), selectedItem.chemicalName], [t('chem.lot.incomingDate'), selectedItem.incomingDate], [t('chem.lot.incomingQuantity'), selectedItem.incomingQuantity], [t('chem.lot.currentLocation'), selectedItem.currentLocation], [t('chem.lot.usedQuantity'), selectedItem.usedQuantity], [t('chem.lot.remainingQuantity'), selectedItem.remainingQuantity], [t('chem.lot.elapsedDays'), selectedItem.elapsedDays != null ? `${selectedItem.elapsedDays}` : null], [t('chem.status'), getStatusLabel(selectedItem.status)]].filter(([, v]) => v).map(([label, value], i) => (
              <Box key={i}><Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography><Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{value}</Typography></Box>
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
        <Paper sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.lot.chemicalName')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.chemicalName} onChange={e => setForm({ ...form, chemicalName: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.lot.incomingDate')}</Typography>
            <Box sx={valSx}><DatePickerField value={form.incomingDate || ''} onChange={v => setForm({ ...form, incomingDate: v })} size="small" /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.lot.incomingQuantity')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.incomingQuantity} onChange={e => setForm({ ...form, incomingQuantity: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.lot.currentLocation')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.currentLocation} onChange={e => setForm({ ...form, currentLocation: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.lot.usedQuantity')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.usedQuantity} onChange={e => setForm({ ...form, usedQuantity: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.lot.remainingQuantity')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.remainingQuantity} onChange={e => setForm({ ...form, remainingQuantity: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.lot.elapsedDays')}</Typography>
            <Box sx={valBorderSx}><NumberField fullWidth size="small" value={form.elapsedDays} onChange={(v) => setForm({ ...form, elapsedDays: v ?? 0 })} /></Box>
            <Typography sx={labelSx}>{t('chem.status')}</Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                <MenuItem value="STORED">{t('chem.lot.statusStored')}</MenuItem>
                <MenuItem value="IN_USE">{t('chem.lot.statusInUse')}</MenuItem>
                <MenuItem value="INSPECTION_PENDING">{t('chem.lot.statusInspection')}</MenuItem>
                <MenuItem value="EXPIRING_SOON">{t('chem.lot.statusExpiring')}</MenuItem>
                <MenuItem value="CONSUMED">{t('chem.lot.statusConsumed')}</MenuItem>
              </Select>
            </Box>
          </Box>
        </Paper>
        {/* Mobile Form */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('chem.lot.chemicalName')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.chemicalName} onChange={e => setForm({ ...form, chemicalName: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.lot.incomingDate')}</Typography>
            <DatePickerField value={form.incomingDate || ''} onChange={v => setForm({ ...form, incomingDate: v })} size="small" />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.lot.incomingQuantity')}</Typography>
            <TextField size="small" fullWidth value={form.incomingQuantity} onChange={e => setForm({ ...form, incomingQuantity: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.lot.currentLocation')}</Typography>
            <TextField size="small" fullWidth value={form.currentLocation} onChange={e => setForm({ ...form, currentLocation: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.lot.usedQuantity')}</Typography>
            <TextField size="small" fullWidth value={form.usedQuantity} onChange={e => setForm({ ...form, usedQuantity: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.lot.remainingQuantity')}</Typography>
            <TextField size="small" fullWidth value={form.remainingQuantity} onChange={e => setForm({ ...form, remainingQuantity: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.lot.elapsedDays')}</Typography>
            <NumberField size="small" fullWidth value={form.elapsedDays} onChange={(v) => setForm({ ...form, elapsedDays: v ?? 0 })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.status')}</Typography>
            <Select fullWidth size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              <MenuItem value="STORED">{t('chem.lot.statusStored')}</MenuItem>
              <MenuItem value="IN_USE">{t('chem.lot.statusInUse')}</MenuItem>
              <MenuItem value="INSPECTION_PENDING">{t('chem.lot.statusInspection')}</MenuItem>
              <MenuItem value="EXPIRING_SOON">{t('chem.lot.statusExpiring')}</MenuItem>
              <MenuItem value="CONSUMED">{t('chem.lot.statusConsumed')}</MenuItem>
            </Select>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
          <Button variant="outlined" onClick={() => viewMode === 'edit' ? setViewMode('detail') : handleBackToList()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save')}</Button>
        </Box>
      </Box>
    )
  }

  // ==================== LIST VIEW ====================
  return (
    <Box>
      {/* Search - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ListSearchBar placeholder={t('chem.lot.searchPlaceholder')}
            value={keywordInput} onChange={setKeywordInput} onSearch={applySearch}
            sx={{ minWidth: 250 }} />
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>{t('common.new')}</Button>
      </Box>
      {/* Search - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
        <ListSearchBar fullWidth placeholder={t('chem.lot.searchPlaceholder')}
          value={keywordInput} onChange={setKeywordInput} onSearch={applySearch} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={handleReset} sx={{ flex: 1 }}>{t('common.reset', '초기화')}</Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ flex: 1 }}>{t('common.new')}</Button>
        </Box>
      </Box>

      {/* Table */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Alert severity="info" sx={{ m: 2 }}>{t('common.noData')}</Alert>
      ) : (
        <>
          <Paper>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 900, '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={hSx}>{t('chem.lot.lotNumber')}</TableCell>
                    <TableCell sx={hSx}>{t('chem.lot.chemicalName')}</TableCell>
                    <TableCell sx={hSx}>{t('chem.lot.incomingDate')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('chem.lot.incomingQuantity')}</TableCell>
                    <TableCell sx={hSx}>{t('chem.lot.currentLocation')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('chem.lot.usedQuantity')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('chem.lot.remainingQuantity')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('chem.lot.elapsedDays')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('chem.status')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.lotNumber}</TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>{item.chemicalName}</Typography></TableCell>
                      <TableCell>{item.incomingDate || ''}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{item.incomingQuantity || ''}</TableCell>
                      <TableCell>{item.currentLocation || ''}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{item.usedQuantity || ''}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{item.remainingQuantity || ''}</TableCell>
                      <TableCell align="center">{item.elapsedDays != null ? `${item.elapsedDays}` : ''}</TableCell>
                      <TableCell align="center">{getStatusChip(item.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <Pagination count={totalPages} page={page + 1} onChange={(_, p) => setPage(p - 1)} color="primary" />
            </Box>
          )}
        </>
      )}
    </Box>
  )
}

export default LotTrackingTab
