import { useEffect, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography, Box,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

interface RejectReasonDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  /** 다이얼로그 제목. 기본: "반려 사유 입력" */
  title?: string
  /** "계획 결재 반려" / "완료 결재 반려" 같은 부제 */
  stage?: string
  loading?: boolean
}

const RejectReasonDialog: React.FC<RejectReasonDialogProps> = ({
  open, onClose, onConfirm, title, stage, loading = false,
}) => {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (open) {
      setReason('')
      setTouched(false)
    }
  }, [open])

  const trimmed = reason.trim()
  const error = touched && !trimmed
  const canSubmit = !!trimmed && !loading

  const handleConfirm = () => {
    setTouched(true)
    if (!trimmed) return
    onConfirm(trimmed)
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        {title || t('common.rejectReasonTitle', '반려 사유 입력')}
        {stage && (
          <Typography component="span" variant="body2" color="error.main" fontWeight={600} sx={{ ml: 1 }}>
            ({stage})
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {t('common.rejectReasonHint', '반려 사유를 입력하세요. 결재 상신자에게 전달됩니다.')}
            <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={4}
            maxRows={10}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={t('common.rejectReasonPlaceholder', '예: 일정이 부적절합니다. 다음 분기로 조정 후 재상신해주세요.')}
            error={error}
            helperText={error ? t('common.rejectReasonRequired', '반려 사유는 필수 입력입니다.') : `${reason.length} / 1000`}
            inputProps={{ maxLength: 1000 }}
            disabled={loading}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onClose} disabled={loading}>{t('common.cancel', '취소')}</Button>
        <Button variant="contained" color="warning" onClick={handleConfirm} disabled={!canSubmit}>
          {loading ? t('common.processing', '처리 중...') : t('common.rejectConfirm', '반려 처리')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RejectReasonDialog
