import { useTranslation } from 'react-i18next'
import { Box, Typography, Paper, Alert } from '@mui/material'
import ConstructionIcon from '@mui/icons-material/Construction'

const TrainingApprovalTab: React.FC = () => {
  const { t } = useTranslation()

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        {t('training.approvalDesc')}
      </Alert>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <ConstructionIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography color="text.secondary">{t('common.comingSoon')}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {t('training.approvalProcess')}
        </Typography>
      </Paper>
    </Box>
  )
}

export default TrainingApprovalTab
