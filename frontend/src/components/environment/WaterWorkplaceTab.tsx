import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import {
  Box, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Pagination, IconButton,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import { waterWorkplaceApi, waterSamplingPointApi } from '../../api/environmentApi'
import { WaterWorkplace, WaterWorkplaceRequest, WaterSamplingPoint, WaterSamplingPointRequest } from '../../types/environment.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const WaterWorkplaceTab: React.FC = () => {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const { showConfirm, showSuccess } = useAlert()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<WaterWorkplace | null>(null)
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [formData, setFormData] = useState<WaterWorkplaceRequest>({ workplaceName: '', region: '', manager: '', remark: '' })
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedManager, setSelectedManager] = useState<UserInfo | null>(null)

  // Sampling point form
  const [showPointForm, setShowPointForm] = useState(false)
  const [pointFormData, setPointFormData] = useState<WaterSamplingPointRequest>({ workplaceId: 0, pointName: '', location: '', remark: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['waterWorkplace', page, searchQuery],
    queryFn: () => searchQuery
      ? waterWorkplaceApi.search(searchQuery, page, 20)
      : waterWorkplaceApi.findAll(page, 20),
  })

  const { data: samplingPoints } = useQuery({
    queryKey: ['waterSamplingPoints', selectedItem?.id],
    queryFn: () => waterSamplingPointApi.findByWorkplace(selectedItem!.id),
    enabled: !!selectedItem && viewMode === 'detail',
  })

  const createMutation = useMutation({
    mutationFn: (data: WaterWorkplaceRequest) => waterWorkplaceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waterWorkplace'] })
      showSuccess(t('common.saveSuccess'))
      setViewMode('list')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: WaterWorkplaceRequest }) => waterWorkplaceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waterWorkplace'] })
      showSuccess(t('common.saveSuccess'))
      setViewMode('list')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => waterWorkplaceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waterWorkplace'] })
      showSuccess(t('common.deleteSuccess'))
      setViewMode('list')
    },
  })

  const createPointMutation = useMutation({
    mutationFn: (data: WaterSamplingPointRequest) => waterSamplingPointApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waterSamplingPoints'] })
      showSuccess(t('common.saveSuccess'))
      setShowPointForm(false)
      setPointFormData({ workplaceId: 0, pointName: '', location: '', remark: '' })
    },
  })

  const deletePointMutation = useMutation({
    mutationFn: (id: number) => waterSamplingPointApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waterSamplingPoints'] })
      showSuccess(t('common.deleteSuccess'))
    },
  })

  const getManagerDisplayName = (user: UserInfo | null) => {
    if (!user) return ''
    const lang = i18n.language
    if (lang === 'en' && user.nameEn) return user.nameEn
    if (lang === 'zh' && user.nameZh) return user.nameZh
    return user.name
  }

  const handleSearch = () => { setSearchQuery(searchText); setPage(0) }
  const handleReset = () => { setSearchText(''); setSearchQuery(''); setPage(0) }

  const handleAddClick = () => {
    setSelectedItem(null)
    setFormData({ workplaceName: '', region: '', manager: '', remark: '' })
    setSelectedManager(null)
    setViewMode('create')
  }

  const handleRowClick = (item: WaterWorkplace) => {
    setSelectedItem(item)
    setViewMode('detail')
  }

  const handleEditClick = () => {
    if (!selectedItem) return
    setFormData({
      workplaceName: selectedItem.workplaceName,
      region: selectedItem.region,
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

  const handleAddPoint = () => {
    if (!selectedItem) return
    setPointFormData({ workplaceId: selectedItem.id, pointName: '', location: '', remark: '' })
    setShowPointForm(true)
  }

  const handleSavePoint = () => {
    createPointMutation.mutate(pointFormData)
  }

  const handleDeletePoint = (pointId: number) => {
    showConfirm(t('common.confirmDelete'), () => deletePointMutation.mutate(pointId))
  }

  const formatDate = (dateStr?: string) => dateStr ? dateStr.substring(0, 10) : ''

  const cellSx = { borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }

  // List View
  const renderListView = () => (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <ListSearchBar placeholder={t('water.workplace.searchWorkplace')}
          value={searchText} onChange={setSearchText} onSearch={handleSearch}
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
              <TableCell align="center" sx={{ fontWeight: 'bold', ...cellSx }}>{t('common.no')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', ...cellSx }}>{t('water.workplace.workplaceName')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', ...cellSx }}>{t('water.workplace.region')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', ...cellSx }}>{t('water.workplace.manager')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', wordBreak: 'keep-all' }}>{t('common.createdAt')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data && data.content.length > 0 ? data.content.map((item, idx) => (
              <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                <TableCell align="center" sx={cellSx}>{page * 20 + idx + 1}</TableCell>
                <TableCell sx={cellSx}>{item.workplaceName || ''}</TableCell>
                <TableCell align="center" sx={cellSx}>{item.region || ''}</TableCell>
                <TableCell align="center" sx={cellSx}>{item.manager || ''}</TableCell>
                <TableCell align="center">{formatDate(item.createdAt)}</TableCell>
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
            <Typography variant="subtitle2" fontWeight="bold">{item.workplaceName || ''}</Typography>
            <Typography variant="caption" color="text.secondary">
              {item.region || ''} | {item.manager || ''} | {formatDate(item.createdAt)}
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
      { label: t('water.workplace.workplaceName'), value: selectedItem.workplaceName },
      { label: t('water.workplace.region'), value: selectedItem.region },
      { label: t('water.workplace.manager'), value: selectedItem.manager },
      { label: t('water.workplace.remark'), value: selectedItem.remark },
      { label: t('common.regUser'), value: selectedItem.regUser },
      { label: t('common.createdAt'), value: formatDate(selectedItem.createdAt) },
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

        {/* Sampling Points Section */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">{t('water.workplace.samplingPoints')}</Typography>
            <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleAddPoint}>{t('water.workplace.addPoint')}</Button>
          </Box>

          {showPointForm && (
            <Paper sx={{ p: 2, mb: 2, border: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1, mb: 1 }}>
                <TextField size="small" label={t('water.workplace.pointName')} value={pointFormData.pointName}
                  onChange={(e) => setPointFormData({ ...pointFormData, pointName: e.target.value })} sx={{ flex: 1 }} />
                <TextField size="small" label={t('water.workplace.location')} value={pointFormData.location}
                  onChange={(e) => setPointFormData({ ...pointFormData, location: e.target.value })} sx={{ flex: 1 }} />
                <TextField size="small" label={t('water.workplace.remark')} value={pointFormData.remark}
                  onChange={(e) => setPointFormData({ ...pointFormData, remark: e.target.value })} sx={{ flex: 1 }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button variant="outlined" size="small" onClick={() => setShowPointForm(false)}>{t('common.cancel')}</Button>
                <Button variant="contained" size="small" onClick={handleSavePoint} disabled={createPointMutation.isPending}>{t('common.save')}</Button>
              </Box>
            </Paper>
          )}

          <TableContainer component={Paper} sx={{ border: 1, borderColor: 'divider' }}>
            <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
              <TableHead>
                <TableRow>
                  <TableCell align="center" sx={{ fontWeight: 'bold', ...cellSx }}>{t('common.no')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', ...cellSx }}>{t('water.workplace.pointName')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', ...cellSx }}>{t('water.workplace.location')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', ...cellSx }}>{t('water.workplace.remark')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', wordBreak: 'keep-all' }}>{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {samplingPoints && samplingPoints.length > 0 ? samplingPoints.map((point, idx) => (
                  <TableRow key={point.id}>
                    <TableCell align="center" sx={cellSx}>{idx + 1}</TableCell>
                    <TableCell sx={cellSx}>{point.pointName || ''}</TableCell>
                    <TableCell sx={cellSx}>{point.location || ''}</TableCell>
                    <TableCell sx={cellSx}>{point.remark || ''}</TableCell>
                    <TableCell align="center">
                      <Button size="small" color="error" onClick={() => handleDeletePoint(point.id)}>{t('common.delete')}</Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      {t('water.workplace.noPoints')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
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
  const fCellSx = { flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }
  const fCellRSx = { ...fCellSx, borderRight: 1, borderColor: 'divider' }
  const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'divider' }
  const lastRowSx = { display: 'flex' }
  const mLabelSx = { mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }

  const renderFormView = () => (
    <Box>
      {/* PC Form */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('water.workplace.workplaceName')}</Typography>
          <Box sx={fCellRSx}>
            <TextField fullWidth size="small" value={formData.workplaceName || ''} onChange={(e) => setFormData({ ...formData, workplaceName: e.target.value })} />
          </Box>
          <Typography sx={labelSx}>{t('water.workplace.region')}</Typography>
          <Box sx={fCellSx}>
            <TextField fullWidth size="small" value={formData.region || ''} onChange={(e) => setFormData({ ...formData, region: e.target.value })} />
          </Box>
        </Box>
        <Box sx={lastRowSx}>
          <Typography sx={labelSx}>{t('water.workplace.manager')}</Typography>
          <Box sx={fCellRSx}>
            <TextField fullWidth size="small" value={selectedManager ? getManagerDisplayName(selectedManager) : (formData.manager || '')} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
            <Button variant="outlined" size="small" sx={{ ml: 1, minWidth: 40 }} onClick={() => setShowUserModal(true)}><PersonSearchIcon fontSize="small" /></Button>
          </Box>
          <Typography sx={labelSx}>{t('water.workplace.remark')}</Typography>
          <Box sx={fCellSx}>
            <TextField fullWidth size="small" value={formData.remark || ''} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} />
          </Box>
        </Box>
      </Box>

      {/* Mobile Form */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('water.workplace.workplaceName')}</Typography>
          <TextField fullWidth size="small" value={formData.workplaceName || ''} onChange={(e) => setFormData({ ...formData, workplaceName: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('water.workplace.region')}</Typography>
          <TextField fullWidth size="small" value={formData.region || ''} onChange={(e) => setFormData({ ...formData, region: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('water.workplace.manager')}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField fullWidth size="small" value={selectedManager ? getManagerDisplayName(selectedManager) : (formData.manager || '')} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
            <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowUserModal(true)}><PersonSearchIcon fontSize="small" /></Button>
          </Box>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('water.workplace.remark')}</Typography>
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
      <UserSelectModal open={showUserModal} onClose={() => setShowUserModal(false)} selectedUsers={[]} onConfirm={handleUserSelect} singleSelect useCompanyTree title={t('water.workplace.selectManager')} />
    </Box>
  )
}

export default WaterWorkplaceTab
