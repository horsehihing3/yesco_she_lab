import { Backdrop, CircularProgress, Typography, Box } from '@mui/material'
import { useLanguage } from '../../context/LanguageContext'
import { useTranslation } from 'react-i18next'

const GlobalLoadingOverlay: React.FC = () => {
  const { isChangingLanguage } = useLanguage()
  const { t } = useTranslation()

  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      }}
      open={isChangingLanguage}
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={2}
      >
        <CircularProgress color="inherit" size={48} />
        <Typography variant="body1" color="inherit">
          {t('common.loading')}
        </Typography>
      </Box>
    </Backdrop>
  )
}

export default GlobalLoadingOverlay
