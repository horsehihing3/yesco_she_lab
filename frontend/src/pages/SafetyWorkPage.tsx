import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { isEhsManager, isSystemAdmin } from '../utils/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../contexts/AlertContext'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  TextField,
  MenuItem,
  IconButton,
  Pagination,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Menu,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import DownloadIcon from '@mui/icons-material/Download'
import CloseIcon from '@mui/icons-material/Close'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import DatePickerField from '../components/common/DatePickerField'
import axiosInstance from '../api/axiosInstance'
import { SafetyWork, SafetyWorkRequest } from '../types/safetyWork.types'
import useCodeMap from '../hooks/useCodeMap'
import { User } from '../types/user.types'
import { ApiResponse, PageResponse, FileMetadata } from '../types/common.types'
import UserSelectModal, { UserInfo } from '../components/common/UserSelectModal'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

interface FetchParams {
  page: number
  size: number
  title?: string
  location?: string
  status?: string
}

const fetchSafetyWorks = async (params: FetchParams): Promise<PageResponse<SafetyWork>> => {
  const { page, size, title, location, status } = params
  let url = '/safety-works'
  const queryParams = new URLSearchParams()
  queryParams.append('page', String(page))
  queryParams.append('size', String(size))

  if (title) {
    url = '/safety-works/search'
    queryParams.append('title', title)
  } else if (status) {
    url = `/safety-works/status/${status}`
  } else if (location) {
    url = `/safety-works/location/${encodeURIComponent(location)}`
  }

  const response = await axiosInstance.get<ApiResponse<PageResponse<SafetyWork>>>(`${url}?${queryParams.toString()}`)
  return response.data.data
}

const fetchSafetyWorkDetail = async (id: number): Promise<SafetyWork> => {
  const response = await axiosInstance.get<ApiResponse<SafetyWork>>(`/safety-works/${id}`)
  return response.data.data
}

const fetchFiles = async (entityType: string, entityId: string): Promise<FileMetadata[]> => {
  const response = await axiosInstance.get<ApiResponse<FileMetadata[]>>(`/files/by-entity/${entityType}/${entityId}`)
  return response.data.data
}

const createSafetyWork = async (data: SafetyWorkRequest): Promise<SafetyWork> => {
  const response = await axiosInstance.post<ApiResponse<SafetyWork>>('/safety-works', data)
  return response.data.data
}

const updateSafetyWork = async ({ id, data }: { id: number; data: SafetyWorkRequest }): Promise<SafetyWork> => {
  const response = await axiosInstance.put<ApiResponse<SafetyWork>>(`/safety-works/${id}`, data)
  return response.data.data
}

const updateSafetyWorkStatus = async ({ id, status }: { id: number; status: string }): Promise<SafetyWork> => {
  const response = await axiosInstance.patch<ApiResponse<SafetyWork>>(`/safety-works/${id}/status?status=${status}`)
  return response.data.data
}

