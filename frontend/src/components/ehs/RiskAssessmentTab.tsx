import { formatUserName } from '../../utils/userDisplay'
import { useState, useEffect } from 'react'
import { isSystemAdmin } from '../../utils/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import { useButtonRules } from '../../hooks/useButtonRules'
import { fetchTeamLeader } from '../../api/approvalApi'
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
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import HistoryIcon from '@mui/icons-material/History'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import DeptUserMultiSelectModal from '../common/DeptUserMultiSelectModal'
import DepartmentSelectModal from '../common/DepartmentSelectModal'
import DatePickerField from '../common/DatePickerField'
import { useAuth } from '../../context/AuthContext'
import { riskAssessmentApi } from '../../api/riskAssessmentApi'
import { workplaceApi } from '../../api/workplaceApi'
import {
  RiskAssessment,
  RiskAssessmentRequest,
  RiskActivityProcessRequest,
  RiskAssessmentDetailRequest,
  RiskAssessmentLogEntry,
  RiskAssessmentFieldChange,
  POSSIBILITY_CRITERIA,
  RESULT_CRITERIA,
  RISK_GRADE_CRITERIA,
  calculateRiskScore,
  getRiskGrade,
} from '../../types/riskAssessment.types'
import LoadingOverlay from '../common/LoadingOverlay'
import RejectReasonDialog from '../common/RejectReasonDialog'
import DevTestFillButton from '../common/DevTestFillButton'
import useCodeMap from '../../hooks/useCodeMap'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const MAJOR_CATEGORIES = ['사무업무', '출장/현장방문']


interface RiskAssessmentTabProps {
  mode?: 'plan' | 'management' | 'admin'
}

