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
import { emissionSourceApi } from '../../api/carbonApi'
import { EmissionSource, EmissionSourceRequest } from '../../types/carbon.types'
import DevTestFillButton from '../common/DevTestFillButton'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'


const statusChipColor = (status?: string | null): 'success' | 'warning' | 'error' | 'default' => {
  if (status === 'OPERATING') return 'success'
  if (status === 'MONITORING') return 'warning'
  if (status === 'STOPPED') return 'error'
  return 'default'
}

const headerCellSx = { fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }
const lastHeaderCellSx = { fontWeight: 'bold', wordBreak: 'keep-all' }
const cellBorderSx = { borderRight: 1, borderColor: 'divider' }

const EmissionSourceTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showConfirm, showSuccess } = useAlert()
  const { codeList: scopeCodes, getLabel: getScopeLabel } = useCodeMap('EMISSION_SCOPE')
  const { codeList: sourceTypeCodes, getLabel: getSourceTypeLabel } = useCodeMap('SOURCE_TYPE')
  const { codeList: statusCodes, getLabel: getStatusLabel } = useCodeMap('SOURCE_STATUS')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<EmissionSource | null>(null)
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [formData, setFormData] = useState<EmissionSourceRequest>({
    sourceCode: null,
    sourceName: '',
    sourceType: null,
    scope: 1,
    location: null,
    status: statusCodes[0]?.code || null,
    annualEmission: null,
    remark: null,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['emissionSource', page, searchQuery],
    queryFn: () => searchQuery
      ? emissionSourceApi.search(searchQuery, page, 20)
      : emissionSourceApi.findAll(page, 20),
  })

  const createMutation = useMutation({
    mutationFn: (data: EmissionSourceRequest) => emissionSourceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emissionSource'] })
      showSuccess(t('common.saveSuccess'))
      setViewMode('list')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EmissionSourceRequest }) => emissionSourceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emissionSource'] })
      showSuccess(t('common.saveSuccess'))
      setViewMode('list')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => emissionSourceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emissionSource'] })
      showSuccess(t('common.deleteSuccess'))
      setViewMode('list')
    },
  })

  const handleSearch = () => { setSearchQuery(searchText); setPage(0) }
  const handleReset = () => { setSearchText(''); setSearchQuery(''); setPage(0) }

  const handleAddClick = () => {
    setSelectedItem(null)
    setFormData({
      sourceCode: null,
      sourceName: '',
      sourceType: sourceTypeCodes[0]?.code || null,
      scope: 1,
      location: null,
      status: statusCodes[0]?.code || null,
      annualEmission: null,
      remark: null,
    })
    setViewMode('create')
  }

  const handleRowClick = (item: EmissionSource) => {
    setSelectedItem(item)
    setViewMode('detail')
  }

  const handleEditClick = () => {
    if (!selectedItem) return
    setFormData({
      sourceCode: selectedItem.sourceCode,
      sourceName: selectedItem.sourceName,
      sourceType: selectedItem.sourceType,
      scope: selectedItem.scope,
      location: selectedItem.location,
      status: selectedItem.status,
      annualEmission: selectedItem.annualEmission,
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

  // DEV ONLY — 비어있는 항목을 배출원 더미데이터로 채움 (입력값 보존)
  const fillTestData = () => setFormData(prev => ({
    ...prev,
    sourceName: prev.sourceName || '소각로 #2',
    sourceType: prev.sourceType || sourceTypeCodes[0]?.code || null,
    location: prev.location || '본사 사옥 기계실',
    status: prev.status || statusCodes[0]?.code || null,
    annualEmission: prev.annualEmission ?? 145.8,
    remark: prev.remark || '연간 배출원 등록 (테스트 데이터)',
  }))

  // List View
  const renderListView = () => (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <ListSearchBar placeholder={t('carbon.source.searchSource')} value={searchText} onChange={setSearchText} onSearch={handleSearch}
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
              <TableCell align="center" sx={headerCellSx}>{t('common.no')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('carbon.source.sourceCode')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('carbon.source.sourceName')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('carbon.source.sourceType')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('carbon.source.scope')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('carbon.source.location')}</TableCell>
              <TableCell align="center" sx={headerCellSx}>{t('carbon.source.status')}</TableCell>
              <TableCell align="center" sx={lastHeaderCellSx}>{t('carbon.source.annualEmission')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data && data.content.length > 0 ? data.content.map((item, idx) => (
              <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                <TableCell align="center" sx={cellBorderSx}>{page * 20 + idx + 1}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>{item.sourceCode || ''}</TableCell>
                <TableCell sx={cellBorderSx}>{item.sourceName || ''}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>
                  <Chip label={item.sourceType ? (getSourceTypeLabel(item.sourceType) || item.sourceType) : ''} size="small" />
                </TableCell>
                <TableCell sx={cellBorderSx}>
                  {getScopeLabel(String(item.scope)) || `Scope ${item.scope}`}
                </TableCell>
                <TableCell sx={cellBorderSx}>{item.location || ''}</TableCell>
                <TableCell align="center" sx={cellBorderSx}>
                  <Chip label={item.status ? (getStatusLabel(item.status) || item.status) : ''} color={statusChipColor(item.status)} size="small" />
                </TableCell>
                <TableCell align="right">{item.annualEmission != null ? `${item.annualEmission} tCO\u2082eq` : ''}</TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}>{isLoading ? t('common.loading') : t('common.noData')}</TableCell></TableRow>
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
              <Chip label={item.status ? (getStatusLabel(item.status) || item.status) : ''} color={statusChipColor(item.status)} size="small" />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {item.sourceCode || ''} | {item.sourceType ? (getSourceTypeLabel(item.sourceType) || item.sourceType) : ''} | Scope {item.scope}
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {item.location || ''} | {item.annualEmission != null ? `${item.annualEmission} tCO\u2082eq` : ''}
              </Typography>
            </Box>
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
      { label: t('carbon.source.sourceCode'), value: selectedItem.sourceCode },
      { label: t('carbon.source.sourceName'), value: selectedItem.sourceName },
      { label: t('carbon.source.sourceType'), value: selectedItem.sourceType ? (getSourceTypeLabel(selectedItem.sourceType) || selectedItem.sourceType) : '' },
      { label: t('carbon.source.scope'), value: getScopeLabel(String(selectedItem.scope)) || `Scope ${selectedItem.scope}` },
      { label: t('carbon.source.location'), value: selectedItem.location },
      { label: t('carbon.source.status'), value: selectedItem.status ? (getStatusLabel(selectedItem.status) || selectedItem.status) : '' },
      { label: t('carbon.source.annualEmission'), value: selectedItem.annualEmission != null ? `${selectedItem.annualEmission} tCO\u2082eq` : '' },
      { label: t('carbon.source.remark'), value: selectedItem.remark },
    ]
    return (
      <Box>
        {/* PC */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
            {Array.from({ length: Math.ceil(fields.length / 2) }).map((_, rowIdx) => {
              const lastRow = rowIdx === Math.ceil(fields.length / 2) - 1
              return (
                <Box key={rowIdx} sx={{ display: 'flex', ...(!lastRow && { borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }) }}>
                  {[0, 1].map((colIdx) => {
                    const f = fields[rowIdx * 2 + colIdx]
                    return f ? (
                      <><Typography key={`l${colIdx}`} sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{f.label}</Typography>
                        <Typography key={`v${colIdx}`} sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem', display: 'flex', alignItems: 'center', ...(colIdx === 0 && { borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }) }}>{f.value || ''}</Typography></>
                    ) : (
                      <><Box key={`l${colIdx}`} sx={{ width: 128, bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }} />
                        <Box key={`v${colIdx}`} sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', ...(colIdx === 0 && { borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }) }} /></>
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
  const labelSx = { width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }
  const cellSx = { flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }
  const cellRSx = { ...cellSx, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }
  const rowSx = { display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }
  const lastRowSx = { display: 'flex' }
  const mLabelSx = { mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }

  const renderFormView = () => (
    <Box>
      {/* PC Form */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('carbon.source.sourceCode')}</Typography>
          <Box sx={cellRSx}>
            <TextField fullWidth size="small" value={formData.sourceCode || ''} onChange={(e) => setFormData({ ...formData, sourceCode: e.target.value || null })} placeholder="Auto-generated if blank" />
          </Box>
          <Typography sx={labelSx}>{t('carbon.source.sourceName')}</Typography>
          <Box sx={cellSx}>
            <TextField fullWidth size="small" value={formData.sourceName || ''} onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })} required />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('carbon.source.sourceType')}</Typography>
          <Box sx={cellRSx}>
            <FormControl fullWidth size="small">
              <Select value={formData.sourceType || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, sourceType: e.target.value || null })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {sourceTypeCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getSourceTypeLabel(c.code)}</MenuItem>))}
              </Select>
            </FormControl>
          </Box>
          <Typography sx={labelSx}>{t('carbon.source.scope')}</Typography>
          <Box sx={cellSx}>
            <FormControl fullWidth size="small">
              <Select value={String(formData.scope)} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, scope: Number(e.target.value) })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {scopeCodes.length > 0 ? scopeCodes.map((c) => (
                  <MenuItem key={c.code} value={c.code}>{getScopeLabel(c.code)}</MenuItem>
                )) : [1, 2, 3].map((s) => (
                  <MenuItem key={s} value={String(s)}>{`Scope ${s}`}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('carbon.source.location')}</Typography>
          <Box sx={cellRSx}>
            <TextField fullWidth size="small" value={formData.location || ''} onChange={(e) => setFormData({ ...formData, location: e.target.value || null })} />
          </Box>
          <Typography sx={labelSx}>{t('carbon.source.status')}</Typography>
          <Box sx={cellSx}>
            <FormControl fullWidth size="small">
              <Select value={formData.status || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, status: e.target.value || null })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {statusCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('carbon.source.annualEmission')}</Typography>
          <Box sx={cellSx}>
            <NumberField fullWidth size="small" value={formData.annualEmission ?? ''} onChange={(v) => setFormData({ ...formData, annualEmission: v })} />
          </Box>
        </Box>
        <Box sx={lastRowSx}>
          <Typography sx={labelSx}>{t('carbon.source.remark')}</Typography>
          <Box sx={cellSx}>
            <TextField fullWidth size="small" multiline rows={3} value={formData.remark || ''} onChange={(e) => setFormData({ ...formData, remark: e.target.value || null })} />
          </Box>
        </Box>
      </Box>
      {/* Mobile Form */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('carbon.source.sourceCode')}</Typography>
          <TextField fullWidth size="small" value={formData.sourceCode || ''} onChange={(e) => setFormData({ ...formData, sourceCode: e.target.value || null })} placeholder="Auto-generated if blank" />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('carbon.source.sourceName')}</Typography>
          <TextField fullWidth size="small" value={formData.sourceName || ''} onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })} required />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('carbon.source.sourceType')}</Typography>
          <FormControl fullWidth size="small">
            <Select value={formData.sourceType || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, sourceType: e.target.value || null })} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              {sourceTypeCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getSourceTypeLabel(c.code)}</MenuItem>))}
            </Select>
          </FormControl>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('carbon.source.scope')}</Typography>
          <FormControl fullWidth size="small">
            <Select value={String(formData.scope)} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, scope: Number(e.target.value) })} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              {scopeCodes.length > 0 ? scopeCodes.map((c) => (
                <MenuItem key={c.code} value={c.code}>{getScopeLabel(c.code)}</MenuItem>
              )) : [1, 2, 3].map((s) => (
                <MenuItem key={s} value={String(s)}>{`Scope ${s}`}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('carbon.source.location')}</Typography>
          <TextField fullWidth size="small" value={formData.location || ''} onChange={(e) => setFormData({ ...formData, location: e.target.value || null })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('carbon.source.status')}</Typography>
          <FormControl fullWidth size="small">
            <Select value={formData.status || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, status: e.target.value || null })} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              {statusCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>))}
            </Select>
          </FormControl>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('carbon.source.annualEmission')}</Typography>
          <TextField fullWidth size="small" type="number" value={formData.annualEmission ?? ''} onChange={(e) => setFormData({ ...formData, annualEmission: e.target.value ? Number(e.target.value) : null })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('carbon.source.remark')}</Typography>
          <TextField fullWidth size="small" multiline rows={3} value={formData.remark || ''} onChange={(e) => setFormData({ ...formData, remark: e.target.value || null })} />
        </Box>
      </Box>
      {/* Buttons */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, justifyContent: 'flex-end', mt: 3 }}>
        {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
        <Button variant="outlined" onClick={() => setViewMode(viewMode === 'edit' ? 'detail' : 'list')}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>{t('common.save')}</Button>
      </Box>
      <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1, mt: 3 }}>
        {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
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

export default EmissionSourceTab
