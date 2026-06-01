import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import OshCommitteeTab from '../components/ehs/OshCommitteeTab'

const OshCommitteePage: React.FC = () => {
  const { t } = useTranslation()

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t('nav.ehsOshCommittee')}
      </Typography>
      <OshCommitteeTab />
    </Box>
  )
}

export default OshCommitteePage
