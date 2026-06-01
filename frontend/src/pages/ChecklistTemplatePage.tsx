import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import ChecklistTemplateTab from '../components/checklist/ChecklistTemplateTab'

const ChecklistTemplatePage: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        {t('nav.checklistTemplate')}
      </Typography>
      <ChecklistTemplateTab />
    </Box>
  )
}

export default ChecklistTemplatePage