const deleteSafetyWork = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/safety-works/${id}`)
}

const fetchUsers = async (): Promise<User[]> => {
  const response = await axiosInstance.get<ApiResponse<User[]>>('/users')
  return response.data.data
}

const SafetyWorkPage: React.FC<{ titleKey?: string }> = ({ titleKey }) => {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const { codeMap: swStatusLabels } = useCodeMap('SAFETY_WORK_STATUS')
  const { showConfirm, showSuccess, showInfo } = useAlert()
  const planFileRef = useRef<HTMLInputElement>(null)
  const riskFileRef = useRef<HTMLInputElement>(null)

  const getTeamLeaderDisplayName = (user: UserInfo | null) => {
    if (!user) return ''
    const lang = i18n.language
    let name = user.name
    if (lang === 'en' && user.nameEn) name = user.nameEn
    if (lang === 'zh' && user.nameZh) name = user.nameZh
    return `${name} (${user.department || ''})`
  }

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedWork, setSelectedWork] = useState<SafetyWork | null>(null)
  const [editingWork, setEditingWork] = useState<SafetyWork | null>(null)

  // List filters
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const [page, setPage] = useState(0)

  // Dialogs (only for confirmations and small inputs)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

  // Form state
  const [selectedApprover, setSelectedApprover] = useState<User | null>(null)
  const [rejectComment, setRejectComment] = useState('')
  const [planFile, setPlanFile] = useState<File | null>(null)
  const [riskFile, setRiskFile] = useState<File | null>(null)
  const [templateMenuAnchor, setTemplateMenuAnchor] = useState<null | HTMLElement>(null)
  const [teamLeaderModalOpen, setTeamLeaderModalOpen] = useState(false)
  const [selectedTeamLeader, setSelectedTeamLeader] = useState<UserInfo | null>(null)
  const [managerModalOpen, setManagerModalOpen] = useState(false)
  const [selectedManager, setSelectedManager] = useState<UserInfo | null>(null)
  const photoFileRef = useRef<HTMLInputElement>(null)
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([])
  const [pendingPhotoUrls, setPendingPhotoUrls] = useState<string[]>([])
  const [existingPhotos, setExistingPhotos] = useState<FileMetadata[]>([])
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<number[]>([])
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('')
  const { user } = useAuth()
  const isAdmin = isEhsManager(user)
  const rowsPerPage = 10

  const { control, handleSubmit, reset, setValue } = useForm<SafetyWorkRequest>({
    defaultValues: {
      title: '',
      location: '',
      startDate: '',
      endDate: '',
      partners: '',
      partnersName: '',
      managerName: '',
      managerDept: '',
      approverName: '',
      approverMail: '',
      approverDept: '',
      status: 'DRAFT',
      authorName: '',
    },
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['safetyWorks', page, searchQuery, locationFilter, statusFilter],
    queryFn: () =>
      fetchSafetyWorks({
        page,
        size: rowsPerPage,
        title: searchQuery || undefined,
        location: locationFilter || undefined,
        status: statusFilter || undefined,
      }),
    enabled: viewMode === 'list',
  })

  const { data: workDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['safetyWorkDetail', selectedWork?.id],
    queryFn: () => fetchSafetyWorkDetail(selectedWork!.id),
    enabled: !!selectedWork?.id && viewMode === 'detail',
  })

  const { data: workFiles } = useQuery({
    queryKey: ['safetyWorkFiles', selectedWork?.safetyWorkId],
    queryFn: () => fetchFiles('SAFETY_WORK', selectedWork!.safetyWorkId),
    enabled: !!selectedWork?.safetyWorkId && viewMode === 'detail',
  })

  const { data: detailPhotos } = useQuery({
    queryKey: ['safetyWorkPhotos', selectedWork?.safetyWorkId],
    queryFn: () => fetchFiles('SAFETY_WORK_PHOTO', selectedWork!.safetyWorkId),
    enabled: !!selectedWork?.safetyWorkId && viewMode === 'detail',
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  const uploadFilesForWork = async (safetyWorkId: string) => {
    // Upload plan file
    if (planFile) {
      const formData = new FormData()
      formData.append('file', planFile)
      formData.append('entityType', 'SAFETY_WORK')
      formData.append('entityId', safetyWorkId)
      await axiosInstance.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }
    // Upload risk file
    if (riskFile) {
      const formData = new FormData()
      formData.append('file', riskFile)
      formData.append('entityType', 'SAFETY_WORK')
      formData.append('entityId', safetyWorkId)
      await axiosInstance.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }
    // Upload site photos
    for (const photo of pendingPhotos) {
      const formData = new FormData()
      formData.append('file', photo)
      formData.append('entityType', 'SAFETY_WORK_PHOTO')
      formData.append('entityId', safetyWorkId)
      await axiosInstance.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }
    // Delete removed photos
    for (const photoId of deletedPhotoIds) {
      await axiosInstance.delete(`/files/${photoId}`)
    }
  }

  const createMutation = useMutation({
    mutationFn: createSafetyWork,
    onSuccess: async (createdWork) => {
      await uploadFilesForWork(createdWork.safetyWorkId)
      queryClient.invalidateQueries({ queryKey: ['safetyWorks'] })
      await showSuccess(t('common.saveSuccess'))
      handleBackToList()
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateSafetyWork,
    onSuccess: async (updatedWork) => {
      await uploadFilesForWork(updatedWork.safetyWorkId)
      queryClient.invalidateQueries({ queryKey: ['safetyWorks'] })
      queryClient.invalidateQueries({ queryKey: ['safetyWorkDetail'] })
      await showSuccess(t('common.saveSuccess'))
      handleBackToList()
    },
  })

  const statusMutation = useMutation({
    mutationFn: updateSafetyWorkStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safetyWorks'] })
      queryClient.invalidateQueries({ queryKey: ['safetyWorkDetail'] })
      setRejectDialogOpen(false)
      setRejectComment('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSafetyWork,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['safetyWorks'] })
      await showSuccess(t('common.deleteSuccess'))
      handleBackToList()
    },
  })

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedWork(null)
    setEditingWork(null)
    setSelectedApprover(null)
    setSelectedTeamLeader(null)
    setSelectedManager(null)
    setPlanFile(null)
    setRiskFile(null)
    setPendingPhotos([])
    pendingPhotoUrls.forEach((url) => URL.revokeObjectURL(url))
    setPendingPhotoUrls([])
    setExistingPhotos([])
    setDeletedPhotoIds([])
    reset({
      title: '',
      location: '',
      startDate: '',
      endDate: '',
      partners: '',
      partnersName: '',
      managerName: '',
      managerDept: '',
      approverName: '',
      approverMail: '',
      approverDept: '',
      status: 'DRAFT',
      authorName: '',
    })
  }

  const handleReset = () => {
    setSearchText('')
    setSearchQuery('')
    setLocationFilter('')
    setStatusFilter('')
    setStartDateFilter('')
    setEndDateFilter('')
    setPage(0)
  }

  const handleSearch = () => {
    setSearchQuery(searchText)
    setPage(0)
  }

  const handleRowClick = (work: SafetyWork) => {
    setSelectedWork(work)
    setViewMode('detail')
  }

  const handleAddClick = () => {
    setEditingWork(null)
    setSelectedApprover(null)
    setSelectedTeamLeader(null)
    setSelectedManager(null)
    reset({
      title: '',
      location: '',
      startDate: '',
      endDate: '',
      partners: '',
      partnersName: '',
      managerName: '',
      managerDept: '',
      approverName: '',
      approverMail: '',
      approverDept: '',
      status: 'DRAFT',
      authorName: '',
    })
    setPlanFile(null)
    setRiskFile(null)
    setPendingPhotos([])
    setPendingPhotoUrls([])
    setExistingPhotos([])
    setDeletedPhotoIds([])
    setViewMode('create')
  }

  const handleEditClick = async (work: SafetyWork) => {
    setEditingWork(work)
    reset({
      title: work.title,
      location: work.location || '',
      startDate: work.startDate ? work.startDate.split('T')[0] : '',
      endDate: work.endDate ? work.endDate.split('T')[0] : '',
      partners: work.partners || '',
      partnersName: work.partnersName || '',
      managerName: work.managerName || '',
      managerDept: work.managerDept || '',
      approverName: work.approverName || '',
      approverMail: work.approverMail || '',
      approverDept: work.approverDept || '',
      status: work.status,
      authorName: work.authorName || '',
    })
    const approver = users.find(u => u.email === work.approverMail)
    setSelectedApprover(approver || null)
    if (work.approverName && work.approverMail) {
      setSelectedTeamLeader({
        id: approver?.id || 0,
        username: approver?.username || '',
        email: work.approverMail,
        name: work.approverName,
        department: work.approverDept || '',
        company: approver?.company || '',
        role: approver?.role || '',
      })
    } else {
      setSelectedTeamLeader(null)
    }
    setSelectedManager(null)
    setPlanFile(null)
    setRiskFile(null)
    setPendingPhotos([])
    setPendingPhotoUrls([])
    setDeletedPhotoIds([])
    // Load existing photos
    try {
      const photos = await fetchFiles('SAFETY_WORK_PHOTO', work.safetyWorkId)
      setExistingPhotos(photos)
    } catch {
      setExistingPhotos([])
    }
    setViewMode('edit')
  }

  const handleStatusUpdate = (newStatus: string) => {
    if (selectedWork) {
      statusMutation.mutate({ id: selectedWork.id, status: newStatus })
    }
  }

  const handleRejectClick = () => {
    setRejectDialogOpen(true)
  }

  const handleRejectConfirm = () => {
    if (selectedWork) {
      statusMutation.mutate({ id: selectedWork.id, status: 'REJECTED' })
    }
  }

  const handleDeleteClick = async () => {
    if (!selectedWork) return
    const confirmed = await showConfirm(
      `${t('safetyWork.confirmDelete')}\n${t('safetyWork.workNameLabel')} ${selectedWork.title}\n${t('safetyWork.cannotRecover')}`,
      { title: t('safetyWork.deleteSafetyWork') }
    )
    if (confirmed) {
      deleteMutation.mutate(selectedWork.id)
    }
  }

  const handleFileSelect = (type: 'plan' | 'risk', event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    if (type === 'plan') {
      setPlanFile(files[0])
    } else if (type === 'risk') {
      setRiskFile(files[0])
    }

    event.target.value = ''
  }

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    const totalCount = existingPhotos.filter((p) => !deletedPhotoIds.includes(p.id)).length + pendingPhotos.length
    const remaining = 10 - totalCount
    if (remaining <= 0) return
    const newFiles = Array.from(files).slice(0, remaining)
    const newUrls = newFiles.map((f) => URL.createObjectURL(f))
    setPendingPhotos((prev) => [...prev, ...newFiles])
    setPendingPhotoUrls((prev) => [...prev, ...newUrls])
    event.target.value = ''
  }

  const handleRemovePendingPhoto = (index: number) => {
    URL.revokeObjectURL(pendingPhotoUrls[index])
    setPendingPhotos((prev) => prev.filter((_, i) => i !== index))
    setPendingPhotoUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExistingPhoto = (photoId: number) => {
    setDeletedPhotoIds((prev) => [...prev, photoId])
  }

  const handleTeamLeaderConfirm = (users: UserInfo[]) => {
    if (users.length > 0) {
      setSelectedTeamLeader(users[0])
    }
  }

  const getManagerDisplayName = (user: UserInfo | null) => {
    if (!user) return ''
    const lang = i18n.language
    if (lang === 'en' && user.nameEn) return user.nameEn
    if (lang === 'zh' && user.nameZh) return user.nameZh
    return user.name
  }

  const handleManagerConfirm = (users: UserInfo[]) => {
    if (users.length > 0) {
      const user = users[0]
      setSelectedManager(user)
      setValue('managerName', getManagerDisplayName(user))
      setValue('managerDept', user.department || '')
    }
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

  const handleDownloadTemplate = (type: 'plan' | 'risk') => {
    const file = type === 'plan' ? planFile : riskFile
    if (file) {
      const url = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', file.name)
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } else {
      showInfo(t('safetyWork.noTemplateFile'))
    }
  }

  const onSubmit = async (formData: SafetyWorkRequest) => {
    const confirmed = await showConfirm(t('common.confirmSave'))
    if (!confirmed) return

    const submitData = {
      ...formData,
      approverName: selectedTeamLeader?.name || selectedApprover?.name || formData.approverName || '',
      approverMail: selectedTeamLeader?.email || selectedApprover?.email || formData.approverMail || '',
      approverDept: selectedTeamLeader?.department || selectedApprover?.department || formData.approverDept || '',
    }
    if (editingWork) {
      updateMutation.mutate({ id: editingWork.id, data: submitData })
    } else {
      createMutation.mutate(submitData)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    return new Date(dateString).toISOString().substring(0, 10)
  }

  const formatPeriod = (start?: string, end?: string) => {
    if (!start && !end) return ''
    return `${formatDate(start)} ~ ${formatDate(end)}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const safetyWorks = data?.content || []
  const totalPages = data?.totalPages || 0

  const getStatusChip = (status: string) => {
    const label = swStatusLabels[status] || status
    const color = 'default' as 'default' | 'info' | 'success' | 'primary' | 'error'
    return <Chip label={label} color={color} size="small" />
  }

  const canApprove = (status: string) => ['REVIEW', 'REVIEW_COMPLETED'].includes(status)
  const canReject = (status: string) => ['REVIEW', 'REVIEW_COMPLETED'].includes(status)
  const canComplete = (status: string) => status === 'APPROVED'

  // ===== Render Functions =====

  const renderListView = () => (
    <Box sx={{ overflow: 'hidden' }}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        {t(titleKey || 'safetyWork.pageTitle')}
      </Typography>

      {/* Filters - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <DatePickerField
            label=""
            value={startDateFilter}
            onChange={setStartDateFilter}
            placeholder={t('safetyWork.startDate')}
            size="small"
            sx={{ width: 240 }}
          />
          <Typography>~</Typography>
          <DatePickerField
            label=""
            value={endDateFilter}
            onChange={setEndDateFilter}
            placeholder={t('safetyWork.endDate')}
            size="small"
            sx={{ width: 240 }}
          />
          <TextField
            size="small"
            placeholder={t('safetyWork.workName')}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ width: 400 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleSearch}><SearchIcon /></IconButton>
                </InputAdornment>
              ),
            }}
          />
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
        </Box>
        {isAdmin && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick}>New</Button>
          </Box>
        )}
      </Box>

      {/* Filters - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <DatePickerField
            label=""
            value={startDateFilter}
            onChange={setStartDateFilter}
            placeholder={t('safetyWork.startDate')}
            size="small"
            sx={{ flex: 1 }}
          />
          <Typography>~</Typography>
          <DatePickerField
            label=""
            value={endDateFilter}
            onChange={setEndDateFilter}
            placeholder={t('safetyWork.endDate')}
            size="small"
            sx={{ flex: 1 }}
          />
        </Box>
        <TextField
          size="small"
          placeholder={t('safetyWork.workName')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleSearch}><SearchIcon /></IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" onClick={handleReset} startIcon={<RefreshIcon />} sx={{ flex: 1 }}>{t('common.reset')}</Button>
          {isAdmin && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick} sx={{ flex: 1 }}>New</Button>
          )}
        </Box>
      </Box>

      {/* Main Table - PC */}
      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 900, '& .MuiTableCell-root': { borderColor: 'divider' } }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }} align="center">{t('safetyWork.workName')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 220, borderRight: 1, borderColor: 'divider' }} align="center">{t('safetyWork.location')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 80, borderRight: 1, borderColor: 'divider' }} align="center">{t('safetyWork.manager')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 120, borderRight: 1, borderColor: 'divider' }} align="center">{t('safetyWork.managerDept')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 240, borderRight: 1, borderColor: 'divider' }} align="center">{t('safetyWork.period')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 80 }} align="center">{t('common.status')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {safetyWorks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">{t('safetyWork.noSafetyWorks')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              safetyWorks.map((item) => (
                <TableRow key={item.id} hover onClick={() => handleRowClick(item)} sx={{ cursor: 'pointer' }}>
                  <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{item.title}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{item.location || ''}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{item.managerName || ''}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{item.managerDept || ''}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{formatPeriod(item.startDate, item.endDate)}</TableCell>
                  <TableCell align="center">{getStatusChip(item.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile Card List */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
        {safetyWorks.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">{t('safetyWork.noSafetyWorks')}</Typography>
          </Paper>
        ) : (
          safetyWorks.map((item) => (
            <Paper key={item.id} sx={{ p: 2, cursor: 'pointer', border: 1, borderColor: 'divider' }} onClick={() => handleRowClick(item)}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography fontWeight="bold" sx={{ flex: 1 }}>{item.title}</Typography>
                {getStatusChip(item.status)}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('safetyWork.place')}</Typography>
                  <Typography variant="body2">{item.location || ''}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('safetyWork.manager')}</Typography>
                  <Typography variant="body2">{item.managerName || ''} ({item.managerDept || ''})</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('safetyWork.period')}</Typography>
                  <Typography variant="body2">{formatPeriod(item.startDate, item.endDate)}</Typography>
                </Box>
              </Box>
            </Paper>
          ))
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination count={totalPages || 1} page={page + 1} onChange={(_, newPage) => setPage(newPage - 1)} color="primary" />
      </Box>
    </Box>
  )

  const renderDetailView = () => (
    <Box sx={{ overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">{t('safetyWork.pageTitle')}</Typography>
      </Box>

      {detailLoading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      ) : workDetail ? (
        <>
          {/* 작업 정보 섹션 */}
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'text.primary' }}>
            {t('safetyWork.workInfo')}
          </Typography>
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
          {/* PC용 테이블 레이아웃 */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
            {/* Row 1: 작업명 | 작업기간 */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 128, minWidth: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('safetyWork.workName')}
              </Typography>
              <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>
                {workDetail.title || ''}
              </Typography>
              <Typography sx={{ width: 128, minWidth: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('safetyWork.workPeriod')}
              </Typography>
              <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>
                {formatPeriod(workDetail.startDate, workDetail.endDate)}
              </Typography>
            </Box>

            {/* Row 2: 작업장소 | 협력업체 | 협력업체 담당자명 */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 128, minWidth: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('safetyWork.location')}
              </Typography>
              <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>
                {workDetail.location || ''}
              </Typography>
              <Typography sx={{ width: 128, minWidth: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('safetyWork.partners')}
              </Typography>
              <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>
                {workDetail.partners || ''}
              </Typography>
              <Typography sx={{ width: 128, minWidth: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('safetyWork.partnersContactName')}
              </Typography>
              <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>
                {workDetail.partnersName || ''}
              </Typography>
            </Box>

            {/* Row 3: 담당자 | 담당팀 */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 128, minWidth: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('safetyWork.manager')}
              </Typography>
              <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>
                {workDetail.managerName || ''}
              </Typography>
              <Typography sx={{ width: 128, minWidth: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('safetyWork.managerDept')}
              </Typography>
              <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>
                {workDetail.managerDept || ''}
              </Typography>
            </Box>

            {/* Row 4: 소속팀장(승인자) | 상태 */}
            <Box sx={{ display: 'flex' }}>
              <Typography sx={{ width: 128, minWidth: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('safetyWork.teamLeader')}
              </Typography>
              <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>
                {workDetail.approverName || ''}
              </Typography>
              <Typography sx={{ width: 128, minWidth: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('common.status')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', gap: 1 }}>
                {getStatusChip(workDetail.status)}
                {workDetail.status === 'REJECTED' && workDetail.rejectComment && (
                  <Typography fontSize="0.875rem" color="text.secondary">
                    ({t('safetyWork.reason')}: {workDetail.rejectComment})
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
          </Box>

          {/* 모바일용 레이아웃 */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('safetyWork.workName')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{workDetail.title || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('safetyWork.workPeriod')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{formatPeriod(workDetail.startDate, workDetail.endDate)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('safetyWork.location')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{workDetail.location || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('safetyWork.partners')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{workDetail.partners || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('safetyWork.partnersContactName')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{workDetail.partnersName || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('safetyWork.manager')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{workDetail.managerName || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('safetyWork.managerDept')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{workDetail.managerDept || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('safetyWork.teamLeader')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{workDetail.approverName || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.status')}</Typography>
                <Box sx={{ px: 1.5, py: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getStatusChip(workDetail.status)}
                  {workDetail.status === 'REJECTED' && workDetail.rejectComment && (
                    <Typography fontSize="0.75rem" color="text.secondary">({t('safetyWork.reason')}: {workDetail.rejectComment})</Typography>
                  )}
                </Box>
              </Box>
          </Box>
          </Paper>

          {/* 안전작업계획서 및 위험성 평가서 섹션 */}
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'text.primary' }}>
            {t('safetyWork.safetyPlanAndRiskDoc')}
          </Typography>
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
          {/* PC용 */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 160, minWidth: 160, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('safetyWork.safetyPlan')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {workFiles && workFiles.find(f => f.originalFilename.includes('계획')) ? (
                  workFiles.filter(f => f.originalFilename.includes('계획')).map(file => (
                    <Chip
                      key={file.id}
                      label={file.originalFilename}
                      size="small"
                      onClick={() => handleDownloadFile(file.id, file.originalFilename)}
                      icon={<DownloadIcon />}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))
                ) : (
                  <Typography fontSize="0.875rem" color="text.secondary">{t('safetyWork.noAttachedFiles')}</Typography>
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex' }}>
              <Typography sx={{ width: 160, minWidth: 160, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('safetyWork.riskAssessmentDoc')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {workFiles && workFiles.find(f => f.originalFilename.includes('평가')) ? (
                  workFiles.filter(f => f.originalFilename.includes('평가')).map(file => (
                    <Chip
                      key={file.id}
                      label={file.originalFilename}
                      size="small"
                      onClick={() => handleDownloadFile(file.id, file.originalFilename)}
                      icon={<DownloadIcon />}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))
                ) : (
                  <Typography fontSize="0.875rem" color="text.secondary">{t('safetyWork.noAttachedFiles')}</Typography>
                )}
              </Box>
            </Box>
          </Box>
          </Box>

          {/* 모바일용 */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('safetyWork.safetyPlan')}</Typography>
                <Box sx={{ px: 1.5, py: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {workFiles && workFiles.find(f => f.originalFilename.includes('계획')) ? (
                    workFiles.filter(f => f.originalFilename.includes('계획')).map(file => (
                      <Chip key={file.id} label={file.originalFilename} size="small" onClick={() => handleDownloadFile(file.id, file.originalFilename)} icon={<DownloadIcon />} sx={{ cursor: 'pointer' }} />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">{t('safetyWork.noAttachedFiles')}</Typography>
                  )}
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('safetyWork.riskAssessmentDoc')}</Typography>
                <Box sx={{ px: 1.5, py: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {workFiles && workFiles.find(f => f.originalFilename.includes('평가')) ? (
                    workFiles.filter(f => f.originalFilename.includes('평가')).map(file => (
                      <Chip key={file.id} label={file.originalFilename} size="small" onClick={() => handleDownloadFile(file.id, file.originalFilename)} icon={<DownloadIcon />} sx={{ cursor: 'pointer' }} />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">{t('safetyWork.noAttachedFiles')}</Typography>
                  )}
                </Box>
              </Box>
          </Box>
          </Paper>

          {/* 현장사진 섹션 (Detail) */}
          {detailPhotos && detailPhotos.length > 0 && (
            <>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3, mb: 2, color: 'text.primary' }}>
                {t('safetyWork.sitePhotos')}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
                {detailPhotos.map((photo) => (
                  <Box
                    key={photo.id}
                    sx={{ width: 100, height: 100, borderRadius: 1, overflow: 'hidden', border: 1, borderColor: 'divider', cursor: 'pointer' }}
                    onClick={async () => {
                      const res = await axiosInstance.get(`/files/${photo.id}`, { responseType: 'blob' })
                      const url = URL.createObjectURL(new Blob([res.data]))
                      setPhotoPreviewUrl(url)
                      setPhotoPreviewOpen(true)
                    }}
                  >
                    <Box
                      component="img"
                      src={`${axiosInstance.defaults.baseURL}/files/${photo.id}`}
                      alt={photo.originalFilename}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                ))}
              </Box>
            </>
          )}

          {/* Action Buttons */}
          {isAdmin && selectedWork && (
            <Box sx={{ display: 'flex', gap: 1, mb: 3, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
              {canApprove(selectedWork.status) && (
                <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => handleStatusUpdate('APPROVED')} disabled={statusMutation.isPending} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
                  {t('common.approve')}
                </Button>
              )}
              {canReject(selectedWork.status) && (
                <Button variant="contained" color="error" startIcon={<CancelIcon />} onClick={handleRejectClick} disabled={statusMutation.isPending} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
                  {t('common.reject')}
                </Button>
              )}
            </Box>
          )}

          {/* 버튼 영역 */}
          <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
            <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
              {t('common.list')}
            </Button>
            {(isSystemAdmin(user) || selectedWork?.authorName === user?.name) && selectedWork && (
              <>
                <Button
                  variant="contained"
                  onClick={() => handleEditClick(selectedWork)}
                  sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}
                >
                  {t('common.edit')}
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleDeleteClick}
                  sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}
                >
                  {t('common.delete')}
                </Button>
              </>
            )}
          </Box>
        </>
      ) : null
      }
    </Box>
  )

  const renderFormView = () => (
    <>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">
          {t(titleKey || 'safetyWork.pageTitle')}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'text.primary' }}>
          {t('safetyWork.workInfo')}
        </Typography>

        <input type="file" ref={planFileRef} onChange={(e) => handleFileSelect('plan', e)} style={{ display: 'none' }} />
        <input type="file" ref={riskFileRef} onChange={(e) => handleFileSelect('risk', e)} style={{ display: 'none' }} />

        {/* 작업 정보 - PC용 테이블 레이아웃 */}
        <Paper sx={{ p: { xs: 2, md: 3 }, bgcolor: 'grey.50', mb: 3 }}>
          {/* PC용 테이블 레이아웃 */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
            {/* Row 1: 작업명 | 작업기간 */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('safetyWork.workName')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                <Controller name="title" control={control} rules={{ required: t('safetyWork.enterWorkNameValidation') }} render={({ field, fieldState }) => (
                  <TextField {...field} size="small" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} placeholder={t('safetyWork.enterWorkName')} />
                )} />
              </Box>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('safetyWork.workPeriod')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Controller name="startDate" control={control} rules={{ required: t('safetyWork.selectStartDate') }} render={({ field }) => (
                  <DatePickerField value={field.value} onChange={field.onChange} placeholder={t('safetyWork.startDate')} size="small" />
                )} />
                <Typography>~</Typography>
                <Controller name="endDate" control={control} rules={{ required: t('safetyWork.selectEndDate') }} render={({ field }) => (
                  <DatePickerField value={field.value} onChange={field.onChange} placeholder={t('safetyWork.endDate')} size="small" />
                )} />
              </Box>
            </Box>
            {/* Row 2: 작업장소 | 협력업체 | 협력업체 담당자명 */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('safetyWork.location')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                <Controller name="location" control={control} rules={{ required: t('safetyWork.enterLocation') }} render={({ field, fieldState }) => (
                  <TextField {...field} size="small" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} placeholder={t('safetyWork.enterLocation')} />
                )} />
              </Box>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('safetyWork.partners')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                <Controller name="partners" control={control} render={({ field }) => (
                  <TextField {...field} size="small" fullWidth placeholder={t('safetyWork.enterPartners')} />
                )} />
              </Box>
              <Typography sx={{ width: 120, minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('safetyWork.partnersContactName')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }}>
                <Controller name="partnersName" control={control} render={({ field }) => (
                  <TextField {...field} size="small" fullWidth placeholder={t('safetyWork.enterPartnersContactName')} />
                )} />
              </Box>
            </Box>
            {/* Row 3: 담당자 | 담당팀 */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('safetyWork.manager')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                <Controller name="managerName" control={control} render={({ field }) => (
                  <TextField {...field} size="small" fullWidth InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} value={selectedManager ? getManagerDisplayName(selectedManager) : field.value} />
                )} />
                <Button variant="outlined" size="small" sx={{ ml: 1, minWidth: 40 }} onClick={() => setManagerModalOpen(true)}><PersonSearchIcon fontSize="small" /></Button>
              </Box>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('safetyWork.managerDept')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }}>
                <Controller name="managerDept" control={control} rules={{ required: t('safetyWork.enterManagerDeptValidation') }} render={({ field }) => (
                  <TextField {...field} size="small" fullWidth InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
                )} />
              </Box>
            </Box>
            {/* Row 4: 소속팀장 | 상태 */}
            <Box sx={{ display: 'flex' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('safetyWork.teamLeader')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                <TextField
                  size="small"
                  fullWidth
                  value={getTeamLeaderDisplayName(selectedTeamLeader)}
                  placeholder={t('common.selectFromOrg', '조직도에서 선택')}
                  InputProps={{ readOnly: true }}
                />
                <Button variant="outlined" size="small" sx={{ ml: 1, minWidth: 40 }} onClick={() => setTeamLeaderModalOpen(true)}><PersonSearchIcon fontSize="small" /></Button>
              </Box>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('common.status')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }}>
                <Chip
                  label={editingWork ? (swStatusLabels[editingWork.status] || t('safetyWork.initialDraft')) : t('safetyWork.initialDraft')}
                  color={editingWork ? ('default' as 'default' | 'info' | 'success' | 'primary' | 'error') : 'default'}
                  size="small"
                />
              </Box>
            </Box>
          </Box>

          {/* 모바일용 레이아웃 */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('safetyWork.workName')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
              </Typography>
              <Controller name="title" control={control} rules={{ required: t('safetyWork.enterWorkNameValidation') }} render={({ field, fieldState }) => (
                <TextField {...field} size="small" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} placeholder={t('safetyWork.enterWorkName')} />
              )} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('safetyWork.workPeriod')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Controller name="startDate" control={control} rules={{ required: t('safetyWork.selectStartDate') }} render={({ field }) => (
                  <DatePickerField value={field.value} onChange={field.onChange} placeholder={t('safetyWork.startDate')} size="small" />
                )} />
                <Typography>~</Typography>
                <Controller name="endDate" control={control} rules={{ required: t('safetyWork.selectEndDate') }} render={({ field }) => (
                  <DatePickerField value={field.value} onChange={field.onChange} placeholder={t('safetyWork.endDate')} size="small" />
                )} />
              </Box>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('safetyWork.location')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
              </Typography>
              <Controller name="location" control={control} rules={{ required: t('safetyWork.enterLocation') }} render={({ field, fieldState }) => (
                <TextField {...field} size="small" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} placeholder={t('safetyWork.enterLocation')} />
              )} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('safetyWork.partners')}</Typography>
              <Controller name="partners" control={control} render={({ field }) => (
                <TextField {...field} size="small" fullWidth placeholder={t('safetyWork.enterPartners')} />
              )} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('safetyWork.partnersContactName')}</Typography>
              <Controller name="partnersName" control={control} render={({ field }) => (
                <TextField {...field} size="small" fullWidth placeholder={t('safetyWork.enterPartnersContactName')} />
              )} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('safetyWork.manager')}</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Controller name="managerName" control={control} render={({ field }) => (
                  <TextField {...field} size="small" fullWidth InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} value={selectedManager ? getManagerDisplayName(selectedManager) : field.value} />
                )} />
                <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setManagerModalOpen(true)}><PersonSearchIcon fontSize="small" /></Button>
              </Box>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('safetyWork.managerDept')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
              </Typography>
              <Controller name="managerDept" control={control} rules={{ required: t('safetyWork.enterManagerDeptValidation') }} render={({ field }) => (
                <TextField {...field} size="small" fullWidth InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
              )} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                {t('safetyWork.teamLeader')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  value={getTeamLeaderDisplayName(selectedTeamLeader)}
                  placeholder={t('common.selectFromOrg', '조직도에서 선택')}
                  InputProps={{ readOnly: true }}
                />
                <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setTeamLeaderModalOpen(true)}><PersonSearchIcon fontSize="small" /></Button>
              </Box>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.status')}</Typography>
              <Chip
                label={editingWork ? (swStatusLabels[editingWork.status] || t('safetyWork.initialDraft')) : t('safetyWork.initialDraft')}
                color={editingWork ? ('default' as 'default' | 'info' | 'success' | 'primary' | 'error') : 'default'}
                size="small"
              />
            </Box>
          </Box>
        </Paper>

        {/* 안전작업계획서 및 위험성 평가서 테이블 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'text.primary' }}>
            {t('safetyWork.safetyPlanAndRiskDoc')}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={(e) => setTemplateMenuAnchor(e.currentTarget)}
          >
            {t('safetyWork.templateDownload')}
          </Button>
          <Menu
            anchorEl={templateMenuAnchor}
            open={Boolean(templateMenuAnchor)}
            onClose={() => setTemplateMenuAnchor(null)}
          >
            <MenuItem onClick={() => { handleDownloadTemplate('plan'); setTemplateMenuAnchor(null); }}>
              {t('safetyWork.safetyPlan')}
            </MenuItem>
            <MenuItem onClick={() => { handleDownloadTemplate('risk'); setTemplateMenuAnchor(null); }}>
              {t('safetyWork.riskAssessmentDoc')}
            </MenuItem>
          </Menu>
        </Box>
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
          {/* 안전작업계획서 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={{ width: { xs: 120, md: 160 }, minWidth: { xs: 120, md: 160 }, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', wordBreak: 'keep-all' }}>
              {t('safetyWork.safetyPlan')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {planFile ? (
                <Chip label={planFile.name} onDelete={() => setPlanFile(null)} size="small" icon={<InsertDriveFileIcon />} />
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                  onClick={() => planFileRef.current?.click()}
                >
                  {t('safetyWork.attachFile')}
                </Typography>
              )}
            </Box>
          </Box>
          {/* 위험성 평가서 */}
          <Box sx={{ display: 'flex' }}>
            <Typography sx={{ width: { xs: 120, md: 160 }, minWidth: { xs: 120, md: 160 }, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', wordBreak: 'keep-all' }}>
              {t('safetyWork.riskAssessmentDoc')}
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {riskFile ? (
                <Chip label={riskFile.name} onDelete={() => setRiskFile(null)} size="small" icon={<InsertDriveFileIcon />} />
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                  onClick={() => riskFileRef.current?.click()}
                >
                  {t('safetyWork.attachFile')}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* 현장사진 */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'text.primary' }}>
          {t('safetyWork.sitePhotos')}
        </Typography>
        <input type="file" ref={photoFileRef} accept="image/*" multiple onChange={handlePhotoSelect} style={{ display: 'none' }} />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
          {/* Existing photos */}
          {existingPhotos
            .filter((p) => !deletedPhotoIds.includes(p.id))
            .map((photo) => (
              <Box
                key={photo.id}
                sx={{ position: 'relative', width: 100, height: 100, borderRadius: 1, overflow: 'hidden', border: 1, borderColor: 'divider', cursor: 'pointer' }}
                onClick={async () => {
                  const res = await axiosInstance.get(`/files/${photo.id}`, { responseType: 'blob' })
                  const url = URL.createObjectURL(new Blob([res.data]))
                  setPhotoPreviewUrl(url)
                  setPhotoPreviewOpen(true)
                }}
              >
                <Box
                  component="img"
                  src={`${axiosInstance.defaults.baseURL}/files/${photo.id}`}
                  alt={photo.originalFilename}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <IconButton
                  size="small"
                  sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }, p: 0.25 }}
                  onClick={(e) => { e.stopPropagation(); handleRemoveExistingPhoto(photo.id) }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            ))}
          {/* Pending photos */}
          {pendingPhotoUrls.map((url, idx) => (
            <Box
              key={`pending-${idx}`}
              sx={{ position: 'relative', width: 100, height: 100, borderRadius: 1, overflow: 'hidden', border: 1, borderColor: 'divider', cursor: 'pointer' }}
              onClick={() => { setPhotoPreviewUrl(url); setPhotoPreviewOpen(true) }}
            >
              <Box component="img" src={url} alt={`photo-${idx}`} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <IconButton
                size="small"
                sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }, p: 0.25 }}
                onClick={(e) => { e.stopPropagation(); handleRemovePendingPhoto(idx) }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          ))}
          {/* Add button */}
          {(existingPhotos.filter((p) => !deletedPhotoIds.includes(p.id)).length + pendingPhotos.length) < 10 && (
            <Box
              sx={{ width: 100, height: 100, borderRadius: 1, border: '2px dashed', borderColor: 'divider', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' } }}
              onClick={() => photoFileRef.current?.click()}
            >
              <AddPhotoAlternateIcon sx={{ fontSize: 28, color: 'grey.500' }} />
              <Typography variant="caption" color="text.secondary">+</Typography>
            </Box>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
          {t('safetyWork.maxPhotos')}
        </Typography>

        {/* Form Actions */}
        <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }} onClick={viewMode === 'edit' && editingWork ? () => {
            setSelectedWork(editingWork)
            setViewMode('detail')
            setEditingWork(null)
          } : handleBackToList}>
            {viewMode === 'edit' ? t('common.cancel') : t('common.list')}
          </Button>
          <Button type="submit" variant="contained" disabled={createMutation.isPending || updateMutation.isPending} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
            {createMutation.isPending || updateMutation.isPending ? <CircularProgress size={20} /> : t('common.save')}
          </Button>
        </Box>
      </form>
    </>
  )

  // ===== Main Render =====

  if (isLoading && viewMode === 'list') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error && viewMode === 'list') {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{t('safetyWork.loadError')}</Alert>
      </Box>
    )
  }

  return (
    <Box>
      {viewMode === 'list' && renderListView()}
      {viewMode === 'detail' && renderDetailView()}
      {(viewMode === 'create' || viewMode === 'edit') && renderFormView()}

      {/* Reject Dialog (confirmation - keep as modal) */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { mx: { xs: 1, sm: 2 } } }}>
        <DialogTitle>{t('safetyWork.rejectReasonInput')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label={t('safetyWork.rejectReason')}
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setRejectDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" color="error" onClick={handleRejectConfirm} disabled={statusMutation.isPending}>
            {statusMutation.isPending ? <CircularProgress size={20} /> : t('common.reject')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Team Leader Select Modal */}
      <UserSelectModal
        open={teamLeaderModalOpen}
        onClose={() => setTeamLeaderModalOpen(false)}
        selectedUsers={selectedTeamLeader ? [{
          id: selectedTeamLeader.id,
          username: selectedTeamLeader.username,
          email: selectedTeamLeader.email,
          name: selectedTeamLeader.name,
          department: selectedTeamLeader.department,
          company: selectedTeamLeader.company,
          role: selectedTeamLeader.role,
        }] : []}
        onConfirm={handleTeamLeaderConfirm}
        title={t('safetyWork.selectTeamLeader')}
        singleSelect
        useCompanyTree
      />

      {/* Manager Select Modal */}
      <UserSelectModal
        open={managerModalOpen}
        onClose={() => setManagerModalOpen(false)}
        selectedUsers={[]}
        onConfirm={handleManagerConfirm}
        title={t('safetyWork.selectManager')}
        singleSelect
        useCompanyTree
      />

      {/* Photo Preview Dialog */}
      <Dialog open={photoPreviewOpen} onClose={() => { setPhotoPreviewOpen(false); if (photoPreviewUrl.startsWith('blob:') && !pendingPhotoUrls.includes(photoPreviewUrl)) URL.revokeObjectURL(photoPreviewUrl); setPhotoPreviewUrl('') }} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Box component="img" src={photoPreviewUrl} alt="preview" sx={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => { setPhotoPreviewOpen(false); if (photoPreviewUrl.startsWith('blob:') && !pendingPhotoUrls.includes(photoPreviewUrl)) URL.revokeObjectURL(photoPreviewUrl); setPhotoPreviewUrl('') }}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  )
}

export default SafetyWorkPage
