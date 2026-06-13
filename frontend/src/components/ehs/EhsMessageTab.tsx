import { formatUserName } from '../../utils/userDisplay'
import { isSystemAdmin } from '../../utils/auth'
import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'
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
  FormControl,
  Select,
  MenuItem,
  IconButton,
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import axiosInstance from '../../api/axiosInstance'
import { EhsMessage, EhsMessageRequest } from '../../types/ehsMessage.types'
import { ApiResponse, PageResponse, FileMetadata } from '../../types/common.types'
import RichTextEditor from '../common/RichTextEditor'
import HtmlContent from '../common/HtmlContent'
import LoadingOverlay from '../common/LoadingOverlay'
import EntityCommentsSection from '../common/EntityCommentsSection'
import DevTestFillButton from '../common/DevTestFillButton'
import { useCodeMap } from '../../hooks/useCodeMap'

interface FetchParams {
  page: number
  size: number
  title?: string
  category?: string
}

const fetchMessages = async (params: FetchParams): Promise<PageResponse<EhsMessage>> => {
  const { page, size, title, category } = params
  let url = '/messages'
  const queryParams = new URLSearchParams()
  queryParams.append('page', String(page))
  queryParams.append('size', String(size))

  if (title) {
    url = '/messages/search'
    queryParams.append('title', title)
  } else if (category) {
    url = `/messages/category/${category}`
  }

  const response = await axiosInstance.get<ApiResponse<PageResponse<EhsMessage>>>(`${url}?${queryParams.toString()}`)
  return response.data.data
}

const fetchFiles = async (entityType: string, entityId: string): Promise<FileMetadata[]> => {
  const response = await axiosInstance.get<ApiResponse<FileMetadata[]>>(`/files/by-entity/${entityType}/${entityId}`)
  return response.data.data
}

const createMessage = async (data: EhsMessageRequest): Promise<EhsMessage> => {
  const response = await axiosInstance.post<ApiResponse<EhsMessage>>('/messages', data)
  return response.data.data
}

const updateMessage = async ({ id, data }: { id: number; data: EhsMessageRequest }): Promise<EhsMessage> => {
  const response = await axiosInstance.put<ApiResponse<EhsMessage>>(`/messages/${id}`, data)
  return response.data.data
}

