import { useState, useEffect } from 'react'
import { isSystemAdmin } from '../../utils/auth'
import { useButtonRules } from '../../hooks/useButtonRules'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import ListSearchBar from '../common/ListSearchBar'
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
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Alert,
  Chip,
  Tabs,
  Tab,
  Tooltip,
  Radio,
  RadioGroup,
  FormControlLabel,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import CloseIcon from '@mui/icons-material/Close'
import InfoIcon from '@mui/icons-material/Info'
import { useAuth } from '../../context/AuthContext'
import { riskAssessmentApi } from '../../api/riskAssessmentApi'
import { workplaceApi } from '../../api/workplaceApi'
import {
  RiskAssessment as RiskAssessmentBase,
  RiskAssessmentRequest,
  RiskActivityProcessRequest as RiskActivityProcessRequestBase,
  RiskAssessmentDetailRequest as RiskAssessmentDetailRequestBase,
  POSSIBILITY_CRITERIA,
  RESULT_CRITERIA,
  RISK_GRADE_CRITERIA,
  calculateRiskScore,
  getRiskGrade,
} from '../../types/riskAssessment.types'

// 옛 화면(사무업무 전용)이 참조하던 레거시 컬럼들. 백엔드 모델/DB 에는 없지만 화면에서만 임시로 쓰기 위해 확장.
type RiskAssessment = RiskAssessmentBase & { outsourceCount?: number }
type RiskActivityProcessRequest = RiskActivityProcessRequestBase & {
  facility?: string
  frequency?: string
  workHours?: string
  worker?: string
  coWorker?: string
}
type RiskActivityProcess = import('../../types/riskAssessment.types').RiskActivityProcess & {
  facility?: string; frequency?: string; workHours?: string; worker?: string; coWorker?: string
}
type RiskAssessmentDetailRequest = RiskAssessmentDetailRequestBase & {
  improvementManager?: string
  improvementDeadline?: string
  relatedLaw?: string
  remark?: string
  reviewer?: string
  approverName?: string
}
type RiskAssessmentDetail = import('../../types/riskAssessment.types').RiskAssessmentDetail & {
  improvementManager?: string
  improvementDeadline?: string
  relatedLaw?: string
  remark?: string
  reviewer?: string
  approverName?: string
}
import LoadingOverlay from '../common/LoadingOverlay'
import DevTestFillButton from '../common/DevTestFillButton'
import useCodeMap from '../../hooks/useCodeMap'
import SafetyInspectionTab from './SafetyInspectionTab'
import { fetchSafetyTemplates, createSafetyInspection, updateSafetyInspection, fetchInspectionByRiskAssessment } from '../../api/safetyChecklistApi'
import { SafetyChecklistTemplate, SafetyChecklistInspectionResult } from '../../types/safetyChecklist.types'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}

const MAJOR_CATEGORIES = ['사무업무', '출장/현장방문', '외주']


const RiskAssessmentOfficeWorkTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showConfirm, showSuccess, showWarning } = useAlert()
  const { user } = useAuth()
  const { codeMap: frequencyLabels, codeList: frequencyCodes, getLocalizedName } = useCodeMap('WORK_FREQUENCY')
  const { codeMap: raStatusLabels } = useCodeMap('RISK_ASSESSMENT_STATUS')

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedAssessment, setSelectedAssessment] = useState<RiskAssessment | null>(null)

  // List filters
  const [siteFilter, setSiteFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const applySearch = () => { setSearchText(searchInput); setPage(0) }
  const [page, setPage] = useState(0)
  const rowsPerPage = 10

  // Step tabs (0: Step1 활동공정, 1: Step2 위험성평가, 2: Step3 위험성등록부)
  const [activeStep, setActiveStep] = useState(0)

  // Form state
  const [formData, setFormData] = useState<RiskAssessmentRequest>({
    title: '',
    site: '',
    authorName: '',
    authorDept: '',
    authorMail: '',  })

  // Step 1 data
  const [activityProcesses, setActivityProcesses] = useState<RiskActivityProcessRequest[]>([])

  // Step 2 data
  const [assessmentDetails, setAssessmentDetails] = useState<RiskAssessmentDetailRequest[]>([])

  // Step 3, 4 inspection results
  const [step3Results, setStep3Results] = useState<SafetyChecklistInspectionResult[]>([])
  const [step4Results, setStep4Results] = useState<SafetyChecklistInspectionResult[]>([])
  const [step3InspectionId, setStep3InspectionId] = useState<number | null>(null)
  const [step4InspectionId, setStep4InspectionId] = useState<number | null>(null)

  // Dialog states
  const [guideDialogOpen, setGuideDialogOpen] = useState(false)

  const isAdmin = isSystemAdmin(user)
  const { canSee } = useButtonRules()
  const MENU = '안전 관리 › 위험성 평가'
  const getItemRoles = (item: { authorName?: string | null; planApproverName?: string | null; completionApproverName?: string | null } | null): string[] => {
    const roles: string[] = ['guest']
    if (isAdmin) roles.push('superAdmin')
    else if (user?.role) roles.push(user.role)
    if (item?.authorName && user?.name && item.authorName === user.name) roles.push('writer')
    if (item?.planApproverName && user?.name && item.planApproverName === user.name) roles.push('planApprover')
    if (item?.completionApproverName && user?.name && item.completionApproverName === user.name) roles.push('completionApprover')
    return roles
  }

  // Fetch sites from API
  const { data: sitesData } = useQuery({
    queryKey: ['workplaceSites'],
    queryFn: workplaceApi.getSites,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
  const sites = sitesData || []

  // Fetch form templates for dropdown — 사무업무 탭에서는 더 이상 사용하지 않지만 추후 필요할 수 있어 호출만 유지
  useQuery({
    queryKey: ['riskAssessmentFormsDropdown'],
    queryFn: riskAssessmentApi.getFormsDropdown,
    staleTime: 1000 * 60 * 5,
  })

  // Fetch safety checklist templates (사무업무 탭 Step 2/3/4 dropdown 후보)
  const { data: safetyTemplates } = useQuery<SafetyChecklistTemplate[]>({
    queryKey: ['safetyTemplates'],
    queryFn: fetchSafetyTemplates,
    staleTime: 1000 * 60 * 5,
  })

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: ['riskAssessments', 'officeOnly', page, siteFilter, statusFilter],
    queryFn: () =>
      riskAssessmentApi.getAll({
        page,
        size: rowsPerPage,
        site: siteFilter || undefined,
        status: statusFilter || undefined,
        officeOnly: true,
      }),
    enabled: viewMode === 'list',
  })

  const { data: assessmentDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['riskAssessmentDetail', selectedAssessment?.id],
    queryFn: () => riskAssessmentApi.getById(selectedAssessment!.id),
    enabled: !!selectedAssessment?.id && (viewMode === 'detail' || viewMode === 'edit'),
  })

  // 폼/상세 화면에서 사용할 연결된 템플릿 ID. 폼은 formData, 상세는 assessmentDetail 에서 읽음.
  const linkedOfficeId = ((viewMode === 'create' || viewMode === 'edit')
    ? formData.officeChecklistId : assessmentDetail?.officeChecklistId) ?? undefined
  const linkedSanupId = ((viewMode === 'create' || viewMode === 'edit')
    ? formData.sanupChecklistId : assessmentDetail?.sanupChecklistId) ?? undefined
  const linkedJungdaeId = ((viewMode === 'create' || viewMode === 'edit')
    ? formData.jungdaeChecklistId : assessmentDetail?.jungdaeChecklistId) ?? undefined

  // Load step data when assessment is selected
  useEffect(() => {
    if (assessmentDetail && (viewMode === 'detail' || viewMode === 'edit')) {
      // Load activity processes for step 1
      riskAssessmentApi.getActivityProcesses(assessmentDetail.riskId).then((data) => {
        setActivityProcesses(
          data.map((raw: any) => {
            const p = raw as RiskActivityProcess
            return {
              majorCategoryIdx: p.majorCategoryIdx,
              majorCategory: p.majorCategory,
              detailAction: p.detailAction,
              facility: p.facility || undefined,
              frequency: p.frequency,
              workHours: p.workHours || undefined,
              worker: p.worker || undefined,
              coWorker: p.coWorker || undefined,
              isTarget: p.isTarget,
            }
          })
        )
      })

      // Load assessment details for step 2
      riskAssessmentApi.getAssessmentDetails(assessmentDetail.riskId).then((data) => {
        setAssessmentDetails(
          data.map((raw: any) => {
            const d = raw as RiskAssessmentDetail
            return {
              activityProcessId: d.activityProcessId,
              riskIdx: d.riskIdx,
              majorCategory: d.majorCategory,
              detailAction: d.detailAction,
              risk4M: d.risk4M,
              danger: d.danger,
              expectedDisaster: d.expectedDisaster,
              target: d.target,
              currentSafetyMeasures: d.currentSafetyMeasures,
              possibilityGrade: d.possibilityGrade,
              resultGrade: d.resultGrade,
              isRegistered: d.isRegistered,
              reductionMeasures: d.reductionMeasures || undefined,
              improvementManager: d.improvementManager || undefined,
              improvementDeadline: d.improvementDeadline || undefined,
              improvedPossibilityGrade: d.improvedPossibilityGrade || undefined,
              improvedResultGrade: d.improvedResultGrade || undefined,
              relatedLaw: d.relatedLaw || undefined,
              remark: d.remark || undefined,
              reviewer: d.reviewer || undefined,
              approverName: d.approverName || undefined,
              createdAt: d.createdAt || undefined,
            }
          })
        )
      })

      // Load inspection results for step 3, 4 — 연결된 체크리스트 템플릿 ID 기준
      const sanupId = assessmentDetail.sanupChecklistId
      const jungdaeId = assessmentDetail.jungdaeChecklistId
      if (sanupId) {
        fetchInspectionByRiskAssessment(assessmentDetail.id, sanupId).then(insp => {
          if (insp) {
            setStep3InspectionId(insp.id ?? null)
            setStep3Results(insp.results || [])
          } else {
            setStep3InspectionId(null)
            setStep3Results([])
          }
        })
      } else {
        setStep3InspectionId(null)
        setStep3Results([])
      }
      if (jungdaeId) {
        fetchInspectionByRiskAssessment(assessmentDetail.id, jungdaeId).then(insp => {
          if (insp) {
            setStep4InspectionId(insp.id ?? null)
            setStep4Results(insp.results || [])
          } else {
            setStep4InspectionId(null)
            setStep4Results([])
          }
        })
      } else {
        setStep4InspectionId(null)
        setStep4Results([])
      }
    }
  }, [assessmentDetail, viewMode])

  // Save inspection results helper
  const saveInspectionResults = async (assessmentId: number) => {
    const saveOne = async (
      templateId: number | undefined,
      results: SafetyChecklistInspectionResult[],
      existingInspectionId: number | null,
    ) => {
      if (!templateId || results.length === 0) return
      const hasData = results.some(r => r.result || r.actionDeadline || r.personInCharge)
      if (!hasData) return

      const payload = {
        templateId,
        riskAssessmentId: assessmentId,
        inspectionDate: new Date().toISOString().slice(0, 10),
        department: '',
        inspector: user?.name || '',
        site: '',
        status: 'DRAFT',
        results,
      }

      if (existingInspectionId) {
        await updateSafetyInspection(existingInspectionId, payload)
      } else {
        await createSafetyInspection(payload)
      }
    }

    await saveOne(formData.sanupChecklistId ?? undefined, step3Results, step3InspectionId)
    await saveOne(formData.jungdaeChecklistId ?? undefined, step4Results, step4InspectionId)
  }

  // Mutations
  const createMutation = useMutation({
    mutationFn: riskAssessmentApi.create,
    onSuccess: async (created) => {
      // Save step 1 data
      if (activityProcesses.length > 0) {
        await riskAssessmentApi.saveActivityProcessesBatch(created.riskId, activityProcesses)
      }
      // Save step 2 data
      if (assessmentDetails.length > 0) {
        await riskAssessmentApi.saveAssessmentDetailsBatch(created.riskId, assessmentDetails)
      }
      // Save step 3, 4 inspection results
      await saveInspectionResults(created.id)
      queryClient.invalidateQueries({ queryKey: ['riskAssessments'] })
      await showSuccess(t('common.saveSuccess'))
      handleBackToList()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RiskAssessmentRequest }) =>
      riskAssessmentApi.update(id, data),
    onSuccess: async () => {
      if (selectedAssessment) {
        // Save step 1 data
        await riskAssessmentApi.saveActivityProcessesBatch(selectedAssessment.riskId, activityProcesses)
        // Save step 2 data
        await riskAssessmentApi.saveAssessmentDetailsBatch(selectedAssessment.riskId, assessmentDetails)
        // Save step 3, 4 inspection results
        await saveInspectionResults(selectedAssessment.id)
      }
      queryClient.invalidateQueries({ queryKey: ['riskAssessments'] })
      queryClient.invalidateQueries({ queryKey: ['riskAssessmentDetail'] })
      await showSuccess(t('common.saveSuccess'))
      handleBackToList()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: riskAssessmentApi.delete,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['riskAssessments'] })
      await showSuccess(t('common.deleteSuccess'))
      handleBackToList()
    },
  })

  const isProcessing = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  // Handlers
  const handleBackToList = () => {
    setViewMode('list')
    setSelectedAssessment(null)
    setActiveStep(0)
    setFormData({
      title: '',
      site: '',
      authorName: '',
      authorDept: '',
      authorMail: '',    })
    setActivityProcesses([])
    setAssessmentDetails([])
  }

  const handleBackToDetail = () => {
    // Reset form data to original assessment data
    if (assessmentDetail) {
      setFormData({
        title: assessmentDetail.title,
        site: assessmentDetail.site,
        authorName: assessmentDetail.authorName || undefined,
        authorDept: assessmentDetail.authorDept || undefined,
        authorMail: assessmentDetail.authorMail || undefined,      })
    }
    setViewMode('detail')
  }

  const handleReset = () => {
    setSearchInput('')
    setSearchText('')
    setSiteFilter('')
    setStatusFilter('')
    setPage(0)
  }

  const handleRowClick = (assessment: RiskAssessment) => {
    setSelectedAssessment(assessment)
    setViewMode('detail')
  }

  const handleAddClick = () => {
    setSelectedAssessment(null)
    setFormData({
      title: '',
      site: '',
      authorName: user?.name || '',
      authorDept: user?.department || '',
      authorMail: user?.email || '',      officeChecklistId: undefined,
      sanupChecklistId: undefined,
      jungdaeChecklistId: undefined,
    })
    setActivityProcesses(
      [0, 2].map(idx => ({
        majorCategoryIdx: idx + 1,
        majorCategory: MAJOR_CATEGORIES[idx],
        detailAction: '',
        facility: '',
        frequency: 'daily',
        workHours: undefined,
        worker: '',
        coWorker: '',
        isTarget: true,
      }))
    )
    setAssessmentDetails([])
    setActiveStep(0)
    setViewMode('create')
  }

  // 양식 기반 detail 자동 채움 — 사무업무 탭 신규 흐름에서는 사용하지 않음 (체크리스트 템플릿으로 대체)
  // @ts-expect-error 더 이상 호출되지 않지만 향후 양식 기반 흐름 복구를 위해 보관
  const _handleFormTemplateChange = async (formId: number | '') => {
    if (!formId) {
      setAssessmentDetails([])
      return
    }
    try {
      const formData = await riskAssessmentApi.getFormById(formId as number)
      if (formData.items && formData.items.length > 0) {
        setAssessmentDetails(formData.items.map((item) => ({
          activityProcessId: 0,
          riskIdx: item.riskIdx,
          majorCategory: '',
          detailAction: item.detailAction || '',
          risk4M: item.risk4M || '',
          danger: item.danger || '',
          expectedDisaster: item.expectedDisaster || '',
          target: item.target || '',
          currentSafetyMeasures: item.currentSafetyMeasures || '',
          possibilityGrade: item.possibilityGrade || 1,
          resultGrade: item.resultGrade || 1,
          isRegistered: false,
          reductionMeasures: item.reductionMeasures || '',
          improvementManager: item.improvementManager || '',
          improvementDeadline: item.improvementDeadline || '',
          improvedPossibilityGrade: item.improvedPossibilityGrade || 1,
          improvedResultGrade: item.improvedResultGrade || 1,
          relatedLaw: item.relatedLaw || '',
          remark: item.remark || '',
          reviewer: item.reviewer || '',
          approverName: item.approverName || '',
        })))
      }
    } catch {
      // keep current details on error
    }
  }

  const handleEditClick = () => {
    if (!assessmentDetail) return
    setFormData({
      title: assessmentDetail.title,
      site: assessmentDetail.site,
      authorName: assessmentDetail.authorName || undefined,
      authorDept: assessmentDetail.authorDept || undefined,
      authorMail: assessmentDetail.authorMail || undefined,      officeChecklistId: assessmentDetail.officeChecklistId ?? undefined,
      sanupChecklistId: assessmentDetail.sanupChecklistId ?? undefined,
      jungdaeChecklistId: assessmentDetail.jungdaeChecklistId ?? undefined,
    })
    setViewMode('edit')
  }

  const handleDeleteClick = async () => {
    const confirmed = await showConfirm(
      t('riskAssessment.dialog.deleteConfirm') + '\n' + t('riskAssessment.dialog.deleteWarning'),
      { title: t('riskAssessment.dialog.deleteTitle') }
    )
    if (confirmed && selectedAssessment) {
      deleteMutation.mutate(selectedAssessment.id)
    }
  }

  // DEV ONLY — 비어있는 항목을 사무직 위험성평가 더미데이터로 채움 (입력값·체크리스트·승인자 보존)
  const fillTestData = () => {
    setFormData(prev => ({
      ...prev,
      title: prev.title || '사무직 위험성평가 – 사무·외주 작업',
    }))
    const SAMPLE_ACTIONS: Record<string, string> = {
      '사무업무': 'VDU 작업(모니터·키보드 사용)',
      '외주': '외주 청소·시설관리 작업',
      '출장/현장방문': '현장 점검 출장 이동',
    }
    setActivityProcesses(prev => prev.map(p => ({
      ...p,
      detailAction: p.detailAction || SAMPLE_ACTIONS[p.majorCategory] || '일상 사무 작업',
    })))
  }

  const handleSubmit = async () => {
    if (!formData.officeChecklistId || !formData.sanupChecklistId || !formData.jungdaeChecklistId) {
      showWarning(t('common.checklist', '체크리스트') + ' ' + t('common.required', '필수입니다'))
      return
    }
    const confirmed = await showConfirm(t('common.confirmSave'))
    if (!confirmed) return

    if (viewMode === 'create') {
      createMutation.mutate(formData)
    } else if (viewMode === 'edit' && selectedAssessment) {
      updateMutation.mutate({ id: selectedAssessment.id, data: formData })
    }
  }

  // Step 1 - Inline editing handlers
  const handleProcessFieldChange = (globalIndex: number, field: keyof RiskActivityProcessRequest, value: unknown) => {
    const newProcesses = [...activityProcesses]
    newProcesses[globalIndex] = { ...newProcesses[globalIndex], [field]: value }
    setActivityProcesses(newProcesses)
  }

  // Step 2 - Inline editing handler
  const handleInlineDetailChange = (index: number, field: keyof RiskAssessmentDetailRequest, value: unknown) => {
    const newDetails = [...assessmentDetails]
    newDetails[index] = { ...newDetails[index], [field]: value }
    setAssessmentDetails(newDetails)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    return dateString.split('T')[0]
  }

  const getStatusChip = (status: string) => {
    const statusLower = status.toLowerCase()

    // 1) i18n 키 조회 (IN_PROGRESS → in_progress)
    const i18nKey = `riskAssessment.status.${statusLower}`
    const i18nLabel = t(i18nKey)

    // 2) useCodeMap 조회 (원본 / 소문자 둘 다 시도)
    // 3) 최후 폴백: IN_PROGRESS → In Progress 형태로 자동 변환
    const humanize = (s: string) =>
      s.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

    const label =
      i18nLabel !== i18nKey
        ? i18nLabel
        : raStatusLabels[status] || raStatusLabels[statusLower] || humanize(status)

    // 색상 매핑
    const colorMap: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
      draft: 'default',
      submitted: 'info',
      in_progress: 'warning',
      approval_request: 'info',
      approved: 'success',
      rejected: 'error',
      completed: 'success',
    }
    const color = colorMap[statusLower] || 'default'

    return <Chip label={label} size="small" color={color} />
  }

  const getRiskGradeColor = (grade: string) => {
    switch (grade) {
      case '매우높음(VH)':
        return 'error'
      case '높음(H)':
        return 'warning'
      case '중간(M)':
        return 'success'
      case '낮음(L)':
        return 'default'
      default:
        return 'default'
    }
  }

  // 사무업무 탭은 백엔드에서 office_count > 0 만 페이징해서 내려옴
  const assessments = (data?.content || []).filter((a) => {
    if (!searchText) return true
    const s = searchText.toLowerCase()
    return (a.title || '').toLowerCase().includes(s)
  })
  const totalPages = data?.totalPages || 0

  // ===== Render Functions =====

  const renderListView = () => (
    <>
      {/* Filters - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ListSearchBar
            placeholder={t('common.title')}
            value={searchInput}
            onChange={setSearchInput}
            onSearch={applySearch}
            sx={{ width: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select value={siteFilter} onChange={(e: SelectChangeEvent) => { setSiteFilter(e.target.value); setPage(0) }} displayEmpty>
              <MenuItem value="">{t('riskAssessment.siteFilter')}</MenuItem>
              {sites.map((site) => (<MenuItem key={site} value={site}>{site}</MenuItem>))}
            </Select>
          </FormControl>
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button variant="outlined" size="small" onClick={() => setGuideDialogOpen(true)}>
            ? Guide
          </Button>
          {isAdmin && (
            <Button variant="contained" size="small" onClick={handleAddClick}>
              New
            </Button>
          )}
        </Box>
      </Box>

      {/* Filters - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, mb: 2 }}>
        <ListSearchBar fullWidth placeholder={t('common.title')} value={searchInput} onChange={setSearchInput} onSearch={applySearch} />
        <FormControl size="small" fullWidth>
          <Select value={siteFilter} onChange={(e: SelectChangeEvent) => { setSiteFilter(e.target.value); setPage(0) }} displayEmpty>
            <MenuItem value="">{t('riskAssessment.siteFilter')}</MenuItem>
            {sites.map((site) => (<MenuItem key={site} value={site}>{site}</MenuItem>))}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" onClick={handleReset} sx={{ flex: 1 }}>{t('common.reset')}</Button>
          <Button variant="outlined" size="small" onClick={() => setGuideDialogOpen(true)} sx={{ flex: 1 }}>Guide</Button>
          {isAdmin && (
            <Button variant="contained" size="small" onClick={handleAddClick} sx={{ flex: 1 }}>New</Button>
          )}
        </Box>
      </Box>

      {/* Table - PC */}
      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 1100, '& .MuiTableCell-root': { borderColor: 'divider' } }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold', width: 200, borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }} align="center">{t('riskAssessment.region')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }} align="center">{t('common.title')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 80, borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }} align="center">{t('riskAssessment.author')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 120, borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }} align="center">{t('riskAssessment.department')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 100, borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }} align="center">{t('riskAssessment.riskRegisterCount')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 80, borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }} align="center">{t('common.status')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 80, borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }} align="center">{t('riskAssessment.approver')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 120, borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }} align="center">{t('riskAssessment.completedDate')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 100, wordBreak: 'keep-all' }} align="center">{t('riskAssessment.assessmentCount')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assessments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">{t('riskAssessment.noAssessments')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              assessments.map((item) => (
                <TableRow key={item.id} hover onClick={() => handleRowClick(item)} sx={{ cursor: 'pointer' }}>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{item.site}</TableCell>
                  <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{item.title}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{item.authorName || ''}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{item.authorDept || ''}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{item.riskRegisterCount}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{getStatusChip(item.status)}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{item.approverName || ''}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{formatDate(item.completedDate)}</TableCell>
                  <TableCell align="center">{item.officeCount}/{item.fieldCount}/{(item as RiskAssessment).outsourceCount ?? 0}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile Card List */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
        {assessments.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">{t('riskAssessment.noAssessments')}</Typography>
          </Paper>
        ) : (
          assessments.map((item) => (
            <Paper key={item.id} sx={{ p: 2, cursor: 'pointer', border: 1, borderColor: 'divider' }} onClick={() => handleRowClick(item)}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography fontWeight="bold" sx={{ flex: 1 }}>{item.title}</Typography>
                {getStatusChip(item.status)}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 50 }}>{t('riskAssessment.region')}</Typography>
                  <Typography variant="body2">{item.site}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 50 }}>{t('riskAssessment.author')}</Typography>
                  <Typography variant="body2">{item.authorName || ''} ({item.authorDept || ''})</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 50 }}>{t('riskAssessment.completedDate')}</Typography>
                  <Typography variant="body2">{formatDate(item.completedDate)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 50 }}>{t('riskAssessment.register')}</Typography>
                  <Typography variant="body2">{item.riskRegisterCount}{t('common.cases')}</Typography>
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
    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'grey.200' }}>
      {detailLoading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      ) : assessmentDetail ? (
        <>
          {/* 기본 정보 */}
          <Paper sx={{ p: 3, bgcolor: 'grey.50', mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>{t('riskAssessment.basicInfo')}</Typography>

            {/* PC용 테이블 레이아웃 */}
            <TableContainer component={Paper} variant="outlined" sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto', '& .MuiPaper-root': { borderColor: 'divider' } }}>
              <Table size="small" sx={{ minWidth: 600, '& .MuiTableCell-root': { borderColor: 'divider' } }}>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ width: 100, fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>{t('common.title')}</TableCell>
                    <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{assessmentDetail.title}</TableCell>
                    <TableCell sx={{ width: 100, fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>{t('riskAssessment.region')}</TableCell>
                    <TableCell>{assessmentDetail.site}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>{t('riskAssessment.author')}</TableCell>
                    <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{assessmentDetail.authorName || ''}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>{t('riskAssessment.department')}</TableCell>
                    <TableCell>{assessmentDetail.authorDept || ''}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>{t('common.status')}</TableCell>
                    <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{getStatusChip(assessmentDetail.status)}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>{t('riskAssessment.completedDate')}</TableCell>
                    <TableCell>{formatDate(assessmentDetail.completedDate)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* 모바일용 레이아웃 */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.title')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{assessmentDetail.title}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('riskAssessment.region')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{assessmentDetail.site}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('riskAssessment.author')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{assessmentDetail.authorName || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('riskAssessment.department')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{assessmentDetail.authorDept || ''}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.status')}</Typography>
                <Box sx={{ px: 1.5, py: 0.5 }}>{getStatusChip(assessmentDetail.status)}</Box>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('riskAssessment.completedDate')}</Typography>
                <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{formatDate(assessmentDetail.completedDate)}</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Step Tabs — 항상 4개 노출 (Step 2/3/4 는 연결된 체크리스트 readOnly 표시) */}
          <Tabs
            value={activeStep}
            onChange={(_, v) => setActiveStep(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 2 }}
          >
            <Tab label={t('riskAssessment.step1')} />
            <Tab label={t('riskAssessment.step2', 'Step 2. 위험성평가서-사무업무')} />
            <Tab label={t('riskAssessment.step3', 'Step 3. 산업안전보건법 예방 체크리스트')} />
            <Tab label={t('riskAssessment.step4', 'Step 4. 중대재해처벌법 예방 체크리스트')} />
          </Tabs>

          <TabPanel value={activeStep} index={0}>
            {renderStep1Content(true)}
          </TabPanel>
          <TabPanel value={activeStep} index={1}>
            {renderChecklistStepView(linkedOfficeId)}
          </TabPanel>
          <TabPanel value={activeStep} index={2}>
            {renderChecklistStepView(linkedSanupId, step3Results)}
          </TabPanel>
          <TabPanel value={activeStep} index={3}>
            {renderChecklistStepView(linkedJungdaeId, step4Results)}
          </TabPanel>

          {/* Action Buttons - PC */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mt: 3, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={handleBackToList}>{t('common.list')}</Button>
            {canSee(MENU, 'DETAIL', '수정', getItemRoles(assessmentDetail ?? null)) && (
              <Button variant="contained" onClick={handleEditClick}>{t('common.edit')}</Button>
            )}
            {canSee(MENU, 'DETAIL', '삭제', getItemRoles(assessmentDetail ?? null)) && (
              <Button variant="contained" color="error" onClick={handleDeleteClick}>{t('common.delete')}</Button>
            )}
          </Box>
          {/* Action Buttons - Mobile */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1, mt: 3 }}>
            <Button variant="outlined" onClick={handleBackToList} sx={{ flex: 1, minWidth: 0 }}>{t('common.list')}</Button>
            {(isAdmin || assessmentDetail?.authorName === user?.name) && (
              <Button variant="contained" onClick={handleEditClick} sx={{ flex: 1, minWidth: 0 }}>{t('common.edit')}</Button>
            )}
            {(isAdmin || assessmentDetail?.authorName === user?.name) && (
              <Button variant="contained" color="error" onClick={handleDeleteClick} sx={{ flex: 1, minWidth: 0 }}>{t('common.delete')}</Button>
            )}
          </Box>
        </>
      ) : null}
    </Paper>
  )

  /**
   * Step 2/3/4 편집 화면: 셀렉트 + (선택 시) SafetyInspectionTab
   * categoryType 으로 후보 템플릿 필터링.
   */
  const renderChecklistStepEdit = (
    categoryType: string,
    selectedId: number | null | undefined,
    onChange: (id: number | undefined) => void,
    onResultsChange?: (results: SafetyChecklistInspectionResult[]) => void,
    inspectionResults?: SafetyChecklistInspectionResult[],
  ) => {
    const candidates = (safetyTemplates || []).filter(t => t.categoryType === categoryType)
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 110, wordBreak: 'keep-all' }}>
            {t('riskAssessment.linkChecklist', '체크리스트 연결')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
          </Typography>
          <FormControl size="small" sx={{ minWidth: 280 }}>
            <Select
              value={selectedId ?? ''}
              onChange={(e: SelectChangeEvent<number | ''>) =>
                onChange(e.target.value === '' ? undefined : Number(e.target.value))
              }
              displayEmpty
            >
              <MenuItem value=""><em>{t('common.none', '선택 안함')}</em></MenuItem>
              {candidates.map(tpl => (
                <MenuItem key={tpl.id} value={tpl.id}>{tpl.templateName}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {candidates.length === 0 && (
            <Typography variant="caption" color="text.secondary">
              {t('riskAssessment.noChecklistInCategory', '체크리스트 관리에서 해당 카테고리의 템플릿을 먼저 등록하세요.')}
            </Typography>
          )}
        </Box>
        {selectedId ? (
          <SafetyInspectionTab
            templateId={selectedId}
            riskAssessmentId={selectedAssessment?.id || 0}
            readOnly={false}
            onResultsChange={onResultsChange}
            inspectionResults={inspectionResults}
          />
        ) : (
          <Alert severity="info">{t('riskAssessment.selectChecklistFirst', '먼저 위에서 체크리스트를 선택하세요.')}</Alert>
        )}
      </Box>
    )
  }

  /**
   * Step 2/3/4 상세(읽기 전용) 화면: 연결된 템플릿이 있으면 SafetyInspectionTab, 없으면 안내.
   */
  const renderChecklistStepView = (
    selectedId: number | null | undefined,
    inspectionResults?: SafetyChecklistInspectionResult[],
  ) => {
    if (!selectedId) {
      return <Alert severity="info">{t('riskAssessment.checklistNotLinked', '연결된 체크리스트가 없습니다.')}</Alert>
    }
    return (
      <SafetyInspectionTab
        templateId={selectedId}
        riskAssessmentId={selectedAssessment?.id || 0}
        readOnly={true}
        inspectionResults={inspectionResults}
      />
    )
  }

  const renderFormView = () => (
    <>
      {/* 기본 정보 - PC용 테이블 레이아웃 */}
      <Paper sx={{ p: { xs: 2, md: 3 }, bgcolor: 'grey.50', mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>{t('riskAssessment.basicInfo')}</Typography>

        {/* PC용 테이블 레이아웃 */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          {/* Row 1: 제목 | 지역 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
              {t('common.title')}
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
              <TextField
                fullWidth
                size="small"
                placeholder={t('riskAssessment.form.titlePlaceholder')}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Box>
            <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
              {t('riskAssessment.region')}
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
              <FormControl fullWidth size="small">
                <Select
                  value={formData.site}
                  onChange={(e: SelectChangeEvent) => setFormData({ ...formData, site: e.target.value })}
                  displayEmpty
                >
                  <MenuItem value="">{t('riskAssessment.siteFilter')}</MenuItem>
                  {sites.map((site) => (<MenuItem key={site} value={site}>{site}</MenuItem>))}
                </Select>
              </FormControl>
            </Box>
          </Box>
          {/* Row 2: 작성자 | 소속 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
              {t('riskAssessment.author')}
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2">{formData.authorName || user?.name || user?.username || ''}</Typography>
            </Box>
            <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
              {t('riskAssessment.department')}
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
              <TextField
                fullWidth
                size="small"
                placeholder={t('riskAssessment.department')}
                value={formData.authorDept || ''}
                onChange={(e) => setFormData({ ...formData, authorDept: e.target.value })}
                disabled={viewMode === 'create'}
              />
            </Box>
          </Box>
          {/* Row 3: 이메일 | 소속사 */}
          <Box sx={{ display: 'flex' }}>
            <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
              {t('riskAssessment.email')}
            </Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
              <TextField
                fullWidth
                size="small"
                placeholder={t('riskAssessment.email')}
                value={formData.authorMail || ''}
                onChange={(e) => setFormData({ ...formData, authorMail: e.target.value })}
                disabled={viewMode === 'create'}
              />
            </Box>
          </Box>
        </Box>

        {/* 모바일용 레이아웃 */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.title')}</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder={t('riskAssessment.form.titlePlaceholder')}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('riskAssessment.region')}</Typography>
            <FormControl fullWidth size="small">
              <Select
                value={formData.site}
                onChange={(e: SelectChangeEvent) => setFormData({ ...formData, site: e.target.value })}
                displayEmpty
              >
                <MenuItem value="">{t('riskAssessment.siteFilter')}</MenuItem>
                {sites.map((site) => (<MenuItem key={site} value={site}>{site}</MenuItem>))}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('riskAssessment.author')}</Typography>
            <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{formData.authorName || user?.name || user?.username || ''}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('riskAssessment.department')}</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder={t('riskAssessment.department')}
              value={formData.authorDept || ''}
              onChange={(e) => setFormData({ ...formData, authorDept: e.target.value })}
              disabled={viewMode === 'create'}
            />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('riskAssessment.email')}</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder={t('riskAssessment.email')}
              value={formData.authorMail || ''}
              onChange={(e) => setFormData({ ...formData, authorMail: e.target.value })}
              disabled={viewMode === 'create'}
            />
          </Box>
        </Box>
      </Paper>

      {/* Step Tabs — Step 2/3/4 항상 노출. 셀렉트는 각 Step 탭 안에 있음 */}
      <Tabs
        value={activeStep}
        onChange={(_, v) => setActiveStep(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        <Tab label={t('riskAssessment.step1')} />
        <Tab label={t('riskAssessment.step2', 'Step 2. 위험성평가서-사무업무')} />
        <Tab label={t('riskAssessment.step3', 'Step 3. 산업안전보건법 예방 체크리스트')} />
        <Tab label={t('riskAssessment.step4', 'Step 4. 중대재해처벌법 예방 체크리스트')} />
      </Tabs>

      <TabPanel value={activeStep} index={0}>
        {renderStep1Content(false)}
      </TabPanel>
      <TabPanel value={activeStep} index={1}>
        {renderChecklistStepEdit('OFFICE_WORK', formData.officeChecklistId, (id) =>
          setFormData({ ...formData, officeChecklistId: id }))}
      </TabPanel>
      <TabPanel value={activeStep} index={2}>
        {renderChecklistStepEdit('OFFICE_WORK', formData.sanupChecklistId, (id) =>
          setFormData({ ...formData, sanupChecklistId: id }), setStep3Results, step3Results)}
      </TabPanel>
      <TabPanel value={activeStep} index={3}>
        {renderChecklistStepEdit('OFFICE_WORK', formData.jungdaeChecklistId, (id) =>
          setFormData({ ...formData, jungdaeChecklistId: id }), setStep4Results, step4Results)}
      </TabPanel>

      {/* Form Actions - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mt: 3, justifyContent: 'flex-end' }}>
        {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
        {viewMode === 'edit' ? (
          <Button variant="outlined" onClick={handleBackToDetail}>{t('common.cancel')}</Button>
        ) : (
          <Button variant="outlined" onClick={handleBackToList}>{t('common.list')}</Button>
        )}
        <Button variant="contained" onClick={handleSubmit} disabled={isProcessing}>
          {t('common.save')}
        </Button>
      </Box>
      {/* Form Actions - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1, mt: 3 }}>
        {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
        {viewMode === 'edit' ? (
          <Button variant="outlined" onClick={handleBackToDetail} sx={{ flex: 1, minWidth: 0 }}>{t('common.cancel')}</Button>
        ) : (
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: 1, minWidth: 0 }}>{t('common.list')}</Button>
        )}
        <Button variant="contained" onClick={handleSubmit} disabled={isProcessing} sx={{ flex: 1, minWidth: 0 }}>
          {t('common.save')}
        </Button>
      </Box>
    </>
  )

  // Step 1 - 활동공정 목록표 - PDF 페이지 13 기준 (인라인 카드 폼 레이아웃)
  const renderProcessItem = (process: RiskActivityProcessRequest, _itemNumber: number, globalIndex: number, readOnly: boolean) => {
    const labelSx = {
      width: 160, minWidth: 160, fontWeight: 'bold', bgcolor: 'grey.100',
      px: 2, py: 1.5, borderRight: 1, borderColor: 'divider',
      display: 'flex', alignItems: 'center', fontSize: '0.875rem',
      justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center', whiteSpace: 'pre-line',
    }
    const smallLabelSx = { ...labelSx, width: 120, minWidth: 120 }

    return (
      <Box key={globalIndex}>
        {/* PC 레이아웃 */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          {/* Row 1: 세부활동, 공정 내용 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('riskAssessment.detailActivityProcess')}</Typography>
            <Box sx={{ flex: 1, px: 2, py: 1 }}>
              {readOnly ? (
                <Typography variant="body2" sx={{ py: 0.5 }}>{process.detailAction || ''}</Typography>
              ) : (
                <TextField fullWidth size="small" value={process.detailAction}
                  onChange={(e) => handleProcessFieldChange(globalIndex, 'detailAction', e.target.value)} />
              )}
            </Box>
          </Box>

          {/* Row 3: 작업발생주기(빈도) - Radio buttons */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('riskAssessment.frequencyLabel')}</Typography>
            <Box sx={{ flex: 1, px: 2, py: 0.5, display: 'flex', alignItems: 'center' }}>
              {readOnly ? (
                <Typography variant="body2" sx={{ py: 0.5 }}>{frequencyLabels[process.frequency || ''] || process.frequency || ''}</Typography>
              ) : (
                <RadioGroup row value={process.frequency || ''}
                  onChange={(e) => handleProcessFieldChange(globalIndex, 'frequency', e.target.value)}>
                  {frequencyCodes.map((item) => (
                    <FormControlLabel key={item.code} value={item.code}
                      control={<Radio size="small" />}
                      label={<Typography variant="body2">{getLocalizedName(item)}</Typography>}
                      sx={{ mr: 1.5 }} />
                  ))}
                </RadioGroup>
              )}
            </Box>
          </Box>

          {/* Row 4: 작업시간 | 작업자(적정) | 작업자(현황) */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Typography sx={labelSx}>{t('riskAssessment.workHoursPerSession')}</Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, borderRight: 1, borderColor: 'divider' }}>
              {readOnly ? (
                <Typography variant="body2" sx={{ py: 0.5 }}>{process.workHours || ''}</Typography>
              ) : (
                <TextField fullWidth size="small" type="number" value={process.workHours || ''}
                  onChange={(e) => handleProcessFieldChange(globalIndex, 'workHours', e.target.value ? Number(e.target.value) : undefined)} />
              )}
            </Box>
            <Typography sx={smallLabelSx}>{t('riskAssessment.workerAppropriate')}</Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, borderRight: 1, borderColor: 'divider' }}>
              {readOnly ? (
                <Typography variant="body2" sx={{ py: 0.5 }}>{process.worker || ''}</Typography>
              ) : (
                <TextField fullWidth size="small" value={process.worker || ''}
                  onChange={(e) => handleProcessFieldChange(globalIndex, 'worker', e.target.value)} />
              )}
            </Box>
            <Typography sx={smallLabelSx}>{t('riskAssessment.workerCurrent')}</Typography>
            <Box sx={{ flex: 1, px: 2, py: 1 }}>
              {readOnly ? (
                <Typography variant="body2" sx={{ py: 0.5 }}>{process.coWorker || ''}</Typography>
              ) : (
                <TextField fullWidth size="small" value={process.coWorker || ''}
                  onChange={(e) => handleProcessFieldChange(globalIndex, 'coWorker', e.target.value)} />
              )}
            </Box>
          </Box>

          {/* Row 5: 사용 설비 */}
          <Box sx={{ display: 'flex' }}>
            <Typography sx={labelSx}>{t('riskAssessment.usedFacility')}</Typography>
            <Box sx={{ flex: 1, px: 2, py: 1 }}>
              {readOnly ? (
                <Typography variant="body2" sx={{ py: 0.5 }}>{process.facility || ''}</Typography>
              ) : (
                <TextField fullWidth size="small" value={process.facility || ''}
                  onChange={(e) => handleProcessFieldChange(globalIndex, 'facility', e.target.value)} />
              )}
            </Box>
          </Box>
        </Box>

        {/* 모바일 레이아웃 */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, p: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('riskAssessment.detailActivityProcess')}</Typography>
            {readOnly ? (
              <Typography variant="body2" sx={{ px: 1.5 }}>{process.detailAction || ''}</Typography>
            ) : (
              <TextField fullWidth size="small" value={process.detailAction}
                onChange={(e) => handleProcessFieldChange(globalIndex, 'detailAction', e.target.value)} />
            )}
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('riskAssessment.frequencyLabel')}</Typography>
            {readOnly ? (
              <Typography variant="body2" sx={{ px: 1.5 }}>{frequencyLabels[process.frequency || ''] || process.frequency || ''}</Typography>
            ) : (
              <RadioGroup row value={process.frequency || ''}
                onChange={(e) => handleProcessFieldChange(globalIndex, 'frequency', e.target.value)}
                sx={{ px: 1 }}>
                {frequencyCodes.map((item) => (
                  <FormControlLabel key={item.code} value={item.code}
                    control={<Radio size="small" />}
                    label={<Typography variant="body2">{getLocalizedName(item)}</Typography>}
                    sx={{ mr: 1 }} />
                ))}
              </RadioGroup>
            )}
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('riskAssessment.workHoursPerSession')}</Typography>
            {readOnly ? (
              <Typography variant="body2" sx={{ px: 1.5 }}>{process.workHours || ''}</Typography>
            ) : (
              <TextField fullWidth size="small" type="number" value={process.workHours || ''}
                onChange={(e) => handleProcessFieldChange(globalIndex, 'workHours', e.target.value ? Number(e.target.value) : undefined)} />
            )}
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('riskAssessment.workerAppropriate')}</Typography>
            {readOnly ? (
              <Typography variant="body2" sx={{ px: 1.5 }}>{process.worker || ''}</Typography>
            ) : (
              <TextField fullWidth size="small" value={process.worker || ''}
                onChange={(e) => handleProcessFieldChange(globalIndex, 'worker', e.target.value)} />
            )}
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('riskAssessment.workerCurrent')}</Typography>
            {readOnly ? (
              <Typography variant="body2" sx={{ px: 1.5 }}>{process.coWorker || ''}</Typography>
            ) : (
              <TextField fullWidth size="small" value={process.coWorker || ''}
                onChange={(e) => handleProcessFieldChange(globalIndex, 'coWorker', e.target.value)} />
            )}
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('riskAssessment.usedFacility')}</Typography>
            {readOnly ? (
              <Typography variant="body2" sx={{ px: 1.5 }}>{process.facility || ''}</Typography>
            ) : (
              <TextField fullWidth size="small" value={process.facility || ''}
                onChange={(e) => handleProcessFieldChange(globalIndex, 'facility', e.target.value)} />
            )}
          </Box>
        </Box>
      </Box>
    )
  }

  const renderStep1CategoryRow = (
    displayNum: number, categoryName: string, readOnly: boolean,
    content: 'process' | 'nonTarget' | 'empty', categoryIdx?: number, isLast?: boolean
  ) => {
    const processes = categoryIdx ? activityProcesses.filter(p => p.majorCategoryIdx === categoryIdx) : []
    const process = processes[0]
    const globalIndex = process ? activityProcesses.findIndex(p => p === process) : -1

    const categoryLabelSx = {
      width: 120, minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.100',
      borderRight: 1, borderColor: 'divider',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.875rem', wordBreak: 'keep-all', textAlign: 'center',
      borderBottom: isLast ? 0 : 1,
    }

    return (
      <>
        {/* PC 레이아웃 */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, borderBottom: isLast ? 0 : 1, borderColor: 'divider' }}>
          <Typography sx={categoryLabelSx}>
            {displayNum}. {categoryName}
          </Typography>
          <Box sx={{ flex: 1 }}>
            {content === 'process' && process ? (
              renderProcessItem(process, 1, globalIndex, readOnly)
            ) : content === 'nonTarget' ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                {t('riskAssessment.nonTarget')}
              </Typography>
            ) : (
              <Box sx={{ py: 4 }} />
            )}
          </Box>
        </Box>
        {/* 모바일 레이아웃 */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, borderBottom: isLast ? 0 : 1, borderColor: 'divider' }}>
          <Typography sx={{ fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1, borderBottom: 1, borderColor: 'divider', fontSize: '0.875rem' }}>
            {displayNum}. {categoryName}
          </Typography>
          {content === 'process' && process ? (
            renderProcessItem(process, 1, globalIndex, readOnly)
          ) : content === 'nonTarget' ? (
            <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              {t('riskAssessment.nonTarget')}
            </Typography>
          ) : (
            <Box sx={{ py: 3 }} />
          )}
        </Box>
      </>
    )
  }

  const renderStep1Content = (readOnly: boolean) => (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      {renderStep1CategoryRow(1, t('riskAssessment.category.officeWork'), readOnly, 'process', 1)}
      {renderStep1CategoryRow(2, t('riskAssessment.category.fieldVisit'), readOnly, 'nonTarget')}
      {renderStep1CategoryRow(3, t('riskAssessment.category.outsourcing'), readOnly, 'process', 3)}
      {renderStep1CategoryRow(4, t('riskAssessment.category.attendance'), readOnly, 'empty', undefined, true)}
    </Paper>
  )

  // Step 2 - 위험성평가서 - 사무업무 탭에서는 SafetyInspectionTab 으로 대체됨. 보존만.
  // @ts-expect-error reserved for potential future restoration
  const _renderStep2Content = (readOnly: boolean) => (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">{t('riskAssessment.assessmentDetail')}</Typography>
          <Tooltip title={t('riskAssessment.viewGradeGuide')}>
            <IconButton size="small" onClick={() => setGuideDialogOpen(true)}>
              <InfoIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', '& .MuiTableCell-root': { border: '1px solid', borderColor: 'divider', wordBreak: 'keep-all' } }}>
        <Table size="small" sx={{ minWidth: 1800 }}>
          <TableHead>
            {/* 1단 그룹 헤더 */}
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold', width: 50, wordBreak: 'keep-all' }} align="center" rowSpan={2}>{t('riskAssessment.rowNumber')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 120, wordBreak: 'keep-all' }} align="center" rowSpan={2}>{t('riskAssessment.processName')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 200, wordBreak: 'keep-all' }} align="center" rowSpan={2}>{t('riskAssessment.hazardFactor')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 80, wordBreak: 'keep-all' }} align="center" rowSpan={2}>{t('riskAssessment.riskCategory')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', wordBreak: 'keep-all' }} align="center" colSpan={3}>{t('riskAssessment.currentRisk')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 80, wordBreak: 'keep-all' }} align="center" rowSpan={2}>{t('riskAssessment.currentRiskGrade')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 200, wordBreak: 'keep-all' }} align="center" rowSpan={2}>{t('riskAssessment.improvementPlan')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 80, wordBreak: 'keep-all' }} align="center" rowSpan={2}>{t('riskAssessment.improvementManager')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 120, whiteSpace: 'nowrap' }} align="center" rowSpan={2}>{t('riskAssessment.improvementDeadline')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', wordBreak: 'keep-all' }} align="center" colSpan={3}>{t('riskAssessment.improvedRiskLevel')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 80, wordBreak: 'keep-all' }} align="center" rowSpan={2}>{t('riskAssessment.improvedRiskGradeCol')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 120, wordBreak: 'keep-all' }} align="center" rowSpan={2}>{t('riskAssessment.relatedLaw')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 100, wordBreak: 'keep-all' }} align="center" rowSpan={2}>{t('riskAssessment.remark')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 80, wordBreak: 'keep-all' }} align="center" rowSpan={2}>{t('riskAssessment.reviewerCol')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 80, wordBreak: 'keep-all' }} align="center" rowSpan={2}>{t('riskAssessment.approverCol')}</TableCell>
            </TableRow>
            {/* 2단 서브 헤더 */}
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold', width: 60, wordBreak: 'keep-all' }} align="center">{t('riskAssessment.possibilityL')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 60, wordBreak: 'keep-all' }} align="center">{t('riskAssessment.severityS')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 70, wordBreak: 'keep-all' }} align="center">{t('riskAssessment.riskValueR')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 60, wordBreak: 'keep-all' }} align="center">{t('riskAssessment.possibilityL')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 60, wordBreak: 'keep-all' }} align="center">{t('riskAssessment.severityS')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 70, wordBreak: 'keep-all' }} align="center">{t('riskAssessment.riskValueR')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assessmentDetails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={20} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">{t('riskAssessment.noAssessmentDetails')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              assessmentDetails.map((detail, index) => {
                const score = calculateRiskScore(detail.possibilityGrade, detail.resultGrade)
                const grade = getRiskGrade(score)
                const improvedScore = detail.improvedPossibilityGrade && detail.improvedResultGrade
                  ? calculateRiskScore(detail.improvedPossibilityGrade, detail.improvedResultGrade)
                  : null
                const improvedGrade = improvedScore ? getRiskGrade(improvedScore) : null
                return (
                  <TableRow key={index}>
                    <TableCell align="center">{index + 1}</TableCell>
                    <TableCell sx={{ wordBreak: 'keep-all' }}>{detail.detailAction}</TableCell>
                    <TableCell>{detail.danger}</TableCell>
                    <TableCell align="center">{detail.risk4M}</TableCell>
                    <TableCell align="center">
                      {readOnly ? detail.possibilityGrade : (
                        <FormControl size="small" sx={{ minWidth: 60 }}>
                          <Select value={detail.possibilityGrade} onChange={(e: SelectChangeEvent<number>) => handleInlineDetailChange(index, 'possibilityGrade', Number(e.target.value))} displayEmpty>
                            <MenuItem value="" disabled>선택하세요</MenuItem>
                            {[1, 2, 3, 4, 5].map((n) => (<MenuItem key={n} value={n}>{n}</MenuItem>))}
                          </Select>
                        </FormControl>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {readOnly ? detail.resultGrade : (
                        <FormControl size="small" sx={{ minWidth: 60 }}>
                          <Select value={detail.resultGrade} onChange={(e: SelectChangeEvent<number>) => handleInlineDetailChange(index, 'resultGrade', Number(e.target.value))} displayEmpty>
                            <MenuItem value="" disabled>선택하세요</MenuItem>
                            {[1, 2, 3, 4, 5].map((n) => (<MenuItem key={n} value={n}>{n}</MenuItem>))}
                          </Select>
                        </FormControl>
                      )}
                    </TableCell>
                    <TableCell align="center">{score}</TableCell>
                    <TableCell align="center">
                      <Chip label={grade} size="small" color={getRiskGradeColor(grade) as 'error' | 'warning' | 'success' | 'default'} />
                    </TableCell>
                    <TableCell>{detail.reductionMeasures || ''}</TableCell>
                    <TableCell align="center">{detail.improvementManager || ''}</TableCell>
                    <TableCell align="center">{detail.improvementDeadline ? formatDate(detail.improvementDeadline) : ''}</TableCell>
                    <TableCell align="center">
                      {readOnly ? (detail.improvedPossibilityGrade || '') : (
                        <FormControl size="small" sx={{ minWidth: 60 }}>
                          <Select value={detail.improvedPossibilityGrade || ''} onChange={(e: SelectChangeEvent<number>) => handleInlineDetailChange(index, 'improvedPossibilityGrade', e.target.value ? Number(e.target.value) : undefined)} displayEmpty>
                            <MenuItem value="" disabled>선택하세요</MenuItem>
                            {[1, 2, 3, 4, 5].map((n) => (<MenuItem key={n} value={n}>{n}</MenuItem>))}
                          </Select>
                        </FormControl>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {readOnly ? (detail.improvedResultGrade || '') : (
                        <FormControl size="small" sx={{ minWidth: 60 }}>
                          <Select value={detail.improvedResultGrade || ''} onChange={(e: SelectChangeEvent<number>) => handleInlineDetailChange(index, 'improvedResultGrade', e.target.value ? Number(e.target.value) : undefined)} displayEmpty>
                            <MenuItem value="" disabled>선택하세요</MenuItem>
                            {[1, 2, 3, 4, 5].map((n) => (<MenuItem key={n} value={n}>{n}</MenuItem>))}
                          </Select>
                        </FormControl>
                      )}
                    </TableCell>
                    <TableCell align="center">{improvedScore || ''}</TableCell>
                    <TableCell align="center">
                      {improvedGrade ? (
                        <Chip label={improvedGrade} size="small" color={getRiskGradeColor(improvedGrade) as 'error' | 'warning' | 'success' | 'default'} />
                      ) : ''}
                    </TableCell>
                    <TableCell>{detail.relatedLaw || ''}</TableCell>
                    <TableCell>{detail.remark || ''}</TableCell>
                    <TableCell align="center">{detail.reviewer || ''}</TableCell>
                    <TableCell align="center">{detail.approverName || ''}</TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
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
      <LoadingOverlay open={isProcessing} message={t('riskAssessment.processingMessage', '처리 중...')} />
      {viewMode === 'list' && renderListView()}
      {viewMode === 'detail' && renderDetailView()}
      {(viewMode === 'create' || viewMode === 'edit') && renderFormView()}

      {/* 위험도 매트릭스 Dialog */}
      <Dialog open={guideDialogOpen} onClose={() => setGuideDialogOpen(false)} maxWidth="lg" fullWidth sx={{ '& .MuiDialog-paper': { mx: { xs: 1, sm: 2 } }, '& .MuiTableCell-root': { border: '1px solid', borderColor: 'divider' } }}>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: { xs: 1.5, sm: 2 }, pt: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 }, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, wordBreak: 'keep-all' }}>
              {t('riskAssessment.gradeGuide').replace(' (', '\n(').split('\n').map((line, i) => (
                i === 0 ? <span key={i}>{line} </span> : <Box key={i} component="span" sx={{ display: { xs: 'block', sm: 'inline' } }}>{line}</Box>
              ))}
            </Typography>
            <IconButton onClick={() => setGuideDialogOpen(false)}><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 1.5, sm: 2 } }}>
          {/* 1. 가능성(L) 및 중대성(S) 평가 기준 */}
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>{t('riskAssessment.possibilitySeverityCriteria')}</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
            {/* 가능성(L) 테이블 */}
            <TableContainer component={Paper} variant="outlined" sx={{ flex: 1, overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 40 }} align="center">{t('riskAssessment.grade')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t('riskAssessment.possibilityLCriteria')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 70 }}>{t('riskAssessment.frequency')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {POSSIBILITY_CRITERIA.map((c) => (
                    <TableRow key={c.score}>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>{c.score}</TableCell>
                      <TableCell sx={{ wordBreak: 'keep-all' }}>{t(`riskAssessment.${c.descKey}`)}</TableCell>
                      <TableCell sx={{ wordBreak: 'keep-all' }}>{t(`riskAssessment.${c.freqKey}`)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {/* 중대성(S) 테이블 */}
            <TableContainer component={Paper} variant="outlined" sx={{ flex: 1, overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 60, whiteSpace: 'nowrap' }} align="center">{t('riskAssessment.grade')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t('riskAssessment.severitySCriteria')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 80 }}>{t('riskAssessment.example')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {RESULT_CRITERIA.map((c) => (
                    <TableRow key={c.score}>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>{c.score}</TableCell>
                      <TableCell sx={{ wordBreak: 'keep-all' }}>{t(`riskAssessment.${c.descKey}`)}</TableCell>
                      <TableCell sx={{ wordBreak: 'keep-all' }}>{t(`riskAssessment.${c.exampleKey}`)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* 2. 위험도 매트릭스 (R = L × S) */}
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>{t('riskAssessment.riskGradeMatrix')}</Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 400 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }} align="center">{t('riskAssessment.matrixHeader')}</TableCell>
                  {RESULT_CRITERIA.map((c) => (
                    <TableCell key={c.score} sx={{ fontWeight: 'bold', minWidth: 50 }} align="center">
                      S={c.score}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {POSSIBILITY_CRITERIA.map((p) => (
                  <TableRow key={p.score}>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.50' }} align="center">
                      L={p.score}
                    </TableCell>
                    {RESULT_CRITERIA.map((r) => {
                      const score = p.score * r.score
                      const grade = getRiskGrade(score)
                      const bgColor = grade === '매우높음(VH)' ? '#FF0000' : grade === '높음(H)' ? '#FFC000' : grade === '중간(M)' ? '#FFFF00' : '#92D050'
                      const textColor = grade === '매우높음(VH)' ? '#FFFFFF' : '#000000'
                      return (
                        <TableCell key={r.score} align="center" sx={{ bgcolor: bgColor, fontWeight: 'bold', color: textColor }}>
                          {score}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 3. 위험등급 판정 기준 */}
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>{t('riskAssessment.gradeManagementGuide')}</Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 550 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }} align="center">{t('riskAssessment.grade')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 80 }} align="center">{t('riskAssessment.scoreRange')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 60 }} align="center">{t('riskAssessment.colorLabel')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 250 }}>{t('riskAssessment.riskLevel')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(RISK_GRADE_CRITERIA).map(([grade, criteria]) => {
                  const colorMap: Record<string, string> = { '낮음(L)': '#92D050', '중간(M)': '#FFFF00', '높음(H)': '#FFC000', '매우높음(VH)': '#FF0000' }
                  return (
                    <TableRow key={grade}>
                      <TableCell align="center">
                        <Chip
                          label={grade}
                          size="small"
                          color={getRiskGradeColor(grade) as 'error' | 'warning' | 'success' | 'default'}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ wordBreak: 'keep-all' }}>{t(`riskAssessment.${criteria.rangeKey}`)}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: colorMap[grade] || '#e0e0e0', mx: 'auto', border: '1px solid', borderColor: 'divider' }} />
                      </TableCell>
                      <TableCell sx={{ wordBreak: 'keep-all' }}>{t(`riskAssessment.${criteria.actionKey}`)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>

      {/* 위험성평가 상세 추가/수정 Dialog 제거됨 - 인라인 편집으로 대체 */}

    </Box>
  )
}

export default RiskAssessmentOfficeWorkTab
