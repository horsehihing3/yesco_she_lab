import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import {
  Box, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Pagination, IconButton, FormControl, Select, MenuItem, SelectChangeEvent, Chip,
} from '@mui/material'
import NumberField from '../common/NumberField'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import { useCodeMap } from '../../hooks/useCodeMap'
import { carbonEmissionApi } from '../../api/carbonApi'
import { CarbonEmission, CarbonEmissionRequest } from '../../types/carbon.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const scopeChipColor = (scope?: number): 'success' | 'info' | 'warning' | 'default' => {
  if (scope === 1) return 'success'
  if (scope === 2) return 'info'
  if (scope === 3) return 'warning'
  return 'default'
}

const headerCellSx = { fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300', wordBreak: 'keep-all' }
const lastHeaderCellSx = { fontWeight: 'bold', wordBreak: 'keep-all' }
const cellBorderSx = { borderRight: 1, borderColor: 'grey.300' }

const CarbonEmissionTab: React.FC = () => {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const { showConfirm, showSuccess } = useAlert()
  const { codeList: scopeCodes, getLabel: getScopeLabel } = useCodeMap('EMISSION_SCOPE')
  const { codeList: unitCodes, getLabel: getUnitLabel } = useCodeMap('FACTOR_UNIT')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<CarbonEmission | null>(null)
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedManager, setSelectedManager] = useState<UserInfo | null>(null)

  const getManagerDisplayName = (user: UserInfo | null) => {
    if (!user) return ''
    const lang = i18n.language
    if (lang === 'en' && user.nameEn) return user.nameEn
    if (lang === 'zh' && user.nameZh) return user.nameZh
    return user.name
  }
  const [formData, setFormData] = useState<CarbonEmissionRequest>({
    recordDate: '',
    sourceName: '',
    scope: 1,
    energyUsage: null,
    energyUnit: null,
    co2Emission: 0,
    factorId: null,
    manager: null,
    remark: null,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['carbonEmission', page, searchQuery],
    queryFn: () => searchQuery
      ? carbonEmissionApi.search(searchQuery, page, 20)
      : carbonEmissionApi.findAll(page, 20),
  })

  const createMutation = useMutation({
    mutationFn: (data: CarbonEmissionRequest) => carbonEmissionApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carbonEmission'] })
      showSuccess(t('common.saveSuccess'))
      setViewMode('list')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CarbonEmissionRequest }) => carbonEmissionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carbonEmission'] })
      showSuccess(t('common.saveSuccess'))
      setViewMode('list')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => carbonEmissionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carbonEmission'] })
      showSuccess(t('common.deleteSuccess'))
      setViewMode('list')
    },
  })

  const handleSearch = () => { setSearchQuery(searchText); setPage(0) }
  const handleReset = () => { setSearchText(''); setSearchQuery(''); setPage(0) }

  const handleAddClick = () => {
    setSelectedItem(null)
    setFormData({
      recordDate: todayStr(),
      sourceName: '',
      scope: 1,
      energyUsage: null,
      energyUnit: unitCodes[0]?.code || null,
      co2Emission: 0,
      factorId: null,
      manager: null,
      remark: null,
    })
    setSelectedManager(null)
    setViewMode('create')
  }

  const handleRowClick = (item: CarbonEmission) => {
    setSelectedItem(item)
    setViewMode('detail')
  }

  const handleEditClick = () => {
    if (!selectedItem) return
    setFormData({
      recordDate: selectedItem.recordDate,
      sourceName: selectedItem.sourceName,
      scope: selectedItem.scope,
      energyUsage: selectedItem.energyUsage,
      energyUnit: selectedItem.energyUnit,
      co2Emission: selectedItem.co2Emission,
      factorId: selectedItem.factorId,
      manager: selectedItem.manager,
      remark: selectedItem.remark,
    })
    setSelectedManager(null)
    setViewMode('edit')
  }

  const handleSave = () => {
    const saveData = selectedManager
      ? { ...formData, manager: getManagerDisplayName(selectedManager) }
      : formData
    if (viewMode === 'create') {
      createMutation.mutate(saveData)
    } else if (viewMode === 'edit' && selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, data: saveData })
    }
  }

  const handleDelete = () => {
    if (!selectedItem) return
    showConfirm(t('common.confirmDelete'), () => deleteMutation.mutate(selectedItem.id))
  }

  const formatDate = (dateStr?: string | null) => dateStr ? dateStr.substring(0, 10) : ''

  // List View
  const renderListView = () => (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <ListSearchBar placeholder={t('carbon.searchEmission')} value={searchText} onChange={setSearchText} onSearch={handleSearch}
          sx={{ width: { xs: '100%', md: 250 } }}  />
        <IconButton onClick={handleReset} sx={{ display: { xs: 'none', md: 'flex' } }}><RefreshIcon /></IconButton>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick}>New</Button>
      </Box>

      {/* PC Table */}
      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', overflowX: 'auto' }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={headerCellSx}>{t('common.no')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('carbon.recordDate')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('carbon.sourceName')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('carbon.scopeLabel')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('carbon.energyUsage')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('carbon.co2Emission')}</TableCell>
              <TableCell align="center" sx={lastHeaderCellSx}>{t('carbon.manager')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data && data.content.length > 0 ? data.content.map((item, idx) => (
              <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                <TableCell align="center" sx={cellBorderSx}>{page * 20 + idx + 1}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>{formatDate(item.recordDate)}</TableCell>
                <TableCell sx={cellBorderSx}>{item.sourceName || ''}</TableCell>
                <TableCell sx={cellBorderSx}>
                  {getScopeLabel(String(item.scope)) || `Scope ${item.scope}`}
                </TableCell>
                <TableCell align="right" sx={cellBorderSx}>
                  {item.energyUsage != null ? `${item.energyUsage} ${item.energyUnit ? getUnitLabel(item.energyUnit) || item.energyUnit : ''}` : ''}
                </TableCell>
                <TableCell align="right" sx={cellBorderSx}>{item.co2Emission != null ? `${item.co2Emission} tCO\u2082eq` : ''}</TableCell>
                <TableCell align="center">{item.manager || ''}</TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>{isLoading ? t('common.loading') : t('common.noData')}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1 }}>
        {data && data.content.length > 0 ? data.content.map((item) => (
          <Paper key={item.id} sx={{ p: 2, cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="subtitle2" fontWeight="bold">{item.sourceName || ''}</Typography>
              <Chip label={getScopeLabel(String(item.scope)) || `Scope ${item.scope}`} color={scopeChipColor(item.scope)} size="small" />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {formatDate(item.recordDate)} | {item.co2Emission != null ? `${item.co2Emission} tCO\u2082eq` : ''} | {item.manager || ''}
            </Typography>
          </Paper>
        )) : (
          <Typography align="center" color="text.secondary" sx={{ py: 4 }}>{isLoading ? t('common.loading') : t('common.noData')}</Typography>
        )}
      </Box>

      {data && data.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination count={data.totalPages} page={page + 1} onChange={(_, p) => setPage(p - 1)} color="primary" />
        </Box>
      )}
    </Box>
  )

  // Detail View
  const renderDetailView = () => {
    if (!selectedItem) return null
    const fields = [
      { label: t('carbon.recordDate'), value: formatDate(selectedItem.recordDate) },
      { label: t('carbon.sourceName'), value: selectedItem.sourceName },
      { label: t('carbon.scopeLabel'), value: getScopeLabel(String(selectedItem.scope)) || `Scope ${selectedItem.scope}` },
      { label: t('carbon.energyUsage'), value: selectedItem.energyUsage != null ? `${selectedItem.energyUsage} ${selectedItem.energyUnit ? getUnitLabel(selectedItem.energyUnit) || selectedItem.energyUnit : ''}` : '' },
      { label: t('carbon.energyUnit'), value: selectedItem.energyUnit ? getUnitLabel(selectedItem.energyUnit) || selectedItem.energyUnit : '' },
      { label: t('carbon.co2Emission'), value: selectedItem.co2Emission != null ? `${selectedItem.co2Emission} tCO\u2082eq` : '' },
      { label: t('carbon.manager'), value: selectedItem.manager },
      { label: t('carbon.remark'), value: selectedItem.remark },
    ]
    return (
      <Box>
        {/* PC */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
            {Array.from({ length: Math.ceil(fields.length / 2) }).map((_, rowIdx) => {
              const lastRow = rowIdx === Math.ceil(fields.length / 2) - 1
              return (
                <Box key={rowIdx} sx={{ display: 'flex', ...(!lastRow && { borderBottom: 1, borderColor: 'grey.300' }) }}>
                  {[0, 1].map((colIdx) => {
                    const f = fields[rowIdx * 2 + colIdx]
                    return f ? (
                      <><Typography key={`l${colIdx}`} sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{f.label}</Typography>
                        <Typography key={`v${colIdx}`} sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem', display: 'flex', alignItems: 'center', ...(colIdx === 0 && { borderRight: 1, borderColor: 'grey.300' }) }}>{f.value || ''}</Typography></>
                    ) : (
                      <><Box key={`l${colIdx}`} sx={{ width: 128, bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300' }} />
                        <Box key={`v${colIdx}`} sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', ...(colIdx === 0 && { borderRight: 1, borderColor: 'grey.300' }) }} /></>
                    )
                  })}
                </Box>
              )
            })}
          </Box>
        {/* Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          {fields.map((f, i) => (
            <Box key={i}>
              <Typography variant="body2" fontWeight="bold" sx={{ bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{f.label}</Typography>
              <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{f.value || ''}</Typography>
            </Box>
          ))}
        </Box>
        {/* Buttons */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={() => setViewMode('list')}>{t('common.list')}</Button>
          <Button variant="contained" onClick={handleEditClick}>{t('common.edit')}</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>{t('common.delete')}</Button>
        </Box>
        <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
          <Button variant="outlined" onClick={() => setViewMode('list')} sx={{ flex: 1, minWidth: 0 }}>{t('common.list')}</Button>
          <Button variant="contained" onClick={handleEditClick} sx={{ flex: 1, minWidth: 0 }}>{t('common.edit')}</Button>
          <Button variant="contained" color="error" onClick={handleDelete} sx={{ flex: 1, minWidth: 0 }}>{t('common.delete')}</Button>
        </Box>
      </Box>
    )
  }

  // Form View
  const labelSx = { width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }
  const cellSx = { flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }
  const cellRSx = { ...cellSx, borderRight: 1, borderColor: 'grey.300' }
  const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'grey.300' }
  const lastRowSx = { display: 'flex' }
  const mLabelSx = { mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }

  const renderFormView = () => (
    <Box>
      {/* PC Form */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('carbon.recordDate')}</Typography>
          <Box sx={cellRSx}>
            <DatePickerField value={formData.recordDate || ''} onChange={(v) => setFormData({ ...formData, recordDate: v })} size="small" />
          </Box>
          <Typography sx={labelSx}>{t('carbon.sourceName')}</Typography>
          <Box sx={cellSx}>
            <TextField fullWidth size="small" value={formData.sourceName || ''} onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })} />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('carbon.scopeLabel')}</Typography>
          <Box sx={cellRSx}>
            <FormControl fullWidth size="small">
              <Select value={String(formData.scope)} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, scope: Number(e.target.value) })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {scopeCodes.length > 0 ? scopeCodes.map((c) => (
                  <MenuItem key={c.code} value={c.code}>{getScopeLabel(c.code)}</MenuItem>
                )) : [1, 2, 3].map((s) => (
                  <MenuItem key={s} value={String(s)}>{t(`carbon.scope${s}`, `Scope ${s}`)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Typography sx={labelSx}>{t('carbon.co2Emission')}</Typography>
          <Box sx={cellSx}>
            <NumberField fullWidth size="small" value={formData.co2Emission ?? ''} onChange={(v) => setFormData({ ...formData, co2Emission: v ?? 0 })} required />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('carbon.energyUsage')}</Typography>
          <Box sx={cellRSx}>
            <NumberField fullWidth size="small" value={formData.energyUsage ?? ''} onChange={(v) => setFormData({ ...formData, energyUsage: v })} />
          </Box>
          <Typography sx={labelSx}>{t('carbon.energyUnit')}</Typography>
          <Box sx={cellSx}>
            <FormControl fullWidth size="small">
              <Select value={formData.energyUnit || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, energyUnit: e.target.value || null })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {unitCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getUnitLabel(c.code)}</MenuItem>))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('carbon.manager')}</Typography>
          <Box sx={cellSx}>
            <TextField fullWidth size="small" value={selectedManager ? getManagerDisplayName(selectedManager) : (formData.manager || '')} InputProps={{ readOnly: true }} placeholder={t('carbon.selectManager')} />
            <Button variant="outlined" size="small" sx={{ ml: 1, minWidth: 40 }} onClick={() => setShowUserModal(true)}><PersonSearchIcon fontSize="small" /></Button>
          </Box>
        </Box>
        <Box sx={lastRowSx}>
          <Typography sx={labelSx}>{t('carbon.remark')}</Typography>
          <Box sx={cellSx}>
            <TextField fullWidth size="small" multiline rows={3} value={formData.remark || ''} onChange={(e) => setFormData({ ...formData, remark: e.target.value || null })} />
          </Box>
        </Box>
      </Box>
      {/* Mobile Form */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('carbon.recordDate')}</Typography>
          <DatePickerField value={formData.recordDate || ''} onChange={(v) => setFormData({ ...formData, recordDate: v })} size="small" fullWidth />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('carbon.sourceName')}</Typography>
          <TextField fullWidth size="small" value={formData.sourceName || ''} onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('carbon.scopeLabel')}</Typography>
          <FormControl fullWidth size="small">
            <Select value={String(formData.scope)} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, scope: Number(e.target.value) })} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              {scopeCodes.length > 0 ? scopeCodes.map((c) => (
                <MenuItem key={c.code} value={c.code}>{getScopeLabel(c.code)}</MenuItem>
              )) : [1, 2, 3].map((s) => (
                <MenuItem key={s} value={String(s)}>{t(`carbon.scope${s}`, `Scope ${s}`)}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('carbon.energyUsage')}</Typography>
          <TextField fullWidth size="small" type="number" value={formData.energyUsage ?? ''} onChange={(e) => setFormData({ ...formData, energyUsage: e.target.value ? Number(e.target.value) : null })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('carbon.energyUnit')}</Typography>
          <FormControl fullWidth size="small">
            <Select value={formData.energyUnit || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, energyUnit: e.target.value || null })} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              {unitCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getUnitLabel(c.code)}</MenuItem>))}
            </Select>
          </FormControl>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('carbon.co2Emission')}</Typography>
          <NumberField fullWidth size="small" value={formData.co2Emission ?? ''} onChange={(v) => setFormData({ ...formData, co2Emission: v ?? 0 })} required />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('carbon.manager')}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField fullWidth size="small" value={selectedManager ? getManagerDisplayName(selectedManager) : (formData.manager || '')} InputProps={{ readOnly: true }} placeholder={t('carbon.selectManager')} />
            <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowUserModal(true)}><PersonSearchIcon fontSize="small" /></Button>
          </Box>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('carbon.remark')}</Typography>
          <TextField fullWidth size="small" multiline rows={3} value={formData.remark || ''} onChange={(e) => setFormData({ ...formData, remark: e.target.value || null })} />
        </Box>
      </Box>
      {/* Buttons */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, justifyContent: 'flex-end', mt: 3 }}>
        <Button variant="outlined" onClick={() => setViewMode(viewMode === 'edit' ? 'detail' : 'list')}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>{t('common.save')}</Button>
      </Box>
      <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1, mt: 3 }}>
        <Button variant="outlined" onClick={() => setViewMode(viewMode === 'edit' ? 'detail' : 'list')} sx={{ flex: 1, minWidth: 0 }}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} sx={{ flex: 1, minWidth: 0 }}>{t('common.save')}</Button>
      </Box>
    </Box>
  )

  const handleUserSelect = (users: UserInfo[]) => {
    if (users.length > 0) {
      const user = users[0]
      setSelectedManager(user)
      setFormData({ ...formData, manager: getManagerDisplayName(user) })
    }
    setShowUserModal(false)
  }

  return (
    <Box>
      {viewMode === 'list' && renderListView()}
      {viewMode === 'detail' && renderDetailView()}
      {(viewMode === 'create' || viewMode === 'edit') && renderFormView()}
      <UserSelectModal open={showUserModal} onClose={() => setShowUserModal(false)} selectedUsers={[]} onConfirm={handleUserSelect} singleSelect useCompanyTree title={t('carbon.selectManager')} />
    </Box>
  )
}

export default CarbonEmissionTab
