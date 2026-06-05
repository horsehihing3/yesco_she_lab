import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, Select, MenuItem,
  FormControl, Chip, Pagination, CircularProgress, Alert, IconButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import NumberField from '../common/NumberField'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import useCodeMap from '../../hooks/useCodeMap'
import axiosInstance from '../../api/axiosInstance'
import { ApiResponse, PageResponse } from '../../types/common.types'
import { SafetyEducation, SafetyEducationRequest } from '../../types/occupationalExposure.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  PLANNED: 'warning', COMPLETED: 'success', CANCELLED: 'error',
}
const labelSx = {
  width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center',
}
const valueSx = { flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem' }
const valueBorderSx = { ...valueSx, borderRight: 1, borderColor: 'grey.300' }
const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const, textAlign: 'center' as const }

const api = {
  getAll: async (page = 0, size = 20) => {
    const res = await axiosInstance.get<ApiResponse<PageResponse<SafetyEducation>>>('/safety-education', { params: { page, size } })
    return res.data.data
  },
  getById: async (id: number) => {
    const res = await axiosInstance.get<ApiResponse<SafetyEducation>>(`/safety-education/${id}`)
    return res.data.data
  },
  create: async (data: SafetyEducationRequest) => {
    const res = await axiosInstance.post<ApiResponse<SafetyEducation>>('/safety-education', data)
    return res.data.data
  },
  update: async (id: number, data: SafetyEducationRequest) => {
    const res = await axiosInstance.put<ApiResponse<SafetyEducation>>(`/safety-education/${id}`, data)
    return res.data.data
  },
  delete: async (id: number) => {
    await axiosInstance.delete(`/safety-education/${id}`)
  },
}

const createApproval = async (education: SafetyEducation, userName?: string, userDept?: string, userEmail?: string) => {
  await axiosInstance.post('/approvals', {
    type: 'TRAINING',
    title: `[${education.educationType}] ${education.title}`,
    content: `${education.educationId} | ${education.title}`,
    applicantName: userName || '',
    applicantDept: userDept || '',
    applicantEmail: userEmail || '',
    requestDate: new Date().toISOString().substring(0, 10),
    status: 'PENDING',
  })
}

const emptyForm: SafetyEducationRequest = {
  title: '', educationType: 'REGULAR', educationDate: '',
}

