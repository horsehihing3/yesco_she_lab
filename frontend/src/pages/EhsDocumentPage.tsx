import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import SafetyRulesTab from '../components/ehs/SafetyRulesTab'

const EhsDocumentPage: React.FC = () => {
  const { t } = useTranslation()

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t('nav.ehsDocument')}
      </Typography>
      <SafetyRulesTab />
    </Box>
  )
}

export default EhsDocumentPage
