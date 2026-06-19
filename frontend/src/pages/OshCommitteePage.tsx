import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import OshCommitteeTab from '../components/ehs/OshCommitteeTab'
import FlowChartButton from '../components/common/FlowChartButton'

const OshCommitteePage: React.FC = () => {
  const { t } = useTranslation()

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2 }}>
        <Typography variant="h6">{t('nav.ehsOshCommittee')}</Typography>
        <FlowChartButton flowKey="oshCommittee" />
      </Box>
      <OshCommitteeTab />
    </Box>
  )
}

export default OshCommitteePage
