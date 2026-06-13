import { formatDate } from '../../utils/dateDefaults'
import { useState } from 'react'
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
  CircularProgress,
  Alert,
} from '@mui/material'
import ListSearchBar from '../common/ListSearchBar'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import { useTranslation } from 'react-i18next'
import LoadingOverlay from '../common/LoadingOverlay'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import {
  ChecklistTemplateMaster,
  ChecklistItem,
} from '../../types/checklist.types'
import {
  fetchTemplates,
  fetchTemplateById,
  updateTemplate,
} from '../../api/checklistApi'

type ViewMode = 'list' | 'edit'

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

const ChecklistResultTab: React.FC = () => {
  const { t } = useTranslation()
  const { showAlert } = useAlert()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const rowsPerPage = 10

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formItems, setFormItems] = useState<ChecklistItem[]>([emptyItem()])

  // Queries - list shows templates registered in 서식 관리
  const { data: listData, isLoading: listLoading, error: listError } = useQuery({
    queryKey: ['checklist-templates-list', page, searchQuery],
    queryFn: () => fetchTemplates({ page, size: rowsPerPage, title: searchQuery || undefined }),
    enabled: viewMode === 'list',
  })

  // Mutations - updates template items
  const updateMutation = useMutation({
    mutationFn: updateTemplate,
    onSuccess: () => {
      showAlert('success', t('common.saveSuccess'))
      queryClient.invalidateQueries({ queryKey: ['checklist-templates-list'] })
      handleBackToList()
    },
    onError: () => showAlert('error', t('common.failed')),
  })

  const isProcessing = updateMutation.isPending

  // Handlers
  const handleBackToList = () => {
    setViewMode('list')
    setSelectedId(null)
    setFormTitle('')
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

  const handleRowClick = async (templateId: number) => {
    try {
      const tpl = await fetchTemplateById(templateId)
      setSelectedId(templateId)
      setFormTitle(tpl.title)
      setFormItems(tpl.items?.length ? tpl.items.map((i) => ({ ...i })) : [emptyItem()])
      setViewMode('edit')
    } catch {
      showAlert('error', t('common.failed'))
    }
  }

  const handleSave = () => {
    if (!selectedId) return
    updateMutation.mutate({
      id: selectedId,
      data: {
        title: formTitle,
        regUser: user?.username || '',
        items: formItems,
      },
    })
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

  const items = listData?.content || []
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
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" onClick={handleReset} startIcon={<RefreshIcon />} sx={{ flex: 1 }}>
            {t('common.reset')}
          </Button>
        </Box>
      </Box>

      {/* Table - PC */}
      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 650, '& .MuiTableCell-root': { borderColor: 'divider' } }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
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
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">{t('checklist.noTemplates')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((row: ChecklistTemplateMaster) => (
                <TableRow key={row.id} hover onClick={() => handleRowClick(row.id)} sx={{ cursor: 'pointer' }}>
                  <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{row.title}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{row.modUser || row.regUser}</TableCell>
                  <TableCell align="center">{formatDate(row.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile Card List */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
        {items.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">{t('checklist.noTemplates')}</Typography>
          </Paper>
        ) : (
          items.map((row: ChecklistTemplateMaster) => (
            <Paper key={row.id} sx={{ p: 2, cursor: 'pointer', border: 1, borderColor: 'divider' }} onClick={() => handleRowClick(row.id)}>
              <Typography fontWeight="bold" sx={{ mb: 1 }}>{row.title}</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('common.author')}</Typography>
                  <Typography variant="body2">{row.modUser || row.regUser}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('common.createdAt')}</Typography>
                  <Typography variant="body2">{formatDate(row.createdAt)}</Typography>
                </Box>
              </Box>
            </Paper>
          ))
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination count={totalPages || 1} page={page + 1} onChange={(_, newPage) => setPage(newPage - 1)} color="primary" />
      </Box>
    </>
  )

  // ===== EDIT VIEW =====
  const renderEditView = () => (
    <>
    <Paper sx={{ p: { xs: 2, md: 3 }, bgcolor: 'grey.50', width: '100%', boxSizing: 'border-box' }}>
      {/* Title (read-only) */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
        <Box sx={{ display: 'flex' }}>
          <Typography sx={{ width: { xs: 80, md: 128 }, minWidth: { xs: 80, md: 128 }, fontWeight: 'bold', bgcolor: 'grey.100', px: { xs: 1, md: 2 }, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center' }}>
            {t('common.title')}
          </Typography>
          <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>
            {formTitle}
          </Typography>
        </Box>
      </Box>

      {/* Items Table - PC */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          {t('checklist.items')}
        </Typography>
        <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto', mb: 2 }}>
          <Table size="small" sx={{ minWidth: 1000, '& .MuiTableCell-root': { borderColor: 'divider' } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', width: 40 }} align="center">#</TableCell>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    sx={{
                      fontWeight: 'bold',
                      borderRight: 1,
                      borderColor: 'divider',
                      whiteSpace: 'nowrap',
                      minWidth: col.key === 'checkContent' || col.key === 'checkStandard' ? 150 : col.key === 'category' ? 80 : 100,
                    }}
                    align="center"
                  >
                    {col.label}
                  </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 'bold', width: 80 }} align="center">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formItems.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{idx + 1}</TableCell>
                  {columns.map((col) => (
                    <TableCell key={col.key} sx={{ borderRight: 1, borderColor: 'divider' }}>
                      <TextField
                        value={item[col.key] || ''}
                        onChange={(e) => handleItemChange(idx, col.key, e.target.value)}
                        size="small"
                        variant="outlined"
                        fullWidth
                        multiline={col.key === 'checkContent' || col.key === 'checkStandard' || col.key === 'remarks' || col.key === 'actionTaken'}
                        maxRows={3}
                      />
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    <IconButton size="small" color="primary" onClick={() => handleAddRow(idx)}>
                      <AddCircleOutlineIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleRemoveRow(idx)} disabled={formItems.length <= 1}>
                      <RemoveCircleOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Items Cards - Mobile */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>{t('checklist.items')}</Typography>
        {formItems.map((item, idx) => (
          <Paper key={idx} sx={{ p: 2, mb: 1.5, border: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" fontWeight="bold">#{idx + 1}</Typography>
              <IconButton size="small" color="error" onClick={() => handleRemoveRow(idx)} disabled={formItems.length <= 1}>
                <RemoveCircleOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {columns.map((col) => (
                <Box key={col.key}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">{col.label}</Typography>
                  <TextField
                    value={item[col.key] || ''}
                    onChange={(e) => handleItemChange(idx, col.key, e.target.value)}
                    size="small"
                    fullWidth
                    multiline={col.key === 'checkContent' || col.key === 'checkStandard' || col.key === 'remarks' || col.key === 'actionTaken'}
                    maxRows={3}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        ))}
      </Box>

    </Paper>

    {/* Actions */}
    <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, gap: 1, mt: 2 }}>
      <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: 1, sm: 'none' } }}>
        {t('common.backToList')}
      </Button>
      <Button
        variant="outlined"
        startIcon={<AddCircleOutlineIcon />}
        onClick={() => handleAddRow(formItems.length - 1)}
        sx={{ flex: { xs: 1, sm: 'none' } }}
      >
        {t('checklist.addRow', '행추가')}
      </Button>
      <Button
        variant="contained"
        onClick={handleSave}
        disabled={isProcessing}
        sx={{ flex: { xs: 1, sm: 'none' } }}
      >
        {t('common.save')}
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
      {viewMode === 'edit' && renderEditView()}
    </Box>
  )
}

export default ChecklistResultTab
