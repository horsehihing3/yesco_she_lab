import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import {
  Box, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Pagination, IconButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import NumberField from '../common/NumberField'
import { waterStandardApi } from '../../api/environmentApi'
import { WaterStandard, WaterStandardRequest } from '../../types/environment.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const WaterStandardTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showConfirm, showSuccess } = useAlert()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<WaterStandard | null>(null)
  const [page, setPage] = useState(0)
  const [formData, setFormData] = useState<WaterStandardRequest>({ itemName: '', unit: '', minValue: 0, maxValue: 0, remark: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['waterStandard', page],
    queryFn: () => waterStandardApi.findAll(page, 20),
  })

  const createMutation = useMutation({
    mutationFn: (data: WaterStandardRequest) => waterStandardApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waterStandard'] })
      showSuccess(t('common.saveSuccess'))
      setViewMode('list')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: WaterStandardRequest }) => waterStandardApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waterStandard'] })
      showSuccess(t('common.saveSuccess'))
      setViewMode('list')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => waterStandardApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waterStandard'] })
      showSuccess(t('common.deleteSuccess'))
      setViewMode('list')
    },
  })

  const handleAddClick = () => {
    setSelectedItem(null)
    setFormData({ itemName: '', unit: '', minValue: 0, maxValue: 0, remark: '' })
    setViewMode('create')
  }

  const handleRowClick = (item: WaterStandard) => {
    setSelectedItem(item)
    setViewMode('detail')
  }

  const handleEditClick = () => {
    if (!selectedItem) return
    setFormData({
      itemName: selectedItem.itemName,
      unit: selectedItem.unit,
      minValue: selectedItem.minValue,
      maxValue: selectedItem.maxValue,
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

  const formatDate = (dateStr?: string) => dateStr ? dateStr.substring(0, 10) : ''

  const cellSx = { borderRight: 1, borderColor: 'grey.300', wordBreak: 'keep-all' }

  // List View
  const renderListView = () => (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick}>New</Button>
      </Box>

      {/* PC Table */}
      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', overflowX: 'auto' }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 'bold', ...cellSx }}>{t('common.no')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', ...cellSx }}>{t('water.standard.itemName')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', ...cellSx }}>{t('water.standard.unit')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', ...cellSx }}>{t('water.standard.minValue')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', wordBreak: 'keep-all' }}>{t('water.standard.maxValue')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data && data.content.length > 0 ? data.content.map((item, idx) => (
              <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                <TableCell align="center" sx={cellSx}>{page * 20 + idx + 1}</TableCell>
                <TableCell sx={cellSx}>{item.itemName || ''}</TableCell>
                <TableCell align="center" sx={cellSx}>{item.unit || ''}</TableCell>
                <TableCell align="center" sx={cellSx}>{item.minValue ?? ''}</TableCell>
                <TableCell align="center">{item.maxValue ?? ''}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  {isLoading ? t('common.loading') : t('common.noData')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1 }}>
        {data && data.content.length > 0 ? data.content.map((item) => (
          <Paper key={item.id} sx={{ p: 2, cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
            <Typography variant="subtitle2" fontWeight="bold">{item.itemName || ''}</Typography>
            <Typography variant="caption" color="text.secondary">
              {item.unit || ''} | {t('water.standard.minValue')}: {item.minValue ?? ''} | {t('water.standard.maxValue')}: {item.maxValue ?? ''}
            </Typography>
          </Paper>
        )) : (
          <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
            {isLoading ? t('common.loading') : t('common.noData')}
          </Typography>
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
      { label: t('water.standard.itemName'), value: selectedItem.itemName },
      { label: t('water.standard.unit'), value: selectedItem.unit },
      { label: t('water.standard.minValue'), value: selectedItem.minValue?.toString() },
      { label: t('water.standard.maxValue'), value: selectedItem.maxValue?.toString() },
      { label: t('water.standard.remark'), value: selectedItem.remark },
      { label: t('common.regUser'), value: selectedItem.regUser },
      { label: t('common.createdAt'), value: formatDate(selectedItem.createdAt) },
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
  const fCellSx = { flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }
  const fCellRSx = { ...fCellSx, borderRight: 1, borderColor: 'grey.300' }
  const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'grey.300' }
  const lastRowSx = { display: 'flex' }
  const mLabelSx = { mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }

  const renderFormView = () => (
    <Box>
      {/* PC Form */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('water.standard.itemName')}</Typography>
          <Box sx={fCellRSx}>
            <TextField fullWidth size="small" value={formData.itemName || ''} onChange={(e) => setFormData({ ...formData, itemName: e.target.value })} />
          </Box>
          <Typography sx={labelSx}>{t('water.standard.unit')}</Typography>
          <Box sx={fCellSx}>
            <TextField fullWidth size="small" value={formData.unit || ''} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('water.standard.minValue')}</Typography>
          <Box sx={fCellRSx}>
            <NumberField fullWidth size="small" value={formData.minValue} onChange={(v) => setFormData({ ...formData, minValue: v ?? 0 })} />
          </Box>
          <Typography sx={labelSx}>{t('water.standard.maxValue')}</Typography>
          <Box sx={fCellSx}>
            <NumberField fullWidth size="small" value={formData.maxValue} onChange={(v) => setFormData({ ...formData, maxValue: v ?? 0 })} />
          </Box>
        </Box>
        <Box sx={lastRowSx}>
          <Typography sx={labelSx}>{t('water.standard.remark')}</Typography>
          <Box sx={fCellSx}>
            <TextField fullWidth size="small" value={formData.remark || ''} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} />
          </Box>
        </Box>
      </Box>

      {/* Mobile Form */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('water.standard.itemName')}</Typography>
          <TextField fullWidth size="small" value={formData.itemName || ''} onChange={(e) => setFormData({ ...formData, itemName: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('water.standard.unit')}</Typography>
          <TextField fullWidth size="small" value={formData.unit || ''} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('water.standard.minValue')}</Typography>
          <TextField fullWidth size="small" type="number" value={formData.minValue} onChange={(e) => setFormData({ ...formData, minValue: Number(e.target.value) })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('water.standard.maxValue')}</Typography>
          <TextField fullWidth size="small" type="number" value={formData.maxValue} onChange={(e) => setFormData({ ...formData, maxValue: Number(e.target.value) })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('water.standard.remark')}</Typography>
          <TextField fullWidth size="small" value={formData.remark || ''} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} />
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

export default WaterStandardTab
