import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import ListSearchBar from '../common/ListSearchBar'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, Select, MenuItem,
  FormControl, Chip, Pagination, CircularProgress, Alert, IconButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import NumberField from '../common/NumberField'
import { useAlert } from '../../contexts/AlertContext'
import { chemicalApi } from '../../api/chemicalApi'
import { Chemical, ChemicalRequest } from '../../types/chemical.types'
import useCodeMap from '../../hooks/useCodeMap'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const labelSx = { width: 120, minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all' as const }
const valSx = { flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'grey.300' }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'grey.300' }
const hSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

const ChemicalInventoryTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { codeList: hazardCodes, getLabel: getHazardLabel } = useCodeMap('CHEMICAL_HAZARD_CLASS')
  const { codeList: unitCodes, getLabel: getUnitLabel } = useCodeMap('CHEMICAL_UNIT')
  const { codeList: statusCodes, getLabel: getStatusLabel } = useCodeMap('CHEMICAL_STATUS')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<Chemical | null>(null)
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const [hazardFilter, setHazardFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const applySearch = () => { setSearchText(searchInput); setPage(0) }
  const [form, setForm] = useState<ChemicalRequest>({ chemicalNameKo: '', hazardClass: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['chemicals', searchText, hazardFilter, statusFilter, page],
    queryFn: () => chemicalApi.search(searchText, hazardFilter, statusFilter, page, 10),
    enabled: viewMode === 'list',
  })

  const invalidateAll = () => { queryClient.invalidateQueries({ queryKey: ['chemicals'] }); queryClient.invalidateQueries({ queryKey: ['chemicalAll'] }) }
  const createMut = useMutation({ mutationFn: (r: ChemicalRequest) => chemicalApi.create(r), onSuccess: () => { invalidateAll(); showSuccess(t('common.saved')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const updateMut = useMutation({ mutationFn: ({ id, r }: { id: number; r: ChemicalRequest }) => chemicalApi.update(id, r), onSuccess: () => { invalidateAll(); showSuccess(t('common.saved')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const deleteMut = useMutation({ mutationFn: (id: number) => chemicalApi.delete(id), onSuccess: () => { invalidateAll(); showSuccess(t('common.deleted')); handleBackToList() }, onError: () => showError(t('common.error')) })

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm({ chemicalNameKo: '', hazardClass: '' }) }
  const handleRowClick = (item: Chemical) => { setSelectedItem(item); setViewMode('detail') }
  const handleOpenCreate = () => { setSelectedItem(null); setForm({ chemicalNameKo: '', hazardClass: '' }); setViewMode('create') }
  const handleOpenEdit = (item: Chemical) => {
    setSelectedItem(item)
    setForm({ chemicalNameKo: item.chemicalNameKo, chemicalNameEn: item.chemicalNameEn, casNumber: item.casNumber, hazardClass: item.hazardClass, status: item.status, storageLocation: item.storageLocation, storageQuantity: item.storageQuantity, unit: item.unit, maxStorageLimit: item.maxStorageLimit, supplier: item.supplier, department: item.department, handler: item.handler, emergencyProcedure: item.emergencyProcedure, ghsPictogram: item.ghsPictogram, signalWord: item.signalWord, hazardStatements: item.hazardStatements, precautionaryStatements: item.precautionaryStatements, notes: item.notes })
    setViewMode('edit')
  }
  const handleSave = () => { if (selectedItem && viewMode === 'edit') updateMut.mutate({ id: selectedItem.id, r: form }); else createMut.mutate(form) }
  const handleDelete = async (item: Chemical) => { const ok = await showConfirm(`${item.chemicalNameKo}\n${t('common.delete')}하시겠습니까?`); if (ok) deleteMut.mutate(item.id) }
  const handleReset = () => { setSearchInput(''); setSearchText(''); setHazardFilter(''); setStatusFilter(''); setPage(0) }

  const items = data?.content || []
  const totalPages = data?.totalPages || 0

  // ==================== DETAIL VIEW ====================
  if (viewMode === 'detail' && selectedItem) {
    const dLabelSx = { ...labelSx, width: 140, minWidth: 140 }
    return (
      <Box>
          {/* PC 2열 */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
            <Box sx={rowSx}><Typography sx={dLabelSx}>{t('chem.nameKo')}</Typography><Box sx={valBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.chemicalNameKo}</Typography></Box><Typography sx={dLabelSx}>{t('chem.nameEn')}</Typography><Box sx={valSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.chemicalNameEn || ''}</Typography></Box></Box>
            <Box sx={rowSx}><Typography sx={dLabelSx}>{t('chem.casNumber')}</Typography><Box sx={valBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.casNumber || ''}</Typography></Box><Typography sx={dLabelSx}>{t('chem.hazardClass')}</Typography><Box sx={valSx}><Typography variant="body2" sx={{ py: 0.5 }}>{getHazardLabel(selectedItem.hazardClass)}</Typography></Box></Box>
            <Box sx={rowSx}><Typography sx={dLabelSx}>{t('chem.quantity')}</Typography><Box sx={valBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.storageQuantity} {selectedItem.unit}</Typography></Box><Typography sx={dLabelSx}>{t('chem.maxLimit')}</Typography><Box sx={valSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.maxStorageLimit ? `${selectedItem.maxStorageLimit} ${selectedItem.unit}` : ''}</Typography></Box></Box>
            <Box sx={rowSx}><Typography sx={dLabelSx}>{t('chem.storageLocation')}</Typography><Box sx={valBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.storageLocation || ''}</Typography></Box><Typography sx={dLabelSx}>{t('chem.status')}</Typography><Box sx={valSx}><Typography variant="body2" sx={{ py: 0.5 }}>{getStatusLabel(selectedItem.status)}</Typography></Box></Box>
            <Box sx={rowSx}><Typography sx={dLabelSx}>{t('chem.supplier')}</Typography><Box sx={valBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.supplier || ''}</Typography></Box><Typography sx={dLabelSx}>{t('chem.department')}</Typography><Box sx={valSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.department || ''}</Typography></Box></Box>
            <Box sx={rowSx}><Typography sx={dLabelSx}>{t('chem.handler')}</Typography><Box sx={valBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.handler || ''}</Typography></Box><Typography sx={dLabelSx}>{t('chem.signalWord')}</Typography><Box sx={valSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.signalWord || ''}</Typography></Box></Box>
            <Box sx={rowSx}><Typography sx={dLabelSx}>{t('chem.lastInspection')}</Typography><Box sx={valBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.lastInspectionDate || ''}</Typography></Box><Typography sx={dLabelSx}>{t('chem.nextInspection')}</Typography><Box sx={valSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.nextInspectionDate || ''}</Typography></Box></Box>
            {selectedItem.ghsPictogram && <Box sx={rowSx}><Typography sx={dLabelSx}>{t('chem.ghsPictogram')}</Typography><Box sx={valSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.ghsPictogram}</Typography></Box></Box>}
            {selectedItem.hazardStatements && <Box sx={rowSx}><Typography sx={dLabelSx}>{t('chem.hazardStatements')}</Typography><Box sx={valSx}><Typography variant="body2" sx={{ py: 0.5, whiteSpace: 'pre-wrap' }}>{selectedItem.hazardStatements}</Typography></Box></Box>}
            {selectedItem.precautionaryStatements && <Box sx={rowSx}><Typography sx={dLabelSx}>{t('chem.precautionaryStatements')}</Typography><Box sx={valSx}><Typography variant="body2" sx={{ py: 0.5, whiteSpace: 'pre-wrap' }}>{selectedItem.precautionaryStatements}</Typography></Box></Box>}
            {selectedItem.emergencyProcedure && <Box sx={{ display: 'flex' }}><Typography sx={dLabelSx}>{t('chem.emergencyProcedure')}</Typography><Box sx={valSx}><Typography variant="body2" sx={{ py: 0.5, whiteSpace: 'pre-wrap' }}>{selectedItem.emergencyProcedure}</Typography></Box></Box>}
          </Box>
          {/* Mobile 1열 */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
            {[[t('chem.nameKo'), selectedItem.chemicalNameKo], [t('chem.nameEn'), selectedItem.chemicalNameEn], [t('chem.casNumber'), selectedItem.casNumber], [t('chem.hazardClass'), getHazardLabel(selectedItem.hazardClass)], [t('chem.status'), getStatusLabel(selectedItem.status)], [t('chem.quantity'), `${selectedItem.storageQuantity} ${selectedItem.unit}`], [t('chem.storageLocation'), selectedItem.storageLocation], [t('chem.supplier'), selectedItem.supplier], [t('chem.handler'), selectedItem.handler], [t('chem.signalWord'), selectedItem.signalWord], [t('chem.emergencyProcedure'), selectedItem.emergencyProcedure]].filter(([, v]) => v).map(([label, value], i) => (
              <Box key={i}><Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography><Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>{value}</Typography></Box>
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
        {/* PC 폼 */}
        <Paper sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
          <Box sx={rowSx}><Typography sx={labelSx}>{t('chem.nameKo')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography><Box sx={valBorderSx}><TextField fullWidth size="small" value={form.chemicalNameKo} onChange={(e) => setForm({ ...form, chemicalNameKo: e.target.value })} /></Box><Typography sx={labelSx}>{t('chem.nameEn')}</Typography><Box sx={valSx}><TextField fullWidth size="small" value={form.chemicalNameEn || ''} onChange={(e) => setForm({ ...form, chemicalNameEn: e.target.value })} /></Box></Box>
          <Box sx={rowSx}><Typography sx={labelSx}>{t('chem.casNumber')}</Typography><Box sx={valBorderSx}><TextField fullWidth size="small" placeholder="ex) 67-64-1" value={form.casNumber || ''} onChange={(e) => setForm({ ...form, casNumber: e.target.value })} /></Box><Typography sx={labelSx}>{t('chem.hazardClass')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography><Box sx={valSx}><Select fullWidth size="small" displayEmpty value={form.hazardClass} onChange={(e) => setForm({ ...form, hazardClass: e.target.value })}><MenuItem value="" disabled>{t('chem.selectHazard')}</MenuItem>{hazardCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getHazardLabel(c.code)}</MenuItem>)}</Select></Box></Box>
          <Box sx={rowSx}><Typography sx={labelSx}>{t('chem.quantity')}</Typography><Box sx={valBorderSx}><NumberField fullWidth size="small" value={form.storageQuantity || ''} onChange={(v) => setForm({ ...form, storageQuantity: v ?? 0 })} /></Box><Typography sx={labelSx}>{t('chem.unit')}</Typography><Box sx={valBorderSx}><Select fullWidth size="small" displayEmpty value={form.unit || ''} onChange={(e) => setForm({ ...form, unit: e.target.value })}><MenuItem value="" disabled>{t('chem.selectUnit')}</MenuItem>{unitCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getUnitLabel(c.code)}</MenuItem>)}</Select></Box><Typography sx={labelSx}>{t('chem.maxLimit')}</Typography><Box sx={valSx}><NumberField fullWidth size="small" value={form.maxStorageLimit || ''} onChange={(v) => setForm({ ...form, maxStorageLimit: v ?? 0 })} /></Box></Box>
          <Box sx={rowSx}><Typography sx={labelSx}>{t('chem.storageLocation')}</Typography><Box sx={valBorderSx}><TextField fullWidth size="small" value={form.storageLocation || ''} onChange={(e) => setForm({ ...form, storageLocation: e.target.value })} /></Box><Typography sx={labelSx}>{t('chem.supplier')}</Typography><Box sx={valSx}><TextField fullWidth size="small" value={form.supplier || ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></Box></Box>
          <Box sx={rowSx}><Typography sx={labelSx}>{t('chem.signalWord')}</Typography><Box sx={valBorderSx}><TextField fullWidth size="small" placeholder="위험 / 경고" value={form.signalWord || ''} onChange={(e) => setForm({ ...form, signalWord: e.target.value })} /></Box><Typography sx={labelSx}>{t('chem.ghsPictogram')}</Typography><Box sx={valSx}><TextField fullWidth size="small" placeholder="GHS02, GHS07" value={form.ghsPictogram || ''} onChange={(e) => setForm({ ...form, ghsPictogram: e.target.value })} /></Box></Box>
          <Box sx={rowSx}><Typography sx={labelSx}>{t('chem.hazardStatements')}</Typography><Box sx={valSx}><TextField fullWidth size="small" multiline rows={2} value={form.hazardStatements || ''} onChange={(e) => setForm({ ...form, hazardStatements: e.target.value })} /></Box></Box>
          <Box sx={rowSx}><Typography sx={labelSx}>{t('chem.precautionaryStatements')}</Typography><Box sx={valSx}><TextField fullWidth size="small" multiline rows={2} value={form.precautionaryStatements || ''} onChange={(e) => setForm({ ...form, precautionaryStatements: e.target.value })} /></Box></Box>
          <Box sx={{ display: 'flex' }}><Typography sx={labelSx}>{t('chem.emergencyProcedure')}</Typography><Box sx={valSx}><TextField fullWidth size="small" multiline rows={2} value={form.emergencyProcedure || ''} onChange={(e) => setForm({ ...form, emergencyProcedure: e.target.value })} /></Box></Box>
        </Paper>
        {/* Mobile 폼 */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('chem.nameKo')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.chemicalNameKo} onChange={(e) => setForm({ ...form, chemicalNameKo: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('chem.nameEn')}
            </Typography>
            <TextField size="small" fullWidth value={form.chemicalNameEn || ''} onChange={(e) => setForm({ ...form, chemicalNameEn: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('chem.casNumber')}
            </Typography>
            <TextField size="small" fullWidth value={form.casNumber || ''} onChange={(e) => setForm({ ...form, casNumber: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('chem.hazardClass')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <FormControl fullWidth size="small">
              <Select displayEmpty value={form.hazardClass} onChange={(e) => setForm({ ...form, hazardClass: e.target.value })}>
                <MenuItem value="" disabled>{t('chem.selectHazard')}</MenuItem>
                {hazardCodes.map(c => <MenuItem key={c.code} value={c.code}>{getHazardLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('chem.quantity')}
            </Typography>
            <NumberField size="small" fullWidth value={form.storageQuantity || ''} onChange={(v) => setForm({ ...form, storageQuantity: v ?? 0 })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('chem.unit')}
            </Typography>
            <FormControl fullWidth size="small">
              <Select displayEmpty value={form.unit || ''} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                <MenuItem value="" disabled>{t('chem.selectUnit')}</MenuItem>
                {unitCodes.map(c => <MenuItem key={c.code} value={c.code}>{getUnitLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('chem.storageLocation')}
            </Typography>
            <TextField size="small" fullWidth value={form.storageLocation || ''} onChange={(e) => setForm({ ...form, storageLocation: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('chem.emergencyProcedure')}
            </Typography>
            <TextField size="small" fullWidth multiline rows={2} value={form.emergencyProcedure || ''} onChange={(e) => setForm({ ...form, emergencyProcedure: e.target.value })} />
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
      {/* 검색 - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ListSearchBar placeholder={t('chem.searchPlaceholder')}
            value={searchInput} onChange={setSearchInput} onSearch={applySearch} sx={{ minWidth: 200 }} />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select displayEmpty value={hazardFilter} onChange={(e) => { setHazardFilter(e.target.value); setPage(0) }}>
              <MenuItem value="">{t('chem.allHazard')}</MenuItem>
              {hazardCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getHazardLabel(c.code)}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}>
              <MenuItem value="">{t('chem.allStatus')}</MenuItem>
              {statusCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
            </Select>
          </FormControl>
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>New</Button>
      </Box>
      {/* 검색 - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
        <ListSearchBar fullWidth placeholder={t('chem.searchPlaceholder')}
          value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <Select displayEmpty value={hazardFilter} onChange={(e) => { setHazardFilter(e.target.value); setPage(0) }}>
              <MenuItem value="">{t('chem.allHazard')}</MenuItem>
              {hazardCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getHazardLabel(c.code)}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ flex: 1 }}>
            <Select displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}>
              <MenuItem value="">{t('chem.allStatus')}</MenuItem>
              {statusCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ flex: 1 }}>New</Button>
        </Box>
      </Box>

      {/* 테이블 */}
      {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      : items.length === 0 ? <Alert severity="info" sx={{ m: 2 }}>{t('common.noData')}</Alert>
      : <>
        {/* PC Table */}
        <Paper sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer>
            <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
              <TableHead><TableRow>
                <TableCell sx={hSx}>{t('chem.nameKo')}</TableCell>
                <TableCell sx={hSx}>{t('chem.casNumber')}</TableCell>
                <TableCell sx={hSx}>{t('chem.hazardClass')}</TableCell>
                <TableCell sx={hSx} align="center">{t('chem.quantity')}</TableCell>
                <TableCell sx={hSx}>{t('chem.storageLocation')}</TableCell>
                <TableCell sx={hSx} align="center">{t('chem.status')}</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{item.chemicalNameKo}</Typography>
                      {item.chemicalNameEn && <Typography variant="caption" color="text.secondary">{item.chemicalNameEn}</Typography>}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.casNumber || ''}</TableCell>
                    <TableCell><Chip label={getHazardLabel(item.hazardClass)} size="small" color="warning" variant="outlined" /></TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', color: item.maxStorageLimit && item.storageQuantity > item.maxStorageLimit ? 'error.main' : 'inherit' }}>
                      {item.storageQuantity} {item.unit}
                      {item.maxStorageLimit && <Typography variant="caption" color="text.secondary" display="block">/ {item.maxStorageLimit}</Typography>}
                    </TableCell>
                    <TableCell>{item.storageLocation || ''}</TableCell>
                    <TableCell align="center"><Chip label={getStatusLabel(item.status)} size="small" color={item.status === 'IN_USE' ? 'success' : item.status === 'PENDING_DISPOSAL' ? 'warning' : 'default'} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        {/* Mobile Card List */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
          {items.map((item) => (
            <Paper key={item.id} sx={{ p: 2, border: 1, borderColor: 'grey.300', cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography fontWeight="bold">{item.chemicalNameKo}</Typography>
                <Chip label={getStatusLabel(item.status)} size="small" color={item.status === 'IN_USE' ? 'success' : item.status === 'PENDING_DISPOSAL' ? 'warning' : 'default'} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {item.casNumber || ''} | {getHazardLabel(item.hazardClass)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.storageQuantity} {item.unit} | {item.storageLocation || ''}
              </Typography>
            </Paper>
          ))}
        </Box>
        {totalPages > 1 && <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><Pagination count={totalPages} page={page + 1} onChange={(_, p) => setPage(p - 1)} color="primary" /></Box>}
      </>}
    </Box>
  )
}

export default ChemicalInventoryTab
