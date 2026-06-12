import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'
import { fmtPhone } from '../../utils/phoneFormat'
import { contractorRegistrationApi } from '../../api/contractorRegistrationApi'
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
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import DatePickerField from '../common/DatePickerField'
import { todayStr } from '../../utils/dateDefaults'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import SignaturePad from '../common/SignaturePad'
import SignatureImage from '../common/SignatureImage'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import axiosInstance from '../../api/axiosInstance'
import { oshCommitteeApi } from '../../api/oshCommitteeApi'
import { workplaceApi } from '../../api/workplaceApi'
import { OSHCommittee, OSHCommitteeRequest } from '../../types/oshCommittee.types'
import { ApiResponse, PageResponse, FileMetadata } from '../../types/common.types'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import LoadingOverlay from '../common/LoadingOverlay'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const fetchFiles = async (entityType: string, entityId: string): Promise<FileMetadata[]> => {
  const response = await axiosInstance.get<ApiResponse<FileMetadata[]>>(`/files/by-entity/${entityType}/${entityId}`)
  return response.data.data
}

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
const quarterOptions = ['전체', '1분기', '2분기', '3분기', '4분기']

const OshCommitteeTab: React.FC<{ menuPath?: string }> = ({
  menuPath = 'EHS 경영 › 커뮤니케이션 › 산업안전보건 위원회',
}) => {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { showSuccess, showConfirm, showError } = useAlert()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedCommittee, setSelectedCommittee] = useState<OSHCommittee | null>(null)

  // List filters
  const [yearFilter, setYearFilter] = useState<number | ''>('')
  const [quarterFilter, setQuarterFilter] = useState('전체')
  const [page, setPage] = useState(0)
  const rowsPerPage = 10

  // Form state
  const [formData, setFormData] = useState<OSHCommitteeRequest>({
    oshYear: currentYear,
    oshQuarter: 1,
    oshDate: '',
    oshLocation: '',
    oshLocationDetail: '',
    mainAgenda: '',
    comment: '',
  })
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  // userId === 0 일 때 외부 참석자로 처리. userEmail 은 unique placeholder 또는 사용자 이메일.
  const [pendingAttendees, setPendingAttendees] = useState<{ userId: number; userName: string; userEmail: string; phone?: string; company?: string; dept?: string; isExternal?: boolean; signatureImage?: string }[]>([])
  // 편집 모드에서 기존 참석자들의 서명만 새로 받아 백엔드로 전송 (key: attendee.id)
  const [existingSignatures, setExistingSignatures] = useState<Record<number, string>>({})
  // 외부 참석자 입력 다이얼로그 상태
  const [externalDialogOpen, setExternalDialogOpen] = useState(false)
  const [externalName, setExternalName] = useState('')
  const [externalCompany, setExternalCompany] = useState('')
  const [externalPhone, setExternalPhone] = useState('')
  // 저장 누르기 전까지 backend 로 보내지 않을 삭제 대기 ID 목록
  const [removedAttendeeIds, setRemovedAttendeeIds] = useState<number[]>([])
  // mutation onSuccess 가 stale closure 로 못 읽는 문제 방지
  const pendingAttendeesRef = useRef(pendingAttendees)
  useEffect(() => { pendingAttendeesRef.current = pendingAttendees }, [pendingAttendees])
  const pendingFilesRef = useRef(pendingFiles)
  useEffect(() => { pendingFilesRef.current = pendingFiles }, [pendingFiles])
  const removedAttendeeIdsRef = useRef(removedAttendeeIds)
  useEffect(() => { removedAttendeeIdsRef.current = removedAttendeeIds }, [removedAttendeeIds])
  const existingSignaturesRef = useRef(existingSignatures)
  useEffect(() => { existingSignaturesRef.current = existingSignatures }, [existingSignatures])

  // 참석자 추가 모달
  const [attendeeDialogOpen, setAttendeeDialogOpen] = useState(false)
  // 상세 화면 — 본인 서명 다이얼로그
  const [signDialogOpen, setSignDialogOpen] = useState(false)
  const [signingAttendeeId, setSigningAttendeeId] = useState<number | null>(null)
  const [tempSignature, setTempSignature] = useState('')
  const [signSaving, setSignSaving] = useState(false)
  // 이메일 서명 링크 발송 상태
  const [sendingLinks, setSendingLinks] = useState(false)
  const [linksSent, setLinksSent] = useState(false)

  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const myRoles = ['guest', ...(user?.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : [user?.role ?? ''].filter(Boolean))]
  const canNew    = canSee(menuPath, 'LIST',   'New', myRoles)
  const canEdit   = canSee(menuPath, 'DETAIL', '수정', myRoles)
  const canDel    = canSee(menuPath, 'DETAIL', '삭제', myRoles)
  const canNotify = canSee(menuPath, 'DETAIL', '참석자 서명 알림', myRoles)
  // DEBUG: 권한 확인용 — 문제 해결 후 제거
  if (import.meta.env.DEV) console.log('[OshCommitteeTab]', { menuPath, userRole: user?.role, myRoles, canNew })

  // Fetch locations from API
  const { data: locationsData } = useQuery({
    queryKey: ['workplaceSites'],
    queryFn: workplaceApi.getSites,
    staleTime: 1000 * 60 * 5,
  })
  const locations = locationsData || []

  // 등록된 협력업체 목록 (외부 참석자 소속업체 선택용)
  const { data: contractorRegPage } = useQuery({
    queryKey: ['contractorRegistrationsForOshExternal'],
    queryFn: () => contractorRegistrationApi.search({ regStatus: 'APPROVED', size: 200 }),
    staleTime: 1000 * 60 * 5,
  })
  const contractorRegs = contractorRegPage?.content || []

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: ['oshCommittees', page, yearFilter, quarterFilter],
    queryFn: () =>
      oshCommitteeApi.search({
        page,
        size: rowsPerPage,
        year: yearFilter || undefined,
        quarter: quarterFilter,
      }),
    enabled: viewMode === 'list',
  })

  const { data: committeeDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['oshCommitteeDetail', selectedCommittee?.id],
    queryFn: () => oshCommitteeApi.getById(selectedCommittee!.id),
    enabled: !!selectedCommittee?.id && (viewMode === 'detail' || viewMode === 'edit'),
  })

  const { data: committeeFiles } = useQuery({
    queryKey: ['oshCommitteeFiles', selectedCommittee?.oshId],
    queryFn: () => fetchFiles('OSH_COMMITTEE', selectedCommittee!.oshId),
    enabled: !!selectedCommittee?.oshId && viewMode === 'detail',
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: oshCommitteeApi.create,
    onSuccess: async (createdCommittee) => {
      const files = pendingFilesRef.current
      const attendees = pendingAttendeesRef.current
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('entityType', 'OSH_COMMITTEE')
        fd.append('entityId', createdCommittee.oshId)
        await axiosInstance.post('/files/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      if (attendees.length > 0) {
        await oshCommitteeApi.addAttendeesBulk(createdCommittee.id, attendees)
      }
      queryClient.invalidateQueries({ queryKey: ['oshCommittees'] })
      await showSuccess(t('common.saveSuccess'))
      handleBackToList()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (v: { id: number; data: OSHCommitteeRequest }) => oshCommitteeApi.update(v.id, v.data),
    onSuccess: async (updatedCommittee) => {
      const files = pendingFilesRef.current
      const attendees = pendingAttendeesRef.current
      const removed = removedAttendeeIdsRef.current
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('entityType', 'OSH_COMMITTEE')
        fd.append('entityId', updatedCommittee.oshId)
        await axiosInstance.post('/files/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      // 삭제 표시된 기존 참석자 일괄 DELETE
      for (const attendeeId of removed) {
        try {
          await oshCommitteeApi.deleteAttendee(updatedCommittee.id, attendeeId)
        } catch { /* 이미 삭제됐을 수도 있음 — 무시 */ }
      }
      if (attendees.length > 0) {
        await oshCommitteeApi.addAttendeesBulk(updatedCommittee.id, attendees)
      }
      // 기존 참석자 서명 업데이트 — removed 에 포함된 것은 제외
      const sigUpdates = existingSignaturesRef.current
      for (const [attendeeIdStr, signatureImage] of Object.entries(sigUpdates)) {
        const attendeeId = Number(attendeeIdStr)
        if (removed.includes(attendeeId)) continue
        try {
          await oshCommitteeApi.updateAttendeeSignature(updatedCommittee.id, attendeeId, signatureImage as string)
        } catch { /* skip */ }
      }
      queryClient.invalidateQueries({ queryKey: ['oshCommittees'] })
      queryClient.invalidateQueries({ queryKey: ['oshCommitteeDetail'] })
      await showSuccess(t('common.saveSuccess'))
      handleBackToList()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: oshCommitteeApi.delete,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['oshCommittees'] })
      await showSuccess(t('common.deleteSuccess'))
      handleBackToList()
    },
  })

  const isProcessing = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  // Handlers
  const handleBackToList = () => {
    setViewMode('list')
    setSelectedCommittee(null)
    setFormData({
      oshYear: currentYear,
      oshQuarter: 1,
      oshDate: '',
      oshLocation: '',
      oshLocationDetail: '',
      mainAgenda: '',
      comment: '',
    })
    setPendingFiles([])
    setPendingAttendees([])
    setRemovedAttendeeIds([])
    setExistingSignatures({})
  }

  const handleReset = () => {
    setYearFilter('')
    setQuarterFilter('전체')
    setPage(0)
  }

  const handleYearChange = (event: SelectChangeEvent<number | ''>) => {
    const value = event.target.value
    setYearFilter(value === '' ? '' : Number(value))
    setPage(0)
  }

  const handleQuarterChange = (event: SelectChangeEvent) => {
    setQuarterFilter(event.target.value)
    setPage(0)
  }

  const handleRowClick = (committee: OSHCommittee) => {
    setSelectedCommittee(committee)
    setLinksSent(false)
    setViewMode('detail')
  }

  const handleAddClick = () => {
    setSelectedCommittee(null)
    setFormData({
      oshYear: currentYear,
      oshQuarter: 1,
      oshDate: todayStr(),
      oshLocation: '',
      oshLocationDetail: '',
      mainAgenda: '',
      comment: '',
    })
    setPendingFiles([])
    setPendingAttendees([])
    setViewMode('create')
  }

  const handleEditClick = () => {
    if (!committeeDetail) return
    setFormData({
      oshYear: committeeDetail.oshYear || currentYear,
      oshQuarter: committeeDetail.oshQuarter || 1,
      oshDate: committeeDetail.oshDate ? committeeDetail.oshDate.split('T')[0] : '',
      oshLocation: committeeDetail.oshLocation || '',
      oshLocationDetail: committeeDetail.oshLocationDetail || '',
      mainAgenda: committeeDetail.mainAgenda || '',
      comment: committeeDetail.comment || '',
    })
    setPendingFiles([])
    setPendingAttendees([])
    setRemovedAttendeeIds([])
    setExistingSignatures({})
    setViewMode('edit')
  }

  const handleDeleteClick = async () => {
    const confirmed = await showConfirm(
      `${t('common.confirmDeleteMessage')}\n${t('common.deleteWarning')}`,
      { title: `${t('ehs.oshCommittee')} ${t('common.delete')}` }
    )
    if (confirmed && selectedCommittee) {
      deleteMutation.mutate(selectedCommittee.id)
    }
  }

  // 상세 화면 — 현재 로그인 사용자와 참석자 행 매칭
  const isMyRow = (attendee: any): boolean => {
    if (!user) return false
    const mail: string = attendee.attendeeMail || ''
    if (user.email && mail === user.email) return true
    if (user.username && mail.startsWith(user.username + '@')) return true
    return user.name === attendee.attendeeName
  }

  const handleSignClick = (attendeeId: number) => {
    setSigningAttendeeId(attendeeId)
    setTempSignature('')
    setSignDialogOpen(true)
  }

  const handleSignSave = async () => {
    if (!signingAttendeeId || !selectedCommittee) return
    setSignSaving(true)
    try {
      await oshCommitteeApi.updateAttendeeSignature(selectedCommittee.id, signingAttendeeId, tempSignature)
      queryClient.invalidateQueries({ queryKey: ['oshCommitteeDetail'] })
      setSignDialogOpen(false)
      await showSuccess('서명이 저장됐습니다.')
    } catch {
      showError('서명 저장에 실패했습니다.')
    } finally {
      setSignSaving(false)
    }
  }

  const handleSendSignLinks = async () => {
    if (!selectedCommittee) return
    const msg = linksSent
      ? '이미 발송했습니다. 다시 발송하겠습니까?'
      : '참석자들에게 이메일 서명 링크를 발송하시겠습니까?'
    const confirmed = await showConfirm(msg)
    if (!confirmed) return
    setSendingLinks(true)
    try {
      const message = await oshCommitteeApi.sendSignLinks(selectedCommittee.id)
      setLinksSent(true)
      await showSuccess(message)
    } catch {
      showError('서명 링크 발송에 실패했습니다.')
    } finally {
      setSendingLinks(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setPendingFiles((prev) => [...prev, ...Array.from(files)])
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

  const handleSubmit = async () => {
    const confirmed = await showConfirm(t('common.confirmSave'))
    if (!confirmed) return

    if (viewMode === 'create') {
      createMutation.mutate(formData)
    } else if (viewMode === 'edit' && selectedCommittee) {
      updateMutation.mutate({ id: selectedCommittee.id, data: formData })
    }
  }

  // 참석자 추가 — UserSelectModal 에서 다중 선택 후 확정
  const handleOpenAttendeeDialog = () => setAttendeeDialogOpen(true)

  const handleAttendeeConfirm = (users: UserInfo[]) => {
    setAttendeeDialogOpen(false)
    if (!users || users.length === 0) return

    const existingIds = new Set(pendingAttendees.map(a => a.userId))
    const additions = users
      .filter(u => !existingIds.has(u.id))
      .map(u => ({
        userId: u.id,
        userName: u.name,
        // 이메일 누락 시 unique placeholder — backend 가 attendeeMail 로 dedup
        userEmail: u.email || (u.username ? `${u.username}@hankook.com` : `user-${u.id}@hankook.com`),
        dept: u.department,
        phone: u.phone,
      }))
    if (additions.length === 0) return

    // 폼 저장 버튼을 눌러야 실제 backend 에 반영 — CREATE/EDIT 모두 pendingAttendees 에 보관
    setPendingAttendees(prev => [...prev, ...additions])
  }


  // 외부 참석자 추가 (이름·소속업체·전화번호)
  const handleOpenExternalDialog = () => {
    setExternalName('')
    setExternalCompany('')
    setExternalPhone('')
    setExternalDialogOpen(true)
  }
  const handleConfirmExternal = () => {
    const name = externalName.trim()
    const company = externalCompany.trim()
    const phone = externalPhone.trim()
    if (!name) { showError(t('common.fieldRequired', '이름은 필수입니다')); return }
    // userId 0 = 외부 참석자 마커. 같은 이름·전화 중복 방지를 위해 unique placeholder email 생성
    const placeholder = `ext-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@external`
    setPendingAttendees(prev => [...prev, {
      userId: 0,
      userName: name,
      userEmail: placeholder,
      phone,
      company,
      isExternal: true,
    }])
    setExternalDialogOpen(false)
  }

  // 기존 참석자 삭제는 즉시 backend 호출 X — 저장 시점에 일괄 DELETE
  const handleRemoveExistingAttendee = (attendeeId: number) => {
    setRemovedAttendeeIds(prev => prev.includes(attendeeId) ? prev : [...prev, attendeeId])
  }
  // 삭제 표시 되돌리기 (필요 시 사용)
  const handleRestoreExistingAttendee = (attendeeId: number) => {
    setRemovedAttendeeIds(prev => prev.filter(id => id !== attendeeId))
  }
  void handleRestoreExistingAttendee

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const committees = data?.content || []
  const totalPages = data?.totalPages || 0

  // ===== Render Functions =====

  const renderListView = () => (
    <>
      {/* Filters - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select value={yearFilter} onChange={handleYearChange} displayEmpty>
              <MenuItem value="">{t('common.year')}</MenuItem>
              {years.map((year) => (<MenuItem key={year} value={year}>{year}</MenuItem>))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select value={quarterFilter} onChange={handleQuarterChange} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              {quarterOptions.map((q) => (<MenuItem key={q} value={q}>{q}</MenuItem>))}
            </Select>
          </FormControl>
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
        </Box>
        {canNew && (
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick}>
            New
          </Button>
        )}
      </Box>

      {/* Filters - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <Select value={yearFilter} onChange={handleYearChange} displayEmpty>
              <MenuItem value="">{t('common.year')}</MenuItem>
              {years.map((year) => (<MenuItem key={year} value={year}>{year}</MenuItem>))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ flex: 1 }}>
            <Select value={quarterFilter} onChange={handleQuarterChange} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              {quarterOptions.map((q) => (<MenuItem key={q} value={q}>{q}</MenuItem>))}
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
        <Table size="small" sx={{ minWidth: 650, '& .MuiTableCell-root': { borderColor: 'divider' } }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold', width: 80, borderRight: 1, borderColor: 'divider' }} align="center">{t('common.year')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 80, borderRight: 1, borderColor: 'divider' }} align="center">{t('common.quarter')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 180, borderRight: 1, borderColor: 'divider' }} align="center">{t('common.date')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 100, borderRight: 1, borderColor: 'divider' }} align="center">{t('common.attendeeCount')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('common.mainAgenda')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {committees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">{t('ehsMessage.noMessages')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              committees.map((item) => (
                <TableRow key={item.id} hover onClick={() => handleRowClick(item)} sx={{ cursor: 'pointer' }}>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{item.oshYear}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{item.oshQuarter}{t('common.quarter')}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{formatDate(item.oshDate)}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{item.attendeeCount || 0}</TableCell>
                  <TableCell>{item.mainAgenda || ''}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile Card List */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
        {committees.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">{t('ehsMessage.noMessages')}</Typography>
          </Paper>
        ) : (
          committees.map((item) => (
            <Paper key={item.id} sx={{ p: 2, cursor: 'pointer', border: 1, borderColor: 'divider' }} onClick={() => handleRowClick(item)}>
              <Typography fontWeight="bold" sx={{ mb: 1 }}>{item.oshYear}년 {item.oshQuarter}분기</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('common.date')}</Typography>
                  <Typography variant="body2">{formatDate(item.oshDate)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('common.attendeeCount')}</Typography>
                  <Typography variant="body2">{item.attendeeCount || 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('common.mainAgenda')}</Typography>
                  <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.mainAgenda || ''}</Typography>
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
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      ) : committeeDetail ? (
        <>
          {/* PC용 레이아웃 */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            {/* 기본 정보 */}
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>{t('common.basicInfo')}</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, border: 1, borderColor: 'divider', overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 600, '& .MuiTableCell-root': { borderColor: 'divider', py: 1.5 } }}>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>{t('common.location')}</TableCell>
                    <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>
                      {committeeDetail.oshLocation}{committeeDetail.oshLocationDetail && ` - ${committeeDetail.oshLocationDetail}`}
                    </TableCell>
                    <TableCell sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>{t('common.date')}</TableCell>
                    <TableCell>{formatDate(committeeDetail.oshDate)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>{t('common.mainAgenda')}</TableCell>
                    <TableCell colSpan={3} sx={{ whiteSpace: 'pre-wrap' }}>{committeeDetail.mainAgenda || ''}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>{t('common.comment')}</TableCell>
                    <TableCell colSpan={3}>{committeeDetail.comment || ''}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>{t('common.attachments')}</TableCell>
                    <TableCell colSpan={3}>
                      {committeeFiles && committeeFiles.length > 0 ? (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {committeeFiles.map((file) => (
                            <Chip
                              key={file.id}
                              label={file.originalFilename}
                              size="small"
                              onClick={() => handleDownloadFile(file.id, file.originalFilename)}
                              sx={{
                                cursor: 'pointer',
                                maxWidth: '100%',
                                '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
                              }}
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">{t('common.noFile')}</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* 참석자 */}
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>{t('common.attendee')}</Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ border: 1, borderColor: 'divider', overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 400, '& .MuiTableCell-root': { borderColor: 'divider' } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', width: 170, whiteSpace: 'nowrap' }} align="center">{t('common.attendeeName')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }} align="center">{t('osh.deptOrCompany', '부서 / 소속업체')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', width: 140 }} align="center">{t('common.contact', '연락처')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 100 }} align="center">{t('common.signature', '서명')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(!committeeDetail.attendees || committeeDetail.attendees.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 2 }}>
                        <Typography color="text.secondary">{t('common.noAttendees')}</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    committeeDetail.attendees.map((attendee) => (
                      <TableRow key={attendee.id}>
                        <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider', width: 170, whiteSpace: 'nowrap' }}>
                          {attendee.attendeeName}
                          {(attendee as any).isExternal && (
                            <Chip size="small" label={t('osh.external', '외부')} color="warning" variant="outlined" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
                          )}
                        </TableCell>
                        <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>
                          {(attendee as any).isExternal
                            ? ((attendee as any).attendeeCompany || '')
                            : ((attendee as any).attendeeDept || '')}
                        </TableCell>
                        <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider', fontFamily: 'monospace', width: 140 }}>{(attendee as any).attendeePhone || ''}</TableCell>
                        <TableCell align="center" sx={{ p: 0.5 }}>
                          {isMyRow(attendee) ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                              {(attendee as any).signatureImage && (
                                <SignatureImage src={(attendee as any).signatureImage} alt="signature" maxHeight={60} maxWidth={180} style={{ display: 'block' }} />
                              )}
                              <Button size="small" variant="outlined" onClick={() => handleSignClick(attendee.id)}>
                                {(attendee as any).signatureImage ? '재서명' : '서명하기'}
                              </Button>
                            </Box>
                          ) : (
                            (attendee as any).signatureImage
                              ? <SignatureImage src={(attendee as any).signatureImage} alt="signature" maxHeight={60} maxWidth={180} style={{ display: 'block', margin: '0 auto' }} />
                              : ''
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
              <Button variant="outlined" onClick={handleBackToList} sx={{ width: 'auto' }}>{t('common.backToList')}</Button>
              {canNotify && (
                <Button variant="contained" color="info" onClick={handleSendSignLinks} disabled={sendingLinks} sx={{ width: 'auto' }}>
                  {sendingLinks ? '발송 중...' : '참석자 서명 알림'}
                </Button>
              )}
              {canEdit && (
                <Button variant="contained" onClick={handleEditClick} sx={{ width: 'auto' }}>{t('common.edit')}</Button>
              )}
              {canDel && (
                <Button variant="contained" color="error" onClick={handleDeleteClick} sx={{ width: 'auto' }}>{t('common.delete')}</Button>
              )}
            </Box>
          </Box>

          {/* 모바일용 레이아웃 */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {/* 기본 정보 */}
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>{t('common.basicInfo')}</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.location')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>
                  {committeeDetail.oshLocation}{committeeDetail.oshLocationDetail && ` - ${committeeDetail.oshLocationDetail}`}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.date')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{formatDate(committeeDetail.oshDate)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.mainAgenda')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>{committeeDetail.mainAgenda || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.comment')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{committeeDetail.comment || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.attachments')}</Typography>
                <Box sx={{ px: 1.5, py: 0.5 }}>
                  {committeeFiles && committeeFiles.length > 0 ? (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {committeeFiles.map((file) => (
                        <Chip
                          key={file.id}
                          label={file.originalFilename}
                          size="small"
                          onClick={() => handleDownloadFile(file.id, file.originalFilename)}
                          sx={{
                            cursor: 'pointer',
                            maxWidth: '100%',
                            '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
                          }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">{t('common.noFile')}</Typography>
                  )}
                </Box>
              </Box>
            </Box>

            {/* 참석자 */}
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>{t('common.attendee')}</Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {(!committeeDetail.attendees || committeeDetail.attendees.length === 0) ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>{t('common.noAttendees')}</Typography>
              ) : (
                committeeDetail.attendees.map((attendee) => {
                  const a = attendee as any
                  const deptOrCo = a.isExternal ? (a.attendeeCompany || '') : (a.attendeeDept || '')
                  return (
                    <Box key={attendee.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="body2" fontWeight={500}>{attendee.attendeeName}</Typography>
                          {a.isExternal && (
                            <Chip size="small" label={t('osh.external', '외부')} color="warning" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                          )}
                        </Box>
                        {(deptOrCo || a.attendeePhone) && (
                          <Typography variant="caption" color="text.secondary">
                            {deptOrCo}
                            {deptOrCo && a.attendeePhone ? ' · ' : ''}
                            {a.attendeePhone || ''}
                          </Typography>
                        )}
                      </Box>
                      {isMyRow(attendee) ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, ml: 1 }}>
                          {(attendee as any).signatureImage && (
                            <SignatureImage src={(attendee as any).signatureImage} alt="signature" maxHeight={40} maxWidth={120} />
                          )}
                          <Button size="small" variant="outlined" onClick={() => handleSignClick(attendee.id)}>
                            {(attendee as any).signatureImage ? '재서명' : '서명하기'}
                          </Button>
                        </Box>
                      ) : (
                        (attendee as any).signatureImage
                          ? <SignatureImage src={(attendee as any).signatureImage} alt="signature" maxHeight={40} maxWidth={120} style={{ marginLeft: 8 }} />
                          : null
                      )}
                    </Box>
                  )
                })
              )}
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1, mt: 3, flexWrap: 'wrap' }}>
              <Button variant="outlined" onClick={handleBackToList} sx={{ flex: 1 }}>{t('common.backToList')}</Button>
              {canNotify && (
                <Button variant="contained" color="info" onClick={handleSendSignLinks} disabled={sendingLinks} sx={{ flex: 1 }}>
                  {sendingLinks ? '발송 중...' : '참석자 서명 알림'}
                </Button>
              )}
              {canEdit && (
                <Button variant="contained" onClick={handleEditClick} sx={{ flex: 1 }}>{t('common.edit')}</Button>
              )}
              {canDel && (
                <Button variant="contained" color="error" onClick={handleDeleteClick} sx={{ flex: 1 }}>{t('common.delete')}</Button>
              )}
            </Box>
          </Box>
        </>
      ) : null}
    </>
  )

  const renderFormView = () => (
    <>
      <Box sx={{ mb: 3 }}>
        {/* 기본 정보 - 반응형 폼 레이아웃 */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>{t('common.basicInfo')}</Typography>
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple style={{ display: 'none' }}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.heic" />
        {/* 모바일 카메라 직접 촬영용 — capture="environment" 로 후면 카메라 호출 */}
        <input type="file" ref={cameraInputRef} onChange={handleFileSelect} style={{ display: 'none' }}
          accept="image/*" capture="environment" />

        {/* PC용 테이블 레이아웃 */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          {/* Row 1: 장소 | 날짜 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
              {t('common.location')}
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={formData.oshLocation}
                  onChange={(e) => setFormData({ ...formData, oshLocation: e.target.value })}
                  displayEmpty
                >
                  <MenuItem value="">{t('common.workplaceName')}</MenuItem>
                  {locations.map((loc) => (<MenuItem key={loc} value={loc}>{loc}</MenuItem>))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                placeholder={t('common.enterPlace')}
                value={formData.oshLocationDetail}
                onChange={(e) => setFormData({ ...formData, oshLocationDetail: e.target.value })}
                fullWidth
              />
            </Box>
            <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
              {t('common.date')}
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
              <DatePickerField
                value={formData.oshDate}
                onChange={(value) => setFormData({ ...formData, oshDate: value })}
              />
            </Box>
          </Box>

          {/* Row 2: 주요안건 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'flex-start', fontSize: '0.875rem', justifyContent: 'center', pt: 2, wordBreak: 'keep-all', textAlign: 'center' }}>
              {t('common.mainAgenda')}
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={3}
                placeholder={t('common.enterAgenda')}
                value={formData.mainAgenda}
                onChange={(e) => setFormData({ ...formData, mainAgenda: e.target.value })}
              />
            </Box>
          </Box>

          {/* Row 3: 코멘트 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'flex-start', fontSize: '0.875rem', justifyContent: 'center', pt: 2, wordBreak: 'keep-all', textAlign: 'center' }}>
              {t('common.comment')}
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                placeholder={t('common.enterComment')}
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              />
            </Box>
          </Box>

          {/* Row 4: 첨부파일 */}
          <Box sx={{ display: 'flex' }}>
            <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
              {t('common.attachments')}
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {pendingFiles.length === 0 ? (
                <Typography variant="body2" color="text.secondary">{t('common.noFile')}</Typography>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {pendingFiles.map((file, idx) => (
                    <Chip key={idx} label={file.name} size="small" onDelete={() => handleRemovePendingFile(idx)}
                      sx={{ maxWidth: '100%', '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }} />
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
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.location')}</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
              <FormControl size="small" fullWidth>
                <Select
                  value={formData.oshLocation}
                  onChange={(e) => setFormData({ ...formData, oshLocation: e.target.value })}
                  displayEmpty
                >
                  <MenuItem value="">{t('common.workplaceName')}</MenuItem>
                  {locations.map((loc) => (<MenuItem key={loc} value={loc}>{loc}</MenuItem>))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                placeholder={t('common.enterPlace')}
                value={formData.oshLocationDetail}
                onChange={(e) => setFormData({ ...formData, oshLocationDetail: e.target.value })}
                fullWidth
              />
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.date')}</Typography>
            <DatePickerField
              value={formData.oshDate}
              onChange={(value) => setFormData({ ...formData, oshDate: value })}
            />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.mainAgenda')}</Typography>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={3}
              placeholder={t('common.enterAgenda')}
              value={formData.mainAgenda}
              onChange={(e) => setFormData({ ...formData, mainAgenda: e.target.value })}
            />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.comment')}</Typography>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              placeholder={t('common.enterComment')}
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.attachments')}</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, px: 1.5, py: 0.5, minWidth: 0, maxWidth: '100%' }}>
              {pendingFiles.length === 0 ? (
                <Typography variant="body2" color="text.secondary">{t('common.noFile')}</Typography>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', minWidth: 0, width: '100%' }}>
                  {pendingFiles.map((file, idx) => (
                    <Chip key={idx} label={file.name} size="small" onDelete={() => handleRemovePendingFile(idx)}
                      sx={{ maxWidth: '100%', '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }} />
                  ))}
                </Box>
              )}
              {/* 액션 버튼 — 모바일 한 줄 50:50 분할 */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button fullWidth variant="outlined" startIcon={<AttachFileIcon />} onClick={() => fileInputRef.current?.click()}>
                  {t('common.attach')}
                </Button>
                <Button fullWidth variant="contained" startIcon={<PhotoCameraIcon />}
                  onClick={() => cameraInputRef.current?.click()}>
                  카메라
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* 참석자 섹션 - PDF 페이지 14 기준 */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="subtitle1" fontWeight="bold">{t('common.attendee')}</Typography>
          <Box sx={{ flex: 1 }} />
          <Button size="small" variant="outlined" startIcon={<PersonSearchIcon />} onClick={handleOpenAttendeeDialog}>
            {t('osh.addInternalAttendee', '내부직원 추가')}
          </Button>
        </Box>

        <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', width: '100%' }}>
          <Table size="small" sx={{ minWidth: 900, '& .MuiTableCell-root': { borderColor: 'divider', whiteSpace: 'nowrap' } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', width: 100, whiteSpace: 'nowrap' }} align="center">{t('common.attendeeName')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }} align="center">{t('osh.deptOrCompany', '부서 / 소속업체')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', width: 150, whiteSpace: 'nowrap' }} align="center">{t('common.contact', '연락처')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', width: 400 }} align="center">{t('common.signature', '서명')}</TableCell>
                <TableCell sx={{ width: 36, p: 0 }} align="center"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Existing attendees (for edit mode) — 삭제 표시된 것은 숨김 (실제 삭제는 저장 시) */}
              {viewMode === 'edit' && committeeDetail?.attendees
                ?.filter((attendee) => !removedAttendeeIds.includes(attendee.id))
                .map((attendee) => {
                  const a = attendee as any
                  const deptOrCo = a.isExternal ? (a.attendeeCompany || '') : (a.attendeeDept || '')
                  const currentSig = existingSignatures[attendee.id] ?? a.signatureImage ?? ''
                  return (
                    <TableRow key={`existing-${attendee.id}`}>
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider', width: 100, whiteSpace: 'nowrap' }}>
                        {attendee.attendeeName}
                        {a.isExternal && (
                          <Chip size="small" label={t('osh.external', '외부')} color="warning" variant="outlined" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{deptOrCo}</TableCell>
                      <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider', fontFamily: 'monospace', width: 150, whiteSpace: 'nowrap' }}>{a.attendeePhone || ''}</TableCell>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider', width: 400, p: 0.5 }}>
                        <SignaturePad
                          value={currentSig}
                          onChange={(v) => setExistingSignatures(prev => ({ ...prev, [attendee.id]: v }))}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ width: 36, p: 0 }}>
                        <IconButton size="small" onClick={() => handleRemoveExistingAttendee(attendee.id)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
              {/* Pending attendees */}
              {pendingAttendees.map((attendee, idx) => {
                const deptOrCo = attendee.isExternal ? (attendee.company || '') : (attendee.dept || '')
                return (
                  <TableRow key={`pending-${attendee.userId}-${idx}`}>
                    <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider', width: 100, whiteSpace: 'nowrap' }}>
                      {attendee.userName}
                      {attendee.isExternal && (
                        <Chip size="small" label={t('osh.external', '외부')} color="warning" variant="outlined" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{deptOrCo}</TableCell>
                    <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider', fontFamily: 'monospace', width: 150, whiteSpace: 'nowrap' }}>{attendee.phone || ''}</TableCell>
                    <TableCell sx={{ borderRight: 1, borderColor: 'divider', width: 400, p: 0.5 }}>
                      <SignaturePad
                        value={attendee.signatureImage || ''}
                        onChange={(v) => setPendingAttendees(prev => prev.map((p, i) => i === idx ? { ...p, signatureImage: v } : p))}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: 36, p: 0 }}>
                      <IconButton size="small" onClick={() => setPendingAttendees(prev => prev.filter((_, i) => i !== idx))}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )
              })}
              {(viewMode === 'create' && pendingAttendees.length === 0) ||
                (viewMode === 'edit'
                  && (!committeeDetail?.attendees
                    || committeeDetail.attendees.filter(a => !removedAttendeeIds.includes(a.id)).length === 0)
                  && pendingAttendees.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 2 }}>
                    <Typography color="text.secondary">{t('common.noAttendees')}</Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Form Actions */}
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, gap: 1, mt: 3, mb: 4 }}>
        <Button variant="outlined" onClick={viewMode === 'edit' ? () => setViewMode('detail') : handleBackToList} sx={{ flex: { xs: 1, sm: 'none' } }}>
          {t('common.cancel')}
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

      {/* 참석자 추가 — 프로젝트 공통 직원 선택 모달 */}
      <UserSelectModal
        open={attendeeDialogOpen}
        onClose={() => setAttendeeDialogOpen(false)}
        selectedUsers={[]}
        onConfirm={handleAttendeeConfirm}
        useCompanyTree
        title={t('common.attendeeAdd')}
      />

      {/* 본인 서명 다이얼로그 */}
      <Dialog open={signDialogOpen} onClose={() => setSignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>서명하기</DialogTitle>
        <DialogContent dividers>
          <SignaturePad value={tempSignature} onChange={setTempSignature} />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setSignDialogOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleSignSave} disabled={signSaving || !tempSignature}>
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 외부 참석자 입력 다이얼로그 — 프로젝트 공통 폼테이블 */}
      <Dialog open={externalDialogOpen} onClose={() => setExternalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('osh.addExternalAttendee', '외부직원 추가')}</DialogTitle>
        <DialogContent dividers>
          <FormTable>
            <FormRow>
              <FormLabel required>{t('common.name', '이름')}</FormLabel>
              <FormCell>
                <TextField
                  size="small"
                  fullWidth
                  value={externalName}
                  onChange={(e) => setExternalName(e.target.value)}
                  autoFocus
                />
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>{t('osh.company', '소속업체')}</FormLabel>
              <FormCell>
                <TextField
                  select
                  size="small"
                  fullWidth
                  value={externalCompany}
                  onChange={(e) => setExternalCompany(e.target.value)}
                  SelectProps={{ displayEmpty: true }}
                >
                  <MenuItem value="">선택하세요</MenuItem>
                  {contractorRegs.map(r => (
                    <MenuItem key={r.id} value={r.companyName}>{r.companyName}</MenuItem>
                  ))}
                </TextField>
              </FormCell>
            </FormRow>
            <FormRow last>
              <FormLabel>{t('common.contact', '연락처')}</FormLabel>
              <FormCell>
                <TextField
                  size="small"
                  fullWidth
                  value={externalPhone}
                  onChange={(e) => setExternalPhone(fmtPhone(e.target.value))}
                  placeholder="010-0000-0000"
                  inputProps={{ inputMode: 'numeric', maxLength: 13 }}
                />
              </FormCell>
            </FormRow>
          </FormTable>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setExternalDialogOpen(false)}>{t('common.cancel', '취소')}</Button>
          <Button variant="contained" onClick={handleConfirmExternal}>{t('common.add', '추가')}</Button>
        </DialogActions>
      </Dialog>

    </Box>
  )
}

export default OshCommitteeTab
