import { formatDateTime } from '../../utils/dateDefaults'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import ListSearchBar from '../common/ListSearchBar'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, Select, MenuItem,
  FormControl, Chip, Pagination, CircularProgress, Alert, IconButton,
  FormControlLabel, Checkbox,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import DatePickerField from '../common/DatePickerField'
import NumberField from '../common/NumberField'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import { useAlert } from '../../contexts/AlertContext'
import { emergencyResponseApi } from '../../api/emergencyResponseApi'
import { EmergencyResponse, EmergencyResponseRequest } from '../../types/emergencyResponse.types'
import useCodeMap from '../../hooks/useCodeMap'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const statusColors: Record<string, 'default' | 'warning' | 'primary' | 'success' | 'info'> = {
  STANDBY: 'default', ISSUED: 'warning', RESPONDING: 'primary', RESOLVED: 'success', DRILL: 'info',
}

const labelSx = {
  width: 140, minWidth: 140, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: 'divider',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center',
}
const valueSx = { flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem' }
const valueBorderSx = { ...valueSx, borderRight: 1, borderColor: 'divider' }
const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

// 비활성화 상태에서도 입력값 글씨색만 활성과 동일 (placeholder 는 기본 disabled 회색 유지)
const disabledTextSx = {
  '& .MuiInputBase-input.Mui-disabled': {
    WebkitTextFillColor: (theme: any) => theme.palette.text.primary,
    '&::placeholder': {
      WebkitTextFillColor: (theme: any) => theme.palette.text.disabled,
      opacity: 1,
    },
  },
}

const emptyForm: EmergencyResponseRequest = { emergencyType: '', title: '' }

const EmrIncidentTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { codeList: typeCodes, getLabel: getTypeLabel } = useCodeMap('EMERGENCY_TYPE')
  const { codeList: statusCodes, getLabel: getStatusLabel } = useCodeMap('EMERGENCY_STATUS')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<EmergencyResponse | null>(null)
  const [form, setForm] = useState<EmergencyResponseRequest>({ ...emptyForm })
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const applySearch = () => { setSearchText(searchInput); setPage(0) }
  const handleResetSearch = () => { setSearchInput(''); setSearchText(''); setTypeFilter(''); setStatusFilter(''); setPage(0) }
  const [userSelectTarget, setUserSelectTarget] = useState<'reporter' | 'commander' | null>(null)
  const pageSize = 10

  const queryKey = statusFilter
    ? ['emrIncidentStatus', statusFilter, page]
    : ['emrIncidents', page]

  const queryFn = () => {
    if (statusFilter) return emergencyResponseApi.getByStatus(statusFilter, page, pageSize)
    return emergencyResponseApi.getAll(page, pageSize)
  }

  const { data, isLoading } = useQuery({ queryKey, queryFn, enabled: viewMode === 'list' })

  const createMutation = useMutation({
    mutationFn: (req: EmergencyResponseRequest) => emergencyResponseApi.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emrIncidents'] })
      queryClient.invalidateQueries({ queryKey: ['emrIncidentStatus'] })
      showSuccess(t('common.saved'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: number; req: EmergencyResponseRequest }) => emergencyResponseApi.update(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emrIncidents'] })
      queryClient.invalidateQueries({ queryKey: ['emrIncidentStatus'] })
      showSuccess(t('common.saved'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => emergencyResponseApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emrIncidents'] })
      queryClient.invalidateQueries({ queryKey: ['emrIncidentStatus'] })
      showSuccess(t('common.deleted'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm({ ...emptyForm }) }
  const handleOpenCreate = () => { setSelectedItem(null); setForm({ ...emptyForm }); setViewMode('create') }
  const handleOpenDetail = (item: EmergencyResponse) => { setSelectedItem(item); setViewMode('detail') }
  const handleOpenEdit = (item?: EmergencyResponse) => {
    const target = item || selectedItem
    if (!target) return
    setSelectedItem(target)
    setForm({
      title: target.title, emergencyType: target.emergencyType, status: target.status,
      location: target.location, description: target.description,
      reportedAt: target.reportedAt, respondedAt: target.respondedAt, resolvedAt: target.resolvedAt,
      reporterName: target.reporterName, reporterDept: target.reporterDept,
      commanderName: target.commanderName, commanderDept: target.commanderDept,
      casualtiesCount: target.casualtiesCount, damageDescription: target.damageDescription,
      actionsTaken: target.actionsTaken, lessonsLearned: target.lessonsLearned,
      drillYn: target.drillYn, notes: target.notes,
    })
    setViewMode('edit')
  }
  const handleUserSelect = (users: UserInfo[]) => {
    if (users.length > 0 && userSelectTarget) {
      const u = users[0]
      if (userSelectTarget === 'reporter') setForm((f) => ({ ...f, reporterName: u.name, reporterDept: u.department }))
      if (userSelectTarget === 'commander') setForm((f) => ({ ...f, commanderName: u.name, commanderDept: u.department }))
    }
    setUserSelectTarget(null)
  }

  const handleSave = () => {
    if (selectedItem) updateMutation.mutate({ id: selectedItem.id, req: form })
    else createMutation.mutate(form)
  }
  const handleDelete = async (item: EmergencyResponse) => {
    const confirmed = await showConfirm(t('common.confirmDelete', '정말로 삭제하시겠습니까?'))
    if (confirmed) deleteMutation.mutate(item.id)
  }

  let items = data?.content || []
  const totalPages = data?.totalPages || 0

  if (searchText) {
    const s = searchText.toLowerCase()
    items = items.filter((i) =>
      i.title.toLowerCase().includes(s) ||
      i.responseId?.toLowerCase().includes(s) ||
      i.location?.toLowerCase().includes(s) ||
      i.reporterName?.toLowerCase().includes(s)
    )
  }
  if (typeFilter) {
    items = items.filter((i) => i.emergencyType === typeFilter)
  }

  // ──────────────────── LIST VIEW ────────────────────
  if (viewMode === 'list') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* PC Search */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ListSearchBar placeholder={t('emr.searchPlaceholder')}
              value={searchInput} onChange={setSearchInput} onSearch={applySearch}
              sx={{ minWidth: 200 }} />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select displayEmpty value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('emr.allTypes')}</MenuItem>
                {typeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); setSearchText('') }}>
                <MenuItem value="">{t('emr.allStatus')}</MenuItem>
                {statusCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
          </Box>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>{t('common.new')}</Button>
        </Box>
        {/* Mobile Search */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <ListSearchBar fullWidth placeholder={t('emr.searchPlaceholder')}
            value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select displayEmpty value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('emr.allTypes')}</MenuItem>
                {typeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); setSearchText('') }}>
                <MenuItem value="">{t('emr.allStatus')}</MenuItem>
                {statusCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ flex: 1 }}>{t('common.new')}</Button>
          </Box>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : items.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>{t('common.noData')}</Alert>
        ) : (
          <>
            {/* PC Table */}
            <Paper sx={{ display: { xs: 'none', md: 'block' } }}>
              <TableContainer>
                <Table size="small" stickyHeader sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headerCellSx}>{t('emr.responseId')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('emr.title')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('emr.type')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('emr.location')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('emr.status')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('emr.reportedAt')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleOpenDetail(item)}>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.responseId}</TableCell>
                        <TableCell><Typography fontWeight={600} variant="body2">{item.title}</Typography></TableCell>
                        <TableCell align="center">{getTypeLabel(item.emergencyType)}</TableCell>
                        <TableCell>{item.location || ''}</TableCell>
                        <TableCell align="center">
                          <Chip label={getStatusLabel(item.status)} color={statusColors[item.status] || 'default'} size="small" />
                        </TableCell>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatDateTime(item.reportedAt) || ''}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
            {/* Mobile Card List */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              {items.map((item) => (
                <Paper key={item.id} sx={{ p: 2, border: 1, borderColor: 'divider', cursor: 'pointer' }} onClick={() => handleOpenDetail(item)}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography fontWeight="bold">{item.title}</Typography>
                    <Chip label={getStatusLabel(item.status)} color={statusColors[item.status] || 'default'} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {getTypeLabel(item.emergencyType)} | {item.location || ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.reporterName || ''} | {item.reportedAt || ''}
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

  // ──────────────────── DETAIL VIEW ────────────────────
  if (viewMode === 'detail' && selectedItem) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {/* PC Detail */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('emr.responseId')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" fontFamily="monospace">{selectedItem.responseId}</Typography>
              </Box>
              <Typography sx={labelSx}>{t('emr.status')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Chip label={getStatusLabel(selectedItem.status)} color={statusColors[selectedItem.status] || 'default'} size="small" />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('emr.title')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" fontWeight={600}>{selectedItem.title}</Typography>
              </Box>
              <Typography sx={labelSx}>{t('emr.type')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{getTypeLabel(selectedItem.emergencyType)}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('emr.location')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{selectedItem.location || ''}</Typography>
              </Box>
              <Typography sx={labelSx}>{t('emr.isDrill')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{selectedItem.drillYn ? 'Y' : 'N'}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('emr.reporter')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{selectedItem.reporterName || ''} {selectedItem.reporterDept ? `(${selectedItem.reporterDept})` : ''}</Typography>
              </Box>
              <Typography sx={labelSx}>{t('emr.commander')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{selectedItem.commanderName || ''} {selectedItem.commanderDept ? `(${selectedItem.commanderDept})` : ''}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('emr.reportedAt')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" fontFamily="monospace">{selectedItem.reportedAt || ''}</Typography>
              </Box>
              <Typography sx={labelSx}>{t('emr.resolvedAt')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" fontFamily="monospace">{selectedItem.resolvedAt || ''}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('emr.casualties')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{selectedItem.casualtiesCount ?? ''}</Typography>
              </Box>
              <Typography sx={labelSx}>{t('emr.damageDescription')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{selectedItem.damageDescription || ''}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('common.description')}</Typography>
              <Box sx={valueSx}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedItem.description || ''}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('emr.actionsTaken')}</Typography>
              <Box sx={valueSx}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedItem.actionsTaken || ''}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex' }}>
              <Typography sx={labelSx}>{t('emr.lessonsLearned')}</Typography>
              <Box sx={valueSx}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedItem.lessonsLearned || ''}</Typography>
              </Box>
            </Box>
          </Box>
          {/* Mobile Detail */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
            {[
              [t('emr.responseId'), selectedItem.responseId],
              [t('emr.status'), getStatusLabel(selectedItem.status)],
              [t('emr.title'), selectedItem.title],
              [t('emr.type'), getTypeLabel(selectedItem.emergencyType)],
              [t('emr.location'), selectedItem.location || ''],
              [t('emr.reporter'), `${selectedItem.reporterName || ''} ${selectedItem.reporterDept ? `(${selectedItem.reporterDept})` : ''}`],
              [t('emr.commander'), `${selectedItem.commanderName || ''} ${selectedItem.commanderDept ? `(${selectedItem.commanderDept})` : ''}`],
              [t('emr.reportedAt'), selectedItem.reportedAt || ''],
              [t('emr.resolvedAt'), selectedItem.resolvedAt || ''],
              [t('emr.casualties'), String(selectedItem.casualtiesCount ?? '')],
              [t('emr.damageDescription'), selectedItem.damageDescription || ''],
              [t('common.description'), selectedItem.description || ''],
              [t('emr.actionsTaken'), selectedItem.actionsTaken || ''],
              [t('emr.lessonsLearned'), selectedItem.lessonsLearned || ''],
              [t('emr.isDrill'), selectedItem.drillYn ? 'Y' : 'N'],
              [t('common.notes'), selectedItem.notes || ''],
            ].map(([label, value], i) => (
              <Box key={i}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list')}</Button>
          <Button variant="contained" onClick={() => handleOpenEdit()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.edit')}</Button>
          <Button variant="contained" color="error" onClick={() => handleDelete(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.delete')}</Button>
        </Box>
      </Box>
    )
  }

  // ──────────────────── CREATE / EDIT VIEW ────────────────────
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* PC Form */}
        <Paper sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.title')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valueBorderSx}>
              <TextField fullWidth size="small" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Box>
            <Typography sx={labelSx}>{t('emr.type')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valueSx}>
              <Select fullWidth size="small" value={form.emergencyType} onChange={(e) => setForm({ ...form, emergencyType: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {typeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.status')}</Typography>
            <Box sx={valueBorderSx}>
              <Select fullWidth size="small" value={form.status || 'STANDBY'} onChange={(e) => setForm({ ...form, status: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {statusCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
            <Typography sx={labelSx}>{t('emr.location')}</Typography>
            <Box sx={valueSx}>
              <TextField fullWidth size="small" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.reporter')}</Typography>
            <Box sx={valueBorderSx}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField fullWidth size="small" placeholder={t('common.name')} value={form.reporterName || ''} disabled sx={disabledTextSx} />
                <Button variant="outlined" size="small" startIcon={<PersonSearchIcon />} onClick={() => setUserSelectTarget('reporter')} sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}>
                  {t('common.select')}
                </Button>
              </Box>
            </Box>
            <Typography sx={labelSx}>{t('common.department')}</Typography>
            <Box sx={valueSx}>
              <TextField fullWidth size="small" value={form.reporterDept || ''} disabled sx={disabledTextSx} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.commander')}</Typography>
            <Box sx={valueBorderSx}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField fullWidth size="small" placeholder={t('common.name')} value={form.commanderName || ''} disabled sx={disabledTextSx} />
                <Button variant="outlined" size="small" startIcon={<PersonSearchIcon />} onClick={() => setUserSelectTarget('commander')} sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}>
                  {t('common.select')}
                </Button>
              </Box>
            </Box>
            <Typography sx={labelSx}>{t('common.department')}</Typography>
            <Box sx={valueSx}>
              <TextField fullWidth size="small" value={form.commanderDept || ''} disabled sx={disabledTextSx} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.casualties')}</Typography>
            <Box sx={valueBorderSx}>
              <NumberField fullWidth size="small" value={form.casualtiesCount ?? ''} onChange={(v) => setForm({ ...form, casualtiesCount: v ?? undefined })} />
            </Box>
            <Typography sx={labelSx}>{t('emr.isDrill')}</Typography>
            <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
              <FormControlLabel control={<Checkbox checked={form.drillYn || false} onChange={(e) => setForm({ ...form, drillYn: e.target.checked })} />} label="" />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('common.description')}</Typography>
            <Box sx={valueSx}>
              <TextField fullWidth size="small" multiline rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.damageDescription')}</Typography>
            <Box sx={valueSx}>
              <TextField fullWidth size="small" multiline rows={2} value={form.damageDescription || ''} onChange={(e) => setForm({ ...form, damageDescription: e.target.value })} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.actionsTaken')}</Typography>
            <Box sx={valueSx}>
              <TextField fullWidth size="small" multiline rows={3} value={form.actionsTaken || ''} onChange={(e) => setForm({ ...form, actionsTaken: e.target.value })} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.lessonsLearned')}</Typography>
            <Box sx={valueSx}>
              <TextField fullWidth size="small" multiline rows={3} value={form.lessonsLearned || ''} onChange={(e) => setForm({ ...form, lessonsLearned: e.target.value })} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Typography sx={labelSx}>{t('common.notes')}</Typography>
            <Box sx={valueSx}>
              <TextField fullWidth size="small" multiline rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Box>
          </Box>
        </Paper>

        {/* Mobile Form */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('emr.title')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('emr.type')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <FormControl fullWidth size="small">
              <Select value={form.emergencyType} onChange={(e) => setForm({ ...form, emergencyType: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {typeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.status')}</Typography>
            <FormControl fullWidth size="small">
              <Select value={form.status || 'STANDBY'} onChange={(e) => setForm({ ...form, status: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {statusCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.location')}</Typography>
            <TextField size="small" fullWidth value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.reporter')}</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField size="small" fullWidth placeholder={t('common.name')} value={form.reporterName || ''} disabled />
              <Button variant="outlined" size="small" onClick={() => setUserSelectTarget('reporter')} sx={{ minWidth: 'auto', px: 1 }}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.department')}</Typography>
            <TextField size="small" fullWidth value={form.reporterDept || ''} disabled />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.commander')}</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField size="small" fullWidth placeholder={t('common.name')} value={form.commanderName || ''} disabled />
              <Button variant="outlined" size="small" onClick={() => setUserSelectTarget('commander')} sx={{ minWidth: 'auto', px: 1 }}>
                <PersonSearchIcon fontSize="small" />
              </Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.department')}</Typography>
            <TextField size="small" fullWidth value={form.commanderDept || ''} disabled />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.casualties')}</Typography>
            <NumberField size="small" fullWidth value={form.casualtiesCount ?? ''} onChange={(v) => setForm({ ...form, casualtiesCount: v ?? undefined })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.description')}</Typography>
            <TextField size="small" fullWidth multiline rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.damageDescription')}</Typography>
            <TextField size="small" fullWidth multiline rows={2} value={form.damageDescription || ''} onChange={(e) => setForm({ ...form, damageDescription: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.actionsTaken')}</Typography>
            <TextField size="small" fullWidth multiline rows={3} value={form.actionsTaken || ''} onChange={(e) => setForm({ ...form, actionsTaken: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.lessonsLearned')}</Typography>
            <TextField size="small" fullWidth multiline rows={3} value={form.lessonsLearned || ''} onChange={(e) => setForm({ ...form, lessonsLearned: e.target.value })} />
          </Box>
          <FormControlLabel control={<Checkbox checked={form.drillYn || false} onChange={(e) => setForm({ ...form, drillYn: e.target.checked })} />} label={t('emr.isDrill')} />
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.notes')}</Typography>
            <TextField size="small" fullWidth multiline rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={() => viewMode === 'edit' ? setViewMode('detail') : handleBackToList()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save')}</Button>
        </Box>

        <UserSelectModal
          open={userSelectTarget !== null}
          onClose={() => setUserSelectTarget(null)}
          selectedUsers={[]}
          onConfirm={handleUserSelect}
          singleSelect
          useCompanyTree
          title={userSelectTarget === 'reporter' ? t('emr.reporter') : t('emr.commander')}
        />
      </Box>
    )
  }

  return null
}

export default EmrIncidentTab
