import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'
import { fmtPhone } from '../../utils/phoneFormat'
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
import NumberField from '../common/NumberField'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import { useAlert } from '../../contexts/AlertContext'
import { emergencyContactApi } from '../../api/emergencyExtendedApi'
import { EmergencyContact, EmergencyContactRequest } from '../../types/emergencyExtended.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const labelSx = {
  width: 140, minWidth: 140, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: 'divider',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center',
}
const valueSx = { flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem' }
const valueBorderSx = { ...valueSx, borderRight: 1, borderColor: 'divider' }
const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

const emptyForm: EmergencyContactRequest = { organization: '', contactName: '', phoneNumber: '' }

const EmrContactTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<EmergencyContact | null>(null)
  const [form, setForm] = useState<EmergencyContactRequest>({ ...emptyForm })
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showUserModal, setShowUserModal] = useState(false)
  const pageSize = 10
  const applySearch = () => { setSearchText(searchInput); setPage(0) }
  const handleResetSearch = () => { setSearchInput(''); setSearchText(''); setTypeFilter(''); setPage(0) }

  const handleUserPick = (users: UserInfo[]) => {
    if (users.length > 0) {
      const u = users[0]
      setForm(f => ({
        ...f,
        contactName: u.name,
        organization: f.organization || u.department || '',
        email: f.email || u.email || '',
      }))
    }
    setShowUserModal(false)
  }

  const queryKey = ['emrContacts', page]
  const queryFn = () => emergencyContactApi.getAll(page, pageSize)

  const { data, isLoading } = useQuery({ queryKey, queryFn, enabled: viewMode === 'list' })

  const createMutation = useMutation({
    mutationFn: (req: EmergencyContactRequest) => emergencyContactApi.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emrContacts'] })
      showSuccess(t('common.saved'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: number; req: EmergencyContactRequest }) => emergencyContactApi.update(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emrContacts'] })
      showSuccess(t('common.saved'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => emergencyContactApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emrContacts'] })
      showSuccess(t('common.deleted'))
      handleBackToList()
    },
    onError: () => showError(t('common.error')),
  })

  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const MENU = 'EHS 경영 › 커뮤니케이션 › 비상 연락망'
  const myRoles: string[] = ['guest', ...(user?.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : [user?.role ?? ''].filter(Boolean))]
  const canNew  = canSee(MENU, 'LIST',   'New',  myRoles)
  const canEdit = canSee(MENU, 'DETAIL', '수정', myRoles)
  const canDel  = canSee(MENU, 'DETAIL', '삭제', myRoles)
  const canSave = canSee(MENU, 'DETAIL', '저장', myRoles)

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm({ ...emptyForm }) }
  const handleOpenCreate = () => { setSelectedItem(null); setForm({ ...emptyForm }); setViewMode('create') }
  const handleOpenDetail = (item: EmergencyContact) => { setSelectedItem(item); setViewMode('detail') }
  const handleOpenEdit = (item?: EmergencyContact) => {
    const target = item || selectedItem
    if (!target) return
    setSelectedItem(target)
    setForm({
      organization: target.organization, contactName: target.contactName,
      phoneNumber: target.phoneNumber, email: target.email,
      contactType: target.contactType, isEmergency: target.isEmergency,
      sortOrder: target.sortOrder, notes: target.notes,
    })
    setViewMode('edit')
  }
  const handleSave = () => {
    if (selectedItem) updateMutation.mutate({ id: selectedItem.id, req: form })
    else createMutation.mutate(form)
  }
  const handleDelete = async (item: EmergencyContact) => {
    const confirmed = await showConfirm(t('common.confirmDelete', '정말로 삭제하시겠습니까?'))
    if (confirmed) deleteMutation.mutate(item.id)
  }

  let items = data?.content || []
  const totalPages = data?.totalPages || 0

  if (searchText) {
    const s = searchText.toLowerCase()
    items = items.filter((i) =>
      i.organization.toLowerCase().includes(s) ||
      i.contactName.toLowerCase().includes(s) ||
      i.phoneNumber.toLowerCase().includes(s) ||
      i.contactId?.toLowerCase().includes(s) ||
      i.email?.toLowerCase().includes(s)
    )
  }
  if (typeFilter) {
    items = items.filter((i) => i.contactType === typeFilter)
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
                <MenuItem value="INTERNAL">{t('emr.internal')}</MenuItem>
                <MenuItem value="EXTERNAL">{t('emr.external')}</MenuItem>
              </Select>
            </FormControl>
            <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
          </Box>
          {canNew && <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>{t('common.new')}</Button>}
        </Box>
        {/* Mobile Search */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <ListSearchBar fullWidth placeholder={t('emr.searchPlaceholder')}
            value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select displayEmpty value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}>
                <MenuItem value="">{t('emr.allTypes')}</MenuItem>
                <MenuItem value="INTERNAL">{t('emr.internal')}</MenuItem>
                <MenuItem value="EXTERNAL">{t('emr.external')}</MenuItem>
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
                      <TableCell sx={headerCellSx}>{t('emr.contactId')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('emr.organization')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('emr.contactName')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('emr.email')}</TableCell>
                      <TableCell sx={headerCellSx}>{t('emr.contactType')}</TableCell>
                      <TableCell sx={headerCellSx} align="center">{t('emr.isEmergency')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleOpenDetail(item)}>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.contactId}</TableCell>
                        <TableCell><Typography fontWeight={600} variant="body2">{item.organization}</Typography></TableCell>
                        <TableCell>{item.contactName}</TableCell>
                        <TableCell align="center">{item.email || ''}</TableCell>
                        <TableCell align="center">{item.contactType === 'INTERNAL' ? t('emr.internal') : t('emr.external')}</TableCell>
                        <TableCell align="center">
                          {item.isEmergency ? (
                            <Chip label={t('emr.isEmergency')} color="error" size="small" />
                          ) : (
                            null
                          )}
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
                <Paper key={item.id} sx={{ p: 2, border: 1, borderColor: item.isEmergency ? 'error.main' : 'grey.300', cursor: 'pointer' }} onClick={() => handleOpenDetail(item)}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography fontWeight="bold">{item.organization}</Typography>
                    {item.isEmergency && <Chip label={t('emr.isEmergency')} color="error" size="small" />}
                  </Box>
                  <Typography variant="body2" fontWeight={600}>{item.contactName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.email || ''} | {item.contactType === 'INTERNAL' ? t('emr.internal') : t('emr.external')}
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
              <Typography sx={labelSx}>{t('emr.contactId')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" fontFamily="monospace">{selectedItem.contactId}</Typography>
              </Box>
              <Typography sx={labelSx}>{t('emr.contactType')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{selectedItem.contactType === 'INTERNAL' ? t('emr.internal') : t('emr.external')}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('emr.organization')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" fontWeight={600}>{selectedItem.organization}</Typography>
              </Box>
              <Typography sx={labelSx}>{t('emr.contactName')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{selectedItem.contactName}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('emr.phoneNumber')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" fontWeight={600}>{selectedItem.phoneNumber}</Typography>
              </Box>
              <Typography sx={labelSx}>{t('emr.email')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{selectedItem.email || ''}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={labelSx}>{t('emr.isEmergency')}</Typography>
              <Box sx={{ ...valueBorderSx, display: 'flex', alignItems: 'center' }}>
                {selectedItem.isEmergency ? (
                  <Chip label={t('emr.isEmergency')} color="error" size="small" />
                ) : (
                  null
                )}
              </Box>
              <Typography sx={labelSx}>{t('emr.sortOrder')}</Typography>
              <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{selectedItem.sortOrder}</Typography>
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
              [t('emr.contactId'), selectedItem.contactId],
              [t('emr.organization'), selectedItem.organization],
              [t('emr.contactName'), selectedItem.contactName],
              [t('emr.phoneNumber'), selectedItem.phoneNumber],
              [t('emr.email'), selectedItem.email || ''],
              [t('emr.contactType'), selectedItem.contactType === 'INTERNAL' ? t('emr.internal') : t('emr.external')],
              [t('emr.isEmergency'), selectedItem.isEmergency ? 'Y' : 'N'],
              [t('emr.sortOrder'), String(selectedItem.sortOrder)],
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
          {canEdit && <Button variant="contained" onClick={() => handleOpenEdit()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.edit')}</Button>}
          {canDel && <Button variant="contained" color="error" onClick={() => handleDelete(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.delete')}</Button>}
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
            <Typography sx={labelSx}>{t('emr.organization')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valueBorderSx}>
              <TextField fullWidth size="small" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
            </Box>
            <Typography sx={labelSx}>{t('emr.contactName')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={{ ...valueSx, display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField fullWidth size="small" value={form.contactName} placeholder={t('common.selectFromOrg', '조직도에서 선택')} InputProps={{ readOnly: true }} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowUserModal(true)}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.phoneNumber')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valueBorderSx}>
              <TextField fullWidth size="small" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: fmtPhone(e.target.value) })} />
            </Box>
            <Typography sx={labelSx}>{t('emr.email')}</Typography>
            <Box sx={valueSx}>
              <TextField fullWidth size="small" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.contactType')}</Typography>
            <Box sx={valueBorderSx}>
              <Select fullWidth size="small" value={form.contactType || 'INTERNAL'} onChange={(e) => setForm({ ...form, contactType: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                <MenuItem value="INTERNAL">{t('emr.internal')}</MenuItem>
                <MenuItem value="EXTERNAL">{t('emr.external')}</MenuItem>
              </Select>
            </Box>
            <Typography sx={labelSx}>{t('emr.sortOrder')}</Typography>
            <Box sx={valueSx}>
              <NumberField fullWidth size="small" value={form.sortOrder ?? ''} onChange={(v) => setForm({ ...form, sortOrder: v ?? undefined })} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('emr.isEmergency')}</Typography>
            <Box sx={{ ...valueSx, display: 'flex', alignItems: 'center' }}>
              <FormControlLabel control={<Checkbox checked={form.isEmergency || false} onChange={(e) => setForm({ ...form, isEmergency: e.target.checked })} />} label="" />
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
              {t('emr.organization')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('emr.contactName')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" fullWidth value={form.contactName} placeholder={t('common.selectFromOrg', '조직도에서 선택')} InputProps={{ readOnly: true }} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setShowUserModal(true)}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('emr.phoneNumber')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField size="small" fullWidth value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: fmtPhone(e.target.value) })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.email')}</Typography>
            <TextField size="small" fullWidth value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.contactType')}</Typography>
            <FormControl fullWidth size="small">
              <Select value={form.contactType || 'INTERNAL'} onChange={(e) => setForm({ ...form, contactType: e.target.value })} displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                <MenuItem value="INTERNAL">{t('emr.internal')}</MenuItem>
                <MenuItem value="EXTERNAL">{t('emr.external')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('emr.sortOrder')}</Typography>
            <NumberField size="small" fullWidth value={form.sortOrder ?? ''} onChange={(v) => setForm({ ...form, sortOrder: v ?? undefined })} />
          </Box>
          <FormControlLabel control={<Checkbox checked={form.isEmergency || false} onChange={(e) => setForm({ ...form, isEmergency: e.target.checked })} />} label={t('emr.isEmergency')} />
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.notes')}</Typography>
            <TextField size="small" fullWidth multiline rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={() => viewMode === 'edit' ? setViewMode('detail') : handleBackToList()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel')}</Button>
          {canSave && <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save')}</Button>}
        </Box>

        <UserSelectModal
          open={showUserModal}
          onClose={() => setShowUserModal(false)}
          selectedUsers={[]}
          onConfirm={handleUserPick}
          singleSelect
          useCompanyTree
          title={t('environment.selectManager', '담당자 선택')}
        />
      </Box>
    )
  }

  return null
}

export default EmrContactTab