const deleteMessage = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/messages/${id}`)
}

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const EhsMessageTab: React.FC = () => {
  const queryClient = useQueryClient()
  const { t, i18n } = useTranslation()
  const { showSuccess, showConfirm, showWarning } = useAlert()
  const { user } = useAuth()
  const { codeList: categoryCodes, getLabel: getCategoryLabel } = useCodeMap('MESSAGE_CATEGORY')
  const { codeList: roleCodes, getLabel: getRoleLabel } = useCodeMap('MESSAGE_ROLE')
  const { codeList: targetCodes, getLabel: getTargetLabel } = useCodeMap('MESSAGE_TARGET')
  const categories = categoryCodes.map(c => c.code)
  const roles = roleCodes.map(c => c.code)
  const targets = targetCodes.map(c => c.code)
  const [searchParams, setSearchParams] = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(0)
  const [selectedMessage, setSelectedMessage] = useState<EhsMessage | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [viewMessage, setViewMessage] = useState<EhsMessage | null>(null)
  const isAdmin = isSystemAdmin(user)
  const { canSee } = useButtonRules()
  const MENU = 'EHS 경영 › 커뮤니케이션 › EHS 메시지'
  const myRoles: string[] = ['guest', ...(user?.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : (user?.role ? [user.role] : []))]
  const canNew  = canSee(MENU, 'LIST', 'New', myRoles)
  const getDetailRoles = (item: { authorName?: string } | null): string[] =>
    [...myRoles, ...(item?.authorName === user?.name ? ['writer'] : [])]
  const rowsPerPage = 10

  const { control, handleSubmit, reset, setValue, getValues } = useForm<EhsMessageRequest>({
    defaultValues: {
      title: '',
      category: '',
      subCategory: '',
      authorRole: '',
      authorName: '',
      detail: '',
    },
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['ehsMessages', page, searchQuery, categoryFilter],
    queryFn: () =>
      fetchMessages({
        page,
        size: rowsPerPage,
        title: searchQuery || undefined,
        category: categoryFilter || undefined,
      }),
  })

  const { data: messageFiles } = useQuery({
    queryKey: ['ehsMessageFiles', viewMessage?.messageId],
    queryFn: () => fetchFiles('EHS_MESSAGE', viewMessage!.messageId),
    enabled: !!viewMessage?.messageId && viewMode === 'detail',
  })

  const createMutation = useMutation({
    mutationFn: createMessage,
    onSuccess: async (createdMessage) => {
      for (const file of pendingFiles) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('entityType', 'EHS_MESSAGE')
        fd.append('entityId', createdMessage.messageId)
        await axiosInstance.post('/files/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      queryClient.invalidateQueries({ queryKey: ['ehsMessages'] })
      await showSuccess(t('common.saveSuccess'))
      setViewMode('list')
      reset()
      setPendingFiles([])
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateMessage,
    onSuccess: async (updatedMessage) => {
      for (const file of pendingFiles) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('entityType', 'EHS_MESSAGE')
        fd.append('entityId', updatedMessage.messageId)
        await axiosInstance.post('/files/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      queryClient.invalidateQueries({ queryKey: ['ehsMessages'] })
      queryClient.invalidateQueries({ queryKey: ['ehsMessageFiles'] })
      await showSuccess(t('common.saveSuccess'))
      setViewMode('list')
      setViewMessage(null)
      reset()
      setPendingFiles([])
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMessage,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['ehsMessages'] })
      await showSuccess(t('common.deleteSuccess'))
      setSelectedMessage(null)
      setViewMode('list')
      setViewMessage(null)
    },
  })

  // Loading state for mutations
  const isSaving = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  const handleReset = () => {
    setSearchText('')
    setSearchQuery('')
    setCategoryFilter('')
    setRoleFilter('')
    setPage(0)
  }

  const handleSearch = () => {
    setSearchQuery(searchText)
    setPage(0)
  }

  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    setCategoryFilter(event.target.value)
    setPage(0)
  }

  const handleRoleChange = (event: SelectChangeEvent<string>) => {
    setRoleFilter(event.target.value)
  }

  const handleRowClick = (message: EhsMessage) => {
    setViewMessage(message)
    setViewMode('detail')
    setSearchParams({ tab: '3', messageId: String(message.id) })
  }

  const handleBackToList = () => {
    setViewMode('list')
    setViewMessage(null)
    reset()
    setPendingFiles([])
    setSearchParams({ tab: '3' })
  }

  // Handle URL params for direct message view
  useEffect(() => {
    const messageId = searchParams.get('messageId')
    if (messageId && data?.content) {
      const message = data.content.find((m) => m.id === parseInt(messageId, 10))
      if (message) {
        setViewMessage(message)
        setViewMode('detail')
      }
    }
  }, [searchParams, data])

  // Cancel edit mode when language changes
  useEffect(() => {
    if (viewMode === 'edit') {
      setViewMode('detail')
      reset()
    }
  }, [i18n.language])

  const handleAddClick = () => {
    reset({
      title: '',
      category: '',
      subCategory: '',
      authorRole: '',
      authorName: user?.name || '',
      detail: '',
    })
    setPendingFiles([])
    setViewMode('create')
  }

  // DEV ONLY — 비어있는 항목을 EHS 메시지 더미데이터로 채움 (입력값 보존)
  const fillTestData = () => {
    const v = getValues()
    if (!v.title) setValue('title', '[EHS 공지] 11월 안전보건 점검 결과 및 협조 요청')
    if (!v.subCategory && targets[0]) setValue('subCategory', targets[0])   // 대상
    if (!v.category && categories[0]) setValue('category', categories[0])   // 카테고리
    if (!v.authorRole && roles[0]) setValue('authorRole', roles[0])         // 직책
    if (!v.detail) setValue('detail', '<p>11월 정기 안전보건 점검 결과를 공유드립니다. 지적 사항에 대한 개선 조치에 적극 협조 부탁드립니다. (테스트 데이터)</p>')
  }

  const handleEditClick = () => {
    if (!viewMessage) return
    reset({
      title: viewMessage.title || '',
      category: viewMessage.category || '',
      subCategory: viewMessage.subCategory || '',
      authorRole: viewMessage.authorRole || '',
      authorName: viewMessage.authorName || '',
      detail: viewMessage.detail || '',
    })
    setPendingFiles([])
    setViewMode('edit')
  }

  const handleDeleteClick = async (message: EhsMessage) => {
    const confirmed = await showConfirm(
      `${t('common.confirmDeleteMessage')}\n${t('common.deleteWarning')}`,
      { title: `${t('ehs.ehsMessage')} ${t('common.delete')}` }
    )
    if (confirmed) {
      deleteMutation.mutate(message.id)
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

  const onSubmit = async (data: EhsMessageRequest) => {
    const confirmed = await showConfirm(t('common.confirmSave'))
    if (!confirmed) return

    // Get current language from i18n
    const currentLang = i18n.language?.substring(0, 2) || 'ko'
    // Set author info from logged-in user
    const dataWithLang = {
      ...data,
      authorName: user?.name || data.authorName,
      authorDept: user?.department || data.authorDept,
      authorEmail: user?.email || data.authorEmail,
      authorPosition: user?.position || data.authorPosition,
      authorCompany: user?.company || data.authorCompany,
      sourceLang: currentLang,
    }

    if (viewMode === 'edit' && viewMessage) {
      updateMutation.mutate({ id: viewMessage.id, data: dataWithLang })
    } else {
      createMutation.mutate(dataWithLang)
    }
  }

  const messages = data?.content || []
  const totalPages = data?.totalPages || 0

  // Filter by role locally (since backend doesn't have this filter)
  const filteredMessages = roleFilter
    ? messages.filter((msg) => msg.authorRole === roleFilter)
    : messages

  // Label cell style
  const labelCellSx = {
    width: 128,
    fontWeight: 'bold',
    bgcolor: 'grey.100',
    textAlign: 'center',
    borderRight: 1, borderColor: 'divider',
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{t('common.loadError')}</Alert>
      </Box>
    )
  }

  // Create View
  if (viewMode === 'create') {
    return (
      <Box sx={{ p: 2 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple style={{ display: 'none' }} />
            {/* PC용 테이블 레이아웃 */}
            <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
              {/* Row 1: 제목 */}
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                  {t('common.title')}
                </Typography>
                <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                  <Controller
                    name="title"
                    control={control}
                    rules={{ required: t('common.enterTitle') }}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        size="small"
                        fullWidth
                        placeholder={t('common.enterTitle')}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Box>
              </Box>

              {/* Row 2: 대상 | 카테고리 */}
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                  {t('common.target')}
                </Typography>
                <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
                  <Controller
                    name="subCategory"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small">
                        <Select {...field} displayEmpty>
                          <MenuItem value="">{t('common.selectTarget')}</MenuItem>
                          {targets.map((target) => (
                            <MenuItem key={target} value={target}>{getTargetLabel(target)}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Box>
                <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                  {t('common.category')}
                </Typography>
                <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small">
                        <Select {...field} displayEmpty>
                          <MenuItem value="">{t('common.selectCategory')}</MenuItem>
                          {categories.map((cat) => (
                            <MenuItem key={cat} value={cat}>{getCategoryLabel(cat)}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Box>
              </Box>

              {/* Row 3: 작성자 | 직책 */}
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                  {t('common.writer')}
                </Typography>
                <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                  <Typography>{formatUserName(user?.department, user?.name, user?.position) || ''}</Typography>
                </Box>
                <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                  {t('common.position')}
                </Typography>
                <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                  <Controller
                    name="authorRole"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small">
                        <Select {...field} displayEmpty>
                          <MenuItem value="">{t('common.selectPosition')}</MenuItem>
                          {roles.map((role) => (
                            <MenuItem key={role} value={role}>{getRoleLabel(role)}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Box>
              </Box>

              {/* Row 4: 본문 */}
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'flex-start', fontSize: '0.875rem', justifyContent: 'center', pt: 2, wordBreak: 'keep-all', textAlign: 'center' }}>
                  {t('common.body')}
                </Typography>
                <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                  <Controller
                    name="detail"
                    control={control}
                    render={({ field }) => (
                      <RichTextEditor
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder={t('common.enterBody')}
                        minHeight={250}
                      />
                    )}
                  />
                </Box>
              </Box>

              {/* Row 5: 파일첨부 */}
              <Box sx={{ display: 'flex' }}>
                <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
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
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.title')}</Typography>
                <Controller
                  name="title"
                  control={control}
                  rules={{ required: t('common.enterTitle') }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      size="small"
                      fullWidth
                      placeholder={t('common.enterTitle')}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.category')}</Typography>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <Select {...field} displayEmpty>
                        <MenuItem value="">{t('common.selectCategory')}</MenuItem>
                        {categories.map((cat) => (
                          <MenuItem key={cat} value={cat}>{getCategoryLabel(cat)}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.writer')}</Typography>
                <Typography sx={{ px: 1.5, py: 0.5 }}>{user?.name || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.position')}</Typography>
                <Controller
                  name="authorRole"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <Select {...field} displayEmpty>
                        <MenuItem value="">{t('common.selectPosition')}</MenuItem>
                        {roles.map((role) => (
                          <MenuItem key={role} value={role}>{getRoleLabel(role)}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.body')}</Typography>
                <Controller
                  name="detail"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder={t('common.enterBody')}
                      minHeight={250}
                    />
                  )}
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
          </Paper>

          <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, gap: 1 }}>
            <DevTestFillButton onFill={fillTestData} />
            <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: 1, sm: 'none' } }}>
              {t('common.backToList')}
            </Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending} sx={{ flex: { xs: 1, sm: 'none' } }}>
              {createMutation.isPending ? <CircularProgress size={20} /> : t('common.register')}
            </Button>
          </Box>
        </form>

        <LoadingOverlay open={isSaving} message={t('common.saving')} />
      </Box>
    )
  }

  // Detail View
  if (viewMode === 'detail' && viewMessage) {
    return (
      <>
        {/* PC용 레이아웃 */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('common.title')}</Typography>
              <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>{viewMessage.title || ''}</Typography>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('common.target')}</Typography>
              <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem', display: 'flex', alignItems: 'center', borderRight: 1, borderColor: 'divider' }}>{viewMessage.subCategory ? getTargetLabel(viewMessage.subCategory) : ''}</Typography>
              <Typography sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('common.category')}</Typography>
              <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>{viewMessage.category ? getCategoryLabel(viewMessage.category) : ''}</Typography>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('common.writer')}</Typography>
              <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem', display: 'flex', alignItems: 'center', borderRight: 1, borderColor: 'divider' }}>{formatUserName(viewMessage.authorDept, viewMessage.authorName, viewMessage.authorPosition) || ''}</Typography>
              <Typography sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('common.position')}</Typography>
              <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>{viewMessage.authorRole ? getRoleLabel(viewMessage.authorRole) : ''}</Typography>
            </Box>
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>{t('common.body')}</Typography>
              <Box sx={{ flex: 1, px: 2, py: 1.5, minHeight: 200, bgcolor: 'background.paper' }}>
                <HtmlContent content={viewMessage.detail} fallback="" />
              </Box>
            </Box>
            <Box sx={{ display: 'flex' }}>
              <Typography sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('common.attachments')}</Typography>
              <Box sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper' }}>
                {messageFiles && messageFiles.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {messageFiles.map((file) => (
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

        {/* 모바일용 레이아웃 */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.title')}</Typography>
              <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{viewMessage.title || ''}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.category')}</Typography>
              <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{viewMessage.category ? getCategoryLabel(viewMessage.category) : ''}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.writer')}</Typography>
              <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{formatUserName(viewMessage.authorDept, viewMessage.authorName, viewMessage.authorPosition) || ''}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.position')}</Typography>
              <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{viewMessage.authorRole ? getRoleLabel(viewMessage.authorRole) : ''}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.body')}</Typography>
              <Box sx={{ px: 1.5, py: 0.5, minHeight: 100 }}>
                <HtmlContent content={viewMessage.detail} fallback="" />
              </Box>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.attachments')}</Typography>
              <Box sx={{ px: 1.5, py: 0.5 }}>
                {messageFiles && messageFiles.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {messageFiles.map((file) => (
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
        </Box>

        {/* 댓글 — EHS 알림과 동일한 댓글/대댓글 구조 */}
        <EntityCommentsSection entityId={viewMessage.id} basePath="/messages" queryKey="ehsMessageComments" />

        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, gap: 1 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: 1, sm: 'none' } }}>
            {t('common.backToList')}
          </Button>
          {canSee(MENU, 'DETAIL', '수정', getDetailRoles(viewMessage)) && (
            <Button variant="contained" onClick={handleEditClick} sx={{ flex: { xs: 1, sm: 'none' } }}>
              {t('common.edit')}
            </Button>
          )}
          {canSee(MENU, 'DETAIL', '삭제', getDetailRoles(viewMessage)) && (
            <Button variant="contained" color="error" onClick={() => handleDeleteClick(viewMessage)} sx={{ flex: { xs: 1, sm: 'none' } }}>
              {t('common.delete')}
            </Button>
          )}
        </Box>
      </>
    )
  }

  // Edit View
  if (viewMode === 'edit' && viewMessage) {
    return (
      <Box sx={{ p: 2 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple style={{ display: 'none' }} />
            {/* PC용 테이블 레이아웃 */}
            <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
              {/* Row 1: 제목 */}
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                  {t('common.title')}
                </Typography>
                <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                  <Controller
                    name="title"
                    control={control}
                    rules={{ required: t('common.enterTitle') }}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        size="small"
                        fullWidth
                        placeholder={t('common.enterTitle')}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Box>
              </Box>

              {/* Row 2: 대상 | 카테고리 */}
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                  {t('common.target')}
                </Typography>
                <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
                  <Controller
                    name="subCategory"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small">
                        <Select {...field} displayEmpty>
                          <MenuItem value="">{t('common.selectTarget')}</MenuItem>
                          {targets.map((target) => (
                            <MenuItem key={target} value={target}>{getTargetLabel(target)}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Box>
                <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                  {t('common.category')}
                </Typography>
                <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small">
                        <Select {...field} displayEmpty>
                          <MenuItem value="">{t('common.selectCategory')}</MenuItem>
                          {categories.map((cat) => (
                            <MenuItem key={cat} value={cat}>{getCategoryLabel(cat)}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Box>
              </Box>

              {/* Row 3: 작성자 | 직책 */}
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                  {t('common.writer')}
                </Typography>
                <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                  <Typography>{formatUserName(user?.department, user?.name, user?.position) || ''}</Typography>
                </Box>
                <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                  {t('common.position')}
                </Typography>
                <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                  <Controller
                    name="authorRole"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small">
                        <Select {...field} displayEmpty>
                          <MenuItem value="">{t('common.selectPosition')}</MenuItem>
                          {roles.map((role) => (
                            <MenuItem key={role} value={role}>{getRoleLabel(role)}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Box>
              </Box>

              {/* Row 4: 본문 */}
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'flex-start', fontSize: '0.875rem', justifyContent: 'center', pt: 2, wordBreak: 'keep-all', textAlign: 'center' }}>
                  {t('common.body')}
                </Typography>
                <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                  <Controller
                    name="detail"
                    control={control}
                    render={({ field }) => (
                      <RichTextEditor
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder={t('common.enterBody')}
                        minHeight={250}
                      />
                    )}
                  />
                </Box>
              </Box>

              {/* Row 5: 파일첨부 */}
              <Box sx={{ display: 'flex' }}>
                <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
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
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.title')}</Typography>
                <Controller
                  name="title"
                  control={control}
                  rules={{ required: t('common.enterTitle') }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      size="small"
                      fullWidth
                      placeholder={t('common.enterTitle')}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.category')}</Typography>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <Select {...field} displayEmpty>
                        <MenuItem value="">{t('common.selectCategory')}</MenuItem>
                        {categories.map((cat) => (
                          <MenuItem key={cat} value={cat}>{getCategoryLabel(cat)}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.writer')}</Typography>
                <Typography sx={{ px: 1.5, py: 0.5 }}>{user?.name || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.position')}</Typography>
                <Controller
                  name="authorRole"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <Select {...field} displayEmpty>
                        <MenuItem value="">{t('common.selectPosition')}</MenuItem>
                        {roles.map((role) => (
                          <MenuItem key={role} value={role}>{getRoleLabel(role)}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.body')}</Typography>
                <Controller
                  name="detail"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder={t('common.enterBody')}
                      minHeight={250}
                    />
                  )}
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
          </Paper>

          <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, gap: 1 }}>
            <Button variant="outlined" onClick={() => setViewMode('detail')} sx={{ flex: { xs: 1, sm: 'none' } }}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="contained" disabled={updateMutation.isPending} sx={{ flex: { xs: 1, sm: 'none' } }}>
              {updateMutation.isPending ? <CircularProgress size={20} /> : t('common.save')}
            </Button>
          </Box>
        </form>

        <LoadingOverlay open={isSaving} message={t('common.saving')} />
      </Box>
    )
  }

  // List View
  return (
    <Box>
      {/* Filters - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
          <TextField
            size="small"
            placeholder={t('common.title')}
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
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select value={categoryFilter} onChange={handleCategoryChange} displayEmpty>
              <MenuItem value="">{t('ehsMessage.category')}</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {getCategoryLabel(cat)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select value={roleFilter} onChange={handleRoleChange} displayEmpty>
              <MenuItem value="">{t('common.position')}</MenuItem>
              {roles.map((role) => (
                <MenuItem key={role} value={role}>
                  {getRoleLabel(role)}
                </MenuItem>
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
        <TextField
          size="small"
          placeholder={t('common.title')}
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
          <FormControl size="small" sx={{ flex: 1 }}>
            <Select value={categoryFilter} onChange={handleCategoryChange} displayEmpty>
              <MenuItem value="">{t('ehsMessage.category')}</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>{getCategoryLabel(cat)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ flex: 1 }}>
            <Select value={roleFilter} onChange={handleRoleChange} displayEmpty>
              <MenuItem value="">{t('common.position')}</MenuItem>
              {roles.map((role) => (
                <MenuItem key={role} value={role}>{getRoleLabel(role)}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" onClick={handleReset} startIcon={<RefreshIcon />} sx={{ flex: 1 }}>{t('common.reset')}</Button>
          {canNew && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick} sx={{ flex: 1 }}>New</Button>
          )}
        </Box>
      </Box>

      {/* Table - PC */}
      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 750, '& .MuiTableCell-root': { borderColor: 'divider' } }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold', width: 140, borderRight: 1, borderColor: 'divider', whiteSpace: 'nowrap' }} align="center">
                {t('common.position')}
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 120, borderRight: 1, borderColor: 'divider' }} align="center">
                {t('common.author')}
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 100, borderRight: 1, borderColor: 'divider' }} align="center">
                {t('common.category')}
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }} align="center">
                {t('common.title')}
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 120, borderRight: 1, borderColor: 'divider' }} align="center">
                {t('common.createdAt')}
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 80 }} align="center">
                {t('common.views')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMessages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">{t('ehsMessage.noMessages')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredMessages.map((message) => (
                <TableRow
                  key={message.id}
                  hover
                  onClick={() => handleRowClick(message)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{message.authorRole ? getRoleLabel(message.authorRole) : ''}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{message.authorName || ''}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{message.category ? getCategoryLabel(message.category) : ''}</TableCell>
                  <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{message.title}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>
                    {message.createdAt ? new Date(message.createdAt).toISOString().substring(0, 10) : ''}
                  </TableCell>
                  <TableCell align="center">{message.views}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile Card List */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
        {filteredMessages.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">{t('ehsMessage.noMessages')}</Typography>
          </Paper>
        ) : (
          filteredMessages.map((message) => (
            <Paper key={message.id} sx={{ p: 2, cursor: 'pointer', border: 1, borderColor: 'divider' }} onClick={() => handleRowClick(message)}>
              <Typography fontWeight="bold" sx={{ mb: 1 }}>{message.title}</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('common.position')}</Typography>
                  <Typography variant="body2">{message.authorRole ? getRoleLabel(message.authorRole) : ''}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('common.author')}</Typography>
                  <Typography variant="body2">{message.authorName || ''}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('common.category')}</Typography>
                  <Typography variant="body2">{message.category ? getCategoryLabel(message.category) : ''}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('common.createdAt')}</Typography>
                  <Typography variant="body2">{message.createdAt ? new Date(message.createdAt).toISOString().substring(0, 10) : ''}</Typography>
                </Box>
              </Box>
            </Paper>
          ))
        )}
      </Box>

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination
          count={totalPages || 1}
          page={page + 1}
          onChange={(_, newPage) => setPage(newPage - 1)}
          color="primary"
        />
      </Box>

      {/* Loading Overlay */}
      <LoadingOverlay open={isSaving} message={t('common.saving')} />
    </Box>
  )
}

export default EhsMessageTab
