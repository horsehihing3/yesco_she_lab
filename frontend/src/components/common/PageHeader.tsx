import { Box, Typography } from '@mui/material'
import FlowChartButton from './FlowChartButton'

/**
 * 페이지 상단 골격 표준 컴포넌트.
 *  - 상단 1줄: 좌측 title / 우측 [actions][흐름도]
 *  - tabs 는 제목줄 바로 아래 별행
 *  - children 은 탭 아래 콘텐츠
 * flowKey 가 없으면 흐름도 버튼 영역 자체를 그리지 않는다.
 * title 은 이미 번역된 문자열을 받는다(호출부에서 t() 처리).
 * fill=true 면 PageWithTitle 과 동일한 풀하이트 레이아웃(외곽 height:100% flex 컬럼 +
 * children 을 flex:1 minHeight:0 으로 채움)을 제공한다. 기본 false 는 기존 동작 유지.
 */
interface Props {
  title: string
  flowKey?: string
  actions?: React.ReactNode
  tabs?: React.ReactNode
  children: React.ReactNode
  fill?: boolean
}

const PageHeader: React.FC<Props> = ({ title, flowKey, actions, tabs, children, fill = false }) => {
  return (
    <Box sx={fill ? { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 } : undefined}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2, ...(fill && { flexShrink: 0 }) }}>
        <Typography variant="h6" fontWeight="bold">{title}</Typography>
        {(actions || flowKey) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {actions}
            {flowKey && <FlowChartButton flowKey={flowKey} />}
          </Box>
        )}
      </Box>
      {tabs && <Box sx={{ mb: 2, ...(fill && { flexShrink: 0 }) }}>{tabs}</Box>}
      {fill ? <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box> : children}
    </Box>
  )
}

export default PageHeader
