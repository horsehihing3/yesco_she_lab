import { useState, useRef, useEffect } from 'react'
import { formatUserName } from '../../utils/userDisplay'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  TextField,
  InputAdornment,
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
  Chip,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'
import axiosInstance from '../../api/axiosInstance'
import { EhsAlert, EhsAlertRequest } from '../../types/ehsAlert.types'
import { ApiResponse, PageResponse, FileMetadata } from '../../types/common.types'
import HtmlContent from '../common/HtmlContent'
import RichTextEditor from '../common/RichTextEditor'
import LoadingOverlay from '../common/LoadingOverlay'
import EhsAlertCommentsSection from './EhsAlertCommentsSection'
import DevTestFillButton from '../common/DevTestFillButton'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

interface FetchParams {
  page: number
  size: number
  title?: string
}

const fetchAlerts = async (params: FetchParams): Promise<PageResponse<EhsAlert>> => {
  const { page, size, title } = params
  let url = '/alerts'
  const queryParams = new URLSearchParams()
  queryParams.append('page', String(page))
  queryParams.append('size', String(size))

  if (title) {
    url = '/alerts/search'
    queryParams.append('title', title)
  }

  const response = await axiosInstance.get<ApiResponse<PageResponse<EhsAlert>>>(`${url}?${queryParams.toString()}`)
  return response.data.data
}

const fetchAlertDetail = async (id: number): Promise<EhsAlert> => {
  const response = await axiosInstance.get<ApiResponse<EhsAlert>>(`/alerts/${id}`)
  return response.data.data
}

const fetchFiles = async (entityType: string, entityId: string): Promise<FileMetadata[]> => {
  const response = await axiosInstance.get<ApiResponse<FileMetadata[]>>(`/files/by-entity/${entityType}/${entityId}`)
  return response.data.data
}

const createAlert = async (data: EhsAlertRequest): Promise<EhsAlert> => {
  const response = await axiosInstance.post<ApiResponse<EhsAlert>>('/alerts', data)
  return response.data.data
}

const updateAlert = async ({ id, data }: { id: number; data: EhsAlertRequest }): Promise<EhsAlert> => {
  const response = await axiosInstance.put<ApiResponse<EhsAlert>>(`/alerts/${id}`, data)
  return response.data.data
}

