import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Paper, Typography, Button, Alert, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material'
import LinkIcon from '@mui/icons-material/Link'
import { siteSafetyPlanApi } from '../../api/siteSafetyApi'
import { SiteSafetyPlan } from '../../types/siteSafety.types'
import SafetyChecklistTab from '../ehs/SafetyChecklistTab'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import { useAlert } from '../../contexts/AlertContext'

const buildExecuteUrl = (planId: number) =>
  `${window.location.origin}/partner-safety-execute/${planId}`

const STATUS_LABEL: Record<string, string> = {
  APPROVED: '계획승인', COMPLETION_PENDING: '완료결재대기',
}
const STATUS_COLOR: Record<string, 'info' | 'warning' | 'default'> = {
  APPROVED: 'info', COMPLETION_PENDING: 'warning',
}

const STORAGE_KEY_PREFIX = 'partnerSafetySubmitted:'

type SubmittedRecord = {
  url: string
  name: string
  sign: string
  externalId: string
  phone: string
  systemNo: string
  submittedAt: string
}

const readSubmitted = (planId: number): SubmittedRecord | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + planId)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

const PartnerSafetyExecuteTab: React.FC = () => {
  const { t } = useTranslation()
  const { showSuccess, showError } = useAlert()
  const qc = useQueryClient()

  const [selectedPlan, setSelectedPlan] = useState<SiteSafetyPlan | null>(null)
  // 다른 탭(실행 새 창)에서 submit 한 결과를 storage 이벤트로 감지하기 위한 카운터
  const [storageTick, setStorageTick] = useState(0)

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith(STORAGE_KEY_PREFIX)) {
        setStorageTick(v => v + 1)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // 실행 탭은 APPROVED + COMPLETION_PENDING 두 상태 모두 표시
  const { data: approvedData, isLoading: approvedLoading } = useQuery({
    queryKey: ['partnerSafetyExecuteList', 'APPROVED'],
    queryFn: () => siteSafetyPlanApi.getByStatus('APPROVED', 0, 200, 'PARTNER'),
  })
  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['partnerSafetyExecuteList', 'COMPLETION_PENDING'],
    queryFn: () => siteSafetyPlanApi.getByStatus('COMPLETION_PENDING', 0, 200, 'PARTNER'),
  })
  const isLoading = approvedLoading || pendingLoading
  const plans: SiteSafetyPlan[] = [
    ...(approvedData?.content || []),
    ...(pendingData?.content || []),
  ]

  const handleSubmitForApproval = async (plan: SiteSafetyPlan) => {
    try {
      // 완료 결재 상신 — APPROVED → COMPLETION_PENDING (관리 탭에서 승인 대기)
      await siteSafetyPlanApi.transition(plan.id, 'completionSubmit')
      // 목록 즉시 새로고침 후 상세 닫고 목록으로 복귀
      await Promise.all([
        qc.refetchQueries({ queryKey: ['siteSafety'] }),
        qc.refetchQueries({ queryKey: ['partnerSafetyExecuteList', 'APPROVED'] }),
        qc.refetchQueries({ queryKey: ['partnerSafetyExecuteList', 'COMPLETION_PENDING'] }),
      ])
      setSelectedPlan(null)
      showSuccess(t('partnerSafety.completionSubmitted', '완료 결재가 상신되었습니다.'))
    } catch (e: any) {
      showError(e?.response?.data?.message || t('common.error'))
    }
  }

  const handleCompletionApprove = async (plan: SiteSafetyPlan) => {
    try {
      await siteSafetyPlanApi.transition(plan.id, 'complete')
      await Promise.all([
        qc.refetchQueries({ queryKey: ['siteSafety'] }),
        qc.refetchQueries({ queryKey: ['partnerSafetyExecuteList', 'APPROVED'] }),
        qc.refetchQueries({ queryKey: ['partnerSafetyExecuteList', 'COMPLETION_PENDING'] }),
      ])
      setSelectedPlan(null)
      showSuccess(t('partnerSafety.completed', '완료 결재가 승인되었습니다. 조회 탭에서 확인하세요.'))
    } catch (e: any) {
      showError(e?.response?.data?.message || t('common.error'))
    }
  }

  const handleCompletionReject = async (plan: SiteSafetyPlan) => {
    const reason = window.prompt('반려 사유를 입력하세요.')
    if (!reason) return
    try {
      await siteSafetyPlanApi.transition(plan.id, 'reject', reason)
      await Promise.all([
        qc.refetchQueries({ queryKey: ['siteSafety'] }),
        qc.refetchQueries({ queryKey: ['partnerSafetyExecuteList', 'APPROVED'] }),
        qc.refetchQueries({ queryKey: ['partnerSafetyExecuteList', 'COMPLETION_PENDING'] }),
      ])
      setSelectedPlan(null)
      showSuccess(t('partnerSafety.completionRejected', '완료 결재가 반려되었습니다.'))
    } catch (e: any) {
      showError(e?.response?.data?.message || t('common.error'))
    }
  }

  // ───────── 상세 화면 (제목 클릭) ─────────
  if (selectedPlan) {
    const checklistTemplateId = (selectedPlan as any).checklistTemplateId
    // storageTick 변할 때마다 다시 읽음 — 새 창 submit 즉시 반영
    const submitted: SubmittedRecord | null = readSubmitted(selectedPlan.id)
    void storageTick

    return (
      <Box sx={{ pb: 4 }}>
        {/* 상단 제목 + 상태 + 등록일 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ flex: 1 }}>{selectedPlan.title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
            {selectedPlan.createdAt?.substring(0, 10)}
          </Typography>
          <Chip
            label={STATUS_LABEL[selectedPlan.status] ?? selectedPlan.status}
            color={STATUS_COLOR[selectedPlan.status] ?? 'default'}
            size="small"
          />
        </Box>

        {/* 계획 기본 정보 */}
        <FormTable>
          <FormRow>
            <FormLabel>작성일</FormLabel>
            <FormCell borderRight>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {selectedPlan.createdAt?.substring(0, 10) || '-'}
              </Typography>
            </FormCell>
            <FormLabel>작성자</FormLabel>
            <FormCell>
              <Typography variant="body2">{selectedPlan.modifiedBy || '-'}</Typography>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>작업 기간</FormLabel>
            <FormCell borderRight>
              <Typography variant="body2">
                {selectedPlan.workStartDate || ''}{selectedPlan.workEndDate ? ` ~ ${selectedPlan.workEndDate}` : ''}
              </Typography>
            </FormCell>
            <FormLabel>작업 장소</FormLabel>
            <FormCell>
              <Typography variant="body2">{selectedPlan.workLocation || '-'}</Typography>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>위험 등급</FormLabel>
            <FormCell borderRight>
              <Typography variant="body2">{selectedPlan.riskLevel || '-'}</Typography>
            </FormCell>
            <FormLabel>계획 승인자</FormLabel>
            <FormCell>
              <Typography variant="body2">{selectedPlan.planApproverName || '-'}</Typography>
            </FormCell>
          </FormRow>
        </FormTable>

        {/* 체크리스트 */}
        <Typography variant="subtitle1" fontWeight="bold" color="text.primary" sx={{ mt: 3, mb: 1 }}>
          체크리스트
        </Typography>
        {checklistTemplateId ? (
          <SafetyChecklistTab
            templateId={checklistTemplateId}
            embedded
            showSummary
            hideSignatures
            hideTemplateInfo
            simpleMode
            locked
          />
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('partnerSafety.noChecklist', '연결된 체크리스트가 없습니다.')}
          </Alert>
        )}

        {/* 확인 / 서명 — 새 창(실행 URL) 에서 받은 결과 표시 */}
        <Typography variant="subtitle1" fontWeight="bold" color="text.primary" sx={{ mt: 3, mb: 2 }}>
          {t('partnerSafety.confirmation', '확인 / 서명')}
        </Typography>
          {submitted ? (
            <FormTable>
              <FormRow>
                <FormLabel>{t('common.name', '성명')}</FormLabel>
                <FormCell borderRight>
                  <Typography variant="body2">{submitted.name}</Typography>
                </FormCell>
                <FormLabel>{t('partnerSafety.externalId', '외부 ID')}</FormLabel>
                <FormCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{submitted.externalId}</Typography>
                </FormCell>
              </FormRow>
              <FormRow>
                <FormLabel>{t('common.phone', '연락처')}</FormLabel>
                <FormCell borderRight>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{submitted.phone}</Typography>
                </FormCell>
                <FormLabel>{t('partnerSafety.systemNo', '시스템 번호')}</FormLabel>
                <FormCell>
                  <Typography variant="body2">{submitted.systemNo}</Typography>
                </FormCell>
              </FormRow>
              <FormRow>
                <FormLabel>{t('common.signature', '서명')}</FormLabel>
                <FormCell>
                  {submitted.sign
                    ? <img src={submitted.sign} alt="" style={{ maxHeight: 60 }} />
                    : <Typography variant="body2" color="text.disabled">—</Typography>}
                </FormCell>
              </FormRow>
              <FormRow>
                <FormLabel>{t('partnerSafety.submittedAt', '제출일시')}</FormLabel>
                <FormCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {submitted.submittedAt?.replace('T', ' ').substring(0, 19)}
                  </Typography>
                </FormCell>
              </FormRow>
              <FormRow last>
                <FormLabel>{t('partnerSafety.externalUrl', '전송 URL')}</FormLabel>
                <FormCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.72rem' }}>
                    {submitted.url}
                  </Typography>
                </FormCell>
              </FormRow>
            </FormTable>
          ) : (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('partnerSafety.awaitingSubmission', '아직 실행 URL 에서 작성이 제출되지 않았습니다.')}
              </Typography>
            </Paper>
          )}

        {/* 우하단 — 목록 / 완료 결재 상신 (제출 데이터 있을 때) */}
        <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={() => setSelectedPlan(null)}
            sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
            {t('common.list', '목록')}
          </Button>
          {submitted && selectedPlan.status === 'APPROVED' && (
            <Button variant="contained" color="info" onClick={() => handleSubmitForApproval(selectedPlan)}
              sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
              {t('common.completionSubmit', '완료 결재 상신')}
            </Button>
          )}
          {selectedPlan.status === 'COMPLETION_PENDING' && (
            <>
              <Button variant="contained" color="warning" onClick={() => handleCompletionReject(selectedPlan)}
                sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
                {t('partnerSafety.completionReject', '완료 결재 반려')}
              </Button>
              <Button variant="contained" color="success" onClick={() => handleCompletionApprove(selectedPlan)}
                sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
                {t('partnerSafety.completionApprove', '완료 결재 승인')}
              </Button>
            </>
          )}
        </Box>
      </Box>
    )
  }

  // ───────── URL 목록 화면 ─────────
  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        {t('partnerSafety.executeNote', '관리 탭에서 계획 승인된 항목이 아래 URL 로 나타납니다. 제목 클릭은 상세 화면, URL 클릭은 새 창(작업자용 모바일 화면) 으로 이동합니다.')}
      </Alert>

      {/* ─── 데스크탑(md+) : 표 ─── */}
      <TableContainer component={Paper} variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold', width: 60 }} align="center">No</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('common.title', '제목')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 130 }} align="center">상태</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('partnerSafety.executeUrl', '실행 URL')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4 }}>{t('common.loading', '로딩 중...')}</TableCell></TableRow>
            ) : plans.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">{t('partnerSafety.noApproved', '승인된 계획이 없습니다.')}</Typography>
              </TableCell></TableRow>
            ) : (
              plans.map((p, idx) => {
                const url = buildExecuteUrl(p.id)
                return (
                  <TableRow key={p.id} hover>
                    <TableCell align="center">{idx + 1}</TableCell>
                    <TableCell>
                      <Button variant="text" size="small" onClick={() => setSelectedPlan(p)}
                        sx={{ textTransform: 'none', justifyContent: 'flex-start', fontWeight: 700, color: 'primary.main' }}>
                        {p.title}
                      </Button>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={STATUS_LABEL[p.status] ?? p.status}
                        color={STATUS_COLOR[p.status] ?? 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="text" size="small" startIcon={<LinkIcon fontSize="small" />}
                        onClick={() => window.open(url, '_blank', 'noopener,noreferrer,width=480,height=900')}
                        sx={{ textTransform: 'none', justifyContent: 'flex-start', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {url}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ─── 모바일(xs/sm) : 카드 ─── */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1 }}>
        {isLoading ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.disabled', fontSize: '0.875rem' }}>
            {t('common.loading', '로딩 중...')}
          </Paper>
        ) : plans.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.disabled', fontSize: '0.875rem' }}>
            {t('partnerSafety.noApproved', '승인된 계획이 없습니다.')}
          </Paper>
        ) : (
          plans.map(p => {
            const url = buildExecuteUrl(p.id)
            return (
              <Paper key={p.id} variant="outlined" sx={{ p: 1.5 }}>
                {/* 1행: 계획번호 + 상태칩 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'primary.main', fontWeight: 700, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.planId}
                  </Typography>
                  <Chip size="small"
                    label={STATUS_LABEL[p.status] ?? p.status}
                    color={STATUS_COLOR[p.status] ?? 'default'} />
                </Box>
                {/* 2행: 제목 (클릭 → 상세) */}
                <Typography onClick={() => setSelectedPlan(p)}
                  sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 2, color: 'primary.main', cursor: 'pointer', textDecoration: 'underline' }}>
                  {p.title || '-'}
                </Typography>
                {/* 3행: 실행 URL 버튼 — PC 와 동일한 text 스타일 */}
                <Button variant="text" size="small" fullWidth startIcon={<LinkIcon fontSize="small" />}
                  onClick={() => window.open(url, '_blank', 'noopener,noreferrer,width=480,height=900')}
                  sx={{
                    textTransform: 'none', fontFamily: 'monospace', fontSize: '0.75rem',
                    justifyContent: 'flex-start', color: 'primary.main',
                    '& .MuiButton-startIcon': { mr: 1.25 },
                  }}>
                  {url}
                </Button>
              </Paper>
            )
          })
        )}
      </Box>
    </Box>
  )
}

export default PartnerSafetyExecuteTab
