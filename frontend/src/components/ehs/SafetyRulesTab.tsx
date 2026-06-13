import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  CircularProgress,
  Chip,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import FolderIcon from '@mui/icons-material/Folder'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import DownloadIcon from '@mui/icons-material/Download'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import TranslateIcon from '@mui/icons-material/Translate'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../context/LanguageContext'
import { useAlert } from '../../contexts/AlertContext'
import axiosInstance from '../../api/axiosInstance'
import { FileMetadata } from '../../types/file.types'
import { ApiResponse } from '../../types/common.types'
import { WordIcon, ExcelIcon, PowerPointIcon, PdfIcon, ImageFileIcon, DefaultFileIcon } from '../common/FileIcons'

const ENTITY_TYPE = 'SAFETY_RULES'

// 폴더 구조 정의
interface FolderNode {
  id: string
  name: string
  children?: FolderNode[]
}

// Folder structure with i18n keys
const folderStructure: FolderNode[] = [
  {
    id: 'safety-rules',
    name: 'ehs.safetyRules',
    children: [
      { id: 'safety-rules/hazard-info', name: 'safetyRules.hazardInfo' },
      { id: 'safety-rules/general', name: 'safetyRules.generalSafetyRegulations' },
      { id: 'safety-rules/emergency', name: 'safetyRules.emergencyProcedures' },
      { id: 'safety-rules/ppe', name: 'safetyRules.ppeManagement' },
    ],
  },
  {
    id: 'regulations',
    name: 'safetyRules.regulationsAndLaws',
    children: [
      { id: 'regulations/osha', name: 'safetyRules.industrialSafetyAct' },
      { id: 'regulations/environment', name: 'safetyRules.environmentalRegulations' },
      { id: 'regulations/fire', name: 'safetyRules.fireRegulations' },
    ],
  },
  {
    id: 'manuals',
    name: 'safetyRules.manuals',
    children: [
      { id: 'manuals/equipment', name: 'safetyRules.equipmentManual' },
      { id: 'manuals/chemical', name: 'safetyRules.chemicalHandlingManual' },
      { id: 'manuals/work', name: 'safetyRules.workProcedure' },
    ],
  },
  {
    id: 'forms',
    name: 'safetyRules.forms',
    children: [
      { id: 'forms/checklist', name: 'safetyRules.inspectionChecklist' },
      { id: 'forms/report', name: 'safetyRules.reportTemplate' },
      { id: 'forms/permit', name: 'safetyRules.workPermit' },
    ],
  },
  {
    id: 'environment',
    name: 'safetyRules.environmentManagement',
    children: [
      { id: 'environment/waste', name: 'safetyRules.wasteManagement' },
      { id: 'environment/water', name: 'safetyRules.waterQualityManagement' },
      { id: 'environment/air', name: 'safetyRules.airEmissionManagement' },
      { id: 'environment/carbon', name: 'safetyRules.carbonEmissionESG' },
    ],
  },
]

const fetchFiles = async (entityId: string): Promise<FileMetadata[]> => {
  const response = await axiosInstance.get<ApiResponse<FileMetadata[]>>(
    `/files/by-entity/${ENTITY_TYPE}/${entityId}`
  )
  return response.data.data
}

const uploadFile = async ({
  file,
  entityId,
}: {
  file: File
  entityId: string
}): Promise<FileMetadata> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('entityType', ENTITY_TYPE)
  formData.append('entityId', entityId)

  const response = await axiosInstance.post<ApiResponse<FileMetadata>>('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data.data
}

const deleteFile = async (fileId: number): Promise<void> => {
  await axiosInstance.delete(`/files/${fileId}`)
}

