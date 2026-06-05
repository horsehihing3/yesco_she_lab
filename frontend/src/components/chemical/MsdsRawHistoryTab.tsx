import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import useCodeMap from '../../hooks/useCodeMap'
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Chip, Pagination, TextField, Button,
  Select, MenuItem, IconButton,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import { useAlert } from '../../contexts/AlertContext'
import { msdsApi } from '../../api/chemicalApi'
import { Msds } from '../../types/chemical.types'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const headerCellSx = { fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300', wordBreak: 'keep-all' }
const lastHeaderCellSx = { fontWeight: 'bold', wordBreak: 'keep-all' }
const cellBorderSx = { borderRight: 1, borderColor: 'grey.300' }

const labelSx = { width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all' as const }
const valSx = { flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'grey.300' }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'grey.300' }

const emptyForm = { itemName: '', casNumber: '', version: '', changeType: 'LATEST', changeSummary: '', registeredBy: '', issueDate: '', msdsType: 'RAW' as const }

const MsdsRawHistoryTab: React.FC = () => {
  const { codeList: changeTypeCodes, getLabel: getChangeTypeLabel } = useCodeMap('MSDS_CHANGE_TYPE')
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<Msds | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [page, setPage] = useState(0)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const applySearch = () => { setKeyword(keywordInput); setPage(0) }

  const { data, isLoading } = useQuery({
    queryKey: ['msds-raw-history', page, keyword],
    queryFn: () => msdsApi.search({ msdsType: 'RAW', keyword: keyword || undefined, page, size: 10 }),
    enabled: viewMode === 'list',
  })

  const items: Msds[] = data?.content || []
  const totalPages = data?.totalPages || 0

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['msds-raw-history'] })
  const createMut = useMutation({ mutationFn: (r: Partial<Msds>) => msdsApi.create(r), onSuccess: () => { invalidate(); showSuccess(t('common.saved')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const updateMut = useMutation({ mutationFn: ({ id, r }: { id: number; r: Partial<Msds> }) => msdsApi.update(id, r), onSuccess: () => { invalidate(); showSuccess(t('common.saved')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const deleteMut = useMutation({ mutationFn: (id: number) => msdsApi.delete(id), onSuccess: () => { invalidate(); showSuccess(t('common.deleted')); handleBackToList() }, onError: () => showError(t('common.error')) })

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm(emptyForm) }
  const handleRowClick = (item: Msds) => { setSelectedItem(item); setViewMode('detail') }
  const handleOpenCreate = () => { setSelectedItem(null); setForm({ ...emptyForm, issueDate: todayStr() }); setViewMode('create') }
  const handleOpenEdit = (item: Msds) => {
    setSelectedItem(item)
    setForm({ itemName: item.itemName || '', casNumber: item.casNumber || '', version: item.version || '', changeType: item.isLatest ? 'LATEST' : 'OLD', changeSummary: item.changeSummary || '', registeredBy: item.registeredBy || '', issueDate: item.issueDate || '', msdsType: 'RAW' })
    setViewMode('edit')
  }
  const handleSave = () => {
    const payload = { ...form, isLatest: form.changeType === 'LATEST' }
    if (selectedItem && viewMode === 'edit') updateMut.mutate({ id: selectedItem.id, r: payload }); else createMut.mutate(payload)
  }
  const handleDelete = async (item: Msds) => { const ok = await showConfirm(t('common.confirmDelete')); if (ok) deleteMut.mutate(item.id) }
  const handleReset = () => { setKeywordInput(''); setKeyword(''); setPage(0) }

  // ==================== DETAIL VIEW ====================
  if (viewMode === 'detail' && selectedItem) {
    return (
      <Box>
        {/* PC */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.msds.itemName', '원료명/제품명')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.itemName}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.msds.casNumber', 'CAS No.')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.casNumber || ''}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.msds.version', '버전')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.version || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.msds.changeType', '변경 유형')}</Typography>
              <Box sx={valSx}><Chip label={getChangeTypeLabel(selectedItem.isLatest ? 'LATEST' : 'OLD')} size="small" color={selectedItem.isLatest ? 'primary' : 'default'} /></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.msds.changeSummary', '변경 내용')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.changeSummary || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.msds.registeredBy', '등록자')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.registeredBy || ''}</Typography></Box>
            </Box>
            <Box sx={{ display: 'flex' }}>
              <Typography sx={labelSx}>{t('chem.msds.issueDate', '발행일')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.issueDate || ''}</Typography></Box>
            </Box>
          </Box>
        {/* Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
          {[
            [t('chem.msds.itemName', '원료명/제품명'), selectedItem.itemName],
            [t('chem.msds.casNumber', 'CAS No.'), selectedItem.casNumber],
            [t('chem.msds.version', '버전'), selectedItem.version],
            [t('chem.msds.changeType', '변경 유형'), getChangeTypeLabel(selectedItem.isLatest ? 'LATEST' : 'OLD')],
            [t('chem.msds.changeSummary', '변경 내용'), selectedItem.changeSummary],
            [t('chem.msds.registeredBy', '등록자'), selectedItem.registeredBy],
            [t('chem.msds.issueDate', '발행일'), selectedItem.issueDate],
          ].map(([label, value], i) => (
            <Box key={i}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography>
              <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{value || ''}</Typography>
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
            <Typography sx={labelSx}>{t('chem.msds.itemName', '원료명/제품명')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.msds.casNumber', 'CAS No.')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.casNumber} onChange={e => setForm({ ...form, casNumber: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.msds.version', '버전')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.msds.changeType', '변경 유형')}</Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" value={form.changeType} onChange={e => setForm({ ...form, changeType: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {changeTypeCodes.map(c => <MenuItem key={c.code} value={c.code}>{getChangeTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.msds.changeSummary', '변경 내용')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.changeSummary} onChange={e => setForm({ ...form, changeSummary: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.msds.registeredBy', '등록자')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.registeredBy} onChange={e => setForm({ ...form, registeredBy: e.target.value })} /></Box>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Typography sx={labelSx}>{t('chem.msds.issueDate', '발행일')}</Typography>
            <Box sx={valSx}><DatePickerField value={form.issueDate} onChange={(v: string) => setForm({ ...form, issueDate: v })} size="small" fullWidth /></Box>
          </Box>
        </Paper>
        {/* Mobile Form */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('chem.msds.itemName', '원료명/제품명')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.msds.casNumber', 'CAS No.')}</Typography>
            <TextField size="small" fullWidth value={form.casNumber} onChange={e => setForm({ ...form, casNumber: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.msds.version', '버전')}</Typography>
            <TextField size="small" fullWidth value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.msds.changeType', '변경 유형')}</Typography>
            <Select fullWidth size="small" value={form.changeType} onChange={e => setForm({ ...form, changeType: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              {changeTypeCodes.map(c => <MenuItem key={c.code} value={c.code}>{getChangeTypeLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.msds.changeSummary', '변경 내용')}</Typography>
            <TextField size="small" fullWidth value={form.changeSummary} onChange={e => setForm({ ...form, changeSummary: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.msds.registeredBy', '등록자')}</Typography>
            <TextField size="small" fullWidth value={form.registeredBy} onChange={e => setForm({ ...form, registeredBy: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.msds.issueDate', '발행일')}</Typography>
            <DatePickerField value={form.issueDate} onChange={(v: string) => setForm({ ...form, issueDate: v })} size="small" fullWidth />
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
      {/* Search - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ListSearchBar placeholder={t('chem.msds.searchRawPlaceholder')}
            value={keywordInput} onChange={setKeywordInput} onSearch={applySearch}
            sx={{ minWidth: 250 }} />
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>{t('common.new')}</Button>
      </Box>
      {/* Search - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
        <ListSearchBar fullWidth placeholder={t('chem.msds.searchRawPlaceholder')}
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
              <TableCell align="center" sx={headerCellSx}>{t('chem.msds.itemName', '원료명/제품명')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.msds.casNumber', 'CAS No.')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.msds.version', '버전')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.msds.changeType', '변경 유형')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.msds.changeSummary', '변경 내용')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.msds.registeredBy', '등록자')}</TableCell>
              <TableCell align="center" sx={lastHeaderCellSx}>{t('chem.msds.issueDate', '발행일')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length > 0 ? items.map((item) => (
              <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                <TableCell sx={cellBorderSx}><Typography variant="body2" fontWeight={600}>{item.itemName}</Typography></TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.casNumber || ''}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.version || ''}</TableCell>
                <TableCell align="center" sx={cellBorderSx}><Chip label={getChangeTypeLabel(item.isLatest ? 'LATEST' : 'OLD')} size="small" color={item.isLatest ? 'primary' : 'default'} /></TableCell>
                <TableCell sx={cellBorderSx}>{item.changeSummary || ''}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.registeredBy || ''}</TableCell>
                <TableCell align="center">{item.issueDate || item.createdAt?.substring(0, 10) || ''}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
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
              <Typography variant="subtitle2" fontWeight="bold">{item.itemName}</Typography>
              <Chip label={getChangeTypeLabel(item.isLatest ? 'LATEST' : 'OLD')} size="small" color={item.isLatest ? 'primary' : 'default'} />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {item.casNumber || ''} | v{item.version || ''} | {item.registeredBy || ''}
            </Typography>
          </Paper>
        )) : (
          <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
            {isLoading ? t('common.loading') : t('common.noData')}
          </Typography>
        )}
      </Box>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination count={totalPages} page={page + 1} onChange={(_, p) => setPage(p - 1)} color="primary" />
        </Box>
      )}
    </Box>
  )
}

export default MsdsRawHistoryTab
