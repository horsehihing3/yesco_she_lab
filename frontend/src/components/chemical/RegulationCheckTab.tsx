import { useState } from 'react'
import {
  Box, Typography, TextField, Button, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, Paper, Grid, Pagination, TableContainer, FormControl, Select,
  MenuItem, SelectChangeEvent, LinearProgress, IconButton,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import DatePickerField from '../common/DatePickerField'
import NumberField from '../common/NumberField'
import { regulationCheckApi } from '../../api/chemicalApi'
import type { RegulationCheck } from '../../types/chemical.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const statusChipColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
  if (status === 'COMPLETED') return 'success'
  if (status === 'IN_PROGRESS') return 'warning'
  if (status === 'PENDING') return 'error'
  return 'default'
}

const checkTypeChipColor = (type?: string): 'info' | 'secondary' | 'default' => {
  if (type === 'REGULAR') return 'info'
  if (type === 'SPECIAL') return 'secondary'
  return 'default'
}

const progressColor = (value: number): 'success' | 'warning' | 'error' | 'primary' => {
  if (value >= 100) return 'success'
  if (value >= 50) return 'primary'
  if (value >= 25) return 'warning'
  return 'error'
}

const headerCellSx = { fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300', wordBreak: 'keep-all' }
const lastHeaderCellSx = { fontWeight: 'bold', wordBreak: 'keep-all' }
const cellBorderSx = { borderRight: 1, borderColor: 'grey.300' }

const labelSx = { width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all' as const }
const valSx = { flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'grey.300' }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'grey.300' }

const emptyForm = { checkName: '', relatedRegulation: '', checkType: '', assignee: '', dueDate: '', progress: 0, status: 'PENDING' }

const RegulationCheckTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<RegulationCheck | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [checkStatus, setCheckStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['regulation-check', page, keyword, checkStatus],
    queryFn: () => regulationCheckApi.search({ keyword, status: checkStatus, page, size: 10 }),
    enabled: viewMode === 'list',
  })

  const items: RegulationCheck[] = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['regulation-check'] })
  const createMut = useMutation({ mutationFn: (r: Partial<RegulationCheck>) => regulationCheckApi.create(r), onSuccess: () => { invalidate(); showSuccess(t('common.saved')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const updateMut = useMutation({ mutationFn: ({ id, r }: { id: number; r: Partial<RegulationCheck> }) => regulationCheckApi.update(id, r), onSuccess: () => { invalidate(); showSuccess(t('common.saved')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const deleteMut = useMutation({ mutationFn: (id: number) => regulationCheckApi.delete(id), onSuccess: () => { invalidate(); showSuccess(t('common.deleted')); handleBackToList() }, onError: () => showError(t('common.error')) })

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm(emptyForm) }
  const handleRowClick = (item: RegulationCheck) => { setSelectedItem(item); setViewMode('detail') }
  const handleOpenCreate = () => { setSelectedItem(null); setForm(emptyForm); setViewMode('create') }
  const handleOpenEdit = (item: RegulationCheck) => {
    setSelectedItem(item)
    setForm({ checkName: item.checkName || '', relatedRegulation: item.relatedRegulation || '', checkType: item.checkType || '', assignee: item.assignee || '', dueDate: item.dueDate || '', progress: item.progress ?? 0, status: item.status || 'PENDING' })
    setViewMode('edit')
  }
  const handleSave = () => { if (selectedItem && viewMode === 'edit') updateMut.mutate({ id: selectedItem.id, r: form }); else createMut.mutate(form) }
  const handleDelete = async (item: RegulationCheck) => { const ok = await showConfirm(t('common.confirmDelete')); if (ok) deleteMut.mutate(item.id) }

  const handleReset = () => { setKeyword(''); setCheckStatus(''); setPage(0) }

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      COMPLETED: t('chem.check.statusCompleted'),
      IN_PROGRESS: t('chem.check.statusInProgress'),
      PENDING: t('chem.check.statusPending'),
    }
    return map[status] || status
  }

  const getCheckTypeLabel = (type?: string) => {
    const map: Record<string, string> = {
      REGULAR: t('chem.check.typeRegular'),
      SPECIAL: t('chem.check.typeSpecial'),
    }
    return map[type || ''] || type || ''
  }

  // ==================== DETAIL VIEW ====================
  if (viewMode === 'detail' && selectedItem) {
    return (
      <Box>
        {/* PC */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.check.checkId')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.checkId}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.check.checkName')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.checkName}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.check.relatedRegulation')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.relatedRegulation || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.check.checkType')}</Typography>
              <Box sx={valSx}><Chip label={getCheckTypeLabel(selectedItem.checkType)} size="small" color={checkTypeChipColor(selectedItem.checkType)} /></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.check.assignee')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.assignee || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.check.dueDate')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.dueDate || ''}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.check.progress')}</Typography>
              <Box sx={valBorderSx}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <LinearProgress variant="determinate" value={selectedItem.progress ?? 0} color={progressColor(selectedItem.progress ?? 0)} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                  <Typography variant="caption">{selectedItem.progress ?? 0}%</Typography>
                </Box>
              </Box>
              <Typography sx={labelSx}>{t('chem.erp.status')}</Typography>
              <Box sx={valSx}><Chip label={getStatusLabel(selectedItem.status)} size="small" color={statusChipColor(selectedItem.status)} /></Box>
            </Box>
          </Box>
        {/* Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
          {[
            [t('chem.check.checkId'), selectedItem.checkId],
            [t('chem.check.checkName'), selectedItem.checkName],
            [t('chem.check.relatedRegulation'), selectedItem.relatedRegulation],
            [t('chem.check.checkType'), getCheckTypeLabel(selectedItem.checkType)],
            [t('chem.check.assignee'), selectedItem.assignee],
            [t('chem.check.dueDate'), selectedItem.dueDate],
            [t('chem.check.progress'), `${selectedItem.progress ?? 0}%`],
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
            <Typography sx={labelSx}>{t('chem.check.checkName')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.checkName} onChange={e => setForm({ ...form, checkName: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.check.relatedRegulation')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.relatedRegulation} onChange={e => setForm({ ...form, relatedRegulation: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.check.checkType')}</Typography>
            <Box sx={valBorderSx}>
              <Select fullWidth size="small" value={form.checkType} onChange={e => setForm({ ...form, checkType: e.target.value })} displayEmpty>
                <MenuItem value="">{t('chem.check.searchPlaceholder')}</MenuItem>
                <MenuItem value="REGULAR">{t('chem.check.typeRegular')}</MenuItem>
                <MenuItem value="SPECIAL">{t('chem.check.typeSpecial')}</MenuItem>
              </Select>
            </Box>
            <Typography sx={labelSx}>{t('chem.check.assignee')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.check.dueDate')}</Typography>
            <Box sx={valBorderSx}><DatePickerField value={form.dueDate || ''} onChange={v => setForm({ ...form, dueDate: v })} size="small" /></Box>
            <Typography sx={labelSx}>{t('chem.check.progress')}</Typography>
            <Box sx={valSx}><NumberField fullWidth size="small" min={0} max={100} value={form.progress} onChange={(v) => setForm({ ...form, progress: v ?? 0 })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.erp.status')}</Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="PENDING">{t('chem.check.statusPending')}</MenuItem>
                <MenuItem value="IN_PROGRESS">{t('chem.check.statusInProgress')}</MenuItem>
                <MenuItem value="COMPLETED">{t('chem.check.statusCompleted')}</MenuItem>
              </Select>
            </Box>
          </Box>
        </Paper>
        {/* Mobile Form */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('chem.check.checkName')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.checkName} onChange={e => setForm({ ...form, checkName: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.check.relatedRegulation')}</Typography>
            <TextField size="small" fullWidth value={form.relatedRegulation} onChange={e => setForm({ ...form, relatedRegulation: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.check.checkType')}</Typography>
            <Select fullWidth size="small" value={form.checkType} onChange={e => setForm({ ...form, checkType: e.target.value })} displayEmpty>
              <MenuItem value="">{t('chem.check.searchPlaceholder')}</MenuItem>
              <MenuItem value="REGULAR">{t('chem.check.typeRegular')}</MenuItem>
              <MenuItem value="SPECIAL">{t('chem.check.typeSpecial')}</MenuItem>
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.check.assignee')}</Typography>
            <TextField size="small" fullWidth value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.check.dueDate')}</Typography>
            <DatePickerField value={form.dueDate || ''} onChange={v => setForm({ ...form, dueDate: v })} size="small" />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.check.progress')}</Typography>
            <NumberField size="small" fullWidth min={0} max={100} value={form.progress} onChange={(v) => setForm({ ...form, progress: v ?? 0 })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.erp.status')}</Typography>
            <Select fullWidth size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <MenuItem value="PENDING">{t('chem.check.statusPending')}</MenuItem>
              <MenuItem value="IN_PROGRESS">{t('chem.check.statusInProgress')}</MenuItem>
              <MenuItem value="COMPLETED">{t('chem.check.statusCompleted')}</MenuItem>
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
            <Typography variant="caption" color="text.secondary">{t('chem.check.totalCheck')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="primary">{totalElements}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">{t('chem.check.completed')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="success.main"></Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">{t('chem.check.inProgress')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="warning.main"></Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">{t('chem.check.pending')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="error"></Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Search - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField size="small" placeholder={t('chem.check.searchPlaceholder')} value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(0) }}
            sx={{ minWidth: 250 }} />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select value={checkStatus} onChange={(e: SelectChangeEvent) => { setCheckStatus(e.target.value); setPage(0) }} displayEmpty>
              <MenuItem value="">{t('chem.erp.status')}</MenuItem>
              <MenuItem value="COMPLETED">{t('chem.check.statusCompleted')}</MenuItem>
              <MenuItem value="IN_PROGRESS">{t('chem.check.statusInProgress')}</MenuItem>
              <MenuItem value="PENDING">{t('chem.check.statusPending')}</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>{t('common.new')}</Button>
      </Box>
      {/* Search - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
        <TextField size="small" fullWidth placeholder={t('chem.check.searchPlaceholder')} value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(0) }} />
        <FormControl size="small" fullWidth>
          <Select value={checkStatus} onChange={(e: SelectChangeEvent) => { setCheckStatus(e.target.value); setPage(0) }} displayEmpty>
            <MenuItem value="">{t('chem.erp.status')}</MenuItem>
            <MenuItem value="COMPLETED">{t('chem.check.statusCompleted')}</MenuItem>
            <MenuItem value="IN_PROGRESS">{t('chem.check.statusInProgress')}</MenuItem>
            <MenuItem value="PENDING">{t('chem.check.statusPending')}</MenuItem>
          </Select>
        </FormControl>
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
              <TableCell align="center" sx={headerCellSx}>{t('chem.check.checkId')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.check.checkName')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.check.relatedRegulation')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.check.checkType')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.check.assignee')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.check.dueDate')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.check.progress')}</TableCell>
              <TableCell align="center" sx={lastHeaderCellSx}>{t('chem.erp.status')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length > 0 ? items.map((item) => (
              <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                <TableCell align="center" sx={cellBorderSx}>{item.checkId}</TableCell>
                <TableCell sx={cellBorderSx}>{item.checkName}</TableCell>
                <TableCell sx={cellBorderSx}>{item.relatedRegulation || ''}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>
                  <Chip label={getCheckTypeLabel(item.checkType)} size="small" color={checkTypeChipColor(item.checkType)} />
                </TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.assignee || ''}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.dueDate || ''}</TableCell>
                <TableCell sx={{ ...cellBorderSx, minWidth: 120 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress variant="determinate" value={item.progress ?? 0} color={progressColor(item.progress ?? 0)} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                    <Typography variant="caption" sx={{ minWidth: 32, textAlign: 'right' }}>{item.progress ?? 0}%</Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Chip label={getStatusLabel(item.status)} size="small" color={statusChipColor(item.status)} />
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
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
              <Typography variant="subtitle2" fontWeight="bold">{item.checkName}</Typography>
              <Chip label={getStatusLabel(item.status)} size="small" color={statusChipColor(item.status)} />
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 0.5 }}>
              <Chip label={getCheckTypeLabel(item.checkType)} size="small" color={checkTypeChipColor(item.checkType)} sx={{ height: 18, '& .MuiChip-label': { fontSize: '0.65rem' } }} />
              <Typography variant="caption" color="text.secondary">
                {item.checkId} | {item.assignee || ''} | {item.dueDate || ''}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <LinearProgress variant="determinate" value={item.progress ?? 0} color={progressColor(item.progress ?? 0)} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
              <Typography variant="caption" color="text.secondary">{item.progress ?? 0}%</Typography>
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

export default RegulationCheckTab
