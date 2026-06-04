import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import {
  Box, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Pagination, IconButton, FormControl, Select, MenuItem, SelectChangeEvent, Chip,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import UserSelectModal from '../common/UserSelectModal'
import type { UserInfo } from '../common/UserSelectModal'
import { useCodeMap } from '../../hooks/useCodeMap'
import { wasteComplianceApi } from '../../api/environmentApi'
import { WasteCompliance, WasteComplianceRequest } from '../../types/environment.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const statusChipColor = (status?: string): 'success' | 'error' | 'default' => {
  if (status === 'COMPLIANT') return 'success'
  if (status === 'NON_COMPLIANT') return 'error'
  return 'default'
}

const actionStatusChipColor = (status?: string): 'warning' | 'info' | 'success' | 'default' => {
  if (status === 'NOT_DONE') return 'warning'
  if (status === 'IN_PROGRESS') return 'info'
  if (status === 'DONE') return 'success'
  return 'default'
}

const WasteComplianceTab: React.FC = () => {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const { showConfirm, showSuccess } = useAlert()
  const { codeList: statusCodes, getLabel: getStatusLabel } = useCodeMap('COMPLIANCE_CHECK_STATUS')
  const { codeList: actionStatusCodes, getLabel: getActionStatusLabel } = useCodeMap('ACTION_STATUS')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<WasteCompliance | null>(null)
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [formData, setFormData] = useState<WasteComplianceRequest>({})
  const [responsibleModalOpen, setResponsibleModalOpen] = useState(false)

  const getDisplayName = (user: UserInfo) => {
    if (i18n.language === 'en' && user.nameEn) return user.nameEn
    if (i18n.language === 'zh' && user.nameZh) return user.nameZh
    return user.name
  }

  const handleResponsibleConfirm = (users: UserInfo[]) => {
    if (users.length > 0) {
      setFormData({ ...formData, responsiblePerson: getDisplayName(users[0]) })
    }
    setResponsibleModalOpen(false)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['wasteCompliance', page, searchQuery],
    queryFn: () => searchQuery
      ? wasteComplianceApi.search(searchQuery, page, 20)
      : wasteComplianceApi.findAll(page, 20),
  })

  const createMutation = useMutation({
    mutationFn: (data: WasteComplianceRequest) => wasteComplianceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wasteCompliance'] })
      showSuccess(t('common.saveSuccess'))
      setViewMode('list')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: WasteComplianceRequest }) => wasteComplianceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wasteCompliance'] })
      showSuccess(t('common.saveSuccess'))
      setViewMode('list')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => wasteComplianceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wasteCompliance'] })
      showSuccess(t('common.deleteSuccess'))
      setViewMode('list')
    },
  })

  const handleSearch = () => { setSearchQuery(searchText); setPage(0) }
  const handleReset = () => { setSearchText(''); setSearchQuery(''); setPage(0) }

  const handleAddClick = () => {
    setSelectedItem(null)
    setFormData({
      status: statusCodes[0]?.code || '',
      actionStatus: actionStatusCodes[0]?.code || '',
      checkDate: todayStr(),
      actionDeadline: todayStr(),
    })
    setViewMode('create')
  }

  const handleRowClick = (item: WasteCompliance) => {
    setSelectedItem(item)
    setViewMode('detail')
  }

  const handleEditClick = () => {
    if (!selectedItem) return
    setFormData({
      checkDate: selectedItem.checkDate,
      regulationName: selectedItem.regulationName,
      checkItem: selectedItem.checkItem,
      status: selectedItem.status,
      violationDetails: selectedItem.violationDetails,
      correctiveAction: selectedItem.correctiveAction,
      actionDeadline: selectedItem.actionDeadline,
      responsiblePerson: selectedItem.responsiblePerson,
      actionStatus: selectedItem.actionStatus,
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

  // Compliance stats summary
  const complianceStats = () => {
    if (!data || !data.content) return { compliant: 0, nonCompliant: 0, notApplicable: 0 }
    const items = data.content
    return {
      compliant: items.filter(i => i.status === 'COMPLIANT').length,
      nonCompliant: items.filter(i => i.status === 'NON_COMPLIANT').length,
      notApplicable: items.filter(i => i.status === 'NOT_APPLICABLE').length,
    }
  }

  // List View
  const renderListView = () => {
    const stats = complianceStats()
    return (
      <Box>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <ListSearchBar placeholder={t('waste.compliance.search')}
          value={searchText} onChange={setSearchText} onSearch={handleSearch}
          sx={{ width: { xs: '100%', md: 250 } }}  />
          <Button variant="contained" onClick={handleSearch} sx={{ display: { xs: 'none', md: 'flex' } }}>{t('common.search')}</Button>
          <IconButton onClick={handleReset} sx={{ display: { xs: 'none', md: 'flex' } }}><RefreshIcon /></IconButton>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick}>New</Button>
        </Box>

        {/* Compliance Stats Summary */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip label={`${getStatusLabel('COMPLIANT')} ${stats.compliant}`} color="success" size="small" />
          <Chip label={`${getStatusLabel('NON_COMPLIANT')} ${stats.nonCompliant}`} color="error" size="small" />
          <Chip label={`${getStatusLabel('NOT_APPLICABLE')} ${stats.notApplicable}`} size="small" />
        </Box>

        {/* PC Table */}
        <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', overflowX: 'auto' }}>
          <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300', wordBreak: 'keep-all' }}>{t('common.no')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300', wordBreak: 'keep-all' }}>{t('waste.compliance.checkDate')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300', wordBreak: 'keep-all' }}>{t('waste.compliance.regulationName')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300', wordBreak: 'keep-all' }}>{t('waste.compliance.checkItem')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300', wordBreak: 'keep-all' }}>{t('waste.compliance.status')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'grey.300', wordBreak: 'keep-all' }}>{t('waste.compliance.responsiblePerson')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', wordBreak: 'keep-all' }}>{t('waste.compliance.actionStatus')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data && data.content.length > 0 ? data.content.map((item, idx) => (
                <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>{page * 20 + idx + 1}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>{formatDate(item.checkDate)}</TableCell>
                  <TableCell sx={{ borderRight: 1, borderColor: 'grey.300' }}>{item.regulationName || ''}</TableCell>
                  <TableCell sx={{ borderRight: 1, borderColor: 'grey.300' }}>{item.checkItem || ''}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>
                    {item.status
                      ? <Chip label={getStatusLabel(item.status)} color={statusChipColor(item.status)} size="small" />
                      : ''}
                  </TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.300' }}>{item.responsiblePerson || ''}</TableCell>
                  <TableCell align="center">
                    {item.actionStatus
                      ? <Chip label={getActionStatusLabel(item.actionStatus)} color={actionStatusChipColor(item.actionStatus)} size="small" />
                      : ''}
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
                <Typography variant="subtitle2" fontWeight="bold">{item.regulationName || ''}</Typography>
                <Chip label={getStatusLabel(item.status || '')} color={statusChipColor(item.status)} size="small" />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {item.checkItem || ''} | {formatDate(item.checkDate)} | {item.responsiblePerson || ''}
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                {item.actionStatus
                  ? <Chip label={getActionStatusLabel(item.actionStatus)} color={actionStatusChipColor(item.actionStatus)} size="small" />
                  : null}
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
  }

  // Detail View
  const renderDetailView = () => {
    if (!selectedItem) return null
    const fields = [
      { label: t('waste.compliance.checkDate'), value: formatDate(selectedItem.checkDate) },
      { label: t('waste.compliance.regulationName'), value: selectedItem.regulationName },
      { label: t('waste.compliance.checkItem'), value: selectedItem.checkItem },
      { label: t('waste.compliance.status'), value: selectedItem.status ? getStatusLabel(selectedItem.status) : '' },
      { label: t('waste.compliance.violationDetails'), value: selectedItem.violationDetails },
      { label: t('waste.compliance.correctiveAction'), value: selectedItem.correctiveAction },
      { label: t('waste.compliance.actionDeadline'), value: formatDate(selectedItem.actionDeadline) },
      { label: t('waste.compliance.responsiblePerson'), value: selectedItem.responsiblePerson },
      { label: t('waste.compliance.actionStatus'), value: selectedItem.actionStatus ? getActionStatusLabel(selectedItem.actionStatus) : '' },
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
          <Typography sx={labelSx}>{t('waste.compliance.checkDate')}</Typography>
          <Box sx={cellRSx}>
            <DatePickerField value={formData.checkDate || ''} onChange={(v) => setFormData({ ...formData, checkDate: v })} size="small" />
          </Box>
          <Typography sx={labelSx}>{t('waste.compliance.regulationName')}</Typography>
          <Box sx={cellSx}>
            <TextField fullWidth size="small" value={formData.regulationName || ''} onChange={(e) => setFormData({ ...formData, regulationName: e.target.value })} />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('waste.compliance.checkItem')}</Typography>
          <Box sx={cellRSx}>
            <TextField fullWidth size="small" value={formData.checkItem || ''} onChange={(e) => setFormData({ ...formData, checkItem: e.target.value })} />
          </Box>
          <Typography sx={labelSx}>{t('waste.compliance.status')}</Typography>
          <Box sx={cellSx}>
            <FormControl fullWidth size="small">
              <Select value={formData.status || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, status: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택</MenuItem>
                {statusCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('waste.compliance.violationDetails')}</Typography>
          <Box sx={cellSx}>
            <TextField fullWidth size="small" multiline rows={3} value={formData.violationDetails || ''} onChange={(e) => setFormData({ ...formData, violationDetails: e.target.value })} />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('waste.compliance.correctiveAction')}</Typography>
          <Box sx={cellSx}>
            <TextField fullWidth size="small" multiline rows={3} value={formData.correctiveAction || ''} onChange={(e) => setFormData({ ...formData, correctiveAction: e.target.value })} />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('waste.compliance.actionDeadline')}</Typography>
          <Box sx={cellRSx}>
            <DatePickerField value={formData.actionDeadline || ''} onChange={(v) => setFormData({ ...formData, actionDeadline: v })} size="small" />
          </Box>
          <Typography sx={labelSx}>{t('waste.compliance.responsiblePerson')}</Typography>
          <Box sx={cellSx}>
            <TextField fullWidth size="small" value={formData.responsiblePerson || ''} InputProps={{ readOnly: true }} />
            <Button variant="outlined" size="small" sx={{ ml: 1, minWidth: 40 }} onClick={() => setResponsibleModalOpen(true)}><PersonSearchIcon fontSize="small" /></Button>
          </Box>
        </Box>
        <Box sx={lastRowSx}>
          <Typography sx={labelSx}>{t('waste.compliance.actionStatus')}</Typography>
          <Box sx={cellSx}>
            <FormControl fullWidth size="small">
              <Select value={formData.actionStatus || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, actionStatus: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택</MenuItem>
                {actionStatusCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getActionStatusLabel(c.code)}</MenuItem>))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>
      {/* Mobile Form */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('waste.compliance.checkDate')}</Typography>
          <DatePickerField value={formData.checkDate || ''} onChange={(v) => setFormData({ ...formData, checkDate: v })} size="small" fullWidth />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('waste.compliance.regulationName')}</Typography>
          <TextField fullWidth size="small" value={formData.regulationName || ''} onChange={(e) => setFormData({ ...formData, regulationName: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('waste.compliance.checkItem')}</Typography>
          <TextField fullWidth size="small" value={formData.checkItem || ''} onChange={(e) => setFormData({ ...formData, checkItem: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('waste.compliance.status')}</Typography>
          <FormControl fullWidth size="small">
            <Select value={formData.status || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, status: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택</MenuItem>
              {statusCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>))}
            </Select>
          </FormControl>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('waste.compliance.violationDetails')}</Typography>
          <TextField fullWidth size="small" multiline rows={3} value={formData.violationDetails || ''} onChange={(e) => setFormData({ ...formData, violationDetails: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('waste.compliance.correctiveAction')}</Typography>
          <TextField fullWidth size="small" multiline rows={3} value={formData.correctiveAction || ''} onChange={(e) => setFormData({ ...formData, correctiveAction: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('waste.compliance.actionDeadline')}</Typography>
          <DatePickerField value={formData.actionDeadline || ''} onChange={(v) => setFormData({ ...formData, actionDeadline: v })} size="small" fullWidth />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('waste.compliance.responsiblePerson')}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField fullWidth size="small" value={formData.responsiblePerson || ''} InputProps={{ readOnly: true }} />
            <Button variant="outlined" size="small" sx={{ ml: 1, minWidth: 40 }} onClick={() => setResponsibleModalOpen(true)}><PersonSearchIcon fontSize="small" /></Button>
          </Box>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('waste.compliance.actionStatus')}</Typography>
          <FormControl fullWidth size="small">
            <Select value={formData.actionStatus || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, actionStatus: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택</MenuItem>
              {actionStatusCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getActionStatusLabel(c.code)}</MenuItem>))}
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

      <UserSelectModal
        open={responsibleModalOpen}
        onClose={() => setResponsibleModalOpen(false)}
        selectedUsers={[]}
        onConfirm={handleResponsibleConfirm}
        title={t('waste.compliance.selectResponsiblePerson')}
        singleSelect
        useCompanyTree
      />
    </Box>
  )
}

export default WasteComplianceTab
