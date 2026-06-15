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
import { airEmissionApi } from '../../api/environmentApi'
import { AirEmission, AirEmissionRequest } from '../../types/environment.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const AirEmissionTab: React.FC = () => {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const { showConfirm, showSuccess } = useAlert()
  const { user } = useAuth()

  const { codeList: pollutantCodes, getLabel: getPollutantLabel } = useCodeMap('POLLUTANT')
  const { codeList: emissionUnitCodes, getLabel: getEmissionUnitLabel } = useCodeMap('EMISSION_UNIT')
  const { codeList: complianceCodes, getLabel: getComplianceLabel } = useCodeMap('COMPLIANCE')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<AirEmission | null>(null)
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [formData, setFormData] = useState<AirEmissionRequest>({})
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
    queryKey: ['airEmission', page, searchQuery],
    queryFn: () => searchQuery
      ? airEmissionApi.search(searchQuery, page, 20)
      : airEmissionApi.findAll(page, 20),
  })

  const createMutation = useMutation({
    mutationFn: (data: AirEmissionRequest) => airEmissionApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['airEmission'] }); showSuccess(t('common.saveSuccess')); setViewMode('list') },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AirEmissionRequest }) => airEmissionApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['airEmission'] }); showSuccess(t('common.saveSuccess')); setViewMode('list') },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => airEmissionApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['airEmission'] }); showSuccess(t('common.deleteSuccess')); setViewMode('list') },
  })

  const handleSearch = () => { setSearchQuery(searchText); setPage(0) }
  const handleReset = () => { setSearchText(''); setSearchQuery(''); setPage(0) }

  const handleAddClick = () => {
    setSelectedItem(null)
    setFormData({
      manager: user?.name || '',
      pollutant: pollutantCodes[0]?.code || '',
      unit: emissionUnitCodes[0]?.code || '',
      compliance: complianceCodes[0]?.code || '',
      measurementDate: todayStr(),
    })
    setSelectedManager(null)
    setViewMode('create')
  }

  const handleRowClick = (item: AirEmission) => { setSelectedItem(item); setViewMode('detail') }

  const handleEditClick = () => {
    if (!selectedItem) return
    setFormData({
      measurementDate: selectedItem.measurementDate,
      facility: selectedItem.facility, pollutant: selectedItem.pollutant,
      emissionConcentration: selectedItem.emissionConcentration, unit: selectedItem.unit,
      emissionStandard: selectedItem.emissionStandard, compliance: selectedItem.compliance,
      manager: selectedItem.manager, remark: selectedItem.remark,
    })
    setSelectedManager(null)
    setViewMode('edit')
  }

  // DEV ONLY — 비어있는 항목을 대기배출 측정 더미데이터로 채움 (입력값은 보존)
  const fillTestData = () => setFormData(prev => ({
    ...prev,
    measurementDate: prev.measurementDate || todayStr(),
    facility: prev.facility || '제1보일러 배출구',
    pollutant: prev.pollutant || pollutantCodes[0]?.code || '',
    unit: prev.unit || emissionUnitCodes[0]?.code || '',
    compliance: prev.compliance || complianceCodes[0]?.code || '',
    emissionConcentration: prev.emissionConcentration ?? 45.2,
    emissionStandard: prev.emissionStandard ?? 80,
    remark: prev.remark || '대기오염물질 자가측정 (테스트 데이터)',
  }))

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

  const formatNum = (val?: number) => val != null ? String(val) : ''

  const getComplianceChip = (compliance?: string) => {
    if (compliance === 'COMPLIANT') return <Chip label={getComplianceLabel(compliance)} color="success" size="small" />
    if (compliance === 'NON_COMPLIANT') return <Chip label={getComplianceLabel(compliance)} color="error" size="small" />
    return null
  }

  const renderListView = () => (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <ListSearchBar placeholder={t('environment.searchAirEmission')}
          value={searchText} onChange={setSearchText} onSearch={handleSearch}
          sx={{ width: { xs: '100%', md: 250 } }}  />
        <Button variant="contained" onClick={handleSearch} sx={{ display: { xs: 'none', md: 'flex' } }}>{t('common.search')}</Button>
        <IconButton onClick={handleReset} sx={{ display: { xs: 'none', md: 'flex' } }}><RefreshIcon /></IconButton>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick}>New</Button>
      </Box>

      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', overflowX: 'auto' }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }}>{t('common.no')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }}>{t('environment.measurementDate')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }}>{t('environment.facility')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }}>{t('environment.pollutant')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }}>{t('environment.emissionConcentration')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }}>{t('environment.emissionStandard')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }}>{t('environment.compliance')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', wordBreak: 'keep-all' }}>{t('environment.manager')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data && data.content.length > 0 ? data.content.map((item, idx) => (
              <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{page * 20 + idx + 1}</TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{formatDate(item.measurementDate)}</TableCell>
                <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{item.facility || ''}</TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{getPollutantLabel(item.pollutant || '') || ''}</TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{item.emissionConcentration != null ? `${item.emissionConcentration} ${getEmissionUnitLabel(item.unit || '')}` : ''}</TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{item.emissionStandard != null ? `${item.emissionStandard} ${getEmissionUnitLabel(item.unit || '')}` : ''}</TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{getComplianceChip(item.compliance)}</TableCell>
                <TableCell align="center">{item.manager || ''}</TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}>{isLoading ? t('common.loading') : t('common.noData')}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1 }}>
        {data && data.content.length > 0 ? data.content.map((item) => (
          <Paper key={item.id} sx={{ p: 2, cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" fontWeight="bold">{item.facility || ''}</Typography>
              {getComplianceChip(item.compliance)}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {formatDate(item.measurementDate)} | {getPollutantLabel(item.pollutant || '')} | {formatNum(item.emissionConcentration)} {getEmissionUnitLabel(item.unit || '')}
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
      { label: t('environment.facility'), value: selectedItem.facility },
      { label: t('environment.pollutant'), value: getPollutantLabel(selectedItem.pollutant || '') },
      { label: t('environment.emissionConcentration'), value: selectedItem.emissionConcentration != null ? `${selectedItem.emissionConcentration} ${getEmissionUnitLabel(selectedItem.unit || '')}` : '' },
      { label: t('environment.emissionStandard'), value: selectedItem.emissionStandard != null ? `${selectedItem.emissionStandard} ${getEmissionUnitLabel(selectedItem.unit || '')}` : '' },
      { label: t('environment.compliance'), value: getComplianceLabel(selectedItem.compliance || '') },
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
          <Typography sx={labelSx}>{t('environment.measurementDate')}</Typography>
          <Box sx={cellRSx}>
            <DatePickerField value={formData.measurementDate || ''} onChange={(v) => setFormData({ ...formData, measurementDate: v })} size="small" />
          </Box>
          <Typography sx={labelSx}>{t('environment.facility')}</Typography>
          <Box sx={cellSx}>
            <TextField fullWidth size="small" value={formData.facility || ''} onChange={(e) => setFormData({ ...formData, facility: e.target.value })} />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('environment.pollutant')}</Typography>
          <Box sx={cellRSx}>
            <FormControl fullWidth size="small">
              <Select value={formData.pollutant || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, pollutant: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {pollutantCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getPollutantLabel(c.code)}</MenuItem>))}
              </Select>
            </FormControl>
          </Box>
          <Typography sx={labelSx}>{t('environment.unit')}</Typography>
          <Box sx={cellSx}>
            <FormControl fullWidth size="small">
              <Select value={formData.unit || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, unit: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {emissionUnitCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getEmissionUnitLabel(c.code)}</MenuItem>))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('environment.emissionConcentration')}</Typography>
          <Box sx={cellRSx}>
            <NumberField fullWidth size="small" value={formData.emissionConcentration ?? ''} onChange={(v) => setFormData({ ...formData, emissionConcentration: v ?? undefined })} />
          </Box>
          <Typography sx={labelSx}>{t('environment.emissionStandard')}</Typography>
          <Box sx={cellSx}>
            <NumberField fullWidth size="small" value={formData.emissionStandard ?? ''} onChange={(v) => setFormData({ ...formData, emissionStandard: v ?? undefined })} />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t('environment.compliance')}</Typography>
          <Box sx={cellRSx}>
            <FormControl fullWidth size="small">
              <Select value={formData.compliance || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, compliance: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {complianceCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getComplianceLabel(c.code)}</MenuItem>))}
              </Select>
            </FormControl>
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
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('environment.measurementDate')}</Typography>
          <DatePickerField value={formData.measurementDate || ''} onChange={(v) => setFormData({ ...formData, measurementDate: v })} size="small" fullWidth />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('environment.facility')}</Typography>
          <TextField fullWidth size="small" value={formData.facility || ''} onChange={(e) => setFormData({ ...formData, facility: e.target.value })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('environment.pollutant')}</Typography>
          <FormControl fullWidth size="small">
            <Select value={formData.pollutant || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, pollutant: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              {pollutantCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getPollutantLabel(c.code)}</MenuItem>))}
            </Select>
          </FormControl>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('environment.unit')}</Typography>
          <FormControl fullWidth size="small">
            <Select value={formData.unit || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, unit: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              {emissionUnitCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getEmissionUnitLabel(c.code)}</MenuItem>))}
            </Select>
          </FormControl>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('environment.emissionConcentration')}</Typography>
          <TextField fullWidth size="small" type="number" value={formData.emissionConcentration ?? ''} onChange={(e) => setFormData({ ...formData, emissionConcentration: e.target.value ? Number(e.target.value) : undefined })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('environment.emissionStandard')}</Typography>
          <TextField fullWidth size="small" type="number" value={formData.emissionStandard ?? ''} onChange={(e) => setFormData({ ...formData, emissionStandard: e.target.value ? Number(e.target.value) : undefined })} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={mLabelSx}>{t('environment.compliance')}</Typography>
          <FormControl fullWidth size="small">
            <Select value={formData.compliance || ''} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, compliance: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              {complianceCodes.map((c) => (<MenuItem key={c.code} value={c.code}>{getComplianceLabel(c.code)}</MenuItem>))}
            </Select>
          </FormControl>
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
          <TextField fullWidth size="small" multiline rows={3} value={formData.remark || ''} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} />
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

export default AirEmissionTab
