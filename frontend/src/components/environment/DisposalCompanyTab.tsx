import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import {
  Box, TextField, Button, Table, TableBody, TableCell, TableContainer, TableRow,
  Paper, Typography, Pagination, IconButton, FormControl, Select, MenuItem, SelectChangeEvent,
  Grid, Chip,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import DatePickerField from '../common/DatePickerField'
import { useCodeMap } from '../../hooks/useCodeMap'
import { disposalCompanyApi } from '../../api/environmentApi'
import { DisposalCompany, DisposalCompanyRequest } from '../../types/environment.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const ratingColorMap: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
  EXCELLENT: 'success',
  GOOD: 'info',
  AVERAGE: 'warning',
  POOR: 'error',
}

const DisposalCompanyTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showConfirm, showSuccess } = useAlert()
  const { codeList: ratingCodes, getLabel: getRatingLabel } = useCodeMap('COMPANY_RATING')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<DisposalCompany | null>(null)
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [formData, setFormData] = useState<DisposalCompanyRequest>({})

  const { data, isLoading } = useQuery({
    queryKey: ['disposalCompany', page, searchQuery],
    queryFn: () => searchQuery
      ? disposalCompanyApi.search(searchQuery, page, 20)
      : disposalCompanyApi.findAll(page, 20),
  })

  const createMutation = useMutation({
    mutationFn: (data: DisposalCompanyRequest) => disposalCompanyApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disposalCompany'] })
      showSuccess(t('common.saveSuccess'))
      setViewMode('list')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: DisposalCompanyRequest }) => disposalCompanyApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disposalCompany'] })
      showSuccess(t('common.saveSuccess'))
      setViewMode('list')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => disposalCompanyApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disposalCompany'] })
      showSuccess(t('common.deleteSuccess'))
      setViewMode('list')
    },
  })

  const handleSearch = () => { setSearchQuery(searchText); setPage(0) }
  const handleReset = () => { setSearchText(''); setSearchQuery(''); setPage(0) }

  const handleAddClick = () => {
    setSelectedItem(null)
    setFormData({
      rating: ratingCodes[0]?.code || '',
      status: 'ACTIVE',
    })
    setViewMode('create')
  }

  const handleCardClick = (item: DisposalCompany) => {
    setSelectedItem(item)
    setViewMode('detail')
  }

  const handleEditClick = () => {
    if (!selectedItem) return
    setFormData({
      companyName: selectedItem.companyName,
      companyCode: selectedItem.companyCode,
      businessNumber: selectedItem.businessNumber,
      ceoName: selectedItem.ceoName,
      phone: selectedItem.phone,
      address: selectedItem.address,
      wasteTypes: selectedItem.wasteTypes,
      licenseNumber: selectedItem.licenseNumber,
      licenseExpiry: selectedItem.licenseExpiry,
      rating: selectedItem.rating,
      status: selectedItem.status,
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

  const getDaysUntilExpiry = (dateStr?: string): number | null => {
    if (!dateStr) return null
    const expiry = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    expiry.setHours(0, 0, 0, 0)
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getExpiryColor = (days: number | null): string => {
    if (days === null) return 'text.secondary'
    if (days <= 30) return 'error.main'
    if (days <= 90) return 'warning.main'
    return 'success.main'
  }

  // List View
  const renderListView = () => (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField size="small" placeholder={t('waste.company.searchPlaceholder')} value={searchText}
          onChange={(e) => setSearchText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          sx={{ width: { xs: '100%', md: 250 } }} />
        <Button variant="contained" onClick={handleSearch} sx={{ display: { xs: 'none', md: 'flex' } }}>{t('common.search')}</Button>
        <IconButton onClick={handleReset} sx={{ display: { xs: 'none', md: 'flex' } }}><RefreshIcon /></IconButton>
        <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick} sx={{ width: { xs: '100%', md: 'auto' } }}>New</Button>
      </Box>

      {data && data.content.length > 0 ? (
        <Grid container spacing={2}>
          {data.content.map((item) => {
            const daysLeft = getDaysUntilExpiry(item.licenseExpiry)
            return (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Paper
                  sx={{ p: 2, cursor: 'pointer', '&:hover': { boxShadow: 4 }, transition: 'box-shadow 0.2s' }}
                  onClick={() => handleCardClick(item)}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" noWrap sx={{ flex: 1, mr: 1 }}>
                      {item.companyName || ''}
                    </Typography>
                    {item.rating && (
                      <Chip
                        label={getRatingLabel(item.rating)}
                        size="small"
                        color={ratingColorMap[item.rating] || 'default'}
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {t('waste.company.businessNumber')}: {item.businessNumber || ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {t('waste.company.ceoName')}: {item.ceoName || ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {t('waste.company.phone')}: {item.phone || ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 1 }}>
                    {t('waste.company.address')}: {item.address || ''}
                  </Typography>
                  {daysLeft !== null && (
                    <Typography variant="caption" fontWeight="bold" sx={{ color: getExpiryColor(daysLeft) }}>
                      {daysLeft >= 0
                        ? `${t('waste.company.licenseExpiry')} D-${daysLeft}`
                        : `${t('waste.company.licenseExpiry')} D+${Math.abs(daysLeft)}`}
                    </Typography>
                  )}
                </Paper>
              </Grid>
            )
          })}
        </Grid>
      ) : (
        <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
          {isLoading ? t('common.loading') : t('common.noData')}
        </Typography>
      )}

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
      { label: t('waste.company.companyName'), value: selectedItem.companyName },
      { label: t('waste.company.companyCode'), value: selectedItem.companyCode },
      { label: t('waste.company.businessNumber'), value: selectedItem.businessNumber },
      { label: t('waste.company.ceoName'), value: selectedItem.ceoName },
      { label: t('waste.company.phone'), value: selectedItem.phone },
      { label: t('waste.company.address'), value: selectedItem.address },
      { label: t('waste.company.wasteTypes'), value: selectedItem.wasteTypes },
      { label: t('waste.company.licenseNumber'), value: selectedItem.licenseNumber },
      { label: t('waste.company.licenseExpiry'), value: formatDate(selectedItem.licenseExpiry) },
      { label: t('waste.company.rating'), value: selectedItem.rating ? getRatingLabel(selectedItem.rating) : '' },
      { label: t('waste.company.status'), value: selectedItem.status },
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
          <Typography sx={labelSx}>{t('waste.company.companyName')}</Typography>
          <Box sx={cellRSx}>
            <TextField fullWidth size="small" value={formData.companyName || ''} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
          </Box>
          <Typography sx={labelSx}>{t('waste.company.companyCode')}</Typography>
          <Box sx={cellSx}>
            <TextField fullWidth size="small" value={formData.companyCode || ''} onChange={(e) => setFormData({ ...formData, companyCode: e.target.value })} />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('waste.company.businessNumber')}</Typography>
          <Box sx={cellRSx}>
            <TextField fullWidth size="small" value={formData.businessNumber || ''} onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })} />
          </Box>
          <Typography sx={labelSx}>{t('waste.company.ceoName')}</Typography>
          <Box sx={cellSx}>
            <TextField fullWidth size="small" value={formData.ceoName || ''} onChange={(e) => setFormData({ ...formData, ceoName: e.target.value })} />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('waste.company.phone')}</Typography>
          <Box sx={cellRSx}>
            <TextField fullWidth size="small" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          </Box>
          <Typography sx={labelSx}>{t('waste.company.address')}</Typography>
          <Box sx={cellSx}>
            <TextField fullWidth size="small" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('waste.company.wasteTypes')}</Typography>
          <Box sx={cellSx}>
            <TextField fullWidth size="small" value={formData.wasteTypes || ''} onChange={(e) => setFormData({ ...formData, wasteTypes: e.target.value })} />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('waste.company.licenseNumber')}</Typography>
          <Box sx={cellRSx}>
            <TextField fullWidth size="small" value={formData.licenseNumber || ''} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} />
          </Box>
          <Typography sx={labelSx}>{t('waste.company.licenseExpiry')}</Typography>
          <Box sx={cellSx}>
            <DatePickerField value={formData.licenseExpiry || ''} onChange={(v) => setFormData({ ...formData, licenseExpiry: v })} size="small" />
          </Box>
        </Box>
        <Box sx={lastRowSx}>
          <Typography sx={labelSx}>{t('waste.company.rating')}</Typography>
          <Box sx={cellRSx}>
            <FormControl fullWidth size="small">
              <Select value={formData.rating || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, rating: e.target.value })}>
                {ratingCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getRatingLabel(c.code)}</MenuItem>))}
              </Select>
            </FormControl>
          </Box>
          <Typography sx={labelSx}>{t('waste.company.status')}</Typography>
          <Box sx={cellSx}>
            <FormControl fullWidth size="small">
              <Select value={formData.status || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, status: e.target.value })}>
                <MenuItem value="ACTIVE">{t('waste.company.statusActive')}</MenuItem>
                <MenuItem value="INACTIVE">{t('waste.company.statusInactive')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>

      {/* Mobile Form */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('waste.company.companyName')}</Typography>
          <TextField fullWidth size="small" value={formData.companyName || ''} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('waste.company.companyCode')}</Typography>
          <TextField fullWidth size="small" value={formData.companyCode || ''} onChange={(e) => setFormData({ ...formData, companyCode: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('waste.company.businessNumber')}</Typography>
          <TextField fullWidth size="small" value={formData.businessNumber || ''} onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('waste.company.ceoName')}</Typography>
          <TextField fullWidth size="small" value={formData.ceoName || ''} onChange={(e) => setFormData({ ...formData, ceoName: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('waste.company.phone')}</Typography>
          <TextField fullWidth size="small" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('waste.company.address')}</Typography>
          <TextField fullWidth size="small" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('waste.company.wasteTypes')}</Typography>
          <TextField fullWidth size="small" value={formData.wasteTypes || ''} onChange={(e) => setFormData({ ...formData, wasteTypes: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('waste.company.licenseNumber')}</Typography>
          <TextField fullWidth size="small" value={formData.licenseNumber || ''} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('waste.company.licenseExpiry')}</Typography>
          <DatePickerField value={formData.licenseExpiry || ''} onChange={(v) => setFormData({ ...formData, licenseExpiry: v })} size="small" fullWidth />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('waste.company.rating')}</Typography>
          <FormControl fullWidth size="small">
            <Select value={formData.rating || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, rating: e.target.value })}>
              {ratingCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getRatingLabel(c.code)}</MenuItem>))}
            </Select>
          </FormControl>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('waste.company.status')}</Typography>
          <FormControl fullWidth size="small">
            <Select value={formData.status || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, status: e.target.value })}>
              <MenuItem value="ACTIVE">{t('waste.company.statusActive')}</MenuItem>
              <MenuItem value="INACTIVE">{t('waste.company.statusInactive')}</MenuItem>
            </Select>
          </FormControl>
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

export default DisposalCompanyTab
