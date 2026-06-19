import { Box } from '@mui/material'
import { PermitApplicationContent } from './PermitToWorkPage'
import FlowChartButton from '../components/common/FlowChartButton'

const PartnerPermitPage: React.FC = () => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <FlowChartButton flowKey="partnerPermit" />
      </Box>
      <PermitApplicationContent mode="external" />
    </Box>
  )
}

export default PartnerPermitPage
