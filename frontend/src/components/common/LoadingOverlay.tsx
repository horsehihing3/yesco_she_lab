import { Backdrop, CircularProgress, Typography, Box } from '@mui/material'
import { useTranslation } from 'react-i18next'

interface LoadingOverlayProps {
  open: boolean
  message?: string
}

const LoadingOverlay = ({ open, message }: LoadingOverlayProps) => {
  const { t } = useTranslation()
  const text = message ?? t('common.loading', '로딩 중...')
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.modal - 1,
        flexDirection: 'column',
        gap: 2,
      }}
      open={open}
    >
      <CircularProgress color="inherit" size={48} />
      <Box
        sx={{
          bgcolor: 'rgba(0,0,0,0.7)',
          px: 3,
          py: 1.5,
          borderRadius: 2,
        }}
      >
        <Typography variant="body1" fontWeight="medium">
          {text}
        </Typography>
      </Box>
    </Backdrop>
  )
}

export default LoadingOverlay
