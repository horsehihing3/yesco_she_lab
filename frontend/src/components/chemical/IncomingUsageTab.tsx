import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Button, Chip, Pagination,
  CircularProgress, Alert, Select, MenuItem, FormControl,
  Switch, FormControlLabel, IconButton,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import { useAlert } from '../../contexts/AlertContext'
import { chemicalIncomingApi, chemicalUsageApi } from '../../api/chemicalApi'
import { ChemicalIncoming, ChemicalUsage } from '../../types/chemical.types'
import DatePickerField from '../common/DatePickerField'
import NumberField from '../common/NumberField'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const hSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

const labelSx = { width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'center', fontSize: '0.875rem' }
const valSx = { flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'grey.300' }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'grey.300' }

const emptyIncomingForm = { incomingDate: '', chemicalName: '', supplier: '', quantity: 0, unit: '', warehouseCode: '', handler: '', msdsConfirmed: false }
const emptyUsageForm = { usageDate: '', chemicalName: '', department: '', purpose: '', usageQuantity: 0, unit: '', handler: '', remainingStock: '' }

const IncomingUsageTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()

  const [activeTab, setActiveTab] = useState(0)

  // ===== Incoming state =====
  const [incomingViewMode, setIncomingViewMode] = useState<ViewMode>('list')
  const [selectedIncoming, setSelectedIncoming] = useState<ChemicalIncoming | null>(null)
  const [incomingForm, setIncomingForm] = useState(emptyIncomingForm)
  const [incomingPage, setIncomingPage] = useState(0)
  const [incomingKeywordInput, setIncomingKeywordInput] = useState('')
  const [incomingKeyword, setIncomingKeyword] = useState('')
  const applyIncomingSearch = () => { setIncomingKeyword(incomingKeywordInput); setIncomingPage(0) }
  const resetIncomingSearch = () => { setIncomingKeywordInput(''); setIncomingKeyword(''); setIncomingPage(0) }

  // ===== Usage state =====
  const [usageViewMode, setUsageViewMode] = useState<ViewMode>('list')
  const [selectedUsage, setSelectedUsage] = useState<ChemicalUsage | null>(null)
  const [usageForm, setUsageForm] = useState(emptyUsageForm)
  const [usagePage, setUsagePage] = useState(0)
  const [usageKeywordInput, setUsageKeywordInput] = useState('')
  const [usageKeyword, setUsageKeyword] = useState('')
  const applyUsageSearch = () => { setUsageKeyword(usageKeywordInput); setUsagePage(0) }
  const resetUsageSearch = () => { setUsageKeywordInput(''); setUsageKeyword(''); setUsagePage(0) }

  // ===== Incoming query =====
  const { data: incomingData, isLoading: incomingLoading } = useQuery({
    queryKey: ['chemicalIncoming', incomingPage, incomingKeyword],
    queryFn: () => chemicalIncomingApi.getAll(incomingPage, 10),
    enabled: activeTab === 0 && incomingViewMode === 'list',
  })

  const incomingItems: ChemicalIncoming[] = incomingData?.content || []
  const incomingTotalPages = incomingData?.totalPages || 0

  // ===== Usage query =====
  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ['chemicalUsage', usagePage, usageKeyword],
    queryFn: () => chemicalUsageApi.getAll(usagePage, 10),
    enabled: activeTab === 1 && usageViewMode === 'list',
  })

  const usageItems: ChemicalUsage[] = usageData?.content || []
  const usageTotalPages = usageData?.totalPages || 0

  // Metrics
  const incomingCount = incomingItems.length
  const incomingQty = incomingItems.reduce((sum, i) => sum + (i.quantity || 0), 0)
  const msdsUnconfirmed = incomingItems.filter(i => !i.msdsConfirmed).length
  const pendingCount = 0

  const usageCount = usageItems.length
  const usageQty = usageItems.reduce((sum, u) => sum + (u.usageQuantity || 0), 0)
  const deptCount = new Set(usageItems.map(u => u.department).filter(Boolean)).size
  const lowStockCount = 0

  // ===== Incoming mutations =====
  const invalidateIncoming = () => queryClient.invalidateQueries({ queryKey: ['chemicalIncoming'] })
  const incomingCreateMut = useMutation({ mutationFn: (r: Partial<ChemicalIncoming>) => chemicalIncomingApi.create(r), onSuccess: () => { invalidateIncoming(); showSuccess(t('common.saved')); handleIncomingBackToList() }, onError: () => showError(t('common.error')) })
  const incomingUpdateMut = useMutation({ mutationFn: ({ id, r }: { id: number; r: Partial<ChemicalIncoming> }) => chemicalIncomingApi.update(id, r), onSuccess: () => { invalidateIncoming(); showSuccess(t('common.saved')); handleIncomingBackToList() }, onError: () => showError(t('common.error')) })
  const incomingDeleteMut = useMutation({ mutationFn: (id: number) => chemicalIncomingApi.delete(id), onSuccess: () => { invalidateIncoming(); showSuccess(t('common.deleted')); handleIncomingBackToList() }, onError: () => showError(t('common.error')) })

  const handleIncomingBackToList = () => { setIncomingViewMode('list'); setSelectedIncoming(null); setIncomingForm(emptyIncomingForm) }
  const handleIncomingRowClick = (item: ChemicalIncoming) => { setSelectedIncoming(item); setIncomingViewMode('detail') }
  const handleIncomingOpenCreate = () => { setSelectedIncoming(null); setIncomingForm(emptyIncomingForm); setIncomingViewMode('create') }
  const handleIncomingOpenEdit = (item: ChemicalIncoming) => {
    setSelectedIncoming(item)
    setIncomingForm({ incomingDate: item.incomingDate || '', chemicalName: item.chemicalName || '', supplier: item.supplier || '', quantity: item.quantity ?? 0, unit: item.unit || '', warehouseCode: item.warehouseCode || '', handler: item.handler || '', msdsConfirmed: item.msdsConfirmed ?? false })
    setIncomingViewMode('edit')
  }
  const handleIncomingSave = () => { if (selectedIncoming && incomingViewMode === 'edit') incomingUpdateMut.mutate({ id: selectedIncoming.id, r: incomingForm }); else incomingCreateMut.mutate(incomingForm) }
  const handleIncomingDelete = async (item: ChemicalIncoming) => { const ok = await showConfirm(t('common.confirmDelete')); if (ok) incomingDeleteMut.mutate(item.id) }
  const handleIncomingReset = () => { setIncomingKeywordInput(''); setIncomingKeyword(''); setIncomingPage(0) }

  // ===== Usage mutations =====
  const invalidateUsage = () => queryClient.invalidateQueries({ queryKey: ['chemicalUsage'] })
  const usageCreateMut = useMutation({ mutationFn: (r: Partial<ChemicalUsage>) => chemicalUsageApi.create(r), onSuccess: () => { invalidateUsage(); showSuccess(t('common.saved')); handleUsageBackToList() }, onError: () => showError(t('common.error')) })
  const usageUpdateMut = useMutation({ mutationFn: ({ id, r }: { id: number; r: Partial<ChemicalUsage> }) => chemicalUsageApi.update(id, r), onSuccess: () => { invalidateUsage(); showSuccess(t('common.saved')); handleUsageBackToList() }, onError: () => showError(t('common.error')) })
  const usageDeleteMut = useMutation({ mutationFn: (id: number) => chemicalUsageApi.delete(id), onSuccess: () => { invalidateUsage(); showSuccess(t('common.deleted')); handleUsageBackToList() }, onError: () => showError(t('common.error')) })

  const handleUsageBackToList = () => { setUsageViewMode('list'); setSelectedUsage(null); setUsageForm(emptyUsageForm) }
  const handleUsageRowClick = (item: ChemicalUsage) => { setSelectedUsage(item); setUsageViewMode('detail') }
  const handleUsageOpenCreate = () => { setSelectedUsage(null); setUsageForm(emptyUsageForm); setUsageViewMode('create') }
  const handleUsageOpenEdit = (item: ChemicalUsage) => {
    setSelectedUsage(item)
    setUsageForm({ usageDate: item.usageDate || '', chemicalName: item.chemicalName || '', department: item.department || '', purpose: item.purpose || '', usageQuantity: item.usageQuantity ?? 0, unit: item.unit || '', handler: item.handler || '', remainingStock: item.remainingStock || '' })
    setUsageViewMode('edit')
  }
  const handleUsageSave = () => { if (selectedUsage && usageViewMode === 'edit') usageUpdateMut.mutate({ id: selectedUsage.id, r: usageForm }); else usageCreateMut.mutate(usageForm) }
  const handleUsageDelete = async (item: ChemicalUsage) => { const ok = await showConfirm(t('common.confirmDelete')); if (ok) usageDeleteMut.mutate(item.id) }
  const handleUsageReset = () => { setUsageKeywordInput(''); setUsageKeyword(''); setUsagePage(0) }

  return (
    <Box>
      {/* Category Select */}
      <FormControl size="small" sx={{ mb: 2, minWidth: 200 }}>
        <Select value={activeTab} onChange={(e) => setActiveTab(Number(e.target.value))} displayEmpty>
          <MenuItem value="" disabled>선택하세요</MenuItem>
          <MenuItem value={0}>{t('chem.incoming.tabIncoming')}</MenuItem>
          <MenuItem value={1}>{t('chem.incoming.tabUsage')}</MenuItem>
        </Select>
      </FormControl>

      {/* ===== Tab 0: Incoming ===== */}
      {activeTab === 0 && (
        <Box>
          {/* ---- Incoming DETAIL ---- */}
          {incomingViewMode === 'detail' && selectedIncoming ? (
            <Box>
              <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
                <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden' }}>
                  <Box sx={rowSx}><Typography sx={labelSx}>{t('chem.incoming.incomingDate')}</Typography><Box sx={valBorderSx}><Typography variant="body2">{selectedIncoming.incomingDate}</Typography></Box><Typography sx={labelSx}>{t('chem.incoming.incomingNo')}</Typography><Box sx={valSx}><Typography variant="body2">{selectedIncoming.incomingNo}</Typography></Box></Box>
                  <Box sx={rowSx}><Typography sx={labelSx}>{t('chem.incoming.chemicalName')}</Typography><Box sx={valBorderSx}><Typography variant="body2">{selectedIncoming.chemicalName}</Typography></Box><Typography sx={labelSx}>{t('chem.incoming.supplier')}</Typography><Box sx={valSx}><Typography variant="body2">{selectedIncoming.supplier || ''}</Typography></Box></Box>
                  <Box sx={rowSx}><Typography sx={labelSx}>{t('chem.incoming.quantity')}</Typography><Box sx={valBorderSx}><Typography variant="body2">{selectedIncoming.quantity ?? ''}</Typography></Box><Typography sx={labelSx}>{t('chem.incoming.unit')}</Typography><Box sx={valSx}><Typography variant="body2">{selectedIncoming.unit || ''}</Typography></Box></Box>
                  <Box sx={rowSx}><Typography sx={labelSx}>{t('chem.incoming.warehouseCode')}</Typography><Box sx={valBorderSx}><Typography variant="body2">{selectedIncoming.warehouseCode || ''}</Typography></Box><Typography sx={labelSx}>{t('chem.incoming.handler')}</Typography><Box sx={valSx}><Typography variant="body2">{selectedIncoming.handler || ''}</Typography></Box></Box>
                  <Box sx={{ display: 'flex' }}><Typography sx={labelSx}>{t('chem.incoming.msdsConfirmed')}</Typography><Box sx={valSx}><Chip label={selectedIncoming.msdsConfirmed ? t('chem.incoming.confirmed') : t('chem.incoming.unconfirmed')} size="small" color={selectedIncoming.msdsConfirmed ? 'success' : 'error'} /></Box></Box>
                </Box>
                <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
                  {[[t('chem.incoming.incomingDate'), selectedIncoming.incomingDate], [t('chem.incoming.incomingNo'), selectedIncoming.incomingNo], [t('chem.incoming.chemicalName'), selectedIncoming.chemicalName], [t('chem.incoming.supplier'), selectedIncoming.supplier], [t('chem.incoming.quantity'), selectedIncoming.quantity?.toString()], [t('chem.incoming.unit'), selectedIncoming.unit], [t('chem.incoming.warehouseCode'), selectedIncoming.warehouseCode], [t('chem.incoming.handler'), selectedIncoming.handler], [t('chem.incoming.msdsConfirmed'), selectedIncoming.msdsConfirmed ? t('chem.incoming.confirmed') : t('chem.incoming.unconfirmed')]].filter(([, v]) => v).map(([label, value], i) => (
                    <Box key={i}><Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography><Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{value}</Typography></Box>
                  ))}
                </Box>
              </Paper>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
                <Button variant="outlined" onClick={handleIncomingBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list')}</Button>
                <Button variant="contained" onClick={() => handleIncomingOpenEdit(selectedIncoming)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.edit')}</Button>
                <Button variant="contained" color="error" onClick={() => handleIncomingDelete(selectedIncoming)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.delete')}</Button>
              </Box>
            </Box>
          ) : (incomingViewMode === 'create' || incomingViewMode === 'edit') ? (
            /* ---- Incoming CREATE/EDIT ---- */
            <Box>
              {/* PC Form */}
              <Paper sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
                <Box sx={rowSx}>
                  <Typography sx={labelSx}>{t('chem.incoming.incomingDate')}</Typography>
                  <Box sx={valBorderSx}><DatePickerField value={incomingForm.incomingDate || ''} onChange={v => setIncomingForm({ ...incomingForm, incomingDate: v })} size="small" /></Box>
                  <Typography sx={labelSx}>{t('chem.incoming.chemicalName')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
                  <Box sx={valSx}><TextField fullWidth size="small" value={incomingForm.chemicalName} onChange={e => setIncomingForm({ ...incomingForm, chemicalName: e.target.value })} /></Box>
                </Box>
                <Box sx={rowSx}>
                  <Typography sx={labelSx}>{t('chem.incoming.supplier')}</Typography>
                  <Box sx={valBorderSx}><TextField fullWidth size="small" value={incomingForm.supplier} onChange={e => setIncomingForm({ ...incomingForm, supplier: e.target.value })} /></Box>
                  <Typography sx={labelSx}>{t('chem.incoming.quantity')}</Typography>
                  <Box sx={valSx}><NumberField fullWidth size="small" value={incomingForm.quantity} onChange={(v) => setIncomingForm({ ...incomingForm, quantity: v ?? 0 })} /></Box>
                </Box>
                <Box sx={rowSx}>
                  <Typography sx={labelSx}>{t('chem.incoming.unit')}</Typography>
                  <Box sx={valBorderSx}><TextField fullWidth size="small" value={incomingForm.unit} onChange={e => setIncomingForm({ ...incomingForm, unit: e.target.value })} /></Box>
                  <Typography sx={labelSx}>{t('chem.incoming.warehouseCode')}</Typography>
                  <Box sx={valSx}><TextField fullWidth size="small" value={incomingForm.warehouseCode} onChange={e => setIncomingForm({ ...incomingForm, warehouseCode: e.target.value })} /></Box>
                </Box>
                <Box sx={rowSx}>
                  <Typography sx={labelSx}>{t('chem.incoming.handler')}</Typography>
                  <Box sx={valBorderSx}><TextField fullWidth size="small" value={incomingForm.handler} onChange={e => setIncomingForm({ ...incomingForm, handler: e.target.value })} /></Box>
                  <Typography sx={labelSx}>{t('chem.incoming.msdsConfirmed')}</Typography>
                  <Box sx={valSx}><FormControlLabel control={<Switch checked={incomingForm.msdsConfirmed} onChange={e => setIncomingForm({ ...incomingForm, msdsConfirmed: e.target.checked })} />} label="" /></Box>
                </Box>
              </Paper>
              {/* Mobile Form */}
              <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.incoming.incomingDate')}</Typography>
                  <DatePickerField value={incomingForm.incomingDate || ''} onChange={v => setIncomingForm({ ...incomingForm, incomingDate: v })} size="small" />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                    {t('chem.incoming.chemicalName')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
                  </Typography>
                  <TextField size="small" fullWidth value={incomingForm.chemicalName} onChange={e => setIncomingForm({ ...incomingForm, chemicalName: e.target.value })} />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.incoming.supplier')}</Typography>
                  <TextField size="small" fullWidth value={incomingForm.supplier} onChange={e => setIncomingForm({ ...incomingForm, supplier: e.target.value })} />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.incoming.quantity')}</Typography>
                  <NumberField size="small" fullWidth value={incomingForm.quantity} onChange={(v) => setIncomingForm({ ...incomingForm, quantity: v ?? 0 })} />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.incoming.unit')}</Typography>
                  <TextField size="small" fullWidth value={incomingForm.unit} onChange={e => setIncomingForm({ ...incomingForm, unit: e.target.value })} />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.incoming.warehouseCode')}</Typography>
                  <TextField size="small" fullWidth value={incomingForm.warehouseCode} onChange={e => setIncomingForm({ ...incomingForm, warehouseCode: e.target.value })} />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.incoming.handler')}</Typography>
                  <TextField size="small" fullWidth value={incomingForm.handler} onChange={e => setIncomingForm({ ...incomingForm, handler: e.target.value })} />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.incoming.msdsConfirmed')}</Typography>
                  <FormControlLabel control={<Switch checked={incomingForm.msdsConfirmed} onChange={e => setIncomingForm({ ...incomingForm, msdsConfirmed: e.target.checked })} />} label="" />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
                <Button variant="outlined" onClick={handleIncomingBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel')}</Button>
                <Button variant="contained" onClick={handleIncomingSave} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save')}</Button>
              </Box>
            </Box>
          ) : (
            /* ---- Incoming LIST ---- */
            <Box>
              {/* Metrics */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 1.5, mb: 2 }}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">{t('chem.incoming.totalIncoming')}</Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary.main">{incomingCount}</Typography>
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">{t('chem.incoming.totalVolume')}</Typography>
                  <Typography variant="h5" fontWeight="bold" color="info.main">{incomingQty.toLocaleString()}</Typography>
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">{t('chem.incoming.msdsUnconfirmed')}</Typography>
                  <Typography variant="h5" fontWeight="bold" color="error.main">{msdsUnconfirmed}</Typography>
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">{t('chem.incoming.waitingProcess')}</Typography>
                  <Typography variant="h5" fontWeight="bold" color="warning.main">{pendingCount}</Typography>
                </Paper>
              </Box>

              {/* Search - PC */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <ListSearchBar placeholder={t('chem.incoming.searchPlaceholder')}
                    value={incomingKeywordInput} onChange={setIncomingKeywordInput} onSearch={applyIncomingSearch}
                    sx={{ minWidth: 250 }} />
                  <IconButton onClick={handleIncomingReset} size="small"><RefreshIcon /></IconButton>
                </Box>
                <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleIncomingOpenCreate}>{t('common.new')}</Button>
              </Box>
              {/* Search - Mobile */}
              <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
                <ListSearchBar fullWidth placeholder={t('chem.incoming.searchPlaceholder')}
                  value={incomingKeywordInput} onChange={setIncomingKeywordInput} onSearch={applyIncomingSearch} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={handleIncomingReset} sx={{ flex: 1 }}>{t('common.reset', '초기화')}</Button>
                  <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleIncomingOpenCreate} sx={{ flex: 1 }}>{t('common.new')}</Button>
                </Box>
              </Box>

              {/* Table */}
              {incomingLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
              ) : incomingItems.length === 0 ? (
                <Alert severity="info" sx={{ m: 2 }}>{t('common.noData')}</Alert>
              ) : (
                <>
                  <Paper>
                    <TableContainer sx={{ overflowX: 'auto' }}>
                      <Table size="small" sx={{ minWidth: 900, '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={hSx}>{t('chem.incoming.incomingDate')}</TableCell>
                            <TableCell sx={hSx}>{t('chem.incoming.incomingNo')}</TableCell>
                            <TableCell sx={hSx}>{t('chem.incoming.chemicalName')}</TableCell>
                            <TableCell sx={hSx}>{t('chem.incoming.supplier')}</TableCell>
                            <TableCell sx={hSx} align="center">{t('chem.incoming.quantity')}</TableCell>
                            <TableCell sx={hSx}>{t('chem.incoming.unit')}</TableCell>
                            <TableCell sx={hSx}>{t('chem.incoming.warehouseCode')}</TableCell>
                            <TableCell sx={hSx}>{t('chem.incoming.handler')}</TableCell>
                            <TableCell sx={hSx} align="center">{t('chem.incoming.msdsConfirmed')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {incomingItems.map((item) => (
                            <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleIncomingRowClick(item)}>
                              <TableCell>{item.incomingDate}</TableCell>
                              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.incomingNo}</TableCell>
                              <TableCell><Typography variant="body2" fontWeight={600}>{item.chemicalName}</Typography></TableCell>
                              <TableCell>{item.supplier || ''}</TableCell>
                              <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{item.quantity ?? ''}</TableCell>
                              <TableCell>{item.unit || ''}</TableCell>
                              <TableCell>{item.warehouseCode || ''}</TableCell>
                              <TableCell>{item.handler || ''}</TableCell>
                              <TableCell align="center">
                                <Chip label={item.msdsConfirmed ? t('chem.incoming.confirmed') : t('chem.incoming.unconfirmed')} size="small" color={item.msdsConfirmed ? 'success' : 'error'} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                  {incomingTotalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <Pagination count={incomingTotalPages} page={incomingPage + 1} onChange={(_, p) => setIncomingPage(p - 1)} color="primary" />
                    </Box>
                  )}
                </>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* ===== Tab 1: Usage ===== */}
      {activeTab === 1 && (
        <Box>
          {/* ---- Usage DETAIL ---- */}
          {usageViewMode === 'detail' && selectedUsage ? (
            <Box>
              <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
                <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden' }}>
                  <Box sx={rowSx}><Typography sx={labelSx}>{t('chem.usage2.usageDate')}</Typography><Box sx={valBorderSx}><Typography variant="body2">{selectedUsage.usageDate}</Typography></Box><Typography sx={labelSx}>{t('chem.usage2.chemicalName')}</Typography><Box sx={valSx}><Typography variant="body2">{selectedUsage.chemicalName}</Typography></Box></Box>
                  <Box sx={rowSx}><Typography sx={labelSx}>{t('chem.usage2.department')}</Typography><Box sx={valBorderSx}><Typography variant="body2">{selectedUsage.department || ''}</Typography></Box><Typography sx={labelSx}>{t('chem.usage2.purpose')}</Typography><Box sx={valSx}><Typography variant="body2">{selectedUsage.purpose || ''}</Typography></Box></Box>
                  <Box sx={rowSx}><Typography sx={labelSx}>{t('chem.usage2.usageQuantity')}</Typography><Box sx={valBorderSx}><Typography variant="body2">{selectedUsage.usageQuantity ?? ''}</Typography></Box><Typography sx={labelSx}>{t('chem.usage2.unit')}</Typography><Box sx={valSx}><Typography variant="body2">{selectedUsage.unit || ''}</Typography></Box></Box>
                  <Box sx={{ display: 'flex' }}><Typography sx={labelSx}>{t('chem.usage2.handler')}</Typography><Box sx={valBorderSx}><Typography variant="body2">{selectedUsage.handler || ''}</Typography></Box><Typography sx={labelSx}>{t('chem.usage2.remainingStock')}</Typography><Box sx={valSx}><Typography variant="body2">{selectedUsage.remainingStock || ''}</Typography></Box></Box>
                </Box>
                <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
                  {[[t('chem.usage2.usageDate'), selectedUsage.usageDate], [t('chem.usage2.chemicalName'), selectedUsage.chemicalName], [t('chem.usage2.department'), selectedUsage.department], [t('chem.usage2.purpose'), selectedUsage.purpose], [t('chem.usage2.usageQuantity'), selectedUsage.usageQuantity?.toString()], [t('chem.usage2.unit'), selectedUsage.unit], [t('chem.usage2.handler'), selectedUsage.handler], [t('chem.usage2.remainingStock'), selectedUsage.remainingStock]].filter(([, v]) => v).map(([label, value], i) => (
                    <Box key={i}><Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography><Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{value}</Typography></Box>
                  ))}
                </Box>
              </Paper>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
                <Button variant="outlined" onClick={handleUsageBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list')}</Button>
                <Button variant="contained" onClick={() => handleUsageOpenEdit(selectedUsage)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.edit')}</Button>
                <Button variant="contained" color="error" onClick={() => handleUsageDelete(selectedUsage)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.delete')}</Button>
              </Box>
            </Box>
          ) : (usageViewMode === 'create' || usageViewMode === 'edit') ? (
            /* ---- Usage CREATE/EDIT ---- */
            <Box>
              {/* PC Form */}
              <Paper sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
                <Box sx={rowSx}>
                  <Typography sx={labelSx}>{t('chem.usage2.usageDate')}</Typography>
                  <Box sx={valBorderSx}><DatePickerField value={usageForm.usageDate || ''} onChange={v => setUsageForm({ ...usageForm, usageDate: v })} size="small" /></Box>
                  <Typography sx={labelSx}>{t('chem.usage2.chemicalName')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
                  <Box sx={valSx}><TextField fullWidth size="small" value={usageForm.chemicalName} onChange={e => setUsageForm({ ...usageForm, chemicalName: e.target.value })} /></Box>
                </Box>
                <Box sx={rowSx}>
                  <Typography sx={labelSx}>{t('chem.usage2.department')}</Typography>
                  <Box sx={valBorderSx}><TextField fullWidth size="small" value={usageForm.department} onChange={e => setUsageForm({ ...usageForm, department: e.target.value })} /></Box>
                  <Typography sx={labelSx}>{t('chem.usage2.purpose')}</Typography>
                  <Box sx={valSx}><TextField fullWidth size="small" value={usageForm.purpose} onChange={e => setUsageForm({ ...usageForm, purpose: e.target.value })} /></Box>
                </Box>
                <Box sx={rowSx}>
                  <Typography sx={labelSx}>{t('chem.usage2.usageQuantity')}</Typography>
                  <Box sx={valBorderSx}><NumberField fullWidth size="small" value={usageForm.usageQuantity} onChange={(v) => setUsageForm({ ...usageForm, usageQuantity: v ?? 0 })} /></Box>
                  <Typography sx={labelSx}>{t('chem.usage2.unit')}</Typography>
                  <Box sx={valSx}><TextField fullWidth size="small" value={usageForm.unit} onChange={e => setUsageForm({ ...usageForm, unit: e.target.value })} /></Box>
                </Box>
                <Box sx={rowSx}>
                  <Typography sx={labelSx}>{t('chem.usage2.handler')}</Typography>
                  <Box sx={valBorderSx}><TextField fullWidth size="small" value={usageForm.handler} onChange={e => setUsageForm({ ...usageForm, handler: e.target.value })} /></Box>
                  <Typography sx={labelSx}>{t('chem.usage2.remainingStock')}</Typography>
                  <Box sx={valSx}><TextField fullWidth size="small" value={usageForm.remainingStock} onChange={e => setUsageForm({ ...usageForm, remainingStock: e.target.value })} /></Box>
                </Box>
              </Paper>
              {/* Mobile Form */}
              <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.usage2.usageDate')}</Typography>
                  <DatePickerField value={usageForm.usageDate || ''} onChange={v => setUsageForm({ ...usageForm, usageDate: v })} size="small" />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                    {t('chem.usage2.chemicalName')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
                  </Typography>
                  <TextField size="small" fullWidth value={usageForm.chemicalName} onChange={e => setUsageForm({ ...usageForm, chemicalName: e.target.value })} />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.usage2.department')}</Typography>
                  <TextField size="small" fullWidth value={usageForm.department} onChange={e => setUsageForm({ ...usageForm, department: e.target.value })} />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.usage2.purpose')}</Typography>
                  <TextField size="small" fullWidth value={usageForm.purpose} onChange={e => setUsageForm({ ...usageForm, purpose: e.target.value })} />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.usage2.usageQuantity')}</Typography>
                  <NumberField size="small" fullWidth value={usageForm.usageQuantity} onChange={(v) => setUsageForm({ ...usageForm, usageQuantity: v ?? 0 })} />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.usage2.unit')}</Typography>
                  <TextField size="small" fullWidth value={usageForm.unit} onChange={e => setUsageForm({ ...usageForm, unit: e.target.value })} />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.usage2.handler')}</Typography>
                  <TextField size="small" fullWidth value={usageForm.handler} onChange={e => setUsageForm({ ...usageForm, handler: e.target.value })} />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.usage2.remainingStock')}</Typography>
                  <TextField size="small" fullWidth value={usageForm.remainingStock} onChange={e => setUsageForm({ ...usageForm, remainingStock: e.target.value })} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
                <Button variant="outlined" onClick={handleUsageBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel')}</Button>
                <Button variant="contained" onClick={handleUsageSave} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save')}</Button>
              </Box>
            </Box>
          ) : (
            /* ---- Usage LIST ---- */
            <Box>
              {/* Metrics */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 1.5, mb: 2 }}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">{t('chem.usage2.totalUsage')}</Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary.main">{usageCount}</Typography>
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">{t('chem.usage2.totalVolume')}</Typography>
                  <Typography variant="h5" fontWeight="bold" color="info.main">{usageQty.toLocaleString()}</Typography>
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">{t('chem.usage2.deptCount')}</Typography>
                  <Typography variant="h5" fontWeight="bold" color="success.main">{deptCount}</Typography>
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">{t('chem.usage2.lowStockAlert')}</Typography>
                  <Typography variant="h5" fontWeight="bold" color="error.main">{lowStockCount}</Typography>
                </Paper>
              </Box>

              {/* Search - PC */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <ListSearchBar placeholder={t('chem.usage2.searchPlaceholder')}
                    value={usageKeywordInput} onChange={setUsageKeywordInput} onSearch={applyUsageSearch}
                    sx={{ minWidth: 250 }} />
                  <IconButton onClick={handleUsageReset} size="small"><RefreshIcon /></IconButton>
                </Box>
                <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleUsageOpenCreate}>{t('common.new')}</Button>
              </Box>
              {/* Search - Mobile */}
              <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
                <ListSearchBar fullWidth placeholder={t('chem.usage2.searchPlaceholder')}
                  value={usageKeywordInput} onChange={setUsageKeywordInput} onSearch={applyUsageSearch} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={handleUsageReset} sx={{ flex: 1 }}>{t('common.reset', '초기화')}</Button>
                  <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleUsageOpenCreate} sx={{ flex: 1 }}>{t('common.new')}</Button>
                </Box>
              </Box>

              {/* Table */}
              {usageLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
              ) : usageItems.length === 0 ? (
                <Alert severity="info" sx={{ m: 2 }}>{t('common.noData')}</Alert>
              ) : (
                <>
                  <Paper>
                    <TableContainer>
                      <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={hSx}>{t('chem.usage2.usageDate')}</TableCell>
                            <TableCell sx={hSx}>{t('chem.usage2.chemicalName')}</TableCell>
                            <TableCell sx={hSx}>{t('chem.usage2.department')}</TableCell>
                            <TableCell sx={hSx}>{t('chem.usage2.purpose')}</TableCell>
                            <TableCell sx={hSx} align="center">{t('chem.usage2.usageQuantity')}</TableCell>
                            <TableCell sx={hSx}>{t('chem.usage2.unit')}</TableCell>
                            <TableCell sx={hSx}>{t('chem.usage2.handler')}</TableCell>
                            <TableCell sx={hSx} align="center">{t('chem.usage2.remainingStock')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {usageItems.map((item) => (
                            <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleUsageRowClick(item)}>
                              <TableCell>{item.usageDate}</TableCell>
                              <TableCell><Typography variant="body2" fontWeight={600}>{item.chemicalName}</Typography></TableCell>
                              <TableCell>{item.department || ''}</TableCell>
                              <TableCell>{item.purpose || ''}</TableCell>
                              <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{item.usageQuantity ?? ''}</TableCell>
                              <TableCell>{item.unit || ''}</TableCell>
                              <TableCell>{item.handler || ''}</TableCell>
                              <TableCell align="center">{item.remainingStock || ''}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                  {usageTotalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <Pagination count={usageTotalPages} page={usagePage + 1} onChange={(_, p) => setUsagePage(p - 1)} color="primary" />
                    </Box>
                  )}
                </>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}

export default IncomingUsageTab