const RiskAssessmentTab: React.FC<RiskAssessmentTabProps> = ({ mode = 'plan' }) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showConfirm, showSuccess, showWarning } = useAlert()
  const { user } = useAuth()
  const isPlanMode = mode === 'plan'
  const isManagementMode = mode === 'management' || mode === 'admin'
  const isAdminMode = mode === 'admin'
  const { codeMap: raStatusLabels } = useCodeMap('RISK_ASSESSMENT_STATUS')
  const { getLabel: getEvalCategoryLabel } = useCodeMap('EVAL_CATEGORY')
  const { getLabel: getDisasterTypeLabel } = useCodeMap('DISASTER_TYPE')

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedAssessment, setSelectedAssessment] = useState<RiskAssessment | null>(null)

  // List filters
  const [siteFilter, setSiteFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(0)
  const rowsPerPage = 10
  const applySearch = () => { setSearchText(searchInput); setPage(0) }

  // Form state
  const [formData, setFormData] = useState<RiskAssessmentRequest>({
    title: '',
    site: '',
    authorName: '',
    authorDept: '',
    authorMail: '',
  })
  const [deptModalOpen, setDeptModalOpen] = useState(false)

  // Step 1 data
  const [activityProcesses, setActivityProcesses] = useState<RiskActivityProcessRequest[]>([])

  // Step 2 data
  const [assessmentDetails, setAssessmentDetails] = useState<RiskAssessmentDetailRequest[]>([])

  // Form template selection (Step 2-1 사무업무)
  const [step21FormId, setStep21FormId] = useState<number | ''>('')

  // Dialog states
  const [guideDialogOpen, setGuideDialogOpen] = useState(false)
  const [evaluatorPickTarget, setEvaluatorPickTarget] = useState<{ globalIndex: number } | null>(null)
  const [approverPickTarget, setApproverPickTarget] = useState<'plan' | 'completion' | null>(null)
  // 결재 반려 사유 입력 다이얼로그 (단계: 'plan' = 계획 결재 반려, 'completion' = 완료 결재 반려)
  const [rejectDialogStage, setRejectDialogStage] = useState<'plan' | 'completion' | null>(null)

  const handleApproverPicked = (users: UserInfo[]) => {
    if (users.length > 0 && approverPickTarget) {
      const u = users[0]
      if (approverPickTarget === 'plan') {
        setFormData(f => ({
          ...f,
          planApproverUserId: u.id,
          planApproverTeam: u.department || '',
          planApproverName: u.name,
        }))
      } else {
        setFormData(f => ({
          ...f,
          completionApproverUserId: u.id,
          completionApproverTeam: u.department || '',
          completionApproverName: u.name,
        }))
      }
    }
    setApproverPickTarget(null)
  }

  const isAdmin = isSystemAdmin(user)
  const { canSee } = useButtonRules()
  const MENU = '안전 관리 › 위험성 평가'
  const getItemRoles = (item: { authorName?: string|null; planApproverName?: string|null; completionApproverName?: string|null } | null): string[] => {
    const roles: string[] = ['guest']
    if (isAdmin) roles.push('superAdmin')
    else if (user?.role) roles.push(user.role)
    if (item?.authorName && user?.name && item.authorName === user.name) roles.push('writer')
    if (item?.planApproverName && user?.name && item.planApproverName === user.name) roles.push('planApprover')
    if (item?.completionApproverName && user?.name && item.completionApproverName === user.name) roles.push('completionApprover')
    return roles
  }
  const myRoles: string[] = ['guest', ...(user?.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : (user?.role ? [user.role] : []))]

  // Fetch sites from API
  const { data: sitesData } = useQuery({
    queryKey: ['workplaceSites'],
    queryFn: workplaceApi.getSites,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
  const sites = sitesData || []

  // Fetch form templates for dropdown
  const { data: formTemplates } = useQuery({
    queryKey: ['riskAssessmentFormsDropdown'],
    queryFn: riskAssessmentApi.getFormsDropdown,
    staleTime: 1000 * 60 * 5,
  })

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: ['riskAssessments', mode, page, siteFilter, statusFilter],
    queryFn: () =>
      riskAssessmentApi.getAll({
        page,
        size: 100,
        site: siteFilter || undefined,
        status: statusFilter || undefined,
      }),
    enabled: viewMode === 'list',
  })

  const { data: assessmentDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['riskAssessmentDetail', selectedAssessment?.id],
    queryFn: () => riskAssessmentApi.getById(selectedAssessment!.id),
    enabled: !!selectedAssessment?.id && (viewMode === 'detail' || viewMode === 'edit'),
  })

  const { data: assessmentLogs } = useQuery({
    queryKey: ['riskAssessmentLogs', selectedAssessment?.id],
    queryFn: () => riskAssessmentApi.getLogs(selectedAssessment!.id),
    enabled: !!selectedAssessment?.id && viewMode === 'detail',
  })

  // Load step data when assessment is selected
  useEffect(() => {
    if (assessmentDetail && (viewMode === 'detail' || viewMode === 'edit')) {
      // Load activity processes for step 1
      riskAssessmentApi.getActivityProcesses(assessmentDetail.riskId).then((data) => {
        setActivityProcesses(
          data.map((p) => ({
            majorCategoryIdx: p.majorCategoryIdx,
            majorCategory: p.majorCategory,
            detailAction: p.detailAction,
            evaluationDate: p.evaluationDate || undefined,
            evaluator: p.evaluator || undefined,
            isTarget: p.isTarget,
          }))
        )
      })

      // Load assessment details for step 2
      riskAssessmentApi.getAssessmentDetails(assessmentDetail.riskId).then((data) => {
        setAssessmentDetails(
          data.map((d) => ({
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
            improvedPossibilityGrade: d.improvedPossibilityGrade || undefined,
            improvedResultGrade: d.improvedResultGrade || undefined,
            createdAt: d.createdAt || undefined,
          }))
        )
      })

    }
  }, [assessmentDetail, viewMode])

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
      }
      queryClient.invalidateQueries({ queryKey: ['riskAssessments'] })
      queryClient.invalidateQueries({ queryKey: ['riskAssessmentDetail'] })
      queryClient.invalidateQueries({ queryKey: ['riskAssessmentLogs'] })
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
    setFormData({
      title: '',
      site: '',
      authorName: '',
      authorDept: '',
      authorMail: '',
    })
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
        authorMail: assessmentDetail.authorMail || undefined,
      })
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

  const handleAddClick = async () => {
    setSelectedAssessment(null)
    const firstFormId = formTemplates && formTemplates.length > 0 ? formTemplates[0].id : ''
    setStep21FormId(firstFormId)
    const leader = await fetchTeamLeader(user?.deptCode)
    const team = user?.department || ''
    const defaultTitle = team ? `위험성평가 – ${team}` : '위험성평가'
    const today = new Date().toISOString().substring(0, 10)
    setFormData({
      title: defaultTitle,
      site: '',
      authorName: user?.name || '',
      authorDept: team,
      authorMail: user?.email || '',
      formId: typeof firstFormId === 'number' ? firstFormId : undefined,
      ...(leader ? {
        planApproverName: leader.name, planApproverPosition: leader.position, planApproverTeam: leader.team,
      } : {}),
    })
    setActivityProcesses([
      {
        majorCategoryIdx: 1,
        majorCategory: MAJOR_CATEGORIES[0],
        detailAction: '',
        evaluationDate: today,
        evaluator: '',
        isTarget: true,
      },
    ])
    setViewMode('create')
    setAssessmentDetails([])
    if (firstFormId) {
      loadFormItemsForCategory(firstFormId, '사무업무', isPlanMode)
    }
  }

  const loadFormItemsForCategory = async (formId: number | '', category: string, clearScores: boolean = false) => {
    if (!formId) {
      setAssessmentDetails(prev => prev.filter(d => d.majorCategory !== category))
      return
    }
    try {
      const formData = await riskAssessmentApi.getFormById(formId as number)
      const newItems: RiskAssessmentDetailRequest[] = (formData.items || []).map((item) => ({
        activityProcessId: 0,
        riskIdx: item.riskIdx,
        majorCategory: category,
        detailAction: item.detailAction || '',
        risk4M: item.risk4M || '',
        danger: item.danger || '',
        expectedDisaster: item.expectedDisaster || '',
        target: item.target || '',
        currentSafetyMeasures: item.currentSafetyMeasures || '',
        possibilityGrade: clearScores ? undefined as any : (item.possibilityGrade || 1),
        resultGrade: clearScores ? undefined as any : (item.resultGrade || 1),
        isRegistered: false,
        reductionMeasures: clearScores ? '' : (item.reductionMeasures || ''),
        improvedPossibilityGrade: clearScores ? undefined : (item.improvedPossibilityGrade || 1),
        improvedResultGrade: clearScores ? undefined : (item.improvedResultGrade || 1),
      }))
      setAssessmentDetails(prev => [...prev.filter(d => d.majorCategory !== category), ...newItems])
    } catch {
      // ignore
    }
  }

  const handleStep21FormChange = async (formId: number | '') => {
    setStep21FormId(formId)
    // formData.formId 도 함께 갱신해야 저장 시 backend 가 올바른 form_id / form_title 스냅샷을 기록
    setFormData(prev => ({ ...prev, formId: typeof formId === 'number' ? formId : undefined }))
    await loadFormItemsForCategory(formId, '사무업무', isPlanMode)
  }

  const handleEditClick = () => {
    if (!assessmentDetail) return
    setFormData({
      title: assessmentDetail.title,
      site: assessmentDetail.site,
      authorName: assessmentDetail.authorName || undefined,
      authorDept: assessmentDetail.authorDept || undefined,
      authorMail: assessmentDetail.authorMail || undefined,
      planApproverUserId: assessmentDetail.planApproverUserId,
      planApproverTeam: assessmentDetail.planApproverTeam || '',
      planApproverPosition: assessmentDetail.planApproverPosition || '',
      planApproverName: assessmentDetail.planApproverName || '',
      completionApproverUserId: assessmentDetail.completionApproverUserId,
      completionApproverTeam: assessmentDetail.completionApproverTeam || '',
      completionApproverPosition: assessmentDetail.completionApproverPosition || '',
      completionApproverName: assessmentDetail.completionApproverName || '',
      formId: assessmentDetail.formId || undefined,
    })
    setStep21FormId(assessmentDetail.formId || '')
    // 기존에 활동공정이 없는 플랜을 수정할 때도 입력 필드가 나오도록 기본 행 1개 보장
    setActivityProcesses(prev => prev.length > 0 ? prev : [{
      majorCategoryIdx: 1,
      majorCategory: MAJOR_CATEGORIES[0],
      detailAction: '',
      evaluationDate: new Date().toISOString().substring(0, 10),
      evaluator: '',
      isTarget: true,
    }])
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

  // DEV ONLY — 비어있는 항목을 위험성평가 더미데이터로 채움 (입력값·승인자·평가자 보존)
  const fillTestData = () => {
    setFormData(prev => ({
      ...prev,
      title: prev.title || '위험성평가 – 사무업무',
      site: prev.site || (sites[0] ?? prev.site),   // 사업장(지역)
    }))
    setActivityProcesses(prev => {
      const base = prev.length > 0 ? prev : [{ majorCategoryIdx: 1, majorCategory: MAJOR_CATEGORIES[0], detailAction: '', evaluationDate: new Date().toISOString().substring(0, 10), evaluator: '', isTarget: true }]
      const next = [...base]
      next[0] = { ...next[0], detailAction: next[0].detailAction || 'VDU 작업(모니터·키보드 사용)' }
      return next
    })
  }

  const handleSubmit = async () => {
    // 사업장 또는 부서 둘 중 하나는 반드시 입력
    if (!(formData.site || '').trim() && !(formData.authorDept || '').trim()) {
      showWarning(t('riskAssessment.siteOrDeptRequired', '사업장 또는 부서 중 하나는 반드시 선택해야 합니다.'))
      return
    }
    if (!formData.formId) {
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

  const transitionMutation = useMutation({
    mutationFn: ({ id, action, rejectReason }: { id: number; action: 'submit' | 'approve' | 'reject' | 'completionSubmit' | 'complete'; rejectReason?: string }) =>
      riskAssessmentApi.transition(id, action, rejectReason),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['riskAssessments'] })
      queryClient.invalidateQueries({ queryKey: ['riskAssessmentDetail'] })
      queryClient.invalidateQueries({ queryKey: ['riskAssessmentLogs'] })
      await showSuccess(t('common.saveSuccess'))
    },
  })

  // 계획 결재 상신 (draft|rejected → submitted)
  const handleSubmitForApproval = async () => {
    if (!selectedAssessment) return
    const confirmed = await showConfirm(t('riskAssessment.confirmSubmit', '계획 결재를 상신하시겠습니까?'))
    if (!confirmed) return
    transitionMutation.mutate({ id: selectedAssessment.id, action: 'submit' })
  }

  // 계획 결재 승인 (submitted → approved)
  const handleApprove = async () => {
    if (!selectedAssessment) return
    const confirmed = await showConfirm(t('riskAssessment.confirmApprove', '계획 결재를 승인하시겠습니까?'))
    if (!confirmed) return
    transitionMutation.mutate({ id: selectedAssessment.id, action: 'approve' })
  }

  // 반려 — 반려 사유 다이얼로그 오픈 (계획 단계)
  const handleReject = () => {
    if (!selectedAssessment) return
    setRejectDialogStage('plan')
  }
  // 완료 결재 반려 — 반려 사유 다이얼로그 오픈
  const handleCompletionReject = () => {
    if (!selectedAssessment) return
    setRejectDialogStage('completion')
  }
  // 다이얼로그 확인 시 실제 transition 실행 (반려 사유 필수 — 다이얼로그 자체에서 trim 검증)
  const handleRejectConfirm = (reason: string) => {
    if (!selectedAssessment) return
    transitionMutation.mutate({ id: selectedAssessment.id, action: 'reject', rejectReason: reason })
    setRejectDialogStage(null)
  }

  // 완료 결재 상신 (approved → completion_submitted)
  const handleSubmitForCompletion = async () => {
    if (!selectedAssessment) return
    try {
      await riskAssessmentApi.saveAssessmentDetailsBatch(selectedAssessment.riskId, assessmentDetails)
    } catch { /* continue */ }
    const confirmed = await showConfirm(t('riskAssessment.confirmCompletionSubmit', '완료 결재를 상신하시겠습니까?'))
    if (!confirmed) return
    transitionMutation.mutate({ id: selectedAssessment.id, action: 'completionSubmit' })
  }

  // 완료 결재 승인 (completion_submitted → completed)
  const handleComplete = async () => {
    if (!selectedAssessment) return
    const confirmed = await showConfirm(t('riskAssessment.confirmCompletion', '완료 결재를 승인하시겠습니까?'))
    if (!confirmed) return
    transitionMutation.mutate({ id: selectedAssessment.id, action: 'complete' })
  }

  const handleSaveDetails = async () => {
    if (!selectedAssessment) return
    try {
      await riskAssessmentApi.saveAssessmentDetailsBatch(selectedAssessment.riskId, assessmentDetails)
      queryClient.invalidateQueries({ queryKey: ['riskAssessmentDetail'] })
      queryClient.invalidateQueries({ queryKey: ['riskAssessmentLogs'] })
      await showSuccess(t('common.saveSuccess'))
    } catch { /* ignore */ }
  }

  // Step 1 - Inline editing handlers
  const handleProcessFieldChange = (globalIndex: number, field: keyof RiskActivityProcessRequest, value: unknown) => {
    const newProcesses = activityProcesses.length > 0
      ? [...activityProcesses]
      : [{ majorCategoryIdx: 1, majorCategory: MAJOR_CATEGORIES[0], detailAction: '', evaluationDate: '', evaluator: '', isTarget: true }]
    const idx = Math.max(0, globalIndex)
    newProcesses[idx] = { ...newProcesses[idx], [field]: value }
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

  const logFieldLabel = (key: string): string => {
    const fallback: Record<string, string> = {
      title: '제목', site: '사업장',
      authorName: '작성자', authorDept: '부서', authorMail: '이메일',
      approverName: '결재자', approverMail: '결재자 이메일',
      formTitle: '체크리스트',
    }
    return t(`riskAssessment.field.${key}`, fallback[key] ?? key)
  }

  const parseLogFieldChanges = (raw?: string | null): RiskAssessmentFieldChange[] => {
    if (!raw) return []
    try {
      const v = JSON.parse(raw)
      return Array.isArray(v) ? (v as RiskAssessmentFieldChange[]) : []
    } catch { return [] }
  }

  const logActionLabel = (action: string): string => {
    switch (action) {
      case 'FIELD_UPDATE': return t('riskAssessment.logFieldUpdate', '항목 수정')
      case 'STATUS_CHANGE': return t('riskAssessment.logStatusChange', '상태 변경')
      case 'CHECKLIST_SAVE': return t('riskAssessment.logChecklistSave', '체크리스트 저장')
      case 'ACTIVITY_PROCESS_SAVE': return t('riskAssessment.logActivityProcessSave', '활동공정 저장')
      case 'APPROVAL_SUBMIT': return t('riskAssessment.logApprovalSubmit', '승인 요청')
      case 'APPROVAL_APPROVED': return t('riskAssessment.logApprovalApproved', '승인 완료')
      case 'APPROVAL_REJECTED': return t('riskAssessment.logApprovalRejected', '반려')
      case 'APPROVAL_COMPLETED': return t('riskAssessment.logApprovalCompleted', '작업 완료')
      default: return action
    }
  }

  const logChipColor = (action: string): 'default' | 'info' | 'success' | 'error' | 'warning' | 'primary' => {
    switch (action) {
      case 'FIELD_UPDATE': return 'warning'
      case 'STATUS_CHANGE': return 'info'
      case 'CHECKLIST_SAVE':
      case 'ACTIVITY_PROCESS_SAVE': return 'info'
      case 'APPROVAL_SUBMIT': return 'primary'
      case 'APPROVAL_APPROVED':
      case 'APPROVAL_COMPLETED': return 'success'
      case 'APPROVAL_REJECTED': return 'error'
      default: return 'default'
    }
  }

  const renderLogContent = (log: RiskAssessmentLogEntry) => {
    if (log.action === 'FIELD_UPDATE') {
      const diffs = parseLogFieldChanges(log.fieldChanges)
      if (diffs.length > 0) {
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            {diffs.map((d, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, flexWrap: 'wrap', fontSize: '0.85rem' }}>
                <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{logFieldLabel(d.field)}</Typography>
                <Typography component="span" sx={{ color: 'text.secondary', textDecoration: 'line-through', fontSize: '0.8rem' }}>{d.before ?? ''}</Typography>
                <Typography component="span" sx={{ fontSize: '0.8rem' }}>→</Typography>
                <Typography component="span" sx={{ fontWeight: 600, color: 'primary.main', fontSize: '0.8rem' }}>{d.after ?? ''}</Typography>
              </Box>
            ))}
          </Box>
        )
      }
    }
    if (log.action === 'APPROVAL_REJECTED' && log.rejectReason) {
      return (
        <Box>
          <Typography variant="caption" color="error.main" fontWeight="bold">
            {t('riskAssessment.logRejectReason', '반려 사유')}
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{log.rejectReason}</Typography>
        </Box>
      )
    }
    return <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{log.detail || ''}</Typography>
  }

  const getStatusChip = (status: string) => {
    // 관리(관리자) 모드: 이미 계획 결재 승인된 항목이 모이는 곳이라
    // KPI 현황과 동일하게 'APPROVED' = '작성중' (default), 'COMPLETION_SUBMITTED'
    // = '완료 결재 대기' (warning), 'COMPLETED' = '완료' (success) 로 표기.
    if (isManagementMode) {
      if (status === 'APPROVED') {
        return <Chip label={t('common.draft', '작성중')} size="small" color="default" />
      }
      if (status === 'COMPLETION_SUBMITTED') {
        return <Chip label={t('riskAssessment.status.completion_submitted', '완료 결재 대기')} size="small" color="warning" />
      }
      if (status === 'COMPLETED') {
        return <Chip label={t('common.done', '완료')} size="small" color="success" />
      }
    }

    const statusLower = status.toLowerCase()
    // 1) i18n 키 조회 (DRAFT → draft 키로 매핑)
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

    // 색상 매핑 — AnnualPlanTab(PLAN_STATUS) 톤과 일치:
    //   DRAFT/draft=default · PENDING/submitted=warning · APPROVED/approved=info ·
    //   DONE/completed=success · rejected=error
    const colorMap: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
      draft: 'default',
      submitted: 'warning',
      in_progress: 'warning',
      approval_request: 'warning',
      approved: 'info',
      completion_submitted: 'warning',
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

  const allAssessments = data?.content || []
  const planStatuses = new Set(['', 'DRAFT', 'SUBMITTED', 'REJECTED'])
  const managementStatuses = new Set(['APPROVED', 'COMPLETION_SUBMITTED', 'COMPLETED'])
  const userDept = (user?.department || '').trim()
  const filtered = allAssessments.filter(a => {
    const s = a.status || ''
    if (isPlanMode) {
      if (!planStatuses.has(s)) return false
    } else {
      if (!managementStatuses.has(s)) return false
      // 관리(관리자)는 전체, 관리는 본인 소속만
      if (!isAdminMode && !(userDept !== '' && (a.authorDept || '').trim() === userDept)) return false
    }
    if (searchText && !(a.title || '').toLowerCase().includes(searchText.toLowerCase())) return false
    return true
  })
  const pageStart = page * rowsPerPage
  const assessments = filtered.slice(pageStart, pageStart + rowsPerPage)
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

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
          {canSee(MENU, 'LIST', 'New', myRoles) && isPlanMode && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick}>
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
          {canSee(MENU, 'LIST', 'New', myRoles) && isPlanMode && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick} sx={{ flex: 1 }}>New</Button>
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
              <TableCell sx={{ fontWeight: 'bold', width: 110, minWidth: 110, borderRight: 1, borderColor: 'divider', whiteSpace: 'nowrap' }} align="center">{t('riskAssessment.author')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 120, borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }} align="center">{t('riskAssessment.department')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 90, borderRight: 1, borderColor: 'divider', whiteSpace: 'nowrap' }} align="center">{t('riskAssessment.itemCount', '항목 수')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 80, borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }} align="center">{t('common.status')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 80, borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' }} align="center">{t('riskAssessment.approver')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 120, borderRight: isPlanMode ? 0 : 1, borderColor: 'divider', wordBreak: 'keep-all' }} align="center">{t('riskAssessment.completedDate')}</TableCell>
              {!isPlanMode && (
                <TableCell sx={{ fontWeight: 'bold', width: 100, wordBreak: 'keep-all' }} align="center">{t('riskAssessment.assessmentCount')}</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {assessments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isPlanMode ? 8 : 9} align="center" sx={{ py: 4 }}>
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
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{item.detailCount ?? 0}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{getStatusChip(item.status)}</TableCell>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'divider' }}>{item.approverName || ''}</TableCell>
                  <TableCell align="center" sx={{ borderRight: isPlanMode ? 0 : 1, borderColor: 'divider' }}>{formatDate(item.completedDate)}</TableCell>
                  {!isPlanMode && <TableCell align="center">{item.officeCount}</TableCell>}
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
                  <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 50 }}>{t('riskAssessment.itemCount', '항목 수')}</Typography>
                  <Typography variant="body2">{item.detailCount ?? 0}</Typography>
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
    <Box>
      {detailLoading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      ) : assessmentDetail ? (
        <>
          {/* 반려 사유 배너 (반려 상태일 때 상단 강조) */}
          {assessmentDetail.status === 'REJECTED' && assessmentDetail.rejectReason && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'error.lighter', border: 1, borderColor: 'error.light', borderRadius: 1 }}>
              <Typography variant="body2" color="error.main" fontWeight="bold" sx={{ mb: 0.5 }}>
                {t('common.rejectReasonTitle', '반려 사유')}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{assessmentDetail.rejectReason}</Typography>
            </Box>
          )}

          {/* 기본 정보 — 통합 폼 테이블: 제목 / 사업장|부서 / 평가자|평가일시 / 작성자|작성일자 / 수정자|수정일자 / 계획승인자|완료승인자 / 체크리스트 */}
          {(() => {
            const proc0 = activityProcesses[0] || { majorCategoryIdx: 1, majorCategory: '', detailAction: '', evaluationDate: '', evaluator: '', isTarget: true }
            const fmtDt = (s?: string | null) => s ? s.replace('T', ' ').substring(0, 16) : ''
            const hasModified = !!(assessmentDetail.modifiedAt && assessmentDetail.modifiedAt !== assessmentDetail.createdAt)
            const checklistName = assessmentDetail.formTitle || (formTemplates || []).find(f => f.id === assessmentDetail.formId)?.title || ''
            const lblCellSx = { width: 130, minWidth: 130, fontWeight: 'bold' as const, bgcolor: 'grey.100', textAlign: 'center' as const, borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' as const, whiteSpace: 'nowrap' as const }
            const mLbl = { mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }
            return (
              <Box sx={{ mb: 3 }}>
                {/* 상태 / 완료일 — 헤더 영역 chip */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
                  {getStatusChip(assessmentDetail.status)}
                  {assessmentDetail.completedDate && (
                    <Typography variant="caption" color="text.secondary">
                      {t('riskAssessment.completedDate')}: {formatDate(assessmentDetail.completedDate)}
                    </Typography>
                  )}
                </Box>

                {/* PC */}
                <TableContainer component={Paper} variant="outlined" sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto', '& .MuiPaper-root': { borderColor: 'divider' } }}>
                  <Table size="small" sx={{ minWidth: 600, '& .MuiTableCell-root': { borderColor: 'divider' } }}>
                    <TableBody>
                      {/* 제목 */}
                      <TableRow>
                        <TableCell sx={lblCellSx}>{t('common.title')}</TableCell>
                        <TableCell colSpan={3} sx={{ textAlign: assessmentDetail.title ? 'left' : 'center', fontWeight: 600 }}>{assessmentDetail.title || ''}</TableCell>
                      </TableRow>
                      {/* 사업장 | 부서 */}
                      <TableRow>
                        <TableCell sx={lblCellSx}>{t('riskAssessment.region')}</TableCell>
                        <TableCell sx={{ borderRight: 1, borderColor: 'divider', textAlign: assessmentDetail.site ? 'left' : 'center' }}>{assessmentDetail.site || ''}</TableCell>
                        <TableCell sx={lblCellSx}>{t('riskAssessment.department')}</TableCell>
                        <TableCell sx={{ textAlign: assessmentDetail.authorDept ? 'left' : 'center' }}>{assessmentDetail.authorDept || ''}</TableCell>
                      </TableRow>
                      {/* 평가자 | 평가일시 */}
                      <TableRow>
                        <TableCell sx={lblCellSx}>{t('riskAssessment.evaluator', '평가자')}</TableCell>
                        <TableCell sx={{ borderRight: 1, borderColor: 'divider', textAlign: proc0.evaluator ? 'left' : 'center' }}>{proc0.evaluator || ''}</TableCell>
                        <TableCell sx={lblCellSx}>{t('riskAssessment.evaluationDate', '평가일시')}</TableCell>
                        <TableCell sx={{ textAlign: proc0.evaluationDate ? 'left' : 'center', fontFamily: proc0.evaluationDate ? 'monospace' : undefined }}>
                          {proc0.evaluationDate ? formatDate(proc0.evaluationDate) : ''}
                        </TableCell>
                      </TableRow>
                      {/* 작성자 | 작성일자 */}
                      <TableRow>
                        <TableCell sx={lblCellSx}>{t('common.creator', '작성자')}</TableCell>
                        <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{formatUserName(assessmentDetail.authorTeam, assessmentDetail.authorName, assessmentDetail.authorPosition)}</TableCell>
                        <TableCell sx={lblCellSx}>{t('audit.createdAt', '작성일자')}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{fmtDt(assessmentDetail.createdAt)}</TableCell>
                      </TableRow>
                      {/* 수정자 | 수정일자 — 수정 이력 있을 때만 */}
                      {hasModified && (
                        <TableRow>
                          <TableCell sx={lblCellSx}>{t('common.modifier', '수정자')}</TableCell>
                          <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{(assessmentDetail as any)?.modifiedByName || ''}</TableCell>
                          <TableCell sx={lblCellSx}>{t('common.modifiedAt', '수정일자')}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{fmtDt(assessmentDetail.modifiedAt)}</TableCell>
                        </TableRow>
                      )}
                      {/* 계획승인자 | 완료승인자 */}
                      <TableRow>
                        <TableCell sx={{ ...lblCellSx, width: 130, minWidth: 130, whiteSpace: 'nowrap' }}>{t('riskAssessment.planApprover', '계획 승인자')}</TableCell>
                        <TableCell sx={{ borderRight: 1, borderColor: 'divider', textAlign: assessmentDetail.planApproverName ? 'left' : 'center' }}>
                          {formatUserName(assessmentDetail.planApproverTeam, assessmentDetail.planApproverName, assessmentDetail.planApproverPosition) || ''}
                          {assessmentDetail.planApprovedAt && (
                            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              ({assessmentDetail.planApprovedBy} | {assessmentDetail.planApprovedAt.replace('T', ' ').substring(0, 19)})
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ ...lblCellSx, width: 130, minWidth: 130, whiteSpace: 'nowrap' }}>{t('riskAssessment.completionApprover', '완료 승인자')}</TableCell>
                        <TableCell sx={{ textAlign: assessmentDetail.completionApproverName ? 'left' : 'center' }}>
                          {formatUserName(assessmentDetail.completionApproverTeam, assessmentDetail.completionApproverName, assessmentDetail.completionApproverPosition) || ''}
                          {assessmentDetail.completionApprovedAt && (
                            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              ({assessmentDetail.completionApprovedBy} | {assessmentDetail.completionApprovedAt.replace('T', ' ').substring(0, 19)})
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                      {/* 체크리스트 */}
                      <TableRow>
                        <TableCell sx={lblCellSx}>{t('common.checklist', '체크리스트')}</TableCell>
                        <TableCell colSpan={3} sx={{ textAlign: checklistName ? 'left' : 'center' }}>{checklistName}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* 모바일 */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={mLbl}>{t('common.title')}</Typography>
                    <Typography variant="body2" sx={{ px: 1.5, py: 0.5, fontWeight: 600 }}>{assessmentDetail.title || ''}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={mLbl}>{t('riskAssessment.region')}</Typography>
                    <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{assessmentDetail.site || ''}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={mLbl}>{t('riskAssessment.department')}</Typography>
                    <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{assessmentDetail.authorDept || ''}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={mLbl}>{t('riskAssessment.evaluator', '평가자')}</Typography>
                    <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{proc0.evaluator || ''}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={mLbl}>{t('riskAssessment.evaluationDate', '평가일시')}</Typography>
                    <Typography variant="body2" sx={{ px: 1.5, py: 0.5, fontFamily: 'monospace' }}>{proc0.evaluationDate ? formatDate(proc0.evaluationDate) : ''}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={mLbl}>{t('common.creator', '작성자')}</Typography>
                    <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{formatUserName(assessmentDetail.authorTeam, assessmentDetail.authorName, assessmentDetail.authorPosition)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={mLbl}>{t('audit.createdAt', '작성일자')}</Typography>
                    <Typography variant="body2" sx={{ px: 1.5, py: 0.5, fontFamily: 'monospace' }}>{fmtDt(assessmentDetail.createdAt)}</Typography>
                  </Box>
                  {hasModified && (
                    <>
                      <Box>
                        <Typography variant="body2" fontWeight="bold" sx={mLbl}>{t('common.modifier', '수정자')}</Typography>
                        <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{(assessmentDetail as any)?.modifiedByName || ''}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight="bold" sx={mLbl}>{t('common.modifiedAt', '수정일자')}</Typography>
                        <Typography variant="body2" sx={{ px: 1.5, py: 0.5, fontFamily: 'monospace' }}>{fmtDt(assessmentDetail.modifiedAt)}</Typography>
                      </Box>
                    </>
                  )}
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={mLbl}>{t('riskAssessment.planApprover', '계획 승인자')}</Typography>
                    <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{formatUserName(assessmentDetail.planApproverTeam, assessmentDetail.planApproverName, assessmentDetail.planApproverPosition) || ''}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={mLbl}>{t('riskAssessment.completionApprover', '완료 승인자')}</Typography>
                    <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{formatUserName(assessmentDetail.completionApproverTeam, assessmentDetail.completionApproverName, assessmentDetail.completionApproverPosition) || ''}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={mLbl}>{t('common.checklist', '체크리스트')}</Typography>
                    <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{checklistName}</Typography>
                  </Box>
                </Box>
              </Box>
            )
          })()}

          {/* 체크리스트 정보 + 상세 항목 — formId/formTitle/detail 이 없어도 항상 노출 (없으면 '-' 와 빈 표 메시지) */}
          <Box sx={{ mb: 3 }}>
            {renderChecklistInfo(assessmentDetail.formId || 0)}
            {renderStep2Content(!isManagementMode)}
          </Box>

          {/* ===== 변경 이력 ===== */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <HistoryIcon fontSize="small" />{t('riskAssessment.changeHistory', '변경 이력')}
            </Typography>
            {(!assessmentLogs || assessmentLogs.length === 0) ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                <Typography variant="body2" color="text.secondary">{t('common.noData', '데이터가 없습니다')}</Typography>
              </Paper>
            ) : (
              <>
                {/* PC 테이블 */}
                <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, border: '1px solid', borderColor: 'divider' }}>
                  <Table size="small" sx={{ '& td, & th': { borderRight: '1px solid', borderColor: 'divider', px: 1.5, py: 1 }, '& td:last-child, & th:last-child': { borderRight: 'none' } }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell sx={{ fontWeight: 'bold', width: 160, textAlign: 'center' }}>{t('common.date', '일시')}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 100, textAlign: 'center' }}>{t('common.modifiedBy', '수정자')}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 130, textAlign: 'center' }}>{t('riskAssessment.logAction', '구분')}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>{t('riskAssessment.logDetail', '내용')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assessmentLogs.map((logEntry) => (
                        <TableRow key={logEntry.id} hover>
                          <TableCell sx={{ textAlign: 'center', fontSize: '0.8rem', fontFamily: 'monospace' }}>{logEntry.createdAt?.replace('T', ' ').substring(0, 19)}</TableCell>
                          <TableCell sx={{ textAlign: 'center', fontSize: '0.85rem' }}>{logEntry.changedBy || ''}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Chip size="small" label={logActionLabel(logEntry.action)} color={logChipColor(logEntry.action)} />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.85rem' }}>{renderLogContent(logEntry)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {/* Mobile 카드 */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
                  {assessmentLogs.map((logEntry) => (
                    <Paper key={logEntry.id} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{logEntry.createdAt?.replace('T', ' ').substring(0, 19)}</Typography>
                        <Chip size="small" label={logActionLabel(logEntry.action)} color={logChipColor(logEntry.action)} />
                      </Box>
                      {logEntry.changedBy && <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{t('common.modifiedBy', '수정자')}: {logEntry.changedBy}</Typography>}
                      {renderLogContent(logEntry)}
                    </Paper>
                  ))}
                </Box>
              </>
            )}
          </Box>

          {(() => {
            const status = (assessmentDetail?.status || '').toLowerCase()
            const itemRoles = getItemRoles(selectedAssessment)

            const buttons: React.ReactNode[] = []

            // 계획 모드: draft/rejected → 결재 상신, submitted → 승인/반려
            if (isPlanMode) {
              if ((status === 'DRAFT' || status === 'REJECTED') &&
                  canSee(MENU, status, '계획 결재 상신', itemRoles)) {
                buttons.push(
                  <Button key="planSubmit" variant="contained" color="info" onClick={handleSubmitForApproval}>
                    {t('riskAssessment.planSubmit', '계획 결재 상신')}
                  </Button>
                )
              }
              if (status === 'SUBMITTED') {
                if (canSee(MENU, 'SUBMITTED', '반려', itemRoles)) {
                  buttons.push(
                    <Button key="reject" variant="contained" color="warning" onClick={handleReject}>
                      {t('common.reject', '반려')}
                    </Button>
                  )
                }
                if (canSee(MENU, 'SUBMITTED', '계획 결재 승인', itemRoles)) {
                  buttons.push(
                    <Button key="planApprove" variant="contained" color="success" onClick={handleApprove}>
                      {t('riskAssessment.planApprove', '계획 결재 승인')}
                    </Button>
                  )
                }
              }
            }

            // 관리 모드: APPROVED → 완료 결재 상신, COMPLETION_SUBMITTED → 완료 결재 승인/반려
            if (isManagementMode) {
              if (status === 'APPROVED') {
                if (canSee(MENU, 'APPROVED', '저장 (실시 내용)', itemRoles)) {
                  buttons.push(
                    <Button key="saveDetails" variant="contained" onClick={handleSaveDetails}>
                      {t('common.save', '저장')}
                    </Button>
                  )
                }
                if (canSee(MENU, 'APPROVED', '완료 결재 상신', itemRoles)) {
                  buttons.push(
                    <Button key="completionSubmit" variant="contained" color="info" onClick={handleSubmitForCompletion}>
                      {t('riskAssessment.completionSubmit', '완료 결재 상신')}
                    </Button>
                  )
                }
              }
              if (status === 'COMPLETION_SUBMITTED') {
                if (canSee(MENU, 'COMPLETION_SUBMITTED', '반려 (완료)', itemRoles)) {
                  buttons.push(
                    <Button key="completionReject" variant="contained" color="warning" onClick={handleCompletionReject}>
                      {t('common.reject', '반려')}
                    </Button>
                  )
                }
                if (canSee(MENU, 'COMPLETION_SUBMITTED', '완료 결재 승인', itemRoles)) {
                  buttons.push(
                    <Button key="completionApprove" variant="contained" color="success" onClick={handleComplete}>
                      {t('riskAssessment.completionApprove', '완료 결재 승인')}
                    </Button>
                  )
                }
              }
            }

            return (
              <>
                {/* PC — 순서: 목록 / (결재 상신/승인/반려 등) / 수정 / 삭제 */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mt: 3, justifyContent: 'flex-end' }}>
                  <Button variant="outlined" onClick={handleBackToList}>{t('common.list')}</Button>
                  {buttons}
                  {canSee(MENU, 'DETAIL', '수정', getItemRoles(selectedAssessment)) && isPlanMode && (status === 'DRAFT' || status === 'REJECTED') && (
                    <Button variant="contained" onClick={handleEditClick}>{t('common.edit')}</Button>
                  )}
                  {/* 삭제는 결재 상신 전(draft/rejected)에만 노출 */}
                  {canSee(MENU, 'DETAIL', '삭제', getItemRoles(selectedAssessment)) && isPlanMode && (status === 'DRAFT' || status === 'REJECTED') && (
                    <Button variant="contained" color="error" onClick={handleDeleteClick}>{t('common.delete')}</Button>
                  )}
                </Box>
                {/* Mobile */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1, mt: 3, flexWrap: 'wrap' }}>
                  <Button variant="outlined" onClick={handleBackToList} sx={{ flex: 1, minWidth: 0 }}>{t('common.list')}</Button>
                  {buttons.map((btn, i) => (
                    <Box key={i} sx={{ flex: 1, minWidth: 0, '& > button': { width: '100%' } }}>{btn}</Box>
                  ))}
                  {canSee(MENU, 'DETAIL', '수정', getItemRoles(selectedAssessment)) && isPlanMode && (status === 'DRAFT' || status === 'REJECTED') && (
                    <Button variant="contained" onClick={handleEditClick} sx={{ flex: 1, minWidth: 0 }}>{t('common.edit')}</Button>
                  )}
                  {/* 삭제는 결재 상신 전(draft/rejected)에만 노출 */}
                  {canSee(MENU, 'DETAIL', '삭제', getItemRoles(selectedAssessment)) && isPlanMode && (status === 'DRAFT' || status === 'REJECTED') && (
                    <Button variant="contained" color="error" onClick={handleDeleteClick} sx={{ flex: 1, minWidth: 0 }}>{t('common.delete')}</Button>
                  )}
                </Box>
              </>
            )
          })()}
        </>
      ) : null}
    </Box>
  )

  const renderFormView = () => (
    <>
      {/* 기본 정보 - PC용 테이블 레이아웃 (외부 박스 없음) */}
      <Box sx={{ mb: 3 }}>
        {/* PC용 테이블 레이아웃 */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          {(() => {
            const lbl = { width: 130, minWidth: 130, fontWeight: 'bold' as const, bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center' as const, whiteSpace: 'nowrap' as const }
            const lblWide = lbl
            const val = { flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }
            const valBr = { ...val, borderRight: 1, borderColor: 'divider' }
            const proc0 = activityProcesses[0] || { majorCategoryIdx: 1, majorCategory: MAJOR_CATEGORIES[0], detailAction: '', evaluationDate: '', evaluator: '', isTarget: true }
            const proc0Idx = Math.max(0, activityProcesses.findIndex(p => p.majorCategoryIdx === 1))
            const hasModified = !!(selectedAssessment?.modifiedAt && selectedAssessment.modifiedAt !== selectedAssessment.createdAt)
            const fmtDt = (s?: string) => s ? s.replace('T', ' ').substring(0, 16) : ''
            return (
              <>
                {/* 제목 */}
                <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                  <Typography sx={lbl}>{t('common.title')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
                  <Box sx={val}>
                    <TextField fullWidth size="small" placeholder={t('riskAssessment.form.titlePlaceholder')} value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                  </Box>
                </Box>
                {/* 사업장 | 부서 */}
                <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                  <Typography sx={lbl}>{t('riskAssessment.region')}</Typography>
                  <Box sx={valBr}>
                    <FormControl fullWidth size="small">
                      <Select value={formData.site} onChange={(e: SelectChangeEvent) => setFormData({ ...formData, site: e.target.value })} displayEmpty>
                        <MenuItem value="">{t('riskAssessment.siteFilter')}</MenuItem>
                        {sites.map((site) => (<MenuItem key={site} value={site}>{site}</MenuItem>))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Typography sx={lbl}>{t('riskAssessment.department')}</Typography>
                  <Box sx={{ ...val, gap: 1 }}>
                    <TextField fullWidth size="small" placeholder={t('common.selectFromOrg', '조직도에서 선택')} value={formData.authorDept || ''} InputProps={{ readOnly: true }} />
                    <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setDeptModalOpen(true)}>
                      <PersonSearchIcon fontSize="small" />
                    </Button>
                  </Box>
                </Box>
                {/* 평가자 | 평가일시 */}
                <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                  <Typography sx={lbl}>{t('riskAssessment.evaluator', '평가자')}</Typography>
                  <Box sx={{ ...valBr, gap: 1 }}>
                    <TextField fullWidth size="small" value={proc0.evaluator || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
                    <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setEvaluatorPickTarget({ globalIndex: proc0Idx })}>
                      <PersonSearchIcon fontSize="small" />
                    </Button>
                  </Box>
                  <Typography sx={lbl}>{t('riskAssessment.evaluationDate', '평가일시')}</Typography>
                  <Box sx={val}>
                    <DatePickerField size="small" value={proc0.evaluationDate ? formatDate(proc0.evaluationDate) : null}
                      onChange={(v) => handleProcessFieldChange(proc0Idx, 'evaluationDate', v || '')} />
                  </Box>
                </Box>
                {/* 작성자 | 작성일자 */}
                <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                  <Typography sx={lbl}>{t('common.creator', '작성자')}</Typography>
                  <Box sx={valBr}>
                    <Typography variant="body2">{formatUserName(formData.authorTeam || user?.department, formData.authorName || user?.name || user?.username, formData.authorPosition || user?.position)}</Typography>
                  </Box>
                  <Typography sx={lbl}>{t('audit.createdAt', '작성일자')}</Typography>
                  <Box sx={val}>
                    <Typography variant="body2" fontFamily="monospace">
                      {viewMode === 'edit' && selectedAssessment ? fmtDt(selectedAssessment.createdAt) : new Date().toISOString().substring(0, 10)}
                    </Typography>
                  </Box>
                </Box>
                {/* 수정자 | 수정일자 — 수정 이력 있을 때만 */}
                {hasModified && (
                  <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                    <Typography sx={lbl}>{t('common.modifier', '수정자')}</Typography>
                    <Box sx={valBr}>
                      <Typography variant="body2">{(selectedAssessment as any)?.modifiedByName || ''}</Typography>
                    </Box>
                    <Typography sx={lbl}>{t('common.modifiedAt', '수정일자')}</Typography>
                    <Box sx={val}>
                      <Typography variant="body2" fontFamily="monospace">{fmtDt(selectedAssessment?.modifiedAt)}</Typography>
                    </Box>
                  </Box>
                )}
                {/* 계획승인자 | 완료승인자 */}
                <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                  <Typography sx={lblWide}>
                    {t('riskAssessment.planApprover', '계획 승인자')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
                  </Typography>
                  <Box sx={{ ...valBr, gap: 1 }}>
                    <TextField fullWidth size="small" value={formData.planApproverName || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
                    <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setApproverPickTarget('plan')}>
                      <PersonSearchIcon fontSize="small" />
                    </Button>
                  </Box>
                  <Typography sx={lblWide}>
                    {t('riskAssessment.completionApprover', '완료 승인자')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
                  </Typography>
                  <Box sx={{ ...val, gap: 1 }}>
                    <TextField fullWidth size="small" value={formData.completionApproverName || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
                    <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setApproverPickTarget('completion')}>
                      <PersonSearchIcon fontSize="small" />
                    </Button>
                  </Box>
                </Box>
                {/* 체크리스트 */}
                <Box sx={{ display: 'flex' }}>
                  <Typography sx={lbl}>
                    {t('common.checklist', '체크리스트')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
                  </Typography>
                  <Box sx={{ ...val, flex: 3 }}>
                    <FormControl fullWidth size="small">
                      <Select value={step21FormId} onChange={(e: SelectChangeEvent<number | ''>) => handleStep21FormChange(e.target.value as number | '')} displayEmpty>
                        <MenuItem value=""><em>{t('common.none', '선택 안함')}</em></MenuItem>
                        {(formTemplates || []).map((form) => (
                          <MenuItem key={form.id} value={form.id}>{form.title}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </>
            )
          })()}
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
          {(() => {
            const proc0 = activityProcesses[0] || { majorCategoryIdx: 1, majorCategory: MAJOR_CATEGORIES[0], detailAction: '', evaluationDate: '', evaluator: '', isTarget: true }
            const proc0Idx = Math.max(0, activityProcesses.findIndex(p => p.majorCategoryIdx === 1))
            const hasModified = !!(selectedAssessment?.modifiedAt && selectedAssessment.modifiedAt !== selectedAssessment.createdAt)
            const fmtDt = (s?: string) => s ? s.replace('T', ' ').substring(0, 16) : ''
            const lblCls = { mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }
            return (
              <>
                {/* 부서 */}
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={lblCls}>{t('riskAssessment.department')}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField fullWidth size="small" placeholder={t('common.selectFromOrg', '조직도에서 선택')} value={formData.authorDept || ''} InputProps={{ readOnly: true }} />
                    <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setDeptModalOpen(true)}>
                      <PersonSearchIcon fontSize="small" />
                    </Button>
                  </Box>
                </Box>
                {/* 평가자 */}
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={lblCls}>{t('riskAssessment.evaluator', '평가자')}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField fullWidth size="small" value={proc0.evaluator || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
                    <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setEvaluatorPickTarget({ globalIndex: proc0Idx })}>
                      <PersonSearchIcon fontSize="small" />
                    </Button>
                  </Box>
                </Box>
                {/* 평가일시 */}
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={lblCls}>{t('riskAssessment.evaluationDate', '평가일시')}</Typography>
                  <DatePickerField size="small" value={proc0.evaluationDate ? formatDate(proc0.evaluationDate) : null}
                    onChange={(v) => handleProcessFieldChange(proc0Idx, 'evaluationDate', v || '')} />
                </Box>
                {/* 작성자 */}
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={lblCls}>{t('common.creator', '작성자')}</Typography>
                  <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{formatUserName(formData.authorTeam || user?.department, formData.authorName || user?.name || user?.username, formData.authorPosition || user?.position)}</Typography>
                </Box>
                {/* 작성일자 */}
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={lblCls}>{t('audit.createdAt', '작성일자')}</Typography>
                  <Typography variant="body2" fontFamily="monospace" sx={{ px: 1.5, py: 0.5 }}>
                    {viewMode === 'edit' && selectedAssessment ? fmtDt(selectedAssessment.createdAt) : new Date().toISOString().substring(0, 10)}
                  </Typography>
                </Box>
                {/* 수정자/수정일자 — 수정 이력 있을 때만 */}
                {hasModified && (
                  <>
                    <Box>
                      <Typography variant="body2" fontWeight="bold" sx={lblCls}>{t('common.modifier', '수정자')}</Typography>
                      <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{(selectedAssessment as any)?.modifiedByName || ''}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight="bold" sx={lblCls}>{t('common.modifiedAt', '수정일자')}</Typography>
                      <Typography variant="body2" fontFamily="monospace" sx={{ px: 1.5, py: 0.5 }}>{fmtDt(selectedAssessment?.modifiedAt)}</Typography>
                    </Box>
                  </>
                )}
                {/* 계획 승인자 */}
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={lblCls}>
                    {t('riskAssessment.planApprover', '계획 승인자')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField fullWidth size="small" value={formData.planApproverName || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
                    <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setApproverPickTarget('plan')}>
                      <PersonSearchIcon fontSize="small" />
                    </Button>
                  </Box>
                </Box>
                {/* 완료 승인자 */}
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={lblCls}>
                    {t('riskAssessment.completionApprover', '완료 승인자')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField fullWidth size="small" value={formData.completionApproverName || ''} InputProps={{ readOnly: true }} placeholder={t('common.selectFromOrg', '조직도에서 선택')} />
                    <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setApproverPickTarget('completion')}>
                      <PersonSearchIcon fontSize="small" />
                    </Button>
                  </Box>
                </Box>
                {/* 체크리스트 */}
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={lblCls}>
                    {t('common.checklist', '체크리스트')} <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select value={step21FormId} onChange={(e: SelectChangeEvent<number | ''>) => handleStep21FormChange(e.target.value as number | '')} displayEmpty>
                      <MenuItem value=""><em>{t('common.none', '선택 안함')}</em></MenuItem>
                      {(formTemplates || []).map((form) => (
                        <MenuItem key={form.id} value={form.id}>{form.title}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </>
            )
          })()}
        </Box>
      </Box>

      {/* 선택한 양식의 체크리스트 정보 + 상세 항목 */}
      {step21FormId && (
        <Box sx={{ mb: 3 }}>
          {renderChecklistInfo(step21FormId as number)}
          {renderStep2Content(isPlanMode, '사무업무')}
        </Box>
      )}

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
    const evaluatorNames = (process.evaluator || '').split(',').map(n => n.trim()).filter(n => n)

    return (
      <Box key={globalIndex}>
        {/* PC 레이아웃 */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          {/* 평가자 | 평가일시 — 한 행 */}
          <Box sx={{ display: 'flex' }}>
            <Typography sx={labelSx}>{t('riskAssessment.evaluator', '평가자')}</Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              {readOnly ? (
                <Typography variant="body2" sx={{ py: 0.5, textAlign: process.evaluator ? 'left' : 'center', width: '100%' }}>{process.evaluator || ''}</Typography>
              ) : (
                <>
                  <TextField
                    fullWidth
                    size="small"
                    value={process.evaluator || ''}
                    InputProps={{ readOnly: true }}
                    placeholder={t('common.selectFromOrg', '조직도에서 선택')}
                  />
                  <Button variant="outlined" size="small" sx={{ minWidth: 40 }} onClick={() => setEvaluatorPickTarget({ globalIndex })}>
                    <PersonSearchIcon fontSize="small" />
                  </Button>
                </>
              )}
            </Box>
            <Typography sx={labelSx}>{t('riskAssessment.evaluationDate', '평가일시')}</Typography>
            <Box sx={{ flex: 1, px: 2, py: 1, display: 'flex', alignItems: 'center' }}>
              {readOnly ? (
                <Typography variant="body2" sx={{ py: 0.5, textAlign: process.evaluationDate ? 'left' : 'center' }}>{process.evaluationDate ? formatDate(process.evaluationDate) : ''}</Typography>
              ) : (
                <DatePickerField size="small"
                  value={process.evaluationDate ? formatDate(process.evaluationDate) : null}
                  onChange={(v) => handleProcessFieldChange(globalIndex, 'evaluationDate', v || '')} />
              )}
            </Box>
          </Box>
        </Box>

        {/* 모바일 레이아웃 */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, p: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('riskAssessment.evaluationDate', '평가일시')}</Typography>
            {readOnly ? (
              <Typography variant="body2" sx={{ px: 1.5, textAlign: process.evaluationDate ? 'left' : 'center' }}>{process.evaluationDate ? formatDate(process.evaluationDate) : ''}</Typography>
            ) : (
              <DatePickerField size="small"
                value={process.evaluationDate ? formatDate(process.evaluationDate) : null}
                onChange={(v) => handleProcessFieldChange(globalIndex, 'evaluationDate', v || '')} />
            )}
          </Box>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('riskAssessment.evaluator', '평가자')}</Typography>
            {readOnly ? (
              <Typography variant="body2" sx={{ px: 1.5, textAlign: process.evaluator ? 'left' : 'center' }}>{process.evaluator || ''}</Typography>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                {evaluatorNames.map((name, idx) => (
                  <Chip
                    key={idx}
                    label={name}
                    size="small"
                    onDelete={() => {
                      const list = evaluatorNames.filter(n => n !== name)
                      handleProcessFieldChange(globalIndex, 'evaluator', list.join(', '))
                    }}
                  />
                ))}
                {evaluatorNames.length === 0 && (
                  <Typography variant="body2" color="text.secondary">{t('riskAssessment.selectEvaluator', '평가자 선택')}</Typography>
                )}
                <Button variant="outlined" size="small" sx={{ ml: 'auto', minWidth: 40 }} onClick={() => setEvaluatorPickTarget({ globalIndex })}><PersonSearchIcon fontSize="small" /></Button>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    )
  }

  // 체크리스트 정보 — 스냅샷된 제목 우선, 양식이 살아있으면 설명도 보여줌 (양식 삭제되어도 제목은 보존)
  const renderChecklistInfo = (formId: number) => {
    const tpl = (formTemplates || []).find(f => f.id === formId)
    const snapshotTitle = assessmentDetail?.formTitle
    const title = snapshotTitle || tpl?.title || ''
    const description = tpl?.description || ''
    // 체크리스트가 선택되지 않은 경우 — 명확한 안내
    if (!formId && !snapshotTitle) {
      return (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>{t('checklist.checklistInfo', '체크리스트 정보')}</Typography>
          <Paper sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('riskAssessment.noChecklistLinked', '연결된 체크리스트가 없습니다. 수정에서 체크리스트를 선택하세요.')}
            </Typography>
          </Paper>
        </Box>
      )
    }
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>{t('checklist.checklistInfo', '체크리스트 정보')}</Typography>
        <Paper sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center' }}>{t('common.title', '제목')}</Box>
            <Box sx={{ flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: title ? 'flex-start' : 'center' }}><Typography variant="body2">{title}</Typography></Box>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Box sx={{ width: 130, minWidth: 130, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center' }}>{t('common.description', '설명')}</Box>
            <Box sx={{ flex: 1, px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: description ? 'flex-start' : 'center' }}><Typography variant="body2">{description}</Typography></Box>
          </Box>
        </Paper>
      </Box>
    )
  }

  // Step 2 - 위험성평가서 - PDF 페이지 27-29, 32 기준
  const renderStep2Content = (
    readOnly: boolean,
    category: string = '',
    formId: number | '' = '',
    onFormChange?: (id: number | '') => void,
  ) => {
    const filteredItems = category
      ? assessmentDetails
          .map((d, gIdx) => ({ d, gIdx }))
          .filter(x => x.d.majorCategory === category || (category === '사무업무' && !x.d.majorCategory))
      : assessmentDetails.map((d, gIdx) => ({ d, gIdx }))

    // 평균위험도 — 개선 전/후 평균(빈도×강도)
    const beforeScores = filteredItems
      .map(({ d }) => (d.possibilityGrade && d.resultGrade) ? calculateRiskScore(d.possibilityGrade, d.resultGrade) : null)
      .filter((v): v is number => v != null)
    const afterScores = filteredItems
      .map(({ d }) => (d.improvedPossibilityGrade && d.improvedResultGrade) ? calculateRiskScore(d.improvedPossibilityGrade, d.improvedResultGrade) : null)
      .filter((v): v is number => v != null)
    const avg = (arr: number[]) => arr.length === 0 ? null : arr.reduce((s, n) => s + n, 0) / arr.length
    const beforeAvg = avg(beforeScores)
    const afterAvg = avg(afterScores)
    const fmtAvg = (n: number | null) => n == null ? '-' : n.toFixed(2)

    return (
    <Box>
      {onFormChange && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 'bold', wordBreak: 'keep-all' }}>{t('riskAssessment.formSelect')}</Typography>
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <Select
              value={formId}
              onChange={(e: SelectChangeEvent<number | ''>) => onFormChange(e.target.value as number | '')}
              displayEmpty
            >
              <MenuItem value=""><em>{t('common.none', '선택 안함')}</em></MenuItem>
              {(formTemplates || []).map((form) => (
                <MenuItem key={form.id} value={form.id}>{form.title}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* 평균위험도 요약 — 개선 전/후 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Paper variant="outlined" sx={{ border: 1, borderColor: 'divider', overflow: 'hidden' }}>
          <Box sx={{ display: 'flex' }}>
            <Box sx={{
              minWidth: 120, px: 2, py: 0.5,
              bgcolor: 'grey.100', borderRight: 1, borderColor: 'divider',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', fontSize: '0.875rem',
            }}>평균위험도</Box>
            <Box sx={{ minWidth: 80 }}>
              <Box sx={{
                px: 2, py: 0.25, bgcolor: 'grey.100', borderBottom: 1, borderColor: 'divider',
                textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem',
              }}>개선전</Box>
              <Box sx={{ px: 2, py: 0.5, textAlign: 'center', fontWeight: 'bold' }}>
                {fmtAvg(beforeAvg)}
              </Box>
            </Box>
            <Box sx={{ minWidth: 80, borderLeft: 1, borderColor: 'divider' }}>
              <Box sx={{
                px: 2, py: 0.25, bgcolor: 'grey.100', borderBottom: 1, borderColor: 'divider',
                textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem',
              }}>개선후</Box>
              <Box sx={{ px: 2, py: 0.5, textAlign: 'center', fontWeight: 'bold' }}>
                {fmtAvg(afterAvg)}
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>

      <TableContainer component={Paper} sx={{ overflowX: 'auto', border: 1, borderColor: 'divider' }}>
        <Table size="small" sx={{ minWidth: 1900, '& td, & th': { borderRight: '1px solid', borderColor: 'divider', wordBreak: 'keep-all' } }}>
          <TableHead>
            {/* 1단 그룹 헤더 — 체크리스트 관리의 위험성평가 양식과 동일한 셀 제목 구조 */}
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell rowSpan={2} sx={{ fontWeight: 'bold', width: 50, bgcolor: 'grey.100' }} align="center">No</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 'bold', minWidth: 110, bgcolor: 'grey.100' }} align="center">작업내용</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 'bold', width: 80, bgcolor: 'grey.100' }} align="center">평가구분</TableCell>
              <TableCell colSpan={2} sx={{ fontWeight: 'bold', minWidth: 240, bgcolor: 'grey.100' }} align="center">위험요인</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 'bold', width: 50, bgcolor: 'grey.100' }} align="center">N/A</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 'bold', minWidth: 200, bgcolor: 'grey.100' }} align="center">현재안전조치</TableCell>
              <TableCell colSpan={3} sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }} align="center">현재 위험도</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 'bold', width: 70, bgcolor: 'grey.100', borderLeft: '1px solid', borderColor: 'divider' }} align="center">위험등급</TableCell>
              <TableCell colSpan={2} sx={{ fontWeight: 'bold', minWidth: 280, bgcolor: 'grey.100' }} align="center">개선대책</TableCell>
              <TableCell colSpan={3} sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }} align="center">개선후 위험도</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 'bold', width: 70, bgcolor: 'grey.100', borderLeft: '1px solid', borderColor: 'divider' }} align="center">위험등급</TableCell>
            </TableRow>
            {/* 2단 서브 헤더 */}
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 180, bgcolor: 'grey.100' }} align="center">위험요인</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 80, bgcolor: 'grey.100' }} align="center">재해형태</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 60, bgcolor: 'grey.100' }} align="center">빈도</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 60, bgcolor: 'grey.100' }} align="center">강도</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 70, bgcolor: 'grey.100' }} align="center">위험도</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 180, bgcolor: 'grey.100' }} align="center">개선대책</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 90, bgcolor: 'grey.100' }} align="center">코드번호</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 60, bgcolor: 'grey.100' }} align="center">빈도</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 60, bgcolor: 'grey.100' }} align="center">강도</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 70, bgcolor: 'grey.100' }} align="center">위험도</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={16} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">{t('riskAssessment.noAssessmentDetails')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map(({ d: detail, gIdx }, index) => {
                const hasCurrent = !!detail.possibilityGrade && !!detail.resultGrade
                const score = hasCurrent ? calculateRiskScore(detail.possibilityGrade, detail.resultGrade) : null
                const grade = score ? getRiskGrade(score) : null
                const improvedScore = detail.improvedPossibilityGrade && detail.improvedResultGrade
                  ? calculateRiskScore(detail.improvedPossibilityGrade, detail.improvedResultGrade)
                  : null
                const improvedGrade = improvedScore ? getRiskGrade(improvedScore) : null
                // 연속 동일값 rowspan — risk4M 은 같은 detailAction 블록 안에서만 병합
                const get = (i: number, k: 'detailAction' | 'risk4M') =>
                  (filteredItems[i]?.d as any)?.[k] || ''
                const sameDetailAsPrev = (i: number) => i > 0 && get(i, 'detailAction') === get(i - 1, 'detailAction')
                const computeSpan = (k: 'detailAction' | 'risk4M'): { render: boolean; span: number } => {
                  const cur = get(index, k)
                  const prevSameKey = index > 0 && get(index - 1, k) === cur
                  if (prevSameKey && (k === 'detailAction' || sameDetailAsPrev(index))) {
                    return { render: false, span: 0 }
                  }
                  let span = 1
                  for (let n = index + 1; n < filteredItems.length; n++) {
                    if (get(n, k) !== cur) break
                    if (k === 'risk4M' && !sameDetailAsPrev(n)) break
                    span++
                  }
                  return { render: true, span }
                }
                const detailSpan = computeSpan('detailAction')
                const risk4MSpan = computeSpan('risk4M')
                return (
                  <TableRow key={gIdx}>
                    <TableCell align="center">{index + 1}</TableCell>
                    {/* 작업내용 */}
                    {detailSpan.render && (
                      <TableCell rowSpan={detailSpan.span} sx={{ wordBreak: 'keep-all' }}>{detail.detailAction}</TableCell>
                    )}
                    {/* 평가구분 */}
                    {risk4MSpan.render && (
                      <TableCell rowSpan={risk4MSpan.span} align="center">{getEvalCategoryLabel(detail.risk4M || '') || detail.risk4M || ''}</TableCell>
                    )}
                    {/* 위험요인 */}
                    <TableCell>{detail.danger}</TableCell>
                    {/* 재해형태 */}
                    <TableCell align="center">{getDisasterTypeLabel(detail.expectedDisaster || '') || detail.expectedDisaster || ''}</TableCell>
                    {/* N/A */}
                    <TableCell align="center">{detail.target === 'N/A' ? 'A' : 'N'}</TableCell>
                    {/* 현재안전조치 */}
                    <TableCell>{detail.currentSafetyMeasures || ''}</TableCell>
                    {/* 현재 빈도 */}
                    <TableCell align="center">
                      {readOnly ? (detail.possibilityGrade ?? '') : (
                        <FormControl size="small" sx={{ minWidth: 60 }}>
                          <Select value={detail.possibilityGrade ?? ''} onChange={(e: SelectChangeEvent<number>) => handleInlineDetailChange(gIdx, 'possibilityGrade', Number(e.target.value))} displayEmpty>
                            <MenuItem value="" disabled>선택하세요</MenuItem>
                            {[1, 2, 3, 4, 5].map((n) => (<MenuItem key={n} value={n}>{n}</MenuItem>))}
                          </Select>
                        </FormControl>
                      )}
                    </TableCell>
                    {/* 현재 강도 */}
                    <TableCell align="center">
                      {readOnly ? (detail.resultGrade ?? '') : (
                        <FormControl size="small" sx={{ minWidth: 60 }}>
                          <Select value={detail.resultGrade ?? ''} onChange={(e: SelectChangeEvent<number>) => handleInlineDetailChange(gIdx, 'resultGrade', Number(e.target.value))} displayEmpty>
                            <MenuItem value="" disabled>선택하세요</MenuItem>
                            {[1, 2, 3, 4, 5].map((n) => (<MenuItem key={n} value={n}>{n}</MenuItem>))}
                          </Select>
                        </FormControl>
                      )}
                    </TableCell>
                    {/* 현재 위험도 */}
                    <TableCell align="center">{score ?? ''}</TableCell>
                    {/* 위험등급 */}
                    <TableCell align="center" sx={{ borderLeft: '1px solid', borderColor: 'divider' }}>
                      {grade ? (
                        <Chip label={grade} size="small" color={getRiskGradeColor(grade) as 'error' | 'warning' | 'success' | 'default'} />
                      ) : ''}
                    </TableCell>
                    {/* 개선대책 */}
                    <TableCell sx={{ minWidth: 280 }}>
                      {readOnly ? (detail.reductionMeasures || '') : (
                        <TextField size="small" fullWidth multiline maxRows={4} value={detail.reductionMeasures || ''} onChange={(e) => handleInlineDetailChange(gIdx, 'reductionMeasures', e.target.value)} sx={{ minWidth: 260 }} />
                      )}
                    </TableCell>
                    {/* 코드번호 */}
                    <TableCell align="center">{(detail as { codeNumber?: string }).codeNumber || ''}</TableCell>
                    {/* 개선후 빈도 */}
                    <TableCell align="center">
                      {readOnly ? (detail.improvedPossibilityGrade ?? '') : (
                        <FormControl size="small" sx={{ minWidth: 60 }}>
                          <Select value={detail.improvedPossibilityGrade ?? ''} onChange={(e: SelectChangeEvent<number>) => handleInlineDetailChange(gIdx, 'improvedPossibilityGrade', e.target.value ? Number(e.target.value) : undefined)} displayEmpty>
                            <MenuItem value="" disabled>선택하세요</MenuItem>
                            {[1, 2, 3, 4, 5].map((n) => (<MenuItem key={n} value={n}>{n}</MenuItem>))}
                          </Select>
                        </FormControl>
                      )}
                    </TableCell>
                    {/* 개선후 강도 */}
                    <TableCell align="center">
                      {readOnly ? (detail.improvedResultGrade ?? '') : (
                        <FormControl size="small" sx={{ minWidth: 60 }}>
                          <Select value={detail.improvedResultGrade ?? ''} onChange={(e: SelectChangeEvent<number>) => handleInlineDetailChange(gIdx, 'improvedResultGrade', e.target.value ? Number(e.target.value) : undefined)} displayEmpty>
                            <MenuItem value="" disabled>선택하세요</MenuItem>
                            {[1, 2, 3, 4, 5].map((n) => (<MenuItem key={n} value={n}>{n}</MenuItem>))}
                          </Select>
                        </FormControl>
                      )}
                    </TableCell>
                    {/* 개선후 위험도 */}
                    <TableCell align="center">{improvedScore ?? ''}</TableCell>
                    {/* 개선후 위험등급 */}
                    <TableCell align="center" sx={{ borderLeft: '1px solid', borderColor: 'divider' }}>
                      {improvedGrade ? (
                        <Chip label={improvedGrade} size="small" color={getRiskGradeColor(improvedGrade) as 'error' | 'warning' | 'success' | 'default'} />
                      ) : ''}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
    )
  }

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

      <DepartmentSelectModal
        open={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        initialDepartment={formData.authorDept || ''}
        onConfirm={(dept: string) => {
          setFormData({ ...formData, authorDept: dept })
          setDeptModalOpen(false)
        }}
        title={t('riskAssessment.department', '부서') + ' ' + t('common.select', '선택하세요')}
      />

      <UserSelectModal
        open={approverPickTarget !== null}
        onClose={() => setApproverPickTarget(null)}
        selectedUsers={[]}
        onConfirm={handleApproverPicked}
        singleSelect
        useCompanyTree
        title={approverPickTarget === 'plan'
          ? t('riskAssessment.selectPlanApprover', '계획 승인자 선택')
          : t('riskAssessment.selectCompletionApprover', '완료 승인자 선택')}
      />

      {/* 결재 반려 사유 입력 다이얼로그 */}
      <RejectReasonDialog
        open={rejectDialogStage !== null}
        stage={rejectDialogStage === 'plan'
          ? t('riskAssessment.planReject', '계획 결재 반려')
          : rejectDialogStage === 'completion'
            ? t('riskAssessment.completionReject', '완료 결재 반려')
            : ''}
        onClose={() => setRejectDialogStage(null)}
        onConfirm={handleRejectConfirm}
        loading={transitionMutation.isPending}
      />

      <DeptUserMultiSelectModal
        open={!!evaluatorPickTarget}
        onClose={() => setEvaluatorPickTarget(null)}
        onConfirm={(users: UserInfo[]) => {
          if (evaluatorPickTarget) {
            const names = users.map(u => u.department ? `${u.name} (${u.department})` : u.name).join(', ')
            handleProcessFieldChange(evaluatorPickTarget.globalIndex, 'evaluator', names)
          }
          setEvaluatorPickTarget(null)
        }}
        title="평가자 선택 (다중)"
        initialSelected={(() => {
          if (!evaluatorPickTarget) return []
          const evalStr = activityProcesses[evaluatorPickTarget.globalIndex]?.evaluator || ''
          return evalStr.split(',').map(n => n.trim()).filter(n => n).map((str, idx) => {
            const m = str.match(/^(.+?)\s*\((.+?)\)\s*$/)
            return { id: -idx - 1, username: '', email: '', name: m ? m[1].trim() : str, department: m ? m[2].trim() : '', company: '', role: '' } as UserInfo
          })
        })()}
      />

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

export default RiskAssessmentTab
