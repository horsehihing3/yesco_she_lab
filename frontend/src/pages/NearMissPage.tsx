import { useState, useRef, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  IconButton,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  MenuItem,
  Pagination,
  FormControl,
  Select,
  SelectChangeEvent,
  Grid,
  Card,
  CardMedia,
  RadioGroup,
  FormControlLabel,
  Radio,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Tabs,
  Tab,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import RefreshIcon from '@mui/icons-material/Refresh'
import DrawIcon from '@mui/icons-material/Draw'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import SearchIcon from '@mui/icons-material/Search'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import BusinessIcon from '@mui/icons-material/Business'
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'
import { useForm, Controller } from 'react-hook-form'
import DatePickerField from '../components/common/DatePickerField'
import { useAlert } from '../contexts/AlertContext'
import { nearMissApi } from '../api/nearMissApi'
import { fileApi } from '../api/fileApi'
import { floorDrawingApi } from '../api/floorDrawingApi'
import { FloorDrawing } from '../types/floorDrawing.types'
import { NearMiss, NearMissRequest, NearMissActionRequest, NearMissStatus } from '../types/nearMiss.types'
import useCodeMap from '../hooks/useCodeMap'
import UserSelectModal, { UserInfo } from '../components/common/UserSelectModal'
import DepartmentSelectModal from '../components/common/DepartmentSelectModal'
import DevTestFillButton from '../components/common/DevTestFillButton'
import { FileMetadata } from '../types/file.types'
import AccidentReportTab from '../components/ehs/AccidentReportTab'
import NearMissDashboardTab from '../components/ehs/NearMissDashboardTab'
import { useAuth } from '../context/AuthContext'

const statusColors: Record<NearMissStatus, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  REJECTED: 'error',
}


// 강도 등급 키
const intensityLevelKeys = [
  { value: 1, labelKey: 'nearMiss.intensityLevels.noImpact', descKey: 'nearMiss.intensityLevels.noDamage' },
  { value: 2, labelKey: 'nearMiss.intensityLevels.nonOccupational', descKey: 'nearMiss.intensityLevels.minorInjury' },
  { value: 3, labelKey: 'nearMiss.intensityLevels.occupational', descKey: 'nearMiss.intensityLevels.injuryRequiringLeave' },
  { value: 4, labelKey: 'nearMiss.intensityLevels.seriousAccident', descKey: 'nearMiss.intensityLevels.deathOrSerious' },
]

// 빈도 등급 키
const frequencyLevelKeys = [
  { value: 1, labelKey: 'nearMiss.frequencyLevels.rare', descKey: 'nearMiss.frequencyLevels.rarelyOccurs' },
  { value: 2, labelKey: 'nearMiss.frequencyLevels.sometimes', descKey: 'nearMiss.frequencyLevels.moderate' },
  { value: 3, labelKey: 'nearMiss.frequencyLevels.often', descKey: 'nearMiss.frequencyLevels.frequentlyOccurs' },
  { value: 4, labelKey: 'nearMiss.frequencyLevels.veryOften', descKey: 'nearMiss.frequencyLevels.constantlyOccurs' },
]

