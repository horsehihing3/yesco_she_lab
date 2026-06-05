import { useState } from 'react'
import {
  Box, Typography, TextField, Button, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, Paper, Grid, Pagination, TableContainer, Select, MenuItem, FormControl,
  SelectChangeEvent, IconButton,
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
import { chemicalRegulationApi } from '../../api/chemicalApi'
import type { ChemicalRegulation } from '../../types/chemical.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const statusChipColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
  if (status === 'ACTIVE') return 'success'
  if (status === 'REVIEW_NEEDED') return 'warning'
  if (status === 'EXPIRED') return 'error'
  return 'default'
}

const regTypeChipColor = (type?: string): 'info' | 'secondary' | 'default' => {
  if (type === 'DOMESTIC') return 'info'
  if (type === 'OVERSEAS') return 'secondary'
  return 'default'
}

const headerCellSx = { fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300', wordBreak: 'keep-all' }
const lastHeaderCellSx = { fontWeight: 'bold', wordBreak: 'keep-all' }
const cellBorderSx = { borderRight: 1, borderColor: 'grey.300' }

const labelSx = { width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all' as const }
const valSx = { flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'grey.300' }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'grey.300' }

const emptyForm = { regName: '', regType: '', authority: '', applicableCount: 0, lastRevisionDate: '', nextReviewDate: '', status: 'ACTIVE' }

const RegulationTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<ChemicalRegulation | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [page, setPage] = useState(0)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const applySearch = () => { setKeyword(keywordInput); setPage(0) }
  const [regType, setRegType] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['chemical-regulation', page, keyword, regType],
    queryFn: () => chemicalRegulationApi.search({ keyword, regType, page, size: 10 }),
    enabled: viewMode === 'list',
  })

  const items: ChemicalRegulation[] = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['chemical-regulation'] })
  const createMut = useMutation({ mutationFn: (r: Partial<ChemicalRegulation>) => chemicalRegulationApi.create(r), onSuccess: () => { invalidate(); showSuccess(t('common.saved')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const updateMut = useMutation({ mutationFn: ({ id, r }: { id: number; r: Partial<ChemicalRegulation> }) => chemicalRegulationApi.update(id, r), onSuccess: () => { invalidate(); showSuccess(t('common.saved')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const deleteMut = useMutation({ mutationFn: (id: number) => chemicalRegulationApi.delete(id), onSuccess: () => { invalidate(); showSuccess(t('common.deleted')); handleBackToList() }, onError: () => showError(t('common.error')) })

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm(emptyForm) }
  const handleRowClick = (item: ChemicalRegulation) => { setSelectedItem(item); setViewMode('detail') }
  const handleOpenCreate = () => { setSelectedItem(null); setForm({ ...emptyForm, lastRevisionDate: todayStr(), nextReviewDate: todayStr() }); setViewMode('create') }
  const handleOpenEdit = (item: ChemicalRegulation) => {
    setSelectedItem(item)
    setForm({ regName: item.regName || '', regType: item.regType || '', authority: item.authority || '', applicableCount: item.applicableCount ?? 0, lastRevisionDate: item.lastRevisionDate || '', nextReviewDate: item.nextReviewDate || '', status: item.status || 'ACTIVE' })
    setViewMode('edit')
  }
  const handleSave = () => { if (selectedItem && viewMode === 'edit') updateMut.mutate({ id: selectedItem.id, r: form }); else createMut.mutate(form) }
  const handleDelete = async (item: ChemicalRegulation) => { const ok = await showConfirm(t('common.confirmDelete')); if (ok) deleteMut.mutate(item.id) }

  const handleReset = () => { setKeywordInput(''); setKeyword(''); setRegType(''); setPage(0) }

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: t('chem.reg.statusActive'),
      REVIEW_NEEDED: t('chem.reg.statusReviewNeeded'),
      EXPIRED: t('chem.reg.statusExpired'),
    }
    return map[status] || status
  }

  const getRegTypeLabel = (type?: string) => {
    const map: Record<string, string> = {
      DOMESTIC: t('chem.reg.domestic'),
      OVERSEAS: t('chem.reg.overseas'),
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
              <Typography sx={labelSx}>{t('chem.reg.regCode')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.regCode}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.reg.regName')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.regName}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.reg.regType')}</Typography>
              <Box sx={valBorderSx}><Chip label={getRegTypeLabel(selectedItem.regType)} size="small" color={regTypeChipColor(selectedItem.regType)} /></Box>
              <Typography sx={labelSx}>{t('chem.reg.authority')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.authority || ''}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.reg.applicableCount')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.applicableCount != null ? `${selectedItem.applicableCount}` : ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.erp.status')}</Typography>
              <Box sx={valSx}><Chip label={getStatusLabel(selectedItem.status)} size="small" color={statusChipColor(selectedItem.status)} /></Box>
            </Box>
            <Box sx={{ display: 'flex' }}>
              <Typography sx={labelSx}>{t('chem.reg.lastRevision')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.lastRevisionDate || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.reg.nextReview')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.nextReviewDate || ''}</Typography></Box>
            </Box>
          </Box>
        {/* Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
          {[
            [t('chem.reg.regCode'), selectedItem.regCode],
            [t('chem.reg.regName'), selectedItem.regName],
            [t('chem.reg.regType'), getRegTypeLabel(selectedItem.regType)],
            [t('chem.reg.authority'), selectedItem.authority],
            [t('chem.reg.applicableCount'), selectedItem.applicableCount != null ? `${selectedItem.applicableCount}` : null],
            [t('chem.reg.lastRevision'), selectedItem.lastRevisionDate],
            [t('chem.reg.nextReview'), selectedItem.nextReviewDate],
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
            <Typography sx={labelSx}>{t('chem.reg.regName')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.regName} onChange={e => setForm({ ...form, regName: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.reg.regType')}</Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" value={form.regType} onChange={e => setForm({ ...form, regType: e.target.value })} displayEmpty>
                <MenuItem value="">{t('chem.reg.searchPlaceholder')}</MenuItem>
                <MenuItem value="DOMESTIC">{t('chem.reg.domestic')}</MenuItem>
                <MenuItem value="OVERSEAS">{t('chem.reg.overseas')}</MenuItem>
              </Select>
            </Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.reg.authority')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.authority} onChange={e => setForm({ ...form, authority: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.reg.applicableCount')}</Typography>
            <Box sx={valSx}><NumberField fullWidth size="small" value={form.applicableCount} onChange={(v) => setForm({ ...form, applicableCount: v ?? 0 })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.reg.lastRevision')}</Typography>
            <Box sx={valBorderSx}><DatePickerField value={form.lastRevisionDate || ''} onChange={v => setForm({ ...form, lastRevisionDate: v })} size="small" /></Box>
            <Typography sx={labelSx}>{t('chem.reg.nextReview')}</Typography>
            <Box sx={valSx}><DatePickerField value={form.nextReviewDate || ''} onChange={v => setForm({ ...form, nextReviewDate: v })} size="small" /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.erp.status')}</Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                <MenuItem value="ACTIVE">{t('chem.reg.statusActive')}</MenuItem>
                <MenuItem value="REVIEW_NEEDED">{t('chem.reg.statusReviewNeeded')}</MenuItem>
                <MenuItem value="EXPIRED">{t('chem.reg.statusExpired')}</MenuItem>
              </Select>
            </Box>
          </Box>
        </Paper>
        {/* Mobile Form */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('chem.reg.regName')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.regName} onChange={e => setForm({ ...form, regName: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.reg.regType')}</Typography>
            <Select fullWidth size="small" value={form.regType} onChange={e => setForm({ ...form, regType: e.target.value })} displayEmpty>
              <MenuItem value="">{t('chem.reg.searchPlaceholder')}</MenuItem>
              <MenuItem value="DOMESTIC">{t('chem.reg.domestic')}</MenuItem>
              <MenuItem value="OVERSEAS">{t('chem.reg.overseas')}</MenuItem>
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.reg.authority')}</Typography>
            <TextField size="small" fullWidth value={form.authority} onChange={e => setForm({ ...form, authority: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.reg.applicableCount')}</Typography>
            <NumberField size="small" fullWidth value={form.applicableCount} onChange={(v) => setForm({ ...form, applicableCount: v ?? 0 })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.reg.lastRevision')}</Typography>
            <DatePickerField value={form.lastRevisionDate || ''} onChange={v => setForm({ ...form, lastRevisionDate: v })} size="small" />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.reg.nextReview')}</Typography>
            <DatePickerField value={form.nextReviewDate || ''} onChange={v => setForm({ ...form, nextReviewDate: v })} size="small" />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.erp.status')}</Typography>
            <Select fullWidth size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              <MenuItem value="ACTIVE">{t('chem.reg.statusActive')}</MenuItem>
              <MenuItem value="REVIEW_NEEDED">{t('chem.reg.statusReviewNeeded')}</MenuItem>
              <MenuItem value="EXPIRED">{t('chem.reg.statusExpired')}</MenuItem>
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
            <Typography variant="caption" color="text.secondary">{t('chem.reg.totalRegulation')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="primary">{totalElements}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">{t('chem.reg.applicableCount')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="info.main"></Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">{t('chem.reg.domesticReg')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="success.main"></Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">{t('chem.reg.overseasReg')}</Typography>
            <Typography variant="h5" fontWeight="bold" color="secondary.main"></Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Search - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ListSearchBar placeholder={t('chem.reg.searchPlaceholder')}
            value={keywordInput} onChange={setKeywordInput} onSearch={applySearch}
            sx={{ minWidth: 250 }} />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select value={regType} onChange={(e: SelectChangeEvent) => { setRegType(e.target.value); setPage(0) }} displayEmpty>
              <MenuItem value="">{t('chem.reg.regType')}</MenuItem>
              <MenuItem value="DOMESTIC">{t('chem.reg.domestic')}</MenuItem>
              <MenuItem value="OVERSEAS">{t('chem.reg.overseas')}</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>{t('common.new')}</Button>
      </Box>
      {/* Search - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
        <ListSearchBar fullWidth placeholder={t('chem.reg.searchPlaceholder')}
          value={keywordInput} onChange={setKeywordInput} onSearch={applySearch} />
        <FormControl size="small" fullWidth>
          <Select value={regType} onChange={(e: SelectChangeEvent) => { setRegType(e.target.value); setPage(0) }} displayEmpty>
            <MenuItem value="">{t('chem.reg.regType')}</MenuItem>
            <MenuItem value="DOMESTIC">{t('chem.reg.domestic')}</MenuItem>
            <MenuItem value="OVERSEAS">{t('chem.reg.overseas')}</MenuItem>
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
              <TableCell align="center" sx={headerCellSx}>{t('chem.reg.regCode')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.reg.regName')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.reg.regType')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.reg.authority')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.reg.applicableCount')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.reg.lastRevision')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.reg.nextReview')}</TableCell>
              <TableCell align="center" sx={lastHeaderCellSx}>{t('chem.erp.status')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length > 0 ? items.map((item) => (
              <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                <TableCell align="center" sx={cellBorderSx}>{item.regCode}</TableCell>
                <TableCell sx={cellBorderSx}>{item.regName}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>
                  <Chip label={getRegTypeLabel(item.regType)} size="small" color={regTypeChipColor(item.regType)} />
                </TableCell>
                <TableCell sx={cellBorderSx}>{item.authority || ''}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.applicableCount != null ? `${item.applicableCount}` : ''}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.lastRevisionDate || ''}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.nextReviewDate || ''}</TableCell>
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
              <Typography variant="subtitle2" fontWeight="bold">{item.regName}</Typography>
              <Chip label={getStatusLabel(item.status)} size="small" color={statusChipColor(item.status)} />
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 0.5 }}>
              <Chip label={getRegTypeLabel(item.regType)} size="small" color={regTypeChipColor(item.regType)} sx={{ height: 18, '& .MuiChip-label': { fontSize: '0.65rem' } }} />
              <Typography variant="caption" color="text.secondary">
                {item.regCode} | {item.authority || ''}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {t('chem.reg.applicableCount')}: {item.applicableCount != null ? `${item.applicableCount}` : ''} | {t('chem.reg.nextReview')}: {item.nextReviewDate || ''}
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

export default RegulationTab
