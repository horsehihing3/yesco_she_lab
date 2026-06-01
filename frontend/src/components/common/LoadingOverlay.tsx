import { Backdrop, CircularProgress, Typography, Box } from '@mui/material'

interface LoadingOverlayProps {
  open: boolean
  message?: string
}

const LoadingOverlay = ({ open, message = '처리 중...' }: LoadingOverlayProps) => {
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
          {message}
        </Typography>
      </Box>
    </Backdrop>
  )
}

export default LoadingOverlay