// 조치사항 인터페이스
interface MeasureItem {
  id: number
  content: string
  department: string
  responsible: string
  dueDate: string
  completedDate: string
}

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const NearMissPage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  useTheme()
  const { showConfirm, showSuccess, showError } = useAlert()
  const { user } = useAuth()
  // 저장 실패(검증 등) 시 원인을 사용자에게 표시 — 기존엔 onError가 없어 무반응이었음
  const showSaveError = (err: any) => {
    const fieldErrors = err?.response?.data?.data
    const detail = fieldErrors && typeof fieldErrors === 'object'
      ? Object.values(fieldErrors).join(', ')
      : (err?.response?.data?.message || '')
    showError(detail ? `저장에 실패했습니다: ${detail}` : '저장에 실패했습니다. 필수 항목을 확인해주세요.')
  }
  const { codeMap: statusKeys } = useCodeMap('NEAR_MISS_STATUS')
  // 사고 대응 4종 — 코드 그룹 (INCIDENT_RESP_*)
  const { codeList: incRespTypeList, codeMap: incRespTypeMap } = useCodeMap('INCIDENT_RESP_TYPE')
  const { codeList: incRespStatusList, codeMap: incRespStatusMap } = useCodeMap('INCIDENT_RESP_STATUS')
  const { codeList: incRespSeverityList, codeMap: incRespSeverityMap } = useCodeMap('INCIDENT_RESP_SEVERITY')
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'NEAR_MISS' | 'ACCIDENT' | 'REPORT'>((searchParams.get('incidentType') as 'DASHBOARD' | 'NEAR_MISS' | 'ACCIDENT' | 'REPORT') || 'NEAR_MISS')
  const [page, setPage] = useState(1)
  const [rowsPerPage] = useState(10)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [editingNearMiss, setEditingNearMiss] = useState<NearMiss | null>(null)
  const [viewNearMiss, setViewNearMiss] = useState<NearMiss | null>(null)
  const [siteFilter, setSiteFilter] = useState('')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const [markerPosition, setMarkerPosition] = useState<{ x: number; y: number } | null>(null)
  const [measures, setMeasures] = useState<MeasureItem[]>([])
  const [newMeasure, setNewMeasure] = useState({ content: '', department: '', responsible: '', dueDate: '' })
  const [responsibleModalOpen, setResponsibleModalOpen] = useState(false)
  const [selectedResponsible, setSelectedResponsible] = useState<UserInfo | null>(null)
  // 조치사항 담당부서 — 부서선택 모달
  const [actionDeptModalOpen, setActionDeptModalOpen] = useState(false)
  // 조치전/조치후 이미지 다중 등록 — overview files 와 동일한 패턴
  const [newBeforeFiles, setNewBeforeFiles] = useState<File[]>([])           // 신규 업로드용
  const [newBeforePreviews, setNewBeforePreviews] = useState<string[]>([])   // dataURL 미리보기
  const [existingBeforeFiles, setExistingBeforeFiles] = useState<FileMetadata[]>([])
  const [deletedBeforeFileIds, setDeletedBeforeFileIds] = useState<number[]>([])

  const [newAfterFiles, setNewAfterFiles] = useState<File[]>([])
  const [newAfterPreviews, setNewAfterPreviews] = useState<string[]>([])
  const [existingAfterFiles, setExistingAfterFiles] = useState<FileMetadata[]>([])
  const [deletedAfterFileIds, setDeletedAfterFileIds] = useState<number[]>([])
  const [overviewFiles, setOverviewFiles] = useState<File[]>([])
  const [existingOverviewFiles, setExistingOverviewFiles] = useState<FileMetadata[]>([])
  const [deletedOverviewFileIds, setDeletedOverviewFileIds] = useState<number[]>([])

  const drawingImageRef = useRef<HTMLImageElement>(null)
  const beforeFileRef = useRef<HTMLInputElement>(null)
  const afterFileRef = useRef<HTMLInputElement>(null)
  const beforeCameraRef = useRef<HTMLInputElement>(null)
  const afterCameraRef = useRef<HTMLInputElement>(null)
  const overviewFileRef = useRef<HTMLInputElement>(null)

  // Fetch floor drawings from API
  const { data: floorDrawingsData } = useQuery({
    queryKey: ['floorDrawings'],
    queryFn: () => floorDrawingApi.getAll(),
    staleTime: 1000 * 60 * 5,
  })
  const floorDrawings = floorDrawingsData || []
  const [selectedDrawing, setSelectedDrawing] = useState<FloorDrawing | null>(null)
  const [selectedDrawingImageIndex, setSelectedDrawingImageIndex] = useState(0)
  const [drawingSelectModalOpen, setDrawingSelectModalOpen] = useState(false)
  const [modalPreviewDrawingId, setModalPreviewDrawingId] = useState<number | null>(null)
  const [modalPreviewImageIndex, setModalPreviewImageIndex] = useState(0)

  // 건물(name) → 층(floor) 2단계 트리 데이터 — 도면 관리 화면과 동일 구조
  const drawingsByBuilding = useMemo(() => {
    const map = new Map<string, FloorDrawing[]>()
    for (const f of floorDrawings) {
      const key = f.name || '(미지정)'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(f)
    }
    const parseFloorNum = (s: string | undefined) => parseInt(String(s || '').replace(/[^\d-]/g, '')) || 0
    for (const list of map.values()) {
      list.sort((a, b) => {
        const na = parseFloorNum(a.floor)
        const nb = parseFloorNum(b.floor)
        if (na !== nb) return nb - na  // 위층부터 노출 (도면 관리와 동일)
        return (a.floor || '').localeCompare(b.floor || '')
      })
    }
    return Array.from(map.entries())
  }, [floorDrawings])

  const [expandedBuildingsModal, setExpandedBuildingsModal] = useState<string[]>([])
  useEffect(() => {
    if (drawingSelectModalOpen) {
      setExpandedBuildingsModal(drawingsByBuilding.map(([b]) => `b-${b}`))
    }
  }, [drawingSelectModalOpen, drawingsByBuilding])

  // Fetch selected drawing's images
  const { data: drawingImageFiles, isLoading: isLoadingDrawingImage } = useQuery({
    queryKey: ['floorDrawingImages', selectedDrawing?.id],
    queryFn: () => floorDrawingApi.getImages(selectedDrawing!.id),
    enabled: !!selectedDrawing?.id,
  })
  const drawingImageUrl = drawingImageFiles && drawingImageFiles.length > selectedDrawingImageIndex
    ? `/api/files/${drawingImageFiles[selectedDrawingImageIndex].id}`
    : (drawingImageFiles && drawingImageFiles.length > 0 ? `/api/files/${drawingImageFiles[0].id}` : null)

  // Modal preview drawing images
  const { data: modalPreviewImages } = useQuery({
    queryKey: ['floorDrawingImages', modalPreviewDrawingId],
    queryFn: () => floorDrawingApi.getImages(modalPreviewDrawingId!),
    enabled: !!modalPreviewDrawingId,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['nearMisses', page - 1, rowsPerPage, activeTab],
    queryFn: () => nearMissApi.listByType(activeTab, page - 1, rowsPerPage),
    enabled: activeTab !== 'REPORT' && activeTab !== 'DASHBOARD',
  })

  const { register, handleSubmit, reset, control, setValue, getValues } = useForm<NearMissRequest>()

  // DEV ONLY — 비어있는 항목을 아차사고 더미데이터로 채움 (입력값·발생장소·작성자 보존)
  const fillTestData = () => {
    const v = getValues()
    if (!v.occTitle) setValue('occTitle', '계단 이동 중 미끄러짐 아차사고')
    if (!v.occInfo) setValue('occInfo', '우천으로 젖은 계단을 내려가던 중 미끄러질 뻔하였으나 난간을 잡아 사고를 면함. 미끄럼 방지 패드 부재가 원인으로 추정됨.')
    if (!v.occSiteInfo) setValue('occSiteInfo', '본관 동측 비상계단 3층~2층 구간')
    if (!v.company) setValue('company', '예스코')
    // 사고 대응 분류 — 비상유형/상태/심각도 (코드 목록 첫 항목)
    if (!v.emergencyType && incRespTypeList[0]) setValue('emergencyType', incRespTypeList[0].code)
    if (!v.responseStatus && incRespStatusList[0]) setValue('responseStatus', incRespStatusList[0].code)
    if (!v.severity && incRespSeverityList[0]) setValue('severity', incRespSeverityList[0].code)
  }

  const createMutation = useMutation({
    mutationFn: (data: NearMissRequest) => nearMissApi.create(data),
    onSuccess: async (created) => {
      await uploadImages(created.nearMissId)
      queryClient.invalidateQueries({ queryKey: ['nearMisses'] })
      await showSuccess(t('common.saveSuccess'))
      handleBackToList()
    },
    onError: showSaveError,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: NearMissRequest }) => nearMissApi.update(id, data),
    onSuccess: async (updated) => {
      await uploadImages(updated.nearMissId)
      queryClient.invalidateQueries({ queryKey: ['nearMisses'] })
      await showSuccess(t('common.saveSuccess'))
      handleBackToList()
    },
    onError: showSaveError,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => nearMissApi.remove(id),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['nearMisses'] })
      await showSuccess(t('common.deleteSuccess'))
      handleBackToList()
    },
  })

  // 도면 이미지 클릭으로 위치 표시
  const handleDrawingImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    // 마커가 부모 컨테이너(position:relative) 기준 %로 배치되므로 컨테이너 기준으로 계산
    const container = e.currentTarget.parentElement
    if (!container) return
    const rect = container.getBoundingClientRect()

    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setMarkerPosition({ x, y })
  }

  const handleReset = () => {
    setSiteFilter('')
    setStartDateFilter('')
    setEndDateFilter('')
  }

  // 필터링된 데이터
  const filteredContent = useMemo(() => {
    if (!data?.content) return []
    return data.content.filter((item) => {
      // 사업장 필터 (siteFilter는 floorDrawing id)
      if (siteFilter) {
        const drawing = floorDrawings.find((d) => d.id.toString() === siteFilter)
        if (drawing) {
          const matchSite = item.occSite === drawing.site
          const matchFloor = !drawing.floor || item.occFloor === drawing.floor
          if (!matchSite || !matchFloor) return false
        }
      }
      // 날짜 범위 필터
      if (startDateFilter && item.occDate) {
        if (item.occDate < startDateFilter) return false
      }
      if (endDateFilter && item.occDate) {
        if (item.occDate > endDateFilter + 'T23:59:59') return false
      }
      return true
    })
  }, [data?.content, siteFilter, startDateFilter, endDateFilter, floorDrawings])

  const handleSiteChange = (event: SelectChangeEvent<string>) => {
    setSiteFilter(event.target.value)
  }

  const handleBackToList = () => {
    setViewMode('list')
    setEditingNearMiss(null)
    setViewNearMiss(null)
    setMarkerPosition(null)
    setMeasures([])
    setNewBeforeFiles([]); setNewBeforePreviews([]); setExistingBeforeFiles([]); setDeletedBeforeFileIds([])
    setNewAfterFiles([]); setNewAfterPreviews([]); setExistingAfterFiles([]); setDeletedAfterFileIds([])
    setOverviewFiles([])
    setExistingOverviewFiles([])
    setDeletedOverviewFileIds([])
    setSelectedDrawing(null)
    setSelectedDrawingImageIndex(0)
    reset({})
  }

  const handleNewClick = () => {
    setMarkerPosition(null)
    setMeasures([])
    setNewBeforeFiles([]); setNewBeforePreviews([]); setExistingBeforeFiles([]); setDeletedBeforeFileIds([])
    setNewAfterFiles([]); setNewAfterPreviews([]); setExistingAfterFiles([]); setDeletedAfterFileIds([])
    setOverviewFiles([])
    setExistingOverviewFiles([])
    setDeletedOverviewFileIds([])
    setSelectedDrawing(null)
    setSelectedDrawingImageIndex(0)
    setEditingNearMiss(null)
    reset({
      incidentType: (activeTab === 'NEAR_MISS' || activeTab === 'ACCIDENT') ? activeTab : 'NEAR_MISS',
      occTitle: '',
      occInfo: '',
      occSite: '',
      occSiteInfo: '',
      company: '',
      authorName: user?.name || '',
      authorEmail: user?.email || '',
      authorDept: user?.department || '',
      status: 'PENDING',
      emergencyType: '',
      responseStatus: '',
      isDrill: false,
      severity: '',
      occDate: '',
      occHour: '10',
      occMinute: '00',
    })
    setViewMode('create')
  }

  const handleEditClick = (nearMiss: NearMiss) => {
    setEditingNearMiss(nearMiss)
    // 수정 시 floor drawing 찾기 (site명 + floor로 매칭)
    const drawing = floorDrawings.find((d) => d.site === nearMiss.occSite && d.floor === nearMiss.occFloor)
    setSelectedDrawing(drawing || null)
    setSelectedDrawingImageIndex(0)
    // 마커 위치 로드
    if (nearMiss.occSiteX != null && nearMiss.occSiteY != null) {
      setMarkerPosition({ x: nearMiss.occSiteX, y: nearMiss.occSiteY })
    } else {
      setMarkerPosition(null)
    }
    reset({
      incidentType: nearMiss.incidentType || ((activeTab === 'NEAR_MISS' || activeTab === 'ACCIDENT') ? activeTab : 'NEAR_MISS'),
      occTitle: nearMiss.occTitle,
      occInfo: nearMiss.occInfo,
      occSite: nearMiss.occSite,
      occSiteInfo: nearMiss.occSiteInfo,
      company: nearMiss.company,
      authorName: nearMiss.authorName,
      authorEmail: nearMiss.authorEmail,
      authorDept: nearMiss.authorDept,
      intensity: nearMiss.intensity,
      frequency: nearMiss.frequency,
      status: nearMiss.status,
      emergencyType: nearMiss.emergencyType || '',
      responseStatus: nearMiss.responseStatus || '',
      isDrill: nearMiss.isDrill || false,
      severity: nearMiss.severity || '',
      // 발생일시(LocalDateTime) → 날짜/시/분 분리 복원
      occDate: nearMiss.occDate ? nearMiss.occDate.substring(0, 10) : '',
      occHour: nearMiss.occDate && nearMiss.occDate.length >= 13 ? nearMiss.occDate.substring(11, 13) : '10',
      occMinute: nearMiss.occDate && nearMiss.occDate.length >= 16 ? nearMiss.occDate.substring(14, 16) : '00',
    })
    // 기존 조치사항 로드
    if (nearMiss.actions && nearMiss.actions.length > 0) {
      setMeasures(nearMiss.actions.map((a) => ({
        id: a.id,
        content: a.improvementMeasures || '',
        department: a.manageDept || '',
        responsible: a.responsiblePerson || '',
        dueDate: a.planDate ? formatDate(a.planDate) : '',
        completedDate: a.completeDate ? formatDate(a.completeDate) : '',
      })))
    } else {
      setMeasures([])
    }
    // 기존 이미지 로드
    setNewBeforeFiles([]); setNewBeforePreviews([]); setExistingBeforeFiles([]); setDeletedBeforeFileIds([])
    setNewAfterFiles([]); setNewAfterPreviews([]); setExistingAfterFiles([]); setDeletedAfterFileIds([])
    setOverviewFiles([])
    setExistingOverviewFiles([])
    setDeletedOverviewFileIds([])
    if (nearMiss.nearMissId) {
      loadExistingImages(nearMiss.nearMissId)
    }
    setViewMode('edit')
  }

  const handleRowClick = async (nearMiss: NearMiss) => {
    let detail = nearMiss
    try {
      detail = await nearMissApi.getById(nearMiss.id)
      setViewNearMiss(detail)
    } catch {
      setViewNearMiss(nearMiss)
    }
    // 도면 매칭
    const drawing = floorDrawings.find((d) => d.site === detail.occSite && d.floor === detail.occFloor)
    setSelectedDrawing(drawing || null)
    setSelectedDrawingImageIndex(0)
    // 마커 위치 로드
    if (detail.occSiteX != null && detail.occSiteY != null) {
      setMarkerPosition({ x: detail.occSiteX, y: detail.occSiteY })
    } else {
      setMarkerPosition(null)
    }
    // 이미지 로드
    setNewBeforeFiles([]); setNewBeforePreviews([]); setExistingBeforeFiles([])
    setNewAfterFiles([]); setNewAfterPreviews([]); setExistingAfterFiles([])
    setExistingOverviewFiles([])
    if (nearMiss.nearMissId) {
      loadExistingImages(nearMiss.nearMissId)
    }
    setViewMode('detail')
  }

  const onSubmit = async (formData: NearMissRequest) => {
    // 필수 항목 체크 — 발생일시 / 발생장소 / 발생개요
    const missing: string[] = []
    if (!formData.occDate) missing.push('발생일시')
    if (!formData.occSite) missing.push('발생장소')
    if (!formData.occInfo) missing.push('발생개요')
    if (missing.length > 0) {
      showError(`다음 필수 항목을 입력해주세요: ${missing.join(', ')}`)
      return
    }
    const confirmed = await showConfirm(t('common.confirmSave'))
    if (!confirmed) return

    const actions: NearMissActionRequest[] = measures.map((m) => ({
      improvementMeasures: m.content,
      manageDept: m.department,
      responsiblePerson: m.responsible,
      planDate: m.dueDate || undefined,
      completeDate: m.completedDate || undefined,
    }))
    const currentImageFileId = drawingImageFiles && drawingImageFiles.length > selectedDrawingImageIndex
      ? drawingImageFiles[selectedDrawingImageIndex].id
      : undefined
    // 발생일시: 날짜(occDate) + 시(occHour) + 분(occMinute) → LocalDateTime 으로 결합
    const occDateTime = formData.occDate
      ? `${formData.occDate}T${formData.occHour || '00'}:${formData.occMinute || '00'}:00`
      : undefined
    const payload = {
      ...formData,
      occDate: occDateTime,
      actions,
      occSiteX: markerPosition?.x ?? undefined,
      occSiteY: markerPosition?.y ?? undefined,
      occImageFileId: currentImageFileId,
    }
    if (editingNearMiss) {
      updateMutation.mutate({ id: editingNearMiss.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const getResponsibleDisplayName = (user: UserInfo | null) => {
    if (!user) return ''
    if (i18n.language === 'en') return user.nameEn || user.name
    if (i18n.language === 'zh') return user.nameZh || user.name
    return user.name
  }

  const handleResponsibleConfirm = (users: UserInfo[]) => {
    if (users.length > 0) {
      const user = users[0]
      setSelectedResponsible(user)
      setNewMeasure({ ...newMeasure, responsible: getResponsibleDisplayName(user) })
    }
  }

  const handleAddMeasure = () => {
    if (!newMeasure.content) return
    setMeasures([
      ...measures,
      {
        id: Date.now(),
        content: newMeasure.content,
        department: newMeasure.department,
        responsible: selectedResponsible ? getResponsibleDisplayName(selectedResponsible) : newMeasure.responsible,
        dueDate: newMeasure.dueDate,
        completedDate: '',
      },
    ])
    setNewMeasure({ content: '', department: '', responsible: '', dueDate: '' })
    setSelectedResponsible(null)
  }

  const handleRemoveMeasure = (id: number) => {
    setMeasures(measures.filter((m) => m.id !== id))
  }

  const handleImageUpload = (type: 'before' | 'after', e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // 각 파일을 dataURL 로 변환 후 state 에 추가
    Promise.all(files.map(file => new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = (ev) => resolve(ev.target?.result as string)
      reader.readAsDataURL(file)
    }))).then(previews => {
      if (type === 'before') {
        setNewBeforeFiles(prev => [...prev, ...files])
        setNewBeforePreviews(prev => [...prev, ...previews])
      } else {
        setNewAfterFiles(prev => [...prev, ...files])
        setNewAfterPreviews(prev => [...prev, ...previews])
      }
    })

    // 같은 파일 재선택 가능하도록 input value 초기화
    e.target.value = ''
  }

  // 기존(서버) 이미지 삭제 — 삭제 큐에 ID 추가
  const handleRemoveExistingImage = (type: 'before' | 'after', fileId: number) => {
    if (type === 'before') {
      setExistingBeforeFiles(prev => prev.filter(f => f.id !== fileId))
      setDeletedBeforeFileIds(prev => [...prev, fileId])
    } else {
      setExistingAfterFiles(prev => prev.filter(f => f.id !== fileId))
      setDeletedAfterFileIds(prev => [...prev, fileId])
    }
  }

  // 신규 업로드 대기 이미지 삭제 — 인덱스로 제거
  const handleRemoveNewImage = (type: 'before' | 'after', idx: number) => {
    if (type === 'before') {
      setNewBeforeFiles(prev => prev.filter((_, i) => i !== idx))
      setNewBeforePreviews(prev => prev.filter((_, i) => i !== idx))
    } else {
      setNewAfterFiles(prev => prev.filter((_, i) => i !== idx))
      setNewAfterPreviews(prev => prev.filter((_, i) => i !== idx))
    }
  }

  const uploadImages = async (nearMissId: string) => {
    for (const fid of deletedBeforeFileIds) {
      try { await fileApi.remove(fid) } catch { /* ignore */ }
    }
    for (const fid of deletedAfterFileIds) {
      try { await fileApi.remove(fid) } catch { /* ignore */ }
    }
    for (const file of newBeforeFiles) {
      await fileApi.upload('NEAR_MISS_BEFORE', nearMissId, file)
    }
    for (const file of newAfterFiles) {
      await fileApi.upload('NEAR_MISS_AFTER', nearMissId, file)
    }
    for (const fileId of deletedOverviewFileIds) {
      try { await fileApi.remove(fileId) } catch { /* ignore */ }
    }
    for (const file of overviewFiles) {
      await fileApi.upload('NEAR_MISS_OVERVIEW', nearMissId, file)
    }
  }

  const loadExistingImages = async (nearMissId: string) => {
    try {
      const [beforeFiles, afterFiles, overviewFilesList] = await Promise.all([
        fileApi.listByEntity('NEAR_MISS_BEFORE', nearMissId),
        fileApi.listByEntity('NEAR_MISS_AFTER', nearMissId),
        fileApi.listByEntity('NEAR_MISS_OVERVIEW', nearMissId),
      ])
      setExistingBeforeFiles(beforeFiles)
      setExistingAfterFiles(afterFiles)
      setExistingOverviewFiles(overviewFilesList)
    } catch {
      // ignore
    }
  }

  // drawingImageFiles 로드 후 저장된 occImageFileId에 맞는 이미지 인덱스 자동 설정
  const targetOccImageFileId = viewNearMiss?.occImageFileId ?? editingNearMiss?.occImageFileId
  useEffect(() => {
    if (!drawingImageFiles || drawingImageFiles.length === 0 || !targetOccImageFileId) return
    const idx = drawingImageFiles.findIndex((f: FileMetadata) => f.id === targetOccImageFileId)
    if (idx >= 0 && idx !== selectedDrawingImageIndex) {
      setSelectedDrawingImageIndex(idx)
    }
  }, [drawingImageFiles, targetOccImageFileId])

  // 도면 선택 모달 열기
  const handleOpenDrawingSelectModal = () => {
    setModalPreviewDrawingId(selectedDrawing?.id || (floorDrawings.length > 0 ? floorDrawings[0].id : null))
    setModalPreviewImageIndex(0)
    setDrawingSelectModalOpen(true)
  }

  // 모달에서 도면 선택 확인
  const handleConfirmDrawingSelect = () => {
    const drawing = floorDrawings.find((d) => d.id === modalPreviewDrawingId)
    if (drawing) {
      setSelectedDrawing(drawing)
      setSelectedDrawingImageIndex(modalPreviewImageIndex)
      setMarkerPosition(null)
      // 폼 필드에 값 설정 (create/edit 모드일 때만)
      if (viewMode === 'create' || viewMode === 'edit') {
        setValue('occSite', drawing.site)
        setValue('occFloor', drawing.floor || '')
        setValue('workPlaceId', drawing.workPlaceId)
      }
    }
    setDrawingSelectModalOpen(false)
  }

  const handleOverviewFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const MAX_FILE_SIZE = 30 * 1024 * 1024 // 30MB
    const MAX_FILES = 5

    const newFiles: File[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > MAX_FILE_SIZE) {
        continue // 30MB 초과 파일은 무시
      }
      newFiles.push(file)
    }

    // 최대 5개 제한
    const totalFiles = [...overviewFiles, ...newFiles].slice(0, MAX_FILES)
    setOverviewFiles(totalFiles)

    // input 초기화
    e.target.value = ''
  }

  const handleRemoveOverviewFile = (index: number) => {
    setOverviewFiles(overviewFiles.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    return new Date(dateString).toISOString().substring(0, 10)
  }

  const totalPages = data ? Math.ceil(data.totalElements / rowsPerPage) : 0

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">{t('nearMiss.loadFailed')}</Alert>
  }

  // 목록 화면
  const renderListView = () => (
    <Box sx={{ overflow: 'hidden' }}>
      {/* Filters - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select value={siteFilter} onChange={handleSiteChange} displayEmpty>
              <MenuItem value="">{t('nearMiss.occSite')}</MenuItem>
              {floorDrawings.map((drawing) => (
                <MenuItem key={drawing.id} value={drawing.id.toString()}>
                  {drawing.site}{drawing.floor ? ` - ${drawing.floor}` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <DatePickerField
            label=""
            value={startDateFilter}
            onChange={setStartDateFilter}
            placeholder={t('common.periodOccurrence')}
            size="small"
          />
          <Typography>~</Typography>
          <DatePickerField
            label=""
            value={endDateFilter}
            onChange={setEndDateFilter}
            placeholder={t('common.periodOccurrence')}
            size="small"
          />
          <IconButton onClick={handleReset} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleNewClick}>
          New
        </Button>
      </Box>

      {/* Filters - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, mb: 2 }}>
        <FormControl size="small" fullWidth>
          <Select value={siteFilter} onChange={handleSiteChange} displayEmpty>
            <MenuItem value="">{t('nearMiss.occSite')}</MenuItem>
            {floorDrawings.map((drawing) => (
              <MenuItem key={drawing.id} value={drawing.id.toString()}>
                {drawing.site}{drawing.floor ? ` - ${drawing.floor}` : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <DatePickerField
            label=""
            value={startDateFilter}
            onChange={setStartDateFilter}
            placeholder={t('common.startDate')}
            size="small"
          />
          <Typography>~</Typography>
          <DatePickerField
            label=""
            value={endDateFilter}
            onChange={setEndDateFilter}
            placeholder={t('common.endDate')}
            size="small"
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" onClick={handleReset} startIcon={<RefreshIcon />} sx={{ flex: 1 }}>{t('common.reset')}</Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleNewClick} sx={{ flex: 1 }}>New</Button>
        </Box>
      </Box>

      {/* Table - PC */}
      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 900, '& .MuiTableCell-root': { borderColor: 'divider' } }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold', width: 140, borderRight: 1, borderColor: 'divider' }} align="center">{t('nearMiss.occWorkplace')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 80, borderRight: 1, borderColor: 'divider' }} align="center">{t('nearMiss.author')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 100, borderRight: 1, borderColor: 'divider' }} align="center">{t('nearMiss.department')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 110, borderRight: 1, borderColor: 'divider' }} align="center">{t('nearMiss.occDateTime')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 80, borderRight: 1, borderColor: 'divider' }} align="center">{t('nearMiss.progressStatus')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 80, borderRight: 1, borderColor: 'divider' }} align="center">{t('nearMiss.manager')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 100, borderRight: 1, borderColor: 'divider' }} align="center">{t('nearMiss.scheduledDate')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 100 }} align="center">{t('nearMiss.completedDate')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredContent.map((nearMiss) => (
              <TableRow key={nearMiss.id} hover onClick={() => handleRowClick(nearMiss)} sx={{ cursor: 'pointer' }}>
                <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{nearMiss.occSite ? `${nearMiss.occSite}${nearMiss.occFloor ? ` - ${nearMiss.occFloor}` : ''}` : nearMiss.workPlaceName || ''}</TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{nearMiss.authorName || ''}</TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{nearMiss.authorDept || ''}</TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{formatDate(nearMiss.createdAt)}</TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>
                  <Chip label={statusKeys[nearMiss.status] || nearMiss.status} size="small" color={statusColors[nearMiss.status]} />
                </TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{nearMiss.managerName || ''}</TableCell>
                <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{nearMiss.dueDate ? formatDate(nearMiss.dueDate) : ''}</TableCell>
                <TableCell align="center">{nearMiss.completedDate ? formatDate(nearMiss.completedDate) : ''}</TableCell>
              </TableRow>
            ))}
            {filteredContent.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">{t('nearMiss.noNearMiss')}</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile Card List */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
        {filteredContent.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">{t('nearMiss.noNearMiss')}</Typography>
          </Paper>
        ) : (
          filteredContent.map((nearMiss) => (
            <Paper key={nearMiss.id} sx={{ p: 2, cursor: 'pointer', border: 1, borderColor: 'divider' }} onClick={() => handleRowClick(nearMiss)}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', mb: 1 }}>
                <Chip label={statusKeys[nearMiss.status] || nearMiss.status} size="small" color={statusColors[nearMiss.status]} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('nearMiss.occWorkplace')}</Typography>
                  <Typography variant="body2">{nearMiss.occSite ? `${nearMiss.occSite}${nearMiss.occFloor ? ` - ${nearMiss.occFloor}` : ''}` : nearMiss.workPlaceName || ''}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('nearMiss.author')}</Typography>
                  <Typography variant="body2">{nearMiss.authorName || ''} ({nearMiss.authorDept || ''})</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('nearMiss.occDateTime')}</Typography>
                  <Typography variant="body2">{formatDate(nearMiss.createdAt)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 60 }}>{t('nearMiss.manager')}</Typography>
                  <Typography variant="body2">{nearMiss.managerName || ''}</Typography>
                </Box>
              </Box>
            </Paper>
          ))
        )}
      </Box>

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination count={totalPages || 1} page={page || 1} onChange={(_, newPage) => setPage(newPage)} color="primary" />
      </Box>
    </Box>
  )

  // 상세 보기 화면
  const renderDetailView = () => {
    if (!viewNearMiss) return null

    return (
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">{t(`nearMiss.nearMissInfoByType.${viewNearMiss.incidentType || activeTab}`)}</Typography>
          <Chip label={statusKeys[viewNearMiss.status] || viewNearMiss.status} color={statusColors[viewNearMiss.status]} />
        </Box>

        {/* 아차사고/사고 정보 */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'text.primary' }}>
          {t(`nearMiss.nearMissInfoByType.${viewNearMiss.incidentType || activeTab}`)}
        </Typography>
        <Box sx={{ mb: 3 }}>
          {/* PC용 테이블 레이아웃 */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
              {/* Row 0: 발생일시 | 성명 | 소속 */}
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 1, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                  {t('nearMiss.occDateTimeLabel')}
                </Typography>
                <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>
                  {formatDate(viewNearMiss.createdAt)}
                </Typography>
                <Typography sx={{ width: 80, minWidth: 80, fontWeight: 'bold', bgcolor: 'grey.100', px: 1, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                  {t('nearMiss.name')}
                </Typography>
                <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>
                  {viewNearMiss.authorName || ''}
                </Typography>
                <Typography sx={{ width: 80, minWidth: 80, fontWeight: 'bold', bgcolor: 'grey.100', px: 1, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                  {t('nearMiss.department')}
                </Typography>
                <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>
                  {viewNearMiss.authorDept || ''}
                </Typography>
              </Box>
              {/* Row 2-3: 발생장소 + 발생개요 (왼쪽) / 도면 영역 (오른쪽) */}
              <Box sx={{ display: 'flex' }}>
                {/* 왼쪽 영역: 발생장소 + 발생개요 */}
                <Box sx={{ flex: 1, borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
                  {/* 발생장소 */}
                  <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                    <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 1, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                      {t('nearMiss.occLocation')}
                    </Typography>
                    <Typography sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', fontSize: '0.875rem' }}>
                      {viewNearMiss.occSite}{viewNearMiss.occFloor ? ` - ${viewNearMiss.occFloor}` : ''} {viewNearMiss.occSiteInfo || ''}
                    </Typography>
                  </Box>
                  {/* 발생개요 */}
                  <Box sx={{ display: 'flex', flex: 1 }}>
                    <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 1, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'flex-start', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                      {t('nearMiss.occOverview')}
                    </Typography>
                    <Box sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper' }}>
                      <Typography sx={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                        {viewNearMiss.occInfo || t('nearMiss.noContent')}
                      </Typography>
                      {existingOverviewFiles.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                          {existingOverviewFiles.map((file) => (
                            <Chip
                              key={file.id}
                              label={file.originalFilename}
                              size="small"
                              component="a"
                              href={`/api/files/${file.id}`}
                              target="_blank"
                              clickable
                              sx={{ maxWidth: 250, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
                {/* 오른쪽 영역: 도면 이미지 */}
                <Box sx={{ width: '50%', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 1 }}>
                  {isLoadingDrawingImage ? (
                    <Box sx={{ width: '100%', height: '100%', minHeight: 200, bgcolor: 'grey.200', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
                      <CircularProgress size={40} />
                      <Typography color="text.secondary" fontSize="0.75rem" sx={{ mt: 1 }}>{t('common.loading')}</Typography>
                    </Box>
                  ) : drawingImageUrl ? (
                    <Box sx={{ width: '100%', minHeight: 200, maxHeight: 500, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1, position: 'relative', overflow: 'hidden' }}>
                      <img
                        src={drawingImageUrl}
                        alt={t('nearMiss.drawing')}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                      {markerPosition && (
                        <Box sx={{ position: 'absolute', left: `${markerPosition.x}%`, top: `${markerPosition.y}%`, width: 20, height: 20, bgcolor: 'error.main', borderRadius: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                          <Typography sx={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>!</Typography>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Box sx={{ width: '100%', height: '100%', minHeight: 200, bgcolor: 'grey.200', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
                      <Typography color="text.secondary" fontSize="0.875rem">{t('nearMiss.drawingArea')}</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* 모바일용 레이아웃 */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('nearMiss.occDateTimeLabel')}</Typography>
              <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{formatDate(viewNearMiss.createdAt)}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('nearMiss.name')}</Typography>
              <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{viewNearMiss.authorName || ''}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('nearMiss.department')}</Typography>
              <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{viewNearMiss.authorDept || ''}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('nearMiss.occLocation')}</Typography>
              <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>
                {viewNearMiss.occSite}{viewNearMiss.occFloor ? ` - ${viewNearMiss.occFloor}` : ''} {viewNearMiss.occSiteInfo || ''}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('nearMiss.occOverview')}</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', px: 1.5, py: 0.5 }}>
                {viewNearMiss.occInfo || t('nearMiss.noContent')}
              </Typography>
              {existingOverviewFiles.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, px: 1.5, py: 0.5 }}>
                  {existingOverviewFiles.map((file) => (
                    <Chip
                      key={file.id}
                      label={file.originalFilename}
                      size="small"
                      component="a"
                      href={`/api/files/${file.id}`}
                      target="_blank"
                      clickable
                      sx={{ maxWidth: 250, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                    />
                  ))}
                </Box>
              )}
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('nearMiss.drawing')}</Typography>
              {isLoadingDrawingImage ? (
                <Box sx={{ height: 150, bgcolor: 'grey.200', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
                  <CircularProgress size={32} />
                  <Typography color="text.secondary" fontSize="0.75rem" sx={{ mt: 1 }}>{t('common.loading')}</Typography>
                </Box>
              ) : drawingImageUrl ? (
                <Box sx={{ width: '100%', minHeight: 150, maxHeight: 400, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1, overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={drawingImageUrl}
                    alt={t('nearMiss.drawing')}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                  {markerPosition && (
                    <Box sx={{ position: 'absolute', left: `${markerPosition.x}%`, top: `${markerPosition.y}%`, width: 20, height: 20, bgcolor: 'error.main', borderRadius: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                      <Typography sx={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>!</Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ height: 150, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
                  <Typography color="text.secondary" fontSize="0.875rem">{t('nearMiss.drawingArea')}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* 사고 대응 분류 (조회) */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'text.primary' }}>
          사고 대응 분류
        </Typography>
        <Box sx={{ mb: 3 }}>
          <TableContainer component={Paper} variant="outlined" sx={{ '& .MuiPaper-root': { borderColor: 'divider' } }}>
            <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' } }}>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ width: 110, fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center' }}>비상유형</TableCell>
                  <TableCell>{viewNearMiss.emergencyType ? (incRespTypeMap[viewNearMiss.emergencyType] || viewNearMiss.emergencyType) : '-'}</TableCell>
                  <TableCell sx={{ width: 110, fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center' }}>상태</TableCell>
                  <TableCell>{viewNearMiss.responseStatus ? (incRespStatusMap[viewNearMiss.responseStatus] || viewNearMiss.responseStatus) : '-'}</TableCell>
                  <TableCell sx={{ width: 110, fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center' }}>심각도</TableCell>
                  <TableCell>{viewNearMiss.severity ? (incRespSeverityMap[viewNearMiss.severity] || viewNearMiss.severity) : '-'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* 위험성 파악 */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'text.primary' }}>
          {t('nearMiss.riskIdentification')}
        </Typography>
        <Box sx={{ mb: 3 }}>
          {/* PC용 테이블 레이아웃 */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer component={Paper} variant="outlined" sx={{ '& .MuiPaper-root': { borderColor: 'divider' } }}>
              <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>{t('nearMiss.intensity')}</TableCell>
                    <TableCell>
                      <RadioGroup row value={viewNearMiss.intensity || ''}>
                        {intensityLevelKeys.map((level) => (
                          <FormControlLabel
                            key={level.value}
                            value={level.value}
                            control={<Radio size="small" disabled sx={{ p: 0.5, '& .MuiSvgIcon-root': { fontSize: '1.25rem' } }} />}
                            label={t(level.labelKey)}
                            sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' }, mr: 2 }}
                          />
                        ))}
                      </RadioGroup>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>{t('nearMiss.frequency')}</TableCell>
                    <TableCell>
                      <RadioGroup row value={viewNearMiss.frequency || ''}>
                        {frequencyLevelKeys.map((level) => (
                          <FormControlLabel
                            key={level.value}
                            value={level.value}
                            control={<Radio size="small" disabled sx={{ p: 0.5, '& .MuiSvgIcon-root': { fontSize: '1.25rem' } }} />}
                            label={t(level.labelKey)}
                            sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' }, mr: 2 }}
                          />
                        ))}
                      </RadioGroup>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* 모바일용 레이아웃 */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 1, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('nearMiss.intensity')}</Typography>
              <RadioGroup value={viewNearMiss.intensity || ''} sx={{ px: 1 }}>
                {intensityLevelKeys.map((level) => (
                  <FormControlLabel
                    key={level.value}
                    value={level.value}
                    control={<Radio size="small" disabled sx={{ p: 0.5, '& .MuiSvgIcon-root': { fontSize: '1.25rem' } }} />}
                    label={t(level.labelKey)}
                    sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                  />
                ))}
              </RadioGroup>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 1, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('nearMiss.frequency')}</Typography>
              <RadioGroup value={viewNearMiss.frequency || ''} sx={{ px: 1 }}>
                {frequencyLevelKeys.map((level) => (
                  <FormControlLabel
                    key={level.value}
                    value={level.value}
                    control={<Radio size="small" disabled sx={{ p: 0.5, '& .MuiSvgIcon-root': { fontSize: '1.25rem' } }} />}
                    label={t(level.labelKey)}
                    sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                  />
                ))}
              </RadioGroup>
            </Box>
          </Box>
        </Box>

        {/* 조치사항 */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'text.primary' }}>
          {t('nearMiss.measures')}
        </Typography>
        <Box sx={{ mb: 3 }}>
        <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', textAlign: 'center' }}>{t('nearMiss.measures')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 120, borderRight: 1, borderColor: 'divider', textAlign: 'center' }}>{t('nearMiss.responsibleDept')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 120, borderRight: 1, borderColor: 'divider', textAlign: 'center' }}>{t('nearMiss.responsiblePerson')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 120, borderRight: 1, borderColor: 'divider', textAlign: 'center' }}>{t('nearMiss.scheduledDate')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 120, textAlign: 'center' }}>{t('nearMiss.completedDate')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {viewNearMiss.actions && viewNearMiss.actions.length > 0 ? (
                viewNearMiss.actions.map((action, idx) => (
                  <TableRow key={action.id || idx}>
                    <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{action.improvementMeasures || ''}</TableCell>
                    <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{action.manageDept || ''}</TableCell>
                    <TableCell sx={{ borderRight: 1, borderColor: 'divider', textAlign: 'center' }}>{action.responsiblePerson || ''}</TableCell>
                    <TableCell sx={{ borderRight: 1, borderColor: 'divider', textAlign: 'center' }}>{action.planDate ? formatDate(action.planDate) : ''}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{action.completeDate ? formatDate(action.completeDate) : ''}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">{t('nearMiss.noMeasures')}</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        </Box>

        {/* 이미지 - 반응형 */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'text.primary' }}>
          {t('nearMiss.images')}
        </Typography>
        <Paper sx={{ p: 3, bgcolor: 'grey.50', border: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, alignItems: 'stretch' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 1.5 }}>{t('nearMiss.beforeAction')}</Typography>
              {existingBeforeFiles.length > 0 ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 1 }}>
                  {existingBeforeFiles.map(f => (
                    <Card key={f.id}>
                      <CardMedia component="img" image={`/api/files/${f.id}`} alt={t('nearMiss.beforeAction')}
                        sx={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />
                    </Card>
                  ))}
                </Box>
              ) : (
                <Paper sx={{ minHeight: 200, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.200', border: 1, borderColor: 'divider' }}>
                  <Typography color="text.secondary">{t('nearMiss.noImage')}</Typography>
                </Paper>
              )}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 1.5 }}>{t('nearMiss.afterAction')}</Typography>
              {existingAfterFiles.length > 0 ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 1 }}>
                  {existingAfterFiles.map(f => (
                    <Card key={f.id}>
                      <CardMedia component="img" image={`/api/files/${f.id}`} alt={t('nearMiss.afterAction')}
                        sx={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />
                    </Card>
                  ))}
                </Box>
              ) : (
                <Paper sx={{ minHeight: 200, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.200', border: 1, borderColor: 'divider' }}>
                  <Typography color="text.secondary">{t('nearMiss.noImage')}</Typography>
                </Paper>
              )}
            </Box>
          </Box>
        </Paper>

        {/* 하단 버튼 */}
        <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
            {t('common.list')}
          </Button>
          <Button variant="contained" onClick={() => handleEditClick(viewNearMiss)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
            {t('common.edit')}
          </Button>
          <Button
            variant="contained"
            color="error"
            sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}
            onClick={async () => {
              const confirmed = await showConfirm(t('nearMiss.confirmDelete'))
              if (confirmed) {
                deleteMutation.mutate(viewNearMiss.id, {
                  onSuccess: () => {
                    handleBackToList()
                    showSuccess(t('common.deleted'))
                  },
                })
              }
            }}
          >
            {t('common.delete')}
          </Button>
        </Box>
      </Box>
    )
  }

  // 등록/수정 화면
  const renderFormView = () => (
    <Box>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        {t(`nearMiss.registerInfoByType.${activeTab}`)}
      </Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* 아차사고/사고 정보 섹션 */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'text.primary' }}>
          {t(`nearMiss.nearMissInfoByType.${activeTab}`)}
        </Typography>
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3, bgcolor: 'grey.50', border: 1, borderColor: 'divider' }}>
          {/* PC용 테이블 레이아웃 */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
            {/* Row 0: 발생일시 | 성명 */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('nearMiss.occDateTimeLabel')}
              </Typography>
              <Box sx={{ flex: 2.5, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'center' }}>
                <Controller
                  name="occDate"
                  control={control}
                  render={({ field }) => (
                    <DatePickerField
                      label=""
                      value={field.value || ''}
                      onChange={field.onChange}
                      size="small"
                    />
                  )}
                />
                <Controller
                  name="occHour"
                  control={control}
                  defaultValue="10"
                  render={({ field }) => (
                    <FormControl size="small" sx={{ minWidth: 72 }}>
                      <Select {...field}>
                        {Array.from({ length: 24 }, (_, i) => (
                          <MenuItem key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
                <Controller
                  name="occMinute"
                  control={control}
                  defaultValue="00"
                  render={({ field }) => (
                    <FormControl size="small" sx={{ minWidth: 72 }}>
                      <Select {...field}>
                        {Array.from({ length: 60 }, (_, i) => (
                          <MenuItem key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('nearMiss.name')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
                <TextField fullWidth size="small" placeholder={t('nearMiss.name')} {...register('authorName')} />
              </Box>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('nearMiss.department')}
              </Typography>
              <Box sx={{ flex: 1.5, px: 2, py: 1, bgcolor: 'background.paper' }}>
                <TextField fullWidth size="small" placeholder={t('nearMiss.department')} {...register('authorDept')} />
              </Box>
            </Box>
            {/* Row 1: 발생장소 + 발생개요 (왼쪽) / 도면 영역 (오른쪽) */}
            <Box sx={{ display: 'flex' }}>
              {/* 왼쪽 영역: 발생장소 + 발생개요 */}
              <Box sx={{ flex: 1, borderRight: 1, borderColor: 'divider' }}>
                {/* 발생장소 */}
                <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                  <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'flex-start', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                    {t('nearMiss.occLocation')}
                  </Typography>
                  <Box sx={{ flex: 1, bgcolor: 'background.paper' }}>
                    <Box sx={{ display: 'flex', gap: 1, px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
                      <TextField
                        size="small"
                        sx={{ cursor: 'pointer', '& input': { cursor: 'pointer' }, minWidth: 250 }}
                        value={selectedDrawing ? `${selectedDrawing.site}${selectedDrawing.floor ? ` - ${selectedDrawing.floor}` : ''}` : ''}
                        placeholder={t('nearMiss.siteNamePlaceholder')}
                        InputProps={{
                          readOnly: true,
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton size="small" onClick={handleOpenDrawingSelectModal}>
                                <SearchIcon fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        onClick={handleOpenDrawingSelectModal}
                      />
                    </Box>
                    <Box sx={{ px: 2, py: 1 }}>
                      <TextField fullWidth size="small" placeholder={t('nearMiss.placeDescription')} {...register('occSiteInfo')} />
                    </Box>
                  </Box>
                </Box>
                {/* 발생개요 */}
                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'flex-start', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                    {t('nearMiss.occOverview')}
                  </Typography>
                  <Box sx={{ flex: 1, bgcolor: 'background.paper' }}>
                    <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
                      <TextField fullWidth size="small" placeholder={t('nearMiss.incidentDescription')} multiline rows={3} {...register('occInfo')} />
                    </Box>
                    <Box sx={{ px: 2, py: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: (existingOverviewFiles.length > 0 || overviewFiles.length > 0) ? 1 : 0 }}>
                        <Typography variant="caption" color="text.secondary">
                          {t('nearMiss.fileSizeNote')}
                        </Typography>
                        <Button
                          variant="text"
                          size="small"
                          startIcon={<CloudUploadIcon />}
                          onClick={() => overviewFileRef.current?.click()}
                          sx={{ p: 0, minWidth: 'auto' }}
                        >
                          {t('nearMiss.fileAttach')}
                        </Button>
                      </Box>
                      {(existingOverviewFiles.length > 0 || overviewFiles.length > 0) && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {existingOverviewFiles.map((file) => (
                            <Chip
                              key={`existing-${file.id}`}
                              label={file.originalFilename}
                              size="small"
                              onDelete={() => {
                                setDeletedOverviewFileIds((prev) => [...prev, file.id])
                                setExistingOverviewFiles((prev) => prev.filter((f) => f.id !== file.id))
                              }}
                              sx={{ maxWidth: 200, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                            />
                          ))}
                          {overviewFiles.map((file, index) => (
                            <Chip
                              key={`new-${index}`}
                              label={`${file.name} (${formatFileSize(file.size)})`}
                              size="small"
                              onDelete={() => handleRemoveOverviewFile(index)}
                              sx={{ maxWidth: 200, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
              {/* 오른쪽 영역: 도면 이미지 - 클릭하여 위치 표시 */}
              <Box sx={{ width: '50%', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 1 }}>
                {isLoadingDrawingImage ? (
                  <Box sx={{ width: '100%', height: '100%', minHeight: 200, bgcolor: 'grey.200', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
                    <CircularProgress size={40} />
                    <Typography color="text.secondary" fontSize="0.75rem" sx={{ mt: 1 }}>{t('common.loading')}</Typography>
                  </Box>
                ) : drawingImageUrl ? (
                  <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>{t('nearMiss.clickToMark')}</Typography>
                    <Box sx={{ width: '100%', minHeight: 200, maxHeight: 500, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1, position: 'relative', overflow: 'hidden' }}>
                      <img
                        ref={drawingImageRef}
                        src={drawingImageUrl}
                        alt={t('nearMiss.drawing')}
                        onClick={handleDrawingImageClick}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', cursor: 'crosshair' }}
                      />
                      {markerPosition && (
                        <Box sx={{ position: 'absolute', left: `${markerPosition.x}%`, top: `${markerPosition.y}%`, width: 20, height: 20, bgcolor: 'error.main', borderRadius: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                          <Typography sx={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>!</Typography>
                        </Box>
                      )}
                    </Box>
                    {markerPosition && (
                      <Typography variant="caption" color="success.main" sx={{ mt: 0.5 }}>{t('nearMiss.locationMarked')}</Typography>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ width: '100%', height: '100%', minHeight: 200, bgcolor: 'grey.200', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
                    <DrawIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                    <Typography color="text.secondary" fontSize="0.75rem">{t('nearMiss.selectWorkplaceToShowDrawing')}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          {/* 모바일용 레이아웃 */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('nearMiss.occDateTimeLabel')}</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', px: 0.5 }}>
                <Controller
                  name="occDate"
                  control={control}
                  render={({ field }) => (
                    <DatePickerField label="" value={field.value || ''} onChange={field.onChange} size="small" />
                  )}
                />
                <Controller
                  name="occHour"
                  control={control}
                  defaultValue="10"
                  render={({ field }) => (
                    <FormControl size="small" sx={{ minWidth: 72 }}>
                      <Select {...field}>
                        {Array.from({ length: 24 }, (_, i) => (
                          <MenuItem key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
                <Typography variant="body2">:</Typography>
                <Controller
                  name="occMinute"
                  control={control}
                  defaultValue="00"
                  render={({ field }) => (
                    <FormControl size="small" sx={{ minWidth: 72 }}>
                      <Select {...field}>
                        {Array.from({ length: 60 }, (_, i) => (
                          <MenuItem key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('nearMiss.name')}</Typography>
              <TextField fullWidth size="small" placeholder={t('nearMiss.name')} {...register('authorName')} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('nearMiss.department')}</Typography>
              <TextField fullWidth size="small" placeholder={t('nearMiss.department')} {...register('authorDept')} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('nearMiss.occLocation')}</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  value={selectedDrawing ? `${selectedDrawing.site}${selectedDrawing.floor ? ` - ${selectedDrawing.floor}` : ''}` : ''}
                  placeholder={t('nearMiss.siteNamePlaceholder')}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={handleOpenDrawingSelectModal}>
                          <SearchIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  onClick={handleOpenDrawingSelectModal}
                  sx={{ cursor: 'pointer', '& input': { cursor: 'pointer' } }}
                />
                <TextField fullWidth size="small" placeholder={t('nearMiss.locationDescription')} {...register('occSiteInfo')} />
              </Box>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('nearMiss.occOverview')}</Typography>
              <TextField fullWidth size="small" placeholder={t('nearMiss.incidentDescriptionShort')} multiline rows={3} {...register('occInfo')} />
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: (existingOverviewFiles.length > 0 || overviewFiles.length > 0) ? 1 : 0 }}>
                  <Typography variant="caption" color="text.secondary">{t('nearMiss.fileSizeNoteShort')}</Typography>
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<CloudUploadIcon />}
                    onClick={() => overviewFileRef.current?.click()}
                    sx={{ ml: 1 }}
                  >
                    {t('nearMiss.fileAttach')}
                  </Button>
                </Box>
                {(existingOverviewFiles.length > 0 || overviewFiles.length > 0) && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {existingOverviewFiles.map((file) => (
                      <Chip
                        key={`existing-${file.id}`}
                        label={file.originalFilename}
                        size="small"
                        onDelete={() => {
                          setDeletedOverviewFileIds((prev) => [...prev, file.id])
                          setExistingOverviewFiles((prev) => prev.filter((f) => f.id !== file.id))
                        }}
                        sx={{ maxWidth: 200, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                      />
                    ))}
                    {overviewFiles.map((file, index) => (
                      <Chip
                        key={`new-${index}`}
                        label={`${file.name} (${formatFileSize(file.size)})`}
                        size="small"
                        onDelete={() => handleRemoveOverviewFile(index)}
                        sx={{ maxWidth: 200, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
            {/* 도면 이미지 - 클릭하여 위치 표시 */}
            <Box sx={{ bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              {isLoadingDrawingImage ? (
                <Box sx={{ width: '100%', minHeight: 150, bgcolor: 'grey.200', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
                  <CircularProgress size={32} />
                  <Typography color="text.secondary" fontSize="0.75rem" sx={{ mt: 1 }}>{t('common.loading')}</Typography>
                </Box>
              ) : drawingImageUrl ? (
                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>{t('nearMiss.clickToMark')}</Typography>
                  <Box sx={{ width: '100%', minHeight: 150, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1, position: 'relative' }}>
                    <img
                      src={drawingImageUrl}
                      alt={t('nearMiss.drawing')}
                      onClick={handleDrawingImageClick}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', cursor: 'crosshair' }}
                    />
                    {markerPosition && (
                      <Box sx={{ position: 'absolute', left: `${markerPosition.x}%`, top: `${markerPosition.y}%`, width: 20, height: 20, bgcolor: 'error.main', borderRadius: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        <Typography sx={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>!</Typography>
                      </Box>
                    )}
                  </Box>
                  {markerPosition && (
                    <Typography variant="caption" color="success.main" sx={{ mt: 0.5 }}>{t('nearMiss.locationMarked')}</Typography>
                  )}
                </Box>
              ) : (
                <Box sx={{ width: '100%', minHeight: 150, bgcolor: 'grey.200', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
                  <DrawIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                  <Typography color="text.secondary" fontSize="0.75rem">{t('nearMiss.selectWorkplaceToShowDrawing')}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>

        {/* 사고 대응 분류 — 비상유형/상태/심각도 (코드) */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'text.primary' }}>
          사고 대응 분류
        </Typography>
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3, bgcolor: 'grey.50', border: 1, borderColor: 'divider' }}>
          {/* PC용 테이블 레이아웃 */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer component={Paper} variant="outlined" sx={{ '& .MuiPaper-root': { borderColor: 'divider' } }}>
              <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ width: 110, fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center' }}>비상유형</TableCell>
                    <TableCell>
                      <Controller name="emergencyType" control={control} defaultValue=""
                        render={({ field }) => (
                          <TextField select fullWidth size="small" {...field} SelectProps={{ displayEmpty: true }}>
                            <MenuItem value="">선택하세요</MenuItem>
                            {incRespTypeList.map((c: any) => (
                              <MenuItem key={c.code} value={c.code}>{incRespTypeMap[c.code] || c.code}</MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    </TableCell>
                    <TableCell sx={{ width: 110, fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center' }}>상태</TableCell>
                    <TableCell>
                      <Controller name="responseStatus" control={control} defaultValue=""
                        render={({ field }) => (
                          <TextField select fullWidth size="small" {...field} SelectProps={{ displayEmpty: true }}>
                            <MenuItem value="">선택하세요</MenuItem>
                            {incRespStatusList.map((c: any) => (
                              <MenuItem key={c.code} value={c.code}>{incRespStatusMap[c.code] || c.code}</MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    </TableCell>
                    <TableCell sx={{ width: 110, fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center' }}>심각도</TableCell>
                    <TableCell>
                      <Controller name="severity" control={control} defaultValue=""
                        render={({ field }) => (
                          <TextField select fullWidth size="small" {...field} SelectProps={{ displayEmpty: true }}>
                            <MenuItem value="">선택하세요</MenuItem>
                            {incRespSeverityList.map((c: any) => (
                              <MenuItem key={c.code} value={c.code}>{incRespSeverityMap[c.code] || c.code}</MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* 모바일용 레이아웃 — 셀렉박스 하나씩 한 줄 */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 1, bgcolor: 'grey.200', px: 1, py: 0.75, borderRadius: 0.5, fontSize: '0.75rem', textAlign: 'center' }}>비상유형</Typography>
              <Controller name="emergencyType" control={control} defaultValue=""
                render={({ field }) => (
                  <TextField select fullWidth size="small" {...field} SelectProps={{ displayEmpty: true }}>
                    <MenuItem value="">선택하세요</MenuItem>
                    {incRespTypeList.map((c: any) => (
                      <MenuItem key={c.code} value={c.code}>{incRespTypeMap[c.code] || c.code}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 1, bgcolor: 'grey.200', px: 1, py: 0.75, borderRadius: 0.5, fontSize: '0.75rem', textAlign: 'center' }}>상태</Typography>
              <Controller name="responseStatus" control={control} defaultValue=""
                render={({ field }) => (
                  <TextField select fullWidth size="small" {...field} SelectProps={{ displayEmpty: true }}>
                    <MenuItem value="">선택하세요</MenuItem>
                    {incRespStatusList.map((c: any) => (
                      <MenuItem key={c.code} value={c.code}>{incRespStatusMap[c.code] || c.code}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 1, bgcolor: 'grey.200', px: 1, py: 0.75, borderRadius: 0.5, fontSize: '0.75rem', textAlign: 'center' }}>심각도</Typography>
              <Controller name="severity" control={control} defaultValue=""
                render={({ field }) => (
                  <TextField select fullWidth size="small" {...field} SelectProps={{ displayEmpty: true }}>
                    <MenuItem value="">선택하세요</MenuItem>
                    {incRespSeverityList.map((c: any) => (
                      <MenuItem key={c.code} value={c.code}>{incRespSeverityMap[c.code] || c.code}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Box>
          </Box>
        </Paper>

        {/* 위험성 파악 섹션 - 반응형 */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'text.primary' }}>
          {t('nearMiss.riskIdentification')}
        </Typography>
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3, bgcolor: 'grey.50', border: 1, borderColor: 'divider' }}>
          {/* PC용 테이블 레이아웃 */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer component={Paper} variant="outlined" sx={{ '& .MuiPaper-root': { borderColor: 'divider' } }}>
              <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>{t('nearMiss.intensity')}</TableCell>
                    <TableCell>
                      <Controller
                        name="intensity"
                        control={control}
                        defaultValue={1}
                        render={({ field }) => (
                          <RadioGroup row {...field} value={field.value?.toString()}>
                            {intensityLevelKeys.map((level) => (
                              <FormControlLabel
                                key={level.value}
                                value={level.value.toString()}
                                control={<Radio size="small" sx={{ p: 0.5, '& .MuiSvgIcon-root': { fontSize: '1.25rem' } }} />}
                                label={`(${level.value}) ${t(level.labelKey)}`}
                                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' }, mr: 2 }}
                              />
                            ))}
                          </RadioGroup>
                        )}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ width: 128, fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>{t('nearMiss.frequency')}</TableCell>
                    <TableCell>
                      <Controller
                        name="frequency"
                        control={control}
                        defaultValue={1}
                        render={({ field }) => (
                          <RadioGroup row {...field} value={field.value?.toString()}>
                            {frequencyLevelKeys.map((level) => (
                              <FormControlLabel
                                key={level.value}
                                value={level.value.toString()}
                                control={<Radio size="small" sx={{ p: 0.5, '& .MuiSvgIcon-root': { fontSize: '1.25rem' } }} />}
                                label={`(${level.value}) ${t(level.labelKey)}`}
                                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' }, mr: 2 }}
                              />
                            ))}
                          </RadioGroup>
                        )}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* 모바일용 레이아웃 */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 1, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('nearMiss.intensity')}</Typography>
              <Controller
                name="intensity"
                control={control}
                defaultValue={1}
                render={({ field }) => (
                  <RadioGroup {...field} value={field.value?.toString()} sx={{ px: 1 }}>
                    {intensityLevelKeys.map((level) => (
                      <FormControlLabel
                        key={level.value}
                        value={level.value.toString()}
                        control={<Radio size="small" sx={{ p: 0.5, '& .MuiSvgIcon-root': { fontSize: '1.25rem' } }} />}
                        label={`(${level.value}) ${t(level.labelKey)}`}
                        sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                      />
                    ))}
                  </RadioGroup>
                )}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 1, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('nearMiss.frequency')}</Typography>
              <Controller
                name="frequency"
                control={control}
                defaultValue={1}
                render={({ field }) => (
                  <RadioGroup {...field} value={field.value?.toString()} sx={{ px: 1 }}>
                    {frequencyLevelKeys.map((level) => (
                      <FormControlLabel
                        key={level.value}
                        value={level.value.toString()}
                        control={<Radio size="small" sx={{ p: 0.5, '& .MuiSvgIcon-root': { fontSize: '1.25rem' } }} />}
                        label={`(${level.value}) ${t(level.labelKey)}`}
                        sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                      />
                    ))}
                  </RadioGroup>
                )}
              />
            </Box>
          </Box>
        </Paper>

        {/* 조치사항 섹션 - 반응형 */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'text.primary' }}>
          {t('nearMiss.measures')}
        </Typography>
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3, bgcolor: 'grey.50', border: 1, borderColor: 'divider' }}>
          {/* PC용 테이블 레이아웃 */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
            {/* Row 1: 조치사항 */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('nearMiss.measures')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                <TextField fullWidth size="small" placeholder={t('nearMiss.enterMeasure')} value={newMeasure.content} onChange={(e) => setNewMeasure({ ...newMeasure, content: e.target.value })} />
              </Box>
            </Box>
            {/* Row 2: 담당부서 | 책임자 */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('nearMiss.responsibleDept')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                <TextField fullWidth size="small" placeholder={t('nearMiss.responsibleDept')}
                  value={newMeasure.department} InputProps={{ readOnly: true }} />
                <Button variant="outlined" size="small" sx={{ ml: 1, minWidth: 40 }} onClick={() => setActionDeptModalOpen(true)}>
                  <PersonSearchIcon fontSize="small" />
                </Button>
              </Box>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('nearMiss.responsiblePerson')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }}>
                <TextField fullWidth size="small" placeholder={t('common.selectFromOrg', '조직도에서 선택')} value={selectedResponsible ? getResponsibleDisplayName(selectedResponsible) : newMeasure.responsible} InputProps={{ readOnly: true }} />
                <Button variant="outlined" size="small" sx={{ ml: 1, minWidth: 40 }} onClick={() => setResponsibleModalOpen(true)}><PersonSearchIcon fontSize="small" /></Button>
              </Box>
            </Box>
            {/* Row 3: 예정일 | 추가 버튼 */}
            <Box sx={{ display: 'flex' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('nearMiss.scheduledDate')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', gap: 2 }}>
                <DatePickerField
                  label=""
                  value={newMeasure.dueDate}
                  onChange={(value) => setNewMeasure({ ...newMeasure, dueDate: value })}
                  placeholder={t('nearMiss.scheduledDate')}
                />
                <Button variant="contained" size="small" onClick={handleAddMeasure} startIcon={<AddIcon />} sx={{ minWidth: 80, whiteSpace: 'nowrap' }}>
                  {t('common.add')}
                </Button>
              </Box>
            </Box>
          </Box>

          {/* 모바일용 레이아웃 */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('nearMiss.measures')}</Typography>
              <TextField fullWidth size="small" placeholder={t('nearMiss.enterMeasure')} value={newMeasure.content} onChange={(e) => setNewMeasure({ ...newMeasure, content: e.target.value })} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('nearMiss.responsibleDept')}</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField fullWidth size="small" placeholder={t('nearMiss.responsibleDept')}
                  value={newMeasure.department} InputProps={{ readOnly: true }} />
                <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setActionDeptModalOpen(true)}>
                  <PersonSearchIcon fontSize="small" />
                </Button>
              </Box>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('nearMiss.responsiblePerson')}</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField fullWidth size="small" placeholder={t('common.selectFromOrg', '조직도에서 선택')} value={selectedResponsible ? getResponsibleDisplayName(selectedResponsible) : newMeasure.responsible} InputProps={{ readOnly: true }} />
                <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setResponsibleModalOpen(true)}><PersonSearchIcon fontSize="small" /></Button>
              </Box>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('nearMiss.scheduledDate')}</Typography>
              <DatePickerField
                label=""
                value={newMeasure.dueDate}
                onChange={(value) => setNewMeasure({ ...newMeasure, dueDate: value })}
                placeholder={t('nearMiss.scheduledDate')}
              />
            </Box>
            <Button variant="contained" fullWidth onClick={handleAddMeasure} startIcon={<AddIcon />}>
              {t('common.add')}
            </Button>
          </Box>

          <TableContainer sx={{ border: 1, borderColor: 'divider', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 600, '& .MuiTableCell-root': { borderColor: 'divider' } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', textAlign: 'center' }}>{t('nearMiss.measures')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 120, borderRight: 1, borderColor: 'divider', textAlign: 'center' }}>{t('nearMiss.responsibleDept')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 120, borderRight: 1, borderColor: 'divider', textAlign: 'center' }}>{t('nearMiss.responsiblePerson')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 120, borderRight: 1, borderColor: 'divider', textAlign: 'center' }}>{t('nearMiss.scheduledDate')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 120, borderRight: 1, borderColor: 'divider', textAlign: 'center' }}>{t('nearMiss.completedDate')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 60, textAlign: 'center' }}>{t('common.delete')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {measures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 2 }}>
                      <Typography variant="body2" color="text.secondary">{t('nearMiss.noMeasures')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  measures.map((measure) => (
                    <TableRow key={measure.id}>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{measure.content}</TableCell>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{measure.department}</TableCell>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider', textAlign: 'center' }}>{measure.responsible}</TableCell>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider', textAlign: 'center' }}>{measure.dueDate}</TableCell>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider', textAlign: 'center' }}>{measure.completedDate || ''}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleRemoveMeasure(measure.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* 이미지 섹션 */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'text.primary' }}>
          {t('nearMiss.images')}
        </Typography>
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3, bgcolor: 'grey.50', border: 1, borderColor: 'divider' }}>
          {/* 파일 input — multiple 로 다중 선택 지원 */}
          <input ref={beforeFileRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload('before', e)} />
          <input ref={afterFileRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload('after', e)} />
          {/* 모바일 카메라 직접 촬영 — capture 는 multiple 미지원, 한 장씩 캡처 (반복 가능) */}
          <input ref={beforeCameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => handleImageUpload('before', e)} />
          <input ref={afterCameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => handleImageUpload('after', e)} />
          <input ref={overviewFileRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt" style={{ display: 'none' }} onChange={handleOverviewFileSelect} />

          <Grid container spacing={0} sx={{ border: 1, borderColor: 'divider', alignItems: 'stretch' }}>
            {/* 조치전 */}
            <Grid item xs={12} sm={6} sx={{ p: 2, borderRight: { xs: 0, sm: 1 }, borderBottom: { xs: 1, sm: 0 }, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 1.5 }}>{t('nearMiss.beforeAction')}</Typography>
              {(existingBeforeFiles.length > 0 || newBeforePreviews.length > 0) && (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 1, mb: 1.5 }}>
                  {existingBeforeFiles.map(f => (
                    <Card key={`exist-${f.id}`} sx={{ position: 'relative' }}>
                      <CardMedia component="img" image={`/api/files/${f.id}`}
                        sx={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />
                      <IconButton size="small"
                        sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
                        onClick={async () => { if (await showConfirm(t('nearMiss.confirmImageDelete'))) handleRemoveExistingImage('before', f.id) }}>
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Card>
                  ))}
                  {newBeforePreviews.map((src, i) => (
                    <Card key={`new-${i}`} sx={{ position: 'relative' }}>
                      <CardMedia component="img" image={src}
                        sx={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />
                      <IconButton size="small"
                        sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
                        onClick={() => handleRemoveNewImage('before', i)}>
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Card>
                  ))}
                </Box>
              )}
              <Paper sx={{ minHeight: 80, flex: existingBeforeFiles.length === 0 && newBeforePreviews.length === 0 ? 1 : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.200', border: 1, borderColor: 'divider', gap: 1, p: 2 }}>
                {existingBeforeFiles.length === 0 && newBeforePreviews.length === 0 && (
                  <PhotoCameraIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                )}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button variant="contained" size="small" startIcon={<PhotoCameraIcon />}
                    sx={{ display: { xs: 'inline-flex', md: 'none' } }}
                    onClick={(e) => { e.stopPropagation(); beforeCameraRef.current?.click() }}>
                    카메라
                  </Button>
                  <Button variant="outlined" size="small" startIcon={<CloudUploadIcon />}
                    onClick={(e) => { e.stopPropagation(); beforeFileRef.current?.click() }}>
                    {t('nearMiss.imageUpload')}
                  </Button>
                </Box>
              </Paper>
            </Grid>
            {/* 조치후 */}
            <Grid item xs={12} sm={6} sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 1.5 }}>{t('nearMiss.afterAction')}</Typography>
              {(existingAfterFiles.length > 0 || newAfterPreviews.length > 0) && (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 1, mb: 1.5 }}>
                  {existingAfterFiles.map(f => (
                    <Card key={`exist-${f.id}`} sx={{ position: 'relative' }}>
                      <CardMedia component="img" image={`/api/files/${f.id}`}
                        sx={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />
                      <IconButton size="small"
                        sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
                        onClick={async () => { if (await showConfirm(t('nearMiss.confirmImageDelete'))) handleRemoveExistingImage('after', f.id) }}>
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Card>
                  ))}
                  {newAfterPreviews.map((src, i) => (
                    <Card key={`new-${i}`} sx={{ position: 'relative' }}>
                      <CardMedia component="img" image={src}
                        sx={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />
                      <IconButton size="small"
                        sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
                        onClick={() => handleRemoveNewImage('after', i)}>
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Card>
                  ))}
                </Box>
              )}
              <Paper sx={{ minHeight: 80, flex: existingAfterFiles.length === 0 && newAfterPreviews.length === 0 ? 1 : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.200', border: 1, borderColor: 'divider', gap: 1, p: 2 }}>
                {existingAfterFiles.length === 0 && newAfterPreviews.length === 0 && (
                  <PhotoCameraIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                )}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button variant="contained" size="small" startIcon={<PhotoCameraIcon />}
                    sx={{ display: { xs: 'inline-flex', md: 'none' } }}
                    onClick={(e) => { e.stopPropagation(); afterCameraRef.current?.click() }}>
                    카메라
                  </Button>
                  <Button variant="outlined" size="small" startIcon={<CloudUploadIcon />}
                    onClick={(e) => { e.stopPropagation(); afterFileRef.current?.click() }}>
                    {t('nearMiss.imageUpload')}
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
          {/* 작성/수정 폼에서는 항상 '취소' 라벨 (목록 아님) */}
          <Button variant="outlined" sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }} onClick={() => {
            if (editingNearMiss && viewNearMiss) {
              setViewMode('detail')
              setEditingNearMiss(null)
              setMeasures([])
            } else {
              handleBackToList()
            }
          }}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={createMutation.isPending || updateMutation.isPending} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
            {t('common.save')}
          </Button>
        </Box>
      </form>
    </Box>
  )

  const modalPreviewUrl = modalPreviewImages && modalPreviewImages.length > modalPreviewImageIndex
    ? `/api/files/${modalPreviewImages[modalPreviewImageIndex].id}`
    : (modalPreviewImages && modalPreviewImages.length > 0 ? `/api/files/${modalPreviewImages[0].id}` : null)

  return (
    <Box>
      {/* 탭 메뉴: 아차사고 / 사고 / 레포트 */}
      {viewMode === 'list' && (
        <>
          <Box sx={{ mb: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => { setActiveTab(newValue); setPage(1) }}
            >
              <Tab label={t('common.dashboard', '대시보드')} value="DASHBOARD" />
              <Tab label={t('nearMiss.incidentTypes.nearMiss')} value="NEAR_MISS" />
              <Tab label={t('nearMiss.incidentTypes.accident')} value="ACCIDENT" />
              <Tab label={t('nearMiss.incidentTypes.report', '레포트')} value="REPORT" />
            </Tabs>
          </Box>
          {activeTab !== 'REPORT' && activeTab !== 'DASHBOARD' && (
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              {activeTab === 'NEAR_MISS' ? t('nearMiss.incidentTypes.nearMiss') : t('nearMiss.incidentTypes.accident')}
            </Typography>
          )}
        </>
      )}
      {viewMode === 'list' && activeTab === 'DASHBOARD' && <NearMissDashboardTab />}
      {viewMode === 'list' && activeTab === 'REPORT' && <AccidentReportTab />}
      {viewMode === 'list' && activeTab !== 'REPORT' && activeTab !== 'DASHBOARD' && renderListView()}
      {viewMode === 'detail' && renderDetailView()}
      {(viewMode === 'create' || viewMode === 'edit') && renderFormView()}

      {/* 도면 선택 모달 */}
      <Dialog open={drawingSelectModalOpen} onClose={() => setDrawingSelectModalOpen(false)} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { mx: { xs: 1, sm: 2 } } }}>
        <DialogTitle>{t('nearMiss.selectDrawing')}</DialogTitle>
        <DialogContent>
          {/* PC 레이아웃 */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, mt: 1, minHeight: 400 }}>
            {/* 왼쪽: 건물→층 2단계 트리 (도면 관리와 동일) */}
            <Paper sx={{ width: 260, flexShrink: 0, overflow: 'auto', maxHeight: 450, p: 1 }}>
              <SimpleTreeView
                slots={{ collapseIcon: ExpandMoreIcon, expandIcon: ChevronRightIcon }}
                expandedItems={expandedBuildingsModal}
                onExpandedItemsChange={(_, ids) => setExpandedBuildingsModal(ids)}
                selectedItems={modalPreviewDrawingId ? `f-${modalPreviewDrawingId}` : ''}
                onSelectedItemsChange={(_, id) => {
                  if (id && typeof id === 'string' && id.startsWith('f-')) {
                    setModalPreviewDrawingId(Number(id.slice(2)))
                    setModalPreviewImageIndex(0)
                  }
                }}
              >
                {drawingsByBuilding.map(([building, floors]) => (
                  <TreeItem
                    key={`b-${building}`}
                    itemId={`b-${building}`}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
                        <BusinessIcon sx={{ fontSize: 16, mr: 0.5, color: 'primary.main' }} />
                        <Typography fontWeight="bold" sx={{ fontSize: '0.9rem' }}>{building}</Typography>
                      </Box>
                    }
                  >
                    {floors.map((drawing) => (
                      <TreeItem
                        key={`f-${drawing.id}`}
                        itemId={`f-${drawing.id}`}
                        label={
                          <Typography sx={{
                            fontSize: '0.85rem',
                            fontWeight: modalPreviewDrawingId === drawing.id ? 'bold' : 'normal',
                            py: 0.5,
                          }}>
                            {drawing.floor || '-'}
                          </Typography>
                        }
                      />
                    ))}
                  </TreeItem>
                ))}
              </SimpleTreeView>
            </Paper>
            {/* 오른쪽: 도면 프리뷰 */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {modalPreviewUrl ? (
                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {modalPreviewImages && modalPreviewImages.length > 1 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <IconButton size="small" onClick={() => setModalPreviewImageIndex(prev => Math.max(0, prev - 1))} disabled={modalPreviewImageIndex === 0}>
                        <NavigateBeforeIcon fontSize="small" />
                      </IconButton>
                      {modalPreviewImages.map((_, idx) => (
                        <Box key={idx} onClick={() => setModalPreviewImageIndex(idx)} sx={{ width: 10, height: 10, borderRadius: '50%', cursor: 'pointer', bgcolor: idx === modalPreviewImageIndex ? 'primary.main' : 'grey.400' }} />
                      ))}
                      <IconButton size="small" onClick={() => setModalPreviewImageIndex(prev => Math.min((modalPreviewImages?.length || 1) - 1, prev + 1))} disabled={modalPreviewImageIndex >= (modalPreviewImages?.length || 1) - 1}>
                        <NavigateNextIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="caption" color="text.secondary">({modalPreviewImageIndex + 1}/{modalPreviewImages.length})</Typography>
                    </Box>
                  )}
                  <Box sx={{ width: '100%', height: 380, bgcolor: 'grey.100', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <img src={modalPreviewUrl} alt="preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </Box>
                </Box>
              ) : (
                <Box sx={{ width: '100%', height: 380, bgcolor: 'grey.100', borderRadius: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <DrawIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                  <Typography color="text.secondary" fontSize="0.875rem">{t('nearMiss.selectDrawingToPreview')}</Typography>
                </Box>
              )}
            </Box>
          </Box>
          {/* 모바일 레이아웃 */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mt: 1 }}>
            {/* 프리뷰 영역 */}
            {modalPreviewUrl && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 1 }}>
                {modalPreviewImages && modalPreviewImages.length > 1 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <IconButton size="small" onClick={() => setModalPreviewImageIndex(prev => Math.max(0, prev - 1))} disabled={modalPreviewImageIndex === 0}>
                      <NavigateBeforeIcon fontSize="small" />
                    </IconButton>
                    {modalPreviewImages.map((_, idx) => (
                      <Box key={idx} onClick={() => setModalPreviewImageIndex(idx)} sx={{ width: 8, height: 8, borderRadius: '50%', cursor: 'pointer', bgcolor: idx === modalPreviewImageIndex ? 'primary.main' : 'grey.400' }} />
                    ))}
                    <IconButton size="small" onClick={() => setModalPreviewImageIndex(prev => Math.min((modalPreviewImages?.length || 1) - 1, prev + 1))} disabled={modalPreviewImageIndex >= (modalPreviewImages?.length || 1) - 1}>
                      <NavigateNextIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="caption" color="text.secondary">({modalPreviewImageIndex + 1}/{modalPreviewImages.length})</Typography>
                  </Box>
                )}
                <Box sx={{ width: '100%', height: 200, bgcolor: 'grey.100', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src={modalPreviewUrl} alt="preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </Box>
              </Box>
            )}
            {/* 도면 목록 — 건물→층 2단계 트리 */}
            <Paper variant="outlined" sx={{ maxHeight: 250, overflow: 'auto', p: 1 }}>
              <SimpleTreeView
                slots={{ collapseIcon: ExpandMoreIcon, expandIcon: ChevronRightIcon }}
                expandedItems={expandedBuildingsModal}
                onExpandedItemsChange={(_, ids) => setExpandedBuildingsModal(ids)}
                selectedItems={modalPreviewDrawingId ? `f-${modalPreviewDrawingId}` : ''}
                onSelectedItemsChange={(_, id) => {
                  if (id && typeof id === 'string' && id.startsWith('f-')) {
                    setModalPreviewDrawingId(Number(id.slice(2)))
                    setModalPreviewImageIndex(0)
                  }
                }}
              >
                {drawingsByBuilding.map(([building, floors]) => (
                  <TreeItem
                    key={`b-${building}`}
                    itemId={`b-${building}`}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
                        <BusinessIcon sx={{ fontSize: 14, mr: 0.5, color: 'primary.main' }} />
                        <Typography fontWeight="bold" sx={{ fontSize: '0.85rem' }}>{building}</Typography>
                      </Box>
                    }
                  >
                    {floors.map((drawing) => (
                      <TreeItem
                        key={`f-${drawing.id}`}
                        itemId={`f-${drawing.id}`}
                        label={
                          <Typography sx={{
                            fontSize: '0.8rem',
                            fontWeight: modalPreviewDrawingId === drawing.id ? 'bold' : 'normal',
                            py: 0.5,
                          }}>
                            {drawing.floor || '-'}
                          </Typography>
                        }
                      />
                    ))}
                  </TreeItem>
                ))}
              </SimpleTreeView>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDrawingSelectModalOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleConfirmDrawingSelect} disabled={!modalPreviewDrawingId}>{t('common.select')}</Button>
        </DialogActions>
      </Dialog>

      {/* Responsible Person Select Modal */}
      <UserSelectModal
        open={responsibleModalOpen}
        onClose={() => setResponsibleModalOpen(false)}
        selectedUsers={[]}
        onConfirm={handleResponsibleConfirm}
        title={t('nearMiss.selectResponsiblePerson')}
        singleSelect
        useCompanyTree
      />

      {/* 조치사항 담당부서 — 부서 선택 모달 */}
      <DepartmentSelectModal
        open={actionDeptModalOpen}
        onClose={() => setActionDeptModalOpen(false)}
        initialDepartment={newMeasure.department || ''}
        onConfirm={(dept) => {
          setNewMeasure({ ...newMeasure, department: dept })
          setActionDeptModalOpen(false)
        }}
      />
    </Box>
  )
}

export default NearMissPage
