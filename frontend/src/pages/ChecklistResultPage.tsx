import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import ChecklistResultTab from '../components/checklist/ChecklistResultTab'

const ChecklistResultPage: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        {t('nav.checklistResult')}
      </Typography>
      <ChecklistResultTab />
    </Box>
  )
}

export default ChecklistResultPage
