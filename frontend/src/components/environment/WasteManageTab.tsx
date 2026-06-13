import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import {
  Box, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Pagination, IconButton, FormControl, Select, MenuItem, SelectChangeEvent, Chip,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import DatePickerField from '../common/DatePickerField'
import { todayStr, formatDate } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import { useCodeMap } from '../../hooks/useCodeMap'
import DevTestFillButton from '../common/DevTestFillButton'
import { wasteManageApi } from '../../api/environmentApi'
import { WasteManage, WasteManageRequest } from '../../types/environment.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const statusColors: Record<string, 'primary' | 'warning' | 'info' | 'success'> = {
  STORING: 'primary',
  DISPOSAL_REQUEST: 'warning',
  PROCESSING: 'info',
  COMPLETED: 'success',
}

const WasteManageTab: React.FC = () => {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const { showConfirm, showSuccess } = useAlert()
  const { user } = useAuth()
  const { codeList: wasteTypeCodes, getLabel: getWasteTypeLabel } = useCodeMap('WASTE_TYPE')
  const { codeList: disposalMethodCodes, getLabel: getDisposalMethodLabel } = useCodeMap('DISPOSAL_METHOD')
  const { codeList: wasteUnitCodes, getLabel: getWasteUnitLabel } = useCodeMap('WASTE_UNIT')
  const { codeList: disposalCompanyCodes, getLabel: getDisposalCompanyLabel } = useCodeMap('DISPOSAL_COMPANY')
  const { codeList: wasteStatusCodes, getLabel: getWasteStatusLabel } = useCodeMap('WASTE_STATUS')
  const { codeList: wasteCategoryCodes, getLabel: getWasteCategoryLabel } = useCodeMap('WASTE_CATEGORY')
  const { codeList: departmentCodes, getLabel: getDepartmentLabel } = useCodeMap('WASTE_DEPARTMENT')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<WasteManage | null>(null)
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [formData, setFormData] = useState<WasteManageRequest>({})
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
    queryKey: ['wasteManage', page, searchQuery, statusFilter],
    queryFn: () => {
      if (searchQuery) return wasteManageApi.search(searchQuery, page, 20)
      if (statusFilter !== 'ALL') return wasteManageApi.findByStatus(statusFilter, page, 20)
      return wasteManageApi.findAll(page, 20)
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: WasteManageRequest) => wasteManageApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wasteManage'] })
      showSuccess(t('common.saveSuccess'))
      setViewMode('list')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: WasteManageRequest }) => wasteManageApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wasteManage'] })
      showSuccess(t('common.saveSuccess'))
      setViewMode('list')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => wasteManageApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wasteManage'] })
      showSuccess(t('common.deleteSuccess'))
      setViewMode('list')
    },
  })

  const handleSearch = () => { setSearchQuery(searchText); setPage(0) }
  const handleReset = () => { setSearchText(''); setSearchQuery(''); setStatusFilter('ALL'); setPage(0) }

  const handleAddClick = () => {
    setSelectedItem(null)
    setFormData({
      manager: user?.name || '',
      wasteType: wasteTypeCodes[0]?.code || '',
      disposalMethod: disposalMethodCodes[0]?.code || '',
      unit: wasteUnitCodes[0]?.code || '',
      disposalCompany: disposalCompanyCodes[0]?.code || '',
      status: 'STORING',
      generationDate: todayStr(),
      disposalDate: todayStr(),
    })
    setSelectedManager(null)
    setViewMode('create')
  }

  const handleRowClick = (item: WasteManage) => {
    setSelectedItem(item)
    setViewMode('detail')
  }

  const handleEditClick = () => {
    if (!selectedItem) return
    setFormData({
      wasteCode: selectedItem.wasteCode,
      wasteType: selectedItem.wasteType,
      wasteName: selectedItem.wasteName,
      wasteCategory: selectedItem.wasteCategory,
      generationAmount: selectedItem.generationAmount,
      unit: selectedItem.unit,
      generationDate: selectedItem.generationDate,
      department: selectedItem.department,
      storageLocation: selectedItem.storageLocation,
      status: selectedItem.status,
      disposalMethod: selectedItem.disposalMethod,
      disposalCompany: selectedItem.disposalCompany,
      disposalDate: selectedItem.disposalDate,
      manager: selectedItem.manager,
      remark: selectedItem.remark,
    })
    setSelectedManager(null)
    setViewMode('edit')
  }

  // DEV ONLY — 비어있는 항목을 폐기물 관리 더미데이터로 채움 (입력값은 보존)
  const fillTestData = () => setFormData(prev => ({
    ...prev,
    wasteCode: prev.wasteCode || 'WST-2026-001',
    wasteName: prev.wasteName || '폐유',
    wasteCategory: prev.wasteCategory || wasteCategoryCodes[0]?.code || '',
    generationAmount: prev.generationAmount ?? 350,
    department: prev.department || departmentCodes[0]?.code || '',
    storageLocation: prev.storageLocation || '제1공장 폐기물 보관창고',
    remark: prev.remark || '지정폐기물 위탁처리 (테스트 데이터)',
  }))

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


  const statusTabs = [
    { value: 'ALL', label: t('common.all') },
    ...wasteStatusCodes.map(c => ({ value: c.code, label: getWasteStatusLabel(c.code) })),
  ]

  // List View
  const renderListView = () => (
    <Box>
      {/* Search / Filter bar - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ListSearchBar placeholder={t('environment.searchWaste')}
          value={searchText} onChange={setSearchText} onSearch={handleSearch}
          sx={{ minWidth: 200 }}  />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              {statusTabs.map(tab => (
                <MenuItem key={tab.value} value={tab.value}>{tab.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick}>New</Button>
      </Box>
      {/* Search / Filter bar - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
        <ListSearchBar fullWidth placeholder={t('environment.searchWaste')}
          value={searchText} onChange={setSearchText} onSearch={handleSearch} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              {statusTabs.map(tab => (
                <MenuItem key={tab.value} value={tab.value}>{tab.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick} sx={{ flex: 1 }}>New</Button>
        </Box>
      </Box>

      {/* PC Table */}
      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', overflowX: 'auto' }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }}>{t('common.no')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }}>{t('waste.wasteCode')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }}>{t('environment.wasteName')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }}>{t('environment.wasteType')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }}>{t('environment.generationAmount')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }}>{t('waste.department')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }}>{t('waste.status')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', wordBreak: 'keep-all' }}>{t('environment.disposalDate')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data && data.content.length > 0 ? data.content.map((item, idx) => (
              <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{page * 20 + idx + 1}</TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{item.wasteCode || ''}</TableCell>
                <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{item.wasteName || ''}</TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{getWasteTypeLabel(item.wasteType || '') || ''}</TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{item.generationAmount != null ? `${item.generationAmount} ${getWasteUnitLabel(item.unit || '')}` : ''}</TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{getDepartmentLabel(item.department || '') || ''}</TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>
                  <Chip label={getWasteStatusLabel(item.status || '') || ''} size="small" color={statusColors[item.status || ''] || 'default'} />
                </TableCell>
                <TableCell align="center">{formatDate(item.disposalDate)}</TableCell>
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
              <Typography variant="subtitle2" fontWeight="bold">{item.wasteName || ''}</Typography>
              <Chip label={getWasteStatusLabel(item.status || '') || ''} size="small" color={statusColors[item.status || ''] || 'default'} />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {item.wasteCode} | {getWasteTypeLabel(item.wasteType || '')} | {formatDate(item.disposalDate)}
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
      { label: t('waste.wasteCode'), value: selectedItem.wasteCode },
      { label: t('environment.wasteName'), value: selectedItem.wasteName },
      { label: t('environment.wasteType'), value: getWasteTypeLabel(selectedItem.wasteType || '') },
      { label: t('waste.wasteCategory'), value: getWasteCategoryLabel(selectedItem.wasteCategory || '') },
      { label: t('environment.generationAmount'), value: selectedItem.generationAmount != null ? `${selectedItem.generationAmount} ${getWasteUnitLabel(selectedItem.unit || '')}` : '' },
      { label: t('waste.generationDate'), value: formatDate(selectedItem.generationDate) },
      { label: t('waste.department'), value: getDepartmentLabel(selectedItem.department || '') },
      { label: t('waste.storageLocation'), value: selectedItem.storageLocation },
      { label: t('waste.status'), value: getWasteStatusLabel(selectedItem.status || '') },
      { label: t('environment.disposalMethod'), value: getDisposalMethodLabel(selectedItem.disposalMethod || '') },
      { label: t('environment.disposalCompany'), value: getDisposalCompanyLabel(selectedItem.disposalCompany || '') },
      { label: t('environment.disposalDate'), value: formatDate(selectedItem.disposalDate) },
      { label: t('environment.manager'), value: selectedItem.manager },
      { label: t('environment.remark'), value: selectedItem.remark },
      { label: t('common.regUser'), value: selectedItem.regUser },
      { label: t('common.createdAt'), value: formatDate(selectedItem.createdAt) },
    ]
    return (
      <Box>
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
          <Typography sx={labelSx}>{t('environment.wasteType')}</Typography>
          <Box sx={cellRSx}>
            <FormControl fullWidth size="small">
              <Select value={formData.wasteType || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, wasteType: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {wasteTypeCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getWasteTypeLabel(c.code)}</MenuItem>))}
              </Select>
            </FormControl>
          </Box>
          <Typography sx={labelSx}>{t('environment.wasteName')}</Typography>
          <Box sx={cellSx}>
            <TextField fullWidth size="small" value={formData.wasteName || ''} onChange={(e) => setFormData({ ...formData, wasteName: e.target.value })} />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('waste.wasteCategory')}</Typography>
          <Box sx={cellRSx}>
            <FormControl fullWidth size="small">
              <Select value={formData.wasteCategory || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, wasteCategory: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {wasteCategoryCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getWasteCategoryLabel(c.code)}</MenuItem>))}
              </Select>
            </FormControl>
          </Box>
          <Typography sx={labelSx}>{t('waste.department')}</Typography>
          <Box sx={cellSx}>
            <FormControl fullWidth size="small">
              <Select value={formData.department || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, department: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {departmentCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getDepartmentLabel(c.code)}</MenuItem>))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('environment.generationAmount')}</Typography>
          <Box sx={cellRSx}>
            <NumberField fullWidth size="small" value={formData.generationAmount ?? ''} onChange={(v) => setFormData({ ...formData, generationAmount: v ?? undefined })} />
          </Box>
          <Typography sx={labelSx}>{t('environment.unit')}</Typography>
          <Box sx={cellSx}>
            <FormControl fullWidth size="small">
              <Select value={formData.unit || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, unit: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {wasteUnitCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getWasteUnitLabel(c.code)}</MenuItem>))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('waste.generationDate')}</Typography>
          <Box sx={cellRSx}>
            <DatePickerField value={formData.generationDate || ''} onChange={(v) => setFormData({ ...formData, generationDate: v })} size="small" />
          </Box>
          <Typography sx={labelSx}>{t('waste.storageLocation')}</Typography>
          <Box sx={cellSx}>
            <TextField fullWidth size="small" value={formData.storageLocation || ''} onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })} />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('environment.disposalMethod')}</Typography>
          <Box sx={cellRSx}>
            <FormControl fullWidth size="small">
              <Select value={formData.disposalMethod || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, disposalMethod: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {disposalMethodCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getDisposalMethodLabel(c.code)}</MenuItem>))}
              </Select>
            </FormControl>
          </Box>
          <Typography sx={labelSx}>{t('environment.disposalCompany')}</Typography>
          <Box sx={cellSx}>
            <FormControl fullWidth size="small">
              <Select value={formData.disposalCompany || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, disposalCompany: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {disposalCompanyCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getDisposalCompanyLabel(c.code)}</MenuItem>))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('environment.disposalDate')}</Typography>
          <Box sx={cellRSx}>
            <DatePickerField value={formData.disposalDate || ''} onChange={(v) => setFormData({ ...formData, disposalDate: v })} size="small" />
          </Box>
          <Typography sx={labelSx}>{t('environment.manager')}</Typography>
          <Box sx={cellSx}>
            <TextField fullWidth size="small" value={selectedManager ? getManagerDisplayName(selectedManager) : (formData.manager || '')} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
            <Button variant="outlined" size="small" sx={{ ml: 1, minWidth: 40 }} onClick={() => setShowUserModal(true)}><PersonSearchIcon fontSize="small" /></Button>
          </Box>
        </Box>
        <Box sx={lastRowSx}>
          <Typography sx={labelSx}>{t('environment.remark')}</Typography>
          <Box sx={cellSx}>
            <TextField fullWidth size="small" multiline rows={3} value={formData.remark || ''} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} />
          </Box>
        </Box>
      </Box>
      {/* Mobile Form */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
        {[
          { label: t('environment.wasteType'), el: <FormControl fullWidth size="small"><Select value={formData.wasteType || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, wasteType: e.target.value })} displayEmpty><MenuItem value="" disabled>선택하세요</MenuItem>{wasteTypeCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getWasteTypeLabel(c.code)}</MenuItem>))}</Select></FormControl> },
          { label: t('environment.wasteName'), el: <TextField fullWidth size="small" value={formData.wasteName || ''} onChange={(e) => setFormData({ ...formData, wasteName: e.target.value })} /> },
          { label: t('waste.wasteCategory'), el: <FormControl fullWidth size="small"><Select value={formData.wasteCategory || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, wasteCategory: e.target.value })} displayEmpty><MenuItem value="" disabled>선택하세요</MenuItem>{wasteCategoryCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getWasteCategoryLabel(c.code)}</MenuItem>))}</Select></FormControl> },
          { label: t('waste.department'), el: <FormControl fullWidth size="small"><Select value={formData.department || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, department: e.target.value })} displayEmpty><MenuItem value="" disabled>선택하세요</MenuItem>{departmentCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getDepartmentLabel(c.code)}</MenuItem>))}</Select></FormControl> },
          { label: t('environment.generationAmount'), el: <NumberField fullWidth size="small" value={formData.generationAmount ?? ''} onChange={(v) => setFormData({ ...formData, generationAmount: v ?? undefined })} /> },
          { label: t('environment.unit'), el: <FormControl fullWidth size="small"><Select value={formData.unit || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, unit: e.target.value })} displayEmpty><MenuItem value="" disabled>선택하세요</MenuItem>{wasteUnitCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getWasteUnitLabel(c.code)}</MenuItem>))}</Select></FormControl> },
          { label: t('waste.generationDate'), el: <DatePickerField value={formData.generationDate || ''} onChange={(v) => setFormData({ ...formData, generationDate: v })} size="small" fullWidth /> },
          { label: t('waste.storageLocation'), el: <TextField fullWidth size="small" value={formData.storageLocation || ''} onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })} /> },
          { label: t('environment.disposalMethod'), el: <FormControl fullWidth size="small"><Select value={formData.disposalMethod || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, disposalMethod: e.target.value })} displayEmpty><MenuItem value="" disabled>선택하세요</MenuItem>{disposalMethodCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getDisposalMethodLabel(c.code)}</MenuItem>))}</Select></FormControl> },
          { label: t('environment.disposalCompany'), el: <FormControl fullWidth size="small"><Select value={formData.disposalCompany || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, disposalCompany: e.target.value })} displayEmpty><MenuItem value="" disabled>선택하세요</MenuItem>{disposalCompanyCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getDisposalCompanyLabel(c.code)}</MenuItem>))}</Select></FormControl> },
          { label: t('environment.disposalDate'), el: <DatePickerField value={formData.disposalDate || ''} onChange={(v) => setFormData({ ...formData, disposalDate: v })} size="small" fullWidth /> },
          { label: t('environment.manager'), el: <Box sx={{ display: 'flex', gap: 1 }}><TextField fullWidth size="small" value={selectedManager ? getManagerDisplayName(selectedManager) : (formData.manager || '')} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} /><Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowUserModal(true)}><PersonSearchIcon fontSize="small" /></Button></Box> },
          { label: t('environment.remark'), el: <TextField fullWidth size="small" multiline rows={3} value={formData.remark || ''} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} /> },
        ].map((field, i) => (
          <Box key={i}>
            <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{field.label}</Typography>
            {field.el}
          </Box>
        ))}
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

export default WasteManageTab