const deleteAlert = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/alerts/${id}`)
}

const EhsAlertTab: React.FC = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { showWarning, showSuccess, showConfirm } = useAlert()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedAlert, setSelectedAlert] = useState<EhsAlert | null>(null)

  // List filters
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const rowsPerPage = 10

  // Form state
  const [formData, setFormData] = useState<EhsAlertRequest>({
    title: '',
    detail: '',
    authorName: '',
  })
  const [pendingFiles, setPendingFiles] = useState<File[]>([])

  const { canSee } = useButtonRules()
  const MENU = 'SHE 경영 › 커뮤니케이션 › SHE 알림'
  const myRoles: string[] = ['guest', ...(user?.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : (user?.role ? [user.role] : []))]
  const canNew  = canSee(MENU, 'LIST', 'New', myRoles)
  const getDetailRoles = (item: { authorName?: string } | null | undefined): string[] =>
    [...myRoles, ...(item?.authorName === user?.name ? ['writer'] : [])]

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: ['ehsAlerts', page, searchQuery],
    queryFn: () =>
      fetchAlerts({
        page,
        size: rowsPerPage,
        title: searchQuery || undefined,
      }),
    enabled: viewMode === 'list',
  })

  const { data: alertDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['ehsAlertDetail', selectedAlert?.id],
    queryFn: () => fetchAlertDetail(selectedAlert!.id),
    enabled: !!selectedAlert?.id && (viewMode === 'detail' || viewMode === 'edit'),
  })

  const { data: alertFiles } = useQuery({
    queryKey: ['ehsAlertFiles', selectedAlert?.alertId],
    queryFn: () => fetchFiles('EHS_ALERT', selectedAlert!.alertId),
    enabled: !!selectedAlert?.alertId && viewMode === 'detail',
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: createAlert,
    onSuccess: async (createdAlert) => {
      for (const file of pendingFiles) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('entityType', 'EHS_ALERT')
        fd.append('entityId', createdAlert.alertId)
        await axiosInstance.post('/files/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      queryClient.invalidateQueries({ queryKey: ['ehsAlerts'] })
      await showSuccess(t('common.saveSuccess'))
      handleBackToList()
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateAlert,
    onSuccess: async (updatedAlert) => {
      for (const file of pendingFiles) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('entityType', 'EHS_ALERT')
        fd.append('entityId', updatedAlert.alertId)
        await axiosInstance.post('/files/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      queryClient.invalidateQueries({ queryKey: ['ehsAlerts'] })
      queryClient.invalidateQueries({ queryKey: ['ehsAlertDetail'] })
      await showSuccess(t('common.saveSuccess'))
      handleBackToList()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAlert,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['ehsAlerts'] })
      await showSuccess(t('common.deleteSuccess'))
      handleBackToList()
    },
  })

  const isProcessing = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  // URL parameter handling for alertId
  useEffect(() => {
    const alertId = searchParams.get('alertId')
    if (alertId && data?.content) {
      const alert = data.content.find((a) => a.id === parseInt(alertId, 10))
      if (alert) {
        setSelectedAlert(alert)
        setViewMode('detail')
      }
    }
  }, [searchParams, data])

  // Cancel edit mode when language changes
  useEffect(() => {
    if (viewMode === 'edit') {
      setViewMode('detail')
      setFormData({
        title: '',
        detail: '',
        authorName: '',
      })
      setPendingFiles([])
    }
  }, [i18n.language])

  // Handlers
  const handleBackToList = () => {
    setViewMode('list')
    setSelectedAlert(null)
    setFormData({
      title: '',
      detail: '',
      authorName: '',
    })
    setPendingFiles([])
    // Remove alertId from URL
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('alertId')
    setSearchParams(newParams)
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

  const handleRowClick = (alert: EhsAlert) => {
    setSelectedAlert(alert)
    setViewMode('detail')
    setSearchParams({ tab: '4', alertId: String(alert.id) })
  }

  const handleAddClick = () => {
    setSelectedAlert(null)
    setFormData({
      title: '',
      detail: '',
      authorName: '',
    })
    setPendingFiles([])
    setViewMode('create')
  }

  const handleEditClick = () => {
    if (!alertDetail) return
    setFormData({
      title: alertDetail.title || '',
      detail: alertDetail.detail || '',
      authorName: alertDetail.authorName || '',
    })
    setPendingFiles([])
    setViewMode('edit')
  }

  const handleDeleteClick = async () => {
    if (!selectedAlert) return
    const confirmed = await showConfirm(
      `${t('common.confirmDeleteMessage')}\n${t('common.deleteWarning')}`,
      { title: `${t('ehs.ehsAlert')} ${t('common.delete')}` }
    )
    if (confirmed) {
      deleteMutation.mutate(selectedAlert.id)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
    if (files) {
      const validFiles: File[] = []
      const oversizedFiles: string[] = []
      Array.from(files).forEach((file) => {
        if (file.size > MAX_FILE_SIZE) {
          oversizedFiles.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`)
        } else {
          validFiles.push(file)
        }
      })
      if (oversizedFiles.length > 0) {
        showWarning(`${t('common.fileSizeExceeded')}\n${oversizedFiles.join('\n')}`)
      }
      if (pendingFiles.length + validFiles.length <= 5) {
        setPendingFiles((prev) => [...prev, ...validFiles])
      } else {
        showWarning(t('common.maxAttachments'))
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
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

  // DEV ONLY — 비어있는 항목을 SHE 알림 더미데이터로 채움 (입력값 보존)
  const fillTestData = () => {
    setFormData(prev => ({
      ...prev,
      title: prev.title || '[안전알림] 동절기 결빙 구간 미끄럼 주의',
      detail: prev.detail || '<p>최근 기온 급강하로 옥외 통로 결빙이 우려됩니다. 이동 시 보행로 결빙 구간을 확인하고 미끄럼에 주의해 주시기 바랍니다. (테스트 데이터)</p>',
    }))
  }

  const handleSubmit = async () => {
    if (!formData.title) {
      showWarning(t('common.enterTitle'))
      return
    }

    const confirmed = await showConfirm(t('common.confirmSave'))
    if (!confirmed) return

    // Get source language from current site language
    const currentLang = i18n.language
    const sourceLang = currentLang === 'zh' ? 'zh' : currentLang === 'en' ? 'en' : 'ko'
    // Set author info from logged-in user
    const dataWithLang = {
      ...formData,
      authorName: user?.name || formData.authorName,
      authorDept: user?.department || formData.authorDept,
      authorPosition: user?.position || formData.authorPosition,
      authorEmail: user?.email || formData.authorEmail,
      authorCompany: user?.company || formData.authorCompany,
      sourceLang,
    }

    if (viewMode === 'create') {
      createMutation.mutate(dataWithLang)
    } else if (viewMode === 'edit' && selectedAlert) {
      updateMutation.mutate({ id: selectedAlert.id, data: dataWithLang })
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  const alerts = data?.content || []
  const totalPages = data?.totalPages || 0

  // ===== Render Functions =====

  const renderListView = () => (
    <>
      {/* Filters - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder={t('common.searchByTitle')}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ width: 300 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleSearch}>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <IconButton onClick={handleReset} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>
        {canNew && (
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick}>
            New
          </Button>
        )}
      </Box>

      {/* Filters - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, mb: 2 }}>
        <TextField
          size="small"
          placeholder={t('common.searchByTitle')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleSearch}>
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" onClick={handleReset} startIcon={<RefreshIcon />} sx={{ flex: 1 }}>{t('common.reset')}</Button>
          {canNew && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick} sx={{ flex: 1 }}>New</Button>
          )}
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
              <TableCell sx={{ fontWeight: 'bold', width: 150, borderRight: 1, borderColor: 'divider' }} align="center">
                {t('common.author')}
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 180, borderRight: 1, borderColor: 'divider' }} align="center">
                {t('common.createdAt')}
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 80 }} align="center">
                {t('common.views')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">{t('ehsAlert.noAlerts')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              alerts.map((alert) => (
                <TableRow key={alert.id} hover onClick={() => handleRowClick(alert)} sx={{ cursor: 'pointer' }}>
                  <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{alert.title}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{alert.authorName || ''}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{formatDate(alert.createdAt)}</TableCell>
                  <TableCell align="center">{alert.views}</TableCell>
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
            <Typography color="text.secondary">{t('ehsAlert.noAlerts')}</Typography>
          </Paper>
        ) : (
          alerts.map((alert) => (
            <Paper key={alert.id} sx={{ p: 2, cursor: 'pointer', border: 1, borderColor: 'divider' }} onClick={() => handleRowClick(alert)}>
              <Typography fontWeight="bold" sx={{ mb: 1 }}>{alert.title}</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 50 }}>{t('common.author')}</Typography>
                  <Typography variant="body2">{alert.authorName || ''}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 50 }}>{t('common.createdAt')}</Typography>
                  <Typography variant="body2">{formatDate(alert.createdAt)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 50 }}>{t('common.views')}</Typography>
                  <Typography variant="body2">{alert.views}</Typography>
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

  const renderDetailView = () => (
    <>
      {detailLoading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : alertDetail ? (
        <>
          {/* PC용 레이아웃 */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
                <Typography sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('common.title')}</Typography>
                <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem' }}>{alertDetail.title}</Typography>
              </Box>
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
                <Typography sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('common.author')}</Typography>
                <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem' }}>{formatUserName(alertDetail.authorDept, alertDetail.authorName, alertDetail.authorPosition) || ''}</Typography>
              </Box>
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
                <Typography sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, minHeight: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', fontSize: '0.875rem', wordBreak: 'keep-all', textAlign: 'center' }}>
                  {t('common.body')}
                </Typography>
                <Box sx={{ flex: 1, px: 2, py: 1.5, minHeight: 200, bgcolor: 'background.paper' }}>
                  <HtmlContent content={alertDetail.detail} fallback="" />
                </Box>
              </Box>
              <Box sx={{ display: 'flex' }}>
                <Typography sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('common.attachments')}</Typography>
                <Box sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper' }}>
                  {alertFiles && alertFiles.length > 0 ? (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {alertFiles.map((file) => (
                        <Chip
                          key={file.id}
                          label={file.originalFilename}
                          size="small"
                          onClick={() => handleDownloadFile(file.id, file.originalFilename)}
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography color="text.secondary">{t('common.noFile')}</Typography>
                  )}
                </Box>
              </Box>
            </Box>

            {/* 댓글 영역 */}
            {alertDetail.id && <EhsAlertCommentsSection alertId={alertDetail.id} />}

            {/* Action Buttons - PDF 페이지 11 하단 */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
              <Button variant="outlined" onClick={handleBackToList} sx={{ width: 'auto' }}>{t('common.backToList')}</Button>
              {canSee(MENU, 'DETAIL', '수정', getDetailRoles(alertDetail)) && <Button variant="contained" onClick={handleEditClick} sx={{ width: 'auto' }}>{t('common.edit')}</Button>}
              {canSee(MENU, 'DETAIL', '삭제', getDetailRoles(alertDetail)) && <Button variant="contained" color="error" onClick={handleDeleteClick} sx={{ width: 'auto' }}>{t('common.delete')}</Button>}
            </Box>
          </Box>

          {/* 모바일용 레이아웃 */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.title')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{alertDetail.title}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.author')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{formatUserName(alertDetail.authorDept, alertDetail.authorName, alertDetail.authorPosition) || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.body')}</Typography>
                <Box sx={{ px: 1.5, py: 0.5, minHeight: 100 }}>
                  <HtmlContent content={alertDetail.detail} fallback="" />
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.attachments')}</Typography>
                <Box sx={{ px: 1.5, py: 0.5 }}>
                  {alertFiles && alertFiles.length > 0 ? (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {alertFiles.map((file) => (
                        <Chip
                          key={file.id}
                          label={file.originalFilename}
                          size="small"
                          onClick={() => handleDownloadFile(file.id, file.originalFilename)}
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">{t('common.noFile')}</Typography>
                  )}
                </Box>
              </Box>
            </Box>

            {/* 댓글 영역 */}
            {alertDetail.id && <EhsAlertCommentsSection alertId={alertDetail.id} />}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
              <Button variant="outlined" onClick={handleBackToList} sx={{ flex: 1 }}>{t('common.backToList')}</Button>
              {canSee(MENU, 'DETAIL', '수정', getDetailRoles(alertDetail)) && <Button variant="contained" onClick={handleEditClick} sx={{ flex: 1 }}>{t('common.edit')}</Button>}
              {canSee(MENU, 'DETAIL', '삭제', getDetailRoles(alertDetail)) && <Button variant="contained" color="error" onClick={handleDeleteClick} sx={{ flex: 1 }}>{t('common.delete')}</Button>}
            </Box>
          </Box>
        </>
      ) : null}
    </>
  )

  const renderFormView = () => (
    <>
      <Paper sx={{ p: { xs: 2, md: 3 }, bgcolor: 'grey.50' }}>
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple style={{ display: 'none' }} />

        {/* PC용 테이블 레이아웃 */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          {/* Row 1: 제목 | 작성자 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
              {t('common.title')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
              <TextField
                fullWidth
                size="small"
                placeholder={t('common.enterTitle')}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Box>
            <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
              {t('common.author')}
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }}>
              <Typography>{formatUserName(user?.department, user?.name, user?.position) || formData.authorName || ''}</Typography>
            </Box>
          </Box>

          {/* Row 2: 본문 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', alignItems: 'flex-start', fontSize: '0.875rem', justifyContent: 'center', pt: 2, wordBreak: 'keep-all', textAlign: 'center' }}>
              {t('common.body')}
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
              <RichTextEditor
                value={formData.detail || ''}
                onChange={(value) => setFormData({ ...formData, detail: value })}
                placeholder={t('common.enterContent')}
                minHeight={200}
              />
            </Box>
          </Box>

          {/* Row 3: 파일첨부 */}
          <Box sx={{ display: 'flex' }}>
            <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
              {t('common.attachments')}
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {pendingFiles.length === 0 ? (
                <Typography color="text.secondary">{t('common.noFile')}</Typography>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {pendingFiles.map((file, idx) => (
                    <Chip key={idx} label={file.name} size="small" onDelete={() => handleRemovePendingFile(idx)} />
                  ))}
                </Box>
              )}
              <Button variant="outlined" size="small" startIcon={<AttachFileIcon />} onClick={() => fileInputRef.current?.click()}>
                {t('common.attach')}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* 모바일용 레이아웃 */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
              {t('common.title')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder={t('common.enterTitle')}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.author')}</Typography>
            <Typography sx={{ px: 1.5, py: 0.5 }}>{formatUserName(user?.department, user?.name, user?.position) || formData.authorName || ''}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.body')}</Typography>
            <RichTextEditor
              value={formData.detail || ''}
              onChange={(value) => setFormData({ ...formData, detail: value })}
              placeholder={t('common.enterContent')}
              minHeight={200}
            />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.attachments')}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', px: 1.5, py: 0.5 }}>
              {pendingFiles.length === 0 ? (
                <Typography color="text.secondary">{t('common.noFile')}</Typography>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {pendingFiles.map((file, idx) => (
                    <Chip key={idx} label={file.name} size="small" onDelete={() => handleRemovePendingFile(idx)} />
                  ))}
                </Box>
              )}
              <Button variant="outlined" size="small" startIcon={<AttachFileIcon />} onClick={() => fileInputRef.current?.click()}>
                {t('common.attach')}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Form Actions - PDF 페이지 10 하단 */}
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, gap: 1, mt: 3 }}>
          {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
          <Button variant="outlined" onClick={viewMode === 'edit' ? () => setViewMode('detail') : handleBackToList} sx={{ flex: { xs: 1, sm: 'none' } }}>
            {viewMode === 'edit' ? t('common.cancel') : t('common.backToList')}
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={isProcessing} sx={{ flex: { xs: 1, sm: 'none' } }}>
            {viewMode === 'edit' ? t('common.save') : t('common.register')}
          </Button>
        </Box>
      </Paper>
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

    </Box>
  )
}

export default EhsAlertTab
