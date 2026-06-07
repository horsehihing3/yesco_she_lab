import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'

import {
  Box, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Pagination, IconButton,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import { waterQualityApi } from '../../api/environmentApi'
import { WaterQuality, WaterQualityRequest } from '../../types/environment.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const WaterQualityTab: React.FC = () => {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const { showConfirm, showSuccess } = useAlert()
  const { user } = useAuth()


  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<WaterQuality | null>(null)
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [formData, setFormData] = useState<WaterQualityRequest>({})
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedManager, setSelectedManager] = useState<UserInfo | null>(null)

  const getManagerDisplayName = (user: UserInfo | null) => {
    if (!user) return ''
    const lang = i18n.language
    if (lang === 'en' && user.nameEn) return user.nameEn
    if (lang === 'zh' && user.nameZh) return user.nameZh
    return user.name
  }

  const { data, isLoading } = useQuery({
    queryKey: ['waterQuality', page, searchQuery],
    queryFn: () => searchQuery
      ? waterQualityApi.search(searchQuery, page, 20)
      : waterQualityApi.findAll(page, 20),
  })

  const createMutation = useMutation({
    mutationFn: (data: WaterQualityRequest) => waterQualityApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['waterQuality'] }); showSuccess(t('common.saveSuccess')); setViewMode('list') },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: WaterQualityRequest }) => waterQualityApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['waterQuality'] }); showSuccess(t('common.saveSuccess')); setViewMode('list') },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => waterQualityApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['waterQuality'] }); showSuccess(t('common.deleteSuccess')); setViewMode('list') },
  })

  const handleSearch = () => { setSearchQuery(searchText); setPage(0) }
  const handleReset = () => { setSearchText(''); setSearchQuery(''); setPage(0) }

  const handleAddClick = () => {
    setSelectedItem(null)
    setFormData({ manager: user?.name || '', measurementDate: todayStr() })
    setSelectedManager(null)
    setViewMode('create')
  }

  const handleRowClick = (item: WaterQuality) => { setSelectedItem(item); setViewMode('detail') }

  const handleEditClick = () => {
    if (!selectedItem) return
    setFormData({
      measurementDate: selectedItem.measurementDate,
      measurementPoint: selectedItem.measurementPoint,
      ph: selectedItem.ph, bod: selectedItem.bod, cod: selectedItem.cod,
      ss: selectedItem.ss, tN: selectedItem.tN, tP: selectedItem.tP,
      manager: selectedItem.manager, remark: selectedItem.remark,
    })
    setSelectedManager(null)
    setViewMode('edit')
  }

  const handleSave = () => {
    const saveData = selectedManager
      ? { ...formData, manager: getManagerDisplayName(selectedManager) }
      : formData
    if (viewMode === 'create') createMutation.mutate(saveData)
    else if (viewMode === 'edit' && selectedItem) updateMutation.mutate({ id: selectedItem.id, data: saveData })
  }

  const handleDelete = () => {
    if (!selectedItem) return
    showConfirm(t('common.confirmDelete'), () => deleteMutation.mutate(selectedItem.id))
  }

  const formatDate = (dateStr?: string) => dateStr ? dateStr.substring(0, 10) : ''
  const formatNum = (val?: number) => val != null ? String(val) : ''

  const renderListView = () => (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <ListSearchBar placeholder={t('environment.searchWaterQuality')}
          value={searchText} onChange={setSearchText} onSearch={handleSearch}
          sx={{ width: { xs: '100%', md: 250 } }}  />
        <IconButton onClick={handleReset} sx={{ display: { xs: 'none', md: 'flex' } }}><RefreshIcon /></IconButton>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick}>New</Button>
      </Box>

      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', overflowX: 'auto' }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300', wordBreak: 'keep-all' }}>{t('common.no')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300', wordBreak: 'keep-all' }}>{t('environment.measurementDate')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300', wordBreak: 'keep-all' }}>{t('environment.measurementPoint')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300', wordBreak: 'keep-all' }}>pH</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300', wordBreak: 'keep-all' }}>BOD</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300', wordBreak: 'keep-all' }}>COD</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300', wordBreak: 'keep-all' }}>SS</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300', wordBreak: 'keep-all' }}>T-N</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300', wordBreak: 'keep-all' }}>T-P</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', wordBreak: 'keep-all' }}>{t('environment.manager')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data && data.content.length > 0 ? data.content.map((item, idx) => (
              <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>{page * 20 + idx + 1}</TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>{formatDate(item.measurementDate)}</TableCell>
                <TableCell sx={{ borderRight: 1, borderColor: 'grey.300' }}>{item.measurementPoint || ''}</TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>{formatNum(item.ph)}</TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>{formatNum(item.bod)}</TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>{formatNum(item.cod)}</TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>{formatNum(item.ss)}</TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>{formatNum(item.tN)}</TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>{formatNum(item.tP)}</TableCell>
                <TableCell align="center">{item.manager || ''}</TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4 }}>{isLoading ? t('common.loading') : t('common.noData')}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1 }}>
        {data && data.content.length > 0 ? data.content.map((item) => (
          <Paper key={item.id} sx={{ p: 2, cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
            <Typography variant="subtitle2" fontWeight="bold">{item.measurementPoint || ''}</Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDate(item.measurementDate)} | pH: {formatNum(item.ph)} | BOD: {formatNum(item.bod)}
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

  const renderDetailView = () => {
    if (!selectedItem) return null
    const fields = [
      { label: t('environment.measurementDate'), value: formatDate(selectedItem.measurementDate) },
      { label: t('environment.measurementPoint'), value: selectedItem.measurementPoint },
      { label: 'pH', value: formatNum(selectedItem.ph) },
      { label: 'BOD (mg/L)', value: formatNum(selectedItem.bod) },
      { label: 'COD (mg/L)', value: formatNum(selectedItem.cod) },
      { label: 'SS (mg/L)', value: formatNum(selectedItem.ss) },
      { label: 'T-N (mg/L)', value: formatNum(selectedItem.tN) },
      { label: 'T-P (mg/L)', value: formatNum(selectedItem.tP) },
      { label: t('environment.manager'), value: selectedItem.manager },
      { label: t('environment.remark'), value: selectedItem.remark },
      { label: t('common.regUser'), value: selectedItem.regUser },
      { label: t('common.createdAt'), value: formatDate(selectedItem.createdAt) },
    ]
    return (
      <Box>
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
            {Array.from({ length: Math.ceil(fields.length / 2) }).map((_, rowIdx) => {
              const lastRow = rowIdx === Math.ceil(fields.length / 2) - 1
              return (
                <Box key={rowIdx} sx={{ display: 'flex', ...(!lastRow && { borderBottom: 1, borderColor: 'grey.300' }) }}>
                  {[0, 1].map((colIdx) => {
                    const f = fields[rowIdx * 2 + colIdx]
                    return f ? (
                      <React.Fragment key={`col${colIdx}`}><Typography sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{f.label}</Typography>
                        <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem', display: 'flex', alignItems: 'center', ...(colIdx === 0 && { borderRight: 1, borderColor: 'grey.300' }) }}>{f.value || ''}</Typography></React.Fragment>
                    ) : (
                      <React.Fragment key={`col${colIdx}`}><Box sx={{ width: 128, bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300' }} />
                        <Box sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', ...(colIdx === 0 && { borderRight: 1, borderColor: 'grey.300' }) }} /></React.Fragment>
                    )
                  })}
                </Box>
              )
            })}
          </Box>
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          {fields.map((f, i) => (
            <Box key={i}>
              <Typography variant="body2" fontWeight="bold" sx={{ bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{f.label}</Typography>
              <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{f.value || ''}</Typography>
            </Box>
          ))}
        </Box>
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
          <Typography sx={labelSx}>{t('environment.measurementDate')}</Typography>
          <Box sx={cellRSx}>
            <DatePickerField value={formData.measurementDate || ''} onChange={(v) => setFormData({ ...formData, measurementDate: v })} size="small" />
          </Box>
          <Typography sx={labelSx}>{t('environment.measurementPoint')}</Typography>
          <Box sx={cellSx}>
            <TextField fullWidth size="small" value={formData.measurementPoint || ''} onChange={(e) => setFormData({ ...formData, measurementPoint: e.target.value })} />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>pH</Typography>
          <Box sx={cellRSx}>
            <NumberField fullWidth size="small" value={formData.ph ?? ''} onChange={(v) => setFormData({ ...formData, ph: v ?? undefined })} />
          </Box>
          <Typography sx={labelSx}>BOD</Typography>
          <Box sx={cellSx}>
            <NumberField fullWidth size="small" value={formData.bod ?? ''} onChange={(v) => setFormData({ ...formData, bod: v ?? undefined })} />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>COD</Typography>
          <Box sx={cellRSx}>
            <NumberField fullWidth size="small" value={formData.cod ?? ''} onChange={(v) => setFormData({ ...formData, cod: v ?? undefined })} />
          </Box>
          <Typography sx={labelSx}>SS</Typography>
          <Box sx={cellSx}>
            <NumberField fullWidth size="small" value={formData.ss ?? ''} onChange={(v) => setFormData({ ...formData, ss: v ?? undefined })} />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>T-N</Typography>
          <Box sx={cellRSx}>
            <NumberField fullWidth size="small" value={formData.tN ?? ''} onChange={(v) => setFormData({ ...formData, tN: v ?? undefined })} />
          </Box>
          <Typography sx={labelSx}>T-P</Typography>
          <Box sx={cellSx}>
            <NumberField fullWidth size="small" value={formData.tP ?? ''} onChange={(v) => setFormData({ ...formData, tP: v ?? undefined })} />
          </Box>
        </Box>
        <Box sx={lastRowSx}>
          <Typography sx={labelSx}>{t('environment.manager')}</Typography>
          <Box sx={cellRSx}>
            <TextField fullWidth size="small" value={selectedManager ? getManagerDisplayName(selectedManager) : (formData.manager || '')} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
            <Button variant="outlined" size="small" sx={{ ml: 1, minWidth: 40 }} onClick={() => setShowUserModal(true)}><PersonSearchIcon fontSize="small" /></Button>
          </Box>
          <Typography sx={labelSx}>{t('environment.remark')}</Typography>
          <Box sx={cellSx}>
            <TextField fullWidth size="small" value={formData.remark || ''} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} />
          </Box>
        </Box>
      </Box>
      {/* Mobile Form */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('environment.measurementDate')}</Typography>
          <DatePickerField value={formData.measurementDate || ''} onChange={(v) => setFormData({ ...formData, measurementDate: v })} size="small" fullWidth />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('environment.measurementPoint')}</Typography>
          <TextField fullWidth size="small" value={formData.measurementPoint || ''} onChange={(e) => setFormData({ ...formData, measurementPoint: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>pH</Typography>
          <TextField fullWidth size="small" type="number" value={formData.ph ?? ''} onChange={(e) => setFormData({ ...formData, ph: e.target.value ? Number(e.target.value) : undefined })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>BOD (mg/L)</Typography>
          <TextField fullWidth size="small" type="number" value={formData.bod ?? ''} onChange={(e) => setFormData({ ...formData, bod: e.target.value ? Number(e.target.value) : undefined })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>COD (mg/L)</Typography>
          <TextField fullWidth size="small" type="number" value={formData.cod ?? ''} onChange={(e) => setFormData({ ...formData, cod: e.target.value ? Number(e.target.value) : undefined })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>SS (mg/L)</Typography>
          <TextField fullWidth size="small" type="number" value={formData.ss ?? ''} onChange={(e) => setFormData({ ...formData, ss: e.target.value ? Number(e.target.value) : undefined })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>T-N (mg/L)</Typography>
          <TextField fullWidth size="small" type="number" value={formData.tN ?? ''} onChange={(e) => setFormData({ ...formData, tN: e.target.value ? Number(e.target.value) : undefined })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>T-P (mg/L)</Typography>
          <TextField fullWidth size="small" type="number" value={formData.tP ?? ''} onChange={(e) => setFormData({ ...formData, tP: e.target.value ? Number(e.target.value) : undefined })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('environment.manager')}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField fullWidth size="small" value={selectedManager ? getManagerDisplayName(selectedManager) : (formData.manager || '')} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
            <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowUserModal(true)}><PersonSearchIcon fontSize="small" /></Button>
          </Box>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('environment.remark')}</Typography>
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
      <UserSelectModal open={showUserModal} onClose={() => setShowUserModal(false)} selectedUsers={[]} onConfirm={handleUserSelect} singleSelect useCompanyTree title={t('environment.selectManager')} />
    </Box>
  )
}

export default WaterQualityTab
