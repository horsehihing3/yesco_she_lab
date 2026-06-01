import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import EhsMessageTab from '../components/ehs/EhsMessageTab'

const EhsMessagePage: React.FC = () => {
  const { t } = useTranslation()

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t('nav.ehsMessage')}
      </Typography>
      <EhsMessageTab />
    </Box>
  )
}

export default EhsMessagePage
