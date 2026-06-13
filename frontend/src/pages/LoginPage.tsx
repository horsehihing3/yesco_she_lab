import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material'
import { useAuth } from '../context/AuthContext'
import { devToolsEnabled } from '../utils/devMode'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/', { replace: true })
    return null
  }

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    setIsLoading(true)

    try {
      await login(data)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please check your credentials.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box component="img" src="/assets/img_logo.png" alt="YESCO SHE" sx={{ display: 'block', mx: 'auto', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold">
              yesco SHE
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to your account
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              label="Username"
              margin="normal"
              {...register('username')}
              error={!!errors.username}
              helperText={errors.username?.message}
              autoFocus
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              margin="normal"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </form>

          {/* DEV ONLY — 테스트 계정 빠른 로그인 (VITE_DEV_TOOLS=off 또는 비-localhost 시 숨김) */}
          {devToolsEnabled() && window.location.hostname === 'localhost' && (
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 1, textAlign: 'center' }}>
              DEV 빠른 로그인
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, justifyContent: 'center' }}>
              {['jiwan.nam', 'yeseo.moon', 'jungho.yoo', 'horsehihing3', 'yujeong.jung', 'gs5655', 'yuhyun.ha', 'com4in', 'jihyun.nam'].map((id) => (
                <Button
                  key={id}
                  size="small"
                  variant="outlined"
                  color="inherit"
                  disabled={isLoading}
                  onClick={async () => {
                    setError(null)
                    setIsLoading(true)
                    try {
                      await login({ username: id, password: 'com4in!!' })
                      navigate('/', { replace: true })
                    } catch (err: unknown) {
                      setError(err instanceof Error ? err.message : 'Login failed.')
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                  sx={{ fontSize: '0.7rem', px: 1, py: 0.5, color: 'text.secondary', borderColor: 'divider' }}
                >
                  {id}
                </Button>
              ))}
            </Box>
          </Box>
          )}
          {/* /DEV ONLY */}
        </CardContent>
      </Card>
    </Box>
  )
}

export default LoginPage
