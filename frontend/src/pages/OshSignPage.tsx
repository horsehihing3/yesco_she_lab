import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from '@mui/material'
import SignaturePad from '../components/common/SignaturePad'
import { oshSignApi, OshSignInfo } from '../api/oshSignApi'
import { useAlert } from '../contexts/AlertContext'
import FlowChartButton from '../components/common/FlowChartButton'

type PageState = 'loading' | 'ready' | 'error' | 'done'

const OshSignPage: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const { showError } = useAlert()
  const [pageState, setPageState] = useState<PageState>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [info, setInfo] = useState<OshSignInfo | null>(null)
  const [signature, setSignature] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!token) { setErrorMsg('잘못된 링크입니다.'); setPageState('error'); return }
    oshSignApi.getInfo(token)
      .then(data => {
        setInfo(data)
        setPageState('ready')
      })
      .catch((err: any) => {
        const msg = err.response?.data?.message || '유효하지 않은 링크입니다.'
        setErrorMsg(msg)
        setPageState('error')
      })
  }, [token])

  const handleSubmit = async () => {
    if (!signature) { showError('서명을 먼저 해주세요.'); return }
    setSaving(true)
    try {
      await oshSignApi.submitSignature(token!, signature)
      setPageState('done')
    } catch (err: any) {
      const msg = err.response?.data?.message || '서명 저장에 실패했습니다.'
      showError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (pageState === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }

  if (pageState === 'error') {
    return (
      <Container maxWidth="sm" sx={{ pt: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>링크 오류</Typography>
          <Typography color="text.secondary">{errorMsg}</Typography>
        </Paper>
      </Container>
    )
  }

  if (pageState === 'done') {
    return (
      <Container maxWidth="sm" sx={{ pt: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="success.main" gutterBottom>서명 완료</Typography>
          <Typography color="text.secondary">서명이 성공적으로 저장됐습니다. 감사합니다.</Typography>
        </Paper>
      </Container>
    )
  }

  const title = info ? `${info.oshYear}년 ${info.oshQuarter}분기 산업안전보건위원회` : ''

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
          <Typography variant="h6" fontWeight="bold">산업안전보건위원회 서명</Typography>
          <FlowChartButton flowKey="oshSign" />
        </Box>

        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>회의</Typography>
          <Typography fontWeight={500}>{title}</Typography>
          {info?.mainAgenda && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }} gutterBottom>주요안건</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{info.mainAgenda}</Typography>
            </>
          )}
        </Box>

        <Typography variant="body1" sx={{ mb: 1 }}>
          <b>{info?.attendeeName}</b>님, 아래에 서명해 주세요.
        </Typography>

        {info?.alreadySigned && (
          <Typography variant="caption" color="warning.main" sx={{ display: 'block', mb: 1 }}>
            이미 서명이 저장되어 있습니다. 새로 서명하면 기존 서명이 교체됩니다.
          </Typography>
        )}

        <Box sx={{ mb: 2 }}>
          <SignaturePad value={signature} onChange={setSignature} height={120} />
        </Box>

        <Button
          variant="contained"
          fullWidth
          size="large"
          disabled={!signature || saving}
          onClick={handleSubmit}
        >
          {saving ? <CircularProgress size={24} color="inherit" /> : '서명 제출'}
        </Button>
      </Paper>
    </Container>
  )
}

export default OshSignPage
