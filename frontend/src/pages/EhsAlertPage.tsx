import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import EhsAlertTab from '../components/ehs/EhsAlertTab'

const EhsAlertPage: React.FC = () => {
  const { t } = useTranslation()

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t('nav.ehsAlert')}
      </Typography>
      <EhsAlertTab />
    </Box>
  )
}

export default EhsAlertPage
