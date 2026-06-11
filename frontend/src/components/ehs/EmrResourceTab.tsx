import { useState } from 'react'
import { isSystemAdmin } from '../../utils/auth'
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
import { useButtonRules } from '../../hooks/useButtonRules'
import { emergencyResourceApi } from '../../api/emergencyExtendedApi'
import { EmergencyResource, EmergencyResourceRequest } from '../../types/emergencyExtended.types'
import useCodeMap from '../../hooks/useCodeMap'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  NORMAL: 'success', CHECK_NEEDED: 'warning', DEFECTIVE: 'error', DISPOSED: 'default',
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

const emptyForm: EmergencyResourceRequest = { resourceName: '', resourceType: '' }

const MENU = 'EHS 경영 › 비상 훈련 › 자원·장비'

const EmrResourceTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const isAdmin = isSystemAdmin(user) || user?.role === 'TEAM_ADMIN'
  const myRoles: string[] = ['guest', ...(user?.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : (user?.role ? [user.role] : []))]
  const { codeList: resourceTypeCodes, getLabel: getResourceTypeLabel } = useCodeMap('RESOURCE_TYPE')
  const { codeList: resourceStatusCodes, getLabel: getResourceStatusLabel } = useCodeMap('RESOURCE_STATUS')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<EmergencyResource | null>(null)
  const [form, setForm] = useState<EmergencyResourceRequest>({ ...emptyForm })
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const pageSize = 10
  const applySearch = () => { setSearchText(searchInput); setPage(0) }
  const handleResetSearch = () => { setSearchInput(''); setSearchText(''); setTypeFilter(''); setPage(0) }

  const queryKey = ['emrResources', page]
  const queryFn = () => emergencyResourceApi.getAll(page, pageSize)

  const { data, isLoading } = useQuery({ queryKey, queryFn, enabled: viewMode === 'list' })

  const createMutation = useMutation({
    mutationFn: (req: EmergencyResourceRequest) => emergencyResourceApi.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emrResources'] })
      showSuccess(t('common.saved'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: number; req: EmergencyResourceRequest }) => emergencyResourceApi.update(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emrResources'] })
      showSuccess(t('common.saved'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => emergencyResourceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emrResources'] })
      showSuccess(t('common.deleted'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm({ ...emptyForm }) }
  const handleOpenCreate = () => { setSelectedItem(null); setForm({ ...emptyForm, disposalDate: todayStr() }); setViewMode('create') }
  const handleOpenDetail = (item: EmergencyResource) => { setSelectedItem(item); setViewMode('detail') }
  const handleOpenEdit = (item?: EmergencyResource) => {
    const target = item || selectedItem
    if (!target) return
    setSelectedItem(target)
    setForm({
      resourceName: target.resourceName, resourceType: target.resourceType,
      quantity: target.quantity, availableQty: target.availableQty,
      location: target.location, disposalDate: target.disposalDate,
      status: target.status, notes: target.notes,
    })
    setViewMode('edit')
  }
  const handleSave = () => {
    if (selectedItem) updateMutation.mutate({ id: selectedItem.id, req: form })
    else createMutation.mutate(form)
  }
  const handleDelete = async (item: EmergencyResource) => {
    const confirmed = await showConfirm(t('common.confirmDelete', '정말로 삭제하시겠습니까?'))
    if (confirmed) deleteMutation.mutate(item.id)
  }

  let items = data?.content || []
  const totalPages = data?.totalPages || 0

  if (searchText) {
    const s = searchText.toLowerCase()
    items = items.filter((i) =>
      i.resourceName.toLowerCase().includes(s) ||
      i.resourceId?.toLowerCase().includes(s) ||
      i.location?.toLowerCase().includes(s)
    )
  }
  if (typeFilter) {
    items = items.filter((i) => i.resourceType === typeFilter)
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
                {resourceTypeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getResourceTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
          </Box>
          {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>{t('common.new')}</Button>
          )}
        </Box>
        {/* Mobile Search */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <ListSearchBar fullWidth placeholder={t('emr.searchPlaceholder')}
            value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select displayEmpty value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('emr.allTypes')}</MenuItem>
                {resourceTypeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getResourceTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
            {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ flex: 1 }}>{t('common.new')}</Button>
            )}
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
                      <TableCell sx={headerCellSx}>{t('emr.resourceId')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('emr.resourceName')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('emr.resourceType')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('emr.quantity')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('emr.location')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('emr.disposalDate')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('common.status')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleOpenDetail(item)}>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.resourceId}</TableCell>
                        <TableCell><Typography fontWeight={600} variant="body2">{item.resourceName}</Typography></TableCell>
                        <TableCell align="center">{getResourceTypeLabel(item.resourceType)}</TableCell>
                        <TableCell align="center">{item.availableQty}/{item.quantity}</TableCell>
                        <TableCell>{item.location || ''}</TableCell>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.disposalDate || ''}</TableCell>
                        <TableCell align="center">
                          <Chip label={getResourceStatusLabel(item.status)} color={statusColors[item.status] || 'default'} size="small" />
                        </TableCell>
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
                    <Typography fontWeight="bold">{item.resourceName}</Typography>
                    <Chip label={getResourceStatusLabel(item.status)} color={statusColors[item.status] || 'default'} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {getResourceTypeLabel(item.resourceType)} | {item.location || ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('emr.quantity')}: {item.availableQty}/{item.quantity} | {t('emr.disposalDate')}: {item.disposalDate || ''}
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
              <Typography sx={labelSx}>{t('emr.resourceId')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" fontFamily="monospace">{selectedItem.resourceId}</Typography>
              </Box>
              <Typography sx={labelSx}>{t('common.status')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Chip label={getResourceStatusLabel(selectedItem.status)} color={statusColors[selectedItem.status] || 'default'} size="small" />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('emr.resourceName')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" fontWeight={600}>{selectedItem.resourceName}</Typography>
              </Box>
              <Typography sx={labelSx}>{t('emr.resourceType')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{getResourceTypeLabel(selectedItem.resourceType)}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('emr.quantity')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{selectedItem.quantity}</Typography>
              </Box>
              <Typography sx={labelSx}>{t('emr.availableQty')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{selectedItem.availableQty}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('emr.location')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{selectedItem.location || ''}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('emr.disposalDate')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" fontFamily="monospace">{selectedItem.disposalDate || ''}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex' }}>
              <Typography sx={labelSx}>{t('common.notes')}</Typography>
              <Box sx={valueSx}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedItem.notes || ''}</Typography>
              </Box>
            </Box>
          </Box>
          {/* Mobile Detail */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
            {[
              [t('emr.resourceId'), selectedItem.resourceId],
              [t('common.status'), getResourceStatusLabel(selectedItem.status)],
              [t('emr.resourceName'), selectedItem.resourceName],
              [t('emr.resourceType'), getResourceTypeLabel(selectedItem.resourceType)],
              [t('emr.quantity'), String(selectedItem.quantity)],
              [t('emr.availableQty'), String(selectedItem.availableQty)],
              [t('emr.location'), selectedItem.location || ''],
              [t('emr.disposalDate'), selectedItem.disposalDate || ''],
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
          {canSee(MENU, selectedItem.status, '수정', myRoles) && (
            <Button variant="contained" onClick={() => handleOpenEdit()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.edit')}</Button>
          )}
          {canSee(MENU, selectedItem.status, '삭제', myRoles) && (
            <Button variant="contained" color="error" onClick={() => handleDelete(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.delete')}</Button>
          )}
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
            <Typography sx={labelSx}>{t('emr.resourceName')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valueBorderSx}>
              <TextField fullWidth size="small" value={form.resourceName} onChange={(e) => setForm({ ...form, resourceName: e.target.value })} />
            </Box>
            <Typography sx={labelSx}>{t('emr.resourceType')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valueSx}>
              <Select fullWidth size="small" value={form.resourceType} onChange={(e) => setForm({ ...form, resourceType: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {resourceTypeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getResourceTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.quantity')}</Typography>
            <Box sx={valueBorderSx}>
              <NumberField fullWidth size="small" value={form.quantity ?? ''} onChange={(v) => setForm({ ...form, quantity: v ?? undefined })} />
            </Box>
            <Typography sx={labelSx}>{t('emr.availableQty')}</Typography>
            <Box sx={valueSx}>
              <NumberField fullWidth size="small" value={form.availableQty ?? ''} onChange={(v) => setForm({ ...form, availableQty: v ?? undefined })} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.location')}</Typography>
            <Box sx={valueBorderSx}>
              <TextField fullWidth size="small" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Box>
            <Typography sx={labelSx}>{t('common.status')}</Typography>
            <Box sx={valueSx}>
              <Select fullWidth size="small" value={form.status || 'NORMAL'} onChange={(e) => setForm({ ...form, status: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {resourceStatusCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getResourceStatusLabel(c.code)}</MenuItem>)}
              </Select>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.disposalDate')}</Typography>
            <Box sx={valueSx}>
              <DatePickerField value={form.disposalDate || null} onChange={(v) => setForm({ ...form, disposalDate: v })} size="small" />
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
              {t('emr.resourceName')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.resourceName} onChange={(e) => setForm({ ...form, resourceName: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('emr.resourceType')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <FormControl fullWidth size="small">
              <Select value={form.resourceType} onChange={(e) => setForm({ ...form, resourceType: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {resourceTypeCodes.map((c) => <MenuItem key={c.code} value={c.code}>{getResourceTypeLabel(c.code)}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.quantity')}</Typography>
            <NumberField size="small" fullWidth value={form.quantity ?? ''} onChange={(v) => setForm({ ...form, quantity: v ?? undefined })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.availableQty')}</Typography>
            <NumberField size="small" fullWidth value={form.availableQty ?? ''} onChange={(v) => setForm({ ...form, availableQty: v ?? undefined })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.location')}</Typography>
            <TextField size="small" fullWidth value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.status')}</Typography>
            <FormControl fullWidth size="small">
              <Select value={form.status || 'NORMAL'} onChange={(e) => setForm({ ...form, status: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                <MenuItem value="NORMAL">NORMAL</MenuItem>
                <MenuItem value="CHECK_NEEDED">CHECK_NEEDED</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.disposalDate')}</Typography>
            <DatePickerField value={form.disposalDate || null} onChange={(v) => setForm({ ...form, disposalDate: v })} size="small" />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.notes')}</Typography>
            <TextField size="small" fullWidth multiline rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={() => viewMode === 'edit' ? setViewMode('detail') : handleBackToList()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save')}</Button>
        </Box>
      </Box>
    )
  }

  return null
}

export default EmrResourceTab
