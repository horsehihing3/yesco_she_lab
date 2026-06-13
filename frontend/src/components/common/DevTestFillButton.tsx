import Button from '@mui/material/Button'
import ScienceIcon from '@mui/icons-material/Science'
import { isDevToolsVisible } from '../../utils/devMode'

// DEV ONLY — 납품 전 삭제
// 신규 등록 폼에서 비어있는 항목을 도메인 성격에 맞는 더미 데이터로 채우는 테스트 버튼.
// 노출 조건은 헤더 'DEV 계정 전환' 과 동일(utils/devMode.isDevToolsVisible).
interface DevTestFillButtonProps {
  /** 비어있는 폼 항목을 채우는 콜백 (이미 입력된 값은 덮어쓰지 않도록 각 폼에서 구현) */
  onFill: () => void
  disabled?: boolean
  label?: string
}

const DevTestFillButton: React.FC<DevTestFillButtonProps> = ({ onFill, disabled, label = '테스트 데이터' }) => {
  if (!isDevToolsVisible()) return null
  return (
    <Button
      type="button"
      variant="outlined"
      color="warning"
      size="small"
      onClick={onFill}
      disabled={disabled}
      startIcon={<ScienceIcon />}
      sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}
    >
      {label}
    </Button>
  )
}

export default DevTestFillButton
