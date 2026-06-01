import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import EhsManagerTab from '../components/ehs/EhsManagerTab'

const EhsOfficerPage: React.FC = () => {
  const { t } = useTranslation()

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t('nav.ehsOfficer')}
      </Typography>
      <EhsManagerTab />
    </Box>
  )
}

export default EhsOfficerPage
