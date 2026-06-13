import { formatDate } from '../../utils/dateDefaults'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import { formatUserName } from '../../utils/userDisplay'

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
            {formatDate(selectedPlan.createdAt)}
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
            <FormCell>
              <Typography variant="body2">{selectedPlan.riskLevel || '-'}</Typography>
            </FormCell>
          </FormRow>
          <FormRow>
            <FormLabel>작성일</FormLabel>
            <FormCell borderRight>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {formatDate(selectedPlan.createdAt) || '-'}
              </Typography>
            </FormCell>
            <FormLabel>작성자</FormLabel>
            <FormCell>
              <Typography variant="body2">{formatUserName(selectedPlan.createdByTeam, selectedPlan.createdByName, selectedPlan.createdByPosition) || selectedPlan.modifiedBy || '-'}</Typography>
            </FormCell>
          </FormRow>
          <FormRow last>
            <FormLabel>계획 승인자</FormLabel>
            <FormCell>
              <Typography variant="body2">{formatUserName(selectedPlan.planApproverTeam, selectedPlan.planApproverName, selectedPlan.planApproverPosition) || '-'}</Typography>
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

        {/* 우하단 — 목록 (완료 처리는 실행 URL "확인" 클릭 시 자동 수행) */}
        <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={() => setSelectedPlan(null)}
            sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
            {t('common.list', '목록')}
          </Button>
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
                {/* 1행: 제목 + 상태칩 (클릭 → 상세) */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Typography onClick={() => setSelectedPlan(p)}
                    sx={{ fontWeight: 700, fontSize: '0.95rem', flex: 1, minWidth: 0, color: 'primary.main', cursor: 'pointer', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.title || '-'}
                  </Typography>
                  <Chip size="small"
                    label={STATUS_LABEL[p.status] ?? p.status}
                    color={STATUS_COLOR[p.status] ?? 'default'} />
                </Box>
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
