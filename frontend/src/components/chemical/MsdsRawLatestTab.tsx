import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import useCodeMap from '../../hooks/useCodeMap'
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Chip, Pagination, TextField, Button,
  Select, MenuItem, IconButton, Alert,
  Autocomplete, Chip as MuiChip,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import { useAlert } from '../../contexts/AlertContext'
import { msdsApi } from '../../api/chemicalApi'
import { Msds } from '../../types/chemical.types'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import DevTestFillButton from '../common/DevTestFillButton'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const headerCellSx = { fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }
const lastHeaderCellSx = { fontWeight: 'bold', wordBreak: 'keep-all' }
const cellBorderSx = { borderRight: 1, borderColor: 'divider' }

const labelSx = { width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all' as const }
const valSx = { flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'divider' }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'divider' }

const emptyForm = { itemName: '', casNumber: '', supplier: '', version: '', issueDate: '', language: '', fileSize: '', status: 'VALID', msdsType: 'RAW' as const, isLatest: true }

const MsdsRawLatestTab: React.FC = () => {
  const { codeList: msdsStatusCodes, getLabel: getMsdsStatusLabel } = useCodeMap('MSDS_STATUS')
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { codeList: langCodes, getLabel: getLangLabel } = useCodeMap('MSDS_LANGUAGE')
  const langOptions = langCodes.map(c => ({ code: c.code, label: getLangLabel(c.code) }))

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<Msds | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [page, setPage] = useState(0)
  const [keywordInput, setKeywordInput] = useState('')
  const [, setKeyword] = useState('')
  const applySearch = () => { setKeyword(keywordInput); setPage(0) }

  const { data, isLoading } = useQuery({
    queryKey: ['msds-raw-latest', page],
    queryFn: () => msdsApi.getByType('RAW', true, page, 10),
    enabled: viewMode === 'list',
  })

  const items: Msds[] = data?.content || []
  const totalPages = data?.totalPages || 0

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['msds-raw-latest'] })
  const createMut = useMutation({ mutationFn: (r: Partial<Msds>) => msdsApi.create(r), onSuccess: () => { invalidate(); showSuccess(t('common.saved')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const updateMut = useMutation({ mutationFn: ({ id, r }: { id: number; r: Partial<Msds> }) => msdsApi.update(id, r), onSuccess: () => { invalidate(); showSuccess(t('common.saved')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const deleteMut = useMutation({ mutationFn: (id: number) => msdsApi.delete(id), onSuccess: () => { invalidate(); showSuccess(t('common.deleted')); handleBackToList() }, onError: () => showError(t('common.error')) })

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm(emptyForm) }
  const handleRowClick = (item: Msds) => { setSelectedItem(item); setViewMode('detail') }
  const handleOpenCreate = () => { setSelectedItem(null); setForm({ ...emptyForm, issueDate: todayStr() }); setViewMode('create') }
  const handleOpenEdit = (item: Msds) => {
    setSelectedItem(item)
    setForm({ itemName: item.itemName || '', casNumber: item.casNumber || '', supplier: item.supplier || '', version: item.version || '', issueDate: item.issueDate || '', language: item.language || '', fileSize: item.fileSize || '', status: item.status || 'VALID', msdsType: 'RAW', isLatest: true })
    setViewMode('edit')
  }
  const handleSave = () => { if (selectedItem && viewMode === 'edit') updateMut.mutate({ id: selectedItem.id, r: form }); else createMut.mutate(form) }
  const handleDelete = async (item: Msds) => { const ok = await showConfirm(t('common.confirmDelete')); if (ok) deleteMut.mutate(item.id) }
  const handleReset = () => { setKeywordInput(''); setKeyword(''); setPage(0) }

  // DEV ONLY — 비어있는 항목을 원료 MSDS 최신본 더미데이터로 채움 (입력값 보존)
  const fillTestData = () => setForm(prev => ({
    ...prev,
    itemName: prev.itemName || '톨루엔',
    casNumber: prev.casNumber || '108-88-3',
    supplier: prev.supplier || '대한화학공업(주)',
    version: prev.version || '2.0',
    issueDate: prev.issueDate || todayStr(),
  }))

  // ==================== DETAIL VIEW ====================
  if (viewMode === 'detail' && selectedItem) {
    return (
      <Box>
        {/* PC */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.msds.itemName', '원료명/제품명')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.itemName}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.msds.casNumber', 'CAS No.')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.casNumber || ''}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.msds.supplier', '공급사')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.supplier || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.msds.version', '버전')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.version || ''}</Typography></Box>
            </Box>
            <Box sx={rowSx}>
              <Typography sx={labelSx}>{t('chem.msds.issueDate', '발행일')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.issueDate || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.msds.language', '언어')}</Typography>
              <Box sx={valSx}><Typography variant="body2">{selectedItem.language || ''}</Typography></Box>
            </Box>
            <Box sx={{ display: 'flex' }}>
              <Typography sx={labelSx}>{t('chem.msds.fileSize', '파일 크기')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2">{selectedItem.fileSize || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('chem.msds.status', '상태')}</Typography>
              <Box sx={valSx}><Chip label={getMsdsStatusLabel(selectedItem.status)} size="small" color={selectedItem.status === 'VALID' ? 'success' : 'warning'} /></Box>
            </Box>
          </Box>
        {/* Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
          {[
            [t('chem.msds.itemName', '원료명/제품명'), selectedItem.itemName],
            [t('chem.msds.casNumber', 'CAS No.'), selectedItem.casNumber],
            [t('chem.msds.supplier', '공급사'), selectedItem.supplier],
            [t('chem.msds.version', '버전'), selectedItem.version],
            [t('chem.msds.issueDate', '발행일'), selectedItem.issueDate],
            [t('chem.msds.language', '언어'), selectedItem.language],
            [t('chem.msds.fileSize', '파일 크기'), selectedItem.fileSize],
            [t('chem.msds.status', '상태'), getMsdsStatusLabel(selectedItem.status)],
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
        <Paper sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.msds.itemName', '원료명/제품명')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.msds.casNumber', 'CAS No.')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.casNumber} onChange={e => setForm({ ...form, casNumber: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.msds.supplier', '공급사')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.msds.version', '버전')}</Typography>
            <Box sx={valSx}><TextField fullWidth size="small" value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} /></Box>
          </Box>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('chem.msds.issueDate', '발행일')}</Typography>
            <Box sx={valBorderSx}><DatePickerField value={form.issueDate} onChange={(v: string) => setForm({ ...form, issueDate: v })} size="small" fullWidth /></Box>
            <Typography sx={labelSx}>{t('chem.msds.language', '언어')}</Typography>
            <Box sx={valSx}><Autocomplete
  multiple
  size="small"
  options={langOptions}
  getOptionLabel={(option) => option.label}
  value={langOptions.filter(o => (form.language || '').split(' / ').includes(o.code))}
  onChange={(_, selected) => setForm({ ...form, language: selected.map(s => s.code).join(' / ') })}
  renderTags={(value, getTagProps) => value.map((option, index) => <MuiChip {...getTagProps({ index })} key={option.code} label={option.code} size="small" />)}
  renderInput={(params) => <TextField {...params} size="small" />}
  fullWidth
/></Box>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Typography sx={labelSx}>{t('chem.msds.fileSize', '파일 크기')}</Typography>
            <Box sx={valBorderSx}><TextField fullWidth size="small" value={form.fileSize} onChange={e => setForm({ ...form, fileSize: e.target.value })} /></Box>
            <Typography sx={labelSx}>{t('chem.msds.status', '상태')}</Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {msdsStatusCodes.map(c => <MenuItem key={c.code} value={c.code}>{getMsdsStatusLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
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
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.msds.supplier', '공급사')}</Typography>
            <TextField size="small" fullWidth value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.msds.version', '버전')}</Typography>
            <TextField size="small" fullWidth value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.msds.issueDate', '발행일')}</Typography>
            <DatePickerField value={form.issueDate} onChange={(v: string) => setForm({ ...form, issueDate: v })} size="small" fullWidth />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.msds.language', '언어')}</Typography>
            <Autocomplete
  multiple
  size="small"
  options={langOptions}
  getOptionLabel={(option) => option.label}
  value={langOptions.filter(o => (form.language || '').split(' / ').includes(o.code))}
  onChange={(_, selected) => setForm({ ...form, language: selected.map(s => s.code).join(' / ') })}
  renderTags={(value, getTagProps) => value.map((option, index) => <MuiChip {...getTagProps({ index })} key={option.code} label={option.code} size="small" />)}
  renderInput={(params) => <TextField {...params} size="small" />}
  fullWidth
/>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.msds.fileSize', '파일 크기')}</Typography>
            <TextField size="small" fullWidth value={form.fileSize} onChange={e => setForm({ ...form, fileSize: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('chem.msds.status', '상태')}</Typography>
            <Select fullWidth size="small" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              {msdsStatusCodes.map(c => <MenuItem key={c.code} value={c.code}>{getMsdsStatusLabel(c.code)}</MenuItem>)}
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
      <Alert severity="info" sx={{ mb: 2 }}>
        {t('chem.msds.latestInfo', '최신본은 현재 유효한 MSDS 문서입니다.')}
      </Alert>

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
      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', overflowX: 'auto' }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={headerCellSx}>{t('chem.msds.itemName', '원료명/제품명')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.msds.casNumber', 'CAS No.')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.msds.supplier', '공급사')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.msds.version', '버전')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.msds.issueDate', '발행일')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.msds.language', '언어')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('chem.msds.fileSize', '파일 크기')}</TableCell>
              <TableCell align="center" sx={lastHeaderCellSx}>{t('chem.msds.status', '상태')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length > 0 ? items.map((item) => (
              <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                <TableCell sx={cellBorderSx}><Typography variant="body2" fontWeight={600}>{item.itemName}</Typography></TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.casNumber || ''}</TableCell>
                <TableCell sx={cellBorderSx}>{item.supplier || ''}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.version || ''}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.issueDate || ''}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.language || ''}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.fileSize || ''}</TableCell>
                <TableCell align="center"><Chip label={getMsdsStatusLabel(item.status)} size="small" color={item.status === 'VALID' ? 'success' : item.status === 'NEED_UPDATE' ? 'warning' : 'default'} /></TableCell>
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
              <Typography variant="subtitle2" fontWeight="bold">{item.itemName}</Typography>
              <Chip label={getMsdsStatusLabel(item.status)} size="small" color={item.status === 'VALID' ? 'success' : 'warning'} />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {item.casNumber || ''} | {item.supplier || ''} | v{item.version || ''}
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

export default MsdsRawLatestTab
