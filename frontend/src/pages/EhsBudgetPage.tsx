import { Box } from '@mui/material'
import EhsBudgetTab from '../components/ehs/EhsBudgetTab'
import FlowChartButton from '../components/common/FlowChartButton'

const EhsBudgetPage: React.FC = () => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <FlowChartButton flowKey="ehsBudget" />
      </Box>
      <EhsBudgetTab />
    </Box>
  )
}

export default EhsBudgetPage
