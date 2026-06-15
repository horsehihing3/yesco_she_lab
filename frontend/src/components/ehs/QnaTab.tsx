import { useState, useRef, useEffect } from 'react'
import { formatUserName } from '../../utils/userDisplay'
import { useSearchParams } from 'react-router-dom'
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
  Chip,
  MenuItem,
  Select,
  FormControl,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import ListSearchBar from '../common/ListSearchBar'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'
import axiosInstance from '../../api/axiosInstance'
import { QnaPost, QnaPostRequest, QnaAnswerRequest } from '../../types/qna.types'
import { ApiResponse, PageResponse, FileMetadata } from '../../types/common.types'
import HtmlContent from '../common/HtmlContent'
import RichTextEditor from '../common/RichTextEditor'
import LoadingOverlay from '../common/LoadingOverlay'
import EntityCommentsSection from '../common/EntityCommentsSection'
import DevTestFillButton from '../common/DevTestFillButton'
import useCodeMap from '../../hooks/useCodeMap'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const categoryColorMap: Record<string, 'default' | 'error' | 'success' | 'info'> = {
  GENERAL: 'default',
  SAFETY: 'error',
  ENVIRONMENT: 'success',
  HEALTH: 'info',
}

// API functions
const fetchQnaPosts = async (params: { page: number; size: number; title?: string; category?: string }): Promise<PageResponse<QnaPost>> => {
  const { page, size, title, category } = params
  let url = '/qna'
  const queryParams = new URLSearchParams()
  queryParams.append('page', String(page))
  queryParams.append('size', String(size))
  if (title) {
    url = '/qna/search'
    queryParams.append('title', title)
  } else if (category) {
    url = `/qna/category/${category}`
  }
  const response = await axiosInstance.get<ApiResponse<PageResponse<QnaPost>>>(`${url}?${queryParams.toString()}`)
  return response.data.data
}

const fetchQnaDetail = async (id: number): Promise<QnaPost> => {
  const response = await axiosInstance.get<ApiResponse<QnaPost>>(`/qna/${id}`)
  return response.data.data
}

const fetchFiles = async (entityType: string, entityId: string): Promise<FileMetadata[]> => {
  const response = await axiosInstance.get<ApiResponse<FileMetadata[]>>(`/files/by-entity/${entityType}/${entityId}`)
  return response.data.data
}

const createQna = async (data: QnaPostRequest): Promise<QnaPost> => {
  const response = await axiosInstance.post<ApiResponse<QnaPost>>('/qna', data)
  return response.data.data
}

const updateQna = async ({ id, data }: { id: number; data: QnaPostRequest }): Promise<QnaPost> => {
  const response = await axiosInstance.put<ApiResponse<QnaPost>>(`/qna/${id}`, data)
  return response.data.data
}

const submitAnswer = async ({ id, data }: { id: number; data: QnaAnswerRequest }): Promise<QnaPost> => {
  const response = await axiosInstance.put<ApiResponse<QnaPost>>(`/qna/${id}/answer`, data)
  return response.data.data
}

