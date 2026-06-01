import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
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
  IconButton,
  CircularProgress,
  Select,
  MenuItem,
} from '@mui/material'
import {
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { riskAssessmentApi } from '../../api/riskAssessmentApi'
import {
  RiskAssessmentFormItemRequest,
  RiskAssessmentFormRequest,
} from '../../types/riskAssessment.types'
import useCodeMap from '../../hooks/useCodeMap'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import LoadingOverlay from '../common/LoadingOverlay'
import ItemAttachmentCell from '../common/ItemAttachmentCell'
import { RISK_ASSESSMENT_ITEM_ENTITY_TYPE } from '../../api/itemAttachmentApi'
import { useItemAttachments } from '../../hooks/useItemAttachments'

const DEFAULT_FORM_ITEMS: RiskAssessmentFormItemRequest[] = [
  { riskIdx: 1, detailAction: '원재료 입고', risk4M: '기계적', danger: '지게차 협착·충돌', expectedDisaster: '', target: '', currentSafetyMeasures: '지게차 운행 구역 분리, 경고등 설치, 안전모 착용 의무화', possibilityGrade: 1, resultGrade: 1, reductionMeasures: '지게차 운행 구역 분리, 경고등 설치, 안전모 착용 의무화', improvementManager: '안전팀장', improvementDeadline: '', improvedPossibilityGrade: 1, improvedResultGrade: 1, relatedLaw: '산안법 제38조', remark: '', reviewer: '', approverName: '' },
  { riskIdx: 2, detailAction: '원재료 입고', risk4M: '인간공학적', danger: '중량물 취급 근골격계 부담', expectedDisaster: '', target: '', currentSafetyMeasures: '보조 리프팅 장비 도입, 작업자 교대 주기 단축', possibilityGrade: 1, resultGrade: 1, reductionMeasures: '보조 리프팅 장비 도입, 작업자 교대 주기 단축', improvementManager: '생산팀장', improvementDeadline: '', improvedPossibilityGrade: 1, improvedResultGrade: 1, relatedLaw: '산안법 제39조', remark: '', reviewer: '', approverName: '' },
  { riskIdx: 3, detailAction: '화학물질 취급', risk4M: '화학적', danger: '유기용제 흡입·피부접촉', expectedDisaster: '', target: '', currentSafetyMeasures: '방독면·내화학성 장갑 착용, 국소배기장치 설치', possibilityGrade: 1, resultGrade: 1, reductionMeasures: '방독면·내화학성 장갑 착용, 국소배기장치 설치', improvementManager: '환경팀장', improvementDeadline: '', improvedPossibilityGrade: 1, improvedResultGrade: 1, relatedLaw: '화학물질관리법', remark: 'MSDS 비치', reviewer: '', approverName: '' },
  { riskIdx: 4, detailAction: '화학물질 취급', risk4M: '화학적', danger: '화학물질 누출·화재', expectedDisaster: '', target: '', currentSafetyMeasures: '방류벽 설치, 소화기 추가 배치, 비상대응절차 수립', possibilityGrade: 1, resultGrade: 1, reductionMeasures: '방류벽 설치, 소화기 추가 배치, 비상대응절차 수립', improvementManager: '안전팀장', improvementDeadline: '', improvedPossibilityGrade: 1, improvedResultGrade: 1, relatedLaw: '위험물안전관리법', remark: '', reviewer: '', approverName: '' },
  { riskIdx: 5, detailAction: '생산 설비 운전', risk4M: '기계적', danger: '회전체 끼임·절단', expectedDisaster: '', target: '', currentSafetyMeasures: '방호덮개 설치, 잠금/표지 절차(LOTO) 적용', possibilityGrade: 1, resultGrade: 1, reductionMeasures: '방호덮개 설치, 잠금/표지 절차(LOTO) 적용', improvementManager: '설비팀장', improvementDeadline: '', improvedPossibilityGrade: 1, improvedResultGrade: 1, relatedLaw: '산안법 제38조', remark: '', reviewer: '', approverName: '' },
  { riskIdx: 6, detailAction: '생산 설비 운전', risk4M: '물리적', danger: '고온 화상', expectedDisaster: '', target: '', currentSafetyMeasures: '단열 커버 설치, 내열 장갑·앞치마 지급', possibilityGrade: 1, resultGrade: 1, reductionMeasures: '단열 커버 설치, 내열 장갑·앞치마 지급', improvementManager: '생산팀장', improvementDeadline: '', improvedPossibilityGrade: 1, improvedResultGrade: 1, relatedLaw: '산안법 제39조', remark: '', reviewer: '', approverName: '' },
  { riskIdx: 7, detailAction: '전기 작업', risk4M: '전기적', danger: '감전', expectedDisaster: '', target: '', currentSafetyMeasures: '절연 장갑·절연 공구 사용, 작업 전 전원 차단 확인', possibilityGrade: 1, resultGrade: 1, reductionMeasures: '절연 장갑·절연 공구 사용, 작업 전 전원 차단 확인', improvementManager: '전기팀장', improvementDeadline: '', improvedPossibilityGrade: 1, improvedResultGrade: 1, relatedLaw: '전기안전관리법', remark: '', reviewer: '', approverName: '' },
  { riskIdx: 8, detailAction: '고소 작업', risk4M: '물리적', danger: '추락·낙하물', expectedDisaster: '', target: '', currentSafetyMeasures: '안전대 착용, 작업 발판 설치, 낙하물 방지망 설치', possibilityGrade: 1, resultGrade: 1, reductionMeasures: '안전대 착용, 작업 발판 설치, 낙하물 방지망 설치', improvementManager: '안전팀장', improvementDeadline: '', improvedPossibilityGrade: 1, improvedResultGrade: 1, relatedLaw: '산안법 제42조', remark: '', reviewer: '', approverName: '' },
  { riskIdx: 9, detailAction: '소음 발생 작업', risk4M: '물리적', danger: '소음성 난청', expectedDisaster: '', target: '', currentSafetyMeasures: '청력보호구 지급, 소음 저감 장비 도입, 노출 시간 관리', possibilityGrade: 1, resultGrade: 1, reductionMeasures: '청력보호구 지급, 소음 저감 장비 도입, 노출 시간 관리', improvementManager: '보건관리자', improvementDeadline: '', improvedPossibilityGrade: 1, improvedResultGrade: 1, relatedLaw: '산안법 제125조', remark: '특수건강검진 대상', reviewer: '', approverName: '' },
  { riskIdx: 10, detailAction: '밀폐 공간 작업', risk4M: '화학적', danger: '산소결핍·유해가스', expectedDisaster: '', target: '', currentSafetyMeasures: '산소농도 측정, 강제 환기, 감시인 배치, 구조장비 준비', possibilityGrade: 1, resultGrade: 1, reductionMeasures: '산소농도 측정, 강제 환기, 감시인 배치, 구조장비 준비', improvementManager: '안전팀장', improvementDeadline: '', improvedPossibilityGrade: 1, improvedResultGrade: 1, relatedLaw: '밀폐공간보건작업규칙', remark: '', reviewer: '', approverName: '' },
  { riskIdx: 11, detailAction: '폐기물 처리', risk4M: '생물학적', danger: '감염성 물질 접촉', expectedDisaster: '', target: '', currentSafetyMeasures: '개인보호구 착용, 분리 수거 철저, 소독 절차 준수', possibilityGrade: 1, resultGrade: 1, reductionMeasures: '개인보호구 착용, 분리 수거 철저, 소독 절차 준수', improvementManager: '환경팀장', improvementDeadline: '', improvedPossibilityGrade: 1, improvedResultGrade: 1, relatedLaw: '폐기물관리법', remark: '', reviewer: '', approverName: '' },
  { riskIdx: 12, detailAction: '야간 작업', risk4M: '인간공학적', danger: '피로 누적·사고', expectedDisaster: '', target: '', currentSafetyMeasures: '야간 교대 인원 증원, 휴식 공간 개선, 조명 밝기 향상', possibilityGrade: 1, resultGrade: 1, reductionMeasures: '야간 교대 인원 증원, 휴식 공간 개선, 조명 밝기 향상', improvementManager: '인사팀장', improvementDeadline: '', improvedPossibilityGrade: 1, improvedResultGrade: 1, relatedLaw: '근로기준법 제56조', remark: '', reviewer: '', approverName: '' },
]

interface RiskAssessmentFormTabProps {
  formId?: number
  onBack?: () => void
  isNew?: boolean
}

const RiskAssessmentFormTab: React.FC<RiskAssessmentFormTabProps> = ({ formId: propFormId, onBack, isNew }) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showConfirm, showSuccess, showAlert } = useAlert()
  const { codeList: risk4MCodes } = useCodeMap('RISK_4M')
  const { codeList: managerCodes } = useCodeMap('IMPROVEMENT_MANAGER')
  const { codeList: evalCategoryCodes, getLabel: getEvalCategoryLabel } = useCodeMap('EVAL_CATEGORY')
  const { codeList: disasterTypeCodes, getLabel: getDisasterTypeLabel } = useCodeMap('DISASTER_TYPE')

  const [isEditing, setIsEditing] = useState(isNew || false)
  const [formId, setFormId] = useState<number | null>(propFormId ?? null)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  // 항목별 첨부파일 셀이 서버 id 를 필요로 해서 로컬 상태에 id 를 보관한다 (저장 시에는 제거).
  type LocalFormItem = RiskAssessmentFormItemRequest & { id?: number }
  const [formItems, setFormItems] = useState<LocalFormItem[]>([])
  const [initialized, setInitialized] = useState(false)
  const attachments = useItemAttachments(RISK_ASSESSMENT_ITEM_ENTITY_TYPE)

  // User select modal state (kept for save flow compatibility)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [userModalField] = useState<'reviewer' | 'approverName'>('reviewer')
  const [userModalRowIndex] = useState(0)

  const handleUserModalConfirm = (users: UserInfo[]) => {
    if (users.length > 0) {
      const newItems = [...formItems]
      newItems[userModalRowIndex] = { ...newItems[userModalRowIndex], [userModalField]: users[0].name }
      setFormItems(newItems)
    }
  }

  // Load the first (latest) form (only if no formId from props and not creating new)
  const { data: listData, isLoading } = useQuery({
    queryKey: ['riskAssessmentForms', 0],
    queryFn: () => riskAssessmentApi.getForms({ page: 0, size: 1 }),
    enabled: !propFormId && !isNew,
  })

  // Load the form detail
  const { data: formDetail } = useQuery({
    queryKey: ['riskAssessmentFormDetail', formId],
    queryFn: () => riskAssessmentApi.getFormById(formId!),
    enabled: !!formId,
  })

  // Set formId from list
  useEffect(() => {
    if (listData?.content?.length) {
      setFormId(listData.content[0].id)
    } else if (listData && listData.content?.length === 0) {
      if (!initialized) {
        setFormTitle(t('riskAssessment.basicAssessment', '기본 위험성 평가서'))
        setFormItems(DEFAULT_FORM_ITEMS)
        setInitialized(true)
      }
    }
  }, [listData, initialized, t])

  // New mode: initialize empty form
  useEffect(() => {
    if (isNew && !initialized) {
      setFormTitle('')
      setFormDescription('')
      setFormItems([])
      setInitialized(true)
    }
  }, [isNew, initialized])

  // Populate form from detail
  useEffect(() => {
    if (formDetail && !initialized) {
      setFormTitle(formDetail.title)
      setFormDescription((formDetail as any).description || '')
      setFormItems(
        (formDetail.items || []).map((item) => ({
          id: item.id,
          riskIdx: item.riskIdx,
          detailAction: item.detailAction || '',
          risk4M: item.risk4M || '',
          danger: item.danger || '',
          expectedDisaster: item.expectedDisaster || '',
          target: item.target || '',
          currentSafetyMeasures: item.currentSafetyMeasures || '',
          possibilityGrade: item.possibilityGrade || 1,
          resultGrade: item.resultGrade || 1,
          reductionMeasures: item.reductionMeasures || '',
          improvementManager: item.improvementManager || '',
          improvementDeadline: item.improvementDeadline || '',
          improvedPossibilityGrade: item.improvedPossibilityGrade || 1,
          improvedResultGrade: item.improvedResultGrade || 1,
          relatedLaw: item.relatedLaw || '',
          remark: item.remark || '',
          reviewer: item.reviewer || '',
          approverName: item.approverName || '',
        }))
      )
      setInitialized(true)
    }
  }, [formDetail, initialized])

  // Mutations
  const createMutation = useMutation({
    mutationFn: riskAssessmentApi.createForm,
    onSuccess: async (data) => {
      // 보류된 첨부파일 처리 (저장 성공 후)
      await attachments.flush()
      queryClient.invalidateQueries({ queryKey: ['riskAssessmentForms'] })
      setFormId(data.id)
      setIsEditing(false)
      await showSuccess(t('common.saveSuccess'))
    },
    onError: () => { showAlert('error', t('common.failed')) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RiskAssessmentFormRequest }) =>
      riskAssessmentApi.updateForm(id, data),
    onSuccess: async () => {
      // 보류된 첨부파일 처리 (저장 성공 후)
      await attachments.flush()
      queryClient.invalidateQueries({ queryKey: ['riskAssessmentForms'] })
      queryClient.invalidateQueries({ queryKey: ['riskAssessmentFormDetail'] })
      setIsEditing(false)
      await showSuccess(t('common.saveSuccess'))
    },
    onError: () => { showAlert('error', t('common.failed')) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => riskAssessmentApi.deleteForm(id),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['riskAssessmentForms'] })
      queryClient.invalidateQueries({ queryKey: ['riskAssessmentFormDetail'] })
      await showSuccess(t('common.deleted', '삭제되었습니다'))
      if (onBack) onBack()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      showAlert('error', msg || t('common.failed'))
    },
  })

  const handleDelete = async () => {
    if (!formId) return
    const confirmed = await showConfirm(t('common.confirmDelete', '삭제하시겠습니까?'))
    if (!confirmed) return
    deleteMutation.mutate(formId)
  }

  const isSaving = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  // Handlers
  const handleSubmit = async () => {
    if (!formTitle.trim()) {
      showAlert('warning', t('common.enterTitle'))
      return
    }
    if (formItems.length === 0) {
      showAlert('warning', t('riskAssessment.form.minOneRow'))
      return
    }
    const confirmed = await showConfirm(t('common.confirmSave'))
    if (!confirmed) return

    const requestData: RiskAssessmentFormRequest = {
      title: formTitle,
      description: formDescription,
      // 로컬 보관용 id 는 서버 페이로드에서 제외
      items: formItems.map(({ id: _id, ...rest }) => rest),
    }

    if (formId) {
      updateMutation.mutate({ id: formId, data: requestData })
    } else {
      createMutation.mutate(requestData)
    }
  }

  const handleItemChange = (index: number, field: keyof RiskAssessmentFormItemRequest, value: unknown) => {
    const newItems = [...formItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormItems(newItems)
  }

  const handleAddRow = () => {
    setFormItems([
      ...formItems,
      {
        riskIdx: formItems.length + 1,
        detailAction: '', risk4M: risk4MCodes.length > 0 ? (risk4MCodes[0].codeValue || risk4MCodes[0].code) : '', danger: '', expectedDisaster: '', target: '',
        currentSafetyMeasures: '', possibilityGrade: 1, resultGrade: 1,
        reductionMeasures: '', improvementManager: managerCodes.length > 0 ? (managerCodes[0].codeValue || managerCodes[0].code) : '', improvementDeadline: '',
        improvedPossibilityGrade: 1, improvedResultGrade: 1,
        relatedLaw: '', remark: '', reviewer: '', approverName: '',
      },
    ])
  }

  const handleRemoveRow = (index: number) => {
    const newItems = formItems.filter((_, i) => i !== index)
    setFormItems(newItems.map((item, i) => ({ ...item, riskIdx: i + 1 })))
  }

  const handleCancelEdit = () => {
    // 보류된 첨부파일 변경사항 폐기
    attachments.reset()
    // 신규 등록 중 취소 → 목록으로 복귀
    if (isNew) {
      if (onBack) onBack()
      return
    }
    // Reset to saved data
    if (formDetail) {
      setFormTitle(formDetail.title)
      setFormDescription((formDetail as any).description || '')
      setFormItems(
        (formDetail.items || []).map((item) => ({
          id: item.id,
          riskIdx: item.riskIdx,
          detailAction: item.detailAction || '',
          risk4M: item.risk4M || '',
          danger: item.danger || '',
          expectedDisaster: item.expectedDisaster || '',
          target: item.target || '',
          currentSafetyMeasures: item.currentSafetyMeasures || '',
          possibilityGrade: item.possibilityGrade || 1,
          resultGrade: item.resultGrade || 1,
          reductionMeasures: item.reductionMeasures || '',
          improvementManager: item.improvementManager || '',
          improvementDeadline: item.improvementDeadline || '',
          improvedPossibilityGrade: item.improvedPossibilityGrade || 1,
          improvedResultGrade: item.improvedResultGrade || 1,
          relatedLaw: item.relatedLaw || '',
          remark: item.remark || '',
          reviewer: item.reviewer || '',
          approverName: item.approverName || '',
        }))
      )
    }
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <LoadingOverlay open={isSaving} message="처리 중..." />

      {/* Title & Description */}
      <Box sx={{ border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'grey.300' }}>
          <Box sx={{ width: 120, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>
            {t('common.title', '제목')} {isEditing && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
          </Box>
          <Box sx={{ flex: 1, px: 2, py: 1, display: 'flex', alignItems: 'center' }}>
            {isEditing
              ? <TextField fullWidth size="small" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder={t('common.enterTitle', '제목을 입력하세요')} />
              : <Typography variant="body2">{formTitle || ''}</Typography>}
          </Box>
        </Box>
        <Box sx={{ display: 'flex' }}>
          <Box sx={{ width: 120, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>
            {t('common.description', '설명')}
          </Box>
          <Box sx={{ flex: 1, px: 2, py: 1, display: 'flex', alignItems: 'center' }}>
            {isEditing
              ? <TextField fullWidth size="small" multiline minRows={2} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder={t('common.enterDescription', '설명을 입력하세요')} />
              : <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{formDescription || ''}</Typography>}
          </Box>
        </Box>
      </Box>

      {/* Add row button (above items table) */}
      {isEditing && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button variant="outlined" size="small" onClick={handleAddRow}>
            + {t('riskAssessment.addRow', '행 추가')}
          </Button>
        </Box>
      )}

      {/* Items table - 배관연구팀 양식 헤더 구조 (협력사 탭 패턴 동일) */}
      <TableContainer component={Paper} sx={{ border: 1, borderColor: 'grey.300', overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 2000, borderCollapse: 'collapse', '& .MuiTableCell-root': { border: '1px solid', borderColor: 'grey.300', wordBreak: 'keep-all', fontSize: '0.85rem', px: 1, py: 0.75 } }}>
          <TableHead>
            {/* 1열 헤더 (그룹) */}
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell rowSpan={2} sx={{ fontWeight: 'bold', width: 50, bgcolor: 'grey.100' }} align="center">No</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 'bold', minWidth: 110, bgcolor: 'grey.100' }} align="center">작업내용</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 'bold', width: 80, bgcolor: 'grey.100' }} align="center">평가구분</TableCell>
              <TableCell colSpan={2} sx={{ fontWeight: 'bold', minWidth: 240, bgcolor: 'grey.100' }} align="center">위험요인</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 'bold', width: 50, bgcolor: 'grey.100' }} align="center">N/A</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 'bold', minWidth: 200, bgcolor: 'grey.100' }} align="center">현재안전조치</TableCell>
              <TableCell colSpan={3} sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }} align="center">현재 위험도</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 'bold', width: 60, bgcolor: 'grey.100' }} align="center">위험등급</TableCell>
              <TableCell colSpan={2} sx={{ fontWeight: 'bold', minWidth: 220, bgcolor: 'grey.100' }} align="center">개선대책</TableCell>
              <TableCell colSpan={3} sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }} align="center">개선후 위험도</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 'bold', width: 60, bgcolor: 'grey.100' }} align="center">위험등급</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 'bold', width: 200, bgcolor: 'grey.100' }} align="center">{t('evalSheet.attachment', '첨부파일')}</TableCell>
              {isEditing && <TableCell rowSpan={2} sx={{ fontWeight: 'bold', width: 50, bgcolor: 'grey.100' }} align="center">{t('common.delete')}</TableCell>}
            </TableRow>
            {/* 2열 헤더 (서브) */}
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 180, bgcolor: 'grey.100' }} align="center">위험요인</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 80, bgcolor: 'grey.100' }} align="center">재해형태</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 50, bgcolor: 'grey.100' }} align="center">빈도</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 50, bgcolor: 'grey.100' }} align="center">강도</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 60, bgcolor: 'grey.100' }} align="center">위험도</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 180, bgcolor: 'grey.100' }} align="center">개선대책</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 70, bgcolor: 'grey.100' }} align="center">코드번호</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 50, bgcolor: 'grey.100' }} align="center">빈도</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 50, bgcolor: 'grey.100' }} align="center">강도</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 60, bgcolor: 'grey.100' }} align="center">위험도</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {formItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isEditing ? 18 : 17} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">{t('riskAssessment.noAssessmentDetails')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              formItems.map((item, index) => {
                // 편집 모드가 아닐 때만 연속 동일값 rowspan 계산
                // risk4M 은 같은 detailAction 블록 안에서만 병합 (다른 작업내용과는 병합하지 않음)
                const sameDetailAsPrev = (i: number) =>
                  i > 0 && (formItems[i].detailAction || '') === (formItems[i - 1].detailAction || '')
                const computeSpan = (key: 'detailAction' | 'risk4M'): { render: boolean; span: number } => {
                  if (isEditing) return { render: true, span: 1 }
                  const cur = (item as any)[key] || ''
                  const prevSameKey = index > 0 && ((formItems[index - 1] as any)[key] || '') === cur
                  // risk4M 은 작업내용까지 같아야 위 셀에 병합
                  if (prevSameKey && (key === 'detailAction' || sameDetailAsPrev(index))) {
                    return { render: false, span: 0 }
                  }
                  // 이 행부터 같은 값이 몇 개 연속인지
                  let span = 1
                  for (let k = index + 1; k < formItems.length; k++) {
                    if (((formItems[k] as any)[key] || '') !== cur) break
                    if (key === 'risk4M' && !sameDetailAsPrev(k)) break
                    span++
                  }
                  return { render: true, span }
                }
                const detailSpan = computeSpan('detailAction')
                const risk4MSpan = computeSpan('risk4M')
                return (
                <TableRow key={index} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                  <TableCell align="center">{index + 1}</TableCell>
                  {/* 작업내용 */}
                  {detailSpan.render && (
                    <TableCell rowSpan={detailSpan.span}>
                      {isEditing
                        ? <TextField size="small" fullWidth value={item.detailAction} onChange={(e) => handleItemChange(index, 'detailAction', e.target.value)} />
                        : (item.detailAction || '')}
                    </TableCell>
                  )}
                  {/* 평가구분 - Select (편집 가능) */}
                  {risk4MSpan.render && (
                    <TableCell align="center" rowSpan={risk4MSpan.span}>
                      {isEditing ? (
                        <Select size="small" fullWidth value={item.risk4M || ''} onChange={(e) => handleItemChange(index, 'risk4M', e.target.value)} displayEmpty>
                          <MenuItem value="">선택</MenuItem>
                          {evalCategoryCodes.map(c => <MenuItem key={c.code} value={c.code}>{getEvalCategoryLabel(c.code)}</MenuItem>)}
                        </Select>
                      ) : (
                        getEvalCategoryLabel(item.risk4M || '') || item.risk4M || ''
                      )}
                    </TableCell>
                  )}
                  {/* 위험요인 (편집 가능) */}
                  <TableCell>
                    {isEditing
                      ? <TextField size="small" fullWidth multiline value={item.danger} onChange={(e) => handleItemChange(index, 'danger', e.target.value)} />
                      : (item.danger || '')}
                  </TableCell>
                  {/* 재해형태 - Select (편집 가능) */}
                  <TableCell align="center">
                    {isEditing ? (
                      <Select size="small" fullWidth value={item.expectedDisaster || ''} onChange={(e) => handleItemChange(index, 'expectedDisaster', e.target.value)} displayEmpty>
                        <MenuItem value="">선택</MenuItem>
                        {disasterTypeCodes.map(c => <MenuItem key={c.code} value={c.code}>{getDisasterTypeLabel(c.code)}</MenuItem>)}
                      </Select>
                    ) : (
                      getDisasterTypeLabel(item.expectedDisaster || '') || item.expectedDisaster || ''
                    )}
                  </TableCell>
                  {/* N/A (편집 불가 - 디폴트 N) */}
                  <TableCell align="center" sx={{ fontSize: '0.85rem' }}>
                    {item.target === 'N/A' ? 'A' : 'N'}
                  </TableCell>
                  {/* 현재안전조치 (편집 가능) */}
                  <TableCell>
                    {isEditing
                      ? <TextField size="small" fullWidth multiline value={item.currentSafetyMeasures} onChange={(e) => handleItemChange(index, 'currentSafetyMeasures', e.target.value)} />
                      : (item.currentSafetyMeasures || '')}
                  </TableCell>
                  {/* 현재 빈도 / 강도 / 위험도 / 등급 (편집 불가) */}
                  <TableCell align="center" sx={{ fontSize: '0.85rem' }}>{item.currentFrequency ?? ''}</TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.85rem' }}>{item.currentSeverity ?? ''}</TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.85rem' }}>{item.currentRisk ?? ''}</TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.85rem' }}>{item.currentGrade ?? ''}</TableCell>
                  {/* 개선대책 (편집 불가) */}
                  <TableCell sx={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{item.reductionMeasures || ''}</TableCell>
                  {/* 코드번호 (편집 불가) */}
                  <TableCell align="center" sx={{ fontSize: '0.85rem' }}>{item.codeNumber || ''}</TableCell>
                  {/* 개선후 빈도 / 강도 / 위험도 / 등급 (편집 불가) */}
                  <TableCell align="center" sx={{ fontSize: '0.85rem' }}>{item.improvedFrequency ?? ''}</TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.85rem' }}>{item.improvedSeverity ?? ''}</TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.85rem' }}>{item.improvedRisk ?? ''}</TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.85rem' }}>{item.improvedGrade ?? ''}</TableCell>
                  {/* 첨부파일 */}
                  <TableCell sx={{ verticalAlign: 'middle' }}>
                    <ItemAttachmentCell
                      entityType={RISK_ASSESSMENT_ITEM_ENTITY_TYPE}
                      itemId={item.id}
                      editing={isEditing}
                      pendingUploads={item.id ? attachments.pendingUploads[item.id] : undefined}
                      pendingDeleteIds={item.id ? attachments.pendingDeletes[item.id] : undefined}
                      onAddPending={(files) => item.id && attachments.addPending(item.id, files)}
                      onRemovePending={(idx) => item.id && attachments.removePending(item.id, idx)}
                      onMarkDelete={(fileId) => item.id && attachments.markDelete(item.id, fileId)}
                      onUnmarkDelete={(fileId) => item.id && attachments.unmarkDelete(item.id, fileId)}
                    />
                  </TableCell>
                  {isEditing && (
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => handleRemoveRow(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <UserSelectModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        selectedUsers={[]}
        onConfirm={handleUserModalConfirm}
        title={userModalField === 'reviewer' ? t('riskAssessment.selectReviewer') : t('riskAssessment.selectApproverPerson')}
        singleSelect
        useCompanyTree
      />

      <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
        {isEditing ? (
          <>
            <Button variant="outlined" onClick={handleCancelEdit} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel')}</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={isSaving} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save')}</Button>
          </>
        ) : (
          <>
            {onBack && <Button variant="outlined" onClick={onBack} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list')}</Button>}
            <Button variant="contained" onClick={() => setIsEditing(true)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.edit')}</Button>
            {formId && (
              <Button variant="contained" color="error" onClick={handleDelete} disabled={isSaving} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.delete')}</Button>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}

export default RiskAssessmentFormTab
