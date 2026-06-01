import { useNavigate } from 'react-router-dom'
import { Box, Typography, Button } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        textAlign: 'center',
        p: 3,
      }}
    >
      <Typography variant="h1" fontWeight="bold" color="primary" sx={{ fontSize: 120 }}>
        404
      </Typography>
      <Typography variant="h5" gutterBottom>
        Page Not Found
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        The page you are looking for does not exist or has been moved.
      </Typography>
      <Button variant="contained" startIcon={<HomeIcon />} onClick={() => navigate('/')}>
        Go to Dashboard
      </Button>
    </Box>
  )
}

export default NotFoundPage
