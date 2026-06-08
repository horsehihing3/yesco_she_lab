import { useState, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import CloseIcon from '@mui/icons-material/Close'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import ImageIcon from '@mui/icons-material/Image'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import NumberField from '../components/common/NumberField'
import { useAlert } from '../contexts/AlertContext'
import axiosInstance from '../api/axiosInstance'
import { ApiResponse, FileMetadata } from '../types/common.types'
import {
  fetchCodeGroups,
  createCodeGroup,
  updateCodeGroup,
  deleteCodeGroup,
  fetchCodeDetails,
  createCodeDetail,
  updateCodeDetail,
  deleteCodeDetail,
} from '../api/codeManageApi'
import { CodeGroup, CodeGroupRequest, CodeDetail, CodeDetailRequest } from '../types/codeManage.types'

const CodeManagePage: React.FC = () => {
  const { t, i18n } = useTranslation()

  const getLocalizedName = (detail: CodeDetail): string => {
    const lang = i18n.language
    if (lang === 'en' && detail.codeNameEn) return detail.codeNameEn
    if (lang === 'zh' && detail.codeNameZh) return detail.codeNameZh
    return detail.codeNameKo || detail.code
  }

  const getLocalizedDesc = (detail: CodeDetail): string => {
    const lang = i18n.language
    if (lang === 'en' && detail.descriptionEn) return detail.descriptionEn
    if (lang === 'zh' && detail.descriptionZh) return detail.descriptionZh
    return detail.descriptionKo || ''
  }
  const queryClient = useQueryClient()
  const { showConfirm, showSuccess, showError } = useAlert()

  // ===== State =====
  const [selectedGroup, setSelectedGroup] = useState<CodeGroup | null>(null)
  const [groupSearch, setGroupSearch] = useState('')
  const [detailSearch, setDetailSearch] = useState('')
  const [groupSearchInput, setGroupSearchInput] = useState('')
  const [detailSearchInput, setDetailSearchInput] = useState('')

  // Group Modal
  const [groupModalOpen, setGroupModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<CodeGroup | null>(null)
  const [groupForm, setGroupForm] = useState<CodeGroupRequest>({ groupCode: '', groupName: '', description: '', isActive: true, sortOrder: 0 })

  // Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [editingDetail, setEditingDetail] = useState<CodeDetail | null>(null)
  const [detailForm, setDetailForm] = useState<CodeDetailRequest>({ groupId: 0, code: '', codeValue: '', codeNameKo: '', codeNameEn: '', codeNameZh: '', descriptionKo: '', descriptionEn: '', descriptionZh: '', isActive: true, sortOrder: 0 })

  // File upload state
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingImages, setPendingImages] = useState<File[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [existingFiles, setExistingFiles] = useState<FileMetadata[]>([])
  const [deletedFileIds, setDeletedFileIds] = useState<number[]>([])

  // ===== Queries =====
  const groupQuery = useQuery({
    queryKey: ['codeGroups', groupSearch],
    queryFn: () => fetchCodeGroups(groupSearch || undefined),
  })

  const detailQuery = useQuery({
    queryKey: ['codeDetails', selectedGroup?.id, detailSearch],
    queryFn: () => fetchCodeDetails(selectedGroup!.id, detailSearch || undefined),
    enabled: !!selectedGroup,
  })

  // ===== Mutations =====
  const createGroupMutation = useMutation({
    mutationFn: (data: CodeGroupRequest) => createCodeGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codeGroups'] })
      showSuccess(t('codeManage.groupCreated'))
      setGroupModalOpen(false)
    },
    onError: () => showError(t('codeManage.saveFailed')),
  })

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CodeGroupRequest }) => updateCodeGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codeGroups'] })
      showSuccess(t('codeManage.groupUpdated'))
      setGroupModalOpen(false)
    },
    onError: () => showError(t('codeManage.saveFailed')),
  })

  const deleteGroupMutation = useMutation({
    mutationFn: (id: number) => deleteCodeGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codeGroups'] })
      queryClient.invalidateQueries({ queryKey: ['codeDetails'] })
      if (selectedGroup) setSelectedGroup(null)
      showSuccess(t('codeManage.groupDeleted'))
    },
    onError: () => showError(t('codeManage.deleteFailed')),
  })

  const createDetailMutation = useMutation({
    mutationFn: (data: CodeDetailRequest) => createCodeDetail(data),
    onSuccess: async (createdDetail) => {
      await uploadFilesForDetail(createdDetail.id)
      queryClient.invalidateQueries({ queryKey: ['codeDetails'] })
      showSuccess(t('codeManage.detailCreated'))
      setDetailModalOpen(false)
      resetFileState()
    },
    onError: () => showError(t('codeManage.saveFailed')),
  })

  const updateDetailMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CodeDetailRequest }) => updateCodeDetail(id, data),
    onSuccess: async (updatedDetail) => {
      await uploadFilesForDetail(updatedDetail.id)
      queryClient.invalidateQueries({ queryKey: ['codeDetails'] })
      showSuccess(t('codeManage.detailUpdated'))
      setDetailModalOpen(false)
      resetFileState()
    },
    onError: () => showError(t('codeManage.saveFailed')),
  })

  const deleteDetailMutation = useMutation({
    mutationFn: (id: number) => deleteCodeDetail(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codeDetails'] })
      showSuccess(t('codeManage.detailDeleted'))
    },
    onError: () => showError(t('codeManage.deleteFailed')),
  })

  // ===== Handlers =====
  const handleGroupSearch = () => setGroupSearch(groupSearchInput)
  const handleDetailSearch = () => setDetailSearch(detailSearchInput)

  const handleGroupReset = () => {
    setGroupSearchInput('')
    setGroupSearch('')
  }

  const handleDetailReset = () => {
    setDetailSearchInput('')
    setDetailSearch('')
  }

  const handleOpenGroupAdd = () => {
    setEditingGroup(null)
    setGroupForm({ groupCode: '', groupName: '', description: '', isActive: true, sortOrder: 0 })
    setGroupModalOpen(true)
  }

  const handleOpenGroupEdit = (group: CodeGroup) => {
    setEditingGroup(group)
    setGroupForm({
      groupCode: group.groupCode,
      groupName: group.groupName,
      description: group.description || '',
      isActive: group.isActive,
      sortOrder: group.sortOrder,
    })
    setGroupModalOpen(true)
  }

  const handleGroupSubmit = () => {
    if (!groupForm.groupCode || !groupForm.groupName) return
    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup.id, data: groupForm })
    } else {
      createGroupMutation.mutate(groupForm)
    }
  }

  const handleGroupDelete = async (group: CodeGroup) => {
    const confirmed = await showConfirm(t('codeManage.confirmDeleteGroup'))
    if (confirmed) {
      deleteGroupMutation.mutate(group.id)
    }
  }

  const handleOpenDetailAdd = () => {
    if (!selectedGroup) return
    setEditingDetail(null)
    setDetailForm({ groupId: selectedGroup.id, code: '', codeValue: '', codeNameKo: '', codeNameEn: '', codeNameZh: '', descriptionKo: '', descriptionEn: '', descriptionZh: '', isActive: true, sortOrder: 0 })
    resetFileState()
    setDetailModalOpen(true)
  }

  const handleOpenDetailEdit = (detail: CodeDetail) => {
    setEditingDetail(detail)
    setDetailForm({
      groupId: detail.groupId,
      code: detail.code,
      codeValue: detail.codeValue || '',
      codeNameKo: detail.codeNameKo || '',
      codeNameEn: detail.codeNameEn || '',
      codeNameZh: detail.codeNameZh || '',
      descriptionKo: detail.descriptionKo || '',
      descriptionEn: detail.descriptionEn || '',
      descriptionZh: detail.descriptionZh || '',
      isActive: detail.isActive,
      sortOrder: detail.sortOrder,
    })
    resetFileState()
    loadExistingFiles(detail.id)
    setDetailModalOpen(true)
  }

  const handleDetailSubmit = () => {
    if (!detailForm.code || !detailForm.codeNameKo || !detailForm.codeNameEn || !detailForm.codeNameZh) return
    if (editingDetail) {
      updateDetailMutation.mutate({ id: editingDetail.id, data: detailForm })
    } else {
      createDetailMutation.mutate(detailForm)
    }
  }

  const handleDetailDelete = async (detail: CodeDetail) => {
    const confirmed = await showConfirm(t('codeManage.confirmDeleteDetail'))
    if (confirmed) {
      deleteDetailMutation.mutate(detail.id)
    }
  }

  // ===== File Upload Helpers =====

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (imageFiles.length > 0) setPendingImages(prev => [...prev, ...imageFiles])
    event.target.value = ''
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return
    setPendingFiles(prev => [...prev, ...Array.from(files)])
    event.target.value = ''
  }

  const handleRemovePendingImage = (index: number) => setPendingImages(prev => prev.filter((_, i) => i !== index))
  const handleRemovePendingFile = (index: number) => setPendingFiles(prev => prev.filter((_, i) => i !== index))

  const handleDeleteExistingFile = (fileId: number) => {
    setDeletedFileIds(prev => [...prev, fileId])
    setExistingFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleDownloadFile = async (fileId: number, filename: string) => {
    const response = await axiosInstance.get(`/files/${fileId}`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  const uploadFilesForDetail = async (detailId: number) => {
    for (const fileId of deletedFileIds) {
      try { await axiosInstance.delete(`/files/${fileId}`) } catch { /* ignore */ }
    }
    for (const file of pendingImages) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entityType', 'CODE_DETAIL_IMAGE')
      formData.append('entityId', String(detailId))
      await axiosInstance.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    }
    for (const file of pendingFiles) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entityType', 'CODE_DETAIL_FILE')
      formData.append('entityId', String(detailId))
      await axiosInstance.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    }
  }

  const loadExistingFiles = async (detailId: number) => {
    try {
      const [imgRes, fileRes] = await Promise.all([
        axiosInstance.get<ApiResponse<FileMetadata[]>>(`/files/by-entity/CODE_DETAIL_IMAGE/${detailId}`),
        axiosInstance.get<ApiResponse<FileMetadata[]>>(`/files/by-entity/CODE_DETAIL_FILE/${detailId}`),
      ])
      setExistingFiles([...(imgRes.data.data || []), ...(fileRes.data.data || [])])
    } catch {
      setExistingFiles([])
    }
  }

  const resetFileState = () => {
    setPendingImages([])
    setPendingFiles([])
    setExistingFiles([])
    setDeletedFileIds([])
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const rawGroups = groupQuery.data || []
  const rawDetails = detailQuery.data || []

  // ===== Sorting =====
  type Order = 'asc' | 'desc'
  type GroupSortKey = 'no' | 'groupCode' | 'groupName'
  type DetailSortKey = 'no' | 'code' | 'codeName'
  const [groupSort, setGroupSort] = useState<{ key: GroupSortKey; order: Order }>({ key: 'no', order: 'asc' })
  const [detailSort, setDetailSort] = useState<{ key: DetailSortKey; order: Order }>({ key: 'no', order: 'asc' })

  const toggleSort = <K extends string>(prev: { key: K; order: Order }, key: K): { key: K; order: Order } => {
    if (prev.key !== key) return { key, order: 'asc' }
    return { key, order: prev.order === 'asc' ? 'desc' : 'asc' }
  }

  const cmp = (a: unknown, b: unknown): number => {
    const av = a == null ? '' : String(a)
    const bv = b == null ? '' : String(b)
    return av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' })
  }

  const groups = useMemo(() => {
    const arr = [...rawGroups]
    const { key, order } = groupSort
    if (key === 'no') return order === 'asc' ? arr : arr.slice().reverse()
    arr.sort((a, b) => cmp((a as any)[key], (b as any)[key]))
    return order === 'asc' ? arr : arr.reverse()
  }, [rawGroups, groupSort])

  const details = useMemo(() => {
    const arr = [...rawDetails]
    const { key, order } = detailSort
    if (key === 'no') return order === 'asc' ? arr : arr.slice().reverse()
    const getVal = (d: unknown) => {
      if (key === 'codeName') return getLocalizedName(d as Parameters<typeof getLocalizedName>[0])
      return (d as any)[key]
    }
    arr.sort((a, b) => cmp(getVal(a), getVal(b)))
    return order === 'asc' ? arr : arr.reverse()
  }, [rawDetails, detailSort])

  // ===== Render =====
  return (
    <Box>
      {/* PC Layout - Side by Side */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, height: 'calc(100vh - 160px)' }}>
        {/* Left Panel - Code Groups */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {t('codeManage.codeList')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder={t('codeManage.searchGroup')}
                value={groupSearchInput}
                onChange={(e) => setGroupSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGroupSearch()}
                sx={{ width: 200 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleGroupSearch} edge="end"><SearchIcon /></IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <IconButton size="small" onClick={handleGroupReset}><RefreshIcon /></IconButton>
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenGroupAdd}>New</Button>
            </Box>
          </Box>
          <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto', border: 1, borderColor: 'divider' }}>
            {groupQuery.isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : groupQuery.isError ? (
              <Alert severity="error" sx={{ m: 2 }}>{t('codeManage.loadFailed')}</Alert>
            ) : (
              <Table size="small" stickyHeader sx={{ '& th, & td': { borderRight: '1px solid', borderRightColor: 'grey.300' }, '& th:last-child, & td:last-child': { borderRight: 'none' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', width: 90, whiteSpace: 'nowrap' }} align="center" sortDirection={groupSort.key === 'no' ? groupSort.order : false}>
                      <TableSortLabel active={groupSort.key === 'no'} direction={groupSort.key === 'no' ? groupSort.order : 'asc'} onClick={() => setGroupSort(p => toggleSort(p, 'no'))}>{t('common.no')}</TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 140, whiteSpace: 'nowrap' }} align="center" sortDirection={groupSort.key === 'groupCode' ? groupSort.order : false}>
                      <TableSortLabel active={groupSort.key === 'groupCode'} direction={groupSort.key === 'groupCode' ? groupSort.order : 'asc'} onClick={() => setGroupSort(p => toggleSort(p, 'groupCode'))}>{t('codeManage.code')}</TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} sortDirection={groupSort.key === 'groupName' ? groupSort.order : false}>
                      <TableSortLabel active={groupSort.key === 'groupName'} direction={groupSort.key === 'groupName' ? groupSort.order : 'asc'} onClick={() => setGroupSort(p => toggleSort(p, 'groupName'))}>{t('codeManage.name')}</TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 100 }} align="center">{t('codeManage.useYn')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 100 }} align="center">{t('codeManage.action')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groups.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>{t('common.noData')}</TableCell></TableRow>
                  ) : (
                    groups.map((group, idx) => (
                      <TableRow
                        key={group.id}
                        hover
                        selected={selectedGroup?.id === group.id}
                        onClick={() => { setSelectedGroup(group); setDetailSearchInput(''); setDetailSearch('') }}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell align="center">{idx + 1}</TableCell>
                        <TableCell align="center">{group.groupCode}</TableCell>
                        <TableCell>{group.groupName}</TableCell>
                        <TableCell align="center">
                          <Chip label={group.isActive ? 'Y' : 'N'} size="small" color={group.isActive ? 'success' : 'default'} variant={group.isActive ? 'filled' : 'outlined'} />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenGroupEdit(group) }}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleGroupDelete(group) }}><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        </Box>

        {/* Right Panel - Code Details */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {t('codeManage.codeDetail')}
              </Typography>
              {selectedGroup && (
                <Typography variant="body2" color="text.secondary">({selectedGroup.groupName})</Typography>
              )}
            </Box>
            {selectedGroup && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  size="small"
                  placeholder={t('codeManage.searchDetail')}
                  value={detailSearchInput}
                  onChange={(e) => setDetailSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDetailSearch()}
                  sx={{ width: 200 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={handleDetailSearch} edge="end"><SearchIcon /></IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <IconButton size="small" onClick={handleDetailReset}><RefreshIcon /></IconButton>
                <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenDetailAdd}>New</Button>
              </Box>
            )}
          </Box>
          <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto', border: 1, borderColor: 'divider' }}>
            {!selectedGroup ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.secondary' }}>
                <Typography>{t('codeManage.selectGroup')}</Typography>
              </Box>
            ) : detailQuery.isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : detailQuery.isError ? (
              <Alert severity="error" sx={{ m: 2 }}>{t('codeManage.loadFailed')}</Alert>
            ) : (
              <Table size="small" stickyHeader sx={{ '& th, & td': { borderRight: '1px solid', borderRightColor: 'grey.300' }, '& th:last-child, & td:last-child': { borderRight: 'none' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', width: 90, whiteSpace: 'nowrap' }} align="center" sortDirection={detailSort.key === 'no' ? detailSort.order : false}>
                      <TableSortLabel active={detailSort.key === 'no'} direction={detailSort.key === 'no' ? detailSort.order : 'asc'} onClick={() => setDetailSort(p => toggleSort(p, 'no'))}>{t('common.no')}</TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 140, whiteSpace: 'nowrap' }} align="center" sortDirection={detailSort.key === 'code' ? detailSort.order : false}>
                      <TableSortLabel active={detailSort.key === 'code'} direction={detailSort.key === 'code' ? detailSort.order : 'asc'} onClick={() => setDetailSort(p => toggleSort(p, 'code'))}>{t('codeManage.code')}</TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} sortDirection={detailSort.key === 'codeName' ? detailSort.order : false}>
                      <TableSortLabel active={detailSort.key === 'codeName'} direction={detailSort.key === 'codeName' ? detailSort.order : 'asc'} onClick={() => setDetailSort(p => toggleSort(p, 'codeName'))}>{t('codeManage.codeName')}</TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t('codeManage.description')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 100 }} align="center">{t('codeManage.useYn')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 100 }} align="center">{t('codeManage.action')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {details.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>{t('common.noData')}</TableCell></TableRow>
                  ) : (
                    details.map((detail, idx) => (
                      <TableRow key={detail.id} hover>
                        <TableCell align="center">{idx + 1}</TableCell>
                        <TableCell align="center">{detail.code}</TableCell>
                        <TableCell>{getLocalizedName(detail)}</TableCell>
                        <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getLocalizedDesc(detail)}</TableCell>
                        <TableCell align="center">
                          <Chip label={detail.isActive ? 'Y' : 'N'} size="small" color={detail.isActive ? 'success' : 'default'} variant={detail.isActive ? 'filled' : 'outlined'} />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => handleOpenDetailEdit(detail)}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => handleDetailDelete(detail)}><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        </Box>
      </Box>

      {/* Mobile Layout - Stacked */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
        {/* Code Groups */}
        <Card>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>{t('codeManage.codeList')}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              <TextField
                size="small"
                placeholder={t('codeManage.searchGroup')}
                value={groupSearchInput}
                onChange={(e) => setGroupSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGroupSearch()}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleGroupSearch} edge="end"><SearchIcon /></IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              <Button variant="outlined" size="small" onClick={handleGroupReset} startIcon={<RefreshIcon />} sx={{ flex: 1 }}>{t('common.reset')}</Button>
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenGroupAdd} sx={{ flex: 1 }}>New</Button>
            </Box>
            {groupQuery.isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={24} /></Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: '40vh', overflowY: 'auto' }}>
                {groups.map((group) => (
                  <Paper
                    key={group.id}
                    elevation={selectedGroup?.id === group.id ? 3 : 1}
                    onClick={() => { setSelectedGroup(group); setDetailSearchInput(''); setDetailSearch('') }}
                    sx={{
                      p: 1.5, cursor: 'pointer',
                      border: selectedGroup?.id === group.id ? 2 : 1,
                      borderColor: selectedGroup?.id === group.id ? 'primary.main' : 'grey.300',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" fontWeight="bold" noWrap>{group.groupCode}</Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>{group.groupName}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, ml: 1 }}>
                        <Chip label={group.isActive ? 'Y' : 'N'} size="small" color={group.isActive ? 'success' : 'default'} />
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenGroupEdit(group) }}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleGroupDelete(group) }}><DeleteIcon fontSize="small" /></IconButton>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Code Details */}
        <Card>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold">{t('codeManage.codeDetail')}</Typography>
              {selectedGroup && <Typography variant="caption" color="text.secondary">({selectedGroup.groupName})</Typography>}
            </Box>
            {!selectedGroup ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>{t('codeManage.selectGroup')}</Typography>
            ) : (
              <>
                <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                  <TextField
                    size="small"
                    placeholder={t('codeManage.searchDetail')}
                    value={detailSearchInput}
                    onChange={(e) => setDetailSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDetailSearch()}
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={handleDetailSearch} edge="end"><SearchIcon /></IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                  <Button variant="outlined" size="small" onClick={handleDetailReset} startIcon={<RefreshIcon />} sx={{ flex: 1 }}>{t('common.reset')}</Button>
                  <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenDetailAdd} sx={{ flex: 1 }}>New</Button>
                </Box>
                {detailQuery.isLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={24} /></Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: '40vh', overflowY: 'auto' }}>
                    {details.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>{t('common.noData')}</Typography>
                    ) : (
                      details.map((detail) => (
                        <Paper key={detail.id} elevation={1} sx={{ p: 1.5, border: 1, borderColor: 'divider' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography variant="body2" fontWeight="bold" noWrap>{detail.code}</Typography>
                              <Typography variant="body2" color="text.secondary" noWrap>{getLocalizedName(detail)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, ml: 1 }}>
                              <Chip label={detail.isActive ? 'Y' : 'N'} size="small" color={detail.isActive ? 'success' : 'default'} />
                              <IconButton size="small" onClick={() => handleOpenDetailEdit(detail)}><EditIcon fontSize="small" /></IconButton>
                              <IconButton size="small" onClick={() => handleDetailDelete(detail)}><DeleteIcon fontSize="small" /></IconButton>
                            </Box>
                          </Box>
                        </Paper>
                      ))
                    )}
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Group Modal */}
      <Dialog open={groupModalOpen} onClose={() => setGroupModalOpen(false)} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { mx: { xs: 1, sm: 2 } } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editingGroup ? t('codeManage.editGroup') : t('codeManage.addGroup')}
          <IconButton size="small" onClick={() => setGroupModalOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {/* PC용 테이블 레이아웃 */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mt: 1, mx: 2, mb: 1 }}>
            {/* Row 1: 코드 | 코드명 */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('codeManage.code')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
                <TextField
                  value={groupForm.groupCode}
                  onChange={(e) => setGroupForm({ ...groupForm, groupCode: e.target.value })}
                  disabled={!!editingGroup}
                  size="small"
                  fullWidth
                  placeholder={t('codeManage.code')}
                />
              </Box>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('codeManage.name')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                <TextField
                  value={groupForm.groupName}
                  onChange={(e) => setGroupForm({ ...groupForm, groupName: e.target.value })}
                  size="small"
                  fullWidth
                  placeholder={t('codeManage.name')}
                />
              </Box>
            </Box>
            {/* Row 2: 설명 */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('codeManage.description')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                <TextField
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  placeholder={t('codeManage.description')}
                />
              </Box>
            </Box>
            {/* Row 3: 사용여부 | 정렬순서 */}
            <Box sx={{ display: 'flex' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('codeManage.useYn')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
                <FormControl size="small" fullWidth>
                  <Select
                    value={groupForm.isActive ? 'Y' : 'N'}
                    onChange={(e) => setGroupForm({ ...groupForm, isActive: e.target.value === 'Y' })}
                   displayEmpty>
                    <MenuItem value="" disabled>선택하세요</MenuItem>
                    <MenuItem value="Y">Y</MenuItem>
                    <MenuItem value="N">N</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('codeManage.sortOrder')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                <NumberField
                  value={groupForm.sortOrder}
                  onChange={(v) => setGroupForm({ ...groupForm, sortOrder: v ?? 0 })}
                  size="small"
                  fullWidth
                />
              </Box>
            </Box>
          </Box>

          {/* 모바일용 레이아웃 */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, p: 2 }}>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('codeManage.code')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
              </Typography>
              <TextField
                value={groupForm.groupCode}
                onChange={(e) => setGroupForm({ ...groupForm, groupCode: e.target.value })}
                disabled={!!editingGroup}
                size="small"
                fullWidth
                placeholder={t('codeManage.code')}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('codeManage.name')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
              </Typography>
              <TextField
                value={groupForm.groupName}
                onChange={(e) => setGroupForm({ ...groupForm, groupName: e.target.value })}
                size="small"
                fullWidth
                placeholder={t('codeManage.name')}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('codeManage.description')}
              </Typography>
              <TextField
                value={groupForm.description}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                size="small"
                fullWidth
                multiline
                rows={2}
                placeholder={t('codeManage.description')}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('codeManage.useYn')}
              </Typography>
              <FormControl size="small" fullWidth>
                <Select
                  value={groupForm.isActive ? 'Y' : 'N'}
                  onChange={(e) => setGroupForm({ ...groupForm, isActive: e.target.value === 'Y' })}
                 displayEmpty>
                  <MenuItem value="" disabled>선택하세요</MenuItem>
                  <MenuItem value="Y">Y</MenuItem>
                  <MenuItem value="N">N</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('codeManage.sortOrder')}
              </Typography>
              <NumberField
                value={groupForm.sortOrder}
                onChange={(v) => setGroupForm({ ...groupForm, sortOrder: v ?? 0 })}
                size="small"
                fullWidth
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: 1, borderColor: 'divider', px: { xs: 2, sm: 3 }, py: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setGroupModalOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleGroupSubmit}>{t('common.save')}</Button>
        </DialogActions>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onClose={() => { setDetailModalOpen(false); resetFileState() }} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { mx: { xs: 1, sm: 2 } } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editingDetail ? t('codeManage.editDetail') : t('codeManage.addDetail')}
          <IconButton size="small" onClick={() => { setDetailModalOpen(false); resetFileState() }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {/* Hidden file inputs */}
          <input type="file" ref={imageInputRef} onChange={handleImageSelect} accept="image/*" multiple style={{ display: 'none' }} />
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple style={{ display: 'none' }} />

          {/* PC용 테이블 레이아웃 */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mt: 1, mx: 2, mb: 1 }}>
            {/* Row 1: 코드 + VALUE */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('codeManage.code')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
                <TextField
                  value={detailForm.code}
                  onChange={(e) => setDetailForm({ ...detailForm, code: e.target.value })}
                  disabled={!!editingDetail}
                  size="small"
                  fullWidth
                  placeholder={t('codeManage.code')}
                />
              </Box>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                VALUE
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                <TextField
                  value={detailForm.codeValue || ''}
                  onChange={(e) => setDetailForm({ ...detailForm, codeValue: e.target.value })}
                  size="small"
                  fullWidth
                  placeholder="VALUE"
                />
              </Box>
            </Box>
            {/* 한국어 Section */}
            <Divider textAlign="left" sx={{ my: 1, '& .MuiDivider-wrapper': { pl: 2 } }}>
              <Typography variant="subtitle2" fontWeight="bold" color="primary">{t('codeManage.korean')}</Typography>
            </Divider>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('codeManage.nameKo')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
                <TextField
                  value={detailForm.codeNameKo}
                  onChange={(e) => setDetailForm({ ...detailForm, codeNameKo: e.target.value })}
                  size="small"
                  fullWidth
                  placeholder={t('codeManage.nameKo')}
                />
              </Box>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('codeManage.descKo')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                <TextField
                  value={detailForm.descriptionKo}
                  onChange={(e) => setDetailForm({ ...detailForm, descriptionKo: e.target.value })}
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  placeholder={t('codeManage.descKo')}
                />
              </Box>
            </Box>
            {/* 영어 Section */}
            <Divider textAlign="left" sx={{ my: 1, '& .MuiDivider-wrapper': { pl: 2 } }}>
              <Typography variant="subtitle2" fontWeight="bold" color="primary">{t('codeManage.english')}</Typography>
            </Divider>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('codeManage.nameEn')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
                <TextField
                  value={detailForm.codeNameEn}
                  onChange={(e) => setDetailForm({ ...detailForm, codeNameEn: e.target.value })}
                  size="small"
                  fullWidth
                  placeholder={t('codeManage.nameEn')}
                />
              </Box>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('codeManage.descEn')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                <TextField
                  value={detailForm.descriptionEn}
                  onChange={(e) => setDetailForm({ ...detailForm, descriptionEn: e.target.value })}
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  placeholder={t('codeManage.descEn')}
                />
              </Box>
            </Box>
            {/* 중국어 Section */}
            <Divider textAlign="left" sx={{ my: 1, '& .MuiDivider-wrapper': { pl: 2 } }}>
              <Typography variant="subtitle2" fontWeight="bold" color="primary">{t('codeManage.chinese')}</Typography>
            </Divider>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('codeManage.nameZh')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
                <TextField
                  value={detailForm.codeNameZh}
                  onChange={(e) => setDetailForm({ ...detailForm, codeNameZh: e.target.value })}
                  size="small"
                  fullWidth
                  placeholder={t('codeManage.nameZh')}
                />
              </Box>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('codeManage.descZh')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                <TextField
                  value={detailForm.descriptionZh}
                  onChange={(e) => setDetailForm({ ...detailForm, descriptionZh: e.target.value })}
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  placeholder={t('codeManage.descZh')}
                />
              </Box>
            </Box>
            {/* 사용여부 | 정렬순서 */}
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('codeManage.useYn')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
                <FormControl size="small" fullWidth>
                  <Select
                    value={detailForm.isActive ? 'Y' : 'N'}
                    onChange={(e) => setDetailForm({ ...detailForm, isActive: e.target.value === 'Y' })}
                   displayEmpty>
                    <MenuItem value="" disabled>선택하세요</MenuItem>
                    <MenuItem value="Y">Y</MenuItem>
                    <MenuItem value="N">N</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('codeManage.sortOrder')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                <NumberField
                  value={detailForm.sortOrder}
                  onChange={(v) => setDetailForm({ ...detailForm, sortOrder: v ?? 0 })}
                  size="small"
                  fullWidth
                />
              </Box>
            </Box>
            {/* 이미지 */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('codeManage.imageUpload')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                <Button variant="outlined" size="small" startIcon={<ImageIcon />} onClick={() => imageInputRef.current?.click()}>
                  {t('codeManage.selectImage')}
                </Button>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1 }}>
                  {existingFiles.filter(f => f.entityType === 'CODE_DETAIL_IMAGE').map((file) => (
                    <Chip key={`ei-${file.id}`} icon={<ImageIcon />} label={file.originalFilename} size="small" onDelete={() => handleDeleteExistingFile(file.id)} onClick={() => handleDownloadFile(file.id, file.originalFilename)} sx={{ m: 0.5, cursor: 'pointer' }} />
                  ))}
                  {pendingImages.map((file, index) => (
                    <Chip key={`pi-${index}`} icon={<ImageIcon />} label={file.name} size="small" onDelete={() => handleRemovePendingImage(index)} sx={{ m: 0.5 }} color="primary" variant="outlined" />
                  ))}
                </Box>
                {existingFiles.filter(f => f.entityType === 'CODE_DETAIL_IMAGE').length === 0 && pendingImages.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t('codeManage.noImages')}</Typography>
                )}
              </Box>
            </Box>
            {/* 첨부파일 */}
            <Box sx={{ display: 'flex' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('codeManage.fileUpload')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                <Button variant="outlined" size="small" startIcon={<AttachFileIcon />} onClick={() => fileInputRef.current?.click()}>
                  {t('codeManage.selectFile')}
                </Button>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1 }}>
                  {existingFiles.filter(f => f.entityType === 'CODE_DETAIL_FILE').map((file) => (
                    <Chip key={`ef-${file.id}`} icon={<InsertDriveFileIcon />} label={`${file.originalFilename} (${formatFileSize(file.fileSize)})`} size="small" onDelete={() => handleDeleteExistingFile(file.id)} onClick={() => handleDownloadFile(file.id, file.originalFilename)} sx={{ m: 0.5, cursor: 'pointer' }} />
                  ))}
                  {pendingFiles.map((file, index) => (
                    <Chip key={`pf-${index}`} icon={<InsertDriveFileIcon />} label={`${file.name} (${formatFileSize(file.size)})`} size="small" onDelete={() => handleRemovePendingFile(index)} sx={{ m: 0.5 }} color="primary" variant="outlined" />
                  ))}
                </Box>
                {existingFiles.filter(f => f.entityType === 'CODE_DETAIL_FILE').length === 0 && pendingFiles.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t('codeManage.noFiles')}</Typography>
                )}
              </Box>
            </Box>
          </Box>

          {/* 모바일용 레이아웃 */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, p: 2 }}>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('codeManage.code')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
              </Typography>
              <TextField
                value={detailForm.code}
                onChange={(e) => setDetailForm({ ...detailForm, code: e.target.value })}
                disabled={!!editingDetail}
                size="small"
                fullWidth
                placeholder={t('codeManage.code')}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                VALUE
              </Typography>
              <TextField
                value={detailForm.codeValue || ''}
                onChange={(e) => setDetailForm({ ...detailForm, codeValue: e.target.value })}
                size="small"
                fullWidth
                placeholder="VALUE"
              />
            </Box>
            {/* 한국어 */}
            <Divider textAlign="left">
              <Typography variant="subtitle2" fontWeight="bold" color="primary">{t('codeManage.korean')}</Typography>
            </Divider>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('codeManage.nameKo')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
              </Typography>
              <TextField
                value={detailForm.codeNameKo}
                onChange={(e) => setDetailForm({ ...detailForm, codeNameKo: e.target.value })}
                size="small"
                fullWidth
                placeholder={t('codeManage.nameKo')}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('codeManage.descKo')}
              </Typography>
              <TextField
                value={detailForm.descriptionKo}
                onChange={(e) => setDetailForm({ ...detailForm, descriptionKo: e.target.value })}
                size="small"
                fullWidth
                multiline
                rows={2}
                placeholder={t('codeManage.descKo')}
              />
            </Box>
            {/* 영어 */}
            <Divider textAlign="left">
              <Typography variant="subtitle2" fontWeight="bold" color="primary">{t('codeManage.english')}</Typography>
            </Divider>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('codeManage.nameEn')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
              </Typography>
              <TextField
                value={detailForm.codeNameEn}
                onChange={(e) => setDetailForm({ ...detailForm, codeNameEn: e.target.value })}
                size="small"
                fullWidth
                placeholder={t('codeManage.nameEn')}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('codeManage.descEn')}
              </Typography>
              <TextField
                value={detailForm.descriptionEn}
                onChange={(e) => setDetailForm({ ...detailForm, descriptionEn: e.target.value })}
                size="small"
                fullWidth
                multiline
                rows={2}
                placeholder={t('codeManage.descEn')}
              />
            </Box>
            {/* 중국어 */}
            <Divider textAlign="left">
              <Typography variant="subtitle2" fontWeight="bold" color="primary">{t('codeManage.chinese')}</Typography>
            </Divider>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('codeManage.nameZh')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
              </Typography>
              <TextField
                value={detailForm.codeNameZh}
                onChange={(e) => setDetailForm({ ...detailForm, codeNameZh: e.target.value })}
                size="small"
                fullWidth
                placeholder={t('codeManage.nameZh')}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('codeManage.descZh')}
              </Typography>
              <TextField
                value={detailForm.descriptionZh}
                onChange={(e) => setDetailForm({ ...detailForm, descriptionZh: e.target.value })}
                size="small"
                fullWidth
                multiline
                rows={2}
                placeholder={t('codeManage.descZh')}
              />
            </Box>
            {/* 사용여부 / 정렬순서 */}
            <Divider />
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('codeManage.useYn')}
              </Typography>
              <FormControl size="small" fullWidth>
                <Select
                  value={detailForm.isActive ? 'Y' : 'N'}
                  onChange={(e) => setDetailForm({ ...detailForm, isActive: e.target.value === 'Y' })}
                 displayEmpty>
                  <MenuItem value="" disabled>선택하세요</MenuItem>
                  <MenuItem value="Y">Y</MenuItem>
                  <MenuItem value="N">N</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('codeManage.sortOrder')}
              </Typography>
              <NumberField
                value={detailForm.sortOrder}
                onChange={(v) => setDetailForm({ ...detailForm, sortOrder: v ?? 0 })}
                size="small"
                fullWidth
              />
            </Box>
            {/* 이미지 */}
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('codeManage.imageUpload')}
              </Typography>
              <Button variant="outlined" size="small" startIcon={<ImageIcon />} onClick={() => imageInputRef.current?.click()}>
                {t('codeManage.selectImage')}
              </Button>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1 }}>
                {existingFiles.filter(f => f.entityType === 'CODE_DETAIL_IMAGE').map((file) => (
                  <Chip key={`mei-${file.id}`} icon={<ImageIcon />} label={file.originalFilename} size="small" onDelete={() => handleDeleteExistingFile(file.id)} onClick={() => handleDownloadFile(file.id, file.originalFilename)} sx={{ m: 0.5, cursor: 'pointer' }} />
                ))}
                {pendingImages.map((file, index) => (
                  <Chip key={`mpi-${index}`} icon={<ImageIcon />} label={file.name} size="small" onDelete={() => handleRemovePendingImage(index)} sx={{ m: 0.5 }} color="primary" variant="outlined" />
                ))}
              </Box>
              {existingFiles.filter(f => f.entityType === 'CODE_DETAIL_IMAGE').length === 0 && pendingImages.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t('codeManage.noImages')}</Typography>
              )}
            </Box>
            {/* 첨부파일 */}
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('codeManage.fileUpload')}
              </Typography>
              <Button variant="outlined" size="small" startIcon={<AttachFileIcon />} onClick={() => fileInputRef.current?.click()}>
                {t('codeManage.selectFile')}
              </Button>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1 }}>
                {existingFiles.filter(f => f.entityType === 'CODE_DETAIL_FILE').map((file) => (
                  <Chip key={`mef-${file.id}`} icon={<InsertDriveFileIcon />} label={`${file.originalFilename} (${formatFileSize(file.fileSize)})`} size="small" onDelete={() => handleDeleteExistingFile(file.id)} onClick={() => handleDownloadFile(file.id, file.originalFilename)} sx={{ m: 0.5, cursor: 'pointer' }} />
                ))}
                {pendingFiles.map((file, index) => (
                  <Chip key={`mpf-${index}`} icon={<InsertDriveFileIcon />} label={`${file.name} (${formatFileSize(file.size)})`} size="small" onDelete={() => handleRemovePendingFile(index)} sx={{ m: 0.5 }} color="primary" variant="outlined" />
                ))}
              </Box>
              {existingFiles.filter(f => f.entityType === 'CODE_DETAIL_FILE').length === 0 && pendingFiles.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t('codeManage.noFiles')}</Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: 1, borderColor: 'divider', px: { xs: 2, sm: 3 }, py: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => { setDetailModalOpen(false); resetFileState() }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleDetailSubmit}>{t('common.save')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CodeManagePage