const TrainingRequestTab: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { codeList: typeCodes, getLabel: getTypeLabel } = useCodeMap('EDUCATION_TYPE')
  const { codeList: statusCodes, getLabel: getStatusLabel } = useCodeMap('EDUCATION_STATUS')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<SafetyEducation | null>(null)
  const [form, setForm] = useState<SafetyEducationRequest>({ ...emptyForm })
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const pageSize = 10
  const applySearch = () => { setSearchText(searchInput); setPage(0) }
  const handleResetSearch = () => { setSearchInput(''); setSearchText(''); setPage(0) }

  const { data, isLoading } = useQuery({
    queryKey: ['trainingRequest', page],
    queryFn: () => api.getAll(page, pageSize),
    enabled: viewMode === 'list',
  })

  const createMutation = useMutation({
    mutationFn: async (req: SafetyEducationRequest) => {
      const created = await api.create({ ...req, status: 'PLANNED' })
      await createApproval(created, user?.name, user?.department, user?.email)
      return created
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trainingRequest'] }); queryClient.invalidateQueries({ queryKey: ['approvals'] }); showSuccess(t('common.saved')); handleBackToList() },
    onError: () => showError(t('common.error')),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: number; req: SafetyEducationRequest }) => api.update(id, req),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trainingRequest'] }); showSuccess(t('common.saved')); handleBackToList() },
    onError: () => showError(t('common.error')),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trainingRequest'] }); showSuccess(t('common.deleted')); handleBackToList() },
    onError: () => showError(t('common.error')),
  })

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm({ ...emptyForm }) }
  const handleOpenCreate = () => {
    setSelectedItem(null)
    setForm({ ...emptyForm, educationDate: todayStr(), authorName: user?.name, authorEmail: user?.email, authorDept: user?.department })
    setViewMode('create')
  }
  const handleOpenDetail = async (item: SafetyEducation) => {
    try { const detail = await api.getById(item.id); setSelectedItem(detail) } catch { setSelectedItem(item) }
    setViewMode('detail')
  }
  const handleOpenEdit = (item?: SafetyEducation) => {
    const target = item || selectedItem
    if (!target) return
    setSelectedItem(target)
    setForm({
      title: target.title, educationType: target.educationType, educationCategory: target.educationCategory,
      educationDate: target.educationDate, educationHours: target.educationHours, location: target.location,
      instructorName: target.instructorName, instructorOrg: target.instructorOrg, educationContent: target.educationContent,
      hazardousFactors: target.hazardousFactors, status: target.status, notes: target.notes,
      authorName: target.authorName, authorEmail: target.authorEmail, authorDept: target.authorDept,
    })
    setViewMode('edit')
  }
  const handleSave = () => {
    if (selectedItem) updateMutation.mutate({ id: selectedItem.id, req: form })
    else createMutation.mutate(form)
  }
  const handleDelete = async (item: SafetyEducation) => {
    const confirmed = await showConfirm(t('common.confirmDelete', '정말로 삭제하시겠습니까?'))
    if (confirmed) deleteMutation.mutate(item.id)
  }

  let items = data?.content || []
  const totalPages = data?.totalPages || 0
  if (searchText) {
    const s = searchText.toLowerCase()
    items = items.filter((i) => i.title.toLowerCase().includes(s) || i.instructorName?.toLowerCase().includes(s) || i.location?.toLowerCase().includes(s))
  }

  // ── LIST ──
  if (viewMode === 'list') {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 2 }}>{t('training.requestDesc')}</Alert>
        {/* PC Search */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ListSearchBar placeholder={t('common.search')}
              value={searchInput} onChange={setSearchInput} onSearch={applySearch}
              sx={{ minWidth: 200 }} />
            <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
          </Box>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>{t('common.new')}</Button>
        </Box>
        {/* Mobile Search */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <ListSearchBar fullWidth placeholder={t('common.search')}
            value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate} fullWidth>{t('common.new')}</Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : items.length === 0 ? (
          <Alert severity="info">{t('common.noData')}</Alert>
        ) : (
          <>
            {/* PC Table */}
            <Paper sx={{ display: { xs: 'none', md: 'block' } }}>
              <TableContainer>
                <Table size="small" stickyHeader sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'grey.300' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headerCellSx}>{t('occupationalExposure.safetyEducation.educationId')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('common.title')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('occupationalExposure.safetyEducation.educationType')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('occupationalExposure.safetyEducation.educationDate')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('occupationalExposure.safetyEducation.educationHours')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('occupationalExposure.safetyEducation.instructorName')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('occupationalExposure.safetyEducation.attendeeCount')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('common.status')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleOpenDetail(item)}>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.educationId}</TableCell>
                        <TableCell><Typography fontWeight={600} variant="body2">{item.title}</Typography></TableCell>
                        <TableCell align="center">{getTypeLabel(item.educationType)}</TableCell>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.educationDate}</TableCell>
                        <TableCell align="center">{item.educationHours ? `${item.educationHours}h` : ''}</TableCell>
                        <TableCell align="center">{item.instructorName || ''}</TableCell>
                        <TableCell align="center">{item.attendeeCount}</TableCell>
                        <TableCell align="center">
                          <Chip label={getStatusLabel(item.status)} color={statusColors[item.status] || 'default'} size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
            {/* Mobile Cards */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              {items.map((item) => (
                <Paper key={item.id} sx={{ p: 2, border: 1, borderColor: 'grey.300', cursor: 'pointer' }} onClick={() => handleOpenDetail(item)}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography fontWeight="bold" variant="body2">{item.title}</Typography>
                    <Chip label={getStatusLabel(item.status)} color={statusColors[item.status] || 'default'} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {getTypeLabel(item.educationType)} | {item.educationDate} | {item.instructorName || ''}
                  </Typography>
                </Paper>
              ))}
            </Box>
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <Pagination count={totalPages} page={page + 1} onChange={(_, p) => setPage(p - 1)} color="primary" />
              </Box>
            )}
          </>
        )}
      </Box>
    )
  }

  // ── DETAIL ──
  if (viewMode === 'detail' && selectedItem) {
    return (
      <Box>
        {/* PC */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('occupationalExposure.safetyEducation.educationId')}</Typography>
              <Box sx={valueBorderSx}><Typography variant="body2" fontFamily="monospace">{selectedItem.educationId}</Typography></Box>
              <Typography sx={labelSx}>{t('common.status')}</Typography>
              <Box sx={valueSx}><Chip label={getStatusLabel(selectedItem.status)} color={statusColors[selectedItem.status] || 'default'} size="small" /></Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('common.title')}</Typography>
              <Box sx={valueSx}><Typography variant="body2" fontWeight={600}>{selectedItem.title}</Typography></Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('occupationalExposure.safetyEducation.educationType')}</Typography>
              <Box sx={valueBorderSx}><Typography variant="body2">{getTypeLabel(selectedItem.educationType)}</Typography></Box>
              <Typography sx={labelSx}>{t('occupationalExposure.safetyEducation.educationDate')}</Typography>
              <Box sx={valueSx}><Typography variant="body2" fontFamily="monospace">{selectedItem.educationDate}</Typography></Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('occupationalExposure.safetyEducation.educationHours')}</Typography>
              <Box sx={valueBorderSx}><Typography variant="body2">{selectedItem.educationHours ? `${selectedItem.educationHours}h` : ''}</Typography></Box>
              <Typography sx={labelSx}>{t('occupationalExposure.safetyEducation.location')}</Typography>
              <Box sx={valueSx}><Typography variant="body2">{selectedItem.location || ''}</Typography></Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('occupationalExposure.safetyEducation.instructorName')}</Typography>
              <Box sx={valueBorderSx}><Typography variant="body2">{selectedItem.instructorName || ''}</Typography></Box>
              <Typography sx={labelSx}>{t('occupationalExposure.safetyEducation.instructorOrg')}</Typography>
              <Box sx={valueSx}><Typography variant="body2">{selectedItem.instructorOrg || ''}</Typography></Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
              <Typography sx={labelSx}>{t('occupationalExposure.safetyEducation.attendeeCount')}</Typography>
              <Box sx={valueBorderSx}><Typography variant="body2">{selectedItem.attendeeCount}</Typography></Box>
              <Typography sx={labelSx}>{t('occupationalExposure.safetyEducation.educationCategory')}</Typography>
              <Box sx={valueSx}><Typography variant="body2">{selectedItem.educationCategory || ''}</Typography></Box>
            </Box>
            <Box sx={{ display: 'flex' }}>
              <Typography sx={labelSx}>{t('occupationalExposure.safetyEducation.educationContent')}</Typography>
              <Box sx={valueSx}><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedItem.educationContent || ''}</Typography></Box>
            </Box>
        </Box>
        {/* Mobile */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3 }}>
          <Paper sx={{ p: 2, border: 1, borderColor: 'grey.300' }}>
            {[
              [t('occupationalExposure.safetyEducation.educationId'), selectedItem.educationId],
              [t('common.status'), getStatusLabel(selectedItem.status)],
              [t('common.title'), selectedItem.title],
              [t('occupationalExposure.safetyEducation.educationType'), getTypeLabel(selectedItem.educationType)],
              [t('occupationalExposure.safetyEducation.educationDate'), selectedItem.educationDate],
              [t('occupationalExposure.safetyEducation.educationHours'), selectedItem.educationHours ? `${selectedItem.educationHours}h` : ''],
              [t('occupationalExposure.safetyEducation.location'), selectedItem.location || ''],
              [t('occupationalExposure.safetyEducation.instructorName'), selectedItem.instructorName || ''],
              [t('occupationalExposure.safetyEducation.attendeeCount'), String(selectedItem.attendeeCount)],
              [t('occupationalExposure.safetyEducation.educationContent'), selectedItem.educationContent || ''],
            ].map(([label, value], i) => (
              <Box key={i} sx={{ mb: 1.5 }}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>{value}</Typography>
              </Box>
            ))}
          </Paper>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list')}</Button>
          {selectedItem.status === 'PLANNED' && (
            <>
              <Button variant="contained" onClick={() => handleOpenEdit()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.edit')}</Button>
              <Button variant="contained" color="error" onClick={() => handleDelete(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel')}</Button>
            </>
          )}
        </Box>
      </Box>
    )
  }

  // ── CREATE / EDIT ──
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <Box>
        {/* PC Form */}
        <Paper sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>{t('common.title')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valueSx}>
              <TextField fullWidth size="small" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>{t('occupationalExposure.safetyEducation.educationType')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valueBorderSx}>
              <Select fullWidth size="small" value={form.educationType} onChange={(e) => setForm({ ...form, educationType: e.target.value as any })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {typeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
            <Typography sx={labelSx}>{t('occupationalExposure.safetyEducation.educationDate')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valueSx}>
              <DatePickerField value={form.educationDate || null} onChange={(v) => setForm({ ...form, educationDate: v || '' })} size="small" />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>{t('occupationalExposure.safetyEducation.educationHours')}</Typography>
            <Box sx={valueBorderSx}>
              <NumberField fullWidth size="small" value={form.educationHours || ''} onChange={(v) => setForm({ ...form, educationHours: v ?? undefined })} />
            </Box>
            <Typography sx={labelSx}>{t('occupationalExposure.safetyEducation.location')}</Typography>
            <Box sx={valueSx}>
              <TextField fullWidth size="small" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
            <Typography sx={labelSx}>{t('occupationalExposure.safetyEducation.instructorName')}</Typography>
            <Box sx={valueBorderSx}>
              <TextField fullWidth size="small" value={form.instructorName || ''} onChange={(e) => setForm({ ...form, instructorName: e.target.value })} />
            </Box>
            <Typography sx={labelSx}>{t('occupationalExposure.safetyEducation.instructorOrg')}</Typography>
            <Box sx={valueSx}>
              <TextField fullWidth size="small" value={form.instructorOrg || ''} onChange={(e) => setForm({ ...form, instructorOrg: e.target.value })} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Typography sx={labelSx}>{t('occupationalExposure.safetyEducation.educationContent')}</Typography>
            <Box sx={valueSx}>
              <TextField fullWidth size="small" multiline rows={3} value={form.educationContent || ''} onChange={(e) => setForm({ ...form, educationContent: e.target.value })} />
            </Box>
          </Box>
        </Paper>

        {/* Mobile Form */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
          {[
            { label: t('common.title'), required: true, node: <TextField size="small" fullWidth value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /> },
            { label: t('occupationalExposure.safetyEducation.educationType'), required: true, node: <FormControl fullWidth size="small"><Select value={form.educationType} onChange={(e) => setForm({ ...form, educationType: e.target.value as any })} displayEmpty><MenuItem value="" disabled>선택하세요</MenuItem>{typeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getTypeLabel(c.code)}</MenuItem>)}</Select></FormControl> },
            { label: t('occupationalExposure.safetyEducation.educationDate'), required: true, node: <DatePickerField value={form.educationDate || null} onChange={(v) => setForm({ ...form, educationDate: v || '' })} size="small" /> },
            { label: t('occupationalExposure.safetyEducation.educationHours'), node: <NumberField size="small" fullWidth value={form.educationHours || ''} onChange={(v) => setForm({ ...form, educationHours: v ?? undefined })} /> },
            { label: t('occupationalExposure.safetyEducation.location'), node: <TextField size="small" fullWidth value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} /> },
            { label: t('occupationalExposure.safetyEducation.instructorName'), node: <TextField size="small" fullWidth value={form.instructorName || ''} onChange={(e) => setForm({ ...form, instructorName: e.target.value })} /> },
            { label: t('occupationalExposure.safetyEducation.educationContent'), node: <TextField size="small" fullWidth multiline rows={3} value={form.educationContent || ''} onChange={(e) => setForm({ ...form, educationContent: e.target.value })} /> },
          ].map(({ label, required, node }, i) => (
            <Box key={i}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {label} {required && <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>}
              </Typography>
              {node}
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={() => viewMode === 'edit' ? setViewMode('detail') : handleBackToList()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save')}</Button>
        </Box>
      </Box>
    )
  }

  return null
}

export default TrainingRequestTab