const deleteQna = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/qna/${id}`)
}

const QnaTab: React.FC = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { showWarning, showSuccess, showConfirm } = useAlert()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const { codeList: categoryCodes, getLabel: getCategoryLabel } = useCodeMap('QNA_CATEGORY')

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedPost, setSelectedPost] = useState<QnaPost | null>(null)

  // List filters
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(0)
  const rowsPerPage = 10

  // Form state
  const [formData, setFormData] = useState<QnaPostRequest>({
    title: '',
    content: '',
    category: 'GENERAL',
    isPublic: true,
  })
  const [pendingFiles, setPendingFiles] = useState<File[]>([])

  // Answer state
  const [answerText, setAnswerText] = useState('')
  const [showAnswerEditor, setShowAnswerEditor] = useState(false)

  const isQnaAdmin = user?.role === 'SYSTEM_ADMIN' || user?.role === 'QNA_ADMIN'
  const isAuthor = (post: QnaPost | null) => post?.authorEmail === user?.email
  const { canSee } = useButtonRules()
  const MENU = 'EHS 경영 › 커뮤니케이션 › Q&A'
  const listRoles: string[] = ['guest', ...(user?.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : [user?.role ?? ''].filter(Boolean))]
  const getDetailRoles = (post: QnaPost | null): string[] => [
    'guest',
    ...(user?.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : [user?.role ?? ''].filter(Boolean)),
    ...(isAuthor(post) ? ['writer'] : []),
  ]
  const canNew = canSee(MENU, 'LIST', 'New', listRoles)

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: ['qnaPosts', page, searchQuery, categoryFilter],
    queryFn: () =>
      fetchQnaPosts({
        page,
        size: rowsPerPage,
        title: searchQuery || undefined,
        category: categoryFilter || undefined,
      }),
    enabled: viewMode === 'list',
  })

  const { data: postDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['qnaDetail', selectedPost?.id],
    queryFn: () => fetchQnaDetail(selectedPost!.id),
    enabled: !!selectedPost?.id && (viewMode === 'detail' || viewMode === 'edit'),
  })

  const { data: postFiles } = useQuery({
    queryKey: ['qnaFiles', selectedPost?.id],
    queryFn: () => fetchFiles('QNA', String(selectedPost!.id)),
    enabled: !!selectedPost?.id && viewMode === 'detail',
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: createQna,
    onSuccess: async (createdPost) => {
      for (const file of pendingFiles) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('entityType', 'QNA')
        fd.append('entityId', String(createdPost.id))
        await axiosInstance.post('/files/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      queryClient.invalidateQueries({ queryKey: ['qnaPosts'] })
      await showSuccess(t('common.saveSuccess'))
      handleBackToList()
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateQna,
    onSuccess: async (updatedPost) => {
      for (const file of pendingFiles) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('entityType', 'QNA')
        fd.append('entityId', String(updatedPost.id))
        await axiosInstance.post('/files/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      queryClient.invalidateQueries({ queryKey: ['qnaPosts'] })
      queryClient.invalidateQueries({ queryKey: ['qnaDetail'] })
      await showSuccess(t('common.saveSuccess'))
      handleBackToList()
    },
  })

  const answerMutation = useMutation({
    mutationFn: submitAnswer,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['qnaPosts'] })
      queryClient.invalidateQueries({ queryKey: ['qnaDetail'] })
      await showSuccess(t('common.saveSuccess'))
      setShowAnswerEditor(false)
      setAnswerText('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteQna,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['qnaPosts'] })
      await showSuccess(t('common.deleteSuccess'))
      handleBackToList()
    },
  })

  const isProcessing = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || answerMutation.isPending

  // URL parameter handling
  useEffect(() => {
    const qnaId = searchParams.get('qnaId')
    if (qnaId && data?.content) {
      const post = data.content.find((p) => p.id === parseInt(qnaId, 10))
      if (post) {
        setSelectedPost(post)
        setViewMode('detail')
      }
    }
  }, [searchParams, data])

  // Cancel edit mode when language changes
  useEffect(() => {
    if (viewMode === 'edit') {
      setViewMode('detail')
      setFormData({ title: '', content: '', category: 'GENERAL', isPublic: true })
      setPendingFiles([])
    }
  }, [i18n.language])

  // Handlers
  const handleBackToList = () => {
    setViewMode('list')
    setSelectedPost(null)
    setFormData({ title: '', content: '', category: 'GENERAL', isPublic: true })
    setPendingFiles([])
    setShowAnswerEditor(false)
    setAnswerText('')
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('qnaId')
    setSearchParams(newParams)
  }

  const handleReset = () => {
    setSearchText('')
    setSearchQuery('')
    setCategoryFilter('')
    setPage(0)
  }

  const handleSearch = () => {
    setSearchQuery(searchText)
    setPage(0)
  }

  const handleRowClick = (post: QnaPost) => {
    setSelectedPost(post)
    setViewMode('detail')
    setSearchParams({ tab: '7', qnaId: String(post.id) })
  }

  const handleAddClick = () => {
    setSelectedPost(null)
    setFormData({ title: '', content: '', category: 'GENERAL', isPublic: true })
    setPendingFiles([])
    setViewMode('create')
  }

  const handleEditClick = () => {
    if (!postDetail) return
    setFormData({
      title: postDetail.title || '',
      content: postDetail.content || '',
      category: postDetail.category || 'GENERAL',
      isPublic: postDetail.isPublic ?? true,
    })
    setPendingFiles([])
    setViewMode('edit')
  }

  const handleDeleteClick = async () => {
    if (!selectedPost) return
    const confirmed = await showConfirm(
      `${t('common.confirmDeleteMessage')}\n${t('common.deleteWarning')}`,
      { title: `Q&A ${t('common.delete')}` }
    )
    if (confirmed) {
      deleteMutation.mutate(selectedPost.id)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    const MAX_FILE_SIZE = 100 * 1024 * 1024
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

  // DEV ONLY — 비어있는 항목을 Q&A 더미데이터로 채움 (입력값 보존)
  const fillTestData = () => {
    setFormData(prev => ({
      ...prev,
      title: prev.title || '특수건강검진 대상자 선정 기준 문의',
      content: prev.content || '<p>소음 작업 부서의 특수건강검진 대상자 선정 기준이 궁금합니다. 주 몇 시간 이상 노출 시 대상이 되는지 안내 부탁드립니다. (테스트 데이터)</p>',
      category: prev.category || 'SAFETY',
    }))
  }

  const handleSubmit = async () => {
    if (!formData.title) {
      showWarning(t('common.enterTitle'))
      return
    }

    const confirmed = await showConfirm(t('common.confirmSave'))
    if (!confirmed) return

    const dataWithAuthor = {
      ...formData,
      authorName: user?.name || formData.authorName,
      authorDept: user?.department || formData.authorDept,
      authorPosition: user?.position || formData.authorPosition,
      authorEmail: user?.email || formData.authorEmail,
    }

    if (viewMode === 'create') {
      createMutation.mutate(dataWithAuthor)
    } else if (viewMode === 'edit' && selectedPost) {
      updateMutation.mutate({ id: selectedPost.id, data: dataWithAuthor })
    }
  }

  const handleAnswerSubmit = async () => {
    if (!answerText || !selectedPost) {
      showWarning(t('common.enterContent'))
      return
    }

    const confirmed = await showConfirm(t('common.confirmSave'))
    if (!confirmed) return

    answerMutation.mutate({
      id: selectedPost.id,
      data: {
        answer: answerText,
        answerAuthorName: user?.name || '',
        answerAuthorDept: user?.department || '',
      },
    })
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  const posts = data?.content || []
  const totalPages = data?.totalPages || 0

  // ===== Render Functions =====

  const renderListView = () => (
    <>
      {/* Filters - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ListSearchBar
            placeholder={t('common.searchByTitle')}
            value={searchText}
            onChange={setSearchText}
            onSearch={handleSearch}
            sx={{ width: 300 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={categoryFilter}
              displayEmpty
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(0) }}
            >
              <MenuItem value="">{t('qna.category')}</MenuItem>
              {categoryCodes.map((cat) => (
                <MenuItem key={cat.code} value={cat.code}>{getCategoryLabel(cat.code)}</MenuItem>
              ))}
            </Select>
          </FormControl>
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
        <ListSearchBar
          placeholder={t('common.searchByTitle')}
          value={searchText}
          onChange={setSearchText}
          onSearch={handleSearch}
          fullWidth
        />
        <FormControl size="small" fullWidth>
          <Select
            value={categoryFilter}
            displayEmpty
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(0) }}
          >
            <MenuItem value="">{t('qna.category')}</MenuItem>
            {categoryCodes.map((cat) => (
              <MenuItem key={cat.code} value={cat.code}>{getCategoryLabel(cat.code)}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" onClick={handleReset} startIcon={<RefreshIcon />} sx={{ flex: 1 }}>{t('common.reset')}</Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick} sx={{ flex: 1 }}>New</Button>
        </Box>
      </Box>

      {/* Table - PC */}
      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 750, '& .MuiTableCell-root': { borderColor: 'divider' } }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold', width: 60, borderRight: 1, borderColor: 'divider' }} align="center">{t('common.no')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 90, borderRight: 1, borderColor: 'divider' }} align="center">{t('qna.category')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }} align="center">{t('common.title')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 120, borderRight: 1, borderColor: 'divider' }} align="center">{t('qna.author')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 70, borderRight: 1, borderColor: 'divider' }} align="center">{t('qna.views')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 90, borderRight: 1, borderColor: 'divider' }} align="center">{t('qna.answer')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 160 }} align="center">{t('common.createdAt')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">{t('common.noData')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id} hover onClick={() => handleRowClick(post)} sx={{ cursor: 'pointer' }}>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{post.id}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>
                    <Chip label={getCategoryLabel(post.category)} color={categoryColorMap[post.category] || 'default'} size="small" />
                  </TableCell>
                  <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{post.title}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{post.authorName || ''}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{post.views}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>
                    <Chip
                      label={post.isAnswered ? t('qna.answered') : t('qna.waiting')}
                      color={post.isAnswered ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">{formatDate(post.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile Card List */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
        {posts.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">{t('common.noData')}</Typography>
          </Paper>
        ) : (
          posts.map((post) => (
            <Paper key={post.id} sx={{ p: 2, cursor: 'pointer', border: 1, borderColor: 'divider' }} onClick={() => handleRowClick(post)}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                <Chip label={getCategoryLabel(post.category)} color={categoryColorMap[post.category] || 'default'} size="small" />
                <Chip label={post.isAnswered ? t('qna.answered') : t('qna.waiting')} color={post.isAnswered ? 'success' : 'warning'} size="small" />
              </Box>
              <Typography fontWeight="bold" sx={{ mb: 1 }}>{post.title}</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 50 }}>{t('qna.author')}</Typography>
                  <Typography variant="body2">{post.authorName || ''}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 50 }}>{t('common.createdAt')}</Typography>
                  <Typography variant="body2">{formatDate(post.createdAt)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 50 }}>{t('qna.views')}</Typography>
                  <Typography variant="body2">{post.views}</Typography>
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
      ) : postDetail ? (
        <>
          {/* PC Layout */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', gap: 2 }}>
            {/* Question Box */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>{t('qna.question')}</Typography>
              <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
                  <Typography sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('common.title')}</Typography>
                  <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem' }}>{postDetail.title}</Typography>
                </Box>
                <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
                  <Typography sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('qna.category')}</Typography>
                  <Box sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }}>
                    <Chip label={getCategoryLabel(postDetail.category)} color={categoryColorMap[postDetail.category] || 'default'} size="small" />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
                  <Typography sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('qna.author')}</Typography>
                  <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem' }}>{formatUserName(postDetail.authorDept, postDetail.authorName, postDetail.authorPosition) || ''}</Typography>
                </Box>
                <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
                  <Typography sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, minHeight: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', fontSize: '0.875rem', wordBreak: 'keep-all', textAlign: 'center' }}>
                    {t('common.body')}
                  </Typography>
                  <Box sx={{ flex: 1, px: 2, py: 1.5, minHeight: 200, bgcolor: 'background.paper' }}>
                    <HtmlContent content={postDetail.content} fallback="" />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('common.attachments')}</Typography>
                  <Box sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper' }}>
                    {postFiles && postFiles.length > 0 ? (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {postFiles.map((file) => (
                          <Chip key={file.id} label={file.originalFilename} size="small" onClick={() => handleDownloadFile(file.id, file.originalFilename)} sx={{ cursor: 'pointer' }} />
                        ))}
                      </Box>
                    ) : (
                      <Typography color="text.secondary">{t('common.noFile')}</Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* Answer Box */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                {t('qna.answer')}
                {postDetail.isAnswered && <Chip label={t('qna.answered')} color="success" size="small" />}
                {!postDetail.isAnswered && <Chip label={t('qna.waiting')} color="warning" size="small" />}
              </Typography>

              {postDetail.isAnswered && postDetail.answer && !showAnswerEditor ? (
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                  <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
                    <Typography sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('qna.answerBy')}</Typography>
                    <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem' }}>{postDetail.answerAuthorName || ''} {postDetail.answerAuthorDept ? `(${postDetail.answerAuthorDept})` : ''}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
                    <Typography sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('qna.answerDate')}</Typography>
                    <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem' }}>{formatDate(postDetail.answerDate)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex' }}>
                    <Typography sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, minHeight: 150, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', fontSize: '0.875rem', wordBreak: 'keep-all', textAlign: 'center' }}>
                      {t('qna.answer')}
                    </Typography>
                    <Box sx={{ flex: 1, px: 2, py: 1.5, minHeight: 150, bgcolor: 'background.paper' }}>
                      <HtmlContent content={postDetail.answer} fallback="" />
                    </Box>
                  </Box>
                </Box>
              ) : !showAnswerEditor ? (
                <Box sx={{ p: 3, textAlign: 'center', border: 1, borderColor: 'grey.200', borderRadius: 1 }}>
                  <Typography color="text.secondary">{t('qna.noAnswer')}</Typography>
                </Box>
              ) : null}

              {/* Answer Editor (Q&A admin only) */}
              {isQnaAdmin && showAnswerEditor && (
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, bgcolor: 'background.paper' }}>
                  <RichTextEditor
                    value={answerText}
                    onChange={(value) => setAnswerText(value)}
                    placeholder={t('common.enterContent')}
                    minHeight={200}
                  />
                </Box>
              )}
            </Paper>

            {/* Action Buttons */}
            {showAnswerEditor ? (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button variant="outlined" onClick={() => { setShowAnswerEditor(false); setAnswerText('') }}>{t('common.cancel')}</Button>
                <Button variant="contained" onClick={handleAnswerSubmit} disabled={isProcessing}>{t('common.save')}</Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button variant="outlined" onClick={handleBackToList} sx={{ width: 'auto' }}>{t('common.backToList')}</Button>
                {isQnaAdmin && (
                  <Button
                    variant="contained"
                    color="info"
                    onClick={() => { setAnswerText(postDetail.answer || ''); setShowAnswerEditor(true) }}
                    sx={{ width: 'auto' }}
                  >
                    {postDetail.isAnswered ? t('qna.editAnswer') : t('qna.addAnswer')}
                  </Button>
                )}
                {canSee(MENU, 'DETAIL', '질문 수정', getDetailRoles(postDetail)) && isAuthor(postDetail) && <Button variant="contained" onClick={handleEditClick} sx={{ width: 'auto' }}>{t('qna.editQuestion')}</Button>}
                {canSee(MENU, 'DETAIL', '삭제', getDetailRoles(postDetail)) && (isQnaAdmin || isAuthor(postDetail)) && <Button variant="contained" color="error" onClick={handleDeleteClick} sx={{ width: 'auto' }}>{t('common.delete')}</Button>}
              </Box>
            )}
          </Box>

          {/* Mobile Layout */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
          <Paper sx={{ p: 2 }}>
            {/* Question Section */}
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
              {t('qna.question')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.title')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{postDetail.title}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('qna.category')}</Typography>
                <Box sx={{ px: 1.5, py: 0.5 }}>
                  <Chip label={getCategoryLabel(postDetail.category)} color={categoryColorMap[postDetail.category] || 'default'} size="small" />
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('qna.author')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{formatUserName(postDetail.authorDept, postDetail.authorName, postDetail.authorPosition) || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.body')}</Typography>
                <Box sx={{ px: 1.5, py: 0.5, minHeight: 100 }}>
                  <HtmlContent content={postDetail.content} fallback="" />
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.attachments')}</Typography>
                <Box sx={{ px: 1.5, py: 0.5 }}>
                  {postFiles && postFiles.length > 0 ? (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {postFiles.map((file) => (
                        <Chip key={file.id} label={file.originalFilename} size="small" onClick={() => handleDownloadFile(file.id, file.originalFilename)} sx={{ cursor: 'pointer' }} />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">{t('common.noFile')}</Typography>
                  )}
                </Box>
              </Box>
            </Box>

          </Paper>

          <Paper sx={{ p: 2 }}>
            {/* Answer Section - Mobile */}
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              {t('qna.answer')}
              {postDetail.isAnswered && <Chip label={t('qna.answered')} color="success" size="small" />}
              {!postDetail.isAnswered && <Chip label={t('qna.waiting')} color="warning" size="small" />}
            </Typography>

            {postDetail.isAnswered && postDetail.answer && !showAnswerEditor ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('qna.answerBy')}</Typography>
                  <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{postDetail.answerAuthorName || ''} {postDetail.answerAuthorDept ? `(${postDetail.answerAuthorDept})` : ''}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('qna.answerDate')}</Typography>
                  <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{formatDate(postDetail.answerDate)}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('qna.answer')}</Typography>
                  <Box sx={{ px: 1.5, py: 0.5, minHeight: 80 }}>
                    <HtmlContent content={postDetail.answer} fallback="" />
                  </Box>
                </Box>
              </Box>
            ) : !showAnswerEditor ? (
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50', border: 1, borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">{t('qna.noAnswer')}</Typography>
              </Paper>
            ) : null}

            {/* Answer Editor - Mobile */}
            {isQnaAdmin && showAnswerEditor && (
              <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5, bgcolor: 'background.paper' }}>
                <RichTextEditor
                  value={answerText}
                  onChange={(value) => setAnswerText(value)}
                  placeholder={t('common.enterContent')}
                  minHeight={150}
                />
              </Box>
            )}

          </Paper>

            {/* Action Buttons - Mobile */}
            {showAnswerEditor ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" onClick={() => { setShowAnswerEditor(false); setAnswerText('') }} sx={{ flex: 1 }}>{t('common.cancel')}</Button>
                <Button variant="contained" onClick={handleAnswerSubmit} disabled={isProcessing} sx={{ flex: 1 }}>{t('common.save')}</Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button variant="outlined" onClick={handleBackToList} sx={{ flex: 1 }}>{t('common.backToList')}</Button>
                {isQnaAdmin && (
                  <Button
                    variant="contained"
                    color="info"
                    onClick={() => { setAnswerText(postDetail.answer || ''); setShowAnswerEditor(true) }}
                    sx={{ flex: 1 }}
                  >
                    {postDetail.isAnswered ? t('qna.editAnswer') : t('qna.addAnswer')}
                  </Button>
                )}
                {canSee(MENU, 'DETAIL', '질문 수정', getDetailRoles(postDetail)) && isAuthor(postDetail) && <Button variant="contained" onClick={handleEditClick} sx={{ flex: 1 }}>{t('qna.editQuestion')}</Button>}
                {canSee(MENU, 'DETAIL', '삭제', getDetailRoles(postDetail)) && (isQnaAdmin || isAuthor(postDetail)) && <Button variant="contained" color="error" onClick={handleDeleteClick} sx={{ flex: 1 }}>{t('common.delete')}</Button>}
              </Box>
            )}
          </Box>

          {/* 댓글 — EHS 알림과 동일한 댓글/대댓글 구조 */}
          <EntityCommentsSection entityId={postDetail.id} basePath="/qna" queryKey="qnaPostComments" />
        </>
      ) : null}
    </>
  )

  const renderFormView = () => (
    <>
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple style={{ display: 'none' }} />

        {/* PC Form Layout */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          {/* Row 1: Title | Author */}
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
              {t('qna.author')}
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }}>
              <Typography>{formatUserName(user?.department, user?.name, user?.position) || ''}</Typography>
            </Box>
          </Box>

          {/* Row 2: Category | Public */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
              {t('qna.category')}
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
              <FormControl size="small" fullWidth>
                <Select
                  value={formData.category || 'GENERAL'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                 displayEmpty>
                  <MenuItem value="" disabled>선택하세요</MenuItem>
                  {categoryCodes.map((cat) => (
                    <MenuItem key={cat.code} value={cat.code}>{getCategoryLabel(cat.code)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
              {t('qna.isPublic')}
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isPublic ?? true}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  />
                }
                label={formData.isPublic ? t('qna.isPublic') : t('qna.isPrivate')}
              />
            </Box>
          </Box>

          {/* Row 3: Content */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
            <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', alignItems: 'flex-start', fontSize: '0.875rem', justifyContent: 'center', pt: 2, wordBreak: 'keep-all', textAlign: 'center' }}>
              {t('common.body')}
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
              <RichTextEditor
                value={formData.content || ''}
                onChange={(value) => setFormData({ ...formData, content: value })}
                placeholder={t('common.enterContent')}
                minHeight={200}
              />
            </Box>
          </Box>

          {/* Row 4: Attachments */}
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

        {/* Mobile Form Layout */}
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
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('qna.category')}</Typography>
            <FormControl size="small" fullWidth>
              <Select
                value={formData.category || 'GENERAL'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
               displayEmpty>
                <MenuItem value="" disabled>선택하세요</MenuItem>
                {categoryCodes.map((cat) => (
                  <MenuItem key={cat.code} value={cat.code}>{getCategoryLabel(cat.code)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('qna.author')}</Typography>
            <Typography sx={{ px: 1.5, py: 0.5 }}>{formatUserName(user?.department, user?.name, user?.position) || ''}</Typography>
          </Box>
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isPublic ?? true}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                />
              }
              label={formData.isPublic ? t('qna.isPublic') : t('qna.isPrivate')}
            />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.body')}</Typography>
            <RichTextEditor
              value={formData.content || ''}
              onChange={(value) => setFormData({ ...formData, content: value })}
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

      {/* Form Actions */}
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, gap: 1, mt: 2 }}>
        {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
        <Button variant="outlined" onClick={viewMode === 'edit' ? () => setViewMode('detail') : handleBackToList} sx={{ flex: { xs: 1, sm: 'none' } }}>
          {t('common.cancel', '취소')}
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isProcessing} sx={{ flex: { xs: 1, sm: 'none' } }}>
          {t('common.save', '저장')}
        </Button>
      </Box>
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

export default QnaTab
