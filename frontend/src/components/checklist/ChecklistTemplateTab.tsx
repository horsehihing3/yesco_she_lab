import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Pagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material'
import ListSearchBar from '../common/ListSearchBar'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import Radio from '@mui/material/Radio'
import { useTranslation } from 'react-i18next'
import LoadingOverlay from '../common/LoadingOverlay'
import DatePickerField from '../common/DatePickerField'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import {
  ChecklistTemplateMaster,
  ChecklistTemplateMasterRequest,
  ChecklistItem,
} from '../../types/checklist.types'
import {
  fetchTemplates,
  fetchTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  copyTemplate,
  uploadTemplateExcel,
  downloadTemplateExcel,
} from '../../api/checklistApi'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const emptyItem = (): ChecklistItem => ({
  category: '',
  checkItem: '',
  checkContent: '',
  isNormal: '',
  isAbnormal: '',
  remarks: '',
  checkStandard: '',
  actionTaken: '',
  confirm: '',
})

const ChecklistTemplateTab: React.FC = () => {
  const { t } = useTranslation()
  const { showAlert } = useAlert()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const rowsPerPage = 10
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [copyTargetId, setCopyTargetId] = useState<number | null>(null)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formCheckDate, setFormCheckDate] = useState('')
  const [formChecker, setFormChecker] = useState('')
  const [formCheckManager, setFormCheckManager] = useState('')
  const [formFacilityManager, setFormFacilityManager] = useState('')
  const [showUserModal, setShowUserModal] = useState(false)
  const [userModalTarget, setUserModalTarget] = useState<'checker' | 'checkManager' | 'facilityManager'>('checker')

  const [formItems, setFormItems] = useState<ChecklistItem[]>([emptyItem()])

  // Queries
  const { data: listData, isLoading: listLoading, error: listError } = useQuery({
    queryKey: ['checklist-templates', page, searchQuery],
    queryFn: () => fetchTemplates({ page, size: rowsPerPage, title: searchQuery || undefined }),
    enabled: viewMode === 'list',
  })

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['checklist-template-detail', selectedId],
    queryFn: () => fetchTemplateById(selectedId!),
    enabled: !!selectedId && (viewMode === 'detail' || viewMode === 'edit'),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      showAlert('success', t('common.saveSuccess'))
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] })
      handleBackToList()
    },
    onError: () => showAlert('error', t('common.failed')),
  })

  const updateMutation = useMutation({
    mutationFn: updateTemplate,
    onSuccess: () => {
      showAlert('success', t('common.saveSuccess'))
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] })
      queryClient.invalidateQueries({ queryKey: ['checklist-template-detail'] })
      handleBackToList()
    },
    onError: () => showAlert('error', t('common.failed')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      showAlert('success', t('common.deleteSuccess'))
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] })
      setDeleteDialogOpen(false)
      handleBackToList()
    },
    onError: () => showAlert('error', t('common.failed')),
  })

  const copyMutation = useMutation({
    mutationFn: copyTemplate,
    onSuccess: () => {
      showAlert('success', t('checklist.copySuccess', '복사되었습니다.'))
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] })
      setCopyTargetId(null)
    },
    onError: () => showAlert('error', t('common.failed')),
  })

  const handleCopy = () => {
    if (copyTargetId == null) return
    copyMutation.mutate({ id: copyTargetId, username: user?.name || user?.username })
  }

  const isProcessing = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || copyMutation.isPending

  // Handlers
  const handleBackToList = () => {
    setViewMode('list')
    setSelectedId(null)
    setFormTitle('')
    setFormCheckDate('')
    setFormChecker('')
    setFormCheckManager('')
    setFormFacilityManager('')

    setFormItems([emptyItem()])
  }

  const handleReset = () => {
    setSearchText('')
    setSearchQuery('')
    setPage(0)
  }

  const handleSearch = () => {
    setSearchQuery(searchText)
    setPage(0)
  }

  const handleRowClick = (id: number) => {
    setSelectedId(id)
    setViewMode('detail')
  }

  const handleCreate = () => {
    setFormTitle('')
    setFormCheckDate('')
    setFormChecker('')
    setFormCheckManager('')
    setFormFacilityManager('')

    setFormItems([emptyItem()])
    setViewMode('create')
  }

  const handleEdit = () => {
    if (detailData) {
      setFormTitle(detailData.title)
      setFormCheckDate(detailData.checkDate || '')
      setFormChecker(detailData.checker || '')
      setFormCheckManager(detailData.checkManager || '')
      setFormFacilityManager(detailData.facilityManager || '')
      setFormItems(detailData.items?.length ? detailData.items.map((i) => ({ ...i })) : [emptyItem()])
      setViewMode('edit')
    }
  }

  const openUserModal = (target: 'checker' | 'checkManager' | 'facilityManager') => {
    setUserModalTarget(target)
    setShowUserModal(true)
  }

  const handleUserSelect = (users: UserInfo[]) => {
    if (users.length > 0) {
      const name = users[0].name || users[0].username
      if (userModalTarget === 'checker') setFormChecker(name)
      else if (userModalTarget === 'checkManager') setFormCheckManager(name)
      else if (userModalTarget === 'facilityManager') setFormFacilityManager(name)
    }
    setShowUserModal(false)
  }

  const handleSave = () => {
    if (!formTitle.trim()) return
    const request: ChecklistTemplateMasterRequest = {
      title: formTitle,
      checkDate: formCheckDate || undefined,
      checker: formChecker || undefined,
      checkManager: formCheckManager || undefined,
      facilityManager: formFacilityManager || undefined,

      regUser: user?.username || '',
      items: formItems,
    }
    if (viewMode === 'create') {
      createMutation.mutate(request)
    } else if (viewMode === 'edit' && selectedId) {
      updateMutation.mutate({ id: selectedId, data: request })
    }
  }

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const items = await uploadTemplateExcel(file)
      setFormItems(items.length > 0 ? items : [emptyItem()])
      showAlert('success', t('common.success'))
    } catch {
      showAlert('error', t('checklist.excelParseFailed'))
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleItemChange = (index: number, field: keyof ChecklistItem, value: string) => {
    const updated = [...formItems]
    updated[index] = { ...updated[index], [field]: value }
    setFormItems(updated)
  }

  const handleAddRow = (index: number) => {
    const updated = [...formItems]
    updated.splice(index + 1, 0, emptyItem())
    setFormItems(updated)
  }

  const handleRemoveRow = (index: number) => {
    if (formItems.length <= 1) return
    setFormItems(formItems.filter((_, i) => i !== index))
  }

  const handleDeleteClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    setDeleteTargetId(id)
    setDeleteDialogOpen(true)
  }

  const handleDownload = async (e: React.MouseEvent, id: number, title: string) => {
    e.stopPropagation()
    try {
      await downloadTemplateExcel(id, title)
    } catch {
      showAlert('error', t('common.failed'))
    }
  }

  const columns: { key: keyof ChecklistItem; label: string }[] = [
    { key: 'category', label: t('checklist.category') },
    { key: 'checkItem', label: t('checklist.checkItem') },
    { key: 'checkContent', label: t('checklist.checkContent') },
    { key: 'isNormal', label: t('checklist.isNormal') },
    { key: 'isAbnormal', label: t('checklist.isAbnormal') },
    { key: 'remarks', label: t('checklist.remarks') },
    { key: 'checkStandard', label: t('checklist.checkStandard') },
    { key: 'actionTaken', label: t('checklist.actionTaken') },
    { key: 'confirm', label: t('checklist.confirm') },
  ]

  const alerts = listData?.content || []
  const totalPages = listData?.totalPages || 0

  // ===== LIST VIEW =====
  const renderListView = () => (
    <>
      {/* Filters - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ListSearchBar placeholder={t('common.searchByTitle')} value={searchText} onChange={setSearchText} onSearch={handleSearch} sx={{ width: 300 }} />
          <IconButton onClick={handleReset} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<ContentCopyIcon />}
            disabled={copyTargetId == null || copyMutation.isPending} onClick={handleCopy}>
            {t('common.copy', '복사')}
          </Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleCreate}>
            New
          </Button>
        </Box>
      </Box>

      {/* Filters - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, mb: 2 }}>
        <ListSearchBar
          placeholder={t('common.searchByTitle')}
          value={searchText}
          onChange={setSearchText}
          onSearch={handleSearch}
          fullWidth
        />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" size="small" onClick={handleReset} startIcon={<RefreshIcon />} sx={{ flex: '1 1 calc(50% - 4px)' }}>
            {t('common.reset')}
          </Button>
          <Button variant="outlined" size="small" startIcon={<ContentCopyIcon />}
            disabled={copyTargetId == null || copyMutation.isPending} onClick={handleCopy}
            sx={{ flex: '1 1 calc(50% - 4px)' }}>
            {t('common.copy', '복사')}
          </Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleCreate} sx={{ flex: '1 1 calc(50% - 4px)' }}>
            {t('common.create')}
          </Button>
        </Box>
      </Box>

      {/* Table - PC */}
      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 650, '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold', width: 48, borderRight: 1, borderColor: 'divider', p: 0 }} align="center"></TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 60, borderRight: 1, borderColor: 'divider' }} align="center">
                {t('common.no', 'No')}
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }} align="center">
                {t('common.title')}
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 140, borderRight: 1, borderColor: 'divider' }} align="center">
                {t('common.author')}
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 120 }} align="center">
                {t('common.createdAt')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">{t('checklist.noTemplates')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              alerts.map((row: ChecklistTemplateMaster, idx: number) => (
                <TableRow key={row.id} hover onClick={() => handleRowClick(row.id)} sx={{ cursor: 'pointer' }}>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider', p: 0 }} onClick={(e) => e.stopPropagation()}>
                    <Radio size="small" checked={copyTargetId === row.id}
                      onChange={() => setCopyTargetId(row.id)} value={row.id} name="copy-radio" />
                  </TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>
                    {page * rowsPerPage + idx + 1}
                  </TableCell>
                  <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{row.title}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{row.modUser || row.regUser}</TableCell>
                  <TableCell align="center">{row.createdAt?.substring(0, 10)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile Card List */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
        {alerts.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">{t('checklist.noTemplates')}</Typography>
          </Paper>
        ) : (
          alerts.map((row: ChecklistTemplateMaster) => (
            <Paper key={row.id} sx={{ p: 2, cursor: 'pointer', border: 1, borderColor: 'divider' }} onClick={() => handleRowClick(row.id)}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                <Box onClick={(e) => e.stopPropagation()} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Radio size="small" checked={copyTargetId === row.id}
                    onChange={() => setCopyTargetId(row.id)} value={row.id} name="copy-radio-mobile" />
                </Box>
                <Typography fontWeight="bold" sx={{ flex: 1 }}>{row.title}</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 50 }}>{t('common.author')}</Typography>
                  <Typography variant="body2">{row.modUser || row.regUser}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 50 }}>{t('common.createdAt')}</Typography>
                  <Typography variant="body2">{row.createdAt?.substring(0, 10)}</Typography>
                </Box>
              </Box>
            </Paper>
          ))
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination count={totalPages || 1} page={page + 1} onChange={(_, newPage) => setPage(newPage - 1)} color="primary" />
      </Box>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('common.confirmDeleteTitle')}</DialogTitle>
        <DialogContent>
          <Typography>{t('common.confirmDeleteMessage')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t('common.deleteWarning')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDeleteDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => deleteTargetId && deleteMutation.mutate(deleteTargetId)}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )

  const detailLabelSx = { width: 128, minWidth: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }

  // ===== DETAIL VIEW =====
  const renderDetailView = () => (
    <>
      {detailLoading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : detailData ? (
        <>
          {/* PC Detail */}
          <Paper sx={{ display: { xs: 'none', md: 'block' }, p: 3, bgcolor: 'grey.50' }}>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
              {/* Row 1: 제목 */}
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={{ ...detailLabelSx }}>{t('common.title')}</Typography>
                <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem' }}>
                  {detailData.title}
                </Typography>
              </Box>
              {/* Row 2: 점검일자 | 점검자 */}
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={{ ...detailLabelSx }}>{t('checklist.checkDate')}</Typography>
                <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem', borderRight: 1, borderColor: 'divider' }}>
                  {detailData.checkDate || ''}
                </Typography>
                <Typography sx={{ ...detailLabelSx }}>{t('checklist.checker')}</Typography>
                <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem' }}>
                  {detailData.checker || ''}
                </Typography>
              </Box>
              {/* Row 3: 점검책임자 | 시설관리자 */}
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={{ ...detailLabelSx }}>{t('checklist.checkManager')}</Typography>
                <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem', borderRight: 1, borderColor: 'divider' }}>
                  {detailData.checkManager || ''}
                </Typography>
                <Typography sx={{ ...detailLabelSx }}>{t('checklist.facilityManager')}</Typography>
                <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem' }}>
                  {detailData.facilityManager || ''}
                </Typography>
              </Box>
              {/* Row 4: 작성자 | 등록일 */}
              <Box sx={{ display: 'flex' }}>
                <Typography sx={{ ...detailLabelSx }}>{t('common.author')}</Typography>
                <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem', borderRight: 1, borderColor: 'divider' }}>
                  {detailData.modUser || detailData.regUser || ''}
                </Typography>
                <Typography sx={{ ...detailLabelSx }}>{t('common.createdAt')}</Typography>
                <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem' }}>
                  {detailData.createdAt?.substring(0, 10) || ''}
                </Typography>
              </Box>
            </Box>

          </Paper>

          {/* Items Table - PC */}
          {detailData.items && detailData.items.length > 0 && (
            <Paper sx={{ display: { xs: 'none', md: 'block' }, mt: 2, p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>{t('checklist.items')}</Typography>
              <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 900, '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider', px: 2, py: 1.5 }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', bgcolor: 'grey.100' }}>{t('checklist.category')}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', bgcolor: 'grey.100' }}>{t('checklist.checkItem')}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', bgcolor: 'grey.100' }}>{t('checklist.checkContent')}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', bgcolor: 'grey.100' }} align="center">{t('checklist.isNormal')}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', bgcolor: 'grey.100' }} align="center">{t('checklist.isAbnormal')}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', bgcolor: 'grey.100' }}>{t('checklist.remarks')}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', bgcolor: 'grey.100' }}>{t('checklist.checkStandard')}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', bgcolor: 'grey.100' }}>{t('checklist.actionTaken')}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', bgcolor: 'grey.100' }}>{t('checklist.confirm')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailData.items.map((item, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell>{item.category || ''}</TableCell>
                        <TableCell>{item.checkItem || ''}</TableCell>
                        <TableCell sx={{ whiteSpace: 'pre-wrap', maxWidth: 220 }}>{item.checkContent || ''}</TableCell>
                        <TableCell align="center">{item.isNormal || ''}</TableCell>
                        <TableCell align="center">{item.isAbnormal || ''}</TableCell>
                        <TableCell>{item.remarks || ''}</TableCell>
                        <TableCell sx={{ whiteSpace: 'pre-wrap', maxWidth: 220 }}>{item.checkStandard || ''}</TableCell>
                        <TableCell>{item.actionTaken || ''}</TableCell>
                        <TableCell>{item.confirm || ''}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Items Cards - Mobile */}
          {detailData.items && detailData.items.length > 0 && (
            <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>{t('checklist.items')}</Typography>
              {detailData.items.map((item, idx) => (
                <Paper key={idx} sx={{ p: 1.5, mb: 1, border: 1, borderColor: 'divider' }}>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {item.category ? `[${item.category}] ` : ''}{item.checkItem || ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mb: 0.5 }}>{item.checkContent || ''}</Typography>
                  {item.checkStandard && <Typography variant="caption" color="text.secondary">{t('checklist.checkStandard')}: {item.checkStandard}</Typography>}
                </Paper>
              ))}
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-end', gap: 1, mt: 2 }}>
            <Button variant="outlined" onClick={handleBackToList}>{t('common.backToList')}</Button>
            <Button variant="contained" onClick={handleEdit}>{t('common.edit')}</Button>
            <Button variant="contained" color="error" onClick={() => { setDeleteTargetId(selectedId); setDeleteDialogOpen(true) }}>{t('common.delete')}</Button>
          </Box>

          {/* Mobile Detail - Info */}
          <Paper sx={{ display: { xs: 'block', md: 'none' }, p: 2, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.title')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{detailData.title}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('checklist.checkDate')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{detailData.checkDate || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('checklist.checker')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{detailData.checker || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('checklist.checkManager')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{detailData.checkManager || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('checklist.facilityManager')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{detailData.facilityManager || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.author')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{detailData.modUser || detailData.regUser || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.createdAt')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{detailData.createdAt?.substring(0, 10) || ''}</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Action Buttons - Mobile */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1, mt: 2 }}>
            <Button variant="outlined" onClick={handleBackToList} sx={{ flex: 1 }}>{t('common.backToList')}</Button>
            <Button variant="contained" onClick={handleEdit} sx={{ flex: 1 }}>{t('common.edit')}</Button>
            <Button variant="contained" color="error" onClick={() => { setDeleteTargetId(selectedId); setDeleteDialogOpen(true) }} sx={{ flex: 1 }}>{t('common.delete')}</Button>
          </Box>
        </>
      ) : null}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('common.confirmDeleteTitle')}</DialogTitle>
        <DialogContent>
          <Typography>{t('common.confirmDeleteMessage')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t('common.deleteWarning')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDeleteDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button color="error" variant="contained" onClick={() => deleteTargetId && deleteMutation.mutate(deleteTargetId)}>{t('common.delete')}</Button>
        </DialogActions>
      </Dialog>
    </>
  )

  // ===== CREATE / EDIT VIEW =====
  const labelSx = { width: 128, minWidth: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', whiteSpace: 'nowrap' }

  const renderFormView = () => (
    <>
      <input type="file" accept=".xlsx,.xls" ref={fileInputRef} style={{ display: 'none' }} onChange={handleExcelUpload} />

      {/* PC Form */}
      <Paper sx={{ display: { xs: 'none', md: 'block' }, p: 3, bgcolor: 'grey.50' }}>
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={{ ...labelSx }}>
              {t('common.title')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }}>
              <TextField fullWidth size="small" placeholder={t('common.enterTitle')} value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={{ ...labelSx }}>{t('checklist.checkDate')}</Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
              <DatePickerField value={formCheckDate} onChange={(v) => setFormCheckDate(v)} />
            </Box>
            <Typography sx={{ ...labelSx }}>{t('checklist.checker')}</Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField fullWidth size="small" value={formChecker} InputProps={{ readOnly: true }} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => openUserModal('checker')}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={{ ...labelSx }}>{t('checklist.checkManager')}</Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField fullWidth size="small" value={formCheckManager} InputProps={{ readOnly: true }} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => openUserModal('checkManager')}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
            <Typography sx={{ ...labelSx }}>{t('checklist.facilityManager')}</Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField fullWidth size="small" value={formFacilityManager} InputProps={{ readOnly: true }} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => openUserModal('facilityManager')}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Typography sx={{ ...labelSx }}>{t('checklist.uploadExcel')}</Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }}>
              <Button variant="outlined" size="small" startIcon={<UploadFileIcon />} onClick={() => fileInputRef.current?.click()}>
                {t('common.selectFile')}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Mobile Form */}
      <Paper sx={{ display: { xs: 'block', md: 'none' }, p: 2, bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('common.title')} *
            </Typography>
            <TextField fullWidth size="small" placeholder={t('common.enterTitle')} value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('checklist.checkDate')}</Typography>
            <DatePickerField value={formCheckDate} onChange={(v) => setFormCheckDate(v)} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('checklist.checker')}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField fullWidth size="small" value={formChecker} InputProps={{ readOnly: true }} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => openUserModal('checker')}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('checklist.checkManager')}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField fullWidth size="small" value={formCheckManager} InputProps={{ readOnly: true }} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => openUserModal('checkManager')}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('checklist.facilityManager')}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField fullWidth size="small" value={formFacilityManager} InputProps={{ readOnly: true }} />
              <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => openUserModal('facilityManager')}><PersonSearchIcon fontSize="small" /></Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('checklist.uploadExcel')}</Typography>
            <Button variant="outlined" size="small" startIcon={<UploadFileIcon />} onClick={() => fileInputRef.current?.click()}>
              {t('common.selectFile')}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Items Edit Table - PC */}
      <Paper sx={{ display: { xs: 'none', md: 'block' }, mt: 2, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">{t('checklist.items')}</Typography>
          <Button size="small" startIcon={<AddCircleOutlineIcon />} onClick={() => handleAddRow(formItems.length - 1)}>{t('checklist.addRow')}</Button>
        </Box>
        <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 1100, '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.key} sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', bgcolor: 'grey.100' }} align="center">{col.label}</TableCell>
                ))}
                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', bgcolor: 'grey.100', width: 60, minWidth: 60 }} align="center">{t('common.delete')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formItems.map((item, idx) => (
                <TableRow key={idx}>
                  {columns.map((col) => (
                    <TableCell key={col.key} sx={{ p: 0.5 }}>
                      <TextField
                        value={item[col.key] || ''}
                        onChange={(e) => handleItemChange(idx, col.key, e.target.value)}
                        size="small"
                        fullWidth
                        multiline={col.key === 'checkContent' || col.key === 'checkStandard' || col.key === 'remarks' || col.key === 'actionTaken'}
                        placeholder={col.label}
                      />
                    </TableCell>
                  ))}
                  <TableCell sx={{ p: 0.5 }} align="center">
                    <IconButton size="small" color="error" onClick={() => handleRemoveRow(idx)} disabled={formItems.length <= 1}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Items Edit Cards - Mobile */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>{t('checklist.items')}</Typography>
        {formItems.map((item, idx) => (
          <Paper key={idx} sx={{ p: 1.5, mb: 1, border: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" fontWeight="bold">#{idx + 1}</Typography>
              <IconButton size="small" color="error" onClick={() => handleRemoveRow(idx)} disabled={formItems.length <= 1}><DeleteIcon fontSize="small" /></IconButton>
            </Box>
            {columns.map((col) => (
              <Box key={col.key} sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">{col.label}</Typography>
                <TextField
                  value={item[col.key] || ''}
                  onChange={(e) => handleItemChange(idx, col.key, e.target.value)}
                  size="small"
                  fullWidth
                  multiline={col.key === 'checkContent' || col.key === 'checkStandard' || col.key === 'remarks' || col.key === 'actionTaken'}
                  placeholder={col.label}
                />
              </Box>
            ))}
          </Paper>
        ))}
      </Box>

      {/* Form Actions */}
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, gap: 1, mt: 2 }}>
        <Button variant="outlined" onClick={viewMode === 'edit' ? () => setViewMode('detail') : handleBackToList} sx={{ flex: { xs: 1, sm: 'none' } }}>
          {t('common.cancel', '취소')}
        </Button>
        <Button
          variant="outlined"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => handleAddRow(formItems.length - 1)}
          sx={{ flex: { xs: 1, sm: 'none' } }}
        >
          {t('checklist.addRow')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!formTitle.trim() || isProcessing}
          sx={{ flex: { xs: 1, sm: 'none' } }}
        >
          {t('common.save', '저장')}
        </Button>
      </Box>
    </>
  )

  // ===== MAIN RENDER =====
  if (listLoading && viewMode === 'list') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (listError && viewMode === 'list') {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{t('common.loadError')}</Alert>
      </Box>
    )
  }

  return (
    <Box>
      <LoadingOverlay open={isProcessing} message="처리 중..." />
      {viewMode === 'list' && renderListView()}
      {viewMode === 'detail' && renderDetailView()}
      {(viewMode === 'create' || viewMode === 'edit') && renderFormView()}
      <UserSelectModal open={showUserModal} onClose={() => setShowUserModal(false)} selectedUsers={[]} onConfirm={handleUserSelect} singleSelect useCompanyTree title={t('common.selectEmployee', '직원 선택')} />
    </Box>
  )
}

export default ChecklistTemplateTab
