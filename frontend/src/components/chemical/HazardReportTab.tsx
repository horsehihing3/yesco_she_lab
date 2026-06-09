import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Button, Chip, Pagination,
  CircularProgress, Alert, Grid, Select, MenuItem, IconButton,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import { useAlert } from '../../contexts/AlertContext'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import { chemicalHazardReportApi } from '../../api/chemicalApi'
import { ChemicalHazardReport } from '../../types/chemical.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const hSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

const hazardClassColorMap: Record<string, 'error' | 'warning'> = {
  '발암성': 'error',
  '부식성': 'warning',
}

const labelSx = { width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem' }
const valSx = { flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'divider' }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'divider' }

const emptyForm = { reportYear: new Date().getFullYear(), chemicalName: '', casNumber: '', hazardClass: '', annualHandling: '', handlingFacility: '', reportDeadline: '', submitDate: '', status: 'COLLECTING' }

const HazardReportTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<ChemicalHazardReport | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [page, setPage] = useState(0)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const applySearch = () => { setKeyword(keywordInput); setPage(0) }

  const { data, isLoading } = useQuery({
    queryKey: ['chemicalHazardReports', page, keyword],
    queryFn: () => chemicalHazardReportApi.getAll(page, 10),
    enabled: viewMode === 'list',
  })

  const items: ChemicalHazardReport[] = data?.content || []
  const totalPages = data?.totalPages || 0

  const chemicalCount = new Set(items.map(r => r.chemicalName)).size
  const annualHandlingTotal = items.length
  const facilityCount = new Set(items.map(r => r.handlingFacility).filter(Boolean)).size
  const managerCount = 0

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['chemicalHazardReports'] })
  const createMut = useMutation({ mutationFn: (r: Partial<ChemicalHazardReport>) => chemicalHazardReportApi.create(r), onSuccess: () => { invalidate(); showSuccess(t('common.saved')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const updateMut = useMutation({ mutationFn: ({ id, r }: { id: number; r: Partial<ChemicalHazardReport> }) => chemicalHazardReportApi.update(id, r), onSuccess: () => { invalidate(); showSuccess(t('common.saved')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const deleteMut = useMutation({ mutationFn: (id: number) => chemicalHazardReportApi.delete(id), onSuccess: () => { invalidate(); showSuccess(t('common.deleted')); handleBackToList() }, onError: () => showError(t('common.error')) })

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm(emptyForm) }
  const handleRowClick = (item: ChemicalHazardReport) => { setSelectedItem(item); setViewMode('detail') }
  const handleOpenCreate = () => { setSelectedItem(null); setForm({ ...emptyForm, reportDeadline: todayStr(), submitDate: todayStr() }); setViewMode('create') }
  const handleOpenEdit = (item: ChemicalHazardReport) => {
    setSelectedItem(item)
    setForm({ reportYear: item.reportYear, chemicalName: item.chemicalName || '', casNumber: item.casNumber || '', hazardClass: item.hazardClass || '', annualHandling: item.annualHandling || '', handlingFacility: item.handlingFacility || '', reportDeadline: item.reportDeadline || '', submitDate: item.submitDate || '', status: item.status || 'COLLECTING' })
    setViewMode('edit')
  }
  const handleSave = () => { if (selectedItem && viewMode === 'edit') updateMut.mutate({ id: selectedItem.id, r: form }); else createMut.mutate(form) }
  const handleDelete = async (item: ChemicalHazardReport) => { const ok = await showConfirm(`${item.chemicalName}\n${t('common.delete')}하시겠습니까?`); if (ok) deleteMut.mutate(item.id) }

  const handleReset = () => { setKeywordInput(''); setKeyword(''); setPage(0) }

  const getHazardClassChip = (cls?: string) => {
    if (!cls) return ''
    const color = hazardClassColorMap[cls] || 'default'
    return <Chip label={cls} size="small" color={color} />
  }

  const getStatusChip = (status: string) => {
    const statusMap: Record<string, { color: 'success' | 'primary'; label: string }> = {
      SUBMITTED: { color: 'success', label: t('chem.hazardReport.statusSubmitted') },
      COLLECTING: { color: 'primary', label: t('chem.hazardReport.statusCollecting') },
    }
    const info = statusMap[status]
    if (!info) return <Chip label={status} size="small" />
    return <Chip label={info.label} size="small" color={info.color} />
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      SUBMITTED: t('chem.hazardReport.statusSubmitted'),
      COLLECTING: t('chem.hazardReport.statusCollecting'),
    }
    return statusMap[status] || status
  }

  // ==================== DETAIL VIEW ====================
  if (viewMode === 'detail' && selectedItem) {
    return (
      <Box>
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
            <Box sx={rowSx}><Typography sx={labelSx}>{t('chem.hazardReport.reportYear')}</Typography><Box sx={valBorderSx}><Typography variant="body2">{selectedItem.reportYear}</Typography></Box><Typography sx={labelSx}>{t('chem.hazardReport.chemicalName')}</Typography><Box sx={valSx}><Typography variant="body2">{selectedItem.chemicalName}</Typography></Box></Box>
            <Box sx={rowSx}><Typography sx={labelSx}>{t('chem.casNumber')}</Typography><Box sx={valBorderSx}><Typography variant="body2">{selectedItem.casNumber || ''}</Typography></Box><Typography sx={labelSx}>{t('chem.hazardReport.hazardClass')}</Typography><Box sx={valSx}>{getHazardClassChip(selectedItem.hazardClass)}</Box></Box>
            <Box sx={rowSx}><Typography sx={labelSx}>{t('chem.hazardReport.annualHandling')}</Typography><Box sx={valBorderSx}><Typography variant="body2">{selectedItem.annualHandling || ''}</Typography></Box><Typography sx={labelSx}>{t('chem.hazardReport.handlingFacility')}</Typography><Box sx={valSx}><Typography variant="body2">{selectedItem.handlingFacility || ''}</Typography></Box></Box>
            <Box sx={rowSx}><Typography sx={labelSx}>{t('chem.hazardReport.reportDeadline')}</Typography><Box sx={valBorderSx}><Typography variant="body2">{selectedItem.reportDeadline || ''}</Typography></Box><Typography sx={labelSx}>{t('chem.hazardReport.submitDate')}</Typography><Box sx={valSx}><Typography variant="body2">{selectedItem.submitDate || ''}</Typography></Box></Box>
            <Box sx={{ display: 'flex' }}><Typography sx={labelSx}>{t('chem.status')}</Typography><Box sx={valSx}>{getStatusChip(selectedItem.status)}</Box></Box>
          </Box>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
            {[[t('chem.hazardReport.reportYear'), selectedItem.reportYear?.toString()], [t('chem.hazardReport.chemicalName'), selectedItem.chemicalName], [t('chem.casNumber'), selectedItem.casNumber], [t('chem.hazardReport.hazardClass'), selectedItem.hazardClass], [t('chem.hazardReport.annualHandling'), selectedItem.annualHandling], [t('chem.hazardReport.handlingFacility'), selectedItem.handlingFacility], [t('chem.hazardReport.reportDeadline'), selectedItem.reportDeadline], [t('chem.hazardReport.submitDate'), selectedItem.submitDate], [t('chem.status'), getStatusLabel(selectedItem.status)]].filter(([, v]) => v).map(([label, value], i) => (
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
            <Typography sx={labelSx}>{t('chem.hazardReport.reportYear')}</Typography>
            <Box sx={valBorderSx}><NumberField fullWidth size="small" thousandSeparator={false} value={form.reportYear} onChange={(v) => setForm({ ...form, reportYear: v ?? 0 })} /></Box>
            <Typography sx={labelSx}>{t('chem.hazardReport.chemicalName')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.chemicalName} onChange={e => setForm({ ...form, chemicalName: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.casNumber')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.casNumber} onChange={e => setForm({ ...form, casNumber: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.hazardReport.hazardClass')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.hazardClass} onChange={e => setForm({ ...form, hazardClass: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.hazardReport.annualHandling')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.annualHandling} onChange={e => setForm({ ...form, annualHandling: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.hazardReport.handlingFacility')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.handlingFacility} onChange={e => setForm({ ...form, handlingFacility: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.hazardReport.reportDeadline')}</Typography>
            <Box sx={valBorderSx}><DatePickerField value={form.reportDeadline || ''} onChange={v => setForm({ ...form, reportDeadline: v })} size="small" /></Box>
            <Typography sx={labelSx}>{t('chem.hazardReport.submitDate')}</Typography>
            <Box sx={valSx}><DatePickerField value={form.submitDate || ''} onChange={v => setForm({ ...form, submitDate: v })} size="small" /></Box>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Typography sx={labelSx}>{t('chem.status')}</Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                <MenuItem value="COLLECTING">{t('chem.hazardReport.statusCollecting')}</MenuItem>
                <MenuItem value="SUBMITTED">{t('chem.hazardReport.statusSubmitted')}</MenuItem>
              </Select>
            </Box>
          </Box>
        </Paper>
        {/* Mobile Form */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.hazardReport.reportYear')}</Typography>
            <NumberField size="small" fullWidth thousandSeparator={false} value={form.reportYear} onChange={(v) => setForm({ ...form, reportYear: v ?? 0 })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('chem.hazardReport.chemicalName')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.chemicalName} onChange={e => setForm({ ...form, chemicalName: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.casNumber')}</Typography>
            <TextField size="small" fullWidth value={form.casNumber} onChange={e => setForm({ ...form, casNumber: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.hazardReport.hazardClass')}</Typography>
            <TextField size="small" fullWidth value={form.hazardClass} onChange={e => setForm({ ...form, hazardClass: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.hazardReport.annualHandling')}</Typography>
            <TextField size="small" fullWidth value={form.annualHandling} onChange={e => setForm({ ...form, annualHandling: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.hazardReport.handlingFacility')}</Typography>
            <TextField size="small" fullWidth value={form.handlingFacility} onChange={e => setForm({ ...form, handlingFacility: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.hazardReport.reportDeadline')}</Typography>
            <DatePickerField value={form.reportDeadline || ''} onChange={v => setForm({ ...form, reportDeadline: v })} size="small" />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.hazardReport.submitDate')}</Typography>
            <DatePickerField value={form.submitDate || ''} onChange={v => setForm({ ...form, submitDate: v })} size="small" />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.status')}</Typography>
            <Select fullWidth size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              <MenuItem value="COLLECTING">{t('chem.hazardReport.statusCollecting')}</MenuItem>
              <MenuItem value="SUBMITTED">{t('chem.hazardReport.statusSubmitted')}</MenuItem>
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
          <Paper sx={(theme: any) => ({ p: 2, textAlign: 'center', ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }) })}>
            <Typography variant="caption" color="text.secondary">{t('chem.hazardReport.totalHazardous')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="error.main">{chemicalCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={(theme: any) => ({ p: 2, textAlign: 'center', ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }) })}>
            <Typography variant="caption" color="text.secondary">{t('chem.hazardReport.annualHandlingTotal')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="primary.main">{annualHandlingTotal}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={(theme: any) => ({ p: 2, textAlign: 'center', ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }) })}>
            <Typography variant="caption" color="text.secondary">{t('chem.hazardReport.facilityCount')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="info.main">{facilityCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={(theme: any) => ({ p: 2, textAlign: 'center', ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }) })}>
            <Typography variant="caption" color="text.secondary">{t('chem.hazardReport.managerCount')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="success.main">{managerCount}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Search - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ListSearchBar placeholder={t('chem.hazardReport.searchPlaceholder')}
            value={keywordInput} onChange={setKeywordInput} onSearch={applySearch}
            sx={{ minWidth: 250 }} />
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>{t('common.new')}</Button>
      </Box>
      {/* Search - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
        <ListSearchBar fullWidth placeholder={t('chem.hazardReport.searchPlaceholder')}
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
                    <TableCell sx={hSx}>{t('chem.hazardReport.reportYear')}</TableCell>
                    <TableCell sx={hSx}>{t('chem.hazardReport.chemicalName')}</TableCell>
                    <TableCell sx={hSx}>{t('chem.casNumber')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('chem.hazardReport.hazardClass')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('chem.hazardReport.annualHandling')}</TableCell>
                    <TableCell sx={hSx}>{t('chem.hazardReport.handlingFacility')}</TableCell>
                    <TableCell sx={hSx}>{t('chem.hazardReport.reportDeadline')}</TableCell>
                    <TableCell sx={hSx}>{t('chem.hazardReport.submitDate')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('chem.status')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                      <TableCell>{item.reportYear}</TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>{item.chemicalName}</Typography></TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.casNumber || ''}</TableCell>
                      <TableCell align="center">{getHazardClassChip(item.hazardClass)}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{item.annualHandling || ''}</TableCell>
                      <TableCell>{item.handlingFacility || ''}</TableCell>
                      <TableCell>{item.reportDeadline || ''}</TableCell>
                      <TableCell>{item.submitDate || ''}</TableCell>
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

export default HazardReportTab
