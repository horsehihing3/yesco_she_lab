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
import { useCodeMap } from '../../hooks/useCodeMap'
import { emissionFactorApi } from '../../api/carbonApi'
import { EmissionFactor, EmissionFactorRequest } from '../../types/carbon.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const scopeChipColor = (scope?: number): 'success' | 'info' | 'warning' | 'default' => {
  if (scope === 1) return 'success'
  if (scope === 2) return 'info'
  if (scope === 3) return 'warning'
  return 'default'
}

const EmissionFactorTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showConfirm, showSuccess } = useAlert()
  const { codeList: unitCodes, getLabel: getUnitLabel } = useCodeMap('FACTOR_UNIT')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<EmissionFactor | null>(null)
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [formData, setFormData] = useState<EmissionFactorRequest>({
    energySource: '',
    unit: '',
    factorValue: 0,
    baseYear: new Date().getFullYear(),
    referenceOrg: null,
    scope: 1,
    remark: null,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['emissionFactor', page, searchQuery],
    queryFn: () => searchQuery
      ? emissionFactorApi.search(searchQuery, page, 20)
      : emissionFactorApi.findAll(page, 20),
  })

  const createMutation = useMutation({
    mutationFn: (data: EmissionFactorRequest) => emissionFactorApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emissionFactor'] })
      showSuccess(t('common.saveSuccess'))
      setViewMode('list')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EmissionFactorRequest }) => emissionFactorApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emissionFactor'] })
      showSuccess(t('common.saveSuccess'))
      setViewMode('list')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => emissionFactorApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emissionFactor'] })
      showSuccess(t('common.deleteSuccess'))
      setViewMode('list')
    },
  })

  const handleSearch = () => { setSearchQuery(searchText); setPage(0) }
  const handleReset = () => { setSearchText(''); setSearchQuery(''); setPage(0) }

  const handleAddClick = () => {
    setSelectedItem(null)
    setFormData({
      energySource: '',
      unit: unitCodes[0]?.code || '',
      factorValue: 0,
      baseYear: new Date().getFullYear(),
      referenceOrg: null,
      scope: 1,
      remark: null,
    })
    setViewMode('create')
  }

  const handleRowClick = (item: EmissionFactor) => {
    setSelectedItem(item)
    setViewMode('detail')
  }

  const handleEditClick = () => {
    if (!selectedItem) return
    setFormData({
      energySource: selectedItem.energySource,
      unit: selectedItem.unit,
      factorValue: selectedItem.factorValue,
      baseYear: selectedItem.baseYear,
      referenceOrg: selectedItem.referenceOrg,
      scope: selectedItem.scope,
      remark: selectedItem.remark,
    })
    setViewMode('edit')
  }

  const handleSave = () => {
    if (viewMode === 'create') {
      createMutation.mutate(formData)
    } else if (viewMode === 'edit' && selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, data: formData })
    }
  }

  const handleDelete = () => {
    if (!selectedItem) return
    showConfirm(t('common.confirmDelete'), () => deleteMutation.mutate(selectedItem.id))
  }

  const formatFactorValue = (value: number) => {
    if (value === 0) return '0.0000'
    const str = value.toString()
    const decimalPart = str.includes('.') ? str.split('.')[1] : ''
    if (decimalPart.length <= 4) return value.toFixed(4)
    if (decimalPart.length <= 6) return value.toFixed(decimalPart.length)
    return value.toFixed(6)
  }

  // List View
  const renderListView = () => (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <ListSearchBar placeholder={t('carbon.factor.searchFactor')} value={searchText} onChange={setSearchText} onSearch={handleSearch}
          sx={{ width: { xs: '100%', md: 250 } }}  />
        <IconButton onClick={handleReset} sx={{ display: { xs: 'none', md: 'flex' } }}><RefreshIcon /></IconButton>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick}>New</Button>
      </Box>

      {/* PC Table */}
      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', overflowX: 'auto' }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }}>{t('common.no')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }}>{t('carbon.factor.energySource')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }}>{t('carbon.factor.unit')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }}>{t('carbon.factor.factorValue')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }}>{t('carbon.factor.baseYear')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }}>{t('carbon.factor.referenceOrg')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', wordBreak: 'keep-all' }}>{t('carbon.factor.scope')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data && data.content.length > 0 ? data.content.map((item, idx) => (
              <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{page * 20 + idx + 1}</TableCell>
                <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{item.energySource}</TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{getUnitLabel(item.unit) || item.unit}</TableCell>
                <TableCell align="right" sx={{ borderRight: 1, borderColor: 'divider', fontFamily: 'monospace' }}>{formatFactorValue(item.factorValue)}</TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{item.baseYear}</TableCell>
                <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{item.referenceOrg || ''}</TableCell>
                <TableCell align="center">
                  <Chip label={`Scope ${item.scope}`} color={scopeChipColor(item.scope)} size="small" />
                </TableCell>
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
              <Typography variant="subtitle2" fontWeight="bold">{item.energySource}</Typography>
              <Chip label={`Scope ${item.scope}`} color={scopeChipColor(item.scope)} size="small" />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {formatFactorValue(item.factorValue)} {getUnitLabel(item.unit) || item.unit} | {item.baseYear} | {item.referenceOrg || ''}
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
      { label: t('carbon.factor.energySource'), value: selectedItem.energySource },
      { label: t('carbon.factor.unit'), value: getUnitLabel(selectedItem.unit) || selectedItem.unit },
      { label: t('carbon.factor.factorValue'), value: formatFactorValue(selectedItem.factorValue) },
      { label: t('carbon.factor.baseYear'), value: String(selectedItem.baseYear) },
      { label: t('carbon.factor.referenceOrg'), value: selectedItem.referenceOrg },
      { label: t('carbon.factor.scope'), value: `Scope ${selectedItem.scope}` },
      { label: t('carbon.factor.remark'), value: selectedItem.remark },
    ]
    return (
      <Box>
        {/* PC */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
            {Array.from({ length: Math.ceil(fields.length / 2) }).map((_, rowIdx) => {
              const lastRow = rowIdx === Math.ceil(fields.length / 2) - 1
              return (
                <Box key={rowIdx} sx={{ display: 'flex', ...(!lastRow && { borderBottom: 1, borderColor: 'divider' }) }}>
                  {[0, 1].map((colIdx) => {
                    const f = fields[rowIdx * 2 + colIdx]
                    return f ? (
                      <><Typography key={`l${colIdx}`} sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{f.label}</Typography>
                        <Typography key={`v${colIdx}`} sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem', display: 'flex', alignItems: 'center', ...(colIdx === 0 && { borderRight: 1, borderColor: 'divider' }) }}>{f.value || ''}</Typography></>
                    ) : (
                      <><Box key={`l${colIdx}`} sx={{ width: 128, bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider' }} />
                        <Box key={`v${colIdx}`} sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', ...(colIdx === 0 && { borderRight: 1, borderColor: 'divider' }) }} /></>
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
  const labelSx = { width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }
  const cellSx = { flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }
  const cellRSx = { ...cellSx, borderRight: 1, borderColor: 'divider' }
  const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'divider' }
  const lastRowSx = { display: 'flex' }
  const mLabelSx = { mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }

  const renderFormView = () => (
    <Box>
      {/* PC Form */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('carbon.factor.energySource')}</Typography>
          <Box sx={cellRSx}>
            <TextField fullWidth size="small" value={formData.energySource || ''} onChange={(e) => setFormData({ ...formData, energySource: e.target.value })} />
          </Box>
          <Typography sx={labelSx}>{t('carbon.factor.unit')}</Typography>
          <Box sx={cellSx}>
            <FormControl fullWidth size="small">
              <Select value={formData.unit || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, unit: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {unitCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getUnitLabel(c.code)}</MenuItem>))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('carbon.factor.factorValue')}</Typography>
          <Box sx={cellRSx}>
            <NumberField fullWidth size="small" step={0.0001} value={formData.factorValue} onChange={(v) => setFormData({ ...formData, factorValue: v ?? 0 })} />
          </Box>
          <Typography sx={labelSx}>{t('carbon.factor.baseYear')}</Typography>
          <Box sx={cellSx}>
            <NumberField fullWidth size="small" thousandSeparator={false} value={formData.baseYear} onChange={(v) => setFormData({ ...formData, baseYear: v ?? new Date().getFullYear() })} />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('carbon.factor.referenceOrg')}</Typography>
          <Box sx={cellRSx}>
            <TextField fullWidth size="small" value={formData.referenceOrg || ''} onChange={(e) => setFormData({ ...formData, referenceOrg: e.target.value })} />
          </Box>
          <Typography sx={labelSx}>{t('carbon.factor.scope')}</Typography>
          <Box sx={cellSx}>
            <FormControl fullWidth size="small">
              <Select value={String(formData.scope)} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, scope: parseInt(e.target.value) })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                <MenuItem value="1">Scope 1</MenuItem>
                <MenuItem value="2">Scope 2</MenuItem>
                <MenuItem value="3">Scope 3</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
        <Box sx={lastRowSx}>
          <Typography sx={labelSx}>{t('carbon.factor.remark')}</Typography>
          <Box sx={cellSx}>
            <TextField fullWidth size="small" multiline rows={3} value={formData.remark || ''} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} />
          </Box>
        </Box>
      </Box>
      {/* Mobile Form */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('carbon.factor.energySource')}</Typography>
          <TextField fullWidth size="small" value={formData.energySource || ''} onChange={(e) => setFormData({ ...formData, energySource: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('carbon.factor.unit')}</Typography>
          <FormControl fullWidth size="small">
            <Select value={formData.unit || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, unit: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              {unitCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getUnitLabel(c.code)}</MenuItem>))}
            </Select>
          </FormControl>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('carbon.factor.factorValue')}</Typography>
          <TextField fullWidth size="small" type="number" inputProps={{ step: 0.0001 }} value={formData.factorValue} onChange={(e) => setFormData({ ...formData, factorValue: parseFloat(e.target.value) || 0 })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('carbon.factor.baseYear')}</Typography>
          <TextField fullWidth size="small" type="number" value={formData.baseYear} onChange={(e) => setFormData({ ...formData, baseYear: parseInt(e.target.value) || new Date().getFullYear() })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('carbon.factor.referenceOrg')}</Typography>
          <TextField fullWidth size="small" value={formData.referenceOrg || ''} onChange={(e) => setFormData({ ...formData, referenceOrg: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('carbon.factor.scope')}</Typography>
          <FormControl fullWidth size="small">
            <Select value={String(formData.scope)} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, scope: parseInt(e.target.value) })} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              <MenuItem value="1">Scope 1</MenuItem>
              <MenuItem value="2">Scope 2</MenuItem>
              <MenuItem value="3">Scope 3</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('carbon.factor.remark')}</Typography>
          <TextField fullWidth size="small" multiline rows={3} value={formData.remark || ''} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} />
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

  return (
    <Box>
      {viewMode === 'list' && renderListView()}
      {viewMode === 'detail' && renderDetailView()}
      {(viewMode === 'create' || viewMode === 'edit') && renderFormView()}
    </Box>
  )
}

export default EmissionFactorTab
