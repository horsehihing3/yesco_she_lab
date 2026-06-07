import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Button, TextField, Alert, CircularProgress,
} from '@mui/material'
import { siteSafetyPlanApi } from '../api/siteSafetyApi'
import { partnerSafetyExecutionApi } from '../api/partnerSafetyExecutionApi'
import SafetyChecklistTab, { SafetyChecklistTabRef } from '../components/ehs/SafetyChecklistTab'
import SignaturePad from '../components/common/SignaturePad'
import { useAlert } from '../contexts/AlertContext'

const randomId = () => Math.random().toString(36).slice(2, 10).toUpperCase()
const randomPhone = () => `010-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
const randomSystem = () => String(Math.floor(Math.random() * 3) + 1)

const STORAGE_KEY_PREFIX = 'partnerSafetySubmitted:'

const PartnerSafetyExecutePage: React.FC = () => {
  const { planId: planIdParam } = useParams<{ planId: string }>()
  const planId = planIdParam ? Number(planIdParam) : NaN
  const { t } = useTranslation()
  const { showError, showSuccess } = useAlert()
  const checklistRef = useRef<SafetyChecklistTabRef>(null)

  const [name, setName] = useState('')
  const [sign, setSign] = useState('')

  const { data: plan, isLoading } = useQuery({
    queryKey: ['partnerSafetyExecutePlan', planId],
    queryFn: () => siteSafetyPlanApi.getById(planId),
    enabled: !!planId && !isNaN(planId),
  })

  useEffect(() => {
    document.title = plan?.title ? `${plan.title} - 실행` : '협력 업체 안전 관리 실행'
  }, [plan?.title])

  const handleConfirm = async () => {
    if (!plan) return
    const linkedChecklistId = (plan as any).checklistTemplateId
    // 1) 체크리스트 모든 항목 체크 여부 — 연결된 체크리스트가 있을 때만 검사
    if (linkedChecklistId) {
      if (!checklistRef.current?.isAllChecked()) {
        showError(t('partnerSafety.allItemsRequired', '체크리스트의 모든 항목(적합/부적합/해당없음)을 체크해 주세요.'))
        return
      }
    }
    // 2) 성명
    if (!name.trim()) { showError(t('common.fieldRequired', '성명을 입력하세요.')); return }
    // 3) 서명
    if (!sign) { showError(t('partnerSafety.signRequired', '서명을 입력하세요.')); return }

    try {
      if (linkedChecklistId && checklistRef.current) {
        await checklistRef.current.save()
      }
      const externalId = randomId()
      const phone = randomPhone()
      const systemNo = randomSystem()
      const submittedAt = new Date().toISOString()

      // 1) 조회 탭이 보는 PartnerSafetyExecution 레코드 생성 + 완료 처리
      //    — 이것이 누락되어 있어 "조회 탭에 안 넘어가는" 버그가 발생했음
      const created = await partnerSafetyExecutionApi.create({
        planId: plan.id,
        name: name.trim(),
        companyCode: 'PARTNER',
        phone,
        systemCode: systemNo,
        systemUid: externalId,
        calledAt: submittedAt,
        checklistTemplateId: linkedChecklistId,
      })
      await partnerSafetyExecutionApi.complete(created.id, {
        signature: sign,
      })

      // 2) SiteSafetyPlan 상태도 DONE 으로 전환 (실행 탭에서 사라지도록)
      try {
        if (plan.status === 'APPROVED') {
          await siteSafetyPlanApi.transition(plan.id, 'completionSubmit')
        }
        if (plan.status !== 'DONE') {
          await siteSafetyPlanApi.transition(plan.id, 'complete')
        }
      } catch { /* 상태 전환 실패해도 실행 레코드는 생성됨 */ }

      // 3) 관리자 화면 동기화용 localStorage
      const params = new URLSearchParams({
        planId: String(plan.id),
        name: name.trim(),
        signature: sign.substring(0, 32) + '...',
        externalId, phone, systemNo, submittedAt,
      })
      const url = `${window.location.origin}/api/external/partner-safety/submit?${params.toString()}`
      try {
        localStorage.setItem(STORAGE_KEY_PREFIX + plan.id, JSON.stringify({
          url, name: name.trim(), sign, externalId, phone, systemNo, submittedAt,
        }))
      } catch { /* ignore quota */ }

      showSuccess(t('partnerSafety.submitSuccess', '제출이 완료되었습니다.'))
      // 새 창 자동 닫기 — 약간의 딜레이로 토스트 노출 후 닫음
      setTimeout(() => { try { window.close() } catch { /* ignore */ } }, 800)
    } catch (e: any) {
      // 디버그용 실패 사유 표시
      const msg = e?.response?.data?.message || e?.message || ''
      showError(`${t('common.error', '오류가 발생했습니다.')}${msg ? ' — ' + msg : ''}`)
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!plan) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{t('partnerSafety.planNotFound', '계획을 찾을 수 없습니다.')}</Alert>
      </Box>
    )
  }

  const checklistTemplateId = (plan as any).checklistTemplateId

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 2 }}>
      <Box sx={{
        width: '100%', px: 2,
        // 임베드된 체크리스트 표를 창 폭에 맞춤 — 가로 스크롤 제거 + 점검항목 자동 분배
        '& .MuiTableContainer-root': { overflowX: 'visible !important' },
        '& table': {
          minWidth: '0 !important', width: '100% !important', tableLayout: 'fixed',
        },
        '& .MuiTableCell-root': {
          padding: '4px 6px !important',
          wordBreak: 'break-word',
          whiteSpace: 'normal',
          fontSize: '0.75rem',
        },
        // 점검 항목 컬럼 (simpleMode: No / 점검항목 / 적합 / 부적합 → 2번째) — 한글 단어 단위 줄바꿈
        '& tbody tr > td:nth-of-type(2)': { wordBreak: 'keep-all !important' },
      }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, textAlign: 'center' }}>
          {plan.title}
        </Typography>

        {checklistTemplateId ? (
          <SafetyChecklistTab
            ref={checklistRef}
            templateId={checklistTemplateId}
            embedded
            showSummary
            hideSignatures
            hideTemplateInfo
            freshFill
          />
        ) : (
          <Alert severity="info">{t('partnerSafety.noChecklist', '연결된 체크리스트가 없습니다.')}</Alert>
        )}

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{t('common.name', '성명')}</Typography>
          <TextField fullWidth size="small" value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" />
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{t('common.signature', '서명')}</Typography>
          <SignaturePad value={sign} onChange={setSign} />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button variant="contained" color="primary" onClick={handleConfirm} sx={{ minWidth: 100 }}>
            {t('common.confirm', '확인')}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default PartnerSafetyExecutePage
