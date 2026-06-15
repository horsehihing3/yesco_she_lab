import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import RefreshIcon from '@mui/icons-material/Refresh'
import { GoogleGenerativeAI } from '@google/generative-ai'
import ReactMarkdown from 'react-markdown'
import { useTranslation } from 'react-i18next'
import { HealthCheckup } from '../../types/healthCheckup.types'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''

interface AiReportModalProps {
  open: boolean
  onClose: () => void
  checkup: HealthCheckup | null
}

const AiReportModal: React.FC<AiReportModalProps> = ({ open, onClose, checkup }) => {
  const { t, i18n } = useTranslation()
  const [report, setReport] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const getLanguageInstruction = (): string => {
    switch (i18n.language) {
      case 'en': return 'Please write the report in English.'
      case 'zh': return '请用中文撰写报告。'
      default: return '한국어로 작성해 주세요.'
    }
  }

  const buildPrompt = useCallback((): string => {
    if (!checkup) return ''

    const details = checkup.details || []
    const detailLines = details.map((d) =>
      `- ${t(`healthCheckup.bodyParts.${d.bodyPart}`)}: ${d.category} | ${t(`healthCheckup.resultStatusLabels.${d.resultStatus}`)} | 결과: ${d.resultValue || ''} | 참고치: ${d.referenceRange || ''}${d.notes ? ` | 비고: ${d.notes}` : ''}`
    ).join('\n')

    return `당신은 산업보건 전문의입니다. 아래 건강검진 결과를 분석하여 종합 건강 리포트를 작성해주세요.

${getLanguageInstruction()}

## 검진 대상자 정보
- 사원명: ${checkup.employeeName}
- 부서: ${checkup.employeeDept || ''}
- 검진년도: ${checkup.checkupYear}
- 검진유형: ${checkup.checkupType || ''}
- 검진일: ${checkup.checkupDate || ''}
- 검진기관: ${checkup.hospital || ''}
- 종합판정: ${checkup.overallResult || ''}

## 부위별 검진 결과
${detailLines || '(상세 결과 없음)'}

## 작성 요구사항
- 검진 대상자 정보(사원명, 부서 등)는 별도로 표시되므로 리포트 본문에 포함하지 마세요. 제목도 작성하지 마세요.
- 바로 본문 내용부터 시작하세요.
- 각 항목(## 제목) 사이에 반드시 --- (수평선)을 넣어 구분해 주세요.
1. **종합 소견**: 전반적인 건강 상태를 요약
2. **주의 항목 분석**: 주의 또는 이상 판정 항목에 대한 상세 분석
3. **생활 습관 권고**: 검진 결과에 기반한 식이, 운동, 생활 습관 개선 방안
4. **추적 관찰 권고**: 재검사나 추가 검사가 필요한 항목
5. **산업보건 관점**: 직무 관련 건강 위험 요소 및 주의사항

리포트는 전문적이면서도 이해하기 쉽게 작성하고, 마크다운 형식으로 작성해 주세요.`
  }, [checkup, t, i18n.language])

  const generateReport = useCallback(async () => {
    if (!checkup || !GEMINI_API_KEY) {
      setError(t('healthCheckup.aiReport.apiKeyMissing'))
      return
    }

    setLoading(true)
    setError('')
    setReport('')

    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
      const result = await model.generateContent(buildPrompt())
      const response = await result.response
      setReport(response.text())
    } catch (err: any) {
      console.error('Gemini API error:', err)
      if (err?.message?.includes('429') || err?.status === 429) {
        setError(t('healthCheckup.aiReport.rateLimitExceeded'))
      } else {
        setError(t('healthCheckup.aiReport.generateFailed'))
      }
    } finally {
      setLoading(false)
    }
  }, [checkup, buildPrompt, t])

  const handleOpen = useCallback(() => {
    if (!report && !loading) {
      generateReport()
    }
  }, [report, loading, generateReport])

  const handleClose = () => {
    onClose()
  }

  const handleCopy = async () => {
    if (report) {
      await navigator.clipboard.writeText(report)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      TransitionProps={{ onEntered: handleOpen }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {t('healthCheckup.aiReport.title')}
        <IconButton onClick={handleClose} sx={{ ml: 'auto' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* 검진 대상자 정보 폼테이블 */}
        {checkup && (
          <>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              {checkup.employeeName} {t('healthCheckup.aiReport.title')} ({checkup.checkupYear})
            </Typography>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 3 }}>
              {[
                [t('healthCheckup.employeeName'), checkup.employeeName || '', t('healthCheckup.employeeDept'), checkup.employeeDept || ''],
                [t('healthCheckup.checkupYear'), String(checkup.checkupYear || ''), t('healthCheckup.checkupType'), checkup.checkupType || ''],
                [t('healthCheckup.checkupDate'), checkup.checkupDate || '', t('healthCheckup.overallResult'), checkup.overallResult || ''],
                [t('healthCheckup.hospital'), checkup.hospital || '', '', ''],
              ].map((row, idx, arr) => (
                <Box key={idx} sx={{ display: 'flex', borderBottom: idx < arr.length - 1 ? 1 : 0, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
                  <Typography sx={{ width: '15%', minWidth: 90, bgcolor: 'grey.100', fontWeight: 'bold', px: 1.5, py: 1, fontSize: '0.875rem', borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', alignItems: 'center' }}>
                    {row[0]}
                  </Typography>
                  <Typography sx={{ flex: row[2] ? undefined : 1, width: row[2] ? '35%' : undefined, px: 1.5, py: 1, fontSize: '0.875rem', borderRight: row[2] ? 1 : 0, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', alignItems: 'center' }}>
                    {row[1]}
                  </Typography>
                  {row[2] && (
                    <>
                      <Typography sx={{ width: '15%', minWidth: 90, bgcolor: 'grey.100', fontWeight: 'bold', px: 1.5, py: 1, fontSize: '0.875rem', borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', alignItems: 'center' }}>
                        {row[2]}
                      </Typography>
                      <Typography sx={{ width: '35%', px: 1.5, py: 1, fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>
                        {row[3]}
                      </Typography>
                    </>
                  )}
                </Box>
              ))}
            </Box>
          </>
        )}

        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
            <CircularProgress size={48} />
            <Typography color="text.secondary">{t('healthCheckup.aiReport.generating')}</Typography>
          </Box>
        )}

        {error && !loading && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={generateReport}>
              {t('healthCheckup.aiReport.retry')}
            </Button>
          </Box>
        )}

        {report && !loading && (
          <Box sx={{
            '& h1': { fontSize: '1.4rem', fontWeight: 700, mt: 2, mb: 1 },
            '& h2': { fontSize: '1.2rem', fontWeight: 700, mt: 2.5, mb: 1 },
            '& hr': { border: 'none', borderTop: 1, borderColor: 'divider', my: 2 },
            '& h3': { fontSize: '1.05rem', fontWeight: 600, mt: 2, mb: 0.5 },
            '& p': { mb: 1, lineHeight: 1.7 },
            '& ul, & ol': { pl: 3, mb: 1 },
            '& li': { mb: 0.5, lineHeight: 1.6 },
            '& strong': { color: 'primary.main' },
          }}>
            <ReactMarkdown>{report}</ReactMarkdown>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        {report && (
          <Button startIcon={<ContentCopyIcon />} onClick={handleCopy} sx={{ mr: 'auto' }}>
            {t('healthCheckup.aiReport.copy')}
          </Button>
        )}
        {report && (
          <Button startIcon={<RefreshIcon />} onClick={generateReport} disabled={loading}>
            {t('healthCheckup.aiReport.regenerate')}
          </Button>
        )}
        <Button variant="outlined" onClick={handleClose}>
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AiReportModal
