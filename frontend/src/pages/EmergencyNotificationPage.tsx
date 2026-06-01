import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import EmergencyNotificationTab from '../components/ehs/EmergencyNotificationTab'

const EmergencyNotificationPage: React.FC = () => {
  const { t } = useTranslation()

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t('nav.ehsEmergency')}
      </Typography>
      <EmergencyNotificationTab />
    </Box>
  )
}

export default EmergencyNotificationPage
