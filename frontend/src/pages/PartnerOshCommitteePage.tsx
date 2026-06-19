import { Box } from '@mui/material'
import OshCommitteeTab from '../components/ehs/OshCommitteeTab'
import FlowChartButton from '../components/common/FlowChartButton'

const PartnerOshCommitteePage: React.FC = () => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <FlowChartButton flowKey="partnerOsh" />
      </Box>
      <OshCommitteeTab menuPath="협력 업체 관리 › SHE 협의체" />
    </Box>
  )
}

export default PartnerOshCommitteePage
