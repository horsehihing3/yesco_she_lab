import { Box } from '@mui/material'
import PartnerEvalTab from '../components/partner/PartnerEvalTab'
import FlowChartButton from '../components/common/FlowChartButton'

const PartnerMgmtPage: React.FC = () => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <FlowChartButton flowKey="contractorReg" />
      </Box>
      <PartnerEvalTab />
    </Box>
  )
}

export default PartnerMgmtPage