const downloadFile = async (fileId: number, filename: string): Promise<void> => {
  const response = await axiosInstance.get(`/files/${fileId}`, {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || ''
}

const getFileIcon = (file: FileMetadata) => {
  const ext = getFileExtension(file.originalFilename)
  if (ext === 'pdf') return <PdfIcon sx={{ fontSize: 24 }} />
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return <ImageFileIcon sx={{ fontSize: 24 }} />
  if (['doc', 'docx'].includes(ext)) return <WordIcon sx={{ fontSize: 24 }} />
  if (['xls', 'xlsx'].includes(ext)) return <ExcelIcon sx={{ fontSize: 24 }} />
  if (['ppt', 'pptx'].includes(ext)) return <PowerPointIcon sx={{ fontSize: 24 }} />
  return <DefaultFileIcon sx={{ fontSize: 24 }} />
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 폴더 트리 아이템 컴포넌트
interface FolderTreeItemProps {
  node: FolderNode
  selectedFolder: string
  expandedFolders: string[]
  onSelect: (folderId: string) => void
  onToggle: (folderId: string) => void
  level?: number
}

const FolderTreeItem: React.FC<FolderTreeItemProps> = ({
  node,
  selectedFolder,
  expandedFolders,
  onSelect,
  onToggle,
  level = 0,
}) => {
  const { t } = useTranslation()
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expandedFolders.includes(node.id)
  const isSelected = selectedFolder === node.id

  return (
    <>
      <ListItemButton
        selected={isSelected}
        onClick={() => {
          onSelect(node.id)
          if (hasChildren) {
            onToggle(node.id)
          }
        }}
        sx={{ pl: 2 + level * 2, minWidth: 0, overflow: 'hidden' }}
      >
        <ListItemIcon sx={{ minWidth: 36 }}>
          {hasChildren ? (
            isExpanded ? (
              <FolderOpenIcon sx={{ color: '#FFC107' }} />
            ) : (
              <FolderIcon sx={{ color: '#FFC107' }} />
            )
          ) : (
            <FolderIcon sx={{ color: '#FFC107' }} />
          )}
        </ListItemIcon>
        <ListItemText
          primary={t(node.name)}
          primaryTypographyProps={{
            fontSize: 14,
            noWrap: true,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          sx={{ overflow: 'hidden', minWidth: 0 }}
        />
        {hasChildren && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
      </ListItemButton>
      {hasChildren && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ overflow: 'hidden' }}>
            {node.children!.map((child) => (
              <FolderTreeItem
                key={child.id}
                node={child}
                selectedFolder={selectedFolder}
                expandedFolders={expandedFolders}
                onSelect={onSelect}
                onToggle={onToggle}
                level={level + 1}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  )
}

const SafetyRulesTab: React.FC = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const queryClient = useQueryClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { showError, showWarning, showSuccess, showConfirm } = useAlert()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const applySearch = () => setSearchText(searchInput)
  const handleResetSearch = () => { setSearchInput(''); setSearchText('') }
  const [selectedFolder, setSelectedFolder] = useState('safety-rules')
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['safety-rules'])
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingFilePreview, setPendingFilePreview] = useState<string | null>(null)
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const MENU = 'EHS 경영 › 커뮤니케이션 › EHS 문서'
  const myRoles: string[] = ['guest', ...(user?.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : (user?.role ? [user.role] : []))]
  const canNew = canSee(MENU, 'LIST', 'New (파일 업로드)', myRoles)

  const currentEntityId = selectedFolder

  const { data: files = [] } = useQuery({
    queryKey: ['safetyRulesFiles', currentEntityId, language],
    queryFn: () => fetchFiles(currentEntityId),
    refetchInterval: (query) => {
      const data = query.state.data as FileMetadata[] | undefined
      if (data?.some((f) => f.translationStatus === 'PENDING' || f.translationStatus === 'TRANSLATING')) {
        return 5000
      }
      return false
    },
  })

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: (data: FileMetadata) => {
      queryClient.invalidateQueries({ queryKey: ['safetyRulesFiles'] })
      setUploading(false)
      setPendingFile(null)
      setPendingFilePreview(null)
      setSelectedFile(data)
      if (data.translationStatus) {
        showSuccess(t('safetyRules.fileUploadedWithTranslation'))
      } else {
        showSuccess(t('safetyRules.fileUploaded'))
      }
    },
    onError: () => {
      setUploading(false)
      setPendingFile(null)
      setPendingFilePreview(null)
      showError(t('safetyRules.fileUploadFailed'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safetyRulesFiles'] })
      setSelectedFile(null)
      setPreviewContent(null)
    },
  })

  const filteredFiles = searchText
    ? files.filter((file) => file.originalFilename.toLowerCase().includes(searchText.toLowerCase()))
    : files

  const handleFileClick = async (file: FileMetadata) => {
    setSelectedFile(file)
    setPendingFile(null)
    setPendingFilePreview(null)
    setPreviewContent('loading')

    const ext = getFileExtension(file.originalFilename)
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)
    const isPdf = ext === 'pdf'
    const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)

    try {
      if (isImage || isPdf) {
        // 이미지와 PDF는 base64로 직접 표시
        const response = await axiosInstance.get<ApiResponse<{ filename: string; contentType: string; content: string }>>(
          `/files/${file.id}/base64`
        )
        const { content, contentType } = response.data.data
        setPreviewContent(`data:${contentType};base64,${content}`)
      } else if (isOffice) {
        // Office 문서는 서버에서 PDF로 변환하여 표시
        const response = await axiosInstance.get(`/files/${file.id}/pdf`, {
          responseType: 'blob',
        })
        const pdfBlob = new Blob([response.data], { type: 'application/pdf' })
        const pdfUrl = URL.createObjectURL(pdfBlob)
        setPreviewContent(pdfUrl)
      } else {
        setPreviewContent('unsupported')
      }
    } catch (error) {
      console.error('Failed to load preview:', error)
      setPreviewContent('error')
    }
  }

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolder(folderId)
    setSelectedFile(null)
    setPreviewContent(null)
  }

  const handleFolderToggle = (folderId: string) => {
    setExpandedFolders((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]
    )
  }

  const getFolderName = (folderId: string): string => {
    const findFolder = (nodes: FolderNode[]): string | null => {
      for (const node of nodes) {
        if (node.id === folderId) return node.name
        if (node.children) {
          const found = findFolder(node.children)
          if (found) return found
        }
      }
      return null
    }
    const key = findFolder(folderStructure)
    return key ? t(key) : folderId
  }

  const handleDownload = async (file: FileMetadata) => {
    try {
      await downloadFile(file.id, file.originalFilename)
    } catch (error) {
      console.error('Download failed:', error)
      showError(t('safetyRules.downloadFailed'))
    }
  }

  const handleDeleteClick = async (file: FileMetadata) => {
    const confirmed = await showConfirm(
      `${t('common.confirmDeleteMessage')}\n${t('safetyRules.filenameLabel')} ${file.originalFilename}\n${t('safetyRules.cannotRecoverFile')}`,
      { title: t('safetyRules.deleteFile') }
    )
    if (confirmed) {
      deleteMutation.mutate(file.id)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        showWarning(`${t('safetyRules.fileTooLarge')}\n${t('safetyRules.filenameLabel')} ${file.name}\n${t('safetyRules.fileSize')}: ${(file.size / 1024 / 1024).toFixed(1)}MB`)
        event.target.value = ''
        return
      }

      // Set pending file and show preview
      setPendingFile(file)
      setSelectedFile(null)
      setPreviewContent(null)

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPendingFilePreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setPendingFilePreview(null)
      }
    }
    // Reset input value to allow re-uploading same file
    event.target.value = ''
  }

  const handleUploadConfirm = () => {
    if (pendingFile) {
      setUploading(true)
      uploadMutation.mutate({ file: pendingFile, entityId: currentEntityId })
      // pendingFile은 onSuccess/onError에서 정리 — 업로드 중 미리보기 유지
    }
  }

  const handleCancelPending = () => {
    setPendingFile(null)
    setPendingFilePreview(null)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Box>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt"
      />

      {/* Search and Actions - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ListSearchBar
            placeholder={t('common.searchByFilename')}
            value={searchInput}
            onChange={setSearchInput}
            onSearch={applySearch}
            sx={{ width: 270 }}
          />
          <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
        </Box>
        {canNew && (
          <Button
            variant="contained"
            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
            size="small"
            onClick={handleUploadClick}
            disabled={uploading}
          >
            {uploading ? t('safetyRules.uploading') : 'New'}
          </Button>
        )}
      </Box>

      {/* Search and Actions - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <ListSearchBar
            placeholder={t('common.searchByFilename')}
            value={searchInput}
            onChange={setSearchInput}
            onSearch={applySearch}
            fullWidth
          />
          <IconButton onClick={handleResetSearch} size="small"><RefreshIcon /></IconButton>
        </Box>
        {canNew && (
          <Button
            variant="contained"
            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
            size="small"
            onClick={handleUploadClick}
            disabled={uploading}
            fullWidth
          >
            {uploading ? t('safetyRules.uploading') : 'New'}
          </Button>
        )}
      </Box>

      {/* Main Content - Three Column Layout */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        height: { xs: 'auto', md: 'calc(100vh - 350px)' },
        minHeight: { xs: 'auto', md: 450 }
      }}>
        {/* Folder Tree - Left Panel */}
        <Paper variant="outlined" sx={{ width: { xs: '100%', md: 250 }, flexShrink: 0, overflow: 'auto', maxHeight: { xs: 200, md: 'none' }, border: 1, borderColor: 'divider' }}>
          <Box sx={{ p: 1, bgcolor: 'grey.100', borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight="bold">
              {t('safetyRules.folder')}
            </Typography>
          </Box>
          <List component="nav" dense sx={{ overflow: 'hidden' }}>
            {folderStructure.map((node) => (
              <FolderTreeItem
                key={node.id}
                node={node}
                selectedFolder={selectedFolder}
                expandedFolders={expandedFolders}
                onSelect={handleFolderSelect}
                onToggle={handleFolderToggle}
              />
            ))}
          </List>
        </Paper>

        {/* File List - Center Panel */}
        <TableContainer component={Paper} variant="outlined" sx={{ flex: 1, overflowX: 'auto', minHeight: { xs: 300, md: 'auto' }, border: 1, borderColor: 'divider' }}>
          <Box sx={{ p: 1, bgcolor: 'grey.100', borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight="bold">
              {getFolderName(selectedFolder)}
            </Typography>
          </Box>
          <Table size="small" stickyHeader sx={{ minWidth: 500 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', borderRight: 1, borderColor: 'divider' }} align="center">{t('safetyRules.filename')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', width: 100, borderRight: 1, borderColor: 'divider' }} align="center">{t('safetyRules.fileSize')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', width: 120, borderRight: 1, borderColor: 'divider' }} align="center">{t('safetyRules.registeredDate')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', width: 100 }} align="center">
                  {t('safetyRules.actions')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredFiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">{t('safetyRules.noFiles')}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredFiles.map((file) => (
                  <TableRow
                    key={file.id}
                    hover
                    selected={selectedFile?.id === file.id}
                    onClick={() => handleFileClick(file)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getFileIcon(file)}
                        <Typography variant="body2">{file.originalFilename}</Typography>
                        {file.translationStatus === 'TRANSLATING' && (
                          <Chip
                            label={t('safetyRules.translating')}
                            size="small"
                            color="warning"
                            icon={<CircularProgress size={12} />}
                            sx={{ ml: 0.5, height: 20, fontSize: 11 }}
                          />
                        )}
                        {file.translationStatus === 'PENDING' && (
                          <Chip
                            label={t('safetyRules.translationPending')}
                            size="small"
                            color="info"
                            icon={<TranslateIcon sx={{ fontSize: 14 }} />}
                            sx={{ ml: 0.5, height: 20, fontSize: 11 }}
                          />
                        )}
                        {file.translationStatus === 'FAILED' && (
                          <Chip
                            label={t('safetyRules.translationFailed')}
                            size="small"
                            color="error"
                            sx={{ ml: 0.5, height: 20, fontSize: 11 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary">
                        {formatFileSize(file.fileSize)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary">
                        {file.createdAt ? new Date(file.createdAt).toISOString().substring(0, 10) : ''}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(file)
                        }}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                      {canNew && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(file)
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Preview Panel - Right Panel */}
        <Paper variant="outlined" sx={{ width: { xs: '100%', md: 350 }, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: { xs: 250, md: 'auto' }, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
          <Box sx={{ p: 1, bgcolor: 'grey.100', borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight="bold">
              {t('safetyRules.preview')}
            </Typography>
          </Box>
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.50',
              overflow: 'auto',
            }}
          >
            {pendingFile ? (
              // 업로드 대기 중인 파일 미리보기
              <Box sx={{ textAlign: 'center', p: 2, width: '100%' }}>
                {pendingFilePreview ? (
                  <Box
                    component="img"
                    src={pendingFilePreview}
                    alt="Preview"
                    sx={{ maxWidth: '100%', maxHeight: 250, mb: 2, borderRadius: 1 }}
                  />
                ) : (
                  <InsertDriveFileIcon sx={{ fontSize: 64, color: '#1976d2', mb: 2 }} />
                )}
                <Typography variant="body2" sx={{ mb: 1, wordBreak: 'break-all' }}>
                  {pendingFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  {formatFileSize(pendingFile.size)}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, justifyContent: 'center', width: '100%', px: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleCancelPending}
                    disabled={uploading}
                    sx={{ width: { xs: '100%', sm: 'auto' }, order: { xs: 2, sm: 1 } }}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleUploadConfirm}
                    disabled={uploading}
                    startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
                    sx={{ width: { xs: '100%', sm: 'auto' }, order: { xs: 1, sm: 2 } }}
                  >
                    {uploading ? t('safetyRules.uploading') : t('safetyRules.upload')}
                  </Button>
                </Box>
              </Box>
            ) : selectedFile && previewContent ? (
              // 기존 파일 미리보기
              <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                {(() => {
                  const ext = getFileExtension(selectedFile.originalFilename)
                  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)
                  const isPdfOrOffice = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)

                  if (previewContent === 'loading') {
                    return (
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                        <CircularProgress size={40} sx={{ mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">{t('safetyRules.loadingPreview')}</Typography>
                      </Box>
                    )
                  }

                  if (previewContent === 'error') {
                    return (
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                        <InsertDriveFileIcon sx={{ fontSize: 64, color: '#f44336', mb: 2 }} />
                        <Typography variant="body2" color="error">{t('safetyRules.previewLoadFailed')}</Typography>
                      </Box>
                    )
                  }

                  if (isImage && previewContent.startsWith('data:')) {
                    return (
                      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1, overflow: 'auto' }}>
                        <Box
                          component="img"
                          src={previewContent}
                          alt={selectedFile.originalFilename}
                          sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      </Box>
                    )
                  }

                  if (isPdfOrOffice && (previewContent.startsWith('data:') || previewContent.startsWith('blob:'))) {
                    // PDF 및 Office 문서 (PDF로 변환됨)
                    // 모바일에서는 iframe PDF 렌더링이 지원되지 않음
                    if (isMobile) {
                      return (
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                          <Box sx={{ fontSize: 64, mb: 2 }}>{getFileIcon(selectedFile)}</Box>
                          <Typography variant="body2" sx={{ mb: 1, textAlign: 'center', wordBreak: 'break-all' }}>
                            {selectedFile.originalFilename}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                            {formatFileSize(selectedFile.fileSize)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                            {t('safetyRules.mobilePreviewNotSupported')}
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleDownload(selectedFile)}
                            sx={{ mt: 2 }}
                          >
                            {t('common.download')}
                          </Button>
                        </Box>
                      )
                    }
                    // PC에서는 iframe으로 표시
                    return (
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <iframe
                          src={`${previewContent}#toolbar=0&navpanes=0&scrollbar=1`}
                          title={selectedFile.originalFilename}
                          style={{ width: '100%', height: '100%', border: 'none' }}
                        />
                      </Box>
                    )
                  }

                  // Unsupported file types
                  return (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                      <Box sx={{ fontSize: 64, mb: 2 }}>{getFileIcon(selectedFile)}</Box>
                      <Typography variant="body2" sx={{ mb: 1, textAlign: 'center', wordBreak: 'break-all' }}>
                        {selectedFile.originalFilename}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        {formatFileSize(selectedFile.fileSize)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('safetyRules.unsupportedPreview')}
                      </Typography>
                    </Box>
                  )
                })()}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <InsertDriveFileIcon sx={{ fontSize: 64, color: '#e0e0e0', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">{t('safetyRules.selectFileToPreview')}</Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

    </Box>
  )
}

export default SafetyRulesTab
