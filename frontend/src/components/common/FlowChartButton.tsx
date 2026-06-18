import { useState } from 'react'
import { Button, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import CloseIcon from '@mui/icons-material/Close'
import { useTranslation } from 'react-i18next'
import WorkflowFlowChart from './WorkflowFlowChart'
import { FLOW_SPECS } from './flowSpecs'

/**
 * 「흐름도」 버튼 + 다이얼로그. 각 메뉴 첫 탭에 배치한다.
 * flowKey 로 flowSpecs 의 흐름 정의를 조회한다. 정의가 없으면 아무것도 렌더하지 않는다.
 */
interface Props {
  flowKey: string
  size?: 'small' | 'medium'
}

const FlowChartButton: React.FC<Props> = ({ flowKey, size = 'small' }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const spec = FLOW_SPECS[flowKey]
  if (!spec) return null

  return (
    <>
      <Button variant="outlined" size={size} startIcon={<AccountTreeIcon />} onClick={() => setOpen(true)}>
        {t('common.flowChart', '흐름도')}
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}>
          <AccountTreeIcon fontSize="small" />
          {spec.title}
          <IconButton onClick={() => setOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <WorkflowFlowChart steps={spec.steps} />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default FlowChartButton
