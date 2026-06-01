import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import EhsPlanTab from '../components/ehs/EhsPlanTab'

const EhsPlanPage: React.FC = () => {
  const { t } = useTranslation()

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t('nav.ehsPlan')}
      </Typography>
      <EhsPlanTab />
    </Box>
  )
}

export default EhsPlanPage
